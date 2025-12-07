/**
 * Transcript Manager Hook
 * Handles transcript state and provides simple API for adding entries
 * Decoupled from WebSocket/audio logic
 */

import { useState, useCallback, useRef } from "react";
import type { TestResult, TestCase } from "../types";

export type TranscriptRole = "user" | "assistant" | "code" | "tool" | "test_run";

export interface TranscriptEntry {
  timestamp: string;
  role: TranscriptRole;
  content: string;
  code?: string; // Current code snapshot
  toolName?: string; // For tool role entries
  testResults?: {
    id: string;
    input: any[];
    expected: any;
    actual?: any;
    passed: boolean;
    error?: string;
  }[]; // For test_run entries
}

interface UseTranscriptOptions {
  getCode: () => string; // Function to get current code
  getTestCases: () => TestCase[]; // Function to get current test cases
}

interface UseTranscriptReturn {
  transcript: TranscriptEntry[];
  addOrUpdateUserMessage: (itemId: string, content: string) => void;
  updateAssistantMessage: (content: string) => void;
  addCodeSent: (code: string) => void;
  addToolCall: (toolName: string, result: string) => void;
  addTestRun: (results: TestResult[]) => void;
  clear: () => void;
}

export function useTranscript({ getCode, getTestCases }: UseTranscriptOptions): UseTranscriptReturn {
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  // Track item IDs to know which entry to update (ref to avoid stale closure issues)
  const itemIdMapRef = useRef<Map<string, number>>(new Map());

  const addEntry = useCallback((role: TranscriptRole, content: string, code?: string) => {
    setTranscript((prev) => [
      ...prev,
      { 
        timestamp: new Date().toISOString(), 
        role, 
        content,
        code: code ?? getCode(), // Always capture current code
      },
    ]);
  }, [getCode]);

  // Add or update user message based on item ID (handles streaming transcripts)
  const addOrUpdateUserMessage = useCallback((itemId: string, content: string) => {
    const currentCode = getCode();
    setTranscript((prev) => {
      // Check if we already have an entry for this item ID
      const existingIdx = itemIdMapRef.current.get(itemId);
      
      if (existingIdx !== undefined && existingIdx < prev.length && prev[existingIdx].role === "user") {
        // Update existing entry
        const updated = [...prev];
        updated[existingIdx] = { ...updated[existingIdx], content, code: currentCode };
        return updated;
      }
      
      // New entry - add it and track the index
      const newIdx = prev.length;
      itemIdMapRef.current.set(itemId, newIdx);
      return [...prev, { 
        timestamp: new Date().toISOString(), 
        role: "user", 
        content,
        code: currentCode,
      }];
    });
  }, [getCode]);

  // Update the last assistant message (for streaming)
  const updateAssistantMessage = useCallback((content: string) => {
    const currentCode = getCode();
    setTranscript((prev) => {
      const lastIdx = prev.length - 1;
      if (lastIdx >= 0 && prev[lastIdx].role === "assistant") {
        const updated = [...prev];
        updated[lastIdx] = { ...updated[lastIdx], content, code: currentCode };
        return updated;
      }
      // No assistant message to update, create new one
      return [...prev, { 
        timestamp: new Date().toISOString(), 
        role: "assistant", 
        content,
        code: currentCode,
      }];
    });
  }, [getCode]);

  const addCodeSent = useCallback((code: string) => {
    addEntry("code", code, code);
  }, [addEntry]);

  const addToolCall = useCallback((toolName: string, result: string) => {
    const currentCode = getCode();
    setTranscript((prev) => [
      ...prev,
      { 
        timestamp: new Date().toISOString(), 
        role: "tool", 
        content: result, 
        toolName,
        code: currentCode,
      },
    ]);
  }, [getCode]);

  const addTestRun = useCallback((results: TestResult[]) => {
    const currentCode = getCode();
    const testCases = getTestCases();
    const passed = results.filter(r => r.passed).length;
    const total = results.length;
    const message = `Test Run: ${passed}/${total} passed`;
    
    // Enrich results with test case data (input, expected)
    const enrichedResults = results.map((result, idx) => ({
      id: result.id,
      input: testCases[idx]?.input || [],
      expected: testCases[idx]?.expected,
      actual: result.actual,
      passed: result.passed,
      error: result.error,
    }));
    
    setTranscript((prev) => [
      ...prev,
      {
        timestamp: new Date().toISOString(),
        role: "test_run",
        content: message,
        code: currentCode,
        testResults: enrichedResults,
      },
    ]);
  }, [getCode, getTestCases]);

  const clear = useCallback(() => {
    setTranscript([]);
    itemIdMapRef.current = new Map();
  }, []);

  return {
    transcript,
    addOrUpdateUserMessage,
    updateAssistantMessage,
    addCodeSent,
    addToolCall,
    addTestRun,
    clear,
  };
}

