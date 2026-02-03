import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        library: {
          blue: '#2563eb',
          'blue-dark': '#1e40af',
          'blue-light': '#3b82f6',
        },
      },
    },
  },
  plugins: [],
}
export default config
