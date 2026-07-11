import typography from "@tailwindcss/typography";

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sys: [
          "-apple-system",
          "BlinkMacSystemFont",
          '"PingFang SC"',
          '"Helvetica Neue"',
          "Helvetica",
          "Arial",
          "sans-serif"
        ]
      },
      backdropBlur: {
        xs: "2px"
      }
    }
  },
  plugins: [typography]
};
