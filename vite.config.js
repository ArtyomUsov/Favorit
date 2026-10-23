import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base нужен для GitHub Pages проектной страницы: https://<user>.github.io/<repo>/
// К API обращения идут напрямую по HTTPS (CORS разрешён сервером) — прокси не нужен.
export default defineConfig({
  plugins: [react()],
  base: "/Favorit/",
});
