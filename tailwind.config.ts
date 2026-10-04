import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        tomato: { DEFAULT: '#E63B2E', dark: '#B72A20', light: '#FF6B57' },
        mustard: { DEFAULT: '#F5B82E', dark: '#C98F10', light: '#FFD866' },
        orange: { DEFAULT: '#F28C28', dark: '#C46A12' },
        toast: { DEFAULT: '#9A5B2B', dark: '#6B3A17', light: '#C98A4B' },
        cream: { DEFAULT: '#FFF3DC', dark: '#F5DFB5' },
        ink: '#3B1F0E',
        leaf: { DEFAULT: '#5FB84A', dark: '#3E8A30' },
      },
      fontFamily: {
        display: ['"Lilita One"', 'system-ui', 'sans-serif'],
        body: ['Nunito', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 6px 0 rgba(59,31,14,0.25), 0 10px 18px rgba(59,31,14,0.18)',
        chunk: '0 5px 0 #3B1F0E',
      },
    },
  },
} satisfies Config
