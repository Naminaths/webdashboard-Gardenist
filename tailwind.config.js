/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: "class",
    theme: {
        extend: {
            colors: {
                primary: "#10B981", // Emerald 500
                "primary-hover": "#059669", // Emerald 600
                "background-light": "#ecfdf5", // emerald-50 base
                "background-dark": "#0f172a", // slate-900
                "surface-light": "#ffffff",
                "surface-dark": "#1e293b", // slate-800
                "subtle-light": "#d1fae5", // emerald-100
                "subtle-dark": "#334155", // slate-700
            },
            fontFamily: {
                display: ["'Plus Jakarta Sans'", "sans-serif"],
                body: ["'Inter'", "sans-serif"],
            },
            boxShadow: {
                'glow': '0 0 20px rgba(16, 185, 129, 0.3)',
                'card': '0 10px 30px -5px rgba(0, 0, 0, 0.1)',
            }
        },
    },
    plugins: [
        require('@tailwindcss/forms'),
        require('@tailwindcss/typography'),
    ],
}
