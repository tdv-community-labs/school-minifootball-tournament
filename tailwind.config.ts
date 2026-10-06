import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./index.html",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border, 240 3.7% 15.9%))",
        input: "hsl(var(--input, 240 3.7% 15.9%))",
        ring: "hsl(var(--ring, 142.1 76.2% 36.3%))",
        background: "hsl(var(--background, 240 10% 3.9%))",
        foreground: "hsl(var(--foreground, 0 0% 98%))",
        primary: {
          DEFAULT: "hsl(var(--primary, 142.1 76.2% 36.3%))",
          foreground: "hsl(var(--primary-foreground, 355.7 100% 97.3%))",
        },
        card: {
          DEFAULT: "hsl(var(--card, 240 10% 3.9%))",
          foreground: "hsl(var(--card-foreground, 0 0% 98%))",
        },
        pitch: {
          dark: "#05160d",
          green: "#10b981",
          gold: "#f59e0b",
        },
      },
      borderRadius: {
        lg: "var(--radius, 0.75rem)",
        md: "calc(var(--radius, 0.75rem) - 2px)",
        sm: "calc(var(--radius, 0.75rem) - 4px)",
      },
    },
  },
  plugins: [],
};
export default config;
