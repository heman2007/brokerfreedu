import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "var(--paper)",
        notice: "var(--notice)",
        ink: "var(--ink)",
        soft: "var(--soft)",
        indigo: "var(--accent)",
        marker: "var(--gold)",
        signal: "var(--signal)",
        rule: "var(--rule)",
        "rule-thin": "var(--rule-thin)",
      },
      fontFamily: {
        sans: ["Inter", "Helvetica Neue", "Arial", "sans-serif"],
        serif: ["Newsreader", "Georgia", "Times New Roman", "serif"],
      },
      boxShadow: {
        offset: "5px 5px 0 var(--rule-thin)",
        "offset-hover": "5px 5px 0 var(--indigo)",
        btn: "4px 4px 0 var(--ink)",
      },
    },
  },
  plugins: [],
};
export default config;
