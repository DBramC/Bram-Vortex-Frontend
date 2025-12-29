import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite' // <--- 1. Import αυτό

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        react(),
        tailwindcss(), // <--- 2. Προσθήκη στα plugins
    ],
})