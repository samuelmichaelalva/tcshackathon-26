/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        darkbg: '#080C14',
        darkcard: '#0F1626',
        darkcardborder: '#1E293B',
      }
    },
  },
  plugins: [],
}
