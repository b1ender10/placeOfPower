import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { happyDataPlugin } from './vite-plugin-happy-data'

export default defineConfig({
  plugins: [react(), happyDataPlugin()],
  server: {
    port: 5174
  }
})
