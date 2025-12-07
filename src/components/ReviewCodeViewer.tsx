import Editor, { loader } from "@monaco-editor/react";
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
  direction?: "forward" | "backward";
}

function computeLineDiff(
  oldCode: string,
  newCode: string
): { added: number[] } {
  const oldLines = oldCode.split("\n");
  const newLines = newCode.split("\n");
  const m = oldLines.length;
  const n = newLines.length;

  const C = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (oldLines[i - 1] === newLines[j - 1]) {
        C[i][j] = C[i - 1][j - 1] + 1;
      } else {
        C[i][j] = Math.max(C[i][j - 1], C[i - 1][j]);
      }
    }
  }

  const added: number[] = [];
  let i = m;
  let j = n;

  while (j > 0) {
    if (i > 0 && oldLines[i - 1] === newLines[j - 1]) {
      i--;
      j--;
    } else if (i > 0 && C[i][j - 1] < C[i - 1][j]) {
      i--;
    } else {
      added.push(j);
      j--;
    }
  }

  return { added: added.reverse() };
}

export function ReviewCodeViewer({
  code,
  direction = "forward",
}: ReviewCodeViewerProps) {
  const systemTheme = useSystemTheme();
  const themeName = systemTheme === "dark" ? DARK_THEME_NAME : LIGHT_THEME_NAME;
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const decorationsRef = useRef<string[]>([]);
  const lastAppliedCodeRef = useRef<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flashedLinesRef = useRef<Set<string>>(new Set());
  const lastDirectionRef = useRef<"forward" | "backward">(direction);

  if (direction !== lastDirectionRef.current) {
    flashedLinesRef.current.clear();
    lastDirectionRef.current = direction;
  }

  const handleEditorMount = (editor: editor.IStandaloneCodeEditor) => {
    editorRef.current = editor;
    lastAppliedCodeRef.current = code;
  };

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) {
      return;
    }

    const previousCode = lastAppliedCodeRef.current;
    if (!previousCode || previousCode === code) {
      lastAppliedCodeRef.current = code;
      return;
    }

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    decorationsRef.current = editor.deltaDecorations(
      decorationsRef.current,
      []
    );

    const { added } = computeLineDiff(previousCode, code);
    const codeLines = code.split("\n");
    const className =
      direction === "forward" ? "diff-added-line" : "diff-removed-line";

    const linesToFlash = added.filter((lineNumber) => {
      const lineContent = codeLines[lineNumber - 1] ?? "";
      return !flashedLinesRef.current.has(lineContent);
    });

    linesToFlash.forEach((lineNumber) => {
      const lineContent = codeLines[lineNumber - 1] ?? "";
      flashedLinesRef.current.add(lineContent);
    });

    const decorations = linesToFlash.map((lineNumber) => ({
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
    lastAppliedCodeRef.current = code;

    timeoutRef.current = setTimeout(() => {
      if (editorRef.current) {
        decorationsRef.current = editorRef.current.deltaDecorations(
          decorationsRef.current,
          []
        );
      }
      timeoutRef.current = null;
    }, 1000);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [code, direction]);

  return (
    <div className="h-full p-6">
      <div className="h-full rounded-xl overflow-hidden shadow-[var(--shadow-xl)] border border-[var(--border-color)]">
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
    </div>
  );
}
