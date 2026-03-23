/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['var(--font-display)', 'serif'],
        body: ['var(--font-body)', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      colors: {
        forest: {
          50: '#f0f7f0',
          100: '#dceedd',
          200: '#bad8bc',
          300: '#8fbb92',
          400: '#5f9762',
          500: '#3d7a41',
          600: '#2d6131',
          700: '#254f28',
          800: '#1f4022',
          900: '#1a351c',
          950: '#0d1f0e',
        },
        gold: {
          50: '#fefce8',
          100: '#fdf5c4',
          200: '#faea88',
          300: '#f5d641',
          400: '#efc020',
          500: '#d9a10e',
          600: '#b87d0a',
          700: '#935b0c',
          800: '#794811',
          900: '#673c14',
        },
        cream: '#faf8f3',
        charcoal: '#1a1a1a',
      },
      animation: {
        'fade-up': 'fadeUp 0.6s ease forwards',
        'fade-in': 'fadeIn 0.4s ease forwards',
        'slide-right': 'slideRight 0.5s ease forwards',
        'counter': 'counter 2s ease forwards',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'draw': 'draw 1.5s ease forwards',
      },
      keyframes: {
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(24px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        slideRight: {
          from: { opacity: '0', transform: 'translateX(-24px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        draw: {
          from: { strokeDashoffset: '1000' },
          to: { strokeDashoffset: '0' },
        },
      },
      backdropBlur: { xs: '2px' },
    },
  },
  plugins: [],
}
