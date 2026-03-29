/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Core palette — uses CSS variables for theme switching
        surface: {
          DEFAULT: 'var(--color-surface)',
          50: 'var(--color-surface-50)',
          100: 'var(--color-surface-100)',
          200: 'var(--color-surface-200)',
          300: 'var(--color-surface-300)',
          400: 'var(--color-surface-400)',
        },
        foreground: 'var(--color-foreground)',
        // Severity scale
        severity: {
          low: '#facc15',
          moderate: '#f97316',
          high: '#ef4444',
          extreme: '#991b1b',
          critical: '#7f1d1d',
        },
        // Accent
        accent: {
          DEFAULT: '#3b82f6',
          glow: '#60a5fa',
          dim: '#1e40af',
        },
        // Neutral
        muted: {
          DEFAULT: '#64748b',
          light: '#94a3b8',
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
        body: ['var(--font-body)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.875rem' }],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'slide-left': 'slideLeft 0.3s ease-out',
        'globe-rotate': 'globeRotate 60s linear infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'scan-line': 'scanLine 4s linear infinite',
        'hero-fade-down': 'heroFadeDown 0.8s ease-out forwards',
        'hero-fade-up': 'heroFadeUp 0.8s ease-out forwards',
        'shimmer': 'shimmer 3s linear infinite',
        'float-up': 'floatUp 3s ease-out infinite',
        'orb-1': 'orbDrift1 25s ease-in-out infinite',
        'orb-2': 'orbDrift2 30s ease-in-out infinite',
        'orb-3': 'orbDrift3 35s ease-in-out infinite',
        'aurora': 'auroraSweep 40s ease-in-out infinite',
        'particle': 'particleFloat 8s ease-in-out infinite',
        'nav-border': 'navBorderGlow 6s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideLeft: {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        globeRotate: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(59, 130, 246, 0.3)' },
          '100%': { boxShadow: '0 0 20px rgba(59, 130, 246, 0.6)' },
        },
        scanLine: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
        flipIn: {
          '0%': { opacity: '0', transform: 'rotateX(-90deg) scale(0.8)' },
          '60%': { opacity: '1', transform: 'rotateX(10deg) scale(1.02)' },
          '100%': { opacity: '1', transform: 'rotateX(0deg) scale(1)' },
        },
      },
      backgroundImage: {
        'grid-pattern': 'linear-gradient(rgba(59, 130, 246, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(59, 130, 246, 0.03) 1px, transparent 1px)',
        'radial-glow': 'radial-gradient(ellipse at center, rgba(59, 130, 246, 0.08) 0%, transparent 70%)',
      },
      backgroundSize: {
        'grid-pattern': '40px 40px',
      },
    },
  },
  plugins: [],
}
