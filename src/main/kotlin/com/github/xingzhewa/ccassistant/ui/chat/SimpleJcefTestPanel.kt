package com.github.xingzhewa.ccassistant.ui.chat

import com.intellij.openapi.Disposable
import com.intellij.openapi.diagnostic.thisLogger
import com.intellij.ui.jcef.JBCefApp
import com.intellij.ui.jcef.JBCefBrowser
import java.awt.BorderLayout
import java.awt.event.ComponentEvent
import java.awt.event.ComponentListener
import javax.swing.JComponent
import javax.swing.JLabel
import javax.swing.JPanel

/**
 * 极简 JCEF 测试面板 - 验证 JCEF 是否工作
 *
 * 用于调试和验证，不依赖复杂的前端构建
 */
class SimpleJcefTestPanel : Disposable {

    private val logger = thisLogger()
    private var browser: JBCefBrowser? = null

    var onSendMessage: ((String) -> Unit)? = null

    fun createPanel(): JComponent {
        val panel = JPanel(BorderLayout())
        panel.preferredSize = java.awt.Dimension(800, 600)

        // 添加组件监听器，用于调试
        panel.addComponentListener(object : ComponentListener {
            override fun componentResized(e: ComponentEvent?) {
                logger.info("Panel resized: ${panel.size}")
            }

            override fun componentMoved(e: ComponentEvent?) {
                logger.info("Panel moved: ${panel.location}")
            }

            override fun componentShown(e: ComponentEvent?) {
                logger.info("=== Panel SHOWN (visible) ===")
            }

            override fun componentHidden(e: ComponentEvent?) {
                logger.info("Panel hidden")
            }
        })

        // 检查 JCEF 支持
        if (!JBCefApp.isSupported()) {
            logger.error("JCEF not supported in this IDE")
            panel.add(JLabel("<html><div style='padding:20px;text-align:center;'>" +
                    "<h3>JCEF 不可用</h3>" +
                    "<p>请升级到 IntelliJ IDEA 2024.1 或更高版本</p>" +
                    "</div></html>"), BorderLayout.CENTER)
            return panel
        }

        try {
            // 🔧 使用 HTML 字符串直接加载，避免资源加载问题
            val htmlContent = """
                <!DOCTYPE html>
                <html>
                <head>
                  <meta charset="UTF-8">
                  <style>
                    body {
                      margin: 0;
                      padding: 40px;
                      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
                      color: white;
                      min-height: 100vh;
                    }
                    h1 { font-size: 32px; margin-bottom: 20px; }
                    .status {
                      background: rgba(255,255,255,0.2);
                      padding: 20px;
                      border-radius: 8px;
                      margin: 20px 0;
                    }
                    .success { color: #4ade80; font-weight: bold; }
                    button {
                      background: white;
                      color: #667eea;
                      border: none;
                      padding: 12px 24px;
                      border-radius: 6px;
                      font-size: 16px;
                      cursor: pointer;
                      margin: 10px;
                      font-weight: 500;
                      transition: all 0.2s;
                    }
                    button:hover {
                      transform: translateY(-2px);
                      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
                    }
                    button:active {
                      transform: translateY(0);
                    }
                    .toast-container {
                      position: fixed;
                      top: 20px;
                      right: 20px;
                      z-index: 1000;
                    }
                    .toast {
                      background: white;
                      color: #333;
                      padding: 12px 20px;
                      border-radius: 6px;
                      margin-bottom: 10px;
                      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
                      animation: slideIn 0.3s ease;
                    }
                    @keyframes slideIn {
                      from { transform: translateX(100%); opacity: 0; }
                      to { transform: translateX(0); opacity: 1; }
                    }
                  </style>
                </head>
                <body>
                  <h1>🎉 CC Assistant - JCEF 测试成功！</h1>
                  <div class="status">
                    <p class="success">✓ JCEF 正常工作</p>
                    <p>✓ HTML 渲染正常</p>
                    <p>✓ CSS 样式正常</p>
                    <p>✓ JavaScript 执行正常</p>
                    <p id="time">时间加载中...</p>
                  </div>
                  <button id="btn-test" data-action="test">测试控制台</button>
                  <button id="btn-color" data-action="color">改变颜色</button>
                  <button id="btn-counter" data-action="counter">计数: <span id="count">0</span></button>
                  <div class="toast-container" id="toasts"></div>
                  <script>
                    // 更新时间
                    document.getElementById('time').textContent = '当前时间: ' + new Date().toLocaleString('zh-CN');

                    // Toast 消息函数
                    function showToast(message, type = 'info') {
                      const container = document.getElementById('toasts');
                      const toast = document.createElement('div');
                      toast.className = 'toast';
                      toast.textContent = message;
                      container.appendChild(toast);
                      setTimeout(() => toast.remove(), 3000);
                    }

                    // 计数器
                    let count = 0;

                    // 使用事件委托处理所有按钮点击
                    document.addEventListener('click', function(e) {
                      const action = e.target.closest('button')?.dataset.action;
                      if (!action) return;

                      switch(action) {
                        case 'test':
                          console.log('[JCEF Test] 测试按钮被点击');
                          showToast('✓ 测试按钮工作正常！', 'success');
                          break;
                        case 'color':
                          const colors = [
                            'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                            'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                            'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                            'linear-gradient(135deg, #fa709a 0%, #fee140 100%)'
                          ];
                          const random = Math.floor(Math.random() * colors.length);
                          document.body.style.background = colors[random];
                          console.log('[JCEF Test] 颜色已切换');
                          showToast('✓ 颜色已切换', 'info');
                          break;
                        case 'counter':
                          count++;
                          document.getElementById('count').textContent = count;
                          console.log('[JCEF Test] 计数: ' + count);
                          showToast('✓ 计数: ' + count, 'info');
                          break;
                      }
                    });

                    console.log('[JCEF Test] Page initialized successfully');
                  </script>
                </body>
                </html>
            """.trimIndent()

            logger.info("=== Loading inline HTML content ===")

            // 添加一个可视化边框，方便调试
            val wrapper = JPanel(java.awt.BorderLayout())
            wrapper.border = javax.swing.border.LineBorder(java.awt.Color(0, 120, 215, 128), 3)
            wrapper.background = java.awt.Color(0, 120, 215, 20)

            // 创建 JCEF Browser 并加载 HTML 字符串
            browser = JBCefBrowser()
            browser!!.component.preferredSize = java.awt.Dimension(800, 600)

            // 使用 loadHTML 加载内联内容
            browser!!.loadHTML(htmlContent)

            logger.info("Browser component type: ${browser!!.component.javaClass.name}")
            logger.info("HTML content loaded, size: ${htmlContent.length} bytes")

            wrapper.add(browser!!.component, BorderLayout.CENTER)
            panel.add(wrapper, BorderLayout.CENTER)

            logger.info("✅ SimpleJcefTestPanel created successfully with inline HTML")

        } catch (e: Throwable) {
            logger.error("Failed to create JCEF Browser", e)
            panel.add(JLabel("<html><div style='padding:20px;color:red;'>" +
                    "<h3>JCEF 创建失败</h3>" +
                    "<p>错误: ${e.message}</p>" +
                    "<p>请检查 JCEF 是否正确安装</p>" +
                    "</div></html>"), BorderLayout.CENTER)
        }

        return panel
    }

    override fun dispose() {
        try {
            browser?.dispose()
            browser = null
            logger.info("SimpleJcefTestPanel disposed")
        } catch (e: Throwable) {
            logger.warn("Error disposing", e)
        }
    }
}
