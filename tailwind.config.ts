import type { Config } from "tailwindcss";

/*
  Tulivo Digital. Colours are the brand tokens from brand/tokens.json, exposed
  as rgb triplets so Tailwind can compose them with alpha. One typeface does
  all the work, Switzer, with Cormorant Garamond kept for the wordmark alone.
*/
const config: Config = {
  content: ["./src/app/**/*.{ts,tsx}", "./src/components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        tulivo: {
          canvas: "rgb(var(--t-canvas) / <alpha-value>)",
          section: "rgb(var(--t-section) / <alpha-value>)",
          card: "rgb(var(--t-card) / <alpha-value>)",
          dark: "rgb(var(--t-dark) / <alpha-value>)",
          navy: "rgb(var(--t-navy) / <alpha-value>)",
          purple: "rgb(var(--t-purple) / <alpha-value>)",
          plum: "rgb(var(--t-plum) / <alpha-value>)",
          lilac: "rgb(var(--t-lilac) / <alpha-value>)",
          head: "rgb(var(--t-head) / <alpha-value>)",
          ink: "rgb(var(--t-ink) / <alpha-value>)",
          muted: "rgb(var(--t-muted) / <alpha-value>)",
          faint: "rgb(var(--t-faint) / <alpha-value>)",
          "on-navy": "rgb(var(--t-on-navy) / <alpha-value>)",
          "muted-navy": "rgb(var(--t-muted-navy) / <alpha-value>)",
          "muted-cream": "rgb(var(--t-muted-cream) / <alpha-value>)",
          line: "rgb(var(--t-line) / <alpha-value>)",
          hairline: "rgb(var(--t-hairline) / <alpha-value>)",
          green: "rgb(var(--t-green) / <alpha-value>)",
          amber: "rgb(var(--t-amber) / <alpha-value>)",
          red: "rgb(var(--t-red) / <alpha-value>)",
        },
      },
      fontFamily: {
        sans: ["var(--font-switzer)", "ui-sans-serif", "system-ui", "sans-serif"],
        /* The wordmark, and nothing else. */
        wordmark: ["var(--font-cormorant)", "Georgia", "serif"],
      },
      borderRadius: {
        pill: "999px",
      },
      maxWidth: {
        content: "1080px",
      },
    },
  },
  plugins: [],
};

export default config;
