/**
 * Transcript Manager Hook
 * Handles transcript state and provides simple API for adding entries
 * Decoupled from WebSocket/audio logic
 */

import { useState, useCallback } from "react";

export type TranscriptRole = "user" | "assistant" | "code";

export interface TranscriptEntry {
  timestamp: string;
  role: TranscriptRole;
  content: string;
}

interface UseTranscriptReturn {
  transcript: TranscriptEntry[];
  addUserMessage: (content: string) => void;
  addAssistantMessage: (content: string) => void;
  updateAssistantMessage: (content: string) => void;
  addCodeSent: (code: string) => void;
  clear: () => void;
}

export function useTranscript(): UseTranscriptReturn {
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);

  const addEntry = useCallback((role: TranscriptRole, content: string) => {
    setTranscript((prev) => [
      ...prev,
      { timestamp: new Date().toISOString(), role, content },
    ]);
  }, []);

  const addUserMessage = useCallback((content: string) => {
    addEntry("user", content);
  }, [addEntry]);

  const addAssistantMessage = useCallback((content: string) => {
    addEntry("assistant", content);
  }, [addEntry]);

  // Update the last assistant message (for streaming)
  const updateAssistantMessage = useCallback((content: string) => {
    setTranscript((prev) => {
      const lastIdx = prev.length - 1;
      if (lastIdx >= 0 && prev[lastIdx].role === "assistant") {
        const updated = [...prev];
        updated[lastIdx] = { ...updated[lastIdx], content };
        return updated;
      }
      // No assistant message to update, create new one
      return [...prev, { timestamp: new Date().toISOString(), role: "assistant", content }];
    });
  }, []);

  const addCodeSent = useCallback((code: string) => {
    addEntry("code", code);
  }, [addEntry]);

  const clear = useCallback(() => {
    setTranscript([]);
  }, []);

  return {
    transcript,
    addUserMessage,
    addAssistantMessage,
    updateAssistantMessage,
    addCodeSent,
    clear,
  };
}

