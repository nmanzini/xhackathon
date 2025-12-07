/**
 * Test Panel Component
 * Expandable panel showing test cases and results (like LeetCode)
 */

import { useState } from "react";
import { Check, X, Circle, Trash2, Plus, ChevronDown, ChevronRight } from "lucide-react";
import type { TestCase, TestResult } from "../types";

interface TestPanelProps {
  testCases: TestCase[];
  results: TestResult[];
  isRunning: boolean;
  onRunAll: () => void;
  onRunOne: (testId: string) => void;
  onAddTest: (input: any[], expected: any) => void;
  onRemoveTest?: (testId: string) => void;
  initialTestCount?: number;
  hideHeader?: boolean;
}

export function TestPanel({
  testCases,
  results,
  isRunning,
  onRunAll,
  onRunOne,
  onAddTest,
  onRemoveTest,
  initialTestCount = 0,
  hideHeader = false,
}: TestPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newInput, setNewInput] = useState("");
  const [newExpected, setNewExpected] = useState("");

  const getResultForTest = (testId: string): TestResult | undefined => {
    return results.find(r => r.id === testId);
  };

  const handleAddTest = () => {
    try {
      const input = JSON.parse(newInput);
      const expected = JSON.parse(newExpected);
      
      if (!Array.isArray(input)) {
        alert("Input must be an array of arguments");
        return;
      }
      
      onAddTest(input, expected);
      setNewInput("");
      setNewExpected("");
      setShowAddForm(false);
    } catch {
      alert("Invalid JSON format");
    }
  };

  const passCount = results.filter(r => r.passed).length;
  const hasResults = results.length > 0;

  // If header is hidden, always show content
  const showContent = hideHeader || isExpanded;

  return (
    <div className={hideHeader ? "" : "border-t border-[var(--border-color)] bg-[var(--card-bg)]"}>
      {/* Header - only show if not hidden */}
      {!hideHeader && (
        <div
          className="flex items-center justify-between px-4 py-2 cursor-pointer hover:bg-[var(--bg-secondary)] transition-colors"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-2">
            {isExpanded ? <ChevronDown className="w-4 h-4 text-[var(--text-secondary)]" /> : <ChevronRight className="w-4 h-4 text-[var(--text-secondary)]" />}
            <span className="font-medium text-[var(--text-primary)]">
              Test Cases
            </span>
            {hasResults && (
              <span className={`text-sm ${passCount === results.length ? "text-emerald-500" : "text-amber-500"}`}>
                ({passCount}/{results.length} passed)
              </span>
            )}
          </div>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRunAll();
            }}
            disabled={isRunning}
            className="px-3 py-1 text-sm bg-emerald-600 hover:bg-emerald-700 disabled:bg-zinc-600 text-white rounded transition-colors"
          >
            {isRunning ? "Running..." : "Run All"}
          </button>
        </div>
      )}

      {/* Content */}
      {showContent && (
        <div className="px-4 pb-3 space-y-2 overflow-y-auto">
          {testCases.map((test, idx) => {
            const result = getResultForTest(test.id);
            const StatusIcon = !result
              ? Circle
              : result.passed
              ? Check
              : X;
            const statusColor = !result
              ? "text-zinc-500"
              : result.passed
              ? "text-emerald-500"
              : "text-red-500";
            
            // Can only delete tests added after the initial ones
            const canDelete = onRemoveTest && idx >= initialTestCount;

            return (
              <div
                key={test.id}
                className="flex items-start gap-2 p-2 rounded bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors group"
              >
                <StatusIcon className={`w-4 h-4 mt-0.5 ${statusColor}`} />
                
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-[var(--text-primary)]">
                    <span className="text-[var(--text-secondary)]">Test {idx + 1}:</span>{" "}
                    <span className="font-mono text-xs">
                      {JSON.stringify(test.input).slice(0, 40)}
                      {JSON.stringify(test.input).length > 40 ? "..." : ""}
                    </span>
                  </div>
                  
                  <div className="text-xs text-[var(--text-secondary)] font-mono">
                    Expected: {JSON.stringify(test.expected)}
                  </div>
                  
                  {result && !result.passed && (
                    <div className="text-xs text-red-400 font-mono">
                      {result.error ? `Error: ${result.error}` : `Got: ${JSON.stringify(result.actual)}`}
                    </div>
                  )}
                </div>
                
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => onRunOne(test.id)}
                    disabled={isRunning}
                    className="px-2 py-1 text-xs bg-zinc-600 hover:bg-zinc-500 disabled:bg-zinc-700 text-white rounded transition-colors"
                  >
                    Run
                  </button>
                  
                  {canDelete && (
                    <button
                      onClick={() => onRemoveTest(test.id)}
                      disabled={isRunning}
                      className="p-1 bg-red-600 hover:bg-red-700 disabled:bg-zinc-700 text-white rounded transition-colors"
                      title="Delete this test case"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {/* Add Test Button/Form */}
          {showAddForm ? (
            <div className="p-2 rounded bg-[var(--bg-secondary)] space-y-2">
              <input
                type="text"
                placeholder='Input (e.g., [[1,2,3], 5])'
                value={newInput}
                onChange={(e) => setNewInput(e.target.value)}
                className="w-full px-2 py-1 text-sm bg-[var(--bg-primary)] border border-[var(--border-color)] rounded text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]"
              />
              <input
                type="text"
                placeholder='Expected (e.g., [0,1])'
                value={newExpected}
                onChange={(e) => setNewExpected(e.target.value)}
                className="w-full px-2 py-1 text-sm bg-[var(--bg-primary)] border border-[var(--border-color)] rounded text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleAddTest}
                  className="px-3 py-1 text-sm bg-emerald-600 hover:bg-emerald-700 text-white rounded transition-colors"
                >
                  Add
                </button>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="px-3 py-1 text-sm bg-zinc-600 hover:bg-zinc-500 text-white rounded transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowAddForm(true)}
              className="w-full p-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] rounded border border-dashed border-[var(--border-color)] transition-colors flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Add Test Case
            </button>
          )}
        </div>
      )}
    </div>
  );
}
