/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#FFFFFF",
        "bg-subtle": "#F5F9F6",
        ink: "#0F1E17",
        "ink-muted": "#5B6F64",
        green: {
          DEFAULT: "#14532D",
          strong: "#0C3D20",
          soft: "#DCEEE3",
        },
        line: "#D8E6DC",
      },
      fontFamily: {
        serif: ["'Source Serif 4'", "Georgia", "serif"],
        sans: ["'IBM Plex Sans'", "system-ui", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "2px",
      },
    },
  },
  plugins: [],
};