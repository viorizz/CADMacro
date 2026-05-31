/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: "#0d0d0f",
          soft: "#141417",
        },
        panel: {
          DEFAULT: "#161719",
          alt: "#1b1c1f",
          input: "#1f2024",
          border: "#2a2b30",
          hover: "#212227",
        },
        seg: {
          DEFAULT: "#242529",
          active: "#3a3b41",
        },
        accent: {
          green: "#27c08a",
          red: "#e0524d",
          blue: "#4b8bf4",
        },
        txt: {
          DEFAULT: "#e7e7ea",
          muted: "#8b8b93",
          dim: "#5f6066",
        },
      },
      borderRadius: {
        card: "12px",
      },
      fontFamily: {
        sans: [
          "Inter",
          "Segoe UI",
          "system-ui",
          "Avenir",
          "Helvetica",
          "Arial",
          "sans-serif",
        ],
      },
      boxShadow: {
        card: "0 1px 0 0 rgba(255,255,255,0.02), 0 8px 24px -12px rgba(0,0,0,0.6)",
      },
    },
  },
  plugins: [],
};
