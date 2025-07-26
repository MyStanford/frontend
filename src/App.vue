<script setup>
import { onMounted, ref } from 'vue'
import { useStore } from 'vuex'
import AppHeader from './components/layout/AppHeader.vue'
import WalletConnect from './components/wallet/WalletConnect.vue'
import ApiConfig from './components/api/ApiConfig.vue'
import ErrorBoundary from './components/common/ErrorBoundary.vue'
import { initializeApp } from './utils/appInitializer'

const store = useStore()

// 全局错误处理
const globalError = ref(null)
const showGlobalError = ref(false)

const handleGlobalError = (error) => {
  globalError.value = error
  showGlobalError.value = true
}

const dismissGlobalError = () => {
  showGlobalError.value = false
  globalError.value = null
}

const retryGlobalAction = async () => {
  try {
    // 重试API连接
    await store.dispatch('testApiConnection')
    dismissGlobalError()
  } catch (error) {
    console.error('重试失败:', error)
  }
}

onMounted(async () => {
  // 初始化应用
  console.log('🎓 MyStanford 应用已启动')
  
  // 使用新的初始化工具
  try {
    const initResult = await initializeApp(store, (progress, step) => {
      console.log(`初始化进度: ${progress.percentage}% - ${step.name}`)
    })
    
    if (initResult.success) {
      console.log(`✅ 应用初始化成功: ${initResult.successful}/${initResult.total} 步骤完成`)
    } else {
      console.warn('⚠️ 应用初始化部分失败，但仍可继续使用')
    }
  } catch (error) {
    console.error('❌ 应用初始化失败:', error.message)
    handleGlobalError(error)
  }
  
  // 检查钱包连接
  if (typeof window.ethereum !== 'undefined') {
    window.ethereum.request({ method: 'eth_accounts' })
      .then(accounts => {
        if (accounts.length > 0) {
          store.commit('SET_WALLET_CONNECTED', true)
          store.commit('SET_CURRENT_ACCOUNT', accounts[0])
          console.log('💰 钱包自动连接成功')
        }
      })
      .catch(console.error)
  }
  
  // 设置全局错误处理
  window.addEventListener('unhandledrejection', (event) => {
    if (event.reason?.message?.includes('API') || event.reason?.message?.includes('fetch')) {
      handleGlobalError(event.reason)
      event.preventDefault()
    }
  })
})
</script>

<template>
  <div id="app" class="app-container">
    <!-- 应用头部 -->
    <AppHeader />
    
    <!-- 主要内容区域 -->
    <main class="main-content">
      <router-view />
    </main>
    
    <!-- 钱包连接组件 -->
    <WalletConnect />
    
    <!-- API配置面板 -->
    <ApiConfig />
    
    <!-- 全局错误处理 -->
    <ErrorBoundary 
      :error="globalError"
      :show="showGlobalError"
      :retryAction="retryGlobalAction"
      @dismiss="dismissGlobalError"
      @retry="retryGlobalAction"
    />
  </div>
</template>

<style>
@import '@/styles/global.css';
</style>
