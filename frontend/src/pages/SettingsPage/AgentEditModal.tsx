import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/common';
import { useConfigStore } from '@/stores';
import styles from './EditModal.module.css';

interface Agent {
  id?: string;
  name: string;
  description: string;
  systemPrompt: string;
}

interface AgentEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  agent?: Agent | null;
}

export const AgentEditModal: React.FC<AgentEditModalProps> = ({
  isOpen,
  onClose,
  agent
}) => {
  const { addAgent, updateAgent } = useConfigStore();

  const isEdit = !!agent?.id;
  const [formData, setFormData] = useState<Agent>({
    name: '',
    description: '',
    systemPrompt: ''
  });

  useEffect(() => {
    if (agent) {
      setFormData(agent);
    } else {
      setFormData({
        name: '',
        description: '',
        systemPrompt: ''
      });
    }
  }, [agent, isOpen]);

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      alert('请输入 Agent 名称');
      return;
    }
    if (!formData.description.trim()) {
      alert('请输入描述');
      return;
    }
    if (!formData.systemPrompt.trim()) {
      alert('请输入系统提示词');
      return;
    }

    if (isEdit && agent?.id) {
      updateAgent(agent.id, formData);
    } else {
      addAgent(formData);
    }
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? '编辑 Agent' : '新增 Agent'}
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
            Agent 名称 <span className={styles.required}>*</span>
          </label>
          <input
            type="text"
            className={styles.input}
            placeholder="例如：代码助手"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>
            描述 <span className={styles.required}>*</span>
          </label>
          <input
            type="text"
            className={styles.input}
            placeholder="简要描述这个 Agent 的用途"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
          <p className={styles.hint}>描述会在 Agent 列表中显示</p>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>
            系统提示词 <span className={styles.required}>*</span>
          </label>
          <textarea
            className={styles.textarea}
            placeholder="输入系统提示词，定义 Agent 的行为和角色..."
            value={formData.systemPrompt}
            onChange={(e) => setFormData({ ...formData, systemPrompt: e.target.value })}
          />
          <p className={styles.hint}>系统提示词会作为对话开始时的上下文</p>
        </div>
      </div>
    </Modal>
  );
};
