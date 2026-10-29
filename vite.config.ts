import {defineConfig} from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import * as path from "node:path";
import {serviceWorkerPlugin} from "./pwa/plugin";

// https://vite.dev/config/
export default defineConfig({
    plugins: [react(), tailwindcss(), serviceWorkerPlugin()],
    resolve: {
        alias: {"@": path.resolve(import.meta.dirname, "./src")},
    },
    build: {
        target: "es2023",
        sourcemap: false,
        chunkSizeWarningLimit: 600,
        rolldownOptions: {
            output: {
                // Libraries change far less often than app code; separate chunks stay cached across deploys.
                codeSplitting: {
                    groups: [
                        {name: "react", test: /node_modules[\\/](react|react-dom|scheduler|react-router)[\\/]/},
                        {name: "data", test: /node_modules[\\/](@tanstack|axios|i18next|react-i18next|i18next-browser-languagedetector)[\\/]/},
                        {name: "ui", test: /node_modules[\\/](radix-ui|@radix-ui|sonner|lucide-react|@floating-ui)[\\/]/},
                    ],
                },
            },
        },
    },
    test: {
        globals: true,
        environment: "jsdom",
        setupFiles: ["./src/test/setup.ts"],
        css: false,
        coverage: {
            provider: "v8",
            include: ["src/**/*.{ts,tsx}"],
            exclude: ["src/**/*.test.{ts,tsx}", "src/test/**"],
        },
    },
});
