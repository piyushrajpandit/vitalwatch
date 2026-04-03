import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        clinical: {
          dark: "#050B14",
          card: "#0A1628",
          border: "#172A46",
          normal: "#10B981",  // Green
          warning: "#F59E0B", // Yellow
          critical: "#EF4444", // Red
          text: "#E2E8F0"
        },
        navy: {
          900: "#0A0F1A",
          800: "#111827",
          700: "#1F2937",
        }
      },
      animation: {
        'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-down': 'slideDown 0.3s ease-out forwards',
        'slide-right': 'slideRight 0.3s ease-out forwards',
        'heartbeat': 'heartbeat 1.5s ease-in-out infinite',
        'breathe': 'breathe 3s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'float': 'float 4s ease-in-out infinite',
        'gradient': 'gradient 8s linear infinite',
      },
      keyframes: {
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideRight: {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        heartbeat: {
          '0%, 100%': { transform: 'scale(1)', opacity: '1' },
          '15%': { transform: 'scale(1.2)' },
          '30%': { transform: 'scale(1)' },
          '45%': { transform: 'scale(1.15)' },
          '60%': { transform: 'scale(1)' },
        },
        breathe: {
          '0%, 100%': { opacity: '0.6', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.05)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(239,68,68,0.2)', borderColor: 'rgba(239,68,68,0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(239,68,68,0.5)', borderColor: 'rgba(239,68,68,0.6)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        }
      }
    },
  },
  plugins: [],
};
export default config;
