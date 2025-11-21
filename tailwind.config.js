/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html", 
    "./src/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.jsx",
    "./src/**/*.js"
  ],
  theme: {
    extend: {
      colors: {
        'custom-blue': '#E0F2F7',
        'custom-dark-blue': '#1A237E',
        'pastel-blue': '#00CCFF',
        'pastel-blue-light': '#33D6FF',
        'pastel-blue-lighter': '#99EBFF',
        'pastel-blue-dark': '#00B8E6',
        'pastel-blue-darker': '#0099B3',
      }
    },
  },
  plugins: [],
};
