import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      /* -------------------------------------------------------
       * BRAND COLORS
       * Change these to reskin the entire app.
       * Usage: className="bg-brand-bg text-brand-gold" etc.
       * ------------------------------------------------------- */
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

      /* -------------------------------------------------------
       * FONTS
       * display = headings (Playfair Display, serif)
       * sans    = body text (Inter, sans-serif)
       * Set via CSS variables in layout.tsx (next/font/google)
       * ------------------------------------------------------- */
      fontFamily: {
        display: ["var(--font-display)", "ui-serif", "Georgia", "serif"],
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
      },

      /* -------------------------------------------------------
       * LETTER SPACING
       * luxe = tighter spacing for subtitles / labels (0.18em)
       * Default heading tracking is 0.22em (set inline)
       * ------------------------------------------------------- */
      letterSpacing: {
        luxe: "0.18em",
      },

      /* -------------------------------------------------------
       * SHADOWS
       * luxe = deep card shadow for elevated panels
       * ------------------------------------------------------- */
      boxShadow: {
        luxe: "0 10px 40px rgba(0,0,0,0.55)",
      },

      /* -------------------------------------------------------
       * BACKGROUND IMAGES
       * hero-radial = subtle gold glow at top of page
       * grain       = SVG noise texture overlay (14% opacity)
       * Both applied to <body> in globals.css
       * ------------------------------------------------------- */
      backgroundImage: {
        "hero-radial":
          "radial-gradient(80% 60% at 50% 0%, rgba(201,162,77,0.20) 0%, rgba(11,11,11,0) 60%)",
        "grain":
          "url('data:image/svg+xml,%3Csvg xmlns=\"http://www.w3.org/2000/svg\" width=\"160\" height=\"160\"%3E%3Cfilter id=\"n\"%3E%3CfeTurbulence type=\"fractalNoise\" baseFrequency=\".9\" numOctaves=\"3\" stitchTiles=\"stitch\"/%3E%3C/filter%3E%3Crect width=\"160\" height=\"160\" filter=\"url(%23n)\" opacity=\".14\"/%3E%3C/svg%3E')",
      },
    },
  },
  plugins: [],
} satisfies Config;
