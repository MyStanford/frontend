<template>
  <div class="api-status-indicator" :class="statusClass">
    <div class="status-icon">{{ statusIcon }}</div>
    <div class="status-text">{{ statusText }}</div>
    <button v-if="!isConnected" class="retry-btn" @click="retryConnection">
      重试
    </button>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useStore } from 'vuex'

const store = useStore()

// 计算属性
const isConnected = computed(() => store.state.apiConnected)
const isLoading = computed(() => store.state.isDiscussing)
const mockMode = computed(() => store.state.mockMode)

const statusClass = computed(() => ({
  'connected': isConnected.value,
  'disconnected': !isConnected.value,
  'loading': isLoading.value,
  'mock': mockMode.value
}))

const statusIcon = computed(() => {
  if (isLoading.value) return '⏳'
  if (isConnected.value) {
    return mockMode.value ? '🎭' : '✅'
  }
  return '❌'
})

const statusText = computed(() => {
  if (isLoading.value) return '处理中...'
  if (isConnected.value) {
    return mockMode.value ? '演示模式' : '后端已连接'
  }
  return '后端未连接'
})

// 方法
const retryConnection = async () => {
  try {
    await store.dispatch('testApiConnection')
  } catch (error) {
    console.error('重试连接失败:', error)
  }
}
</script>

<style scoped>
.api-status-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 20px;
  font-size: 0.85em;
  transition: all 0.3s ease;
  border: 1px solid transparent;
}

.api-status-indicator.connected {
  background: rgba(0, 255, 136, 0.1);
  border-color: var(--success-green);
  color: var(--success-green);
}

.api-status-indicator.disconnected {
  background: rgba(255, 107, 107, 0.1);
  border-color: #ff6b6b;
  color: #ff6b6b;
}

.api-status-indicator.loading {
  background: rgba(255, 237, 78, 0.1);
  border-color: var(--warning-yellow);
  color: var(--warning-yellow);
}

.api-status-indicator.mock {
  background: rgba(255, 237, 78, 0.15);
  border-color: var(--warning-yellow);
  color: var(--warning-yellow);
  position: relative;
}

.api-status-indicator.mock::after {
  content: 'DEMO';
  position: absolute;
  top: -8px;
  right: -8px;
  background: var(--warning-yellow);
  color: var(--primary-black);
  font-size: 0.6em;
  font-weight: bold;
  padding: 2px 4px;
  border-radius: 3px;
  line-height: 1;
}

.status-icon {
  font-size: 1.1em;
}

.status-text {
  font-weight: 500;
  white-space: nowrap;
}

.retry-btn {
  padding: 4px 8px;
  background: transparent;
  border: 1px solid currentColor;
  border-radius: 12px;
  color: inherit;
  font-size: 0.8em;
  cursor: pointer;
  transition: all 0.3s ease;
}

.retry-btn:hover {
  background: currentColor;
  color: var(--primary-black);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .api-status-indicator {
    padding: 6px 10px;
    font-size: 0.8em;
  }
  
  .status-text {
    display: none;
  }
}
</style> 