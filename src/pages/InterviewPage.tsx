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
    <div className="h-screen w-screen flex bg-zinc-950">
      {/* Left: Problem Description */}
      <div className="w-80 h-full border-r border-zinc-700">
        <ProblemDescription
          title={problemTitle}
          description={DEFAULT_INTERVIEW.question}
        />
      </div>

      {/* Center: Code Editor */}
      <div className="flex-1 h-full">
        <CodeEditor value={code} onChange={(value) => setCode(value ?? "")} />
      </div>

      {/* Right: Interview Panel */}
      <div className="w-80 h-full border-l border-zinc-700">
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
