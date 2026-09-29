import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: "/",
  build: {
    assetsDir: "assets",
    rollupOptions: {
      output: {
        // Content hashes, not predictable names.
        //
        // A fixed `assets/app.js` cannot be cached safely: cache it by age
        // and a deploy serves new HTML against an old bundle until the age
        // expires; refuse to cache it and every visit re-downloads 400 KB.
        // A hash gives both — the URL changes whenever the bytes do, so the
        // file can be cached forever and an update is picked up instantly.
        entryFileNames: "assets/app-[hash].js",
        chunkFileNames: "assets/[name]-[hash].js",
        assetFileNames: (info) =>
          (info.name || "").endsWith(".css")
            ? "assets/app-[hash].css"
            : "assets/[name]-[hash][extname]",
      },
    },
  },
})
