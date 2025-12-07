import Editor, { loader, type Monaco } from "@monaco-editor/react";
import { useRef, useEffect } from "react";
import type { editor } from "monaco-editor";
import { useSystemTheme } from "../hooks";
import {
  lightTheme,
  darkTheme,
  LIGHT_THEME_NAME,
  DARK_THEME_NAME,
} from "../themes";

loader.init().then((monaco) => {
  monaco.editor.defineTheme(LIGHT_THEME_NAME, lightTheme);
  monaco.editor.defineTheme(DARK_THEME_NAME, darkTheme);
});

interface ReviewCodeViewerProps {
  code: string;
  previousCode?: string;
  direction?: "forward" | "backward";
}

function computeLineDiff(
  oldCode: string,
  newCode: string
): { added: number[] } {
  const oldLines = oldCode.split("\n");
  const newLines = newCode.split("\n");
  const added: number[] = [];

  const maxLen = Math.max(oldLines.length, newLines.length);

  for (let i = 0; i < maxLen; i++) {
    const oldLine = oldLines[i] ?? "";
    const newLine = newLines[i] ?? "";

    if (oldLine !== newLine && newLine.trim() !== "") {
      added.push(i + 1);
    }
  }

  return { added };
}

export function ReviewCodeViewer({
  code,
  previousCode,
  direction = "forward",
}: ReviewCodeViewerProps) {
  const systemTheme = useSystemTheme();
  const themeName = systemTheme === "dark" ? DARK_THEME_NAME : LIGHT_THEME_NAME;
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const decorationsRef = useRef<string[]>([]);

  const handleEditorMount = (
    editor: editor.IStandaloneCodeEditor,
    monaco: Monaco
  ) => {
    editorRef.current = editor;
  };

  useEffect(() => {
    const timestamp = Date.now();
    console.log(`[${timestamp}] Effect triggered`, {
      hasEditor: !!editorRef.current,
      hasPreviousCode: !!previousCode,
      codeLength: code.length,
      previousCodeLength: previousCode?.length,
      direction,
    });

    const editor = editorRef.current;
    if (!editor || !previousCode || previousCode === code) {
      console.log(`[${timestamp}] Early return:`, {
        noEditor: !editor,
        noPreviousCode: !previousCode,
        sameCode: previousCode === code,
      });
      return;
    }

    const oldDecorationCount = decorationsRef.current.length;
    decorationsRef.current = editor.deltaDecorations(
      decorationsRef.current,
      []
    );
    console.log(
      `[${timestamp}] Cleared ${oldDecorationCount} existing decorations`
    );

    const { added } = computeLineDiff(previousCode, code);
    const className =
      direction === "forward" ? "diff-added-line" : "diff-removed-line";

    const codeLines = code.split("\n");
    const lineContents = added.map(
      (lineNum) => `${lineNum}: ${codeLines[lineNum - 1]}`
    );

    console.log(`[${timestamp}] Diff result:`, {
      addedLines: added,
      addedLineCount: added.length,
      className,
      lineContents,
    });

    const decorations = added.map((lineNumber) => ({
      range: {
        startLineNumber: lineNumber,
        startColumn: 1,
        endLineNumber: lineNumber,
        endColumn: 1,
      },
      options: {
        isWholeLine: true,
        className,
      },
    }));

    decorationsRef.current = editor.deltaDecorations([], decorations);
    console.log(
      `[${timestamp}] Applied ${decorations.length} decorations, IDs:`,
      decorationsRef.current
    );

    const timeout = setTimeout(() => {
      console.log(`[${timestamp}] Timeout fired, clearing decorations`);
      if (editorRef.current) {
        decorationsRef.current = editorRef.current.deltaDecorations(
          decorationsRef.current,
          []
        );
        console.log(`[${timestamp}] Decorations cleared`);
      }
    }, 1000);

    return () => {
      console.log(`[${timestamp}] Cleanup called, clearing timeout`);
      clearTimeout(timeout);
    };
  }, [code, previousCode, direction]);

  return (
    <div className="h-full">
      <Editor
        height="100%"
        defaultLanguage="typescript"
        value={code}
        theme={themeName}
        onMount={handleEditorMount}
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
