import { API_CONFIG } from '@/config/api'
import { apiValidator } from './apiValidator'

/**
 * API诊断工具
 */
export class ApiDiagnostics {
    constructor(store) {
        this.store = store
        this.results = []
    }

    /**
     * 运行完整诊断
     */
    async runFullDiagnostic() {
        console.log('🔍 开始API完整诊断...')
        this.results = []

        // 基础检查
        await this.checkBasicConfig()
        await this.checkNetworkConnectivity()
        await this.checkApiEndpoints()
        await this.checkDataFlow()
        await this.checkStoreState()

        const report = this.generateReport()
        console.log('📋 诊断报告:', report)
        return report
    }

    /**
     * 检查基础配置
     */
    async checkBasicConfig() {
        const test = {
            name: '基础配置检查',
            category: 'config',
            tests: []
        }

        // 检查API基础URL
        test.tests.push({
            name: 'API基础URL配置',
            result: !!API_CONFIG.BASE_URL,
            value: API_CONFIG.BASE_URL,
            expected: '有效的URL'
        })

        // 检查浏览器环境
        test.tests.push({
            name: '浏览器fetch支持',
            result: typeof fetch !== 'undefined',
            value: typeof fetch,
            expected: 'function'
        })

        // 检查网络状态
        test.tests.push({
            name: '网络连接状态',
            result: navigator.onLine,
            value: navigator.onLine ? '在线' : '离线',
            expected: '在线'
        })

        this.results.push(test)
    }

    /**
     * 检查网络连通性
     */
    async checkNetworkConnectivity() {
        const test = {
            name: '网络连通性检查',
            category: 'network',
            tests: []
        }

        try {
            // 测试基础连接
            const startTime = Date.now()
            const result = await apiValidator.testConnection()
            const responseTime = Date.now() - startTime

            test.tests.push({
                name: '后端API连接',
                result: result.success,
                value: `${responseTime}ms`,
                expected: '< 5000ms',
                details: result.message
            })
        } catch (error) {
            test.tests.push({
                name: '后端API连接',
                result: false,
                value: '连接失败',
                expected: '连接成功',
                error: error.message
            })
        }

        this.results.push(test)
    }

    /**
     * 检查API端点
     */
    async checkApiEndpoints() {
        const test = {
            name: 'API端点检查',
            category: 'endpoints',
            tests: []
        }

        const endpoints = [
            { path: '/model/list', name: '模型列表' },
            { path: '/person/list', name: '人物列表' }
        ]

        for (const endpoint of endpoints) {
            try {
                const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint.path}`, {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' }
                })

                test.tests.push({
                    name: endpoint.name,
                    result: response.ok,
                    value: `HTTP ${response.status}`,
                    expected: 'HTTP 200',
                    path: endpoint.path
                })
            } catch (error) {
                test.tests.push({
                    name: endpoint.name,
                    result: false,
                    value: '请求失败',
                    expected: 'HTTP 200',
                    path: endpoint.path,
                    error: error.message
                })
            }
        }

        this.results.push(test)
    }

    /**
     * 检查数据流
     */
    async checkDataFlow() {
        const test = {
            name: '数据流检查',
            category: 'dataflow',
            tests: []
        }

        // 检查人物数据加载
        try {
            const persons = await this.store.dispatch('loadPersons')
            test.tests.push({
                name: '人物数据加载',
                result: Array.isArray(persons) && persons.length > 0,
                value: `${persons?.length || 0} 个人物`,
                expected: '> 0 个人物'
            })
        } catch (error) {
            test.tests.push({
                name: '人物数据加载',
                result: false,
                value: '加载失败',
                expected: '成功加载',
                error: error.message
            })
        }

        // 检查模型列表加载
        try {
            const models = await this.store.dispatch('loadAvailableModels')
            test.tests.push({
                name: '模型列表加载',
                result: Array.isArray(models) && models.length > 0,
                value: `${models?.length || 0} 个模型`,
                expected: '> 0 个模型'
            })
        } catch (error) {
            test.tests.push({
                name: '模型列表加载',
                result: false,
                value: '加载失败',
                expected: '成功加载',
                error: error.message
            })
        }

        this.results.push(test)
    }

    /**
     * 检查Store状态
     */
    async checkStoreState() {
        const test = {
            name: 'Store状态检查',
            category: 'store',
            tests: []
        }

        const state = this.store.state

        // 检查API连接状态
        test.tests.push({
            name: 'API连接状态',
            result: state.apiConnected,
            value: state.apiConnected ? '已连接' : '未连接',
            expected: '已连接'
        })

        // 检查运行模式
        test.tests.push({
            name: '运行模式',
            result: true, // 总是通过，只是显示信息
            value: state.mockMode ? '演示模式' : '真实API模式',
            expected: '任意模式'
        })

        // 检查专家数据
        test.tests.push({
            name: '专家数据',
            result: state.allTalents.length > 0,
            value: `${state.allTalents.length} 位专家`,
            expected: '> 0 位专家'
        })

        // 检查模型数据
        test.tests.push({
            name: '可用模型',
            result: state.availableModels.length > 0,
            value: `${state.availableModels.length} 个模型`,
            expected: '> 0 个模型'
        })

        this.results.push(test)
    }

    /**
     * 生成诊断报告
     */
    generateReport() {
        const totalTests = this.results.reduce((sum, category) => sum + category.tests.length, 0)
        const passedTests = this.results.reduce((sum, category) => {
            return sum + category.tests.filter(test => test.result).length
        }, 0)

        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                total: totalTests,
                passed: passedTests,
                failed: totalTests - passedTests,
                successRate: Math.round((passedTests / totalTests) * 100)
            },
            categories: this.results,
            recommendations: this.generateRecommendations()
        }

        return report
    }

    /**
     * 生成修复建议
     */
    generateRecommendations() {
        const recommendations = []
        const state = this.store.state

        // 检查是否有连接问题
        if (!state.apiConnected) {
            recommendations.push({
                type: 'error',
                title: 'API连接失败',
                description: '无法连接到后端API服务',
                actions: [
                    '检查后端服务是否运行在 http://localhost:8080',
                    '确认网络连接正常',
                    '尝试切换到演示模式'
                ]
            })
        }

        // 检查专家数据
        if (state.allTalents.length === 0) {
            recommendations.push({
                type: 'warning',
                title: '专家数据缺失',
                description: '未能加载专家人物数据',
                actions: [
                    '检查 /api/person/list 接口是否正常',
                    '尝试刷新页面重新加载',
                    '查看浏览器控制台错误信息'
                ]
            })
        }

        // 检查模型数据
        if (state.availableModels.length === 0) {
            recommendations.push({
                type: 'warning',
                title: '模型列表缺失',
                description: '未能加载可用模型列表',
                actions: [
                    '检查 /api/model/list 接口是否正常',
                    '确认后端模型配置正确',
                    '尝试手动刷新模型列表'
                ]
            })
        }

        // 如果一切正常
        if (recommendations.length === 0) {
            recommendations.push({
                type: 'success',
                title: '系统状态良好',
                description: '所有组件运行正常',
                actions: [
                    '可以正常使用所有功能',
                    '如遇问题可重新运行诊断'
                ]
            })
        }

        return recommendations
    }

    /**
     * 输出格式化的控制台报告
     */
    printConsoleReport() {
        const report = this.generateReport()

        console.log('\n🔍 ===== API诊断报告 =====')
        console.log(`📊 总体状况: ${report.summary.passed}/${report.summary.total} 测试通过 (${report.summary.successRate}%)`)

        report.categories.forEach(category => {
            console.log(`\n📋 ${category.name}:`)
            category.tests.forEach(test => {
                const icon = test.result ? '✅' : '❌'
                console.log(`  ${icon} ${test.name}: ${test.value}`)
                if (test.error) {
                    console.log(`    错误: ${test.error}`)
                }
            })
        })

        console.log('\n💡 建议:')
        report.recommendations.forEach((rec, index) => {
            const icon = rec.type === 'success' ? '✅' : rec.type === 'warning' ? '⚠️' : '❌'
            console.log(`  ${icon} ${rec.title}: ${rec.description}`)
            rec.actions.forEach(action => {
                console.log(`    - ${action}`)
            })
        })

        console.log('\n===== 诊断完成 =====\n')

        return report
    }
}

/**
 * 快速诊断函数
 */
export async function quickDiagnostic(store) {
    const diagnostics = new ApiDiagnostics(store)
    return await diagnostics.printConsoleReport()
}

/**
 * 浏览器控制台诊断命令
 */
if (typeof window !== 'undefined') {
    window.runApiDiagnostic = (store) => {
        const diagnostics = new ApiDiagnostics(store)
        return diagnostics.runFullDiagnostic()
    }
}

export default ApiDiagnostics 