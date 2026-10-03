/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        mobi: {
          50: '#eef2ff',
          100: '#e0e7ff',
          500: '#1565c0',
          600: '#0d47a1',
          700: '#0a387e',
          accent: '#f59e0b',
        },
      },
    },
  },
  plugins: [],
};
