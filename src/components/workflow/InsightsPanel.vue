<template>
  <div class="insights-panel">
    <div class="insights-header">
      <h4>💡 result</h4>
      <div class="insights-controls">
        <div class="insights-count">{{ insightsCount }}</div>
        <div v-if="creativeInsights.length > 0" class="export-buttons">
          <button class="export-btn" @click="exportMarkdown">
            📝 MD
          </button>
          <button class="export-btn export-pdf" @click="exportPDF">
            📄 PDF
          </button>
        </div>
      </div>
    </div>
    
    <div class="insights-content">
      <!-- 默认状态 -->
      <div v-if="creativeInsights.length === 0" class="loading">
        完成讨论后，AI将自动生成创意洞察
      </div>
      
      <!-- 洞察列表 -->
      <div v-else>
        <div 
          v-for="(insight, index) in recentInsights" 
          :key="insight.id"
          class="insight-item"
        >
          <div class="insight-title">{{ insight.title }}</div>
          <div class="insight-content">{{ truncateContent(insight.content) }}</div>
          <div class="insight-meta">
            <span class="insight-category">{{ insight.category || '讨论结果' }}</span>
            <span v-if="insight.priority" class="insight-priority" :class="getPriorityClass(insight.priority)">
              {{ insight.priority }}
            </span>
          </div>
        </div>
        
        <!-- 更多结果提示 -->
        <div v-if="creativeInsights.length > 5" class="more-results">
          还有 {{ creativeInsights.length - 5 }} 个结果，完整内容请导出查看
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useStore } from 'vuex'

const store = useStore()

// 计算属性
const creativeInsights = computed(() => store.state.creativeInsights)
const recentInsights = computed(() => store.getters.recentInsights)
const discussionHistory = computed(() => store.state.discussionHistory)
const selectedTalents = computed(() => store.state.selectedTalents)
const discussionTopic = computed(() => store.state.discussionTopic)

const insightsCount = computed(() => {
  const count = creativeInsights.value.length
  return count > 0 ? `${count} 个结果` : '0 个结果'
})

// 方法
const truncateContent = (content) => {
  if (!content) return ''
  return content.length > 80 ? content.substring(0, 80) + '...' : content
}

const getPriorityClass = (priority) => {
  switch (priority) {
    case '高': return 'priority-high'
    case '中': return 'priority-medium'
    case '低': return 'priority-low'
    default: return 'priority-medium'
  }
}

const exportMarkdown = () => {
  try {
    const markdownContent = generateMarkdownContent()
    downloadFile(markdownContent, 'mystanford_讨论结果.md', 'text/markdown')
    showNotification('success', '✅ MD讨论结果已导出！')
  } catch (error) {
    console.error('导出Markdown失败:', error)
    showNotification('error', '❌ 导出失败，请重试')
  }
}

const exportPDF = async () => {
  try {
    showNotification('info', '📄 PDF报告正在生成中，请稍候...')
    
    // 动态导入jsPDF和html2canvas
    const { jsPDF } = await import('jspdf')
    const html2canvas = (await import('html2canvas')).default
    
    const htmlContent = generateHTMLContent()
    
    // 创建临时容器
    const tempContainer = document.createElement('div')
    tempContainer.innerHTML = htmlContent
    tempContainer.style.position = 'absolute'
    tempContainer.style.left = '-9999px'
    tempContainer.style.top = '0'
    tempContainer.style.width = '800px'
    tempContainer.style.background = 'white'
    tempContainer.style.padding = '20px'
    tempContainer.style.fontFamily = 'Arial, sans-serif'
    tempContainer.style.fontSize = '14px'
    tempContainer.style.lineHeight = '1.6'
    document.body.appendChild(tempContainer)
    
    // 等待内容渲染
    setTimeout(async () => {
      try {
        const canvas = await html2canvas(tempContainer, {
          scale: 1.5,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          logging: false,
          width: 800,
          height: tempContainer.scrollHeight
        })
        
        // 移除临时容器
        document.body.removeChild(tempContainer)
        
        // 生成PDF
        const doc = new jsPDF('p', 'mm', 'a4')
        const imgData = canvas.toDataURL('image/jpeg', 0.8)
        
        const imgWidth = 210 // A4宽度
        const pageHeight = 295 // A4高度
        const imgHeight = (canvas.height * imgWidth) / canvas.width
        let heightLeft = imgHeight
        let position = 0
        
        // 添加第一页
        doc.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight)
        heightLeft -= pageHeight
        
        // 如果内容超过一页，添加更多页面
        while (heightLeft >= 0) {
          position = heightLeft - imgHeight
          doc.addPage()
          doc.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight)
          heightLeft -= pageHeight
        }
        
        const filename = `mystanford_专家讨论报告_${new Date().toISOString().slice(0, 10)}.pdf`
        doc.save(filename)
        
        showNotification('success', '✅ PDF报告已生成并下载！')
      } catch (error) {
        console.error('PDF生成失败:', error)
        // 移除临时容器
        if (tempContainer.parentNode) {
          document.body.removeChild(tempContainer)
        }
        showNotification('error', '❌ PDF生成失败，请重试')
      }
    }, 100)
    
  } catch (error) {
    console.error('PDF导出失败:', error)
    showNotification('error', '❌ PDF导出失败，请重试')
  }
}

const generateMarkdownContent = () => {
  const currentDate = new Date().toLocaleDateString('zh-CN')
  const currentTime = new Date().toLocaleTimeString('zh-CN')
  
  let markdown = `# MyStanford - 专家讨论结果

**生成时间：** ${currentDate} ${currentTime}  
**讨论主题：** ${discussionTopic.value || '未指定'}  
**参与专家：** ${selectedTalents.value.map(t => t.name).join('、')}

---

## 📋 讨论概览

本次讨论共有 **${discussionHistory.value.length}** 条专家观点，生成了 **${creativeInsights.value.length}** 个核心洞察。

---

## 💬 专家讨论记录

`

  // 添加专家讨论记录
  discussionHistory.value.forEach((item, index) => {
    const timestamp = item.timestamp ? new Date(item.timestamp).toLocaleTimeString('zh-CN') : ''
    markdown += `### ${index + 1}. ${item.expert} (${item.role})

**时间：** ${timestamp}  
**观点：** ${item.content}

---
`
  })

  markdown += `## 💡 核心洞察

`

  // 添加核心洞察
  creativeInsights.value.forEach((insight, index) => {
    const timestamp = insight.timestamp ? new Date(insight.timestamp).toLocaleDateString('zh-CN') : ''
    const priorityText = insight.priority ? `**优先级：** ${insight.priority}  ` : ''
    markdown += `### ${index + 1}. ${insight.title}

**分类：** ${insight.category || '讨论结果'}  
${priorityText}**生成时间：** ${timestamp}  
**洞察内容：** ${insight.content}

`
  })

  markdown += `---

## 📊 讨论统计

- **参与专家数量：** ${selectedTalents.value.length} 位
- **讨论观点数量：** ${discussionHistory.value.length} 条
- **核心洞察数量：** ${creativeInsights.value.length} 个
- **讨论主题：** ${discussionTopic.value || '未指定'}

---

## 🎯 专家团队

`

  // 添加专家团队信息
  selectedTalents.value.forEach(expert => {
    markdown += `### ${expert.name} (${expert.role})

- **专业领域：** ${expert.specialty}
- **个性特征：** ${expert.personality}
- **描述：** ${expert.description}

`
  })

  markdown += `---

*本报告由MyStanford AI智能分析系统自动生成，包含专家讨论的真实结果和核心洞察。*

*© 2025 mystanford*`

  return markdown
}

const generateHTMLContent = () => {
  const currentDate = new Date()
  const topic = discussionTopic.value || '专家讨论'
  
  return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <title>mystanford 专家讨论专业报告</title>
    <style>
        body {
            font-family: 'Microsoft YaHei', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background: white;
        }
        .header {
            text-align: center;
            border-bottom: 2px solid #007bff;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .header h1 {
            color: #007bff;
            font-size: 28px;
            margin: 10px 0;
        }
        .section-title {
            background: #007bff;
            color: white;
            padding: 10px 15px;
            font-size: 18px;
            font-weight: bold;
            margin: 20px 0 15px 0;
        }
        .insight-item {
            background: #f8f9fa;
            margin: 15px 0;
            padding: 15px;
            border-radius: 8px;
            border-left: 4px solid #007bff;
        }
        .discussion-item {
            background: white;
            margin: 10px 0;
            padding: 15px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .expert-name {
            font-weight: bold;
            color: #007bff;
            margin-bottom: 8px;
        }
        .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            color: #666;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🎓 mystanford</h1>
        <div>专家讨论专业分析报告</div>
        <div style="margin: 20px 0; font-size: 18px; font-weight: bold;">讨论主题：${topic}</div>
        <div>生成时间：${currentDate.toLocaleString('zh-CN')}</div>
    </div>

    <div class="section-title">📋 讨论概览</div>
    <div>
        <strong>参与专家：</strong>${selectedTalents.value.length} 位<br>
        <strong>讨论轮次：</strong>${discussionHistory.value.length} 条<br>
        <strong>生成洞见：</strong>${creativeInsights.value.length} 个
    </div>

    <div class="section-title">👥 专家团队</div>
    ${selectedTalents.value.map((expert, index) => `
        <div class="insight-item">
            <h4>${index + 1}. ${expert.name} - ${expert.role}</h4>
            <p>${expert.specialty || '专业领域专家，为讨论提供独特视角和专业洞见。'}</p>
        </div>
    `).join('')}

    <div class="section-title">💬 讨论记录</div>
    ${discussionHistory.value.map((entry, index) => `
        <div class="discussion-item">
            <div class="expert-name">${index + 1}. ${entry.expert}</div>
            <div>${entry.content}</div>
        </div>
    `).join('')}

    <div class="section-title">💡 创意洞见</div>
    ${creativeInsights.value.slice(0, 10).map((insight, index) => `
        <div class="insight-item">
            <h4>${index + 1}. ${insight.title}</h4>
            <p>${insight.content}</p>
            <div style="margin-top: 10px; font-size: 0.9em; color: #666;">
                分类：${insight.category || '讨论结果'} | 
                优先级：${insight.priority || '中'} |
                生成时间：${insight.timestamp ? new Date(insight.timestamp).toLocaleString() : ''}
            </div>
        </div>
    `).join('')}

    <div class="footer">
        <p>本报告由 mystanford AI专家系统生成</p>
        <p>© ${currentDate.getFullYear()} mystanford. All rights reserved.</p>
    </div>
</body>
</html>`
}

const downloadFile = (content, filename, mimeType) => {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8` })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.style.display = 'none'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

const showNotification = (type, message) => {
  // 创建通知元素
  const notification = document.createElement('div')
  notification.className = `notification ${type}`
  notification.innerHTML = `
    <div>
      <span>${message}</span>
      <button onclick="this.parentElement.parentElement.remove()" style="margin-left: 10px; background: none; border: none; color: inherit; cursor: pointer;">×</button>
    </div>
  `
  
  document.body.appendChild(notification)
  
  // 自动移除成功通知
  if (type === 'success') {
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove()
      }
    }, 3000)
  }
}
</script>

<style scoped>
.insights-panel {
  background: var(--card-bg);
  border-radius: 16px;
  border: 4px solid var(--card-border);
  height: 600px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.3);
  font-family: serif;
  position: relative;
}

.insights-header {
  background: var(--card-header);
  padding: 16px 20px;
  border-bottom: 3px solid var(--card-border);
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-radius: 12px 12px 0 0;
}

.insights-header h4 {
  color: #1f2937;
  font-weight: 700;
  font-size: 1.2em;
  margin: 0;
}

.insights-controls {
  display: flex;
  align-items: center;
  gap: 15px;
}

.insights-count {
  color: var(--accent-gray);
  font-size: 0.9em;
}

.export-buttons {
  display: flex;
  gap: 8px;
}

.export-btn {
  padding: 6px 12px;
  background: var(--success-green);
  color: var(--primary-black);
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.8em;
  font-weight: 500;
}

.export-btn:hover {
  background: var(--warning-yellow);
  transform: translateY(-1px);
}

.export-btn.export-pdf {
  background: #dc3545;
  color: white;
}

.export-btn.export-pdf:hover {
  background: #c82333;
}

.insights-content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  background: linear-gradient(45deg, #f8fafc, #e2e8f0);
  border-radius: 0 0 12px 12px;
}

.insight-item {
  background: white;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 12px;
  border: 2px solid var(--card-border);
  border-left: 6px solid var(--card-orange);
  transition: all 0.3s ease;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.insight-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
  background: #fefefe;
}

.insight-title {
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 8px;
  font-size: 1em;
}

.insight-content {
  color: #4b5563;
  font-size: 0.9em;
  line-height: 1.4;
  margin-bottom: 8px;
}

.insight-meta {
  font-size: 0.8em;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.insight-category {
  color: var(--success-green);
  font-weight: 500;
  background: rgba(0, 255, 136, 0.1);
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 0.75em;
}

.insight-priority {
  padding: 2px 6px;
  border-radius: 8px;
  font-size: 0.7em;
  font-weight: 500;
}

.priority-high {
  background: rgba(255, 107, 107, 0.2);
  color: #ff6b6b;
}

.priority-medium {
  background: rgba(255, 237, 78, 0.2);
  color: var(--warning-yellow);
}

.priority-low {
  background: rgba(102, 102, 102, 0.2);
  color: var(--accent-gray);
}

.more-results {
  text-align: center;
  padding: 15px;
  color: var(--accent-gray);
  font-size: 0.9em;
  border-top: 1px solid var(--tertiary-black);
  margin-top: 15px;
  font-style: italic;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .insights-panel {
    height: 500px;
  }
  
  .insights-header {
    padding: 15px;
    flex-direction: column;
    gap: 10px;
    align-items: flex-start;
  }
  
  .insights-controls {
    width: 100%;
    justify-content: space-between;
  }
  
  .insights-content {
    padding: 15px;
  }
  
  .insight-item {
    padding: 12px;
  }
  
  .export-btn {
    padding: 5px 10px;
    font-size: 0.75em;
  }
}
</style> 