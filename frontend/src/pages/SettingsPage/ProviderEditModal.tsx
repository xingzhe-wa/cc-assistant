import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Modal } from '@/components/common';
import { useConfigStore } from '@/stores';
import styles from './EditModal.module.css';

interface Provider {
  id?: string;
  name: string;
  url: string;
  apiKey: string;
  models: {
    default: string;
    opus: string;
    max: string;
  };
  status?: 'ok' | 'err' | 'off';
}

interface ProviderEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  provider?: Provider | null;
}

// 预设供应商配置
const PRESET_PROVIDERS: Record<string, Partial<Provider>> = {
  claude: {
    name: 'Claude',
    url: 'https://api.anthropic.com',
    models: { default: 'claude-4.5', opus: 'claude-opus-4', max: 'claude-max' }
  },
  glm: {
    name: 'GLM',
    url: 'https://open.bigmodel.cn/api/paas/v4',
    models: { default: 'glm-5', opus: 'glm-5-plus', max: 'glm-5-max' }
  },
  kimi: {
    name: 'Kimi',
    url: 'https://api.moonshot.cn',
    models: { default: 'kimi-k2-turbo-preview', opus: 'kimi-k2-pro', max: 'kimi-max' }
  },
  deepseek: {
    name: 'DeepSeek',
    url: 'https://api.deepseek.com',
    models: { default: 'deepseek-reasoner', opus: 'deepseek-chat', max: 'deepseek-max' }
  },
  qwen: {
    name: 'Qwen',
    url: 'https://dashscope.aliyuncs.com/api/v2/apps/claude-code-proxy',
    models: { default: 'qwen3-coder-plus', opus: 'qwen3-max', max: 'qwen-max' }
  }
};

export const ProviderEditModal: React.FC<ProviderEditModalProps> = ({
  isOpen,
  onClose,
  provider
}) => {
  const { addProvider, updateProvider } = useConfigStore();

  const isEdit = !!provider?.id;
  const [formData, setFormData] = useState<Provider>({
    name: '',
    url: '',
    apiKey: '',
    models: { default: '', opus: '', max: '' }
  });
  const [jsonText, setJsonText] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [syncedFields, setSyncedFields] = useState<Set<string>>(new Set());

  // 防抖计时器
  const syncTimerRef = useRef<number | null>(null);
  const jsonSyncTimerRef = useRef<number | null>(null);

  // 构建 JSON 字符串
  const buildJson = useCallback((data: Provider): string => {
    return JSON.stringify({ provider: data }, null, 2);
  }, []);

  // 解析 JSON 为 Provider 对象
  const parseJson = useCallback((text: string): Provider | null => {
    try {
      const obj = JSON.parse(text);
      const p = obj.provider || obj;
      if (p.name !== undefined || p.url !== undefined) {
        return {
          name: p.name || '',
          url: p.url || '',
          apiKey: p.apiKey || '',
          models: {
            default: p.models?.default || '',
            opus: p.models?.opus || '',
            max: p.models?.max || ''
          }
        };
      }
      return null;
    } catch {
      return null;
    }
  }, []);

  // 同步指示器闪烁
  const flashSync = useCallback((ids: string[]) => {
    setSyncedFields(new Set(ids));
    setTimeout(() => setSyncedFields(new Set()), 800);
  }, []);

  // 表单 → JSON 防抖同步
  const handleFieldChange = useCallback((updates: Partial<Provider>) => {
    setFormData(prev => {
      const newData = { ...prev, ...updates };
      // 防抖更新 JSON
      if (syncTimerRef.current) {
        window.clearTimeout(syncTimerRef.current);
      }
      syncTimerRef.current = window.setTimeout(() => {
        setJsonText(buildJson(newData));
        flashSync(['name', 'url', 'apiKey', 'models']);
      }, 80);
      return newData;
    });
  }, [buildJson, flashSync]);

  // JSON → 表单实时同步（JSON 编辑时自动回填）
  const handleJsonChange = useCallback((text: string) => {
    setJsonText(text);
    if (jsonSyncTimerRef.current) {
      window.clearTimeout(jsonSyncTimerRef.current);
    }
    jsonSyncTimerRef.current = window.setTimeout(() => {
      const parsed = parseJson(text);
      if (parsed) {
        setFormData(parsed);
        flashSync(['name', 'url', 'apiKey', 'models']);
      }
    }, 120);
  }, [parseJson, flashSync]);

  // 手动从 JSON 填充
  const handleJsonFill = useCallback(() => {
    const parsed = parseJson(jsonText);
    if (parsed) {
      setFormData(parsed);
      flashSync(['name', 'url', 'apiKey', 'models']);
    } else {
      setValidationError('JSON 格式无效，请检查后再试');
    }
  }, [jsonText, parseJson, flashSync]);

  // 初始化
  useEffect(() => {
    if (isOpen) {
      if (provider) {
        setFormData(provider);
        setJsonText(buildJson(provider));
      } else {
        const empty = { name: '', url: '', apiKey: '', models: { default: '', opus: '', max: '' } };
        setFormData(empty);
        setJsonText(buildJson(empty));
      }
      setValidationError(null);
      setSyncedFields(new Set());
    }
    return () => {
      if (syncTimerRef.current) window.clearTimeout(syncTimerRef.current);
      if (jsonSyncTimerRef.current) window.clearTimeout(jsonSyncTimerRef.current);
    };
  }, [isOpen, provider, buildJson]);

  // 快捷配置
  const handleQuickConfig = (presetKey: string) => {
    const preset = PRESET_PROVIDERS[presetKey];
    if (preset) {
      const newData: Provider = {
        name: preset.name || '',
        url: preset.url || '',
        apiKey: '',
        models: preset.models || { default: '', opus: '', max: '' }
      };
      setFormData(newData);
      setJsonText(buildJson(newData));
    }
  };

  // 提交
  const handleSubmit = () => {
    if (!formData.name.trim()) {
      setValidationError('请输入供应商名称');
      return;
    }
    if (!formData.url.trim()) {
      setValidationError('请输入 API 地址');
      return;
    }

    if (isEdit && provider?.id) {
      updateProvider(provider.id, formData);
    } else {
      addProvider({ ...formData, status: 'off' });
    }
    onClose();
  };

  // 复制 JSON
  const handleJsonExport = () => {
    navigator.clipboard.writeText(jsonText);
  };

  // 同步指示器组件
  const SyncIndicator = ({ field }: { field: string }) => (
    <span className={`${styles.syncIndicator} ${syncedFields.has(field) ? styles.show : ''}`}>
      synced
    </span>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? '编辑供应商' : '新增供应商'}
      size="xl"
      footer={
        <div className={styles.modalFooter}>
          <button className={styles.btnCancel} onClick={onClose}>
            取消
          </button>
          <button className={styles.btnConfirm} onClick={handleSubmit}>
            {isEdit ? '保存' : '创建'}
          </button>
        </div>
      }
    >
      <div className={styles.form}>
        {validationError && (
          <div className={styles.error}>
            <span className="material-icons-round">error</span>
            {validationError}
          </div>
        )}

        {!isEdit && (
          <>
            <div className={styles.field}>
              <label className={styles.label}>快捷配置</label>
              <div className={styles.quickConfig}>
                {Object.entries(PRESET_PROVIDERS).map(([key, preset]) => (
                  <button
                    key={key}
                    className={styles.quickConfigBtn}
                    onClick={() => handleQuickConfig(key)}
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.divider} />
          </>
        )}

        <div className={styles.field}>
          <label className={styles.label}>
            供应商名称 <span className={styles.required}>*</span>
            <SyncIndicator field="name" />
          </label>
          <input
            type="text"
            className={styles.input}
            placeholder="例如：Claude、DeepSeek"
            value={formData.name}
            onChange={(e) => handleFieldChange({ name: e.target.value })}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>
            API 地址 <span className={styles.required}>*</span>
            <SyncIndicator field="url" />
          </label>
          <input
            type="text"
            className={styles.input}
            placeholder="https://api.example.com"
            value={formData.url}
            onChange={(e) => handleFieldChange({ url: e.target.value })}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>
            API Key
            <SyncIndicator field="apiKey" />
          </label>
          <input
            type="password"
            className={styles.input}
            placeholder="sk-ant-xxxx"
            value={formData.apiKey}
            onChange={(e) => handleFieldChange({ apiKey: e.target.value })}
          />
        </div>

        <div className={styles.fieldGroup}>
          <label className={styles.label}>
            模型配置
            <SyncIndicator field="models" />
          </label>

          <div className={styles.field}>
            <label className={styles.subLabel}>default</label>
            <input
              type="text"
              className={styles.input}
              placeholder="默认模型标识"
              value={formData.models.default}
              onChange={(e) => handleFieldChange({
                models: { ...formData.models, default: e.target.value }
              })}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.subLabel}>opus</label>
            <input
              type="text"
              className={styles.input}
              placeholder="高能力模型标识"
              value={formData.models.opus}
              onChange={(e) => handleFieldChange({
                models: { ...formData.models, opus: e.target.value }
              })}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.subLabel}>max</label>
            <input
              type="text"
              className={styles.input}
              placeholder="最大模型标识"
              value={formData.models.max}
              onChange={(e) => handleFieldChange({
                models: { ...formData.models, max: e.target.value }
              })}
            />
          </div>
        </div>

        <div className={styles.divider} />

        <div className={styles.field}>
          <div className={styles.jsonHeader}>
            <label className={styles.label}>JSON 配置</label>
            <div className={styles.jsonActions}>
              <button className={styles.jsonToggle} onClick={handleJsonExport} title="复制 JSON">
                <span className="material-icons-round">content_copy</span>
              </button>
            </div>
          </div>
          <textarea
            className={styles.textarea}
            value={jsonText}
            onChange={(e) => handleJsonChange(e.target.value)}
            placeholder='{"provider": {"name": "", "url": "", "apiKey": "", "models": {...}}}'
          />
          <div className={styles.formHint}>
            <span className="material-icons-round">info</span>
            编辑 JSON 后点击下方按钮可反向填充所有字段
          </div>
          <button className={styles.jsonFillBtn} onClick={handleJsonFill}>
            <span className="material-icons-round">arrow_upward</span>
            从 JSON 填充到上方字段
          </button>
        </div>
      </div>
    </Modal>
  );
};