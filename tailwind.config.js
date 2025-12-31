/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class',
    content: [
      "./index.html",
      "./*.{js,ts,jsx,tsx}",
      "./components/**/*.{js,ts,jsx,tsx}",
      "./pages/**/*.{js,ts,jsx,tsx}",
      "./contexts/**/*.{js,ts,jsx,tsx}"
    ],
    theme: {
      extend: {
        colors: {
          tusgu: {
            blue: '#000080',
            dark: '#000050',
            light: '#eef2ff',
            accent: '#2563eb'
          }
        },
        fontFamily: {
          sans: ['Inter', 'sans-serif'],
        },
        boxShadow: {
          'soft': '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
          'glow': '0 0 15px rgba(0, 0, 128, 0.15)',
        }
      },
    },
    plugins: [],
  }