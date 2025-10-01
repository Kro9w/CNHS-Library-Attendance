import path from "path"
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react' // Make sure the React plugin is imported
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(), // The React plugin is necessary for your app to work
    tailwindcss(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})