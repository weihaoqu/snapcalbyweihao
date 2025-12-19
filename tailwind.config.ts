import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        neon: {
          pink: '#FF00FF',
          green: '#39FF14',
          blue: '#00FFFF',
          yellow: '#FFFF00',
          purple: '#B026FF',
          black: '#000000',
          dark: '#111111'
        }
      },
      boxShadow: {
        'neon-pink': '0 0 10px rgba(255, 0, 255, 0.5)',
        'neon-green': '0 0 10px rgba(57, 255, 20, 0.5)',
        'neon-blue': '0 0 10px rgba(0, 255, 255, 0.5)',
      }
    },
  },
  plugins: [],
};

export default config;
