/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        inter: ["Inter", "system-ui", "sans-serif"],
        poppins: ["Poppins", "system-ui", "sans-serif"],
      },
      colors: {
        // Staff theme colors - Xanh lá chủ đạo
        primary: {
          50: "#f0f9f0",
          100: "#dcf2dc",
          200: "#bce5bc",
          300: "#8fd18f",
          400: "#4CAF50", // Xanh lá sáng
          500: "#2e7d32",
          600: "#1B5E20", // Xanh lá đậm
          700: "#1a5f1a",
          800: "#194f19",
          900: "#164316",
        },
        // Keep existing blue for compatibility
        blue: {
          600: "#1976D2",
          700: "#1565C0",
        },
        // Gray theme
        neutral: {
          50: "#F5F5F5", // Xám sáng
          100: "#f5f5f5",
          200: "#e5e5e5",
          300: "#d4d4d4",
          400: "#a3a3a3",
          500: "#737373",
          600: "#525252",
          700: "#404040",
          800: "#262626",
          900: "#171717",
        },
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-in-out",
        "fade-in-up": "fadeInUp 0.6s ease-out",
        "slide-in": "slideIn 0.3s ease-out",
        "slide-left": "slideLeft 0.5s ease-out",
        "zoom-in": "zoomIn 0.5s ease-out",
        glow: "glow 2s ease-in-out infinite alternate",
        lift: "lift 0.3s ease-out",
        spring: "spring 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        fadeInUp: {
          "0%": { opacity: "0", transform: "translateY(30px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideIn: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(0)" },
        },
        slideLeft: {
          "0%": { transform: "translateX(100%)" },
          "100%": { transform: "translateX(0)" },
        },
        zoomIn: {
          "0%": { transform: "scale(0.8)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        glow: {
          "0%": { boxShadow: "0 0 5px rgba(76, 175, 80, 0.5)" },
          "100%": { boxShadow: "0 0 20px rgba(76, 175, 80, 0.8)" },
        },
        lift: {
          "0%": { transform: "translateY(0) scale(1)" },
          "100%": { transform: "translateY(-5px) scale(1.02)" },
        },
        spring: {
          "0%": { transform: "scale(0.8)" },
          "50%": { transform: "scale(1.05)" },
          "100%": { transform: "scale(1)" },
        },
      },
      boxShadow: {
        soft: "0 2px 15px rgba(0, 0, 0, 0.08)",
        medium: "0 4px 25px rgba(0, 0, 0, 0.1)",
        large: "0 8px 40px rgba(0, 0, 0, 0.15)",
        "glow-green": "0 0 20px rgba(76, 175, 80, 0.3)",
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.25rem",
        "3xl": "1.5rem",
      },
    },
  },
  plugins: [],
};
