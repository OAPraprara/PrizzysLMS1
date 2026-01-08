/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        prizzys: {
          DEFAULT: '#ff6800',
          hover: '#e65e00',
          dark: '#cc5200',
        },
        dark: {
          900: '#121212',
          800: '#1e1e1e',
          700: '#2d2d2d',
          600: '#3d3d3d',
        }
      }
    }
  },
  plugins: [],
}