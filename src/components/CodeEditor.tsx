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

interface CodeEditorProps {
  value: string;
  onChange: (value: string | undefined) => void;
  language?: string;
}

export function CodeEditor({
  value,
  onChange,
  language = "typescript",
}: CodeEditorProps) {
  const systemTheme = useSystemTheme();
  const themeName = systemTheme === "dark" ? DARK_THEME_NAME : LIGHT_THEME_NAME;
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const disposablesRef = useRef<{ dispose: () => void }[]>([]);

  const handleEditorMount = (editor: editor.IStandaloneCodeEditor) => {
    disposablesRef.current.forEach((d) => d.dispose());
    disposablesRef.current = [];

    editorRef.current = editor;

    const updateScrollbarVisibility = () => {
      const scrollHeight = editor.getScrollHeight();
      const scrollWidth = editor.getScrollWidth();
      const layoutInfo = editor.getLayoutInfo();
      const scrollableElement = editor
        .getDomNode()
        ?.querySelector(".monaco-scrollable-element") as HTMLElement;

      if (scrollableElement) {
        const needsScroll =
          scrollHeight > layoutInfo.height || scrollWidth > layoutInfo.width;
        if (needsScroll) {
          scrollableElement.classList.remove("no-scroll");
        } else {
          scrollableElement.classList.add("no-scroll");
        }
      }
    };

    setTimeout(updateScrollbarVisibility, 100);
    disposablesRef.current.push(
      editor.onDidChangeModelContent(updateScrollbarVisibility)
    );
    disposablesRef.current.push(
      editor.onDidLayoutChange(updateScrollbarVisibility)
    );
  };

  useEffect(() => {
    return () => {
      disposablesRef.current.forEach((d) => d.dispose());
      disposablesRef.current = [];
    };
  }, []);

  return (
    <div className="h-full w-full">
      <div className="h-full rounded-xl overflow-hidden shadow-[var(--shadow-xl)] border border-[var(--border-color)]">
        <div className="h-full pl-3 bg-[var(--code-bg)]">
          <Editor
            height="100%"
            defaultLanguage={language}
            theme={themeName}
            value={value}
            onChange={onChange}
            onMount={handleEditorMount}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              lineNumbers: "on",
              scrollBeyondLastLine: false,
              automaticLayout: true,
              tabSize: 2,
              wordWrap: "on",
              padding: { top: 16, bottom: 16 },
              scrollbar: {
                vertical: "auto",
                horizontal: "auto",
                verticalScrollbarSize: 10,
                horizontalScrollbarSize: 10,
                useShadows: false,
                verticalHasArrows: false,
                horizontalHasArrows: false,
                alwaysConsumeMouseWheel: false,
              },
              overviewRulerLanes: 0,
              hideCursorInOverviewRuler: true,
              overviewRulerBorder: false,
            }}
          />
        </div>
      </div>
    </div>
  );
}
