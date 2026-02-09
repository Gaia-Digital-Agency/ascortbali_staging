// This is the Tailwind CSS configuration file for the web application.
import type { Config } from "tailwindcss";

export default {
  // Configure files to scan for Tailwind classes.
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  // Extend Tailwind's default theme with custom values.
  theme: {
    extend: {
      // Define custom brand colors for easy theming.
      colors: {
        brand: {
          bg: "#0b0b0b",        // Page background (near-black)
          surface: "#141414",   // Card / panel background
          surface2: "#1b1b1b",  // Secondary surface (slightly lighter)
          line: "#2a2a2a",      // Borders, dividers, outlines
          text: "#f3f3f3",      // Primary text (off-white)
          muted: "#b6b0a6",     // Secondary text (warm gray)
          gold: "#c9a24d",      // Primary accent (gold)
          gold2: "#b89242",     // Accent hover state (darker gold)
        },
      },

      // Define custom font families, linked to CSS variables.
      fontFamily: {
        display: ["var(--font-display)", "ui-serif", "Georgia", "serif"], // Headings
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],     // Body text
      },

      // Define custom letter spacing utilities.
      letterSpacing: {
        luxe: "0.18em", // Tighter spacing for subtitles/labels
      },

      // Define custom box shadow utilities.
      boxShadow: {
        luxe: "0 10px 40px rgba(0,0,0,0.55)", // Deep card shadow
      },

      // Define custom background images.
      backgroundImage: {
        "hero-radial":
          "radial-gradient(80% 60% at 50% 0%, rgba(201,162,77,0.20) 0%, rgba(11,11,11,0) 60%)", // Subtle gold glow
        "grain":
          "url('data:image/svg+xml,%3Csvg xmlns=\"http://www.w3.org/2000/svg\" width=\"160\" height=\"160\"%3E%3Cfilter id=\"n\"%3E%3CfeTurbulence type=\"fractalNoise\" baseFrequency=\".9\" numOctaves=\"3\" stitchTiles=\"stitch\"/%3E%3C/filter%3E%3Crect width=\"160\" height=\"160\" filter=\"url(%23n)\" opacity=\".14\"/%3E%3C/svg%3E')", // SVG noise texture overlay
      },
    },
  },
  plugins: [], // No additional Tailwind plugins are used.
} satisfies Config;
