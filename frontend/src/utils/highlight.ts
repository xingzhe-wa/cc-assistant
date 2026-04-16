// @ts-ignore - highlight.js has built-in types but import is tricky
import hljs from 'highlight.js/lib/common';

/**
 * 代码语法高亮工具函数
 *
 * @param code - 代码内容
 * @param language - 编程语言（可选）
 * @returns 高亮后的 HTML 字符串
 *
 * @example
 * ```ts
 * const html = highlightCode('const a = 1;', 'typescript');
 * // <span class="hljs-keyword">const</span> <span class="hljs-variable">a</span> = <span class="hljs-number">1</span>;
 * ```
 */
export function highlightCode(code: string, language?: string): string {
  if (!code) return '';

  try {
    if (language && language !== 'text') {
      // 指定语言高亮
      const result = hljs.highlight(code, { language, ignoreIllegals: true });
      return result.value;
    } else {
      // 自动检测语言
      const result = hljs.highlightAuto(code);
      return result.value;
    }
  } catch (error) {
    // 高亮失败，返回原文
    console.warn('Highlight error:', error);
    return escapeHtml(code);
  }
}

/**
 * HTML 转义
 *
 * @param text - 需要转义的文本
 * @returns 转义后的文本
 */
export function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * 获取支持的语言列表
 *
 * @returns 语言代码数组
 */
export function getSupportedLanguages(): string[] {
  return hljs.listLanguages();
}

/**
 * 检测代码语言
 *
 * @param code - 代码内容
 * @returns 检测到的语言代码
 */
export function detectLanguage(code: string): string {
  try {
    const result = hljs.highlightAuto(code);
    return result.language || 'text';
  } catch {
    return 'text';
  }
}

/**
 * 获取语言显示名称
 *
 * @param language - 语言代码
 * @returns 显示名称
 */
export function getLanguageDisplayName(language: string): string {
  const displayNames: Record<string, string> = {
    'typescript': 'TypeScript',
    'javascript': 'JavaScript',
    'python': 'Python',
    'java': 'Java',
    'kotlin': 'Kotlin',
    'go': 'Go',
    'rust': 'Rust',
    'cpp': 'C++',
    'c': 'C',
    'csharp': 'C#',
    'php': 'PHP',
    'ruby': 'Ruby',
    'swift': 'Swift',
    'objectivec': 'Objective-C',
    'shell': 'Shell',
    'bash': 'Bash',
    'powershell': 'PowerShell',
    'sql': 'SQL',
    'html': 'HTML',
    'css': 'CSS',
    'scss': 'SCSS',
    'json': 'JSON',
    'xml': 'XML',
    'yaml': 'YAML',
    'markdown': 'Markdown',
    'dockerfile': 'Dockerfile',
    'git': 'Git',
    'vim': 'Vim',
    'nginx': 'Nginx'
  };

  return displayNames[language] || language.toUpperCase();
}
