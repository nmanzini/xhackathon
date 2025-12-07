/**
 * Test Runner Hook
 * Manages test execution and test case state
 */

import { useState, useCallback, useRef } from "react";
import type { Language, TestCase, TestResult } from "../types";
import { runTest, runAllTests } from "../utils/codeRunner";

interface UseTestRunnerReturn {
  testCases: TestCase[];
  results: TestResult[];
  isRunning: boolean;
  runAll: () => Promise<TestResult[]>;
  runOne: (testId: string) => Promise<TestResult | null>;
  addTest: (input: any[], expected: any) => void;
  removeTest: (testId: string) => void;
  clearResults: () => void;
  initialTestCount: number;
}

export function useTestRunner(
  codeRef: React.MutableRefObject<string>,
  language: Language,
  functionName: string,
  initialTestCases: TestCase[]
): UseTestRunnerReturn {
  const [testCases, setTestCases] = useState<TestCase[]>(initialTestCases);
  const [results, setResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  
  // Counter for generating unique test IDs
  const nextIdRef = useRef(initialTestCases.length + 1);
  
  // Ref to always have latest test cases (avoids stale closure in runAll)
  const testCasesRef = useRef(testCases);
  testCasesRef.current = testCases;

  const runAll = useCallback(async (): Promise<TestResult[]> => {
    setIsRunning(true);
    try {
      // Use ref to get latest test cases (not stale from closure)
      const currentTestCases = testCasesRef.current;
      const newResults = await runAllTests(
        codeRef.current,
        language,
        functionName,
        currentTestCases
      );
      setResults(newResults);
      return newResults;
    } finally {
      setIsRunning(false);
    }
  }, [codeRef, language, functionName]);

  const runOne = useCallback(async (testId: string): Promise<TestResult | null> => {
    const testCase = testCasesRef.current.find(tc => tc.id === testId);
    if (!testCase) return null;

    setIsRunning(true);
    try {
      const result = await runTest(
        codeRef.current,
        language,
        functionName,
        testCase
      );
      
      // Update results, replacing existing result for this test
      setResults(prev => {
        const filtered = prev.filter(r => r.id !== testId);
        return [...filtered, result];
      });
      
      return result;
    } finally {
      setIsRunning(false);
    }
  }, [codeRef, language, functionName]);

  const addTest = useCallback((input: any[], expected: any) => {
    const newTest: TestCase = {
      id: String(nextIdRef.current++),
      input,
      expected,
    };
    // Update ref immediately so runAll sees new test even before React re-renders
    testCasesRef.current = [...testCasesRef.current, newTest];
    setTestCases(testCasesRef.current);
  }, []);

  const removeTest = useCallback((testId: string) => {
    // Update ref immediately
    testCasesRef.current = testCasesRef.current.filter(tc => tc.id !== testId);
    setTestCases(testCasesRef.current);
    setResults(prev => prev.filter(r => r.id !== testId));
  }, []);

  const clearResults = useCallback(() => {
    setResults([]);
  }, []);

  return {
    testCases,
    results,
    isRunning,
    runAll,
    runOne,
    addTest,
    removeTest,
    clearResults,
    initialTestCount: initialTestCases.length,
  };
}

