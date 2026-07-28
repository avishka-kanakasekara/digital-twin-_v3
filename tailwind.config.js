/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "var(--border-subtle)",
        input: "var(--border-subtle)",
        ring: "var(--color-primary-light)",
        background: "var(--bg-main)",
        foreground: "var(--text-primary)",
        primary: {
          DEFAULT: "var(--color-primary)",
          foreground: "var(--text-inverse)",
          hover: "var(--color-primary-hover)",
          light: "var(--color-primary-light)",
        },
        secondary: {
          DEFAULT: "var(--color-secondary)",
          foreground: "var(--text-inverse)",
          light: "var(--color-secondary-light)",
        },
        destructive: {
          DEFAULT: "var(--color-danger)",
          foreground: "var(--text-inverse)",
          light: "var(--color-danger-light)",
        },
        muted: {
          DEFAULT: "var(--bg-main)",
          foreground: "var(--text-tertiary)",
        },
        accent: {
          DEFAULT: "var(--color-info)",
          foreground: "var(--text-inverse)",
        },
        success: {
          DEFAULT: "var(--color-success)",
          light: "var(--color-success-light)",
        },
        warning: {
          DEFAULT: "var(--color-warning)",
          light: "var(--color-warning-light)",
          dark: "#d97706",
        },
        info: {
          DEFAULT: "var(--color-info)",
          light: "#e0f2fe",
        },
      },
      borderRadius: {
        lg: "var(--radius-lg)",
        md: "var(--radius-md)",
        sm: "var(--radius-sm)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards",
      },
    },
  },
  plugins: [],
}
