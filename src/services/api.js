import { API_CONFIG, RESPONSE_CODES } from '@/config/api'

/**
 * 基础请求封装
 */
class ApiService {
    constructor() {
        this.baseURL = API_CONFIG.BASE_URL
        this.timeout = API_CONFIG.TIMEOUT
        this.headers = API_CONFIG.HEADERS
    }

    /**
     * 发送HTTP请求
     */
    async request(url, options = {}) {
        const config = {
            method: 'GET',
            headers: { ...this.headers },
            ...options
        }

        try {
            const response = await fetch(`${this.baseURL}${url}`, config)

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`)
            }

            const data = await response.json()

            if (data.code !== RESPONSE_CODES.SUCCESS) {
                throw new Error(data.msg || '请求失败')
            }

            return data
        } catch (error) {
            console.error('API请求失败:', error)
            throw error
        }
    }

    /**
     * GET请求
     */
    async get(url, params = {}) {
        const searchParams = new URLSearchParams(params)
        const queryString = searchParams.toString()
        const fullUrl = queryString ? `${url}?${queryString}` : url

        return this.request(fullUrl)
    }

    /**
     * POST请求
     */
    async post(url, data = {}) {
        return this.request(url, {
            method: 'POST',
            body: JSON.stringify(data)
        })
    }

    /**
     * PUT请求
     */
    async put(url, data = {}) {
        return this.request(url, {
            method: 'PUT',
            body: JSON.stringify(data)
        })
    }

    /**
     * DELETE请求
     */
    async delete(url) {
        return this.request(url, {
            method: 'DELETE'
        })
    }
}

const apiService = new ApiService()

/**
 * 人物管理API
 */
export const personApi = {
    /**
     * 添加人物
     * @param {Object} person - 人物信息
     * @param {string} person.name - 人物姓名
     * @param {string} person.description - 人物简介
     * @param {string} person.prompt - 人物提示词
     */
    async addPerson(person) {
        return apiService.post('/person/add', person)
    },

    /**
     * 获取人物列表
     */
    async getPersonList() {
        return apiService.get('/person/list')
    }
}

/**
 * 聊天相关API
 */
export const chatApi = {
    /**
     * 新建对话
     * @param {Object} params - 对话参数
     * @param {string} params.model - 使用的模型名
     * @param {string[]} params.people - 人物姓名数组（1-5个）
     */
    async newChat(params) {
        return apiService.post('/chat/new', params)
    },

    /**
     * 获取情感分析
     * @param {string} chatID - 对话ID
     */
    async getEmotion(chatID) {
        return apiService.get('/chat/emotion', { chatID })
    },

    /**
     * 发送聊天消息（SSE事件流）
     * @param {string} chatID - 对话ID
     * @param {string} message - 用户输入
     * @param {Function} onMessage - 接收消息的回调函数
     * @param {Function} onError - 错误处理回调
     * @param {Function} onComplete - 完成回调
     */
    async sendMessage(chatID, message, onMessage, onError, onComplete) {
        const url = `${apiService.baseURL}/chat/chat?chatID=${encodeURIComponent(chatID)}&message=${encodeURIComponent(message)}`

        try {
            const eventSource = new EventSource(url)

            eventSource.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data)
                    if (data.code === RESPONSE_CODES.SUCCESS) {
                        onMessage && onMessage(data)
                    } else {
                        onError && onError(new Error(data.msg || '聊天失败'))
                    }
                } catch (parseError) {
                    onError && onError(parseError)
                }
            }

            eventSource.onerror = (error) => {
                console.error('SSE连接错误:', error)
                eventSource.close()
                onError && onError(new Error('连接中断'))
            }

            eventSource.addEventListener('end', () => {
                eventSource.close()
                onComplete && onComplete()
            })

            return eventSource
        } catch (error) {
            onError && onError(error)
            throw error
        }
    }
}

/**
 * 模型管理API
 */
export const modelApi = {
    /**
     * 获取模型列表
     */
    async getModelList() {
        return apiService.get('/model/list')
    }
}

/**
 * 综合聊天服务 - 整合前端逻辑
 */
export const discussionService = {
    /**
     * 开始专家讨论（支持多轮对话）
     * @param {Object} params - 讨论参数
     * @param {string} params.topic - 讨论主题
     * @param {Array} params.experts - 选中的专家列表
     * @param {string} params.model - AI模型
     * @param {string} params.chatID - 现有的聊天ID（可选）
     * @param {Function} onExpertMessage - 专家消息回调
     * @param {Function} onError - 错误回调
     * @param {Function} onComplete - 完成回调
     * @param {Function} onChatIDReceived - chatID回调
     */
    async startDiscussion(params, onExpertMessage, onError, onComplete, onChatIDReceived) {
        const { topic, experts, model, chatID: existingChatID } = params

        try {
            let chatID = existingChatID

            // 1. 如果没有现有的chatID，创建新对话
            if (!chatID) {
                console.log('📞 创建新的聊天会话')
                const chatResponse = await chatApi.newChat({
                    model: model,
                    people: experts.map(expert => expert.name)
                })
                chatID = chatResponse.chatID
                console.log('💬 新会话ID:', chatID)
            } else {
                console.log('🔄 复用现有会话ID:', chatID)
            }

            // 2. 通知调用者chatID（用于保存）
            onChatIDReceived && onChatIDReceived(chatID)

            // 3. 发送讨论主题
            return chatApi.sendMessage(
                chatID,
                topic,
                (data) => {
                    // 处理专家回复
                    if (data.role && data.content) {
                        const expert = experts.find(e => e.name === data.role)
                        onExpertMessage && onExpertMessage({
                            expert: data.role,
                            role: expert?.role || '专家',
                            content: data.content,
                            timestamp: new Date(),
                            messageId: Date.now() + Math.random()
                        })
                    }
                },
                onError,
                onComplete
            )
        } catch (error) {
            onError && onError(error)
            throw error
        }
    }
}

export default apiService 