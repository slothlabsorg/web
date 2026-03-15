import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'bg-deep':     '#050d1f',
        'bg-surface':  '#0d1b3e',
        'bg-surface2': '#112244',
        primary:       '#4DA6FF',
        cloudorbit:    '#00D4FF',
        cta:           '#F5A623',
        'text-primary':   '#FFFFFF',
        'text-secondary': '#8BA3C7',
        'text-muted':     '#4A6080',
        border:        '#1a3060',
      },
      fontFamily: {
        syne:   ['Syne', 'sans-serif'],
        dm:     ['DM Sans', 'sans-serif'],
        mono:   ['"JetBrains Mono"', '"Fira Code"', 'monospace'],
      },
      borderRadius: {
        card: '12px',
        btn:  '8px',
      },
      animation: {
        float:   'float 4s ease-in-out infinite',
        fadeUp:  'fadeUp 0.6s ease forwards',
        shimmer: 'shimmer 2.5s linear infinite',
        twinkle: 'twinkle 3s ease-in-out infinite',
        'spin-slow': 'spin 8s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-12px)' },
        },
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(24px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition:  '200% center' },
        },
        twinkle: {
          '0%, 100%': { opacity: '0.2', transform: 'scale(1)' },
          '50%':      { opacity: '1',   transform: 'scale(1.3)' },
        },
      },
      backgroundSize: {
        '200': '200% auto',
      },
    },
  },
  plugins: [],
}
export default config
