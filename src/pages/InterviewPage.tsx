import { useRef, useState, useCallback, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  CodeEditor,
  InterviewPanel,
  ProblemDescription,
  TestPanel,
} from "../components";
import { useVoiceInterview, useTestRunner } from "../hooks";
import { PREDEFINED_QUESTIONS } from "../config/interview";
import { createInterviewOutput } from "../utils/saveInterview";
import { evaluateCandidate } from "../utils/evaluateCandidate";
import {
  interviewsStore,
  interviewSetupStore,
  customQuestionsStore,
} from "../stores";
import type { Language, InterviewInput } from "../types";

// Resizable divider component
function ResizeHandle({
  direction,
  onMouseDown,
}: {
  direction: "horizontal" | "vertical";
  onMouseDown: (e: React.MouseEvent) => void;
}) {
  const isHorizontal = direction === "horizontal";
  return (
    <div
      className={`
        ${
          isHorizontal
            ? "w-1 cursor-col-resize hover:w-1"
            : "h-1 cursor-row-resize hover:h-1"
        }
        bg-transparent hover:bg-blue-500/50 active:bg-blue-500/70 transition-colors
        flex-shrink-0 z-10
      `}
      onMouseDown={onMouseDown}
    />
  );
}

export function InterviewPage() {
  const navigate = useNavigate();
  const setup = interviewSetupStore.get();

  const interviewInput = useMemo<InterviewInput | null>(() => {
    if (!setup) {
      return null;
    }
    const customQuestions = customQuestionsStore.get();
    const question =
      PREDEFINED_QUESTIONS.find((q) => q.id === setup.questionId) ||
      customQuestions.find((q) => q.id === setup.questionId);
    if (!question) {
      return null;
    }
    return {
      instruction: setup.customInstruction,
      question: question.question,
      userInfo: { name: setup.candidateName },
      helpLevel: setup.helpLevel,
      expectedSolution: question.expectedSolution,
      functionName: question.functionName,
      starterCode: question.starterCode,
      testCases: question.testCases,
      finalTestCases: question.finalTestCases,
    };
  }, [setup]);

  useEffect(() => {
    if (!interviewInput) {
      navigate("/interview/new");
    }
  }, [interviewInput, navigate]);

  const [language, setLanguage] = useState<Language>("python");
  const [code, setCode] = useState(interviewInput?.starterCode.python ?? "");

  // Panel sizes
  const [leftWidth, setLeftWidth] = useState(380);
  const [rightWidth, setRightWidth] = useState(380);
  const [testHeight, setTestHeight] = useState(200);

  // Collapsed states
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);
  const [testCollapsed, setTestCollapsed] = useState(false);

  // Use a ref to track code so the interview hook always has the latest
  const codeRef = useRef(code);
  codeRef.current = code;

  // Resize logic - optimized to avoid recreation on every state change
  const handleResize = useCallback(
    (
        setter: (v: number) => void,
        min: number,
        max: number,
        direction: "horizontal" | "vertical",
        invert: boolean
      ) =>
      (e: React.MouseEvent) => {
        e.preventDefault();
        const startPos = direction === "horizontal" ? e.clientX : e.clientY;

        // Get the current size from the DOM to avoid closure over state
        const getStartSize = () => {
          if (direction === "horizontal") {
            if (setter === setLeftWidth) return leftWidth;
            if (setter === setRightWidth) return rightWidth;
          }
          return testHeight;
        };
        const startSize = getStartSize();

        const handleMouseMove = (moveEvent: MouseEvent) => {
          const currentPos =
            direction === "horizontal" ? moveEvent.clientX : moveEvent.clientY;
          const delta = invert ? startPos - currentPos : currentPos - startPos;
          const newSize = Math.min(max, Math.max(min, startSize + delta));
          setter(newSize);
        };

        const handleMouseUp = () => {
          document.removeEventListener("mousemove", handleMouseMove);
          document.removeEventListener("mouseup", handleMouseUp);
          document.body.style.cursor = "";
          document.body.style.userSelect = "";
        };

        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);
        document.body.style.cursor =
          direction === "horizontal" ? "col-resize" : "row-resize";
        document.body.style.userSelect = "none";
      },
    [leftWidth, rightWidth, testHeight]
  );

  const handleLanguageChange = (newLang: Language) => {
    if (!interviewInput) {
      return;
    }
    setLanguage(newLang);
    setCode(interviewInput.starterCode[newLang]);
  };

  const {
    testCases,
    results,
    isRunning,
    runAll,
    runOne,
    addTest,
    removeTest,
    initialTestCount,
  } = useTestRunner(
    codeRef,
    language,
    interviewInput?.functionName ?? "",
    interviewInput?.testCases ?? []
  );

  const {
    isConnected,
    hasDisconnected,
    isCapturing,
    audioLevel,
    transcript,
    error,
    startInterview,
    stopInterview,
    sendTestResults,
    getFinalTranscript,
  } = useVoiceInterview({
    interviewInput: interviewInput!,
    codeRef,
    language,
    onRunTests: runAll,
    onAddTest: addTest,
    getTestCases: () => testCases,
  });

  const handleEndInterview = useCallback(async () => {
    if (!interviewInput) {
      return;
    }

    stopInterview();

    const interviewOutput = await createInterviewOutput(
      interviewInput,
      getFinalTranscript(),
      codeRef.current,
      language
    );

    const currentInterviews = interviewsStore.get();
    interviewsStore.set([interviewOutput, ...currentInterviews]);

    evaluateCandidate(interviewOutput);

    interviewSetupStore.set(null);

    navigate(`/interviews/${interviewOutput.id}/analysis`);
  }, [interviewInput, stopInterview, getFinalTranscript, language, navigate]);

  // Wrapper to run tests and record in transcript (AI uses run_tests tool to see results)
  const runAllAndNotifyAI = useCallback(async () => {
    const results = await runAll();
    // Record in transcript for UI display (AI will use run_tests tool)
    sendTestResults(results);
    return results;
  }, [runAll, sendTestResults]);

  // Wrapper for single test run - also record in transcript
  const runOneAndNotifyAI = useCallback(
    async (testId: string) => {
      const result = await runOne(testId);
      // Record in transcript for UI display
      if (results.length > 0) {
        sendTestResults(results);
      }
      return result;
    },
    [runOne, results, sendTestResults]
  );

  const problemTitle =
    interviewInput?.question
      .split("\n")
      .find((line) => line.startsWith("**"))
      ?.replace(/\*\*/g, "") || "Coding Problem";

  const passCount = results.filter((r) => r.passed).length;

  if (!interviewInput) {
    return null;
  }

  return (
    <div className="h-screen w-screen flex bg-[var(--bg-primary)] p-4 gap-0">
      {/* Left: Problem Description */}
      <div
        className="h-full shrink-0 rounded-l-xl border border-[var(--border-color)] shadow-[var(--shadow-lg)] overflow-hidden bg-[var(--card-bg)] flex flex-col transition-all duration-200"
        style={{ width: leftCollapsed ? 40 : leftWidth }}
      >
        {/* Collapse header */}
        <div
          className="flex items-center gap-2 px-3 py-2 border-b border-[var(--border-color)] bg-[var(--bg-secondary)] cursor-pointer select-none"
          onClick={() => setLeftCollapsed(!leftCollapsed)}
        >
          <span className="text-[var(--text-secondary)] text-xs">
            {leftCollapsed ? "▶" : "◀"}
          </span>
          {!leftCollapsed && (
            <span className="text-sm font-medium text-[var(--text-primary)]">
              Problem
            </span>
          )}
        </div>
        {!leftCollapsed && (
          <div className="flex-1 overflow-auto">
            <ProblemDescription
              title={problemTitle}
              description={interviewInput.question}
            />
          </div>
        )}
      </div>

      {/* Left resize handle */}
      {!leftCollapsed && (
        <ResizeHandle
          direction="horizontal"
          onMouseDown={handleResize(
            setLeftWidth,
            200,
            600,
            "horizontal",
            false
          )}
        />
      )}

      {/* Center: Code Editor + Test Panel */}
      <div className="flex-1 h-full min-w-0 flex flex-col gap-0 border-y border-[var(--border-color)] shadow-[var(--shadow-lg)] overflow-hidden bg-[var(--card-bg)]">
        {/* Language Selector Header */}
        <div className="flex items-center gap-3 px-4 py-2 border-b border-[var(--border-color)] bg-[var(--bg-secondary)]">
          <label className="text-sm text-[var(--text-secondary)]">
            Language:
          </label>
          <select
            value={language}
            onChange={(e) => handleLanguageChange(e.target.value as Language)}
            className="px-2 py-1 text-sm bg-[var(--bg-primary)] border border-[var(--border-color)] rounded text-[var(--text-primary)] cursor-pointer"
          >
            <option value="javascript">JavaScript</option>
            <option value="python">Python</option>
          </select>
        </div>

        {/* Code Editor */}
        <div className="flex-1 min-h-0">
          <CodeEditor
            value={code}
            onChange={(value) => setCode(value ?? "")}
            language={language}
          />
        </div>

        {/* Test resize handle */}
        {!testCollapsed && (
          <ResizeHandle
            direction="vertical"
            onMouseDown={handleResize(
              setTestHeight,
              100,
              800,
              "vertical",
              true
            )}
          />
        )}

        {/* Test Panel */}
        <div
          className="border-t border-[var(--border-color)] bg-[var(--card-bg)] flex flex-col transition-all duration-200"
          style={{ height: testCollapsed ? 40 : testHeight }}
        >
          {/* Test collapse header */}
          <div
            className="flex items-center justify-between px-4 py-2 bg-[var(--bg-secondary)] cursor-pointer select-none"
            onClick={() => setTestCollapsed(!testCollapsed)}
          >
            <div className="flex items-center gap-2">
              <span className="text-[var(--text-secondary)] text-xs">
                {testCollapsed ? "▲" : "▼"}
              </span>
              <span className="text-sm font-medium text-[var(--text-primary)]">
                Test Cases
              </span>
              {results.length > 0 && (
                <span
                  className={`text-xs ${
                    passCount === results.length
                      ? "text-emerald-500"
                      : "text-amber-500"
                  }`}
                >
                  ({passCount}/{results.length} passed)
                </span>
              )}
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                runAllAndNotifyAI();
              }}
              disabled={isRunning}
              className="px-3 py-1 text-sm bg-emerald-600 hover:bg-emerald-700 disabled:bg-zinc-600 text-white rounded transition-colors"
            >
              {isRunning ? "Running..." : "Run All"}
            </button>
          </div>
          {!testCollapsed && (
            <div className="flex-1 overflow-auto">
              <TestPanel
                testCases={testCases}
                results={results}
                isRunning={isRunning}
                onRunAll={runAllAndNotifyAI}
                onRunOne={runOneAndNotifyAI}
                onAddTest={addTest}
                onRemoveTest={removeTest}
                initialTestCount={initialTestCount}
                hideHeader
              />
            </div>
          )}
        </div>
      </div>

      {/* Right resize handle */}
      {!rightCollapsed && (
        <ResizeHandle
          direction="horizontal"
          onMouseDown={handleResize(
            setRightWidth,
            200,
            600,
            "horizontal",
            true
          )}
        />
      )}

      {/* Right: Interview Panel */}
      <div
        className="h-full shrink-0 rounded-r-xl border border-[var(--border-color)] shadow-[var(--shadow-lg)] overflow-hidden bg-[var(--card-bg)] flex flex-col transition-all duration-200"
        style={{ width: rightCollapsed ? 40 : rightWidth }}
      >
        {/* Collapse header */}
        <div
          className="flex items-center gap-2 px-3 py-2 border-b border-[var(--border-color)] bg-[var(--bg-secondary)] cursor-pointer select-none"
          onClick={() => setRightCollapsed(!rightCollapsed)}
        >
          {!rightCollapsed && (
            <span className="text-sm font-medium text-[var(--text-primary)] flex-1">
              Interview
            </span>
          )}
          <span className="text-[var(--text-secondary)] text-xs">
            {rightCollapsed ? "◀" : "▶"}
          </span>
        </div>
        {!rightCollapsed && (
          <div className="flex-1 overflow-hidden">
            <InterviewPanel
              isConnected={isConnected}
              hasDisconnected={hasDisconnected}
              isCapturing={isCapturing}
              audioLevel={audioLevel}
              transcript={transcript}
              error={error}
              onStart={startInterview}
              onStop={handleEndInterview}
              onReconnect={startInterview}
              hideHeader
            />
          </div>
        )}
      </div>
    </div>
  );
}
