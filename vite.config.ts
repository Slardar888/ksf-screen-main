import path from "node:path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { kesiEditorTransform } from "./kesi-editor.transform"

// 后端地址：平台拉起 dev server 时注入 KESI_SERVER_URL（同机回环）；
// http://192.168.99.103:3000 为创建时脚手架写入的兜底值，供脱离平台独立开发使用
const SERVER_URL = process.env.KESI_SERVER_URL || "http://192.168.99.103:3000"

export default defineConfig({
  base: "./",
  plugins: [react(), tailwindcss(), kesiEditorTransform()],
  define: {
    'import.meta.env.VITE_PROJECT_ID': JSON.stringify(
      process.env.KESI_PROJECT_ID || process.env.KESI_EDITOR_PROJECT || ''
    ),
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      '/rest': {
        target: SERVER_URL,
        changeOrigin: true,
        secure: false,
        bypass: (req) => (req.url?.startsWith('/rest/apps/') ? req.url : undefined),
      },
      '/ws': {
        target: SERVER_URL.replace(/^http/, 'ws'),
        changeOrigin: true,
        secure: false,
        ws: true,
      },
    },
  },
})
