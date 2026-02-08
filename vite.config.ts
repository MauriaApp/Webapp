import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

// https://vitejs.dev/config/
export default defineConfig(() => {
    const basePath = process.env.VITE_BASE_PATH ?? "/";

    return {
        base: basePath,
        plugins: [react()],
        resolve: {
            alias: {
                "@": resolve(__dirname, "./src"),
            },
        },
        build: {
            outDir: "dist",
            rollupOptions: {
                output: {
                    entryFileNames: "assets/mauriajs.js",
                    assetFileNames: "assets/mauriacss[extname]",
                },
            },
        },
    };
});
