import { ref, computed } from 'vue'

/**
 * 表单验证规则定义。
 */
interface ValidationRule {
  /** 验证函数，返回 true 表示通过 */
  validator: (value: string) => boolean
  /** 验证失败时的提示文本 */
  message: string
}

/**
 * 表单字段验证状态。
 */
interface FieldState {
  value: string
  rules: ValidationRule[]
  touched: boolean
}

/**
 * 表单验证 composable。
 *
 * @remarks
 * 提供声明式的表单验证能力。每个字段可配置多条规则，
 * 仅在字段被"触碰"（失焦或提交）后才显示错误。
 *
 * @example
 * ```ts
 * const { field, validateAll, errors } = useFormValidation({
 *   name: [{ validator: v => !!v.trim(), message: '名称不能为空' }],
 *   apiKey: [{ validator: v => v.length > 0, message: 'API Key 不能为空' }]
 * })
 *
 * // 提交时验证
 * if (!validateAll()) return
 * ```
 */
export function useFormValidation(fieldConfigs: Record<string, ValidationRule[]>) {
  const fields = ref<Record<string, FieldState>>({})

  for (const [name, rules] of Object.entries(fieldConfigs)) {
    fields.value[name] = { value: '', rules, touched: false }
  }

  /** 设置字段值 */
  function setValue(name: string, value: string) {
    if (fields.value[name]) {
      fields.value[name].value = value
    }
  }

  /** 标记字段为已触碰 */
  function touch(name: string) {
    if (fields.value[name]) {
      fields.value[name].touched = true
    }
  }

  /** 标记所有字段为已触碰 */
  function touchAll() {
    for (const name of Object.keys(fields.value)) {
      fields.value[name].touched = true
    }
  }

  /** 单个字段的错误信息（computed） */
  function getError(name: string) {
    const field = fields.value[name]
    if (!field || !field.touched) return ''
    for (const rule of field.rules) {
      if (!rule.validator(field.value)) return rule.message
    }
    return ''
  }

  /** 所有字段的错误信息映射 */
  const errors = computed(() => {
    const result: Record<string, string> = {}
    for (const name of Object.keys(fields.value)) {
      result[name] = getError(name)
    }
    return result
  })

  /** 验证所有字段，返回是否全部通过 */
  function validateAll(): boolean {
    touchAll()
    for (const name of Object.keys(fields.value)) {
      if (getError(name)) return false
    }
    return true
  }

  /** 获取字段值 */
  function getValue(name: string): string {
    return fields.value[name]?.value || ''
  }

  return { fields, setValue, getValue, touch, touchAll, getError, errors, validateAll }
}
