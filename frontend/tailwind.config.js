/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#3b82f6",
          dark: "#2563eb",
        },
        secondary: "#6b7280",
        background: "#f9fafb",
        foreground: "#1f2937",
      },
    },
  },
  plugins: [],
}

