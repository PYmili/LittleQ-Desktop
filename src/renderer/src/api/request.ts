import axios from 'axios'
import type { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios'

/**
 * 应用全局 HTTP 客户端实例。
 *
 * @remarks
 * 基于 Axios 创建的单例，提供以下内置行为：
 * - **baseURL**：由 Vite 环境变量 `VITE_API_BASE_URL` 控制，默认 `'/api'`
 * - **超时**：10 秒，超时后自动抛出 `ECONNABORTED` 异常
 * - **请求拦截器**：预留 token 注入逻辑（从 Pinia store 获取认证凭据）
 * - **响应拦截器**：自动解包 `response.data`，统一格式化错误日志
 *
 * @example
 * ```ts
 * import { http } from '@renderer/api'
 *
 * // GET 请求
 * const users = await http.get('/users')
 *
 * // POST 请求
 * const result = await http.post('/chat', { message: 'hello' })
 * ```
 */
const http: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

http.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // TODO: 从 Pinia store 注入 token
    // const token = useAuthStore().token
    // if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

http.interceptors.response.use(
  (response: AxiosResponse) => {
    return response.data
  },
  (error) => {
    const message = error.response?.data?.message || error.message || '请求失败'
    console.error(`[HTTP Error] ${message}`)
    return Promise.reject(error)
  }
)

export default http

/**
 * Axios 相关类型重导出。
 *
 * @remarks
 * 建议使用以下类型编写请求函数签名：
 * - {@link AxiosInstance}：HTTP 实例类型
 * - {@link AxiosResponse}：响应对象类型
 * - {@link InternalAxiosRequestConfig}：拦截器中的请求配置类型
 */
export type { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse }
