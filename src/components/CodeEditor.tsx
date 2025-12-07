import Editor, { loader } from "@monaco-editor/react";
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

  return (
    <div className="h-full w-full bg-[var(--code-bg)]">
      <Editor
        height="100%"
        defaultLanguage={language}
        theme={themeName}
        value={value}
        onChange={onChange}
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          lineNumbers: "on",
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 2,
          wordWrap: "on",
        }}
      />
    </div>
  );
}
