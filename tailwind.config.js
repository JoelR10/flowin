/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Paleta tomada del sistema visual de Flowin.
        bg: "#0a0d13",
        card: "#141a23",
        line: "#252e3a",
        txt: "#e8eef6",
        mut: "#8b97a7",
        ac: "#6aa6ff"
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "Arial", "sans-serif"]
      },
      borderRadius: { xl2: "18px" }
    }
  },
  plugins: []
};
