import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import fs from 'fs'
import type { Plugin } from 'vite'

// 插件：构建后复制 index.html 为 chat.html
// Java 侧 loadHtmlContent() 会读取此文件检查是否存在，并分别读取 CSS/JS 资源
function copyChatHtml(): Plugin {
  return {
    name: 'copy-chat-html',
    writeBundle() {
      const distDir = path.resolve(__dirname, 'dist')
      const indexHtmlPath = path.resolve(distDir, 'index.html')
      const chatHtmlPath = path.resolve(distDir, 'chat.html')

      if (!fs.existsSync(indexHtmlPath)) return

      let content = fs.readFileSync(indexHtmlPath, 'utf-8')

      // 移除 Google Fonts CDN（JCEF 环境无法访问）
      content = content.replace(/<link[^>]*fonts\.googleapis\.com[^>]*>\s*/g, '')

      // 修改相对路径为绝对路径
      content = content.replace(/href="\//g, 'href="./')
        .replace(/src="\//g, 'src="./')

      fs.writeFileSync(chatHtmlPath, content)
      console.log('✓ Created chat.html from index.html')
    }
  }
}

// 插件：将 CSS 中的字体文件 URL 替换为 Base64 data URI
// 解决 JCEF loadHTML() 无法加载外部字体文件的问题
// 仅内联 woff2 格式（JCEF Chromium >= 90 完全支持），删除 woff fallback 减少体积
function inlineFontsAsBase64(): Plugin {
  return {
    name: 'inline-fonts-base64',
    enforce: 'post',
    writeBundle() {
      const distDir = path.resolve(__dirname, 'dist')
      const cssFile = path.join(distDir, 'assets', 'index.css')

      if (!fs.existsSync(cssFile)) return

      let css = fs.readFileSync(cssFile, 'utf-8')
      const assetsDir = path.join(distDir, 'assets')

      // 第一步：删除 woff 格式的 fallback（只保留 woff2）
      // 匹配 ,url(/assets/xxx.woff)format("woff") 格式
      css = css.replace(/,url\((\/assets\/)(material-symbols-rounded[^)]+\.woff)\)format\("woff"\)/g, '')

      // 第二步：将 woff2 URL 替换为 Base64 data URI
      const urlPattern = /url\((\/assets\/)(material-symbols-rounded[^)]+\.woff2)\)/g

      css = css.replace(urlPattern, (_match, _prefix: string, fileName: string) => {
        const fontPath = path.join(assetsDir, fileName)
        if (!fs.existsSync(fontPath)) return _match

        const fontData = fs.readFileSync(fontPath)
        const base64 = fontData.toString('base64')
        console.log(`✓ Inlined font: ${fileName} (${(fontData.length / 1024).toFixed(0)}KB)`)
        return `url(data:font/woff2;base64,${base64})`
      })

      fs.writeFileSync(cssFile, css)
    }
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), copyChatHtml(), inlineFontsAsBase64()],
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
    minify: true,
    // 不使用 code splitting，保持 CSS/JS 分离
    // Java 侧 loadHtmlContent() 会分别读取 index.css 和 index.js
    rollupOptions: {
      output: {
        // 资源文件名稳定
        assetFileNames: 'assets/[name][extname]',
        chunkFileNames: 'assets/[name].js',
        entryFileNames: 'assets/[name].js',
      }
    }
  }
})
