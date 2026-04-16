/**
 * JCEF 集成层
 * 提供 CCApp 和 CCChat 全局对象，供 Kotlin 层调用
 */

// CCChat 接口
interface ICCChat {
  appendMessage: (role: string, content: string, options: { id: string; timestamp?: string; thinking?: string }) => void;
  appendStreamingContent: (role: string, content: string, messageId: string) => void;
  finishStreaming: (messageId: string) => void;
  clearMessages: () => void;
  showEmpty: () => void;
  setSessionList: (sessions: string) => void;
  setCliStatus: (version: string, hasUpdate: boolean) => void;
  insertFileReference: (path: string) => void;
  insertCodeReference: (ref: string) => void;
}

// CCApp 接口
interface ICCApp {
  applyTheme: (theme: { variables: Record<string, string>; isDark: boolean }) => void;
  setTheme: (themeId: string) => void;
  applyI18n: (messages: Record<string, string>) => void;
  setLocale: (locale: string) => void;
}

// CCProviders 接口
interface ICCProviders {
  setData: (providers: unknown[], models: unknown, agents: unknown[], context: unknown[]) => void;
  setAgents: (agents: unknown[]) => void;
  setSkills: (skills: unknown[]) => void;
  setFileList: (files: Array<{ name: string; path: string; type: string }>) => void;
  setSkillsAndAgents: (skills: unknown[], agents: unknown[]) => void;
}

// 扩展 Window 接口
declare global {
  interface Window {
    CCChat: ICCChat;
    CCApp: ICCApp;
    CCProviders: ICCProviders;
  }
}

// CCChat 全局对象 - Java → JS 消息操作
window.CCChat = {
  // 追加消息
  appendMessage: (role: string, content: string, options: { id: string; timestamp?: string; thinking?: string }) => {
    console.log('[CCChat] appendMessage', { role, content: content?.substring(0, 50), options });
    // 触发自定义事件，App.tsx 可以监听
    window.dispatchEvent(new CustomEvent('cc-message', {
      detail: { type: 'append', role, content, ...options }
    }));
  },

  // 流式追加内容
  appendStreamingContent: (role: string, content: string, messageId: string) => {
    window.dispatchEvent(new CustomEvent('cc-stream', {
      detail: { type: 'append', role, content, messageId }
    }));
  },

  // 完成流式输出
  finishStreaming: (messageId: string) => {
    window.dispatchEvent(new CustomEvent('cc-stream', {
      detail: { type: 'finish', messageId }
    }));
  },

  // 清空消息
  clearMessages: () => {
    window.dispatchEvent(new CustomEvent('cc-message', {
      detail: { type: 'clear' }
    }));
  },

  // 显示空状态
  showEmpty: () => {
    window.dispatchEvent(new CustomEvent('cc-message', {
      detail: { type: 'empty' }
    }));
  },

  // 设置会话列表
  setSessionList: (sessions: string) => {
    window.dispatchEvent(new CustomEvent('cc-session-list', {
      detail: { sessions: JSON.parse(sessions) }
    }));
  },

  // 设置 CLI 状态
  setCliStatus: (version: string, hasUpdate: boolean) => {
    window.dispatchEvent(new CustomEvent('cc-cli-status', {
      detail: { version, hasUpdate }
    }));
  },

  // 注入文件路径到输入框（来自 IDE 右键菜单 Action）
  insertFileReference: (path: string) => {
    window.dispatchEvent(new CustomEvent('cc-file-ref', {
      detail: { path }
    }));
  },

  // 注入代码引用到输入框（来自 IDE 编辑器右键菜单 Action）
  // ref 格式: @path#Lstart-Lend 或 @path#LN（单行）
  insertCodeReference: (ref: string) => {
    window.dispatchEvent(new CustomEvent('cc-code-ref', {
      detail: { ref }
    }));
  }
};

// CCApp 全局对象 - Java → JS 应用级操作
window.CCApp = {
  // 应用主题
  applyTheme: (theme: { variables: Record<string, string>; isDark: boolean }) => {
    console.log('[CCApp] applyTheme', theme.isDark);
    // 更新 CSS 变量
    const root = document.documentElement;
    Object.entries(theme.variables).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });
    // 设置 data 属性
    document.documentElement.setAttribute('data-theme', theme.isDark ? 'dark' : 'light');
    window.dispatchEvent(new CustomEvent('cc-theme', {
      detail: { isDark: theme.isDark, variables: theme.variables }
    }));
  },

  // 设置主题 ID
  setTheme: (themeId: string) => {
    console.log('[CCApp] setTheme', themeId);
    window.dispatchEvent(new CustomEvent('cc-theme', {
      detail: { themeId }
    }));
  },

  // 应用 i18n 字符串
  applyI18n: (messages: Record<string, string>) => {
    console.log('[CCApp] applyI18n', Object.keys(messages));
    window.dispatchEvent(new CustomEvent('cc-i18n', {
      detail: { messages }
    }));
  },

  // 设置语言
  setLocale: (locale: string) => {
    console.log('[CCApp] setLocale', locale);
    window.dispatchEvent(new CustomEvent('cc-locale', {
      detail: { locale }
    }));
  }
};

// CCProviders 全局对象 - Java → JS Provider 数据
window.CCProviders = {
  setData: (providers: unknown[], models: unknown, agents: unknown[], _context: unknown[]) => {
    console.log('[CCProviders] setData', { providers, models, agents });
    window.dispatchEvent(new CustomEvent('cc-providers', {
      detail: { providers, models, agents }
    }));
  },

  // 设置 Agents
  setAgents: (agents: unknown[]) => {
    console.log('[CCProviders] setAgents', agents);
    window.dispatchEvent(new CustomEvent('cc-agents', {
      detail: { agents }
    }));
  },

  // 设置 Skills
  setSkills: (skills: unknown[]) => {
    console.log('[CCProviders] setSkills', skills);
    window.dispatchEvent(new CustomEvent('cc-skills', {
      detail: { skills }
    }));
  },

  // 设置文件搜索结果（供 @file 引用弹窗使用）
  setFileList: (files: Array<{ name: string; path: string; type: string }>) => {
    console.log('[CCProviders] setFileList', files.length, 'files');
    window.dispatchEvent(new CustomEvent('cc-file-list', {
      detail: { files }
    }));
  },

  // 设置 Skills 和 Agents（含作用域）
  setSkillsAndAgents: (skills: unknown[], agents: unknown[]) => {
    console.log('[CCProviders] setSkillsAndAgents', skills.length, 'skills,', agents.length, 'agents');
    window.dispatchEvent(new CustomEvent('cc-skills-agents', {
      detail: { skills, agents }
    }));
  }
};

// 导出给其他模块使用的引用
export const ccChat = window.CCChat;
export const ccApp = window.CCApp;
export const ccProviders = window.CCProviders;
