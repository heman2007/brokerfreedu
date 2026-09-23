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
        marker: "var(--accent)",
        signal: "var(--signal)",
        rule: "var(--rule)",
        "rule-thin": "var(--rule-thin)",
      },
      fontFamily: {
        sans: ["Inter", "Helvetica Neue", "Arial", "sans-serif"],
        serif: ["Newsreader", "Georgia", "Times New Roman", "serif"],
      },
    },
  },
  plugins: [],
};
export default config;
