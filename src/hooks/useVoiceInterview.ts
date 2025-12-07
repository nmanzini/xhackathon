/**
 * Main voice interview orchestration hook
 * Connects to XAI realtime API and manages the interview flow
 * 
 * SIMPLIFIED VERSION:
 * - No "..." placeholders - just show actual text when available
 * - Only inject code once per user turn (not on every pause)
 * - Simple append-only transcript
 */

import { useCallback, useRef, useState } from "react";
import { useAudioStream } from "./useAudioStream";
import { buildSystemPrompt, buildCodeContextMessage } from "../utils/prompt";
import type { InterviewInput } from "../types";
import type { Message, TranscriptEntry } from "../types/messages";

// XAI API configuration
const XAI_REALTIME_URL = "wss://api.x.ai/v1/realtime";
const XAI_API_KEY = import.meta.env.VITE_XAI_API_KEY || "";
const VOICE = "ash"; // Available: ash, ballad, coral, sage, verse

interface UseVoiceInterviewReturn {
  isConnected: boolean;
  isCapturing: boolean;
  audioLevel: number;
  transcript: TranscriptEntry[];
  error: string | null;
  startInterview: () => Promise<void>;
  stopInterview: () => void;
}

export function useVoiceInterview(
  interviewInput: InterviewInput,
  codeRef: React.MutableRefObject<string>
): UseVoiceInterviewReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [error, setError] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const isSessionConfigured = useRef(false);
  
  // Track if we've injected code since last assistant response
  const hasInjectedCodeThisTurn = useRef(false);
  
  // Track current assistant response being streamed
  const assistantBuffer = useRef("");

  const { isCapturing, startCapture, stopCapture, stopPlayback, playAudio, audioLevel } =
    useAudioStream();

  // Send a message through the WebSocket
  const sendMessage = useCallback((message: Message) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      if (message.type === "input_audio_buffer.append" && !isSessionConfigured.current) {
        return;
      }
      wsRef.current.send(JSON.stringify(message));
    }
  }, []);

  // Configure the session after connection
  const configureSession = useCallback(
    (ws: WebSocket, sampleRate: number) => {
      const systemPrompt = buildSystemPrompt(interviewInput);
      console.log("[Interview] Configuring session...");

      const sessionConfig = {
        type: "session.update",
        session: {
          instructions: systemPrompt,
          voice: VOICE,
          audio: {
            input: { format: { type: "audio/pcm", rate: sampleRate } },
            output: { format: { type: "audio/pcm", rate: sampleRate } },
          },
          turn_detection: { type: "server_vad" },
        },
      };

      ws.send(JSON.stringify(sessionConfig));
    },
    [interviewInput]
  );

  // Send initial greeting
  const sendInitialGreeting = useCallback((ws: WebSocket) => {
    console.log("[Interview] Sending initial greeting...");
    ws.send(JSON.stringify({ type: "input_audio_buffer.commit" }));

    const greetingMessage = {
      type: "conversation.item.create",
      item: {
        type: "message",
        role: "user",
        content: [{
          type: "input_text",
          text: "Please introduce yourself briefly and present the coding problem to the candidate.",
        }],
      },
    };
    ws.send(JSON.stringify(greetingMessage));
    ws.send(JSON.stringify({ type: "response.create" }));
  }, []);

  // Inject code context (only once per turn)
  const injectCodeContext = useCallback(
    (ws: WebSocket) => {
      if (hasInjectedCodeThisTurn.current) {
        console.log("[Interview] Code already injected this turn, skipping...");
        return;
      }
      
      hasInjectedCodeThisTurn.current = true;
      const currentCode = codeRef.current;
      const codeText = `[Here is my current code]\n${buildCodeContextMessage(currentCode)}`;
      
      // LOG THE FULL CODE being sent
      console.log("[Interview] === CODE BEING SENT TO AI ===");
      console.log(codeText);
      console.log("[Interview] === END CODE ===");
      
      // Add to transcript
      setTranscript((prev) => [
        ...prev,
        { timestamp: new Date().toISOString(), role: "code", content: currentCode },
      ]);
      
      // Send to API
      const codeMessage = {
        type: "conversation.item.create",
        item: {
          type: "message",
          role: "user",
          content: [{
            type: "input_text",
            text: codeText,
          }],
        },
      };
      ws.send(JSON.stringify(codeMessage));
    },
    [codeRef]
  );

  // Handle incoming WebSocket messages
  const handleMessage = useCallback(
    (message: Message, ws: WebSocket, sampleRate: number) => {
      
      // === Session setup ===
      if (message.type === "conversation.created" && !isSessionConfigured.current) {
        configureSession(ws, sampleRate);
      }

      if (message.type === "session.updated" && !isSessionConfigured.current) {
        isSessionConfigured.current = true;
        sendInitialGreeting(ws);
      }

      // === Audio playback ===
      if (message.type === "response.output_audio.delta" && "delta" in message) {
        playAudio(message.delta as string);
      }

      // === Assistant transcript (streaming) ===
      if (message.type === "response.output_audio_transcript.delta" && "delta" in message) {
        const delta = message.delta as string;
        assistantBuffer.current += delta;
        
        // Update or create assistant entry
        setTranscript((prev) => {
          const lastIdx = prev.length - 1;
          if (lastIdx >= 0 && prev[lastIdx].role === "assistant") {
            // Update existing
            const updated = [...prev];
            updated[lastIdx] = { ...updated[lastIdx], content: assistantBuffer.current };
            return updated;
          }
          // Create new
          return [...prev, { timestamp: new Date().toISOString(), role: "assistant", content: assistantBuffer.current }];
        });
      }

      // === Assistant done - reset for next turn ===
      if (message.type === "response.done") {
        assistantBuffer.current = "";
        hasInjectedCodeThisTurn.current = false; // Reset for next user turn
      }

      // === User started speaking ===
      if (message.type === "input_audio_buffer.speech_started") {
        stopPlayback();
      }

      // === User finished speaking - inject code ===
      if (message.type === "input_audio_buffer.committed") {
        console.log("[Interview] User finished speaking...");
        injectCodeContext(ws);
      }

      // === User transcript (final) ===
      if (message.type === "conversation.item.added" && "item" in message) {
        const item = message.item as { role?: string; content?: Array<{ type: string; transcript?: string }> };
        if (item?.role === "user" && item?.content) {
          for (const content of item.content) {
            if (content.type === "input_audio" && content.transcript) {
              const userText = content.transcript; // Extract to avoid closure issues
              setTranscript((prev) => [
                ...prev,
                { timestamp: new Date().toISOString(), role: "user", content: userText },
              ]);
              break;
            }
          }
        }
      }

      // === Errors ===
      if (message.type === "error") {
        const errorMsg = message.error as { message?: string } | undefined;
        console.error("[Interview] Error:", errorMsg?.message);
        setError(errorMsg?.message || "An error occurred");
      }
    },
    [configureSession, sendInitialGreeting, playAudio, stopPlayback, injectCodeContext]
  );

  // Start interview
  const startInterview = useCallback(async () => {
    if (!XAI_API_KEY) {
      setError("XAI_API_KEY not configured. Add VITE_XAI_API_KEY to your .env file.");
      return;
    }

    try {
      setError(null);
      setTranscript([]);
      isSessionConfigured.current = false;
      hasInjectedCodeThisTurn.current = false;
      assistantBuffer.current = "";

      console.log("[Interview] Starting...");

      const sampleRate = await startCapture((base64Audio) => {
        sendMessage({ type: "input_audio_buffer.append", audio: base64Audio });
      });

      console.log(`[Interview] Sample rate: ${sampleRate}Hz`);

      const ws = new WebSocket(XAI_REALTIME_URL, [
        "realtime",
        `openai-insecure-api-key.${XAI_API_KEY}`,
        "openai-beta.realtime-v1",
      ]);

      ws.onopen = () => {
        console.log("[Interview] Connected");
        setIsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const message: Message = JSON.parse(event.data);
          if (!["input_audio_buffer.append", "response.output_audio.delta", "ping"].includes(message.type)) {
            console.log("[Interview]", message.type);
          }
          handleMessage(message, ws, sampleRate);
        } catch (err) {
          console.error("[Interview] Parse error:", err);
        }
      };

      ws.onerror = () => setError("Connection error. Check your API key.");
      
      ws.onclose = (event) => {
        console.log(`[Interview] Closed: ${event.code}`);
        setIsConnected(false);
        isSessionConfigured.current = false;
        if (event.code !== 1000) {
          setError(`Connection closed: ${event.reason || event.code}`);
        }
      };

      wsRef.current = ws;
    } catch (err) {
      console.error("[Interview] Failed:", err);
      setError(err instanceof Error ? err.message : "Failed to start");
    }
  }, [startCapture, sendMessage, handleMessage]);

  // Stop interview
  const stopInterview = useCallback(() => {
    console.log("[Interview] Stopping...");
    stopCapture();
    stopPlayback();
    wsRef.current?.close(1000, "User stopped");
    wsRef.current = null;
    setIsConnected(false);
    isSessionConfigured.current = false;
  }, [stopCapture, stopPlayback]);

  return {
    isConnected,
    isCapturing,
    audioLevel,
    transcript,
    error,
    startInterview,
    stopInterview,
  };
}
