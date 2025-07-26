import { createStore } from 'vuex'
import { talents } from '@/data/talents'
import { personApi, chatApi, modelApi, discussionService } from '@/services/api'
import mockServices, { mockPersonApi, mockChatApi, mockModelApi, mockDiscussionService } from '@/services/mockApi'
import { apiValidator } from '@/utils/apiValidator'

const store = createStore({
    state: {
        // 专家相关
        selectedTalents: [],
        allTalents: [], // 改为空数组，将从API加载
        talentsLoading: false,
        talentsLoaded: false,

        // 讨论相关
        discussionHistory: [],
        creativeInsights: JSON.parse(localStorage.getItem('creativeInsights')) || [],
        isDiscussing: false,
        discussionTopic: '',

        // API配置
        apiConnected: false,
        apiModel: 'kimik2',
        availableModels: [],
        currentChatID: null,
        currentEventSource: null,

        // 模拟模式
        mockMode: false,
        autoFallbackToMock: true, // 自动切换到模拟模式

        // 钱包相关
        walletConnected: false,
        currentAccount: null,

        // UI状态
        currentStep: 1,
        showApiConfig: false,

        // 游戏化互动
        messageInteractions: {},
        userVotes: {},
        currentDiscussionId: null
    },

    mutations: {
        // 专家选择
        SET_SELECTED_TALENTS(state, talents) {
            state.selectedTalents = talents
        },

        ADD_TALENT(state, talent) {
            if (state.selectedTalents.length < 5 && !state.selectedTalents.find(t => t.name === talent.name)) {
                state.selectedTalents.push(talent)
            }
        },

        REMOVE_TALENT(state, talentName) {
            state.selectedTalents = state.selectedTalents.filter(t => t.name !== talentName)
        },

        // 人物数据管理
        SET_ALL_TALENTS(state, talents) {
            state.allTalents = talents
        },

        SET_TALENTS_LOADING(state, loading) {
            state.talentsLoading = loading
        },

        SET_TALENTS_LOADED(state, loaded) {
            state.talentsLoaded = loaded
        },

        // 讨论相关
        SET_DISCUSSION_TOPIC(state, topic) {
            state.discussionTopic = topic
        },

        ADD_DISCUSSION_MESSAGE(state, message) {
            state.discussionHistory.push(message)
        },

        CLEAR_DISCUSSION(state) {
            state.discussionHistory = []
            state.messageInteractions = {}
            state.userVotes = {}
        },

        SET_IS_DISCUSSING(state, status) {
            state.isDiscussing = status
        },

        // 创意洞察
        ADD_CREATIVE_INSIGHTS(state, insights) {
            state.creativeInsights.unshift(...insights)
            localStorage.setItem('creativeInsights', JSON.stringify(state.creativeInsights))
        },

        // API配置
        SET_API_CONNECTED(state, connected) {
            state.apiConnected = connected
        },

        SET_API_KEY(state, key) {
            state.apiKey = key
        },

        SET_API_MODEL(state, model) {
            state.apiModel = model
        },

        SET_AVAILABLE_MODELS(state, models) {
            state.availableModels = models
        },

        SET_CURRENT_CHAT_ID(state, chatID) {
            state.currentChatID = chatID
        },

        SET_MOCK_MODE(state, enabled) {
            state.mockMode = enabled
        },

        SET_AUTO_FALLBACK(state, enabled) {
            state.autoFallbackToMock = enabled
        },

        // 钱包状态
        SET_WALLET_CONNECTED(state, connected) {
            state.walletConnected = connected
        },

        SET_CURRENT_ACCOUNT(state, account) {
            state.currentAccount = account
        },

        // UI状态
        SET_CURRENT_STEP(state, step) {
            state.currentStep = step
        },

        TOGGLE_API_CONFIG(state) {
            state.showApiConfig = !state.showApiConfig
        },

        // 消息互动
        SET_MESSAGE_INTERACTION(state, { messageId, voteType, count }) {
            if (!state.messageInteractions[messageId]) {
                state.messageInteractions[messageId] = { support: 0, oppose: 0, funny: 0 }
            }
            state.messageInteractions[messageId][voteType] = count
        },

        SET_USER_VOTE(state, { messageId, voteType }) {
            state.userVotes[messageId] = voteType
        },

        REMOVE_USER_VOTE(state, messageId) {
            delete state.userVotes[messageId]
        }
    },

    actions: {

        // 专家选择
        toggleTalent({ commit, state }, talent) {
            const isSelected = state.selectedTalents.find(t => t.name === talent.name)
            if (isSelected) {
                commit('REMOVE_TALENT', talent.name)
            } else {
                commit('ADD_TALENT', talent)
            }
        },

        // 开始讨论 - 使用后端或模拟API（支持多轮对话）
        async startDiscussion({ commit, state, dispatch, getters }, { isNewConversation = false } = {}) {
            if (state.selectedTalents.length < 3 || state.selectedTalents.length > 5) {
                throw new Error('请选择3-5位专家')
            }

            if (!state.discussionTopic.trim()) {
                throw new Error('请输入讨论主题')
            }

            if (!state.apiConnected) {
                throw new Error('请先配置并测试AI连接')
            }

            commit('SET_IS_DISCUSSING', true)

            // 如果是新对话，清空历史记录
            if (isNewConversation) {
                commit('CLEAR_DISCUSSION')
                commit('SET_CURRENT_CHAT_ID', null)
            }

            commit('SET_CURRENT_STEP', 2)

            try {
                // 获取当前API服务
                const services = getters.getApiServices

                // 收到的专家回复计数器
                const receivedExperts = new Set()
                const expectedExpertCount = state.selectedTalents.length

                // 使用对应的讨论服务
                const eventSource = await services.discussionService.startDiscussion(
                    {
                        topic: state.discussionTopic,
                        experts: state.selectedTalents,
                        model: state.apiModel,
                        chatID: state.currentChatID // 传递现有的chatID，如果有的话
                    },
                    // 专家消息回调
                    (message) => {
                        commit('ADD_DISCUSSION_MESSAGE', message)

                        // 记录收到回复的专家
                        if (message.expert) {
                            receivedExperts.add(message.expert)
                            console.log(`收到 ${message.expert} 的回复，已回复专家数: ${receivedExperts.size}/${expectedExpertCount}`)

                            // 如果收到了所有专家的回复，主动切断连接
                            if (receivedExperts.size >= expectedExpertCount) {
                                console.log('✅ 收到全部专家回复，主动切断连接')
                                if (eventSource && eventSource.readyState === EventSource.OPEN) {
                                    eventSource.close()
                                }

                                // 标记讨论完成
                                setTimeout(() => {
                                    commit('SET_IS_DISCUSSING', false)
                                    commit('SET_CURRENT_STEP', 3)
                                    // 讨论完成后生成洞察
                                    dispatch('generateCreativeInsights')
                                }, 500) // 稍微延迟，确保最后的消息已处理
                            }
                        }
                    },
                    // 错误回调
                    (error) => {
                        console.error('讨论过程中出错:', error)
                        commit('SET_IS_DISCUSSING', false)
                        throw error
                    },
                    // 完成回调（服务器主动结束）
                    () => {
                        console.log('服务器端讨论完成')
                        commit('SET_IS_DISCUSSING', false)
                        commit('SET_CURRENT_STEP', 3)
                        // 讨论完成后生成洞察
                        dispatch('generateCreativeInsights')
                    },
                    // chatID回调（用于保存chatID以便多轮对话）
                    (chatID) => {
                        if (chatID && chatID !== state.currentChatID) {
                            console.log('💬 保存chatID用于多轮对话:', chatID)
                            commit('SET_CURRENT_CHAT_ID', chatID)
                        }
                    }
                )

                // 保存EventSource引用以便取消
                state.currentEventSource = eventSource

            } catch (error) {
                commit('SET_IS_DISCUSSING', false)
                throw error
            }
        },



        // 生成创意洞察
        async generateCreativeInsights({ commit, state, dispatch }) {
            if (state.discussionHistory.length === 0) return

            const expertViewpoints = state.discussionHistory.map(item =>
                `${item.expert}(${item.role}): ${item.content}`
            ).join('\n\n')

            const insightPrompt = `基于以下专家讨论内容，请生成3-5个讨论结果：

话题：${state.discussionTopic}

专家观点：
${expertViewpoints}

要求：
1. 每个结果要简洁有力，每句话不超过25字
2. 要体现深度思考和智慧结晶
3. 避免技术细节，专注本质思考
4. 体现专家讨论的核心观点
5. 包含可执行的建议和洞察

以JSON格式返回，格式如下：
{
  "insights": [
    {
      "title": "讨论结果标题（12字内）",
      "content": "一句深刻的讨论结果，体现核心观点",
      "category": "核心观点|关键洞察|重要结论|行动建议|创新思路",
      "priority": "高|中|低"
    }
  ]
}`

            try {
                // 暂时保留旧的API调用方式用于生成洞察，后续可以移至后端处理
                const response = await dispatch('callOldAI', {
                    messages: [
                        { role: "system", content: "你是一位创意分析专家，擅长从多元化讨论中提炼核心洞察。" },
                        { role: "user", content: insightPrompt }
                    ]
                })

                let insights
                try {
                    const jsonMatch = response.match(/\{[\s\S]*\}/)
                    if (jsonMatch) {
                        insights = JSON.parse(jsonMatch[0]).insights
                    } else {
                        throw new Error('无法解析JSON')
                    }
                } catch (parseError) {
                    insights = [{
                        title: `${state.discussionTopic} - 讨论结果`,
                        content: response.substring(0, 50),
                        category: '核心观点'
                    }]
                }

                const newInsights = insights.map(insight => ({
                    ...insight,
                    topic: state.discussionTopic,
                    experts: state.selectedTalents.map(t => t.name),
                    timestamp: new Date(),
                    id: Date.now() + Math.random()
                }))

                commit('ADD_CREATIVE_INSIGHTS', newInsights)

            } catch (error) {
                console.error('生成洞察失败:', error)
            }
        },

        // 旧的AI API调用（仅用于生成洞察）
        async callOldAI({ state }, { expert, topic, messages }) {
            const API_BASE_URL = 'https://api.siliconflow.cn/v1/chat/completions'

            let requestMessages
            if (messages) {
                requestMessages = messages
            } else {
                const basePrompt = expert.prompt || `你是${expert.name}，一位${expert.role}。你的专业领域包括：${expert.specialty}。`
                const systemPrompt = `${basePrompt}

关于这个话题：${topic}

我想听听你的想法。不用太正式，就像朋友聊天一样，说说你的直觉和感受。

要求：
- 说1-2句话就行，别太长
- 用你自己的方式说话，不用装深沉
- 说点实在的，别绕弯子
- 就像平时聊天一样自然
- 如果有什么经典的话或者金句适合这个话题，可以提一下，没有就算了
- 可以在说话时加上动作描述，比如（思考了一下）（笑着说）（认真地说）

比如这样：
"（思考了一下）我觉得吧，关键是要抓住用户真正想要什么。"
"（笑着说）有时候最简单的方案反而是最好的。"
"（认真地说）技术再牛，也得有人愿意用才行。"
"（眼神坚定）就像我常说的，简单就是美。"`

                requestMessages = [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: `请分析这个话题：${topic}` }
                ]
            }

            const response = await fetch(API_BASE_URL, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${state.apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: state.apiModel,
                    messages: requestMessages,
                    temperature: 0.8,
                    max_tokens: 3000,
                    top_p: 0.9
                })
            })

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}))
                throw new Error(`HTTP ${response.status}: ${errorData.error?.message || 'Unknown error'}`)
            }

            const data = await response.json()
            return data.choices[0].message.content
        },

        // 测试API连接 - 支持自动切换到模拟模式
        async testApiConnection({ commit, dispatch, state }) {
            try {
                // 首先尝试真实API连接
                const result = await apiValidator.testConnection()

                // 如果连接成功
                if (result.success) {
                    commit('SET_MOCK_MODE', false)
                    await dispatch('loadAvailableModels')
                    commit('SET_API_CONNECTED', true)
                    return result
                } else {
                    throw new Error(result.message || '连接测试失败')
                }
            } catch (error) {
                console.warn('后端API连接失败:', error.message)

                // 如果启用了自动切换，则使用模拟模式
                if (state.autoFallbackToMock) {
                    console.log('自动切换到演示模式...')
                    commit('SET_MOCK_MODE', true)

                    try {
                        // 加载模拟数据
                        await dispatch('loadAvailableModels')
                        commit('SET_API_CONNECTED', true)

                        return {
                            success: true,
                            message: '演示模式已启用（后端API不可用）',
                            mock: true
                        }
                    } catch (mockError) {
                        commit('SET_API_CONNECTED', false)
                        throw new Error('演示模式启动失败')
                    }
                } else {
                    commit('SET_API_CONNECTED', false)
                    throw error
                }
            }
        },

        // 加载可用模型列表
        async loadAvailableModels({ commit, getters }) {
            try {
                const services = getters.getApiServices
                const response = await services.modelApi.getModelList()
                commit('SET_AVAILABLE_MODELS', response.data || [])
                return response.data
            } catch (error) {
                console.error('获取模型列表失败:', error)
                throw error
            }
        },

        // 加载人物列表
        async loadPersons({ commit, getters, state }) {
            if (state.talentsLoading) {
                return // 避免重复加载
            }

            commit('SET_TALENTS_LOADING', true)

            try {
                const services = getters.getApiServices
                const response = await services.personApi.getPersonList()

                // 将API返回的人物数据设置到store中
                commit('SET_ALL_TALENTS', response.data || [])
                commit('SET_TALENTS_LOADED', true)

                console.log(`✅ 成功加载 ${response.data?.length || 0} 位专家人物`)
                return response.data
            } catch (error) {
                console.error('获取人物列表失败:', error)

                // 如果是真实API模式失败，尝试使用静态数据作为后备
                if (!state.mockMode) {
                    console.log('API加载失败，使用静态专家数据作为后备')
                    const { talents } = await import('@/data/talents')
                    commit('SET_ALL_TALENTS', talents)
                    commit('SET_TALENTS_LOADED', true)
                    return talents
                }
                throw error
            } finally {
                commit('SET_TALENTS_LOADING', false)
            }
        },

        // 添加人物
        async addPerson({ dispatch, getters }, person) {
            try {
                const services = getters.getApiServices
                const response = await services.personApi.addPerson(person)
                await dispatch('loadPersons') // 重新加载列表
                return response.data
            } catch (error) {
                console.error('添加人物失败:', error)
                throw error
            }
        },

        // 切换模拟模式
        async toggleMockMode({ commit, state, dispatch }) {
            const newMode = !state.mockMode
            commit('SET_MOCK_MODE', newMode)

            if (newMode) {
                // 切换到模拟模式
                try {
                    await dispatch('loadAvailableModels')
                    commit('SET_API_CONNECTED', true)
                    return { success: true, message: '已切换到演示模式' }
                } catch (error) {
                    commit('SET_API_CONNECTED', false)
                    throw error
                }
            } else {
                // 切换到真实API模式
                commit('SET_API_CONNECTED', false)
                return dispatch('testApiConnection')
            }
        },

        // 取消当前讨论
        cancelDiscussion({ state, commit }) {
            if (state.currentEventSource) {
                state.currentEventSource.close()
                state.currentEventSource = null
            }
            commit('SET_IS_DISCUSSING', false)
        },

        // 继续对话（多轮）
        async continueDiscussion({ dispatch, state }) {
            if (!state.currentChatID) {
                throw new Error('没有可继续的对话，请重新开始')
            }

            console.log('🔄 继续现有对话，chatID:', state.currentChatID)
            return await dispatch('startDiscussion', { isNewConversation: false })
        },

        // 开始新对话
        async startNewDiscussion({ dispatch }) {
            console.log('🆕 开始新对话')
            return await dispatch('startDiscussion', { isNewConversation: true })
        },

        // 重置对话状态
        resetConversation({ commit }) {
            console.log('🔄 重置对话状态')
            commit('SET_CURRENT_CHAT_ID', null)
            commit('CLEAR_DISCUSSION')
            commit('SET_IS_DISCUSSING', false)
            commit('SET_CURRENT_STEP', 2)
        },

        // 更新消息互动数据
        updateMessageInteraction({ commit, state }, { messageId, interactions }) {
            const message = state.discussionHistory.find(msg => msg.messageId === messageId)
            if (message) {
                commit('UPDATE_MESSAGE_INTERACTIONS', { messageId, interactions })
                console.log('💬 更新消息互动:', messageId, interactions)
            }
        },

        // 添加AI反应
        addAIReaction({ commit, state }, { messageId, reaction }) {
            const message = state.discussionHistory.find(msg => msg.messageId === messageId)
            if (message) {
                commit('ADD_AI_REACTION', { messageId, reaction })
                console.log('🤖 添加AI反应:', messageId, reaction)
            }
        }
    },

    getters: {
        // 获取当前API服务（真实或模拟）
        getApiServices: (state) => {
            if (state.mockMode) {
                return {
                    personApi: mockPersonApi,
                    chatApi: mockChatApi,
                    modelApi: mockModelApi,
                    discussionService: mockDiscussionService
                }
            }
            return { personApi, chatApi, modelApi, discussionService }
        },

        canStartDiscussion: (state) => {
            return state.selectedTalents.length >= 3 &&
                state.selectedTalents.length <= 5 &&
                state.discussionTopic.trim() &&
                state.apiConnected &&
                !state.isDiscussing
        },

        talentSelectionStatus: (state) => {
            const count = state.selectedTalents.length
            if (count < 3) {
                return { text: `请选择3-5位专家 (已选择${count}位)`, canProceed: false }
            } else if (count >= 3 && count <= 5) {
                return { text: `已选择${count}位专家，可以开始讨论`, canProceed: true }
            } else {
                return { text: `最多只能选择5位专家`, canProceed: false }
            }
        },

        recentInsights: (state) => {
            return state.creativeInsights.slice(0, 5)
        }
    }
})

export default store 