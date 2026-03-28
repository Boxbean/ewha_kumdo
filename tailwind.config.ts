import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        'ewha-green': '#00462A',
        'ewha-pear':  '#FFFDF1',
        'ewha-grey':  '#B9B9B9',
      },
    },
  },
  plugins: [],
};
export default config;
