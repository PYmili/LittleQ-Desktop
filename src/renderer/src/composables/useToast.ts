import { ElMessage } from 'element-plus'

/**
 * Toast 消息提示封装。
 *
 * @remarks
 * 基于 Element Plus 的 `ElMessage`，统一暗色主题下交互反馈。
 * 所有方法自动适配当前深色背景风格。
 *
 * @example
 * ```ts
 * import { useToast } from '@renderer/composables/useToast'
 * const toast = useToast()
 * toast.success('保存成功')
 * toast.error('保存失败，请重试')
 * toast.warning('请填写必填项')
 * ```
 */
export function useToast() {
  return {
    /**
     * 成功提示。
     *
     * @param msg - 提示文本
     */
    success: (msg: string) => ElMessage({ message: msg, type: 'success' }),

    /**
     * 错误提示。
     *
     * @param msg - 提示文本
     */
    error: (msg: string) => ElMessage({ message: msg, type: 'error' }),

    /**
     * 警告提示。
     *
     * @param msg - 提示文本
     */
    warning: (msg: string) => ElMessage({ message: msg, type: 'warning' }),

    /**
     * 普通信息提示。
     *
     * @param msg - 提示文本
     */
    info: (msg: string) => ElMessage({ message: msg, type: 'info' })
  }
}
