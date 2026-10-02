/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#080606',
        surface: '#141112',
        'surface-2': '#1b1718',
        border: '#2b2527',
        wine: { DEFAULT: '#7d1a2d', hover: '#93213a' },
        gold: { DEFAULT: '#d9b884', soft: '#ecd9ae' },
        ink: '#f4efea',
        muted: '#a39b96',
        success: '#3f9d52',
        danger: '#dc3b30',
        warning: '#e2532a',
      },
      fontFamily: {
        serif: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        sans: ['Sora', 'system-ui', '-apple-system', '"Segoe UI"', 'sans-serif'],
      },
      maxWidth: { container: '1240px' },
      borderRadius: { DEFAULT: '6px' },
    },
  },
  plugins: [],
};
