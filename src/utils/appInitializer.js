/**
 * 应用初始化工具
 * 处理应用启动时的各种初始化操作
 */

export class AppInitializer {
    constructor(store) {
        this.store = store
        this.initSteps = []
        this.currentStep = 0
        this.maxRetries = 3
    }

    /**
     * 添加初始化步骤
     */
    addStep(name, action, options = {}) {
        this.initSteps.push({
            name,
            action,
            required: options.required || false,
            retries: 0,
            maxRetries: options.maxRetries || this.maxRetries,
            timeout: options.timeout || 10000
        })
    }

    /**
     * 执行初始化
     */
    async initialize() {
        console.log('🚀 开始应用初始化...')
        const results = []

        for (let i = 0; i < this.initSteps.length; i++) {
            this.currentStep = i + 1
            const step = this.initSteps[i]

            console.log(`📋 步骤 ${this.currentStep}/${this.initSteps.length}: ${step.name}`)

            const result = await this.executeStep(step)
            results.push(result)

            // 如果是必需步骤且失败，停止初始化
            if (step.required && !result.success) {
                console.error(`❌ 必需步骤失败: ${step.name}`)
                throw new Error(`初始化失败: ${step.name}`)
            }
        }

        const successCount = results.filter(r => r.success).length
        console.log(`✅ 初始化完成: ${successCount}/${results.length} 步骤成功`)

        return {
            success: successCount > 0,
            total: results.length,
            successful: successCount,
            results
        }
    }

    /**
     * 执行单个步骤
     */
    async executeStep(step) {
        while (step.retries <= step.maxRetries) {
            try {
                const startTime = Date.now()

                // 设置超时
                const timeoutPromise = new Promise((_, reject) => {
                    setTimeout(() => reject(new Error('操作超时')), step.timeout)
                })

                // 执行步骤
                const result = await Promise.race([
                    step.action(),
                    timeoutPromise
                ])

                const duration = Date.now() - startTime
                console.log(`  ✅ ${step.name} 成功 (${duration}ms)`)

                return {
                    step: step.name,
                    success: true,
                    duration,
                    result,
                    retries: step.retries
                }

            } catch (error) {
                step.retries++
                console.warn(`  ⚠️ ${step.name} 失败 (尝试 ${step.retries}/${step.maxRetries + 1}): ${error.message}`)

                if (step.retries > step.maxRetries) {
                    return {
                        step: step.name,
                        success: false,
                        error: error.message,
                        retries: step.retries - 1
                    }
                }

                // 等待后重试
                await new Promise(resolve => setTimeout(resolve, 1000 * step.retries))
            }
        }
    }

    /**
     * 获取初始化进度
     */
    getProgress() {
        return {
            current: this.currentStep,
            total: this.initSteps.length,
            percentage: Math.round((this.currentStep / this.initSteps.length) * 100)
        }
    }
}

/**
 * 创建默认的应用初始化器
 */
export function createAppInitializer(store) {
    const initializer = new AppInitializer(store)

    // 添加API连接测试
    initializer.addStep('API连接测试', async () => {
        return await store.dispatch('testApiConnection')
    }, { required: false, maxRetries: 2, timeout: 8000 })

    // 添加专家数据加载
    initializer.addStep('专家数据加载', async () => {
        return await store.dispatch('loadPersons')
    }, { required: false, maxRetries: 3, timeout: 10000 })

    // 添加模型列表加载
    initializer.addStep('模型列表加载', async () => {
        return await store.dispatch('loadAvailableModels')
    }, { required: false, maxRetries: 2, timeout: 8000 })

    return initializer
}

/**
 * 简化的初始化函数
 */
export async function initializeApp(store, onProgress = null) {
    try {
        const initializer = createAppInitializer(store)

        // 如果提供了进度回调，设置监听
        if (onProgress) {
            const originalExecuteStep = initializer.executeStep
            initializer.executeStep = async function (step) {
                const progress = this.getProgress()
                onProgress(progress, step)
                return await originalExecuteStep.call(this, step)
            }
        }

        const result = await initializer.initialize()
        return result

    } catch (error) {
        console.error('应用初始化失败:', error)
        return {
            success: false,
            error: error.message
        }
    }
}

export default AppInitializer 