import { tool } from 'ai'
import { z } from 'zod'
import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import { app } from 'electron'

/**
 * Agent 可用工具注册表。
 *
 * @remarks
 * 当前提供文件读写工具。后续可扩展：网络搜索、Shell 执行、数据库查询等。
 */

/** 读取项目文件内容 */
const readFile = tool({
  description:
    '读取指定路径的文件内容。路径相对于项目根目录。返回文件文本内容，若文件不存在返回错误信息。',
  inputSchema: z.object({
    path: z.string().describe('相对于项目根目录的文件路径，例如 "src/main/index.ts"')
  }),
  execute: async ({ path }) => {
    try {
      const fullPath = join(app.getAppPath(), path)
      const content = readFileSync(fullPath, 'utf-8')
      return { success: true, content, path }
    } catch {
      return { success: false, error: `无法读取文件: ${path}`, path }
    }
  }
})

/** 写入内容到项目文件 */
const writeFile = tool({
  description: '将内容写入项目文件。路径相对于项目根目录。会自动创建不存在的父目录。',
  inputSchema: z.object({
    path: z.string().describe('相对于项目根目录的文件路径'),
    content: z.string().describe('要写入的文件内容')
  }),
  execute: async ({ path, content }) => {
    try {
      const fullPath = join(app.getAppPath(), path)
      writeFileSync(fullPath, content, 'utf-8')
      return { success: true, path }
    } catch {
      return { success: false, error: `无法写入文件: ${path}`, path }
    }
  }
})

/** 所有可用工具的集合 */
export const agentTools = {
  readFile,
  writeFile
}
