import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base must match the GitHub Pages project path:
// https://<username>.github.io/DataMartEnterpriseSuite/
export default defineConfig({
  base: '/DataMartEnterpriseSuite/',
  plugins: [react()],
  server: {
    port: 5173,
    open: true,
  },
})
