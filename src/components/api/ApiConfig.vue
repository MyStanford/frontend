<template>
  <!-- API配置面板 -->
  <div class="api-config-panel" :class="{ open: showApiConfig }">
    <h3>后端API配置</h3>
    <div class="api-info">
      <p>后端服务地址: <code>{{ baseUrl }}</code></p>
      <p>连接状态: <span :class="{ connected: apiConnected }">{{ connectionStatusText }}</span></p>
      <p>专家数据: <span class="data-source">{{ dataSourceText }}</span></p>
      <p v-if="mockMode" class="mock-mode-notice">
        <span class="mock-icon">🎭</span>
        当前运行在演示模式下
      </p>
    </div>
    
    <div class="mode-toggle">
      <label class="toggle-label">
        <input 
          type="checkbox" 
          :checked="mockMode" 
          @change="toggleMode"
          :disabled="isTesting"
        />
        <span class="toggle-slider"></span>
        <span class="toggle-text">{{ mockMode ? '演示模式' : '真实API模式' }}</span>
      </label>
    </div>
    
    <div class="form-group">
      <label for="modelSelect">AI模型</label>
      <select id="modelSelect" v-model="selectedModel" @change="updateModel">
        <option v-if="availableModels.length === 0" value="">加载中...</option>
        <option 
          v-for="model in availableModels" 
          :key="model" 
          :value="model"
        >
          {{ model }}
        </option>
        <!-- 备用选项 -->
        <option v-if="availableModels.length === 0" value="Qwen/QwQ-32B">Qwen QwQ-32B (默认)</option>
      </select>
    </div>
    
    <button class="btn-primary" @click="testConnection" :disabled="isTesting" style="width: 100%; margin-bottom: 20px;">
      {{ isTesting ? '测试中...' : '测试连接' }}
    </button>
    
    <div id="connectionStatus" v-if="connectionStatus">
      <div :class="connectionStatus.type === 'success' ? 'success-message' : 'error-message'">
        {{ connectionStatus.message }}
      </div>
    </div>
  </div>

  <!-- 配置切换按钮 -->
  <div class="config-toggle" @click="toggleConfig">
    ⚙️
    <div class="api-status-indicator" :class="{ connected: apiConnected }"></div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useStore } from 'vuex'
import { API_CONFIG } from '@/config/api'

const store = useStore()

// 响应式数据
const selectedModel = ref('Qwen/QwQ-32B')
const isTesting = ref(false)
const connectionStatus = ref(null)

// 计算属性
const showApiConfig = computed(() => store.state.showApiConfig)
const apiConnected = computed(() => store.state.apiConnected)
const availableModels = computed(() => store.state.availableModels)
const baseUrl = computed(() => API_CONFIG.BASE_URL)
const mockMode = computed(() => store.state.mockMode)

const connectionStatusText = computed(() => {
  if (apiConnected.value) {
    return mockMode.value ? '演示模式已连接' : '后端已连接'
  }
  return '未连接'
})

const dataSourceText = computed(() => {
  const talentsCount = store.state.allTalents.length
  const isLoading = store.state.talentsLoading
  const isLoaded = store.state.talentsLoaded
  
  if (isLoading) {
    return '加载中...'
  }
  if (!isLoaded || talentsCount === 0) {
    return '未加载'
  }
  return mockMode.value ? `演示数据 (${talentsCount}位专家)` : `API数据 (${talentsCount}位专家)`
})

// 监听store中的API配置变化
watch(() => store.state.apiModel, (newModel) => {
  selectedModel.value = newModel
}, { immediate: true })

// 方法
const toggleConfig = () => {
  store.commit('TOGGLE_API_CONFIG')
}

const updateModel = () => {
  store.commit('SET_API_MODEL', selectedModel.value)
  clearStatus()
}

const testConnection = async () => {
  isTesting.value = true
  connectionStatus.value = {
    type: 'info',
    message: '正在测试后端连接...'
  }

  try {
    await store.dispatch('testApiConnection')
    connectionStatus.value = {
      type: 'success',
      message: '✅ 后端API连接成功'
    }
    
    // 重新加载模型列表
    await store.dispatch('loadAvailableModels')
  } catch (error) {
    connectionStatus.value = {
      type: 'error',
      message: `❌ 后端连接失败: ${error.message}`
    }
  } finally {
    isTesting.value = false
  }
}

const clearStatus = () => {
  connectionStatus.value = null
}

const toggleMode = async () => {
  isTesting.value = true
  connectionStatus.value = {
    type: 'info',
    message: '正在切换模式...'
  }

  try {
    const result = await store.dispatch('toggleMockMode')
    connectionStatus.value = {
      type: 'success',
      message: result.message || '模式切换成功'
    }
  } catch (error) {
    connectionStatus.value = {
      type: 'error',
      message: `模式切换失败: ${error.message}`
    }
  } finally {
    isTesting.value = false
  }
}

// 组件挂载时的初始化
onMounted(async () => {
  // 加载可用模型列表
  try {
    await store.dispatch('loadAvailableModels')
  } catch (error) {
    console.log('加载模型列表失败，使用默认配置')
  }
  
  // 如果未连接后端，提示用户测试连接
  if (!apiConnected.value) {
    connectionStatus.value = {
      type: 'info',
      message: '请测试后端API连接'
    }
  }
})
</script>

<style scoped>
.api-config-panel {
  position: fixed;
  top: 80px;
  right: -400px;
  width: 380px;
  height: calc(100vh - 80px);
  background: var(--secondary-black);
  border-left: 1px solid var(--tertiary-black);
  padding: 30px;
  transition: right 0.3s ease;
  z-index: 999;
  overflow-y: auto;
}

.api-config-panel.open {
  right: 0;
}

.api-config-panel h3 {
  margin-bottom: 30px;
  color: var(--primary-white);
  font-weight: 400;
}

.config-toggle {
  position: fixed;
  top: 100px;
  right: 20px;
  width: 50px;
  height: 50px;
  background: var(--secondary-black);
  border: 1px solid var(--tertiary-black);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  z-index: 1000;
  font-size: 1.2em;
}

.config-toggle:hover {
  background: var(--tertiary-black);
  border-color: var(--accent-gray);
  transform: scale(1.05);
}

.api-status-indicator {
  position: absolute;
  top: -2px;
  right: -2px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #ff6b6b;
  border: 2px solid var(--primary-black);
  transition: background 0.3s ease;
}

.api-status-indicator.connected {
  background: var(--success-green);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .api-config-panel {
    width: 100vw;
    right: -100vw;
    padding: 20px;
  }

  .config-toggle {
    right: 10px;
    width: 45px;
    height: 45px;
    font-size: 1.1em;
  }
}

/* 配置面板动画 */
.api-config-panel {
  box-shadow: -5px 0 15px rgba(0, 0, 0, 0.3);
}

.api-config-panel.open {
  animation: slideInLeft 0.3s ease;
}

@keyframes slideInLeft {
  from {
    right: -400px;
    opacity: 0;
  }
  to {
    right: 0;
    opacity: 1;
  }
}

/* API信息区域样式 */
.api-info {
  background: var(--tertiary-black);
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 20px;
  border-left: 3px solid var(--success-green);
}

.api-info p {
  margin: 8px 0;
  color: var(--accent-gray);
  font-size: 0.9em;
}

.api-info code {
  background: var(--primary-black);
  padding: 2px 6px;
  border-radius: 4px;
  color: var(--success-green);
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.85em;
}

.api-info .connected {
  color: var(--success-green);
  font-weight: 500;
}

.api-info .connected::before {
  content: '●';
  margin-right: 4px;
}

.data-source {
  color: var(--success-green);
  font-weight: 500;
}

.mock-mode-notice {
  background: rgba(255, 237, 78, 0.1);
  border: 1px solid var(--warning-yellow);
  border-radius: 6px;
  padding: 8px 12px;
  margin-top: 10px;
  color: var(--warning-yellow);
  font-size: 0.85em;
  display: flex;
  align-items: center;
  gap: 6px;
}

.mock-icon {
  font-size: 1.1em;
}

/* 模式切换开关样式 */
.mode-toggle {
  margin: 20px 0;
  padding: 15px;
  background: var(--tertiary-black);
  border-radius: 8px;
  border-left: 3px solid var(--warning-yellow);
}

.toggle-label {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  user-select: none;
}

.toggle-label input[type="checkbox"] {
  display: none;
}

.toggle-slider {
  position: relative;
  width: 44px;
  height: 24px;
  background: var(--accent-gray);
  border-radius: 12px;
  transition: all 0.3s ease;
}

.toggle-slider::before {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  width: 20px;
  height: 20px;
  background: white;
  border-radius: 50%;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.toggle-label input:checked + .toggle-slider {
  background: var(--warning-yellow);
}

.toggle-label input:checked + .toggle-slider::before {
  transform: translateX(20px);
}

.toggle-label input:disabled + .toggle-slider {
  opacity: 0.5;
  cursor: not-allowed;
}

.toggle-text {
  color: var(--primary-white);
  font-weight: 500;
  font-size: 0.9em;
}

/* 配置切换按钮动画 */
.config-toggle {
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-5px);
  }
}

.config-toggle:hover {
  animation: none;
}
</style> 