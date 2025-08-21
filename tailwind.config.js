/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          bg: '#0f0f23',
          surface: '#1a1a2e',
          card: '#16213e',
          primary: '#0f3460',
          accent: '#e94560',
          text: '#e5e5e5',
          muted: '#a0a0a0'
        }
      }
    },
  },
  plugins: [],
}
