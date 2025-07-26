<template>
  <div class="error-boundary" v-if="showError">
    <div class="error-content">
      <div class="error-icon">⚠️</div>
      <div class="error-message">
        <h3>{{ errorTitle }}</h3>
        <p>{{ errorMessage }}</p>
        <div class="error-actions">
          <button class="btn-primary" @click="retry" v-if="retryAction">
            重试
          </button>
          <button class="btn-secondary" @click="dismiss">
            知道了
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  error: {
    type: Error,
    default: null
  },
  title: {
    type: String,
    default: '操作失败'
  },
  message: {
    type: String,
    default: '请检查网络连接或稍后重试'
  },
  retryAction: {
    type: Function,
    default: null
  },
  show: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['dismiss', 'retry'])

const showError = computed(() => props.show || !!props.error)
const errorTitle = computed(() => {
  if (props.error?.message?.includes('fetch')) {
    return '网络连接失败'
  }
  if (props.error?.message?.includes('timeout')) {
    return '请求超时'
  }
  if (props.error?.message?.includes('API')) {
    return '后端服务异常'
  }
  return props.title
})

const errorMessage = computed(() => {
  if (props.error?.message?.includes('fetch')) {
    return '无法连接到后端服务，请检查后端是否正常运行'
  }
  if (props.error?.message?.includes('timeout')) {
    return '请求处理时间过长，请稍后重试'
  }
  if (props.error?.message?.includes('API')) {
    return props.error.message
  }
  return props.message
})

const retry = () => {
  if (props.retryAction) {
    props.retryAction()
  }
  emit('retry')
}

const dismiss = () => {
  emit('dismiss')
}
</script>

<style scoped>
.error-boundary {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 9999;
  background: rgba(0, 0, 0, 0.8);
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.error-content {
  background: var(--secondary-black);
  border: 1px solid var(--tertiary-black);
  border-radius: 12px;
  padding: 30px;
  max-width: 480px;
  width: 90%;
  text-align: center;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
}

.error-icon {
  font-size: 3em;
  margin-bottom: 20px;
}

.error-message h3 {
  color: var(--primary-white);
  margin-bottom: 15px;
  font-weight: 500;
}

.error-message p {
  color: var(--accent-gray);
  line-height: 1.5;
  margin-bottom: 25px;
}

.error-actions {
  display: flex;
  gap: 15px;
  justify-content: center;
}

.btn-primary, .btn-secondary {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 500;
}

.btn-primary {
  background: var(--success-green);
  color: var(--primary-black);
}

.btn-primary:hover {
  background: var(--warning-yellow);
  transform: translateY(-1px);
}

.btn-secondary {
  background: transparent;
  color: var(--accent-gray);
  border: 1px solid var(--accent-gray);
}

.btn-secondary:hover {
  background: var(--accent-gray);
  color: var(--primary-white);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .error-content {
    padding: 20px;
    margin: 20px;
  }
  
  .error-actions {
    flex-direction: column;
    gap: 10px;
  }
}
</style> 