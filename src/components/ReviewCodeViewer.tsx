import Editor from "@monaco-editor/react";

interface ReviewCodeViewerProps {
  code: string;
}

export function ReviewCodeViewer({ code }: ReviewCodeViewerProps) {
  return (
    <div className="h-full">
      <Editor
        height="100%"
        defaultLanguage="typescript"
        value={code}
        theme="vs-dark"
        options={{
          readOnly: true,
          minimap: { enabled: false },
          fontSize: 14,
          lineNumbers: "on",
          scrollBeyondLastLine: false,
        }}
      />
    </div>
  );
}
