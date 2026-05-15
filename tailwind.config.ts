import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        panel: "#101419",
        panelSoft: "#151b22",
        panelLine: "#26313d",
        ink: "#e7edf4",
        muted: "#8f9baa",
        positive: "#21c17a",
        negative: "#ff5c72",
        caution: "#f5b84b",
        accent: "#4aa3ff"
      },
      boxShadow: {
        terminal: "0 0 0 1px rgba(255,255,255,0.06), 0 18px 50px rgba(0,0,0,0.34)"
      },
      fontFamily: {
        sans: ["Inter", "Pretendard", "Segoe UI", "Arial", "sans-serif"],
        mono: ["JetBrains Mono", "SFMono-Regular", "Consolas", "monospace"]
      }
    }
  },
  plugins: []
};

export default config;
