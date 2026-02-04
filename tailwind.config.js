/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            screens: {
                'xs': '475px',
            },
            colors: {
                brand: {
                    dark: 'var(--bg-app)',      // Mapped to main bg
                    light: 'var(--bg-surface)', // Mapped to secondary
                    accent: 'var(--brand-accent)',
                    purple: 'var(--brand-purple)',
                    pink: 'var(--brand-pink)'
                },
                app: {
                    bg: 'var(--bg-app)',
                    card: 'var(--bg-card)',
                    surface: 'var(--bg-surface)', // New utility
                    text: 'var(--text-main)',
                    subtext: 'var(--text-sub)',
                    border: 'var(--border-app)'
                }
            },
            fontFamily: {
                sans: ['Inter', 'Poppins', 'sans-serif'],
            },
            animation: {
                'fade-in': 'fadeIn 0.5s ease-out',
                'slide-up': 'slideUp 0.5s ease-out',
                'pulse-slow': 'pulse 3s infinite',
                'spin-slow': 'spin 3s linear infinite',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideUp: {
                    '0%': { transform: 'translateY(20px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                }
            }
        },
    },
    plugins: [],
}
