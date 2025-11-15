/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: 'var(--accent)',
        accent: 'var(--accent)',
        accentStart: 'var(--accent-start)',
        accentEnd: 'var(--accent-end)',
        surface: 'var(--surface)',
        muted: 'var(--muted)',
        text: 'var(--text)',
        bg: 'var(--bg)',
        glass: 'rgba(255,255,255,0.03)',
        'glass-strong': 'rgba(255,255,255,0.06)',
        border: 'var(--border)',
        error: 'var(--error)',
        success: 'var(--success)',
        card: 'var(--card)',
        'text-muted': 'var(--text-muted)',
      },
      borderRadius: {
        lg: 'var(--radius-lg)',
        md: 'var(--radius-md)',
        sm: 'var(--radius-sm)'
      },
      boxShadow: {
        'lynqar-lg': 'var(--shadow-lg)'
      },
      transitionDuration: {
        200: '200ms',
        320: '320ms'
      },
      screens: {
        md: '900px',
        lg: '1200px'
      }
    },
  },
  plugins: [],
}
