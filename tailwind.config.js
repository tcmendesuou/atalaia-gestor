/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        green: {
          dark:   "#1A3A17",
          mid:    "#2D5A27",
          light:  "#4CAF50",
          pale:   "#F0FAF0",
          tint:   "#D4E8D1",
        },
        orange: {
          main:   "#F5A623",
          light:  "#FFF8ED",
          dark:   "#7A3F00",
        }
      }
    }
  },
  plugins: []
}