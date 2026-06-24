import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "/frontend/",
  server: { port: Number(process.env.PORT) || 5173, host: true },
});
