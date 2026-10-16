// import { defineConfig } from "vite";
// import react from "@vitejs/plugin-react-swc";
// import tailwindcss from "@tailwindcss/vite";
// import path from "path";
// import fs from "fs";

// // Define paths to your mkcert-generated certificates
// const keyPath = path.resolve(__dirname, "certs/localhost-key.pem");
// const certPath = path.resolve(__dirname, "certs/localhost.pem");
// export default defineConfig({
//   plugins: [react(), tailwindcss()],
//   resolve: {
//     alias: {
//       "@": path.resolve(__dirname, "./src"),
//     },
//   },
//   server: {
//     https: {
//       key: fs.readFileSync(keyPath),
//       cert: fs.readFileSync(certPath),
//     },
//     host: "localhost",
//     port: 5173,
//   },
// });

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    chunkSizeWarningLimit: 5000,
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-react": ["react", "react-dom", "react-router-dom"],
          "vendor-zoom": ["@zoom/meetingsdk"],
          "vendor-charts": ["recharts"],
          "vendor-socket": ["socket.io-client"],
          "vendor-query": ["@tanstack/react-query"],
          "vendor-lottie": ["lottie-react"],
        },
      },
    },
  },
});
