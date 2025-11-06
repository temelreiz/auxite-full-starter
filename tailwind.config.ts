// tailwind.config.ts
import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        aux: {
          bg: "#0A0A0B",     // ana arka plan
          card: "#121214",   // kart zemini
          accent: "#2A2A2D", // çizgiler/sekonder yüzey
          gold: "#C8A24A",   // altın vurgusu
          silver: "#C0C7CF", // gümüş vurgusu
        },
      },
      boxShadow: {
        soft: "0 6px 24px rgba(0,0,0,0.25)",
      },
      borderRadius: {
        xl2: "1rem",
      },
    },
  },
  plugins: [],
} satisfies Config;
