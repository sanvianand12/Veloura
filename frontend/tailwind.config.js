/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ivory: {
          50: '#FDFBF7',
          100: '#FBF7F0',
          200: '#F4EFE6',
          300: '#E8DFC9',
          400: '#D9C8A8',
          500: '#BDB198',
          600: '#8C7E6D',
          700: '#685F53',
          800: '#3D362F',
          900: '#231E19',
        },
        terracotta: {
          50: '#FDF5F2',
          100: '#FCE7DF',
          200: '#FACDC0',
          300: '#F4A590',
          400: '#E67759',
          500: '#C85A32', // Core terracotta
          600: '#B04723',
          700: '#8E3316',
          800: '#722912',
          900: '#5A200D',
        },
        coral: {
          50: '#FFF6F4',
          100: '#FFEBE6',
          200: '#FFD5CC',
          300: '#FFB3A3',
          400: '#FA8773',
          500: '#E76F51', // Soft luminous coral
          600: '#D25537',
          700: '#AB3E25',
          800: '#8C311C',
        },
        teal: {
          50: '#F0F6F5',
          100: '#DEEDE9',
          200: '#BFDDD6',
          300: '#8DC2B7',
          400: '#529F92',
          500: '#26796E',
          600: '#1C5F56',
          700: '#174A43',
          800: '#143B36', // Deep regal teal
          900: '#0F2925',
          950: '#071714',
        },
        marigold: {
          50: '#FEF9EC',
          100: '#FDF1CE',
          200: '#FBE19A',
          300: '#F6CB5C',
          400: '#F0B126',
          500: '#E59500', // Celebratory marigold
          600: '#C77500',
          700: '#9E5500',
          800: '#7E4205',
        },
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'Cambria', '"Times New Roman"', 'serif'],
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'warm-sm': '0 1px 3px rgba(35, 30, 25, 0.05), 0 1px 2px rgba(35, 30, 25, 0.03)',
        'warm': '0 4px 16px -2px rgba(35, 30, 25, 0.07), 0 2px 6px -2px rgba(35, 30, 25, 0.04)',
        'warm-lg': '0 12px 32px -4px rgba(35, 30, 25, 0.1), 0 4px 12px -2px rgba(35, 30, 25, 0.06)',
      },
      scale: {
        '98': '0.98',
      },
    },
  },
  plugins: [],
}

