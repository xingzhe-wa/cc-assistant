# Java 层对接接口规范

> **版本**: v1.0
> **创建日期**: 2026-04-16
> **目的**: 定义前端与 Java 层的双向通信接口

---

## 一、接口架构概览

```
┌─────────────────────────────────────────────────────────────┐
│                     JCEF Browser (JavaScript)                │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              前端应用 (React + TypeScript)            │   │
│  │                                                     │   │
│  │   ┌─────────┐    ┌─────────┐    ┌─────────┐        │   │
│  │   │ Stores  │───▶│ UI     │───▶│ JcefBridge │      │   │
│  │   └─────────┘    └─────────┘    └────┬────┘        │   │
│  │                                      │               │   │
│  └──────────────────────────────────────│───────────────┘   │
└─────────────────────────────────────────┼───────────────────┘
                                            │
                                     JBCefJSQuery
                                            │
┌─────────────────────────────────────────┼───────────────────┐
│                     Java/Kotlin (Plugin)  │                   │
│  ┌──────────────────────────────────────│─────────────────┐ │
│  │              JcefChatPanel.kt          │                 │ │
│  │                                             │                 │ │
│  │   ┌─────────────┐    ┌─────────────┐    ┌────▼────┐     │ │
│  │   │MessageCallback│──▶│MessageRenderer│──▶│CliBridge│     │ │
│  │   └─────────────┘    └─────────────┘    └─────────┘     │ │
│  └─────────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────┘
```

---

## 二、Java → JavaScript 接口

### 2.1 消息操作

```typescript
// frontend/src/main/tsx/utils/jcef.ts

declare global {
  interface Window {
    javaBridge: {
      // ========== 消息操作 ==========

      /**
       * 追加用户消息
       * @param id 消息 ID
       * @param content 消息内容
       * @param timestamp 时间戳 (可选，格式: "HH:mm")
       */
      appendUserMessage: (id: string, content: string, timestamp?: string) => void;

      /**
       * 追加 AI 消息
       * @param id 消息 ID
       * @param content 消息内容
       * @param timestamp 时间戳 (可选)
       * @param thinking 思考片段 (可选)
       */
      appendAIMessage: (
        id: string,
        content: string,
        timestamp?: string,
        thinking?: string
      ) => void;

      /**
       * 流式追加内容
       * @param role 角色 ('user' | 'assistant')
       * @param content 增量内容
       * @param messageId 消息 ID (用于标识当前流)
       */
      appendStreamingContent: (
        role: string,
        content: string,
        messageId: string
      ) => void;

      /**
       * 完成流式输出
       * @param messageId 消息 ID
       */
      finishStreaming: (messageId: string) => void;

      /**
       * 清空消息列表
       */
      clearMessages: () => void;

      /**
       * 显示空状态
       */
      showEmpty: () => void;
    };
  }
}
```

### 2.2 主题操作

```typescript
declare global {
  interface Window {
    javaBridge: {
      // ========== 主题操作 ==========

      /**
       * 应用主题变量
       * @param variables CSS 变量键值对
       * @param isDark 是否暗色主题
       */
      applyTheme: (
        variables: Record<string, string>,
        isDark: boolean
      ) => void;

      /**
       * 设置主题 ID
       * @param themeId 主题 ID ('idea' | 'dark' | 'light' | 'highContrast')
       */
      setTheme: (themeId: string) => void;

      /**
       * 获取当前主题
       * @returns 当前主题 ID
       */
      getCurrentTheme: () => string;
    };
  }
}
```

### 2.3 国际化操作

```typescript
declare global {
  interface Window {
    javaBridge: {
      // ========== 国际化操作 ==========

      /**
       * 应用国际化文本
       * @param messages 翻译键值对
       */
      applyI18n: (messages: Record<string, string>) => void;

      /**
       * 获取当前语言
       * @returns 当前语言代码 ('zh-CN' | 'en-US' | 'ja-JP' | 'ko-KR')
       */
      getCurrentLocale: () => string;

      /**
       * 设置语言
       * @param locale 语言代码
       */
      setLocale: (locale: string) => void;
    };
  }
}
```

### 2.4 Provider/Model/Agent 操作

```typescript
declare global {
  interface Window {
    javaBridge: {
      // ========== Provider/Model/Agent ==========

      /**
       * 设置 Provider、Model、Agent 数据
       */
      setProviders: (
        providers: Provider[],
        models: Record<string, Model[]>,
        agents: Agent[]
      ) => void;

      /**
       * 获取当前 Provider
       */
      getCurrentProvider: () => string;

      /**
       * 获取当前 Model
       */
      getCurrentModel: () => string;

      /**
       * 获取当前 Agent
       */
      getCurrentAgent: () => string;
    };
  }
}
```

---

## 三、JavaScript → Java 接口

### 3.1 消息操作回调

```typescript
// frontend/src/main/tsx/hooks/useJcefBridge.ts

interface JcefBridgeCallbacks {
  // ========== 消息操作 ==========

  /**
   * 复制消息
   */
  onCopyMessage?: (id: string, content: string) => void;

  /**
   * 引用消息
   */
  onQuoteMessage?: (id: string, content: string) => void;

  /**
   * 重新生成
   */
  onRegenerate?: (id: string) => void;

  /**
   * 回溯
   */
  onRewind?: (id: string) => void;

  /**
   * 复制代码
   */
  onCopyCode?: (code: string) => void;

  /**
   * 发送消息
   */
  onSendMessage?: (text: string, options: SendOptions) => void;

  /**
   * 停止生成
   */
  onStopGeneration?: () => void;

  // ========== 主题/语言 ==========

  /**
   * 主题变更
   */
  onThemeChange?: (themeId: string) => void;

  /**
   * 语言变更
   */
  onLanguageChange?: (locale: string) => void;

  // ========== Provider/Model/Agent ==========

  /**
   * Provider 变更
   */
  onProviderChange?: (providerId: string) => void;

  /**
   * Model 变更
   */
  onModelChange?: (modelId: string) => void;

  /**
   * Mode 变更
   */
  onModeChange?: (mode: string) => void;

  /**
   * Agent 变更
   */
  onAgentChange?: (agentId: string) => void;

  /**
   * Think 模式变更
   */
  onThinkChange?: (enabled: boolean) => void;

  // ========== 会话操作 ==========

  /**
   * 切换收藏
   */
  onToggleFavorite?: (id: string, fav: boolean) => void;

  /**
   * 重命名会话
   */
  onRenameSession?: (id: string, title: string) => void;

  /**
   * 删除会话
   */
  onDeleteSession?: (id: string) => void;

  /**
   * 新建会话
   */
  onNewSession?: () => void;

  /**
   * 加载会话
   */
  onLoadSession?: (sessionId: string) => void;

  // ========== Diff ==========

  /**
   * Diff 汇总更新
   */
  onDiffSummaryUpdate?: (summary: { add: number; del: number }) => void;

  /**
   * 打开 Diff
   */
  onOpenDiff?: (file: string) => void;

  /**
   * 接受 Diff
   */
  onAcceptDiff?: (file: string) => void;

  /**
   * 拒绝 Diff
   */
  onRejectDiff?: (file: string) => void;

  // ========== 设置 ==========

  /**
   * 检查 CLI
   */
  onCheckCli?: () => void;

  /**
   * 删除 Provider
   */
  onDeleteProvider?: (id: string) => void;

  /**
   * 保存 Provider
   */
  onSaveProvider?: (data: ProviderData) => void;

  /**
   * 打开设置
   */
  onOpenSettings?: () => void;

  // ========== 增强 ==========

  /**
   * 提示词强化
   */
  onEnhancePrompt?: (text: string) => void;

  /**
   * 插入提示词
   */
  onInsertPrompt?: (text: string) => void;
}

interface SendOptions {
  stream?: boolean;
  think?: boolean;
  mode?: 'auto' | 'plan' | 'agent';
  model?: string;
  provider?: string;
}
```

### 3.2 调用示例

```typescript
// frontend/src/main/tsx/components/input/InputBox.tsx

export const InputBox: React.FC<InputBoxProps> = ({
  value,
  onChange,
  onSend,
  onStop,
  streaming
}) => {
  const handleSend = () => {
    if (!value.trim()) return;

    // 调用 Java 层
    if (window.javaBridge) {
      window.javaBridge.onSendMessage?.(value, {
        stream: true,
        think: false,
        mode: 'auto'
      });
    }

    onSend?.(value);
  };

  const handleStop = () => {
    if (window.javaBridge) {
      window.javaBridge.onStopGeneration?.();
    }
    onStop?.();
  };

  return (
    <div className={styles.container}>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.ctrlKey && e.key === 'Enter') {
            handleSend();
          }
        }}
      />
      <button onClick={streaming ? handleStop : handleSend}>
        {streaming ? 'Stop' : 'Send'}
      </button>
    </div>
  );
};
```

---

## 四、消息格式规范

### 4.1 消息类型

```typescript
// frontend/src/main/tsx/types/message.ts

export type MessageRole = 'user' | 'assistant';

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp?: string;
  thinking?: string;
  toolCalls?: ToolCall[];
}

export interface ToolCall {
  id: string;
  name: string;
  input: Record<string, any>;
  status: 'pending' | 'running' | 'success' | 'error';
  output?: string;
}
```

### 4.2 主题变量格式

```typescript
// frontend/src/main/tsx/theme/types.ts

export interface ThemeVariables {
  // 基础颜色
  '--bg-primary': string;
  '--bg-secondary': string;
  '--bg-element': string;
  '--bg-hover': string;

  // 强调色
  '--accent-primary': string;
  '--accent-secondary': string;

  // 状态色
  '--color-success': string;
  '--color-error': string;
  '--color-info': string;

  // 文本色
  '--fg-primary': string;
  '--fg-secondary': string;
  '--fg-muted': string;
  '--fg-disabled': string;

  // 边框色
  '--border-default': string;
  '--border-light': string;

  // 圆角
  '--radius-sm': string;
  '--radius-md': string;
  '--radius-lg': string;
}
```

### 4.3 翻译文本格式

```typescript
// frontend/src/main/tsx/i18n/types.ts

export interface TranslationMessages {
  // 通用
  'common.confirm': string;
  'common.cancel': string;
  'common.save': string;
  'common.delete': string;
  'common.edit': string;
  'common.search': string;
  'common.loading': string;
  'common.error': string;
  'common.success': string;

  // 消息
  'message.empty.title': string;
  'message.empty.description': string;
  'message.placeholder': string;
  'message.send': string;
  'message.stop': string;
  'message.copy': string;
  'message.quote': string;
  'message.regenerate': string;
  'message.rewind': string;

  // 会话
  'session.new': string;
  'session.untitled': string;
  'session.history': string;
  'session.favorite': string;
  'session.search.placeholder': string;

  // 设置
  'settings.title': string;
  'settings.basic': string;
  'settings.appearance': string;
  'settings.provider': string;
  'settings.agent': string;
  'settings.skill': string;
  'settings.language': string;
  'settings.theme': string;
  'settings.cli.version': string;
  'settings.cli.check': string;
}
```

---

## 五、通信协议

### 5.1 Java → JS 消息协议

使用 `executeJavaScript` 发送：

```kotlin
// JcefChatPanel.kt

// 追加用户消息
cefBrowser.executeJavaScript(
    "CCChat.appendMessage('user', ${gson.toJson(content)}, {id: ${gson.toJson(id)}, timestamp: ${gson.toJson(time)}})",
    url,
    0
)

// 追加 AI 消息
cefBrowser.executeJavaScript(
    "CCChat.appendMessage('assistant', ${gson.toJson(content)}, {id: ${gson.toJson(id)}, timestamp: ${gson.toJson(time)}, thinking: ${gson.toJson(thinking)}})",
    url,
    0
)

// 流式追加
cefBrowser.executeJavaScript(
    "CCChat.appendStreamingContent('$role', ${gson.toJson(content)}, ${gson.toJson(messageId)})",
    url,
    0
)

// 完成流式
cefBrowser.executeJavaScript(
    "CCChat.finishStreaming(${gson.toJson(messageId)})",
    url,
    0
)
```

### 5.2 JS → Java 消息协议

使用 `JBCefJSQuery.inject` 发送：

```typescript
// frontend/src/main/tsx/utils/jcef.ts

export const jcefBridge = {
  // 发送消息
  send: (action: string, data?: any) => {
    if (typeof window !== 'undefined' && (window as any).cefQuery) {
      const payload = data ? `${action}:${JSON.stringify(data)}` : `${action}:`;
      (window as any).cefQuery.inject(payload);
    }
  },

  // 复制消息
  copyMessage: (id: string, content: string) => {
    jcefBridge.send('copyMessage', { id, content });
  },

  // 引用消息
  quoteMessage: (id: string, content: string) => {
    jcefBridge.send('quoteMessage', { id, content });
  },

  // 发送消息
  sendMessage: (text: string, options: SendOptions) => {
    jcefBridge.send('sendMessage', { text, options });
  },

  // 主题变更
  themeChange: (themeId: string) => {
    jcefBridge.send('themeChange', themeId);
  },

  // 语言变更
  languageChange: (locale: string) => {
    jcefBridge.send('languageChange', locale);
  }
};
```

### 5.3 Java 层消息解析

```kotlin
// JcefChatPanel.kt

private fun handleJSMessage(request: String): String? {
    val colonIndex = request.indexOf(':')
    if (colonIndex < 0) return null

    val action = request.substring(0, colonIndex)
    val data = request.substring(colonIndex + 1)

    when (action) {
        "copyMessage" -> {
            val msg = gson.fromJson(data, CopyMessageData::class.java)
            invokeLater { onCopyMessage?.invoke(msg.id, msg.content) }
        }
        "quoteMessage" -> {
            val msg = gson.fromJson(data, QuoteMessageData::class.java)
            invokeLater { onQuoteMessage?.invoke(msg.id, msg.content) }
        }
        "sendMessage" -> {
            val msg = gson.fromJson(data, SendMessageData::class.java)
            invokeLater {
                onSendMessage?.invoke(
                    msg.text,
                    MessageOptions(
                        stream = msg.options?.stream ?: true,
                        think = msg.options?.think ?: false,
                        mode = msg.options?.mode ?: "auto",
                        model = msg.options?.model,
                        provider = msg.options?.provider
                    )
                )
            }
        }
        // ... 其他 action 处理
        else -> logger.warn("Unknown action: $action")
    }

    return null
}
```

---

## 六、错误处理

### 6.1 前端错误处理

```typescript
// frontend/src/main/tsx/utils/jcef.ts

export const jcefBridge = {
  send: (action: string, data?: any) => {
    try {
      if (typeof window !== 'undefined' && (window as any).cefQuery) {
        const payload = data ? `${action}:${JSON.stringify(data)}` : `${action}:`;
        (window as any).cefQuery.inject(payload);
      } else {
        console.warn('[JcefBridge] cefQuery not available');
      }
    } catch (error) {
      console.error('[JcefBridge] Failed to send:', error);
    }
  }
};
```

### 6.2 Java 层错误处理

```kotlin
// JcefChatPanel.kt

private fun handleJSMessage(request: String): String? {
    try {
        val colonIndex = request.indexOf(':')
        if (colonIndex < 0) return null

        val action = request.substring(0, colonIndex)
        val data = request.substring(colonIndex + 1)

        when (action) {
            // ... 处理逻辑
            else -> logger.warn("Unknown action: $action")
        }
    } catch (e: Exception) {
        logger.error("Error handling JS message: ${request.take(100)}", e)
    }

    return null
}
```

---

## 七、类型定义文件

```typescript
// frontend/src/api/jcef-types.ts

/**
 * JCEF 类型定义
 * 定义前端与 Java 层通信的类型
 */

// ========== Provider/Model/Agent ==========

export interface Provider {
  id: string;
  name: string;
  url: string;
  key?: string;
  st: 'ok' | 'err' | 'off';
}

export interface Model {
  id: string;
  name: string;
}

export interface Agent {
  id: string;
  name: string;
}

// ========== Send Options ==========

export interface SendOptions {
  stream?: boolean;
  think?: boolean;
  mode?: 'auto' | 'plan' | 'agent';
  model?: string;
  provider?: string;
}

// ========== Diff ==========

export interface DiffFile {
  file: string;
  add: number;
  del: number;
}

// ========== Session ==========

export interface Session {
  id: string;
  title: string;
  fav: boolean;
  time: string;
  qc: number;
  msgs: Message[];
}

// ========== Message ==========

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  time?: string;
  thinking?: string;
}

// ========== Java Bridge 接口 ==========

export interface JavaBridge {
  // 消息操作
  appendUserMessage: (id: string, content: string, timestamp?: string) => void;
  appendAIMessage: (id: string, content: string, timestamp?: string, thinking?: string) => void;
  appendStreamingContent: (role: string, content: string, messageId: string) => void;
  finishStreaming: (messageId: string) => void;
  clearMessages: () => void;
  showEmpty: () => void;

  // 主题
  applyTheme: (variables: Record<string, string>, isDark: boolean) => void;
  setTheme: (themeId: string) => void;
  getCurrentTheme: () => string;

  // 国际化
  applyI18n: (messages: Record<string, string>) => void;
  getCurrentLocale: () => string;
  setLocale: (locale: string) => void;

  // Provider/Model/Agent
  setProviders: (providers: Provider[], models: Record<string, Model[]>, agents: Agent[]) => void;
  getCurrentProvider: () => string;
  getCurrentModel: () => string;
  getCurrentAgent: () => string;
}

// 扩展 Window 接口
declare global {
  interface Window {
    javaBridge: JavaBridge | undefined;
    cefQuery: {
      inject: (payload: string) => void;
    } | undefined;
  }
}

export {};
```

---

## 八、测试接口

### 8.1 Mock Bridge

```typescript
// frontend/src/mock/bridge.ts

/**
 * Mock JCEF Bridge
 * 用于前端独立开发时模拟 Java 层
 */
export const createMockBridge = () => {
  const listeners: Record<string, Function[]> = {};

  return {
    // 发送消息到 Java (Mock 不实际发送)
    send: (action: string, data?: any) => {
      console.log('[MockBridge] send:', action, data);
    },

    // 监听 Java 消息
    on: (event: string, callback: Function) => {
      if (!listeners[event]) listeners[event] = [];
      listeners[event].push(callback);
    },

    // 触发事件
    emit: (event: string, data: any) => {
      listeners[event]?.forEach(cb => cb(data));
    },

    // 模拟 Java 发送消息
    simulateAppendUserMessage: (id: string, content: string) => {
      console.log('[MockBridge] appendUserMessage:', id, content);
    },

    simulateAppendAIMessage: (id: string, content: string) => {
      console.log('[MockBridge] appendAIMessage:', id, content);
    }
  };
};

export const mockBridge = createMockBridge();

// 替换 window.javaBridge
if (typeof window !== 'undefined') {
  (window as any).javaBridge = {
    appendUserMessage: (id: string, content: string, timestamp?: string) => {
      mockBridge.emit('appendUserMessage', { id, content, timestamp });
    },
    appendAIMessage: (id: string, content: string, timestamp?: string, thinking?: string) => {
      mockBridge.emit('appendAIMessage', { id, content, timestamp, thinking });
    },
    // ... 其他方法
  };
}
```

---

*文档版本: v1.0*
*最后更新: 2026-04-16*
