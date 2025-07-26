import { API_CONFIG } from '@/config/api'

/**
 * API验证工具类
 */
export class ApiValidator {
    constructor() {
        this.baseURL = API_CONFIG.BASE_URL
        this.timeout = 5000 // 5秒超时
    }

    /**
     * 测试基础连接
     */
    async testConnection() {
        try {
            const controller = new AbortController()
            const timeoutId = setTimeout(() => controller.abort(), this.timeout)

            const response = await fetch(`${this.baseURL}/model/list`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                signal: controller.signal
            })

            clearTimeout(timeoutId)

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`)
            }

            const data = await response.json()
            return {
                success: true,
                message: '后端API连接成功',
                data: data
            }
        } catch (error) {
            if (error.name === 'AbortError') {
                throw new Error('请求超时：后端服务响应时间过长')
            }
            if (error.message.includes('fetch')) {
                throw new Error('网络连接失败：无法连接到后端服务')
            }
            throw new Error(`连接失败: ${error.message}`)
        }
    }

    /**
     * 测试所有关键API端点
     */
    async testAllEndpoints() {
        const endpoints = [
            { path: '/model/list', name: '模型列表' },
            { path: '/person/list', name: '人物列表' }
        ]

        const results = []

        for (const endpoint of endpoints) {
            try {
                const response = await fetch(`${this.baseURL}${endpoint.path}`, {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' }
                })

                results.push({
                    endpoint: endpoint.name,
                    path: endpoint.path,
                    success: response.ok,
                    status: response.status,
                    message: response.ok ? '正常' : `HTTP ${response.status}`
                })
            } catch (error) {
                results.push({
                    endpoint: endpoint.name,
                    path: endpoint.path,
                    success: false,
                    status: 0,
                    message: error.message
                })
            }
        }

        return results
    }

    /**
     * 获取后端健康状态
     */
    async getHealthStatus() {
        try {
            const startTime = Date.now()
            await this.testConnection()
            const responseTime = Date.now() - startTime

            return {
                status: 'healthy',
                responseTime: `${responseTime}ms`,
                timestamp: new Date().toISOString(),
                baseURL: this.baseURL
            }
        } catch (error) {
            return {
                status: 'unhealthy',
                error: error.message,
                timestamp: new Date().toISOString(),
                baseURL: this.baseURL
            }
        }
    }

    /**
     * 生成诊断报告
     */
    async generateDiagnosticReport() {
        const report = {
            timestamp: new Date().toISOString(),
            baseURL: this.baseURL,
            browser: navigator.userAgent,
            online: navigator.onLine
        }

        try {
            // 测试基础连接
            const connectionTest = await this.testConnection()
            report.connection = connectionTest

            // 测试所有端点
            const endpointTests = await this.testAllEndpoints()
            report.endpoints = endpointTests

            // 获取健康状态
            const healthStatus = await this.getHealthStatus()
            report.health = healthStatus

            report.overall = 'success'
            report.summary = `所有测试通过，响应时间 ${healthStatus.responseTime}`

        } catch (error) {
            report.overall = 'failed'
            report.error = error.message
            report.summary = `诊断失败: ${error.message}`
        }

        return report
    }
}

// 创建默认实例
export const apiValidator = new ApiValidator()

// 便捷方法
export const validateApi = () => apiValidator.testConnection()
export const getApiHealth = () => apiValidator.getHealthStatus()
export const generateReport = () => apiValidator.generateDiagnosticReport()

export default apiValidator 