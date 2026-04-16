import { Marked } from 'marked';
import hljs from 'highlight.js/lib/core';
import kotlin from 'highlight.js/lib/languages/kotlin';
import javascript from 'highlight.js/lib/languages/javascript';
import typescript from 'highlight.js/lib/languages/typescript';
import python from 'highlight.js/lib/languages/python';
import bash from 'highlight.js/lib/languages/bash';
import diff from 'highlight.js/lib/languages/diff';
import json from 'highlight.js/lib/languages/json';
import xml from 'highlight.js/lib/languages/xml';
import css from 'highlight.js/lib/languages/css';

// 注册语言
hljs.registerLanguage('kotlin', kotlin);
hljs.registerLanguage('java', kotlin);
hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('typescript', typescript);
hljs.registerLanguage('python', python);
hljs.registerLanguage('bash', bash);
hljs.registerLanguage('diff', diff);
hljs.registerLanguage('json', json);
hljs.registerLanguage('xml', xml);
hljs.registerLanguage('html', xml);
hljs.registerLanguage('css', css);

// 创建 Marked 实例
const markedInstance = new Marked({
  breaks: true,
  gfm: true
});

// 自定义渲染器
const renderer = {
  code({ text, lang }: { text: string; lang?: string }): string {
    const language = lang || '';
    if (language && hljs.getLanguage(language)) {
      try {
        const highlighted = hljs.highlight(text, { language }).value;
        return `<pre><code class="hljs language-${language}">${highlighted}</code></pre>`;
      } catch {
        // ignore
      }
    }
    const highlighted = hljs.highlightAuto(text).value;
    return `<pre><code class="hljs">${highlighted}</code></pre>`;
  }
};

markedInstance.use({ renderer });

export const renderMarkdown = (content: string): string => {
  return markedInstance.parse(content) as string;
};

export const highlightCode = (code: string, language: string): string => {
  if (language && hljs.getLanguage(language)) {
    try {
      return hljs.highlight(code, { language }).value;
    } catch {
      // ignore
    }
  }
  try {
    return hljs.highlightAuto(code).value;
  } catch {
    return code;
  }
};
