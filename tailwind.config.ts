import type { Config } from "tailwindcss";

/*
  Tulivo Digital — a light-only palette for a client-facing product: warm ivory
  paper, espresso ink, terracotta accent, muted gold detailing. Colours are rgb
  triplets so Tailwind can compose them with alpha.
*/
const config: Config = {
  content: ["./src/app/**/*.{ts,tsx}", "./src/components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        tulivo: {
          canvas: "rgb(var(--t-canvas) / <alpha-value>)",
          card: "rgb(var(--t-card) / <alpha-value>)",
          veil: "rgb(var(--t-veil) / <alpha-value>)",
          ink: "rgb(var(--t-ink) / <alpha-value>)",
          muted: "rgb(var(--t-muted) / <alpha-value>)",
          faint: "rgb(var(--t-faint) / <alpha-value>)",
          line: "rgb(var(--t-line) / <alpha-value>)",
          hairline: "rgb(var(--t-hairline) / <alpha-value>)",
          clay: "rgb(var(--t-clay) / <alpha-value>)",
          "clay-deep": "rgb(var(--t-clay-deep) / <alpha-value>)",
          "clay-soft": "rgb(var(--t-clay-soft) / <alpha-value>)",
          gold: "rgb(var(--t-gold) / <alpha-value>)",
          "gold-soft": "rgb(var(--t-gold-soft) / <alpha-value>)",
          green: "rgb(var(--t-green) / <alpha-value>)",
          amber: "rgb(var(--t-amber) / <alpha-value>)",
          red: "rgb(var(--t-red) / <alpha-value>)",
        },
      },
      fontFamily: {
        display: ["var(--font-inter)", "Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        sans: ["var(--font-inter)", "Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      maxWidth: {
        content: "1080px",
      },
    },
  },
  plugins: [],
};

export default config;
