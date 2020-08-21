module.exports = {
  theme: {
    extend: {
      height: {
        game: 600,
      },
    },
  },
  variants: {},
  plugins: [],
  purge: ['./components/**/*.{js,ts,jsx,tsx}', './pages/**/*.{js,ts,jsx,tsx}'],
  future: {
    removeDeprecatedGapUtilities: true,
  },
}
