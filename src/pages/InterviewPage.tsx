import { useRef, useState } from "react";
import { CodeEditor, InterviewPanel, ProblemDescription } from "../components";
import { useVoiceInterview } from "../hooks";
import { DEFAULT_INTERVIEW, DEFAULT_STARTER_CODE } from "../config/interview";

export function InterviewPage() {
  const [code, setCode] = useState(DEFAULT_STARTER_CODE);

  // Use a ref to track code so the interview hook always has the latest
  const codeRef = useRef(code);
  codeRef.current = code;

  const {
    isConnected,
    isCapturing,
    audioLevel,
    transcript,
    error,
    startInterview,
    stopInterview,
  } = useVoiceInterview(DEFAULT_INTERVIEW, codeRef);

  // Extract problem title from the question (first line with **)
  const problemTitle =
    DEFAULT_INTERVIEW.question
      .split("\n")
      .find((line) => line.startsWith("**"))
      ?.replace(/\*\*/g, "") || "Coding Problem";

  return (
    <div className="h-screen w-screen flex bg-[var(--bg-primary)] p-4 gap-4">
      {/* Left: Problem Description */}
      <div className="w-[380px] h-full shrink-0 rounded-xl border border-[var(--border-color)] shadow-[var(--shadow-lg)] overflow-hidden bg-[var(--card-bg)]">
        <ProblemDescription
          title={problemTitle}
          description={DEFAULT_INTERVIEW.question}
        />
      </div>

      {/* Center: Code Editor */}
      <div className="flex-1 h-full min-w-0">
        <CodeEditor value={code} onChange={(value) => setCode(value ?? "")} />
      </div>

      {/* Right: Interview Panel */}
      <div className="w-[380px] h-full shrink-0 rounded-xl border border-[var(--border-color)] shadow-[var(--shadow-lg)] overflow-hidden bg-[var(--card-bg)]">
        <InterviewPanel
          isConnected={isConnected}
          isCapturing={isCapturing}
          audioLevel={audioLevel}
          transcript={transcript}
          error={error}
          onStart={startInterview}
          onStop={stopInterview}
        />
      </div>
    </div>
  );
}
