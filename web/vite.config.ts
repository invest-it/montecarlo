// vite.config.ts
import { defineConfig } from "vite";
import path from "path";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
    plugins: [react(), tailwindcss()],
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
    server: {
        cors: false,
        proxy: {
            // Proxy API calls to Bun
            "/api": "http://localhost:3000",
            // Proxy WebSockets (Socket.io) to Bun
            "/socket.io": {
                target: "ws://localhost:3000",
                ws: true,
            },
        },
    },
});
