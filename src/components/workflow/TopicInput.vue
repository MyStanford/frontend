<template>
  <div class="topic-input-section">
    <h3>💭 讨论主题</h3>
    <textarea 
      v-model="discussionTopic"
      class="topic-input" 
      placeholder="在参加一场黑客松比赛，我该做点什么？"
      @input="updateTopic"
    ></textarea>
    
    <!-- 对话状态显示 -->
    <div v-if="currentChatID" class="conversation-status">
      <div class="chat-info">
        💬 当前对话ID: <span class="chat-id">{{ currentChatID }}</span>
      </div>
    </div>

    <div class="discussion-controls">
      <!-- 如果有现有对话，显示继续和新对话按钮 -->
      <template v-if="currentChatID && !isDiscussing">
        <button 
          class="continue-discussion-btn" 
          @click="continueDiscussion"
          :disabled="!canStartDiscussion"
        >
          🔄 继续对话
        </button>
        <button 
          class="new-discussion-btn" 
          @click="startNewDiscussion"
          :disabled="!canStartDiscussion"
        >
          🆕 新对话
        </button>
      </template>
      
      <!-- 如果没有现有对话或正在讨论中，显示标准按钮 -->
      <template v-else>
        <button 
          class="start-discussion-btn" 
          @click="startDiscussion"
          :disabled="!canStartDiscussion || isDiscussing"
        >
          {{ isDiscussing ? '🤔 thinking...' : '🚀 Think' }}
        </button>
      </template>
      
      <!-- 重置按钮（仅在有对话时显示） -->
      <button 
        v-if="currentChatID && !isDiscussing"
        class="reset-btn"
        @click="resetConversation"
        title="重置对话状态"
      >
        🔄 重置
      </button>
    </div>
    
    <!-- 状态提示 -->
    <div v-if="errorMessage" class="error-message">
      {{ errorMessage }}
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useStore } from 'vuex'

const store = useStore()

// 响应式数据
const discussionTopic = ref('')
const errorMessage = ref('')

// 计算属性
const canStartDiscussion = computed(() => store.getters.canStartDiscussion)
const isDiscussing = computed(() => store.state.isDiscussing)
const selectedTalents = computed(() => store.state.selectedTalents)
const apiConnected = computed(() => store.state.apiConnected)
const currentChatID = computed(() => store.state.currentChatID)

// 监听store中的主题变化
watch(() => store.state.discussionTopic, (newTopic) => {
  discussionTopic.value = newTopic
}, { immediate: true })

// 方法
const updateTopic = () => {
  store.commit('SET_DISCUSSION_TOPIC', discussionTopic.value)
  clearError()
}

const startDiscussion = async () => {
  clearError()
  
  // 验证条件
  if (!validateConditions()) {
    return
  }
  
  try {
    await store.dispatch('startNewDiscussion')
    // 讨论成功启动，进入讨论步骤
    store.commit('SET_CURRENT_STEP', 3)
  } catch (error) {
    console.error('开始讨论失败:', error)
    errorMessage.value = error.message || '开始讨论时发生错误，请重试'
  }
}

const continueDiscussion = async () => {
  clearError()
  
  // 验证条件
  if (!validateConditions()) {
    return
  }
  
  try {
    await store.dispatch('continueDiscussion')
    console.log('✅ 继续对话成功')
  } catch (error) {
    console.error('继续对话失败:', error)
    errorMessage.value = error.message || '继续对话时发生错误，请重试'
  }
}

const startNewDiscussion = async () => {
  clearError()
  
  // 验证条件
  if (!validateConditions()) {
    return
  }
  
  try {
    await store.dispatch('startNewDiscussion')
    console.log('✅ 开始新对话成功')
  } catch (error) {
    console.error('开始新对话失败:', error)
    errorMessage.value = error.message || '开始新对话时发生错误，请重试'
  }
}

const resetConversation = () => {
  clearError()
  
  if (confirm('确定要重置对话状态吗？这将清除当前的对话历史。')) {
    store.dispatch('resetConversation')
    console.log('🔄 对话状态已重置')
  }
}

const validateConditions = () => {
  if (!discussionTopic.value.trim()) {
    errorMessage.value = '请输入讨论主题！'
    return false
  }
  
  if (selectedTalents.value.length < 3) {
    errorMessage.value = '请至少选择3位专家！'
    return false
  }
  
  if (selectedTalents.value.length > 5) {
    errorMessage.value = '最多只能选择5位专家！'
    return false
  }
  
  if (!apiConnected.value) {
    errorMessage.value = '请先配置并测试AI连接！点击右上角的⚙️进行配置'
    return false
  }
  
  return true
}

const clearError = () => {
  errorMessage.value = ''
}

// 初始化默认主题
if (!discussionTopic.value) {
  discussionTopic.value = '在参加一场黑客松比赛，我该做点什么？'
  store.commit('SET_DISCUSSION_TOPIC', discussionTopic.value)
}
</script>

<style scoped>
.topic-input-section {
  background: var(--secondary-black);
  border-radius: 12px;
  padding: 40px;
  margin-bottom: 40px;
  border: 1px solid var(--tertiary-black);
}

.topic-input-section h3 {
  font-size: 1.3em;
  margin-bottom: 20px;
  color: var(--primary-white);
  font-weight: 400;
}

.topic-input {
  width: 100%;
  min-height: 120px;
  padding: 20px;
  background: var(--tertiary-black);
  border: 1px solid var(--accent-gray);
  border-radius: 8px;
  color: var(--primary-white);
  font-size: 1em;
  font-family: inherit;
  resize: vertical;
  transition: all 0.3s ease;
  line-height: 1.6;
}

.topic-input:focus {
  outline: none;
  border-color: var(--success-green);
  background: var(--secondary-black);
  box-shadow: 0 0 0 2px rgba(0, 255, 136, 0.1);
}

.topic-input::placeholder {
  color: var(--accent-gray);
  font-style: italic;
}

.conversation-status {
  margin: 15px 0;
  padding: 12px 16px;
  background: var(--tertiary-black);
  border: 1px solid var(--accent-gray);
  border-radius: 8px;
  text-align: center;
}

.chat-info {
  color: var(--primary-white);
  font-size: 0.9em;
}

.chat-id {
  color: var(--success-green);
  font-family: 'Courier New', monospace;
  font-weight: 500;
}

.discussion-controls {
  display: flex;
  justify-content: center;
  gap: 15px;
  margin-top: 20px;
  flex-wrap: wrap;
}

.start-discussion-btn {
  padding: 16px 32px;
  background: var(--success-green);
  color: var(--primary-black);
  border: none;
  border-radius: 8px;
  font-size: 1.1em;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 160px;
}

.start-discussion-btn:hover:not(:disabled) {
  background: var(--warning-yellow);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 255, 136, 0.3);
}

.start-discussion-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
  background: var(--tertiary-black);
  color: var(--accent-gray);
}

/* 继续对话按钮 */
.continue-discussion-btn {
  padding: 16px 32px;
  background: var(--warning-yellow);
  color: var(--primary-black);
  border: none;
  border-radius: 8px;
  font-size: 1.1em;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 160px;
}

.continue-discussion-btn:hover:not(:disabled) {
  background: #ffd93d;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 193, 7, 0.3);
}

.continue-discussion-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
  background: var(--tertiary-black);
  color: var(--accent-gray);
}

/* 新对话按钮 */
.new-discussion-btn {
  padding: 16px 32px;
  background: var(--success-green);
  color: var(--primary-black);
  border: none;
  border-radius: 8px;
  font-size: 1.1em;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 160px;
}

.new-discussion-btn:hover:not(:disabled) {
  background: #00ff99;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 255, 136, 0.3);
}

.new-discussion-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
  background: var(--tertiary-black);
  color: var(--accent-gray);
}

/* 重置按钮 */
.reset-btn {
  padding: 12px 20px;
  background: var(--tertiary-black);
  color: var(--accent-gray);
  border: 1px solid var(--accent-gray);
  border-radius: 8px;
  font-size: 0.9em;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 100px;
}

.reset-btn:hover {
  background: var(--secondary-black);
  color: var(--primary-white);
  border-color: var(--primary-white);
  transform: translateY(-1px);
}

.error-message {
  margin-top: 15px;
  padding: 12px 16px;
  background: rgba(255, 107, 107, 0.1);
  border: 1px solid #ff6b6b;
  border-radius: 6px;
  color: #ff6b6b;
  font-size: 0.9em;
  text-align: center;
  animation: slideInUp 0.3s ease;
}

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 成功状态动画 */
.start-discussion-btn:not(:disabled):active {
  transform: scale(0.98);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .topic-input-section {
    padding: 20px;
  }
  
  .topic-input {
    min-height: 100px;
    padding: 15px;
    font-size: 0.95em;
  }
  
  .start-discussion-btn,
  .continue-discussion-btn,
  .new-discussion-btn {
    padding: 14px 20px;
    font-size: 1em;
    min-width: 120px;
  }
  
  .reset-btn {
    padding: 10px 16px;
    font-size: 0.85em;
    min-width: 80px;
  }
  
  .discussion-controls {
    gap: 10px;
  }
  
  .topic-input-section h3 {
    font-size: 1.2em;
    margin-bottom: 15px;
  }
}
</style> 