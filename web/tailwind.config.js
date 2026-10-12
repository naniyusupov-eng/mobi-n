/** @type {import('tailwindcss').Config} */
// Click-style theme: bright brand blue, soft blue-grey canvas, white rounded cards, Inter.
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#EEF5FF',
          100: '#E0ECFF',
          200: '#BCD6FF',
          500: '#0B6BFF',
          600: '#0A5FE3',
          700: '#0850C0',
        },
        canvas: '#F1F4F9',
        ink: {
          900: '#101828',
          700: '#344054',
          500: '#667085',
          400: '#98A2B3',
          200: '#E4E7EC',
          100: '#F0F2F6',
        },
      },
      borderRadius: {
        card: '22px',
        xl2: '16px',
      },
      boxShadow: {
        card: '0 1px 2px rgba(16, 24, 40, 0.04)',
        pop: '0 12px 32px rgba(16, 24, 40, 0.12)',
      },
    },
  },
  plugins: [],
};
