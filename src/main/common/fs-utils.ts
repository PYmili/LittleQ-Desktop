import { existsSync, mkdirSync } from 'fs'

/**
 * 公共文件系统工具。
 *
 * @remarks
 * 提供跨模块复用的基础文件系统操作。
 */

/**
 * 确保目录存在，若不存在则递归创建。
 *
 * @param path - 目录路径
 */
export function ensureDir(path: string): void {
  if (!existsSync(path)) {
    mkdirSync(path, { recursive: true })
  }
}

/**
 * 根据时间戳获取日期目录名（YYYY-MM-DD）。
 *
 * @param ts - 时间戳（毫秒）
 * @returns 格式化日期字符串，如 `2024-01-15`
 */
export function dateDir(ts: number): string {
  const d = new Date(ts)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
