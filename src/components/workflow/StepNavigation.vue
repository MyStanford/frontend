<template>
  <div class="step-navigation">
    <div 
      v-for="(step, index) in steps" 
      :key="step.id"
      class="step-wrapper"
    >
      <div 
        class="step-item" 
        :class="getStepClass(step.id)"
        @click="goToStep(step.id)"
      >
        <div class="step-number">{{ step.id }}</div>
        <div class="step-text">{{ step.text }}</div>
      </div>
      
      <!-- 连接线 -->
      <div 
        v-if="index < steps.length - 1" 
        class="step-connector"
        :class="{ active: currentStep > step.id }"
      ></div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useStore } from 'vuex'

const store = useStore()

const steps = [
  { id: 1, text: 'Choose' },
  { id: 2, text: 'Think' },
  { id: 3, text: 'Discuss' },
  { id: 4, text: 'Get Result' }
]

const currentStep = computed(() => store.state.currentStep)

const getStepClass = (stepId) => {
  if (stepId === currentStep.value) return 'active'
  if (stepId < currentStep.value) return 'completed'
  return ''
}

const goToStep = (stepId) => {
  // 只允许访问已完成的步骤或当前步骤
  if (stepId <= currentStep.value) {
    store.commit('SET_CURRENT_STEP', stepId)
  }
}
</script>

<style scoped>
.step-navigation {
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 40px 0;
  padding: 20px;
  background: var(--secondary-black);
  border-radius: 12px;
  border: 1px solid var(--tertiary-black);
}

.step-wrapper {
  display: flex;
  align-items: center;
}

.step-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 20px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  background: var(--tertiary-black);
  color: var(--accent-gray);
}

.step-item.active {
  background: var(--success-green);
  color: var(--primary-black);
}

.step-item.completed {
  background: var(--warning-yellow);
  color: var(--primary-black);
  cursor: pointer;
}

.step-item:hover {
  transform: translateY(-1px);
}

.step-number {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.9em;
  font-weight: 600;
  background: rgba(255, 255, 255, 0.2);
}

.step-item.active .step-number,
.step-item.completed .step-number {
  background: rgba(0, 0, 0, 0.2);
}

.step-text {
  font-size: 0.95em;
  font-weight: 500;
}

.step-connector {
  width: 40px;
  height: 2px;
  background: var(--accent-gray);
  opacity: 0.3;
  margin: 0 10px;
  transition: all 0.3s ease;
}

.step-connector.active {
  background: var(--success-green);
  opacity: 1;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .step-navigation {
    flex-direction: column;
    gap: 15px;
  }
  
  .step-wrapper {
    flex-direction: column;
  }
  
  .step-connector {
    width: 2px;
    height: 20px;
    margin: 5px 0;
  }
  
  .step-item {
    padding: 10px 16px;
  }
  
  .step-text {
    font-size: 0.9em;
  }
}
</style> 