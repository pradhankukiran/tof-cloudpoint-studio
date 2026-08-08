/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cad: {
          bg: '#f8fafc',
          panel: '#ffffff',
          sidebar: '#f1f5f9',
          border: '#cbd5e1',
          borderLight: '#e2e8f0',
          text: '#0f172a',
          textMuted: '#475569',
          textSubtle: '#64748b',
          primary: '#2563eb',
          primaryHover: '#1d4ed8',
          success: '#16a34a',
          warning: '#d97706',
          danger: '#dc2626'
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        sans: ['Plus Jakarta Sans', 'Segoe UI', 'sans-serif']
      }
    },
  },
  plugins: [],
}
