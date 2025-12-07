/**
 * Transcript Manager Hook
 * Handles transcript state and provides simple API for adding entries
 * Decoupled from WebSocket/audio logic
 */

import { useState, useCallback, useRef } from "react";

export type TranscriptRole = "user" | "assistant" | "code";

export interface TranscriptEntry {
  timestamp: string;
  role: TranscriptRole;
  content: string;
}

interface UseTranscriptReturn {
  transcript: TranscriptEntry[];
  addOrUpdateUserMessage: (itemId: string, content: string) => void;
  updateAssistantMessage: (content: string) => void;
  addCodeSent: (code: string) => void;
  clear: () => void;
}

export function useTranscript(): UseTranscriptReturn {
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  // Track item IDs to know which entry to update (ref to avoid stale closure issues)
  const itemIdMapRef = useRef<Map<string, number>>(new Map());

  const addEntry = useCallback((role: TranscriptRole, content: string) => {
    setTranscript((prev) => [
      ...prev,
      { timestamp: new Date().toISOString(), role, content },
    ]);
  }, []);

  // Add or update user message based on item ID (handles streaming transcripts)
  const addOrUpdateUserMessage = useCallback((itemId: string, content: string) => {
    setTranscript((prev) => {
      // Check if we already have an entry for this item ID
      const existingIdx = itemIdMapRef.current.get(itemId);
      
      if (existingIdx !== undefined && existingIdx < prev.length && prev[existingIdx].role === "user") {
        // Update existing entry
        const updated = [...prev];
        updated[existingIdx] = { ...updated[existingIdx], content };
        return updated;
      }
      
      // New entry - add it and track the index
      const newIdx = prev.length;
      itemIdMapRef.current.set(itemId, newIdx);
      return [...prev, { timestamp: new Date().toISOString(), role: "user", content }];
    });
  }, []);

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
    itemIdMapRef.current = new Map();
  }, []);

  return {
    transcript,
    addOrUpdateUserMessage,
    updateAssistantMessage,
    addCodeSent,
    clear,
  };
}

