/**
 * API 层统一入口。
 *
 * @remarks
 * 通过该文件统一导出 `http` 实例及 Axios 相关类型，
 * 其他模块只需 `import { http } from '@renderer/api'` 即可发起请求。
 *
 * @example
 * ```ts
 * import { http } from '@renderer/api'
 *
 * const data = await http.get('/users')
 * ```
 */
export { default as http } from './request'
export type { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from './request'
