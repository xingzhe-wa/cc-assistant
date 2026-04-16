import React, { useState, useMemo, useCallback } from 'react';
import { Icon } from '../common';
import { useI18n } from '@/hooks/useI18n';
import styles from './PromptEnhancePanel.module.css';

export interface PromptTemplate {
  id: string;
  name: string;
  icon: string;
  role: string;
  format: string[];
  constraints: string;
  examples?: Array<{ input: string; output: string }>;
  language: string;
  systemPrefix: string;
}

export const PRESET_TEMPLATES: PromptTemplate[] = [
  {
    id: 'code-optimize', name: '代码优化', icon: 'speed', role: 'Senior Developer',
    format: ['markdown', 'code'], constraints: '保持功能不变', language: 'zh-CN',
    systemPrefix: 'You are a Senior Developer. Please optimize the following code for performance, readability, and best practices.',
  },
  {
    id: 'bug-analyze', name: 'Bug 分析', icon: 'bug_report', role: 'QA Engineer',
    format: ['markdown', 'code'], constraints: '', language: 'zh-CN',
    systemPrefix: 'You are a QA Engineer. Analyze the following code for bugs, edge cases, and potential issues.',
  },
  {
    id: 'code-review', name: '代码审查', icon: 'rate_review', role: 'Tech Lead',
    format: ['markdown', 'checklist'], constraints: '', language: 'zh-CN',
    systemPrefix: 'You are a Tech Lead. Review the following code for quality, maintainability, and design patterns.',
  },
  {
    id: 'doc-gen', name: '文档生成', icon: 'description', role: 'Technical Writer',
    format: ['markdown'], constraints: '', language: 'zh-CN',
    systemPrefix: 'You are a Technical Writer. Generate comprehensive documentation for the following code.',
  },
  {
    id: 'test-gen', name: '测试用例', icon: 'science', role: 'Test Engineer',
    format: ['markdown', 'code'], constraints: '覆盖边界情况', language: 'zh-CN',
    systemPrefix: 'You are a Test Engineer. Generate test cases for the following code, covering edge cases.',
  },
  {
    id: 'refactor', name: '重构建议', icon: 'architecture', role: 'Software Architect',
    format: ['markdown', 'code', 'steps'], constraints: '', language: 'zh-CN',
    systemPrefix: 'You are a Software Architect. Suggest refactoring improvements for the following code.',
  },
];

const ROLE_OPTIONS = [
  'Senior Developer', 'QA Engineer', 'Tech Lead', 'Technical Writer',
  'Test Engineer', 'Software Architect', 'Data Scientist', 'DevOps Engineer',
  'Security Analyst', 'Product Manager',
];

const FORMAT_OPTIONS = [
  { id: 'markdown', label: 'Markdown' },
  { id: 'code', label: 'Code Block' },
  { id: 'steps', label: 'Step-by-step' },
  { id: 'checklist', label: 'Checklist' },
  { id: 'table', label: 'Table' },
];

const LANGUAGE_OPTIONS = [
  { id: 'zh-CN', label: '中文' },
  { id: 'en-US', label: 'English' },
  { id: 'ja-JP', label: '日本語' },
];

interface PromptEnhancePanelProps {
  originalText: string;
  onApply: (enhancedText: string) => void;
  onClose: () => void;
}

export const PromptEnhancePanel: React.FC<PromptEnhancePanelProps> = ({
  originalText,
  onApply,
  onClose,
}) => {
  const { t } = useI18n();
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('code-optimize');
  const [role, setRole] = useState('Senior Developer');
  const [format, setFormat] = useState<string[]>(['markdown', 'code']);
  const [constraints, setConstraints] = useState('');
  const [language, setLanguage] = useState('zh-CN');

  const handleSelectTemplate = useCallback((template: PromptTemplate) => {
    setSelectedTemplateId(template.id);
    setRole(template.role);
    setFormat([...template.format]);
    setConstraints(template.constraints);
    setLanguage(template.language);
  }, []);

  const toggleFormat = useCallback((fmt: string) => {
    setFormat((prev) =>
      prev.includes(fmt) ? prev.filter((f) => f !== fmt) : [...prev, fmt]
    );
  }, []);

  // Generate enhanced prompt preview
  const preview = useMemo(() => {
    const template = PRESET_TEMPLATES.find((t) => t.id === selectedTemplateId);
    const lines: string[] = [];

    lines.push(`You are a ${role}.`);
    lines.push(template?.systemPrefix.split('.').slice(1).join('.').trim() || '');

    if (format.length > 0) {
      const formatStr = format
        .map((f) => FORMAT_OPTIONS.find((fo) => fo.id === f)?.label || f)
        .join(', ');
      lines.push(`Output format: ${formatStr}.`);
    }

    if (constraints.trim()) {
      lines.push(`Constraints: ${constraints}`);
    }

    const langLabel = LANGUAGE_OPTIONS.find((l) => l.id === language)?.label || language;
    lines.push(`Respond in ${langLabel}.`);

    lines.push('---');
    lines.push(originalText);

    return lines.filter(Boolean).join('\n');
  }, [selectedTemplateId, role, format, constraints, language, originalText]);

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerTitle}>
            <Icon name="auto_fix_high" size="sm" />
            <span>{t('input.enhance')}</span>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>
            <Icon name="close" size="sm" />
          </button>
        </div>

        <div className={styles.body}>
          {/* Left: Templates */}
          <div className={styles.templatePanel}>
            <div className={styles.sectionTitle}>{t('enhance.templates')}</div>
            <div className={styles.templateList}>
              {PRESET_TEMPLATES.map((tmpl) => (
                <button
                  key={tmpl.id}
                  className={`${styles.templateItem} ${selectedTemplateId === tmpl.id ? styles.active : ''}`}
                  onClick={() => handleSelectTemplate(tmpl)}
                >
                  <Icon name={tmpl.icon} size="sm" />
                  <span>{tmpl.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Right: Editor */}
          <div className={styles.editorPanel}>
            <div className={styles.field}>
              <label className={styles.label}>{t('enhance.role')}</label>
              <select className={styles.select} value={role} onChange={(e) => setRole(e.target.value)}>
                {ROLE_OPTIONS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>{t('enhance.format')}</label>
              <div className={styles.formatGroup}>
                {FORMAT_OPTIONS.map((fmt) => (
                  <label key={fmt.id} className={styles.checkbox}>
                    <input
                      type="checkbox"
                      checked={format.includes(fmt.id)}
                      onChange={() => toggleFormat(fmt.id)}
                    />
                    <span>{fmt.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>{t('enhance.language')}</label>
              <select className={styles.select} value={language} onChange={(e) => setLanguage(e.target.value)}>
                {LANGUAGE_OPTIONS.map((l) => (
                  <option key={l.id} value={l.id}>{l.label}</option>
                ))}
              </select>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>{t('enhance.constraints')}</label>
              <input
                type="text"
                className={styles.input}
                value={constraints}
                onChange={(e) => setConstraints(e.target.value)}
                placeholder={t('enhance.constraintsPlaceholder')}
              />
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className={styles.preview}>
          <div className={styles.sectionTitle}>{t('enhance.preview')}</div>
          <pre className={styles.previewContent}>{preview}</pre>
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <button className={styles.cancelBtn} onClick={onClose}>
            {t('enhance.cancel')}
          </button>
          <button className={styles.applyBtn} onClick={() => onApply(preview)}>
            {t('enhance.apply')}
          </button>
        </div>
      </div>
    </div>
  );
};
