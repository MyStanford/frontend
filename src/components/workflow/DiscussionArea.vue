<template>
  <div class="discussion-area">
    <div class="discussion-header">
      <h4>💭 Discuss</h4>
      <div class="discussion-status" :class="{ active: isDiscussing }">
        {{ discussionStatusText }}
      </div>
    </div>
    
    <!-- 思维导图容器 -->
    <div 
      class="mindmap-container" 
      ref="mindmapContainer"
      @mousedown="startDrag"
      @wheel="handleWheel"
    >
      <!-- 默认状态 -->
      <div v-if="discussionHistory.length === 0 && !isDiscussing" class="mindmap-empty">
        <div class="empty-center">
          <div class="empty-topic">
            💭
          </div>
        </div>
      </div>
      
      <!-- 思维导图主体 -->
      <div v-else class="mindmap-content">
        <!-- SVG 连接线 -->
        <svg class="mindmap-connections" viewBox="0 0 800 600">
          <defs>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
              <feMerge> 
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          <g v-for="(message, messageIdx) in discussionHistory" :key="`line-${message.messageId}`">
            <path 
              :d="getTreeConnectionPath(getExpertIndex(message.expert), getMessageIndex(message), Object.keys(organizeMessagesAsTree()).length)"
              class="connection-line"
              :class="{ 
                'line-thinking': isExpertThinking(message.expert),
                'line-complete': !isExpertThinking(message.expert),
                'line-first-round': getMessageIndex(message) === 0,
                'line-follow-up': getMessageIndex(message) > 0
              }"
              filter="url(#glow)"
            />
          </g>
        </svg>
        
        <!-- 中心主题节点 - 树状布局时在顶部 -->
        <div 
          class="mindmap-center tree-layout" 
          :class="{ 
            thinking: isDiscussing,
            minimized: centerMinimized 
          }"
          @click="toggleCenterNode"
          title="点击最小化/展开中心节点"
        >
          <div v-if="!centerMinimized" class="center-topic">
            <div class="topic-icon">💡</div>
            <div class="topic-text">{{ discussionTopic || '讨论主题' }}</div>
          </div>
          <div v-else class="center-minimized">
            <div class="minimized-icon">💡</div>
          </div>
          <div v-if="isDiscussing && !centerMinimized" class="center-thinking">
            <div class="thinking-pulse"></div>
            <div class="thinking-text">思维碰撞中...</div>
          </div>
        </div>
        
        <!-- 专家节点 - 树状布局 -->
        <div 
          v-for="(message, index) in discussionHistory" 
          :key="message.messageId"
          class="expert-node tree-node"
          :class="{ 
            'node-thinking': isExpertThinking(message.expert),
            'node-complete': !isExpertThinking(message.expert),
            'node-interactive': !isExpertThinking(message.expert),
            'node-first-round': getMessageIndex(message) === 0,
            'node-follow-up': getMessageIndex(message) > 0
          }"
          :style="getTreeNodePosition(getExpertIndex(message.expert), getMessageIndex(message), Object.keys(organizeMessagesAsTree()).length, organizeMessagesAsTree()[message.expert]?.length || 1)"
          @click="showExpertDetail(message)"
        >
          <!-- 专家头像和名称 -->
          <div class="node-header">
            <div class="node-avatar">{{ getExpertAvatar(message.expert) }}</div>
            <div class="node-info">
              <div class="node-name">{{ message.expert }}</div>
              <div class="node-round">第{{ getMessageIndex(message) + 1 }}轮</div>
            </div>
          </div>
          
          <!-- 思考状态 -->
          <div v-if="isExpertThinking(message.expert)" class="node-thinking-content">
            <div class="thinking-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
            <div class="thinking-label">深度思考中...</div>
          </div>
          
          <!-- 专家观点 -->
          <div v-else class="node-content">
            <div class="content-text">{{ message.content }}</div>
            <div class="content-time">{{ formatTime(message.timestamp) }}</div>
            
            <!-- 游戏化互动按钮 -->
            <div class="node-interactions">
              <button 
                class="interaction-btn support"
                :class="{ active: getUserVote(message.messageId) === 'support' }"
                @click.stop="voteMessage(message.messageId, 'support', message.expert)"
              >
                👍 <span class="interaction-count">{{ getInteractionCount(message.messageId, 'support') }}</span>
              </button>
              <button 
                class="interaction-btn oppose"
                :class="{ active: getUserVote(message.messageId) === 'oppose' }"
                @click.stop="voteMessage(message.messageId, 'oppose', message.expert)"
              >
                👎 <span class="interaction-count">{{ getInteractionCount(message.messageId, 'oppose') }}</span>
              </button>
              <button 
                class="interaction-btn funny"
                :class="{ active: getUserVote(message.messageId) === 'funny' }"
                @click.stop="voteMessage(message.messageId, 'funny', message.expert)"
              >
                😂 <span class="interaction-count">{{ getInteractionCount(message.messageId, 'funny') }}</span>
              </button>
            </div>
            
            <!-- AI反应 -->
            <div v-if="message.aiReaction" class="node-ai-reaction">
              💬 {{ message.aiReaction }}
            </div>
          </div>
        </div>
        
        <!-- 思考中的专家节点 -->
        <div 
          v-for="thinking in thinkingMessages" 
          :key="`thinking-${thinking.id}`"
          class="expert-node node-thinking"
          :style="getThinkingNodePosition(thinking.expertName)"
        >
          <div class="node-header">
            <div class="node-avatar">{{ getExpertAvatar(thinking.expertName) }}</div>
            <div class="node-name">{{ thinking.expertName }}</div>
          </div>
          <div class="node-thinking-content">
            <div class="thinking-steps">
              <div 
                v-for="(step, index) in thinking.steps" 
                :key="index"
                class="thinking-step"
                :class="{ active: step.active }"
              >
                {{ step.text }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div class="discussion-controls">
      <div class="control-group">
        <button class="control-btn clear-btn" @click="clearDiscussion" title="重置导图">
          🗑️ 重置
        </button>
      </div>
      
      <div class="control-group">
        <button class="control-btn view-btn" @click="resetView" title="重置视图">
          🏠 复位
        </button>
        <button class="control-btn view-btn" @click="centerView" title="居中视图">
          🎯 居中
        </button>
        <button class="control-btn view-btn" @click="fitToView" title="适合窗口">
          📐 适合
        </button>
        <button 
          class="control-btn center-btn" 
          @click="toggleCenterNode" 
          :title="centerMinimized ? '展开中心节点' : '最小化中心节点'"
        >
          {{ centerMinimized ? '🔍 展开' : '🫥 最小化' }}
        </button>
      </div>
      
      <div class="control-group zoom-controls">
        <button class="control-btn zoom-btn" @click="zoomOut" title="缩小">
          ➖
        </button>
        <span class="zoom-indicator">{{ Math.round(zoomState.scale * 100) }}%</span>
        <button class="control-btn zoom-btn" @click="zoomIn" title="放大">
          ➕
        </button>
      </div>
      
      
    </div>
    
    <!-- 专家详情弹窗 -->
    <div 
      v-if="expertDetailModal.show"
      class="expert-detail-overlay"
      @click="closeExpertDetail"
    >
      <div class="expert-detail-modal" @click.stop>
        <!-- 弹窗头部 -->
        <div class="modal-header">
          <div class="expert-info">
            <div class="expert-large-avatar">{{ getExpertAvatar(expertDetailModal.expert?.name) }}</div>
            <div class="expert-details">
              <h3 class="expert-name">{{ expertDetailModal.expert?.name }}</h3>
              <div class="expert-role">{{ getExpertRole(expertDetailModal.expert?.name) }}</div>
              <div class="expert-description">{{ getExpertDescription(expertDetailModal.expert?.name) }}</div>
            </div>
          </div>
          <button class="modal-close-btn" @click="closeExpertDetail">✕</button>
        </div>
        
        <!-- 弹窗内容 -->
        <div class="modal-content">
          <div class="opinion-section">
            <h4 class="section-title">💭 专家观点</h4>
            <div class="opinion-text">{{ expertDetailModal.message?.content }}</div>
            <div class="opinion-time">
              发表于 {{ formatTime(expertDetailModal.message?.timestamp) }}
            </div>
          </div>
          
          <!-- 互动区域 -->
          <div class="modal-interactions">
            <h4 class="section-title">🎯 观点互动</h4>
            <div class="interaction-buttons">
              <button 
                class="modal-interaction-btn support"
                :class="{ active: getUserVote(expertDetailModal.message?.messageId) === 'support' }"
                @click="voteMessage(expertDetailModal.message?.messageId, 'support', expertDetailModal.expert?.name)"
              >
                <span class="btn-icon">👍</span>
                <span class="btn-text">支持</span>
                <span class="btn-count">{{ getInteractionCount(expertDetailModal.message?.messageId, 'support') }}</span>
              </button>
              <button 
                class="modal-interaction-btn oppose"
                :class="{ active: getUserVote(expertDetailModal.message?.messageId) === 'oppose' }"
                @click="voteMessage(expertDetailModal.message?.messageId, 'oppose', expertDetailModal.expert?.name)"
              >
                <span class="btn-icon">👎</span>
                <span class="btn-text">反对</span>
                <span class="btn-count">{{ getInteractionCount(expertDetailModal.message?.messageId, 'oppose') }}</span>
              </button>
              <button 
                class="modal-interaction-btn funny"
                :class="{ active: getUserVote(expertDetailModal.message?.messageId) === 'funny' }"
                @click="voteMessage(expertDetailModal.message?.messageId, 'funny', expertDetailModal.expert?.name)"
              >
                <span class="btn-icon">😂</span>
                <span class="btn-text">有趣</span>
                <span class="btn-count">{{ getInteractionCount(expertDetailModal.message?.messageId, 'funny') }}</span>
              </button>
            </div>
          </div>
          
          <!-- AI反应 -->
          <div v-if="expertDetailModal.message?.aiReaction" class="modal-ai-reaction">
            <h4 class="section-title">🤖 AI回应</h4>
            <div class="ai-reaction-content">
              💬 {{ expertDetailModal.message.aiReaction }}
            </div>
          </div>
          
          <!-- 专家更多信息 -->
          <div class="expert-more-info">
            <h4 class="section-title">📚 专家背景</h4>
            <div class="expert-background">
              {{ getExpertBackground(expertDetailModal.expert?.name) }}
            </div>
          </div>
        </div>
        
        <!-- 弹窗底部 -->
        <div class="modal-footer">
          <button class="modal-action-btn" @click="shareExpertOpinion">
            🔗 分享观点
          </button>
          <button class="modal-action-btn" @click="saveExpertOpinion">
            💾 保存观点
          </button>
          <button class="modal-close-btn-secondary" @click="closeExpertDetail">
            关闭
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useStore } from 'vuex'

const store = useStore()

// 响应式数据
const mindmapContainer = ref(null)
const thinkingMessages = ref([])
const selectedNodeId = ref(null)
const isZoomed = ref(false)
const centerMinimized = ref(false)
const expertDetailModal = ref({
  show: false,
  expert: null,
  message: null
})

// 拖拽和缩放状态
const dragState = ref({
  isDragging: false,
  startX: 0,
  startY: 0,
  translateX: 0,
  translateY: 0
})

const zoomState = ref({
  scale: 1,
  minScale: 0.3,
  maxScale: 2.5
})

// 计算属性
const discussionHistory = computed(() => store.state.discussionHistory)
const isDiscussing = computed(() => store.state.isDiscussing)
const messageInteractions = computed(() => store.state.messageInteractions)
const userVotes = computed(() => store.state.userVotes)
const discussionTopic = computed(() => store.state.discussionTopic)
const selectedTalents = computed(() => store.state.selectedTalents)

const discussionStatusText = computed(() => {
  if (isDiscussing.value) {
    return 'thinking'
  } else if (discussionHistory.value.length > 0) {
    return '专家讨论完毕'
  } else {
    return ''
  }
})

// 方法



const clearDiscussion = () => {
  store.commit('CLEAR_DISCUSSION')
  thinkingMessages.value = []
  selectedNodeId.value = null
  centerMinimized.value = false // 重置中心节点状态
}

// 树状思维导图相关方法

// 组织消息为树状结构
const organizeMessagesAsTree = () => {
  const expertGroups = {}
  
  // 按专家分组消息
  discussionHistory.value.forEach(message => {
    if (!expertGroups[message.expert]) {
      expertGroups[message.expert] = []
    }
    expertGroups[message.expert].push(message)
  })
  
  // 按时间戳排序每个专家的消息
  Object.keys(expertGroups).forEach(expert => {
    expertGroups[expert].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
  })
  
  return expertGroups
}

// 获取树状节点位置
const getTreeNodePosition = (expertIndex, messageIndex, totalExperts, totalMessagesForExpert) => {
  const containerWidth = 800
  const containerHeight = 600
  const centerX = containerWidth / 2
  const centerY = 100 // 主题在顶部
  
  if (messageIndex === 0) {
    // 第一轮消息：水平分布在第二层
    const expertSpacing = Math.min(200, (containerWidth - 100) / Math.max(totalExperts, 1))
    const startX = centerX - ((totalExperts - 1) * expertSpacing) / 2
    const x = startX + expertIndex * expertSpacing
    const y = centerY + 150 // 第一层距离主题150px
    
    return {
      position: 'absolute',
      left: `${x - 100}px`,
      top: `${y - 75}px`
    }
  } else {
    // 后续轮次：垂直排列在对应专家下方
    const expertSpacing = Math.min(200, (containerWidth - 100) / Math.max(totalExperts, 1))
    const startX = centerX - ((totalExperts - 1) * expertSpacing) / 2
    const x = startX + expertIndex * expertSpacing
    const y = centerY + 150 + messageIndex * 130 // 每轮间距130px
    
    return {
      position: 'absolute',
      left: `${x - 100}px`,
      top: `${y - 75}px`
    }
  }
}

// 获取树状连接路径
const getTreeConnectionPath = (expertIndex, messageIndex, totalExperts) => {
  const containerWidth = 800
  const containerHeight = 600
  const centerX = containerWidth / 2
  const centerY = 100
  
  const isMobile = window.innerWidth <= 768
  let centerRadius = centerMinimized.value ? (isMobile ? 25 : 30) : (isMobile ? 50 : 70)
  
  if (messageIndex === 0) {
    // 从主题连接到第一轮消息
    const expertSpacing = Math.min(200, (containerWidth - 100) / Math.max(totalExperts, 1))
    const startX = centerX - ((totalExperts - 1) * expertSpacing) / 2
    const endX = startX + expertIndex * expertSpacing
    const endY = centerY + 150
    
    // 从中心节点底部连出
    const startXPos = centerX
    const startYPos = centerY + centerRadius
    
    // 贝塞尔曲线连接
    const controlY = centerY + 75
    
    return `M ${startXPos} ${startYPos} Q ${startXPos} ${controlY} ${endX} ${endY}`
  } else {
    // 从前一轮消息连接到当前轮次
    const expertSpacing = Math.min(200, (containerWidth - 100) / Math.max(totalExperts, 1))
    const startX = centerX - ((totalExperts - 1) * expertSpacing) / 2
    const x = startX + expertIndex * expertSpacing
    
    const startY = centerY + 150 + (messageIndex - 1) * 130 + 75 // 前一个节点底部
    const endY = centerY + 150 + messageIndex * 130 - 75 // 当前节点顶部
    
    // 直线连接
    return `M ${x} ${startY} L ${x} ${endY}`
  }
}

// 获取专家在树中的索引
const getExpertIndex = (expertName) => {
  const expertGroups = organizeMessagesAsTree()
  const expertNames = Object.keys(expertGroups).sort()
  return expertNames.indexOf(expertName)
}

// 获取消息在专家组中的索引
const getMessageIndex = (message) => {
  const expertGroups = organizeMessagesAsTree()
  const expertMessages = expertGroups[message.expert] || []
  return expertMessages.findIndex(msg => msg.messageId === message.messageId)
}

const getExpertAvatar = (expertName) => {
  const expert = selectedTalents.value.find(t => t.name === expertName)
  return expert?.avatar || '🧠'
}

const isExpertThinking = (expertName) => {
  return thinkingMessages.value.some(t => t.expertName === expertName)
}

const getThinkingNodePosition = (expertName) => {
  // 为思考中的专家分配临时位置 - 树状布局
  const expertGroups = organizeMessagesAsTree()
  const expertNames = Object.keys(expertGroups).sort()
  const expertIndex = expertNames.indexOf(expertName)
  const totalExperts = expertNames.length
  
  // 如果找不到专家，分配一个临时索引
  if (expertIndex === -1) {
    const thinkingIndex = thinkingMessages.value.findIndex(t => t.expertName === expertName)
    const tempIndex = totalExperts + thinkingIndex
    return getTreeNodePosition(tempIndex, 0, totalExperts + thinkingMessages.value.length, 1)
  }
  
  // 计算该专家的下一轮位置
  const expertMessages = expertGroups[expertName] || []
  const nextRound = expertMessages.length
  
  return getTreeNodePosition(expertIndex, nextRound, totalExperts, nextRound + 1)
}

const selectNode = (messageId) => {
  selectedNodeId.value = selectedNodeId.value === messageId ? null : messageId
}

const toggleZoom = () => {
  isZoomed.value = !isZoomed.value
}

// 切换中心节点状态
const toggleCenterNode = () => {
  centerMinimized.value = !centerMinimized.value
}

// 专家详情弹窗相关方法
const showExpertDetail = (message) => {
  const expert = selectedTalents.value.find(t => t.name === message.expert)
  expertDetailModal.value = {
    show: true,
    expert: expert || { name: message.expert },
    message: message
  }
  
  // 防止背景滚动
  document.body.style.overflow = 'hidden'
  console.log('🔍 显示专家详情:', message.expert)
}

const closeExpertDetail = () => {
  expertDetailModal.value = {
    show: false,
    expert: null,
    message: null
  }
  
  // 恢复背景滚动
  document.body.style.overflow = ''
}

const getExpertRole = (expertName) => {
  const expert = selectedTalents.value.find(t => t.name === expertName)
  return expert?.role || '知名专家'
}

const getExpertDescription = (expertName) => {
  const expert = selectedTalents.value.find(t => t.name === expertName)
  return expert?.description || '在相关领域有着深入研究和丰富经验的专业人士。'
}

const getExpertBackground = (expertName) => {
  const expert = selectedTalents.value.find(t => t.name === expertName)
  
  // 根据专家生成背景介绍
  const backgrounds = {
    '爱因斯坦': '现代物理学之父，相对论的创立者。以其深邃的物理直觉和哲学思维著称，曾获得诺贝尔物理学奖。',
    '乔布斯': 'Apple公司联合创始人，现代个人计算机革命的先驱。以其卓越的产品设计理念和商业洞察力改变了世界。',
    '马斯克': '特斯拉和SpaceX的CEO，被誉为现实版钢铁侠。致力于推动电动汽车、太空探索和人工智能的发展。',
    '巴菲特': '伯克希尔·哈撒韦公司CEO，被称为"股神"。以其价值投资理念和长期投资策略享誉全球。',
    '比尔·盖茨': '微软公司联合创始人，慈善家。通过技术创新和慈善事业致力于改善全球健康和教育状况。',
    '马云': '阿里巴巴集团创始人，中国电商领域的开拓者。以其独特的商业眼光和企业家精神推动了中国互联网的发展。'
  }
  
  return backgrounds[expertName] || expert?.description || '在其专业领域具有深厚的学术背景和实践经验，对相关问题有着独到的见解和深入的研究。'
}

// 分享专家观点
const shareExpertOpinion = () => {
  const message = expertDetailModal.value.message
  const expert = expertDetailModal.value.expert
  
  if (navigator.share) {
    navigator.share({
      title: `${expert.name}的观点`,
      text: message.content,
      url: window.location.href
    }).catch(console.log)
  } else {
    // 降级到复制到剪贴板
    const text = `${expert.name}说："${message.content}" - 来自MyStanford智能讨论`
    navigator.clipboard.writeText(text).then(() => {
      alert('观点已复制到剪贴板！')
    }).catch(() => {
      alert('分享失败，请手动复制观点内容')
    })
  }
}

// 保存专家观点
const saveExpertOpinion = () => {
  const message = expertDetailModal.value.message
  const expert = expertDetailModal.value.expert
  
  const data = {
    expert: expert.name,
    role: expert.role,
    opinion: message.content,
    timestamp: message.timestamp,
    topic: discussionTopic.value
  }
  
  // 保存到本地存储
  const savedOpinions = JSON.parse(localStorage.getItem('savedOpinions') || '[]')
  savedOpinions.push(data)
  localStorage.setItem('savedOpinions', JSON.stringify(savedOpinions))
  
  alert('观点已保存到本地！')
  console.log('💾 观点已保存:', data)
}

// 时间格式化
const formatTime = (timestamp) => {
  if (!timestamp) return '刚刚'
  
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  
  if (diffMins < 1) return '刚刚'
  if (diffMins < 60) return `${diffMins}分钟前`
  if (diffHours < 24) return `${diffHours}小时前`
  if (diffDays < 7) return `${diffDays}天前`
  
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 获取用户投票状态
const getUserVote = (messageId) => {
  if (!messageId) return null
  const votes = JSON.parse(localStorage.getItem('userVotes') || '{}')
  return votes[messageId] || null
}

// 获取互动数量
const getInteractionCount = (messageId, type) => {
  if (!messageId) return 0
  const interactions = JSON.parse(localStorage.getItem('messageInteractions') || '{}')
  return interactions[messageId]?.[type] || 0
}

// 投票功能
const voteMessage = (messageId, voteType, expertName) => {
  if (!messageId) return
  
  // 获取当前用户投票状态
  const votes = JSON.parse(localStorage.getItem('userVotes') || '{}')
  const currentVote = votes[messageId]
  
  // 获取当前互动数据
  const interactions = JSON.parse(localStorage.getItem('messageInteractions') || '{}')
  if (!interactions[messageId]) {
    interactions[messageId] = { support: 0, oppose: 0, funny: 0 }
  }
  
  // 如果已经投过同样的票，则取消投票
  if (currentVote === voteType) {
    delete votes[messageId]
    interactions[messageId][voteType] = Math.max(0, interactions[messageId][voteType] - 1)
    console.log(`🗳️ 取消对${expertName}观点的${voteType}投票`)
  } else {
    // 如果之前投过其他票，先减少之前的计数
    if (currentVote) {
      interactions[messageId][currentVote] = Math.max(0, interactions[messageId][currentVote] - 1)
    }
    
    // 投新票
    votes[messageId] = voteType
    interactions[messageId][voteType] = (interactions[messageId][voteType] || 0) + 1
    console.log(`🗳️ 对${expertName}的观点投票: ${voteType}`)
    
    // 触发AI反应（随机生成）
    setTimeout(() => {
      generateAIReaction(messageId, voteType, expertName)
    }, 1000)
  }
  
  // 保存到本地存储
  localStorage.setItem('userVotes', JSON.stringify(votes))
  localStorage.setItem('messageInteractions', JSON.stringify(interactions))
  
  // 触发界面更新（通过 store）
  store.dispatch('updateMessageInteraction', { messageId, interactions: interactions[messageId] })
}

// 生成AI反应
const generateAIReaction = (messageId, voteType, expertName) => {
  const reactions = {
    support: [
      `看来${expertName}的观点得到了认可！这确实是一个很有见地的想法。`,
      `${expertName}的分析获得了支持，这种观点在当前环境下确实很有价值。`,
      `很好！${expertName}的论述逻辑清晰，获得支持是理所应当的。`
    ],
    oppose: [
      `看来对于${expertName}的观点还存在不同声音，这正是讨论的价值所在。`,
      `${expertName}的观点引发了争议，这种多元化的思考很有意义。`,
      `不同的观点碰撞往往能产生更深刻的思考，${expertName}也会乐于看到这种讨论。`
    ],
    funny: [
      `哈哈！${expertName}的表达方式确实很有趣，严肃的话题也可以轻松讨论。`,
      `${expertName}总是能用独特的方式表达观点，这正是智慧的体现。`,
      `看来${expertName}的幽默感也征服了大家，寓教于乐的讨论方式很棒！`
    ]
  }
  
  const reactionList = reactions[voteType] || reactions.support
  const randomReaction = reactionList[Math.floor(Math.random() * reactionList.length)]
  
  // 更新消息的AI反应
  store.dispatch('addAIReaction', { messageId, reaction: randomReaction })
  
  console.log(`🤖 AI反应: ${randomReaction}`)
}

// 拖拽功能
const startDrag = (event) => {
  if (event.target.closest('.expert-node') || event.target.closest('.mindmap-center')) {
    return // 如果点击的是节点，不启动拖拽
  }
  
  dragState.value.isDragging = true
  dragState.value.startX = event.clientX - dragState.value.translateX
  dragState.value.startY = event.clientY - dragState.value.translateY
  
  // 添加全局鼠标事件监听
  document.addEventListener('mousemove', handleDrag)
  document.addEventListener('mouseup', stopDrag)
  
  // 改变鼠标样式
  if (mindmapContainer.value) {
    mindmapContainer.value.style.cursor = 'grabbing'
  }
}

const handleDrag = (event) => {
  if (!dragState.value.isDragging) return
  
  event.preventDefault()
  dragState.value.translateX = event.clientX - dragState.value.startX
  dragState.value.translateY = event.clientY - dragState.value.startY
  
  updateTransform()
}

const stopDrag = () => {
  dragState.value.isDragging = false
  
  // 移除全局事件监听
  document.removeEventListener('mousemove', handleDrag)
  document.removeEventListener('mouseup', stopDrag)
  
  // 恢复鼠标样式
  if (mindmapContainer.value) {
    mindmapContainer.value.style.cursor = 'grab'
  }
}

// 缩放功能
const handleWheel = (event) => {
  event.preventDefault()
  
  const delta = event.deltaY > 0 ? -0.1 : 0.1
  const newScale = Math.max(
    zoomState.value.minScale, 
    Math.min(zoomState.value.maxScale, zoomState.value.scale + delta)
  )
  
  if (newScale !== zoomState.value.scale) {
    // 计算鼠标位置相对于容器的位置
    const rect = mindmapContainer.value.getBoundingClientRect()
    const mouseX = event.clientX - rect.left
    const mouseY = event.clientY - rect.top
    
    // 计算缩放中心偏移
    const scaleRatio = newScale / zoomState.value.scale
    const deltaX = (mouseX - dragState.value.translateX) * (1 - scaleRatio)
    const deltaY = (mouseY - dragState.value.translateY) * (1 - scaleRatio)
    
    zoomState.value.scale = newScale
    dragState.value.translateX += deltaX
    dragState.value.translateY += deltaY
    
    updateTransform()
  }
}

// 更新变换矩阵
const updateTransform = () => {
  if (mindmapContainer.value) {
    const content = mindmapContainer.value.querySelector('.mindmap-content')
    if (content) {
      content.style.transform = `translate(${dragState.value.translateX}px, ${dragState.value.translateY}px) scale(${zoomState.value.scale})`
    }
  }
}

// 重置视图
const resetView = () => {
  dragState.value.translateX = 0
  dragState.value.translateY = 0
  zoomState.value.scale = 1
  updateTransform()
}

// 居中视图
const centerView = () => {
  if (mindmapContainer.value) {
    const rect = mindmapContainer.value.getBoundingClientRect()
    dragState.value.translateX = 0
    dragState.value.translateY = 0
    updateTransform()
  }
}

// 缩放到适合大小
const fitToView = () => {
  if (discussionHistory.value.length === 0) return
  
  // 对于树状布局，根据专家数量和轮次调整缩放比例
  const expertGroups = organizeMessagesAsTree()
  const expertCount = Object.keys(expertGroups).length
  const maxRounds = Math.max(...Object.values(expertGroups).map(msgs => msgs.length))
  
  let targetScale = 1
  
  // 根据专家数量和最大轮次数调整缩放
  if (expertCount > 5 || maxRounds > 3) {
    targetScale = 0.6
  } else if (expertCount > 3 || maxRounds > 2) {
    targetScale = 0.7
  } else if (expertCount > 2 || maxRounds > 1) {
    targetScale = 0.8
  }
  
  zoomState.value.scale = Math.max(zoomState.value.minScale, Math.min(zoomState.value.maxScale, targetScale))
  dragState.value.translateX = 0
  dragState.value.translateY = 0
  updateTransform()
}

// 缩放按钮功能
const zoomIn = () => {
  const newScale = Math.min(zoomState.value.maxScale, zoomState.value.scale + 0.2)
  if (newScale !== zoomState.value.scale) {
    zoomState.value.scale = newScale
    updateTransform()
  }
}

const zoomOut = () => {
  const newScale = Math.max(zoomState.value.minScale, zoomState.value.scale - 0.2)
  if (newScale !== zoomState.value.scale) {
    zoomState.value.scale = newScale
    updateTransform()
  }
}

// 监听思考消息变化
watch(isDiscussing, (newValue) => {
  if (newValue) {
    // 开始讨论时清空思考消息和选择状态
    thinkingMessages.value = []
    selectedNodeId.value = null
  }
})

// 监听专家数量变化，自动调整中心节点
watch(() => discussionHistory.value.length, (newLength) => {
  // 如果专家数量超过4个，自动最小化中心节点以减少遮挡
  if (newLength >= 4 && !centerMinimized.value) {
    centerMinimized.value = true
    console.log('🎯 专家较多，自动最小化中心节点以减少遮挡')
  }
}, { immediate: true })

// 模拟专家思考过程
const addThinkingMessage = (expertName, expert) => {
  const thinkingId = Date.now() + Math.random()
  const steps = [
    { text: '🔍 正在搜索相关领域知识...', active: false },
    { text: '📚 正在查阅专业文献...', active: false },
    { text: '💡 正在整合核心观点...', active: false },
    { text: '🧠 正在深度思考...', active: false }
  ]
  
  if (expert.category === 'tech') {
    steps[0].text = '🔬 正在分析技术趋势...'
    steps[1].text = '⚡ 正在研究前沿技术...'
    steps[2].text = '🧮 正在计算最优方案...'
    steps[3].text = '🚀 正在设计技术架构...'
  } else if (expert.category === 'business') {
    steps[0].text = '📊 正在分析市场数据...'
    steps[1].text = '💼 正在研究商业案例...'
    steps[2].text = '📈 正在评估风险收益...'
    steps[3].text = '🎯 正在制定策略建议...'
  }
  
  const thinking = {
    id: thinkingId,
    expertName,
    timestamp: new Date(),
    steps
  }
  
  thinkingMessages.value.push(thinking)
  
  // 模拟思考步骤
  steps.forEach((step, index) => {
    setTimeout(() => {
      step.active = true
    }, (index + 1) * 800)
  })
  
  // 思考完成后移除
  setTimeout(() => {
    const index = thinkingMessages.value.findIndex(t => t.id === thinkingId)
    if (index !== -1) {
      thinkingMessages.value.splice(index, 1)
    }
  }, steps.length * 800 + 1000)
}

// 监听讨论开始，为每个专家添加思考消息
watch([isDiscussing, () => store.state.selectedTalents], ([newIsDiscussing, selectedTalents]) => {
  if (newIsDiscussing && selectedTalents.length > 0) {
    selectedTalents.forEach((expert, index) => {
      setTimeout(() => {
        addThinkingMessage(expert.name, expert)
      }, index * 500)
    })
  }
}, { immediate: true })

// 生命周期钩子
onMounted(() => {
  // 设置容器初始样式
  if (mindmapContainer.value) {
    mindmapContainer.value.style.cursor = 'grab'
    mindmapContainer.value.style.userSelect = 'none'
  }
  
  // 监听键盘事件（可选的快捷键）
  document.addEventListener('keydown', handleKeyboard)
})

onUnmounted(() => {
  // 清理事件监听器
  document.removeEventListener('mousemove', handleDrag)
  document.removeEventListener('mouseup', stopDrag)
  document.removeEventListener('keydown', handleKeyboard)
})

// 键盘快捷键支持
const handleKeyboard = (event) => {
  // ESC键关闭弹窗
  if (event.key === 'Escape' && expertDetailModal.value.show) {
    event.preventDefault()
    closeExpertDetail()
    return
  }
  
  // 其他快捷键（仅在弹窗未显示时生效）
  if (!expertDetailModal.value.show && (event.ctrlKey || event.metaKey)) {
    switch (event.key) {
      case '0':
        event.preventDefault()
        resetView()
        break
      case '=':
      case '+':
        event.preventDefault()
        zoomIn()
        break
      case '-':
        event.preventDefault()
        zoomOut()
        break
    }
  }
}
</script>

<style scoped>
.discussion-area {
  background: rgba(200, 184, 224, 0.9);
  backdrop-filter: blur(15px);
  border-radius: 16px;
  border: 4px solid var(--card-border);
  min-height: 600px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.3);
  font-family: inherit;
  position: relative;
}

.discussion-header {
  background: var(--card-header);
  padding: 16px 20px;
  border-bottom: 3px solid var(--card-border);
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-radius: 12px 12px 0 0;
}

.discussion-header h4 {
  color: #1f2937;
  font-weight: 700;
  font-size: 1.2em;
  margin: 0;
}

.discussion-status {
  color: #4b5563;
  font-size: 0.9em;
  transition: color 0.3s ease;
  font-weight: 500;
}

.discussion-status.active {
  color: var(--success-green);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

/* 思维导图容器 */
.mindmap-container {
  flex: 1;
  position: relative;
  overflow: hidden;
  background: rgba(45, 45, 77, 0.3);
  backdrop-filter: blur(5px);
  cursor: grab;
  user-select: none;
  min-height: 500px; /* 确保树状布局有足够空间 */
}

.mindmap-container:active {
  cursor: grabbing;
}

.mindmap-container.zoomed {
  transform: scale(1.2);
}

/* 空状态 */
.mindmap-empty {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-center {
  text-align: center;
  color: var(--accent-gray);
}

.empty-topic {
  font-size: 4em;
  margin-bottom: 20px;
  opacity: 0.6;
}

.empty-text {
  font-size: 1.1em;
  line-height: 1.6;
}

/* 思维导图内容 */
.mindmap-content {
  position: relative;
  width: 100%;
  height: 100%;
}

/* SVG连接线 */
.mindmap-connections {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.connection-line {
  fill: none;
  stroke: var(--success-green);
  stroke-width: 2;
  opacity: 0.7;
  transition: all 0.3s ease;
}

.connection-line.line-thinking {
  stroke: var(--warning-yellow);
  stroke-dasharray: 5,5;
  animation: dashMove 2s linear infinite;
}

.connection-line.line-complete {
  stroke: var(--success-green);
  opacity: 1;
}

/* 树状布局连接线样式 */
.connection-line.line-first-round {
  stroke: var(--success-green);
  stroke-width: 3;
  opacity: 1;
}

.connection-line.line-follow-up {
  stroke: var(--warning-yellow);
  stroke-width: 2;
  opacity: 0.8;
}

@keyframes dashMove {
  to {
    stroke-dashoffset: -10;
  }
}

/* 中心主题节点 - 树状布局 */
.mindmap-center {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 140px;
  height: 140px;
  background: radial-gradient(circle, var(--success-green), var(--secondary-black));
  border: 3px solid var(--success-green);
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  box-shadow: 0 0 30px rgba(0, 255, 136, 0.4);
  transition: all 0.5s ease;
  z-index: 1;
  opacity: 0.95;
}

/* 树状布局的中心节点位于顶部 */
.mindmap-center.tree-layout {
  top: 100px;
  transform: translate(-50%, 0);
}

.mindmap-center.thinking {
  animation: centerPulse 2s ease-in-out infinite;
}

.mindmap-center.minimized {
  width: 60px;
  height: 60px;
  opacity: 0.8;
  cursor: pointer;
}

.mindmap-center.minimized:hover {
  opacity: 1;
  transform: translate(-50%, -50%) scale(1.1);
}

@keyframes centerPulse {
  0%, 100% {
    transform: translate(-50%, -50%) scale(1);
    box-shadow: 0 0 30px rgba(0, 255, 136, 0.4);
  }
  50% {
    transform: translate(-50%, -50%) scale(1.05);
    box-shadow: 0 0 40px rgba(0, 255, 136, 0.6);
  }
}

.center-topic {
  color: var(--primary-white);
}

.topic-icon {
  font-size: 2.5em;
  margin-bottom: 8px;
}

.topic-text {
  font-size: 0.9em;
  font-weight: 600;
  max-width: 140px;
  word-wrap: break-word;
  line-height: 1.2;
}

.center-minimized {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.minimized-icon {
  font-size: 1.5em;
}

.center-thinking {
  position: absolute;
  bottom: -30px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--warning-yellow);
  color: var(--primary-black);
  padding: 5px 10px;
  border-radius: 12px;
  font-size: 0.7em;
  font-weight: 500;
  white-space: nowrap;
}

.thinking-pulse {
  position: absolute;
  top: -5px;
  left: -5px;
  right: -5px;
  bottom: -5px;
  border: 2px solid var(--warning-yellow);
  border-radius: 12px;
  animation: thinkingPulse 1.5s ease-in-out infinite;
}

@keyframes thinkingPulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.3; transform: scale(1.1); }
}

/* 专家节点 */
.expert-node {
  position: absolute;
  width: 200px;
  min-height: 150px;
  background: var(--tertiary-black);
  border: 2px solid var(--accent-gray);
  border-radius: 16px;
  padding: 15px;
  cursor: pointer;
  transition: all 0.3s ease;
  z-index: 10;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

/* 树状布局的专家节点 */
.expert-node.tree-node {
  width: 180px;
  min-height: 120px;
  padding: 12px;
}

/* 第一轮对话节点 */
.expert-node.node-first-round {
  border-color: var(--success-green);
  background: linear-gradient(135deg, var(--secondary-black), var(--tertiary-black));
  box-shadow: 0 4px 12px rgba(0, 255, 136, 0.2);
}

/* 后续轮次节点 */
.expert-node.node-follow-up {
  border-color: var(--warning-yellow);
  background: linear-gradient(135deg, var(--tertiary-black), var(--secondary-black));
  box-shadow: 0 4px 12px rgba(255, 237, 78, 0.2);
  opacity: 0.9;
}

.expert-node:hover {
  transform: translateY(-5px) scale(1.02);
  box-shadow: 0 8px 25px rgba(0, 255, 136, 0.3);
}

.expert-node.node-thinking {
  border-color: var(--warning-yellow);
  background: var(--secondary-black);
  animation: nodeThinking 2s ease-in-out infinite;
}

.expert-node.node-complete {
  border-color: var(--success-green);
  background: var(--secondary-black);
}

.expert-node.node-interactive:hover {
  border-color: var(--warning-yellow);
}

@keyframes nodeThinking {
  0%, 100% { opacity: 0.8; }
  50% { opacity: 1; }
}

.node-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--accent-gray);
}

.node-avatar {
  width: 40px;
  height: 40px;
  background: var(--success-green);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5em;
  color: var(--primary-black);
}

.node-info {
  flex: 1;
}

.node-name {
  color: var(--primary-white);
  font-weight: 600;
  font-size: 0.9em;
}

.node-round {
  color: var(--accent-gray);
  font-size: 0.75em;
  margin-top: 2px;
}

/* 思考内容 */
.node-thinking-content {
  text-align: center;
}

.thinking-dots {
  display: flex;
  justify-content: center;
  gap: 4px;
  margin-bottom: 10px;
}

.thinking-dots span {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--warning-yellow);
  animation: thinkingDots 1.4s ease-in-out infinite both;
}

.thinking-dots span:nth-child(1) { animation-delay: -0.32s; }
.thinking-dots span:nth-child(2) { animation-delay: -0.16s; }

@keyframes thinkingDots {
  0%, 80%, 100% {
    transform: scale(0);
  }
  40% {
    transform: scale(1);
  }
}

.thinking-label {
  color: var(--warning-yellow);
  font-size: 0.8em;
  font-style: italic;
}

.thinking-steps {
  font-size: 0.75em;
  color: var(--accent-gray);
}

.thinking-step {
  margin-bottom: 4px;
  opacity: 0.5;
  transition: all 0.3s ease;
}

.thinking-step.active {
  color: var(--success-green);
  opacity: 1;
  font-weight: 500;
}

/* 节点内容 */
.node-content {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.content-text {
  color: var(--primary-white);
  font-size: 0.85em;
  line-height: 1.4;
  margin-bottom: 10px;
  flex: 1;
  display: -webkit-box;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.content-time {
  color: var(--accent-gray);
  font-size: 0.7em;
  margin-bottom: 8px;
}

/* 节点交互按钮 */
.node-interactions {
  display: flex;
  gap: 6px;
  justify-content: center;
  margin-top: 8px;
}

.interaction-btn {
  padding: 4px 8px;
  background: transparent;
  border: 1px solid var(--accent-gray);
  border-radius: 12px;
  color: var(--accent-gray);
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.7em;
  display: flex;
  align-items: center;
  gap: 2px;
}

.interaction-btn:hover {
  transform: scale(1.05);
}

.interaction-btn.support {
  border-color: var(--success-green);
  color: var(--success-green);
}

.interaction-btn.support:hover,
.interaction-btn.support.active {
  background: var(--success-green);
  color: var(--primary-black);
}

.interaction-btn.oppose {
  border-color: #ff6b6b;
  color: #ff6b6b;
}

.interaction-btn.oppose:hover,
.interaction-btn.oppose.active {
  background: #ff6b6b;
  color: var(--primary-white);
}

.interaction-btn.funny {
  border-color: var(--warning-yellow);
  color: var(--warning-yellow);
}

.interaction-btn.funny:hover,
.interaction-btn.funny.active {
  background: var(--warning-yellow);
  color: var(--primary-black);
}

.interaction-count {
  font-size: 0.6em;
}

.node-ai-reaction {
  background: var(--success-green);
  color: var(--primary-black);
  padding: 6px 8px;
  border-radius: 8px;
  margin-top: 6px;
  font-size: 0.7em;
  animation: slideInUp 0.5s ease;
}

/* 控制按钮 */
.discussion-controls {
  padding: 15px 20px;
  border-top: 1px solid var(--tertiary-black);
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 15px;
  background: var(--primary-black);
}

.control-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.control-btn {
  padding: 6px 12px;
  background: var(--ui-bg-secondary);
  color: var(--ui-text-primary);
  border: 1px solid var(--ui-border-dark);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.8em;
  font-weight: 600;
  white-space: nowrap;
  text-shadow: 0 1px 2px rgba(255, 255, 255, 0.3);
}

.control-btn:hover {
  background: var(--ui-bg-tertiary);
  color: var(--ui-text-primary);
  border-color: var(--ui-border-accent);
  transform: translateY(-1px);
}

.clear-btn {
  border-color: #ff6b6b;
  color: #ff6b6b;
  background: var(--ui-bg-secondary);
  font-weight: 600;
}

.clear-btn:hover {
  background: #ff6b6b;
  color: var(--primary-white);
}

.view-btn {
  border-color: var(--success-green);
  color: var(--success-green);
}

.view-btn:hover {
  background: var(--success-green);
  color: var(--primary-black);
}

.center-btn {
  border-color: #9c88ff;
  color: #9c88ff;
}

.center-btn:hover {
  background: #9c88ff;
  color: var(--primary-white);
}

.zoom-btn {
  border-color: var(--warning-yellow);
  color: var(--warning-yellow);
  padding: 6px 10px;
  font-weight: bold;
}

.zoom-btn:hover {
  background: var(--warning-yellow);
  color: var(--primary-black);
}

.zoom-controls {
  align-items: center;
  gap: 10px;
}

.zoom-indicator {
  color: var(--primary-white);
  font-size: 0.85em;
  font-weight: 500;
  min-width: 45px;
  text-align: center;
  padding: 4px 8px;
  background: var(--tertiary-black);
  border-radius: 4px;
  border: 1px solid var(--accent-gray);
}

.control-help {
  color: var(--accent-gray);
  font-size: 0.75em;
  font-style: italic;
  flex: 1;
  text-align: center;
  padding: 0 10px;
}

.tree-stats {
  color: var(--success-green);
  font-weight: 500;
  font-style: normal;
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

/* 专家详情弹窗样式 */
.expert-detail-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: overlayFadeIn 0.3s ease;
}

@keyframes overlayFadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.expert-detail-modal {
  background: var(--secondary-black);
  border: 2px solid var(--success-green);
  border-radius: 20px;
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 255, 136, 0.3);
  animation: modalSlideIn 0.4s ease;
  position: relative;
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: scale(0.9) translateY(20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

/* 弹窗头部 */
.modal-header {
  padding: 25px 30px;
  border-bottom: 1px solid var(--tertiary-black);
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: linear-gradient(135deg, var(--secondary-black), var(--tertiary-black));
}

.expert-info {
  display: flex;
  align-items: center;
  gap: 20px;
  flex: 1;
}

.expert-large-avatar {
  width: 80px;
  height: 80px;
  background: var(--success-green);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.5em;
  color: var(--primary-black);
  border: 3px solid var(--warning-yellow);
  box-shadow: 0 0 20px rgba(0, 255, 136, 0.4);
}

.expert-details {
  flex: 1;
}

.expert-name {
  color: var(--primary-white);
  font-size: 1.8em;
  font-weight: 700;
  margin: 0 0 8px 0;
}

.expert-role {
  color: var(--success-green);
  font-size: 1.1em;
  font-weight: 500;
  margin-bottom: 8px;
}

.expert-description {
  color: var(--accent-gray);
  font-size: 0.9em;
  line-height: 1.4;
}

.modal-close-btn {
  width: 40px;
  height: 40px;
  background: transparent;
  border: 2px solid var(--accent-gray);
  border-radius: 50%;
  color: var(--accent-gray);
  font-size: 1.2em;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-close-btn:hover {
  background: #ff6b6b;
  border-color: #ff6b6b;
  color: var(--primary-white);
  transform: rotate(90deg);
}

/* 弹窗内容 */
.modal-content {
  padding: 30px;
  max-height: 50vh;
  overflow-y: auto;
}

.section-title {
  color: var(--primary-white);
  font-size: 1.1em;
  font-weight: 600;
  margin-bottom: 15px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.opinion-section {
  margin-bottom: 30px;
  padding: 20px;
  background: var(--tertiary-black);
  border-radius: 12px;
  border-left: 4px solid var(--success-green);
}

.opinion-text {
  color: var(--primary-white);
  font-size: 1em;
  line-height: 1.6;
  margin-bottom: 15px;
  padding: 15px;
  background: var(--secondary-black);
  border-radius: 8px;
  border: 1px solid var(--accent-gray);
}

.opinion-time {
  color: var(--accent-gray);
  font-size: 0.85em;
  text-align: right;
  font-style: italic;
}

/* 互动按钮 */
.modal-interactions {
  margin-bottom: 30px;
}

.interaction-buttons {
  display: flex;
  gap: 15px;
  justify-content: center;
}

.modal-interaction-btn {
  padding: 12px 20px;
  background: var(--tertiary-black);
  border: 2px solid var(--accent-gray);
  border-radius: 25px;
  color: var(--accent-gray);
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  min-width: 80px;
}

.modal-interaction-btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
}

.modal-interaction-btn.support {
  border-color: var(--success-green);
  color: var(--success-green);
}

.modal-interaction-btn.support:hover,
.modal-interaction-btn.support.active {
  background: var(--success-green);
  color: var(--primary-black);
}

.modal-interaction-btn.oppose {
  border-color: #ff6b6b;
  color: #ff6b6b;
}

.modal-interaction-btn.oppose:hover,
.modal-interaction-btn.oppose.active {
  background: #ff6b6b;
  color: var(--primary-white);
}

.modal-interaction-btn.funny {
  border-color: var(--warning-yellow);
  color: var(--warning-yellow);
}

.modal-interaction-btn.funny:hover,
.modal-interaction-btn.funny.active {
  background: var(--warning-yellow);
  color: var(--primary-black);
}

.btn-icon {
  font-size: 1.5em;
}

.btn-text {
  font-size: 0.85em;
  font-weight: 500;
}

.btn-count {
  font-size: 0.8em;
  font-weight: bold;
}

/* AI反应 */
.modal-ai-reaction {
  margin-bottom: 30px;
  padding: 20px;
  background: linear-gradient(135deg, var(--success-green), var(--warning-yellow));
  border-radius: 12px;
  color: var(--primary-black);
}

.ai-reaction-content {
  font-size: 1em;
  line-height: 1.5;
  font-style: italic;
}

/* 专家背景 */
.expert-more-info {
  margin-bottom: 20px;
  padding: 20px;
  background: var(--tertiary-black);
  border-radius: 12px;
  border: 1px solid var(--accent-gray);
}

.expert-background {
  color: var(--primary-white);
  font-size: 0.95em;
  line-height: 1.6;
}

/* 弹窗底部 */
.modal-footer {
  padding: 20px 30px;
  border-top: 1px solid var(--tertiary-black);
  display: flex;
  gap: 15px;
  justify-content: space-between;
  align-items: center;
  background: var(--primary-black);
}

.modal-action-btn {
  padding: 10px 20px;
  background: var(--success-green);
  color: var(--primary-black);
  border: none;
  border-radius: 8px;
  font-size: 0.9em;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.modal-action-btn:hover {
  background: var(--warning-yellow);
  transform: translateY(-2px);
}

.modal-close-btn-secondary {
  padding: 10px 20px;
  background: transparent;
  color: var(--accent-gray);
  border: 1px solid var(--accent-gray);
  border-radius: 8px;
  font-size: 0.9em;
  cursor: pointer;
  transition: all 0.3s ease;
}

.modal-close-btn-secondary:hover {
  background: var(--accent-gray);
  color: var(--primary-white);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .discussion-area {
    min-height: 500px;
  }
  
  .mindmap-center {
    width: 100px;
    height: 100px;
  }
  
  .mindmap-center.tree-layout {
    top: 80px;
  }
  
  .mindmap-center.minimized {
    width: 50px;
    height: 50px;
  }
  
  .topic-icon {
    font-size: 2em;
  }
  
  .topic-text {
    font-size: 0.8em;
  }
  
  .expert-node {
    width: 160px;
    min-height: 120px;
    padding: 12px;
  }
  
  .expert-node.tree-node {
    width: 140px;
    min-height: 100px;
    padding: 10px;
  }
  
  .node-avatar {
    width: 30px;
    height: 30px;
    font-size: 1.2em;
  }
  
  .content-text {
    font-size: 0.8em;
    -webkit-line-clamp: 3;
  }
  
  .interaction-btn {
    padding: 3px 6px;
    font-size: 0.65em;
  }
  
  /* 移动端控制面板 */
  .discussion-controls {
    padding: 10px 15px;
    flex-direction: column;
    gap: 10px;
  }
  
  .control-group {
    justify-content: center;
    flex-wrap: wrap;
  }
  
  .control-help {
    order: -1;
    margin-bottom: 5px;
    font-size: 0.7em;
  }
  
  .control-btn {
    padding: 5px 10px;
    font-size: 0.75em;
  }
  
  .zoom-indicator {
    font-size: 0.8em;
    min-width: 40px;
  }
  
  /* 移动端弹窗适配 */
  .expert-detail-modal {
    width: 95%;
    max-height: 90vh;
    margin: 20px;
  }
  
  .modal-header {
    padding: 20px;
  }
  
  .expert-info {
    gap: 15px;
  }
  
  .expert-large-avatar {
    width: 60px;
    height: 60px;
    font-size: 2em;
  }
  
  .expert-name {
    font-size: 1.4em;
  }
  
  .expert-role {
    font-size: 1em;
  }
  
  .expert-description {
    font-size: 0.85em;
  }
  
  .modal-content {
    padding: 20px;
  }
  
  .interaction-buttons {
    flex-direction: column;
    gap: 10px;
    align-items: center;
  }
  
  .modal-interaction-btn {
    width: 200px;
    flex-direction: row;
    gap: 10px;
    justify-content: center;
  }
  
  .modal-footer {
    padding: 15px 20px;
    flex-direction: column;
    gap: 10px;
  }
  
  .modal-action-btn {
    width: 100%;
    padding: 12px;
  }
}
</style> 