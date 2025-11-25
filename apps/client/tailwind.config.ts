import type { Config } from "tailwindcss";
import daisyui from "daisyui";
import typography from "@tailwindcss/typography";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  plugins: [daisyui, typography],
} satisfies Config;
