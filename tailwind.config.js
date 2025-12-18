/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Cyber theme - exact colors from screenshot
        cyber: {
          bg: {
            dark: '#0A0F14',
            darker: '#0E1621',
            card: '#131B26',
          },
          border: {
            DEFAULT: '#1E2A3A',
            light: '#2A3744',
          },
          neon: {
            red: '#FF3B3B',
            blue: '#4C9CFF',
            green: '#3CCF91',
            yellow: '#FFCC4D',
            purple: '#A78BFA',
            pink: '#F472B6',
          },
          text: {
            primary: '#E4EAF0',
            secondary: '#A3ABB5',
            muted: '#6B7280',
          },
        },
      },
      fontFamily: {
        sans: ['Inter', 'Poppins', 'system-ui', 'sans-serif'],
        cyber: ['Orbitron', 'Inter', 'sans-serif'],
      },
      backgroundImage: {
        'cyber-gradient': 'linear-gradient(135deg, #0A0F14 0%, #0E1621 100%)',
        'card-gradient': 'linear-gradient(135deg, #131B26 0%, #1A2332 100%)',
      },
      boxShadow: {
        'cyber-glow': '0 0 20px rgba(255,255,255,0.08)',
        'neon-red': '0 0 20px rgba(255, 59, 59, 0.3)',
        'neon-blue': '0 0 20px rgba(76, 156, 255, 0.3)',
        'neon-green': '0 0 20px rgba(60, 207, 145, 0.3)',
        'neon-yellow': '0 0 20px rgba(255, 204, 77, 0.3)',
      },
      backdropBlur: {
        'xl': '20px',
      },
    },
  },
  plugins: [],
}
