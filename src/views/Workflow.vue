<template>
  <div class="workflow-page">
    <div class="container">
      <!-- 步骤导航 -->
      <StepNavigation />
      
      <section class="workflow-section">
        <!-- 专家选择器 -->
        <TalentSelector />

        <!-- 主题输入区域 -->
        <TopicInput />

        <!-- 讨论和创意融合区域 -->
        <div class="discussion-insights-area">
          <!-- 实时讨论区域 -->
          <DiscussionArea />

          <!-- 创意洞察面板 -->
          <InsightsPanel />
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useStore } from 'vuex'
import StepNavigation from '@/components/workflow/StepNavigation.vue'
import TalentSelector from '@/components/workflow/TalentSelector.vue'
import TopicInput from '@/components/workflow/TopicInput.vue'
import DiscussionArea from '@/components/workflow/DiscussionArea.vue'
import InsightsPanel from '@/components/workflow/InsightsPanel.vue'

const store = useStore()

onMounted(async () => {
  // 初始化：加载模型列表和测试API连接
  try {
    // 加载可用模型列表
    await store.dispatch('loadAvailableModels')
    
    // 测试后端API连接
    await store.dispatch('testApiConnection')
    console.log('后端API连接成功')
  } catch (error) {
    console.log('后端API连接失败:', error.message)
    // 错误会在API配置面板中显示，这里静默处理
  }
})
</script>

<style scoped>
.workflow-page {
  padding: 40px 20px;
  background: linear-gradient(135deg, var(--game-purple), var(--game-purple-light));
  min-height: calc(100vh - 80px);
}

.workflow-section {
  max-width: 1200px;
  margin: 0 auto;
}

.discussion-insights-area {
  display: grid;
  grid-template-columns: 1fr 400px;
  gap: 30px;
  margin-bottom: 40px;
  align-items: start;
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .workflow-page {
    padding: 20px 15px;
  }
  
  .discussion-insights-area {
    grid-template-columns: 1fr;
    gap: 20px;
  }
}

@media (max-width: 768px) {
  .workflow-page {
    padding: 15px 10px;
  }
}
</style> 