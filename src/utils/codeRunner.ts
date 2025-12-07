/**
 * Code Runner Utility
 * Executes TypeScript and Python code in the browser
 */

import type { Language, TestCase, TestResult } from "../types";

// Skulpt for Python execution
declare const Sk: {
  configure: (config: { output: (text: string) => void; read?: (filename: string) => string }) => void;
  importMainWithBody: (name: string, dumpJs: boolean, body: string, canSuspend?: boolean) => Promise<void>;
  ffi: { remapToJs: (obj: unknown) => unknown };
  globals: Record<string, unknown>;
  builtinFiles?: { files: Record<string, string> };
};

let skulptLoaded = false;

/**
 * Load Skulpt library dynamically
 */
async function loadSkulpt(): Promise<void> {
  if (skulptLoaded) return;
  
  // Load skulpt.min.js
  await loadScript("https://cdn.jsdelivr.net/npm/skulpt@1.2.0/dist/skulpt.min.js");
  // Load skulpt-stdlib.js for standard library support
  await loadScript("https://cdn.jsdelivr.net/npm/skulpt@1.2.0/dist/skulpt-stdlib.js");
  
  skulptLoaded = true;
}

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      resolve();
      return;
    }
    
    const script = document.createElement("script");
    script.src = src;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(script);
  });
}

/**
 * Run JavaScript code
 */
function runJavaScript(code: string, functionName: string, args: unknown[]): unknown {
  // Create a function that defines the user's code and calls the target function
  const wrappedCode = `
    ${code}
    return ${functionName}(...__args__);
  `;
  
  try {
    const fn = new Function("__args__", wrappedCode);
    return fn(args);
  } catch (error) {
    throw new Error(`Execution error: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Run Python code using Skulpt
 */
async function runPython(code: string, functionName: string, args: unknown[]): Promise<unknown> {
  await loadSkulpt();
  
  // Convert JS args to Python-compatible format
  const argsStr = args.map(arg => JSON.stringify(arg)).join(", ");
  
  const wrappedCode = `
${code}
__result__ = ${functionName}(${argsStr})
`;

  let output = "";
  
  Sk.configure({
    output: (text: string) => { output += text; },
    read: (filename: string) => {
      if (Sk.builtinFiles?.files[filename]) {
        return Sk.builtinFiles.files[filename];
      }
      throw new Error(`File not found: ${filename}`);
    },
  });

  try {
    await Sk.importMainWithBody("<stdin>", false, wrappedCode, true);
    return Sk.ffi.remapToJs(Sk.globals["__result__"]);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    throw new Error(`Python error: ${errorMsg}`);
  }
}

/**
 * Compare two values for equality (handles arrays)
 */
function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((val, idx) => deepEqual(val, b[idx]));
  }
  
  if (typeof a === "object" && typeof b === "object" && a !== null && b !== null) {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    if (keysA.length !== keysB.length) return false;
    return keysA.every(key => deepEqual((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key]));
  }
  
  return false;
}

/**
 * Run a single test case
 */
export async function runTest(
  code: string,
  language: Language,
  functionName: string,
  testCase: TestCase
): Promise<TestResult> {
  try {
    const actual = language === "python"
      ? await runPython(code, functionName, testCase.input)
      : runJavaScript(code, functionName, testCase.input);
    
    const passed = deepEqual(actual, testCase.expected);
    
    return {
      id: testCase.id,
      passed,
      actual,
    };
  } catch (error) {
    return {
      id: testCase.id,
      passed: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Run all test cases
 */
export async function runAllTests(
  code: string,
  language: Language,
  functionName: string,
  testCases: TestCase[]
): Promise<TestResult[]> {
  const results: TestResult[] = [];
  
  for (const testCase of testCases) {
    const result = await runTest(code, language, functionName, testCase);
    results.push(result);
  }
  
  return results;
}

/**
 * Format test results for AI consumption
 */
export function formatTestResults(results: TestResult[], testCases: TestCase[]): string {
  const lines = results.map((result, idx) => {
    const testCase = testCases.find(tc => tc.id === result.id);
    const inputStr = JSON.stringify(testCase?.input);
    const expectedStr = JSON.stringify(testCase?.expected);
    
    if (result.passed) {
      return `Test ${idx + 1}: PASS - input: ${inputStr}, expected: ${expectedStr}`;
    } else if (result.error) {
      return `Test ${idx + 1}: ERROR - ${result.error}`;
    } else {
      return `Test ${idx + 1}: FAIL - input: ${inputStr}, expected: ${expectedStr}, got: ${JSON.stringify(result.actual)}`;
    }
  });
  
  const passCount = results.filter(r => r.passed).length;
  lines.push(`\nSummary: ${passCount}/${results.length} tests passed`);
  
  return lines.join("\n");
}

