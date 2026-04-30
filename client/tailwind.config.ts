import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: '#0a0a0f',
          secondary: '#12121a',
          tertiary: '#1a1a2e',
          hover: '#22223a',
        },
        text: {
          primary: '#f0f0f5',
          secondary: '#8888aa',
          muted: '#555577',
        },
        accent: {
          yellow: '#FFD700',
          red: '#FF2D55',
          blue: '#00D4FF',
          green: '#00FF88',
          purple: '#A855F7',
        },
        border: {
          DEFAULT: '#2a2a3e',
          glow: 'rgba(255, 215, 0, 0.3)',
        },
      },
      fontFamily: {
        display: ['Rajdhani', 'Oswald', 'sans-serif'],
        body: ['"Exo 2"', 'Barlow', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Fira Code"', 'monospace'],
      },
      backgroundImage: {
        'gradient-fire': 'linear-gradient(135deg, #FF2D55, #FF8C00)',
        'gradient-gold': 'linear-gradient(135deg, #FFD700, #FFA500)',
        'gradient-dark': 'linear-gradient(180deg, #0a0a0f, #12121a)',
      },
      boxShadow: {
        glow: '0 0 24px rgba(255, 215, 0, 0.35)',
        'glow-red': '0 0 24px rgba(255, 45, 85, 0.35)',
        'glow-cyan': '0 0 24px rgba(0, 212, 255, 0.35)',
        'glow-purple': '0 0 24px rgba(168, 85, 247, 0.35)',
      },
      keyframes: {
        pulseSoft: {
          '0%, 100%': { opacity: '0.5' },
          '50%': { opacity: '1' },
        },
        slideUpFade: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        flicker: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.85' },
        },
      },
      animation: {
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
        'slide-up': 'slideUpFade 0.35s ease-out',
        flicker: 'flicker 1.6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
} satisfies Config;
