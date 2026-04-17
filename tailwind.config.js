export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        forest: '#0d3023',
        pine: '#1a7252',
        grove: '#2d915f',
        sun: '#f4c146',
        ember: '#ed5632',
        sky: '#4fa2db',
        ink: '#231f20',
        cream: '#f6f0e5',
        mist: '#e7ddce',
      },
      fontFamily: {
        display: [
          '"GT Alpina Condensed Light"',
          '"Cormorant Garamond"',
          '"Iowan Old Style"',
          '"Baskerville"',
          '"Times New Roman"',
          'serif',
        ],
        body: [
          '"Articulat CF Regular"',
          '"Avenir Next"',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Arial',
          'sans-serif',
        ],
        cta: [
          '"Articulat CF Bold"',
          '"Avenir Next Demi Bold"',
          '"Avenir Next"',
          'system-ui',
          'sans-serif',
        ],
        accent: [
          '"GT Alpina Condensed Light Italic"',
          '"Cormorant Garamond"',
          '"Iowan Old Style"',
          '"Times New Roman"',
          'serif',
        ],
      },
      boxShadow: {
        soft: '0 18px 50px rgba(35, 31, 32, 0.08)',
        lift: '0 12px 28px rgba(13, 48, 35, 0.12)',
      },
    },
  },
  plugins: [],
}
