import typography from '@tailwindcss/typography';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cq: {
          bg: '#17100A',
          surface: '#1C140C',
          panel: '#211812',
          ink: '#F5EEE3',
          sub: '#AC9C86',
          faint: '#8B7C67',
          line: 'rgba(255,255,255,0.08)',
          coral: '#FF6B4A',
          amber: '#FF8A3D',
          gold: '#FFC98A',
          'on-accent': '#2A1608',
        },
      },
      fontFamily: {
        sans: ['Manrope', 'Noto Sans SC', 'system-ui', 'sans-serif'],
        display: ['Space Grotesk', 'Noto Sans SC', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      boxShadow: {
        'cq-accent': '0 12px 28px rgba(255,107,74,0.40)',
        'cq-card': '0 12px 40px rgba(0,0,0,0.35)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        blob: {
          '0%,100%': { transform: 'translate(0px,0px) scale(1)' },
          '33%': { transform: 'translate(20px,-30px) scale(1.1)' },
          '66%': { transform: 'translate(-15px,15px) scale(0.95)' },
        },
        float: {
          '0%,100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out both',
        'fade-in-up': 'fadeInUp 0.6s ease-out both',
        blob: 'blob 8s ease-in-out infinite',
        float: 'float 6s ease-in-out infinite',
      },
    },
  },
  plugins: [
    typography,
  ],
}
