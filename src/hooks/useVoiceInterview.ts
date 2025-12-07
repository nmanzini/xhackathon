/**
 * Voice Interview Hook
 * Connects to XAI realtime API and manages the interview flow
 * 
 * FLOW:
 * 1. User speaks → Server VAD detects end → committed
 * 2. Server transcribes → conversation.item.added (user transcript)
 * 3. AI responds, can call tools (get_code, run_tests, end_interview)
 * 4. We respond to tool calls with appropriate data
 */

import { useCallback, useRef, useState } from "react";
import { useAudioStream } from "./useAudioStream";
import { useTranscript } from "./useTranscript";
import { buildSystemPrompt } from "../utils/prompt";
import type { InterviewInput, Language, TestCase, TestResult } from "../types";
import type { Message } from "../types/messages";

const XAI_REALTIME_URL = "wss://api.x.ai/v1/realtime";
const XAI_API_KEY = import.meta.env.VITE_XAI_API_KEY || "";
const VOICE = "ash";

// Tool definitions - AI can get code, run tests, and add test cases
const TOOLS = [
  {
    type: "function",
    name: "get_code",
    description: "Get the candidate's current code from the editor. Call this whenever you want to see what they've written or when they ask you to look at their code.",
    parameters: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    type: "function",
    name: "run_tests",
    description: "Run all test cases against the candidate's current code. Returns pass/fail results for each test. Use this proactively after they write code.",
    parameters: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    type: "function",
    name: "add_test_case",
    description: "Add a new test case to validate the candidate's code. Use this to create edge cases or examples that will help the candidate understand issues with their solution.",
    parameters: {
      type: "object",
      properties: {
        input: {
          type: "array",
          description: "Array of function arguments (e.g., [[2,7,11,15], 9] for two_sum(nums, target))",
        },
        expected: {
          description: "Expected return value from the function",
        },
      },
      required: ["input", "expected"],
    },
  },
];

interface UseVoiceInterviewOptions {
  interviewInput: InterviewInput;
  codeRef: React.MutableRefObject<string>;
  language: Language;
  onRunTests: () => Promise<TestResult[]>;
  onAddTest: (input: any[], expected: any) => void;
}

export function useVoiceInterview({
  interviewInput,
  codeRef,
  language,
  onRunTests,
  onAddTest,
}: UseVoiceInterviewOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const isSessionConfigured = useRef(false);
  const assistantBuffer = useRef("");
  const pendingToolCalls = useRef<Array<{ callId: string; toolName: string; args: string }>>([]);
  const isProcessingTool = useRef(false);
  // Initialize with starter code so we don't send it until user actually edits
  const lastSentCode = useRef<string>(codeRef.current);

  const { isCapturing, startCapture, stopCapture, stopPlayback, playAudio, audioLevel } =
    useAudioStream();

  const {
    transcript,
    addOrUpdateUserMessage,
    updateAssistantMessage,
    addCodeSent,
    addToolCall,
    clear: clearTranscript,
  } = useTranscript();

  // === HELPERS ===

  const send = useCallback((data: object) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
  }, []);

  // Configure session with system prompt, VAD, and tools
  const configureSession = useCallback(
    (sampleRate: number) => {
      console.log("[Interview] Configuring session with tools...");
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
          tools: TOOLS,
        },
      });
    },
    [interviewInput, send]
  );

  // Handle tool calls from AI - queues them to run after speech finishes
  const handleToolCall = useCallback(
    async (callId: string, toolName: string, args: string) => {
      console.log("[Interview] Tool call queued:", toolName, "call_id:", callId);
      
      // Queue the tool call instead of executing immediately
      pendingToolCalls.current.push({ callId, toolName, args });
      
      // Don't process now - will process after audio finishes in response.done
    },
    []
  );

  // Process queued tool calls (called after audio finishes)
  const processQueuedToolCalls = useCallback(
    async () => {
      if (isProcessingTool.current || pendingToolCalls.current.length === 0) return;
      
      isProcessingTool.current = true;
      console.log("[Interview] Processing queued tool calls:", pendingToolCalls.current.length);
      
      // Process all queued tools
      for (const { callId, toolName, args } of pendingToolCalls.current) {
        console.log("[Interview] Executing tool:", toolName);
        let output = "";

        if (toolName === "get_code") {
          const code = codeRef.current;
          console.log("[Interview] Returning code:", code.substring(0, 100) + "...");
          
          // Add to UI transcript so user sees when AI checks code
          addCodeSent(code);
          
          output = `Language: ${language}\n\nCode:\n${code || "(empty - no code written yet)"}`;
        } 
        else if (toolName === "run_tests") {
          console.log("[Interview] AI running tests...");
          
          try {
            const results = await onRunTests();
            const passCount = results.filter(r => r.passed).length;
            
            const resultLines = results.map((r, idx) => {
              if (r.passed) return `Test ${idx + 1}: ✓ PASS`;
              if (r.error) return `Test ${idx + 1}: ✗ ERROR - ${r.error}`;
              return `Test ${idx + 1}: ✗ FAIL - expected ${JSON.stringify(interviewInput.testCases[idx]?.expected)}, got ${JSON.stringify(r.actual)}`;
            });
            
            output = `Test Results: ${passCount}/${results.length} passed\n\n${resultLines.join("\n")}`;
            
            // Add to transcript - user sees results in UI
            addToolCall("run_tests", `${passCount}/${results.length} tests passed`);
          } catch (err) {
            output = `Error running tests: ${err instanceof Error ? err.message : String(err)}`;
            addToolCall("run_tests", `Error: ${err instanceof Error ? err.message : String(err)}`);
          }
        }
        else if (toolName === "add_test_case") {
          console.log("[Interview] Adding test case with args:", args);
          
          try {
            const parsed = JSON.parse(args || "{}");
            const input = parsed.input;
            const expected = parsed.expected;
            
            if (!Array.isArray(input)) {
              output = "Error: input must be an array of function arguments";
              addToolCall("add_test_case", "Error: invalid input format");
            } else {
              onAddTest(input, expected);
              output = `Test case added: input=${JSON.stringify(input)}, expected=${JSON.stringify(expected)}`;
              addToolCall("add_test_case", `Added: ${JSON.stringify(input)} → ${JSON.stringify(expected)}`);
            }
          } catch (err) {
            output = `Error adding test case: ${err instanceof Error ? err.message : String(err)}`;
            addToolCall("add_test_case", `Error: ${err instanceof Error ? err.message : String(err)}`);
          }
        }
        else {
          output = `Unknown tool: ${toolName}`;
        }

        // Send tool response
        send({
          type: "conversation.item.create",
          item: {
            type: "function_call_output",
            call_id: callId,
            output,
          },
        });
      }

      // Clear queue and trigger AI response
      pendingToolCalls.current = [];
      isProcessingTool.current = false;
      
      // Trigger AI response with tool results
      console.log("[Interview] All tools processed, triggering AI response");
      send({ type: "response.create" });
    },
    [codeRef, language, addCodeSent, addToolCall, onRunTests, onAddTest, interviewInput.testCases, send]
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
        
        // Wait longer for audio to finish playing before processing tools
        // This prevents cutting off the AI's speech
        setTimeout(() => {
          processQueuedToolCalls();
        }, 500); // Increased delay to ensure audio finishes
      }

      // User started speaking → stop AI playback
      if (type === "input_audio_buffer.speech_started") {
        stopPlayback();
      }

      // Tool call from AI - with enhanced logging
      if (type === "response.function_call_arguments.done" && "call_id" in message && "name" in message) {
        const callId = message.call_id as string;
        const toolName = message.name as string;
        const args = (message as { arguments?: string }).arguments || "";
        console.log("[Interview] *** TOOL CALL DETECTED ***", toolName, "call_id:", callId, "args:", args);
        handleToolCall(callId, toolName, args);
      }
      
      // Log any tool-related events for debugging
      if (type.includes("function_call") || type.includes("tool")) {
        console.log("[Interview] TOOL-RELATED EVENT:", type, JSON.stringify(message, null, 2));
      }

      // User transcript received
      if (type === "conversation.item.added" && "item" in message) {
        const item = message.item as { id?: string; role?: string; content?: Array<{ type: string; transcript?: string; text?: string }> };
        
        console.log("[Interview] conversation.item.added:", JSON.stringify(item, null, 2));
        
        if (item?.role === "user" && item?.content && item?.id) {
          for (const content of item.content) {
            // Skip automatic code injections in transcript
            if (content.type === "input_text" && content.text?.startsWith("[Current Code]")) {
              console.log("[Interview] Skipping code injection from transcript");
              continue;
            }
            
            // Skip audio transcripts that contain code injection (audio feedback loop)
            if (content.type === "input_audio" && content.transcript?.includes("[Current Code]")) {
              console.log("[Interview] Skipping audio with code injection feedback");
              continue;
            }
            
            // Only process AUDIO transcripts
            if (content.type !== "input_audio") {
              console.log("[Interview] Skipping non-audio content:", content.type);
              continue;
            }
            if (!content.transcript) {
              console.log("[Interview] Skipping: no transcript");
              continue;
            }
            
            console.log("[Interview] User said:", content.transcript);
            
            // Add or update user message (same item ID = update existing entry)
            addOrUpdateUserMessage(item.id, content.transcript);
            
            // Inject current code as context ONLY if it has changed
            // This ensures AI always has latest code without explicitly calling get_code
            const currentCode = codeRef.current;
            if (currentCode && currentCode.trim() !== "" && currentCode !== lastSentCode.current) {
              console.log("[Interview] Code changed, injecting new code context");
              lastSentCode.current = currentCode; // Update last sent code
              
              // Add visual indicator in transcript
              addCodeSent(currentCode);
              
              // Send to AI
              send({
                type: "conversation.item.create",
                item: {
                  type: "message",
                  role: "user",
                  content: [
                    { 
                      type: "input_text", 
                      text: `[Current Code]\n\`\`\`${language}\n${currentCode}\n\`\`\`` 
                    }
                  ],
                },
              });
            } else if (currentCode === lastSentCode.current) {
              console.log("[Interview] Code unchanged, skipping injection");
            }
            
            // Trigger AI response (AI now has code context)
            send({ type: "response.create" });
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
    [configureSession, sendGreeting, playAudio, stopPlayback, updateAssistantMessage, addOrUpdateUserMessage, handleToolCall, send]
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

  // Send test results to AI (called by user manually running tests)
  const sendTestResults = useCallback(
    (results: TestResult[], testCases: TestCase[]) => {
      if (!isConnected) return;

      const passCount = results.filter(r => r.passed).length;
      
      const resultLines = results.map((r, idx) => {
        const testCase = testCases[idx];
        if (r.passed) return `Test ${idx + 1}: ✓ PASS`;
        if (r.error) return `Test ${idx + 1}: ✗ ERROR - ${r.error}`;
        return `Test ${idx + 1}: ✗ FAIL - expected ${JSON.stringify(testCase?.expected)}, got ${JSON.stringify(r.actual)}`;
      });
      
      const message = `[Test Results]\n${passCount}/${results.length} tests passed\n\n${resultLines.join("\n")}`;
      
      console.log("[Interview] Sending test results to AI:", message);
      
      // Send as a user message so AI can see the results
      send({
        type: "conversation.item.create",
        item: {
          type: "message",
          role: "user",
          content: [{ type: "input_text", text: message }],
        },
      });
      
      // DON'T trigger AI response automatically
      // This allows the user to speak and ask about the results naturally
      // The AI will see the results when the user speaks next
      console.log("[Interview] Test results added to context. User can now speak about them.");
      
      // Add to UI transcript
      addToolCall("test_results", `${passCount}/${results.length} tests passed`);
    },
    [isConnected, send, addToolCall]
  );

  return {
    isConnected,
    isCapturing,
    audioLevel,
    transcript,
    error,
    startInterview,
    stopInterview,
    sendTestResults,
  };
}
