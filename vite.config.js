import { defineConfig } from "vite";
import { resolve } from "node:path";

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        index: resolve(process.cwd(), "index.html"),
        about: resolve(process.cwd(), "about.html"),
        games: resolve(process.cwd(), "games.html"),
        voices: resolve(process.cwd(), "voices.html"),
        karkiai: resolve(process.cwd(), "karkiai.html")
      }
    }
  }
});
