/**
 * Voice Interview Hook
 * Connects to XAI realtime API and manages the interview flow
 * 
 * FLOW:
 * 1. User speaks → Server VAD detects end → committed
 * 2. Server transcribes → conversation.item.added (user transcript)
 * 3. We inject code as user message
 * 4. We call response.create → AI responds
 */

import { useCallback, useRef, useState } from "react";
import { useAudioStream } from "./useAudioStream";
import { useTranscript } from "./useTranscript";
import { buildSystemPrompt, buildCodeContextMessage } from "../utils/prompt";
import type { InterviewInput } from "../types";
import type { Message } from "../types/messages";

const XAI_REALTIME_URL = "wss://api.x.ai/v1/realtime";
const XAI_API_KEY = import.meta.env.VITE_XAI_API_KEY || "";
const VOICE = "ash";

export function useVoiceInterview(
  interviewInput: InterviewInput,
  codeRef: React.MutableRefObject<string>
) {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const isSessionConfigured = useRef(false);
  const assistantBuffer = useRef("");

  const { isCapturing, startCapture, stopCapture, stopPlayback, playAudio, audioLevel } =
    useAudioStream();

  const {
    transcript,
    addUserMessage,
    updateAssistantMessage,
    addCodeSent,
    clear: clearTranscript,
  } = useTranscript();

  // === HELPERS ===

  const send = useCallback((data: object) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
  }, []);

  // Configure session with system prompt and VAD
  const configureSession = useCallback(
    (sampleRate: number) => {
      console.log("[Interview] Configuring session...");
      send({
        type: "session.update",
        session: {
          instructions: buildSystemPrompt(interviewInput),
          voice: VOICE,
          audio: {
            input: { format: { type: "audio/pcm", rate: sampleRate } },
            output: { format: { type: "audio/pcm", rate: sampleRate } },
          },
          turn_detection: { type: "server_vad" },
        },
      });
    },
    [interviewInput, send]
  );

  // Send initial greeting to start interview
  const sendGreeting = useCallback(() => {
    console.log("[Interview] Sending greeting...");
    send({ type: "input_audio_buffer.commit" });
    send({
      type: "conversation.item.create",
      item: {
        type: "message",
        role: "user",
        content: [{ type: "input_text", text: "Please introduce yourself briefly and present the coding problem." }],
      },
    });
    send({ type: "response.create" });
  }, [send]);

  // Inject code and trigger AI response
  const injectCodeAndRespond = useCallback(() => {
    const code = codeRef.current;
    const codeText = `[Here is my current code]\n${buildCodeContextMessage(code)}`;

    console.log("[Interview] Injecting code and requesting response...");
    console.log("[Interview] Code:", code.substring(0, 100) + "...");

    // Add to UI transcript
    addCodeSent(code);

    // Send code to API
    send({
      type: "conversation.item.create",
      item: {
        type: "message",
        role: "user",
        content: [{ type: "input_text", text: codeText }],
      },
    });

    // NOW trigger AI response
    send({ type: "response.create" });
  }, [codeRef, send, addCodeSent]);

  // === MESSAGE HANDLER ===

  const handleMessage = useCallback(
    (message: Message, sampleRate: number) => {
      const { type } = message;

      // Session setup
      if (type === "conversation.created" && !isSessionConfigured.current) {
        configureSession(sampleRate);
      }
      if (type === "session.updated" && !isSessionConfigured.current) {
        isSessionConfigured.current = true;
        sendGreeting();
      }

      // AI audio → play it
      if (type === "response.output_audio.delta" && "delta" in message) {
        playAudio(message.delta as string);
      }

      // AI transcript (streaming)
      if (type === "response.output_audio_transcript.delta" && "delta" in message) {
        assistantBuffer.current += message.delta as string;
        updateAssistantMessage(assistantBuffer.current);
      }

      // AI done speaking
      if (type === "response.done") {
        assistantBuffer.current = "";
      }

      // User started speaking → stop AI playback
      if (type === "input_audio_buffer.speech_started") {
        stopPlayback();
      }

      // User transcript received → THIS IS THE KEY MOMENT
      // Now we have the full user message, so we inject code and trigger response
      if (type === "conversation.item.added" && "item" in message) {
        const item = message.item as { role?: string; content?: Array<{ type: string; transcript?: string; text?: string }> };
        
        // Debug: log what we received
        console.log("[Interview] conversation.item.added:", JSON.stringify(item, null, 2));
        
        if (item?.role === "user" && item?.content) {
          for (const content of item.content) {
            // Only process AUDIO transcripts, not our injected text messages
            if (content.type !== "input_audio") {
              console.log("[Interview] Skipping non-audio content:", content.type);
              continue;
            }
            if (!content.transcript) {
              console.log("[Interview] Skipping: no transcript");
              continue;
            }
            if (content.transcript.includes("[Here is my current code]")) {
              console.log("[Interview] Skipping: contains code marker");
              continue;
            }
            
            console.log("[Interview] User said:", content.transcript);
            
            // Add user message to transcript
            addUserMessage(content.transcript);
            
            // NOW inject code and ask AI to respond
            injectCodeAndRespond();
            break;
          }
        }
      }

      // Errors
      if (type === "error") {
        const err = (message as { error?: { message?: string } }).error;
        console.error("[Interview] Error:", err?.message);
        setError(err?.message || "An error occurred");
      }
    },
    [configureSession, sendGreeting, playAudio, stopPlayback, updateAssistantMessage, addUserMessage, injectCodeAndRespond]
  );

  // === START / STOP ===

  const startInterview = useCallback(async () => {
    if (!XAI_API_KEY) {
      setError("XAI_API_KEY not configured. Add VITE_XAI_API_KEY to your .env file.");
      return;
    }

    try {
      setError(null);
      clearTranscript();
      isSessionConfigured.current = false;
      assistantBuffer.current = "";

      console.log("[Interview] Starting...");

      const sampleRate = await startCapture((audio) => {
        if (isSessionConfigured.current) {
          send({ type: "input_audio_buffer.append", audio });
        }
      });

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
          const msg: Message = JSON.parse(event.data);
          if (!["input_audio_buffer.append", "response.output_audio.delta", "ping"].includes(msg.type)) {
            console.log("[Interview]", msg.type);
          }
          handleMessage(msg, sampleRate);
        } catch (e) {
          console.error("[Interview] Parse error:", e);
        }
      };

      ws.onerror = () => setError("Connection error");
      ws.onclose = (e) => {
        console.log("[Interview] Closed:", e.code);
        setIsConnected(false);
        if (e.code !== 1000) setError(`Closed: ${e.reason || e.code}`);
      };

      wsRef.current = ws;
    } catch (e) {
      console.error("[Interview] Failed:", e);
      setError(e instanceof Error ? e.message : "Failed to start");
    }
  }, [startCapture, send, handleMessage, clearTranscript]);

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
