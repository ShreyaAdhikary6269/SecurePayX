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
        "bg-subtle": "#F4FAF7",
        ink: "#0F1E17",
        "ink-muted": "#5B6F64",
        green: {
          DEFAULT: "#059669",   // vibrant emerald (was deep forest)
          strong: "#047857",
          bright: "#10B981",
          soft: "#D1FAE5",
        },
        line: "#DCEAE3",
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