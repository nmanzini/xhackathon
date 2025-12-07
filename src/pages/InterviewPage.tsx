import { useState } from "react";
import { CodeEditor, InterviewPanel } from "../components";

const defaultCode = `// Welcome to the Voice AI Interview
// Write your solution below

function solution() {
  // Your code here
}
`;

export function InterviewPage() {
  const [code, setCode] = useState(defaultCode);

  return (
    <div className="h-screen w-screen flex bg-zinc-950">
      <div className="flex-1 h-full">
        <CodeEditor value={code} onChange={(value) => setCode(value ?? "")} />
      </div>
      <div className="w-80 h-full border-l border-zinc-700">
        <InterviewPanel />
      </div>
    </div>
  );
}
