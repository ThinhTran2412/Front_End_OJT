/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html", 
    "./src/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.jsx",
    "./src/**/*.js",
    "./node_modules/@tremor/**/*.{js,ts,jsx,tsx}"
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
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar))',
          foreground: 'hsl(var(--sidebar-foreground))',
          primary: 'hsl(var(--sidebar-primary))',
          'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
          accent: 'hsl(var(--sidebar-accent))',
          'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
          border: 'hsl(var(--sidebar-border))',
          ring: 'hsl(var(--sidebar-ring))',
        },
      }
    },
  },
  plugins: [],
};
