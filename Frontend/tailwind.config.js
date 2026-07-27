import typography from '@tailwindcss/typography';

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['selector', '[data-theme="dark"]'],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cq: {
          bg: 'var(--cq-bg)',
          bg2: 'var(--cq-bg2)',
          panel: 'var(--cq-panel)',
          panel2: 'var(--cq-panel2)',
          card: 'var(--cq-card)',
          surface: 'var(--cq-surface)',
          line: 'var(--cq-line)',
          line2: 'var(--cq-line2)',
          ink: 'var(--cq-ink)',
          sub: 'var(--cq-sub)',
          faint: 'var(--cq-faint)',
          nav: 'var(--cq-nav)',
          acc: 'var(--cq-acc)',
          acc2: 'var(--cq-acc2)',
          'acc-soft': 'var(--cq-acc-soft)',
          'on-accent': 'var(--cq-on-accent)',
          // gradient aliases (from-cq-coral → to-cq-amber)
          coral: 'var(--cq-acc)',
          amber: 'var(--cq-acc2)',
          ok: 'var(--cq-ok)',
          'ok-soft': 'var(--cq-ok-soft)',
          bad: 'var(--cq-bad)',
          'bad-soft': 'var(--cq-bad-soft)',
          gold: 'var(--cq-gold)',
          'gold-soft': 'var(--cq-gold-soft)',
        },
      },
      fontFamily: {
        sans: ['Manrope', 'Noto Sans SC', 'system-ui', 'sans-serif'],
        display: ['Space Grotesk', 'Noto Sans SC', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      boxShadow: {
        'cq-accent': '0 10px 22px var(--cq-acc-soft)',
        'cq-card': 'var(--cq-shadow)',
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
