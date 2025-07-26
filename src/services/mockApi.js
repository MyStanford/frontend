import { RESPONSE_CODES } from '@/config/api'

/**
 * 模拟API服务 - 用于演示和开发
 */
class MockApiService {
    constructor() {
        this.delay = 1000 // 模拟网络延迟
    }

    /**
     * 模拟延迟
     */
    async simulateDelay() {
        await new Promise(resolve => setTimeout(resolve, this.delay))
    }

    /**
     * 模拟响应格式
     */
    createResponse(data, message = 'success') {
        return {
            code: RESPONSE_CODES.SUCCESS,
            msg: message,
            data
        }
    }
}

const mockApiService = new MockApiService()

/**
 * 模拟人物管理API
 */
export const mockPersonApi = {
    /**
 * 获取人物列表
 */
    async getPersonList() {
        await mockApiService.simulateDelay()

        // 使用完整的静态专家数据作为模拟数据
        const { talents } = await import('@/data/talents')

        // 将静态数据转换为API格式
        const mockPersons = talents.map(talent => ({
            id: Date.now() + Math.random(), // 模拟ID
            name: talent.name,
            description: talent.description,
            prompt: talent.prompt,
            role: talent.role,
            specialty: talent.specialty,
            avatar: talent.avatar,
            category: talent.category,
            personality: talent.personality,
            createdAt: new Date().toISOString()
        }))

        return mockApiService.createResponse(mockPersons, '获取人物列表成功')
    },

    /**
     * 添加人物
     */
    async addPerson(person) {
        await mockApiService.simulateDelay()

        const newPerson = {
            ...person,
            id: Date.now(),
            createdAt: new Date().toISOString()
        }

        return mockApiService.createResponse(newPerson, '添加人物成功')
    }
}

/**
 * 模拟聊天API
 */
export const mockChatApi = {
    /**
     * 新建对话
     */
    async newChat(params) {
        await mockApiService.simulateDelay()

        const chatID = `chat_${Date.now()}_${Math.random().toString(36).slice(2)}`

        return {
            code: RESPONSE_CODES.SUCCESS,
            msg: '新建对话成功',
            chatID
        }
    },

    /**
     * 获取情感分析
     */
    async getEmotion(chatID) {
        await mockApiService.simulateDelay()

        const mockEmotions = {
            '乔布斯': 0.8,
            '马斯克': 0.9,
            '图灵': 0.7
        }

        return mockApiService.createResponse(mockEmotions, '获取情感分析成功')
    },

    /**
     * 发送聊天消息（模拟SSE）
     */
    async sendMessage(chatID, message, onMessage, onError, onComplete) {
        try {
            // 模拟专家回复
            const mockReplies = [
                {
                    role: '乔布斯',
                    content: '（思考了一下）我觉得这个问题的关键在于用户体验。我们要问自己：用户真正需要什么？而不是我们想给他们什么。简单就是美。'
                },
                {
                    role: '马斯克',
                    content: '（眼神坚定）这让我想到我们在特斯拉遇到的挑战。有时候最疯狂的想法反而是最现实的解决方案。我们要敢于重新定义规则。'
                },
                {
                    role: '图灵',
                    content: '（认真地说）从计算的角度来看，这是一个有趣的问题。我们需要将复杂的问题分解为简单的逻辑步骤，就像机器思考一样。'
                }
            ]

            for (let i = 0; i < mockReplies.length; i++) {
                await new Promise(resolve => setTimeout(resolve, 2000)) // 模拟思考时间

                onMessage && onMessage({
                    code: RESPONSE_CODES.SUCCESS,
                    ...mockReplies[i]
                })
            }

            // 模拟完成
            setTimeout(() => {
                onComplete && onComplete()
            }, 1000)

            // 返回一个模拟的EventSource对象
            return {
                close: () => console.log('Mock EventSource closed')
            }

        } catch (error) {
            onError && onError(error)
            throw error
        }
    }
}

/**
 * 模拟模型API
 */
export const mockModelApi = {
    /**
     * 获取模型列表
     */
    async getModelList() {
        await mockApiService.simulateDelay()

        const mockModels = [
            'Qwen/QwQ-32B',
            'Qwen/Qwen2.5-72B-Instruct',
            'meta-llama/Llama-3.1-70B-Instruct',
            'anthropic/claude-3-haiku',
            'openai/gpt-4o-mini'
        ]

        return mockApiService.createResponse(mockModels, '获取模型列表成功')
    }
}

/**
 * 模拟讨论服务
 */
export const mockDiscussionService = {
    /**
     * 开始专家讨论（支持多轮对话）
     */
    async startDiscussion(params, onExpertMessage, onError, onComplete, onChatIDReceived) {
        const { topic, experts, chatID: existingChatID } = params

        try {
            let chatID = existingChatID

            // 如果没有现有的chatID，创建新对话
            if (!chatID) {
                console.log('📞 [演示模式] 创建新的聊天会话')
                const chatResponse = await mockChatApi.newChat({
                    model: 'mock-model',
                    people: experts.map(expert => expert.name)
                })
                chatID = chatResponse.chatID
                console.log('💬 [演示模式] 新会话ID:', chatID)
            } else {
                console.log('🔄 [演示模式] 复用现有会话ID:', chatID)
            }

            // 通知调用者chatID（用于保存）
            onChatIDReceived && onChatIDReceived(chatID)

            // 发送讨论主题
            return mockChatApi.sendMessage(
                chatID,
                topic,
                (data) => {
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

export default {
    personApi: mockPersonApi,
    chatApi: mockChatApi,
    modelApi: mockModelApi,
    discussionService: mockDiscussionService
} 