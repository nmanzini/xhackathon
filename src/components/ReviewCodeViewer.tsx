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

interface ReviewCodeViewerProps {
  code: string;
}

export function ReviewCodeViewer({ code }: ReviewCodeViewerProps) {
  const systemTheme = useSystemTheme();
  const themeName = systemTheme === "dark" ? DARK_THEME_NAME : LIGHT_THEME_NAME;

  return (
    <div className="h-full bg-[var(--code-bg)]">
      <Editor
        height="100%"
        defaultLanguage="typescript"
        value={code}
        theme={themeName}
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
