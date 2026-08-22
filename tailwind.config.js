/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#16A34A',
          hover: '#15803D',
          light: '#DCFCE7',
          50: '#F0FDF4',
          100: '#DCFCE7',
          200: '#BBF7D0',
          300: '#86EFAC',
          400: '#4ADE80',
          500: '#22C55E',
          600: '#16A34A',
          700: '#15803D',
          800: '#166534',
          900: '#14532D',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          app: '#F8FAF9',
          hover: '#F1F5F2',
        },
        ink: {
          DEFAULT: '#17201A',
          secondary: '#66736A',
          muted: '#94A39A',
        },
        border: {
          DEFAULT: '#E2E8E4',
          strong: '#D5DDD8',
        },
        success: { DEFAULT: '#16A34A', bg: '#DCFCE7' },
        warning: { DEFAULT: '#D97706', bg: '#FEF3C7' },
        danger: { DEFAULT: '#DC2626', bg: '#FEE2E2' },
        info: { DEFAULT: '#0284C7', bg: '#E0F2FE' },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'Avenir', 'Helvetica', 'Arial', 'sans-serif'],
      },
      borderRadius: {
        btn: '8px',
        card: '12px',
        modal: '16px',
      },
      spacing: {
        '18': '4.5rem',
      },
      boxShadow: {
        'card': '0 1px 2px 0 rgba(0,0,0,0.04)',
        'dropdown': '0 4px 12px -2px rgba(0,0,0,0.08), 0 2px 4px -2px rgba(0,0,0,0.04)',
        'modal': '0 12px 32px -4px rgba(0,0,0,0.12), 0 4px 8px -4px rgba(0,0,0,0.06)',
      },
    },
  },
  plugins: [],
}
