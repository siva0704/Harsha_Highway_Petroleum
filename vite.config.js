import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from "path"

// https://vitejs.dev/config/
export default defineConfig({
    base: '/Harsha_Highway_Petroleum/',
    plugins: [
        react(),
        // VitePWA({ ... }) - Disabled to fix missing asset build error
    ],
    registerType: 'autoUpdate',
    includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
    manifest: {
        name: 'CasiFuel - Invoice Generator',
        short_name: 'CasiFuel',
        description: 'Local-first Fuel Invoice & Statement Generator',
        theme_color: '#ffffff',
        icons: [
            {
                src: 'pwa-192x192.svg',
                sizes: '192x192',
                type: 'image/svg+xml'
            },
            {
                src: 'pwa-192x192.svg',
                sizes: '512x512',
                type: 'image/svg+xml'
            }
        ]
    }
})
    ],
resolve: {
    alias: {
        "@": path.resolve(__dirname, "./src"),
        },
},
})
