/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        red: {
          mica: '#FF0032',
        },
        cream: {
          DEFAULT: '#FAF7F2',
          muted: '#F3EFE8',
        },
      },
      fontFamily: {
        display: ['"Instrument Sans"', 'sans-serif'],
        mono: ['"Space Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
}
