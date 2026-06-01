/**
 * ID 生成工具。
 *
 * @remarks
 * 提供客户端侧的唯一 ID 生成函数，用于消息、会话等实体的标识。
 */

/**
 * 生成简易唯一 ID。
 *
 * @remarks
 * 结合当前时间戳（36 进制）与随机字符串，在客户端环境下碰撞概率极低。
 *
 * @returns 由时间戳与随机数组成的字符串 ID
 */
export function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}
