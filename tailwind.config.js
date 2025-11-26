/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        google: {
          green: '#34A853',
          yellow: '#FBBC04',
          red: '#EA4335',
          grey: '#202124',
          text: '#E8EAED'
        }
      }
    },
  },
  plugins: [],
}
