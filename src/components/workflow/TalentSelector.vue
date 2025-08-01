<template>
  <div class="talent-selector">
    <!-- 折叠按钮 -->
    <button class="slot-toggle-btn" :class="{ active: showSlotMachine }" @click="toggleSlotMachine">
      <span>vibe choose</span>
      <span class="slot-toggle-icon" :class="{ active: showSlotMachine }">▼</span>
    </button>
    
    <!-- 老虎机随机选择区域 -->
    <div class="slot-machine-section" :class="{ show: showSlotMachine }">
      <h4>vibe</h4>
      <div class="slot-display">
        <div 
          v-for="(reel, index) in slotReels" 
          :key="index"
          class="slot-reel" 
          :class="{ spinning: reel.spinning }"
        >
          <div class="slot-item" :class="{ active: reel.active }">
            {{ reel.icon }}
          </div>
        </div>
      </div>
      <button 
        class="slot-spin-btn" 
        @click="spinSlotMachine"
        :disabled="isSpinning"
      >
        {{ isSpinning ? '🎰 抽取中...' : '🎰 随机抽取3位专家' }}
      </button>
      <div class="slot-result" :class="{ show: showSlotResult }">
        <h5>🎲 随机抽取结果（3位专家）：</h5>
        <div class="experts-list">{{ slotResultText }}</div>
      </div>
    </div>

    <!-- 专家网格 -->
    <div class="talent-grid">
      <!-- 加载状态 -->
      <div v-if="talentsLoading" class="loading-state">
        <div class="loading-spinner">🔄</div>
        <div class="loading-text">正在加载专家数据...</div>
      </div>
      
      <!-- 无数据状态 -->
      <div v-else-if="!talentsLoading && allTalents.length === 0" class="empty-state">
        <div class="empty-icon">👥</div>
        <div class="empty-text">暂无专家数据</div>
        <button class="retry-btn" @click="retryLoadTalents">重新加载</button>
      </div>
      
      <!-- 专家列表 -->
      <div 
        v-else
        v-for="expert in allTalents" 
        :key="expert.name"
        class="talent-card"
        :class="{ selected: isSelected(expert) }"
        @click="toggleExpert(expert)"
        @mouseenter="showHoverCard(expert, $event)"
        @mouseleave="hideHoverCard"
      >
        <div class="talent-avatar">
          <span class="talent-emoji">{{ expert.avatar }}</span>
        </div>
        <div class="talent-name">{{ expert.name }}</div>
        <div class="talent-role">{{ expert.role }}</div>
      </div>
    </div>
    
    <!-- 悬停卡片 -->
    <div 
      v-if="hoverCard.show" 
      class="hover-card"
      :style="hoverCard.style"
      @mouseenter="keepHoverCard"
      @mouseleave="hideHoverCard"
    >
      <!-- 卡牌顶部标题栏 -->
      <div class="card-header">
        <div class="header-left">
          <div class="header-circle"></div>
        </div>
        <div class="header-title">Talent Pool</div>
        <div class="header-right">
          <div class="header-plus">+</div>
        </div>
      </div>
      
      <!-- 名称输入框 -->
      <div class="name-section">
        <span class="name-label">Name:</span>
        <div class="name-input">{{ hoverCard.expert.name }}</div>
      </div>
      
      <!-- 主图片区域 -->
      <div class="card-image-area">
        <img 
          v-if="hasPersonImage(hoverCard.expert.name)" 
          :src="`/person/${hoverCard.expert.name}.png`" 
          :alt="hoverCard.expert.name"
          class="talent-image-full"
          @error="handleImageError"
        />
        <div v-else class="talent-avatar-fallback">
          <span class="talent-emoji">{{ hoverCard.expert.avatar }}</span>
        </div>
        <div class="talent-title-overlay">{{ hoverCard.expert.role }}</div>
      </div>
      
      <!-- 描述区域 -->
      <div class="card-description">
        <div class="description-lines">
          <div class="desc-line long"></div>
          <div class="desc-line medium"></div>
          <div class="desc-line short"></div>
          <div class="desc-line medium"></div>
        </div>
      </div>
      
      <!-- 底部黄色区域 -->
      <div class="card-footer"></div>
    </div>
    
    <!-- 选择状态和按钮 -->
    <div class="selection-controls">
      <div class="selection-status" :style="{ color: selectionStatus.color }">
        {{ selectionStatus.text }}
      </div>
      <button 
        class="choose-btn" 
        @click="confirmSelection"
        :disabled="!canProceed"
      >
        ✅ Choose
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useStore } from 'vuex'

const store = useStore()

// 响应式数据
const showSlotMachine = ref(false)
const isSpinning = ref(false)
const showSlotResult = ref(false)
const slotResultText = ref('')

const slotReels = ref([
  { icon: '🍎', spinning: false, active: false },
  { icon: '🚀', spinning: false, active: false },
  { icon: '🎭', spinning: false, active: false }
])

// 悬停卡片数据
const hoverCard = ref({
  show: false,
  expert: {},
  style: {},
  timer: null
})

// 图片存在状态
const imageExists = ref(new Set())

// 计算属性
const allTalents = computed(() => store.state.allTalents)
const selectedTalents = computed(() => store.state.selectedTalents)
const selectionStatus = computed(() => store.getters.talentSelectionStatus)
const canProceed = computed(() => selectionStatus.value.canProceed)
const talentsLoading = computed(() => store.state.talentsLoading)
const talentsLoaded = computed(() => store.state.talentsLoaded)

// 方法
const isSelected = (expert) => {
  return selectedTalents.value.some(t => t.name === expert.name)
}

const toggleExpert = (expert) => {
  if (isSelected(expert)) {
    store.commit('REMOVE_TALENT', expert.name)
  } else {
    if (selectedTalents.value.length >= 5) {
      alert('最多只能选择5位专家！')
      return
    }
    store.commit('ADD_TALENT', expert)
  }
}

const toggleSlotMachine = () => {
  showSlotMachine.value = !showSlotMachine.value
}

const spinSlotMachine = async () => {
  if (isSpinning.value) return
  
  isSpinning.value = true
  showSlotResult.value = false
  
  // 从所有专家中随机选择3个不重复的专家
  const availableExperts = [...allTalents.value]
  const selectedExperts = []
  
  // 随机抽取3个专家
  for (let i = 0; i < 3 && availableExperts.length > 0; i++) {
    const randomIndex = Math.floor(Math.random() * availableExperts.length)
    selectedExperts.push(availableExperts.splice(randomIndex, 1)[0])
  }
  
  // 开始旋转动画
  slotReels.value.forEach((reel, index) => {
    reel.spinning = true
    reel.active = false
    
    setTimeout(() => {
      // 使用预选的专家
      if (selectedExperts[index]) {
        reel.icon = selectedExperts[index].avatar
        reel.selectedExpert = selectedExperts[index] // 保存专家信息
      } else {
        // 如果专家不足3个，显示随机图标
        const randomExpert = allTalents.value[Math.floor(Math.random() * allTalents.value.length)]
        reel.icon = randomExpert.avatar
        reel.selectedExpert = randomExpert
      }
      reel.spinning = false
      reel.active = true
      
      // 最后一个轮盘停止后显示结果
      if (index === slotReels.value.length - 1) {
        setTimeout(() => {
          showSlotResult.value = true
          displaySlotResult(selectedExperts)
          isSpinning.value = false
        }, 300)
      }
    }, 800 + index * 300)
  })
}

const displaySlotResult = (selectedExperts = []) => {
  // 使用传入的已选择专家列表
  const expertsToShow = selectedExperts.length > 0 ? selectedExperts : []
  
  if (expertsToShow.length > 0) {
    slotResultText.value = expertsToShow.map(e => `${e.name} (${e.description})`).join('、')
    
    // 自动选择这些专家
    store.commit('SET_SELECTED_TALENTS', expertsToShow)
    
    console.log('🎰 随机抽取了', expertsToShow.length, '位专家:', expertsToShow.map(e => e.name).join('、'))
  } else {
    slotResultText.value = '抽取失败，请重试'
  }
}

const confirmSelection = () => {
  if (selectedTalents.value.length < 3) {
    alert('请至少选择3位专家！')
    return
  }
  
  if (selectedTalents.value.length > 5) {
    alert('最多只能选择5位专家！')
    return
  }
  
  // 进入下一步
  store.commit('SET_CURRENT_STEP', 2)
}

const retryLoadTalents = async () => {
  try {
    await store.dispatch('loadPersons')
  } catch (error) {
    console.error('重新加载专家数据失败:', error)
  }
}

// 检查图片是否存在的方法
const hasPersonImage = (name) => {
  return imageExists.value.has(name)
}

const checkImageExists = async (name) => {
  try {
    const response = await fetch(`/person/${name}.png`, { method: 'HEAD' })
    if (response.ok) {
      imageExists.value.add(name)
    }
  } catch (error) {
    // 图片不存在，不做任何操作
  }
}

const handleImageError = (event) => {
  // 图片加载失败时，从存在列表中移除
  const imgSrc = event.target.src
  const name = imgSrc.split('/').pop().replace('.png', '')
  imageExists.value.delete(name)
}

// 悬停卡片方法
const showHoverCard = (expert, event) => {
  // 清除可能存在的隐藏定时器
  if (hoverCard.value.timer) {
    clearTimeout(hoverCard.value.timer)
    hoverCard.value.timer = null
  }
  
  // 计算卡片位置
  const rect = event.target.closest('.talent-card').getBoundingClientRect()
  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight
  
  // 卡片尺寸估算
  const cardWidth = 300
  const cardHeight = 180
  
  // 默认显示在右侧
  let left = rect.right + 10
  let top = rect.top
  
  // 如果右侧空间不足，显示在左侧
  if (left + cardWidth > viewportWidth) {
    left = rect.left - cardWidth - 10
  }
  
  // 如果下方空间不足，向上调整
  if (top + cardHeight > viewportHeight) {
    top = viewportHeight - cardHeight - 20
  }
  
  // 确保不会超出上边界
  if (top < 20) {
    top = 20
  }
  
  // 如果左侧也不够空间，显示在卡片上方
  if (left < 10) {
    left = rect.left
    top = rect.top - cardHeight - 10
    
    // 如果上方也不够，就显示在下方
    if (top < 20) {
      top = rect.bottom + 10
    }
  }
  
  hoverCard.value = {
    show: true,
    expert: expert,
    style: {
      position: 'fixed',
      left: `${left}px`,
      top: `${top}px`,
      zIndex: 1000
    },
    timer: null
  }
}

const hideHoverCard = () => {
  // 延迟隐藏，给用户时间移动到卡片上
  hoverCard.value.timer = setTimeout(() => {
    hoverCard.value.show = false
    hoverCard.value.expert = {}
    hoverCard.value.style = {}
  }, 150)
}

const keepHoverCard = () => {
  // 鼠标移入卡片时，取消隐藏定时器
  if (hoverCard.value.timer) {
    clearTimeout(hoverCard.value.timer)
    hoverCard.value.timer = null
  }
}

// 初始化老虎机图标的函数
const initializeSlotIcons = () => {
  if (allTalents.value.length > 0) {
    slotReels.value.forEach((reel, index) => {
      const randomExpert = allTalents.value[Math.floor(Math.random() * allTalents.value.length)]
      reel.icon = randomExpert.avatar
    })
  } else {
    // 如果还没有专家数据，使用默认图标
    slotReels.value.forEach((reel, index) => {
      reel.icon = ['🎭', '🚀', '🍎'][index] || '🎲'
    })
  }
}

// 监听专家数据变化
watch(
  () => allTalents.value,
  (newTalents) => {
    if (newTalents.length > 0) {
      // 如果专家数据刚加载完成且老虎机还是默认图标，则更新
      if (slotReels.value[0].icon === '🎭') {
        initializeSlotIcons()
      }
      
      // 检查所有专家的图片是否存在
      newTalents.forEach(expert => {
        checkImageExists(expert.name)
      })
    }
  },
  { immediate: false }
)

onMounted(() => {
  // 初始化老虎机图标
  initializeSlotIcons()
  
  // 检查已有专家的图片
  if (allTalents.value.length > 0) {
    allTalents.value.forEach(expert => {
      checkImageExists(expert.name)
    })
  }
})

onUnmounted(() => {
  // 清理定时器
  if (hoverCard.value.timer) {
    clearTimeout(hoverCard.value.timer)
  }
})
</script>

<style scoped>
.talent-selector {
  background: var(--secondary-black);
  border-radius: 12px;
  padding: 30px;
  margin-bottom: 30px;
  border: 1px solid var(--tertiary-black);
}

/* 老虎机切换按钮 */
.slot-toggle-btn {
  width: 100%;
  padding: 12px 20px;
  background: var(--secondary-black);
  color: var(--primary-white);
  border: 1px solid var(--accent-gray);
  border-radius: 8px;
  font-size: 0.9em;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 15px;
}

.slot-toggle-btn:hover {
  background: var(--tertiary-black);
  border-color: var(--success-green);
}

.slot-toggle-btn.active {
  background: var(--tertiary-black);
  border-color: var(--success-green);
}

.slot-toggle-icon {
  transition: transform 0.3s ease;
}

.slot-toggle-icon.active {
  transform: rotate(180deg);
}

/* 老虎机区域 */
.slot-machine-section {
  display: none;
  margin-bottom: 20px;
  padding: 15px;
  background: rgba(184, 168, 208, 0.8);
  backdrop-filter: blur(10px);
  border-radius: 8px;
  border: 2px solid var(--ui-border-light);
  text-align: center;
  animation: slideDown 0.3s ease;
  box-shadow: var(--ui-shadow-light);
}

.slot-machine-section.show {
  display: block;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.slot-machine-section h4 {
  color: var(--ui-text-primary);
  margin-bottom: 15px;
  font-size: 1.1em;
}

.slot-display {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-bottom: 15px;
  background: rgba(200, 184, 224, 0.7);
  backdrop-filter: blur(8px);
  padding: 10px;
  border-radius: 6px;
  border: 2px solid var(--ui-warning);
  box-shadow: var(--ui-shadow-inset);
}

.slot-reel {
  width: 50px;
  height: 50px;
  background: var(--ui-bg-secondary);
  border-radius: 6px;
  border: 2px solid var(--ui-border-light);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  position: relative;
  box-shadow: var(--ui-shadow-inset);
}

.slot-reel.spinning {
  animation: slotSpin 1.5s ease-out;
}

@keyframes slotSpin {
  0% { transform: rotateY(0deg); }
  50% { transform: rotateY(180deg) scale(1.05); }
  100% { transform: rotateY(360deg); }
}

.slot-item {
  font-size: 1.8em;
  position: absolute;
  transition: all 0.3s ease;
}

.slot-item.active {
  transform: scale(1.1);
  filter: drop-shadow(0 0 8px var(--success-green));
}

.slot-spin-btn {
  padding: 10px 20px;
  background: var(--ui-success);
  color: #000000;
  border: 2px solid var(--ui-border-dark);
  border-radius: 6px;
  font-size: 0.9em;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: var(--ui-shadow-light);
  text-shadow: 0 1px 2px rgba(255, 255, 255, 0.3);
}

.slot-spin-btn:hover {
  background: var(--ui-warning);
  color: #000000;
  border-color: var(--ui-border-accent);
  transform: translateY(-1px);
  box-shadow: var(--ui-shadow-medium);
}

.slot-spin-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
  box-shadow: var(--ui-shadow-light);
}

.slot-result {
  margin-top: 10px;
  padding: 10px;
  background: var(--tertiary-black);
  border-radius: 6px;
  border-left: 3px solid var(--success-green);
  display: none;
  font-size: 0.85em;
}

.slot-result.show {
  display: block;
  animation: slotResultAppear 0.3s ease;
}

@keyframes slotResultAppear {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.slot-result h5 {
  color: var(--success-green);
  margin-bottom: 5px;
  font-size: 1em;
}

.experts-list {
  color: var(--primary-white);
  font-size: 0.9em;
  line-height: 1.3;
}

/* 专家网格 */
.talent-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 15px;
  margin-bottom: 25px;
}

.talent-card {
  background: rgba(184, 168, 208, 0.8);
  backdrop-filter: blur(10px);
  border: 2px solid var(--ui-border-light);
  border-radius: 8px;
  padding: 15px;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: center;
  box-shadow: var(--ui-shadow-light);
}

.talent-card:hover {
  background: rgba(200, 184, 224, 0.9);
  backdrop-filter: blur(15px);
  border-color: var(--ui-border-accent);
  transform: translateY(-2px);
  box-shadow: var(--ui-shadow-medium);
}

.talent-card.selected {
  background: rgba(200, 184, 224, 0.95);
  backdrop-filter: blur(15px);
  border-color: var(--ui-success);
  box-shadow: 0 0 10px rgba(74, 222, 128, 0.3);
}

.talent-avatar {
  font-size: 2em;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.talent-emoji {
  font-size: 1em;
  display: block;
}

/* 只用于悬浮卡片的图片样式 */
.hover-card .talent-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 12px;
  border: 3px solid var(--ui-text-white);
  box-shadow: 0 4px 8px rgba(0,0,0,0.3);
  filter: drop-shadow(2px 2px 4px rgba(0,0,0,0.2));
}

.talent-name {
  font-weight: 600;
  color: var(--ui-text-primary);
  font-size: 1.1em;
  margin-bottom: 5px;
}

.talent-role {
  color: var(--ui-text-secondary);
  font-size: 0.9em;
}

/* 选择控制 */
.selection-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 0;
  border-top: 2px solid var(--ui-border-light);
  margin-top: 20px;
}

.selection-status {
  font-size: 0.9em;
  transition: color 0.3s ease;
}

.choose-btn {
  padding: 10px 20px;
  background: var(--ui-success);
  color: #000000;
  border: 2px solid var(--ui-border-dark);
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s ease;
  box-shadow: var(--ui-shadow-light);
  text-shadow: 0 1px 2px rgba(255, 255, 255, 0.3);
}

.choose-btn:hover:not(:disabled) {
  background: var(--ui-warning);
  color: #000000;
  border-color: var(--ui-border-accent);
  transform: translateY(-1px);
  box-shadow: var(--ui-shadow-medium);
}

.choose-btn:disabled {
  background: var(--ui-bg-tertiary);
  color: var(--ui-text-white);
  border-color: var(--ui-border-light);
  cursor: not-allowed;
  box-shadow: var(--ui-shadow-light);
}

/* 加载状态和空状态样式 */
.loading-state, .empty-state {
  grid-column: 1 / -1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
}

.loading-spinner {
  font-size: 2em;
  margin-bottom: 15px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.loading-text {
  color: var(--ui-text-light);
  font-size: 0.9em;
}

.empty-icon {
  font-size: 3em;
  margin-bottom: 15px;
  opacity: 0.5;
  color: var(--ui-text-light);
}

.empty-text {
  color: var(--ui-text-light);
  margin-bottom: 20px;
  font-size: 0.9em;
}

.retry-btn {
  padding: 8px 16px;
  background: var(--ui-success);
  color: #000000;
  border: 2px solid var(--ui-border-dark);
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85em;
  font-weight: 600;
  transition: all 0.2s ease;
  box-shadow: var(--ui-shadow-light);
  text-shadow: 0 1px 2px rgba(255, 255, 255, 0.3);
}

.retry-btn:hover {
  background: var(--ui-warning);
  color: #000000;
  border-color: var(--ui-border-accent);
  transform: translateY(-1px);
  box-shadow: var(--ui-shadow-medium);
}

/* 悬停卡片样式 - 游戏UI风格 */
.hover-card {
  width: 240px;
  height: 340px;
  background: rgba(200, 184, 224, 0.95);
  backdrop-filter: blur(20px);
  border: 3px solid var(--ui-border-dark);
  border-radius: 10px;
  box-shadow: var(--ui-shadow-heavy);
  animation: hoverCardAppear 0.3s ease-out;
  pointer-events: auto;
  cursor: default;
  display: flex;
  flex-direction: column;
  font-family: inherit;
  position: relative;
}

@keyframes hoverCardAppear {
  from {
    opacity: 0;
    transform: scale(0.8) translateY(20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

/* 卡片顶部标题栏 */
.hover-card .card-header {
  background: var(--ui-bg-secondary);
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 10px;
  border-bottom: 2px solid var(--ui-border-dark);
  border-radius: 7px 7px 0 0;
}

.hover-card .header-circle {
  width: 18px;
  height: 18px;
  border: 2px solid var(--ui-border-dark);
  border-radius: 50%;
  background: var(--ui-bg-primary);
}

.hover-card .header-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--ui-text-primary);
  text-align: center;
  flex: 1;
}

.hover-card .header-plus {
  width: 18px;
  height: 18px;
  background: var(--ui-bg-primary);
  border: 2px solid var(--ui-border-dark);
  border-radius: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 500;
  color: var(--ui-text-primary);
}

/* 名称输入框 */
.hover-card .name-section {
  padding: 8px 10px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.hover-card .name-label {
  font-size: 12px;
  font-weight: 500;
  color: var(--ui-text-primary);
}

.hover-card .name-input {
  flex: 1;
  height: 22px;
  background: var(--ui-text-white);
  border: 1px solid var(--ui-border-light);
  border-radius: 3px;
  padding: 3px 6px;
  font-size: 11px;
  color: var(--ui-text-primary);
  display: flex;
  align-items: center;
  box-shadow: var(--ui-shadow-inset);
}

/* 主图片区域 */
.hover-card .card-image-area {
  flex: 1;
  background: linear-gradient(135deg, var(--ui-info), var(--ui-text-accent));
  margin: 0 8px;
  border-radius: 6px;
  position: relative;
  min-height: 150px;
  box-shadow: var(--ui-shadow-inset);
  overflow: hidden;
}

/* 占满整个蓝色区域的图片 */
.hover-card .talent-image-full {
  width: 100%;
  height: 100%;
  object-fit: cover;
  position: absolute;
  top: 0;
  left: 0;
  border-radius: 6px;
}

/* 没有图片时的fallback */
.hover-card .talent-avatar-fallback {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 4em;
}



.hover-card .talent-emoji {
  font-size: 1em;
  display: block;
  filter: drop-shadow(2px 2px 4px rgba(0,0,0,0.2));
}

/* 叠加在图片上的标题 */
.hover-card .talent-title-overlay {
  position: absolute;
  bottom: 8px;
  left: 8px;
  right: 8px;
  color: var(--ui-text-white);
  font-size: 16px;
  font-weight: 500;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.7);
  text-align: center;
  background: rgba(0,0,0,0.3);
  backdrop-filter: blur(4px);
  padding: 4px 8px;
  border-radius: 4px;
}

/* 描述区域 */
.hover-card .card-description {
  background: var(--card-orange);
  margin: 8px;
  border-radius: 6px;
  padding: 10px;
  height: 50px;
  display: flex;
  align-items: center;
  box-shadow: var(--ui-shadow-inset);
}

.hover-card .description-lines {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.hover-card .desc-line {
  height: 4px;
  background: var(--ui-text-light);
  border-radius: 2px;
  opacity: 0.7;
}

.hover-card .desc-line.long { width: 100%; }
.hover-card .desc-line.medium { width: 75%; }
.hover-card .desc-line.short { width: 50%; }

/* 底部区域 */
.hover-card .card-footer {
  background: var(--ui-warning);
  height: 20px;
  margin: 0 8px 8px;
  border-radius: 0 0 6px 6px;
  box-shadow: var(--ui-shadow-inset);
}



/* 响应式设计 */
@media (max-width: 768px) {
  .talent-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 10px;
  }
  
  .talent-card {
    padding: 12px;
  }
  
  .talent-avatar {
    font-size: 1.5em;
  }
  
  .talent-name {
    font-size: 1em;
  }
  
  .selection-controls {
    flex-direction: column;
    gap: 15px;
    text-align: center;
  }
  
  /* 移动端悬停卡片调整 */
  .hover-card {
    width: 200px;
    height: 280px;
  }
  
  .hover-card .card-header {
    height: 28px;
    padding: 0 8px;
  }
  
  .hover-card .header-title {
    font-size: 12px;
  }
  
  .hover-card .header-circle,
  .hover-card .header-plus {
    width: 16px;
    height: 16px;
    font-size: 10px;
  }
  
  .hover-card .name-section {
    padding: 6px 8px;
  }
  
  .hover-card .name-label {
    font-size: 10px;
  }
  
  .hover-card .name-input {
    height: 18px;
    font-size: 9px;
  }
  
  .hover-card .talent-avatar-fallback {
    font-size: 3em;
  }
  
  .hover-card .talent-title-overlay {
    font-size: 14px;
  }
  
  .hover-card .card-description {
    height: 40px;
    margin: 6px;
    padding: 8px;
  }
  
  .hover-card .card-footer {
    height: 16px;
    margin: 0 6px 6px;
  }
}
</style> 