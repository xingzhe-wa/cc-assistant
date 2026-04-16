import React, { useState, useEffect } from 'react';
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
    models: {
      default: '',
      opus: '',
      max: ''
    }
  });

  useEffect(() => {
    if (provider) {
      setFormData(provider);
    } else {
      setFormData({
        name: '',
        url: '',
        apiKey: '',
        models: {
          default: '',
          opus: '',
          max: ''
        }
      });
    }
  }, [provider, isOpen]);

  const handleSubmit = () => {
    // 简单验证
    if (!formData.name.trim()) {
      alert('请输入供应商名称');
      return;
    }
    if (!formData.url.trim()) {
      alert('请输入 API 地址');
      return;
    }

    if (isEdit && provider?.id) {
      updateProvider(provider.id, formData);
    } else {
      addProvider({ ...formData, status: 'off' });
    }
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? '编辑供应商' : '新增供应商'}
      size="md"
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
        <div className={styles.field}>
          <label className={styles.label}>
            供应商名称 <span className={styles.required}>*</span>
          </label>
          <input
            type="text"
            className={styles.input}
            placeholder="例如：Claude、DeepSeek"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>
            API 地址 <span className={styles.required}>*</span>
          </label>
          <input
            type="text"
            className={styles.input}
            placeholder="https://api.example.com"
            value={formData.url}
            onChange={(e) => setFormData({ ...formData, url: e.target.value })}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>API Key</label>
          <input
            type="password"
            className={styles.input}
            placeholder="sk-ant-xxxx"
            value={formData.apiKey}
            onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
          />
        </div>

        <div className={styles.fieldGroup}>
          <label className={styles.label}>模型配置</label>

          <div className={styles.field}>
            <label className={styles.subLabel}>默认模型</label>
            <input
              type="text"
              className={styles.input}
              placeholder="claude-4.5"
              value={formData.models.default}
              onChange={(e) => setFormData({
                ...formData,
                models: { ...formData.models, default: e.target.value }
              })}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.subLabel}>Opus 模型</label>
            <input
              type="text"
              className={styles.input}
              placeholder="claude-opus-4"
              value={formData.models.opus}
              onChange={(e) => setFormData({
                ...formData,
                models: { ...formData.models, opus: e.target.value }
              })}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.subLabel}>Max 模型</label>
            <input
              type="text"
              className={styles.input}
              placeholder="claude-max"
              value={formData.models.max}
              onChange={(e) => setFormData({
                ...formData,
                models: { ...formData.models, max: e.target.value }
              })}
            />
          </div>
        </div>
      </div>
    </Modal>
  );
};
