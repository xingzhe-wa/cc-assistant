import { useCallback } from 'react';
import { useChatStore } from '@/stores';
import type { ToastType } from '@/types/mock';

/**
 * useToast - Toast 提示 Hook
 *
 * 提供简单的方法来显示 toast 消息。
 *
 * @example
 * ```tsx
 * const { toast, success, error, info, warning } = useToast();
 *
 * return (
 *   <button onClick={() => success('保存成功！')}>
 *     点击
 *   </button>
 * );
 * ```
 */
export function useToast() {
  const addToast = useChatStore((state) => state.addToast);

  /** 基础 toast 函数 */
  const toast = useCallback((message: string, type: ToastType = 'info') => {
    addToast(message, type);
  }, [addToast]);

  /** 成功提示 */
  const success = useCallback((message: string) => {
    addToast(message, 'success');
  }, [addToast]);

  /** 错误提示 */
  const error = useCallback((message: string) => {
    addToast(message, 'error');
  }, [addToast]);

  /** 信息提示 */
  const info = useCallback((message: string) => {
    addToast(message, 'info');
  }, [addToast]);

  /** 警告提示 */
  const warning = useCallback((message: string) => {
    addToast(message, 'warning');
  }, [addToast]);

  return {
    /** 基础 toast 函数 */
    toast,
    /** 成功提示 */
    success,
    /** 错误提示 */
    error,
    /** 信息提示 */
    info,
    /** 警告提示 */
    warning
  };
}

export default useToast;
