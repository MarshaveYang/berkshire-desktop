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
        ],
        yahei: [
          '"Microsoft YaHei"',
          '"PingFang SC"',
          '"Hiragino Sans GB"',
          '"Helvetica Neue"',
          "Arial",
          "sans-serif"
        ]
      },
      colors: {
        ink: "#16342a", // 主文字色（深绿灰）
        ink2: "#3f5f4f", // 次要文字色
        mint: {
          50: "#f3faf5",
          100: "#dff3e6",
          200: "#bfe9cf",
          300: "#93d6ac",
          400: "#5cbb85",
          500: "#2f9e64",
          600: "#1f7a4d",
          700: "#155a39"
        }
      }
    }
  },
  plugins: [typography]
};
