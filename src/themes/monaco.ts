import type { editor } from "monaco-editor";

export const lightTheme: editor.IStandaloneThemeData = {
  base: "vs",
  inherit: true,
  rules: [
    { token: "keyword", foreground: "AF00DB" },
    { token: "variable", foreground: "001080" },
    { token: "operator", foreground: "000000" },
    { token: "type", foreground: "267F99" },
    { token: "string", foreground: "A31515" },
    { token: "comment", foreground: "008000" },
    { token: "number", foreground: "098658" },
    { token: "function", foreground: "795E26" },
  ],
  colors: {
    "editor.background": "#f6f8ff",
    "editor.foreground": "#1b1730",
    "editor.lineHighlightBackground": "#f0f2fa",
    "editorLineNumber.foreground": "#6a7082",
    "editorLineNumber.activeForeground": "#1b1730",
    "editor.selectionBackground": "#add6ff80",
    "editorCursor.foreground": "#5f6be1",
    "editorIndentGuide.background": "#e0e0e0",
    "editorIndentGuide.activeBackground": "#c0c0c0",
  },
};

export const darkTheme: editor.IStandaloneThemeData = {
  base: "vs-dark",
  inherit: true,
  rules: [
    { token: "keyword", foreground: "C586C0" },
    { token: "variable", foreground: "9CDCFE" },
    { token: "operator", foreground: "D4D4D4" },
    { token: "type", foreground: "4EC9B0" },
    { token: "string", foreground: "CE9178" },
    { token: "comment", foreground: "6A9955" },
    { token: "number", foreground: "B5CEA8" },
    { token: "function", foreground: "DCDCAA" },
  ],
  colors: {
    "editor.background": "#23263a",
    "editor.foreground": "#e5e9f0",
    "editor.lineHighlightBackground": "#2a2d42",
    "editorLineNumber.foreground": "#cfd6e4",
    "editorLineNumber.activeForeground": "#e5e9f0",
    "editor.selectionBackground": "#264f7880",
    "editorCursor.foreground": "#7e74ea",
    "editorIndentGuide.background": "#404040",
    "editorIndentGuide.activeBackground": "#707070",
  },
};

export const LIGHT_THEME_NAME = "app-light";
export const DARK_THEME_NAME = "app-dark";
