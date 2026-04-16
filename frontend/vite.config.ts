import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import fs from 'fs'
import type { Plugin } from 'vite'

// 插件：构建后复制 index.html 为 chat.html
function copyChatHtml(): Plugin {
  return {
    name: 'copy-chat-html',
    writeBundle() {
      const distDir = path.resolve(__dirname, 'dist')
      const indexHtml = path.join(distDir, 'index.html')
      const chatHtml = path.join(distDir, 'chat.html')

      if (fs.existsSync(indexHtml)) {
        let content = fs.readFileSync(indexHtml, 'utf-8')
        // 修改相对路径，确保在 JCEF 中正确加载
        content = content.replace(/href="\//g, 'href="./')
          .replace(/src="\//g, 'src="./')
        fs.writeFileSync(chatHtml, content)
        console.log('✓ Created chat.html from index.html')
      }
    }
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), copyChatHtml()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/components': path.resolve(__dirname, './src/components'),
      '@/hooks': path.resolve(__dirname, './src/hooks'),
      '@/stores': path.resolve(__dirname, './src/stores'),
      '@/i18n': path.resolve(__dirname, './src/i18n'),
      '@/theme': path.resolve(__dirname, './src/theme'),
      '@/utils': path.resolve(__dirname, './src/utils'),
      '@/types': path.resolve(__dirname, './src/types'),
      '@/mock': path.resolve(__dirname, './src/mock'),
      '@/lib': path.resolve(__dirname, './src/lib'),
    }
  },
  server: {
    port: 5173,
    strictPort: true
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        // 确保资源文件名稳定
        assetFileNames: 'assets/[name][extname]',
        chunkFileNames: 'assets/[name].js',
        entryFileNames: 'assets/[name].js',
      }
    }
  }
})
