/**
 * Main voice interview orchestration hook
 * Connects to XAI realtime API and manages the interview flow
 */

import { useCallback, useRef, useState } from "react";
import { useAudioStream } from "./useAudioStream";
import { buildSystemPrompt } from "../utils/prompt";
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
  const currentTranscriptRef = useRef<{ role: "user" | "assistant"; content: string } | null>(null);

  const { isCapturing, startCapture, stopCapture, stopPlayback, playAudio, audioLevel } =
    useAudioStream();

  // Send a message through the WebSocket
  const sendMessage = useCallback((message: Message) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      // Drop audio messages until session is configured
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
      console.log("[Interview] System prompt:", systemPrompt.substring(0, 100) + "...");

      const sessionConfig = {
        type: "session.update",
        session: {
          instructions: systemPrompt,
          voice: VOICE,
          audio: {
            input: {
              format: {
                type: "audio/pcm",
                rate: sampleRate,
              },
            },
            output: {
              format: {
                type: "audio/pcm",
                rate: sampleRate,
              },
            },
          },
          turn_detection: {
            type: "server_vad",
          },
        },
      };

      ws.send(JSON.stringify(sessionConfig));
    },
    [interviewInput]
  );

  // Send initial greeting to start the interview
  const sendInitialGreeting = useCallback((ws: WebSocket) => {
    console.log("[Interview] Sending initial greeting...");

    // Commit any pending audio buffer
    ws.send(JSON.stringify({ type: "input_audio_buffer.commit" }));

    // Create greeting message to prompt the AI to introduce itself
    const greetingMessage = {
      type: "conversation.item.create",
      item: {
        type: "message",
        role: "user",
        content: [
          {
            type: "input_text",
            text: "Please introduce yourself briefly and present the coding problem to the candidate.",
          },
        ],
      },
    };
    ws.send(JSON.stringify(greetingMessage));

    // Request response
    ws.send(JSON.stringify({ type: "response.create" }));
    console.log("[Interview] Ready for voice interaction");
  }, []);

  // Handle incoming WebSocket messages
  const handleMessage = useCallback(
    (message: Message, ws: WebSocket, sampleRate: number) => {
      // Handle conversation created - configure session
      if (message.type === "conversation.created" && !isSessionConfigured.current) {
        console.log("[Interview] Conversation created");
        configureSession(ws, sampleRate);
      }

      // Handle session updated - send initial greeting
      if (message.type === "session.updated" && !isSessionConfigured.current) {
        isSessionConfigured.current = true;
        sendInitialGreeting(ws);
      }

      // Handle bot audio
      if (message.type === "response.output_audio.delta" && "delta" in message) {
        playAudio(message.delta as string);
      }

      // Handle bot transcript
      if (message.type === "response.output_audio_transcript.delta" && "delta" in message) {
        const delta = message.delta as string;

        if (currentTranscriptRef.current?.role === "assistant") {
          currentTranscriptRef.current.content += delta;
          setTranscript((prev) => {
            const newTranscript = [...prev];
            if (newTranscript.length > 0) {
              newTranscript[newTranscript.length - 1].content = currentTranscriptRef.current!.content;
            }
            return newTranscript;
          });
        } else {
          currentTranscriptRef.current = { role: "assistant", content: delta };
          setTranscript((prev) => [
            ...prev,
            { timestamp: new Date().toISOString(), role: "assistant", content: delta },
          ]);
        }
      }

      // Handle response done
      if (message.type === "response.done") {
        currentTranscriptRef.current = null;
      }

      // Handle user speech started (interruption)
      if (message.type === "input_audio_buffer.speech_started") {
        stopPlayback();
        currentTranscriptRef.current = { role: "user", content: "" };
        setTranscript((prev) => {
          if (prev.length > 0 && prev[prev.length - 1].role === "user") {
            return prev;
          }
          return [...prev, { timestamp: new Date().toISOString(), role: "user", content: "..." }];
        });
      }

      // Handle user speech committed - let server VAD auto-respond
      // NOTE: With server VAD, the API automatically generates a response
      // after user stops speaking. We don't need to call response.create here.
      if (message.type === "input_audio_buffer.committed") {
        console.log("[Interview] User finished speaking, waiting for auto-response...");
        currentTranscriptRef.current = null;
      }

      // Handle user transcript from conversation item
      if (message.type === "conversation.item.added" && "item" in message) {
        const item = message.item as { role?: string; content?: Array<{ type: string; transcript?: string }> };
        if (item?.role === "user" && item?.content) {
          for (const content of item.content) {
            if (content.type === "input_audio" && content.transcript) {
              setTranscript((prev) => {
                if (prev.length > 0 && prev[prev.length - 1].role === "user") {
                  const newTranscript = [...prev];
                  const lastEntry = newTranscript[newTranscript.length - 1];
                  const existingContent = lastEntry.content === "..." ? "" : lastEntry.content + " ";
                  newTranscript[newTranscript.length - 1] = {
                    ...lastEntry,
                    content: existingContent + content.transcript,
                  };
                  return newTranscript;
                }
                return [
                  ...prev,
                  { timestamp: new Date().toISOString(), role: "user", content: content.transcript },
                ];
              });
              break;
            }
          }
        }
      }

      // Handle errors
      if (message.type === "error") {
        const errorMsg = message.error as { message?: string } | undefined;
        console.error("[Interview] Error:", errorMsg?.message || "Unknown error");
        setError(errorMsg?.message || "An error occurred");
      }
    },
    [configureSession, sendInitialGreeting, playAudio, stopPlayback]
  );

  // Start the interview
  const startInterview = useCallback(async () => {
    if (!XAI_API_KEY) {
      setError("XAI_API_KEY not configured. Add VITE_XAI_API_KEY to your .env file.");
      return;
    }

    try {
      setError(null);
      setTranscript([]);
      currentTranscriptRef.current = null;
      isSessionConfigured.current = false;

      console.log("[Interview] Starting...");

      // Start audio capture first to get sample rate
      const sampleRate = await startCapture((base64Audio) => {
        sendMessage({ type: "input_audio_buffer.append", audio: base64Audio });
      });

      console.log(`[Interview] Using sample rate: ${sampleRate}Hz`);

      // Connect to XAI WebSocket with API key in subprotocol
      console.log("[Interview] Connecting to XAI API...");
      const ws = new WebSocket(XAI_REALTIME_URL, [
        "realtime",
        `openai-insecure-api-key.${XAI_API_KEY}`,
        "openai-beta.realtime-v1",
      ]);

      ws.onopen = () => {
        console.log("[Interview] WebSocket connected");
        setIsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const message: Message = JSON.parse(event.data);
          // Log non-audio messages for debugging
          if (
            message.type !== "input_audio_buffer.append" &&
            message.type !== "response.output_audio.delta"
          ) {
            console.log("[Interview] Received:", message.type);
          }
          handleMessage(message, ws, sampleRate);
        } catch (err) {
          console.error("[Interview] Error parsing message:", err);
        }
      };

      ws.onerror = (event) => {
        console.error("[Interview] WebSocket error:", event);
        setError("Connection error. Check your API key and try again.");
      };

      ws.onclose = (event) => {
        console.log(`[Interview] WebSocket closed - Code: ${event.code}, Reason: ${event.reason || "No reason"}`);
        setIsConnected(false);
        isSessionConfigured.current = false;
        if (event.code !== 1000) {
          setError(`Connection closed: ${event.reason || `Code ${event.code}`}`);
        }
      };

      wsRef.current = ws;
    } catch (err) {
      console.error("[Interview] Failed to start:", err);
      setError(err instanceof Error ? err.message : "Failed to start interview");
    }
  }, [startCapture, sendMessage, handleMessage]);

  // Stop the interview
  const stopInterview = useCallback(() => {
    console.log("[Interview] Stopping...");
    stopCapture();
    stopPlayback();

    if (wsRef.current) {
      wsRef.current.close(1000, "User stopped interview");
      wsRef.current = null;
    }

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

