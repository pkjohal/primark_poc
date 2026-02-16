/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primark Brand Colors
        'primark-blue': '#0DAADB',
        'primark-navy': '#1A1F36',
        'primark-light-blue': '#E5F6FC',
        'primark-red': '#DC2626',
        'primark-green': '#10B981',
        'primark-amber': '#F59E0B',
        'primark-grey': '#6B7280',
        'primark-light-grey': '#F3F4F6',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
