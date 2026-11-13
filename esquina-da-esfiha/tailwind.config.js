/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        bordo: { DEFAULT: "#6B0F1A", 900: "#44090F" },
        sol: { DEFAULT: "#FFC21A", 100: "#FFF3CC" },
        zap: { DEFAULT: "#128C4A", dark: "#0C6E3A" },
        ink: "#2A1215",
        papel: "#FFFCF5",
      },
      fontFamily: {
        display: ['"Bricolage Grotesque"', "system-ui", "sans-serif"],
        sans: ["Figtree", "system-ui", "sans-serif"],
      },
      boxShadow: { card: "0 1px 0 rgba(68,9,15,.06), 0 6px 18px -8px rgba(68,9,15,.25)" },
    },
  },
  plugins: [],
};
