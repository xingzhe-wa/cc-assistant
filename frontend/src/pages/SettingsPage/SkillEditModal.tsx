import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/common';
import { useConfigStore } from '@/stores';
import styles from './EditModal.module.css';

interface Skill {
  id?: string;
  name: string;
  description: string;
  triggerRule: string;
  scope?: 'global' | 'project';
}

interface SkillEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  skill?: Skill | null;
}

export const SkillEditModal: React.FC<SkillEditModalProps> = ({
  isOpen,
  onClose,
  skill
}) => {
  const { addSkill, updateSkill } = useConfigStore();

  const isEdit = !!skill?.id;
  const [formData, setFormData] = useState<Skill>({
    name: '',
    description: '',
    triggerRule: '',
    scope: 'project'
  });
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (skill) {
      setFormData(skill);
    } else {
      setFormData({
        name: '',
        description: '',
        triggerRule: '',
        scope: 'project'
      });
    }
    setValidationError(null);
  }, [skill, isOpen]);

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      setValidationError('请输入 Skill 名称');
      return;
    }
    if (!formData.description.trim()) {
      setValidationError('请输入描述');
      return;
    }
    if (!formData.triggerRule.trim()) {
      setValidationError('请输入触发规则');
      return;
    }

    if (isEdit && skill?.id) {
      updateSkill(skill.id, formData);
    } else {
      addSkill(formData);
    }
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? '编辑 Skill' : '新增 Skill'}
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
        {validationError && (
          <div className={styles.error}>
            <span className="material-icons-round">error</span>
            {validationError}
          </div>
        )}
        <div className={styles.field}>
          <label className={styles.label}>
            Skill 名称 <span className={styles.required}>*</span>
          </label>
          <input
            type="text"
            className={styles.input}
            placeholder="例如：代码审查"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>作用域</label>
          <select
            className={styles.select}
            value={formData.scope || 'project'}
            onChange={(e) => setFormData({ ...formData, scope: e.target.value as 'global' | 'project' })}
          >
            <option value="project">项目 (.claude/skills/)</option>
            <option value="global">全局 (~/.claude/skills/)</option>
          </select>
          <p className={styles.hint}>项目作用域仅当前项目可用；全局作用域所有项目共享</p>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>
            描述 <span className={styles.required}>*</span>
          </label>
          <input
            type="text"
            className={styles.input}
            placeholder="简要描述这个 Skill 的功能"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
          <p className={styles.hint}>描述会在 Skill 列表中显示</p>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>
            触发规则 <span className={styles.required}>*</span>
          </label>
          <select
            className={styles.select}
            value={formData.triggerRule}
            onChange={(e) => setFormData({ ...formData, triggerRule: e.target.value })}
          >
            <option value="">请选择触发方式</option>
            <option value="关键词触发">关键词触发</option>
            <option value="正则表达式">正则表达式</option>
            <option value="手动触发">手动触发</option>
            <option value="AI 判断">AI 判断</option>
          </select>
          <p className={styles.hint}>定义何时激活此 Skill</p>
        </div>
      </div>
    </Modal>
  );
};
