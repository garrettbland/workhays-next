module.exports = {
    content: ['./pages/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Lexend Deca', 'sans-serif'],
            },
        },
    },
    variants: {
        extend: {},
    },
    plugins: [require('@tailwindcss/typography'), require('@tailwindcss/line-clamp')],
}
