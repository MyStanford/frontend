<template>
  <!-- 这个组件主要提供钱包连接的逻辑，UI在AppHeader中 -->
  <div></div>
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue'
import { useStore } from 'vuex'

const store = useStore()

// 等待以太坊对象注入
const waitForEthereum = () => {
  return new Promise((resolve) => {
    if (window.ethereum) {
      resolve(window.ethereum)
    } else {
      let attempts = 0
      const maxAttempts = 50 // 最多等待5秒
      
      const checkInterval = setInterval(() => {
        attempts++
        
        if (window.ethereum) {
          clearInterval(checkInterval)
          resolve(window.ethereum)
        } else if (attempts >= maxAttempts) {
          clearInterval(checkInterval)
          resolve(null)
        }
      }, 100)
    }
  })
}

// 检查钱包连接状态
const checkWalletConnection = async () => {
  const ethereum = await waitForEthereum()
  
  if (!ethereum) return
  
  try {
    // 检查是否有已连接的账户
    const accounts = await ethereum.request({
      method: 'eth_accounts'
    })
    
    if (accounts && accounts.length > 0) {
      store.commit('SET_CURRENT_ACCOUNT', accounts[0])
      store.commit('SET_WALLET_CONNECTED', true)
      
      // 添加事件监听（避免重复添加）
      if (!ethereum._listeners) {
        ethereum.on('accountsChanged', handleAccountsChanged)
        ethereum.on('chainChanged', handleChainChanged)
        ethereum._listeners = true
      }
    }
  } catch (error) {
    console.error('检查钱包连接失败:', error)
  }
}

// 处理账户变化
const handleAccountsChanged = (accounts) => {
  if (accounts.length === 0) {
    // 钱包已断开
    store.commit('SET_WALLET_CONNECTED', false)
    store.commit('SET_CURRENT_ACCOUNT', null)
  } else if (accounts[0] !== store.state.currentAccount) {
    // 账户已切换
    store.commit('SET_CURRENT_ACCOUNT', accounts[0])
  }
}

// 处理链变化
const handleChainChanged = (chainId) => {
  console.log('链已切换:', chainId)
  // 页面刷新以确保状态同步
  setTimeout(() => {
    window.location.reload()
  }, 2000)
}

// 初始化钱包检测
const initializeWallet = async () => {
  // 等待ethereum对象
  const ethereum = await waitForEthereum()
  
  if (ethereum) {
    // 检查连接状态
    await checkWalletConnection()
  } else {
    console.log('未检测到Web3钱包')
  }
}

// 清理事件监听器
const cleanupListeners = () => {
  if (window.ethereum && window.ethereum._listeners) {
    try {
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged)
      window.ethereum.removeListener('chainChanged', handleChainChanged)
      window.ethereum._listeners = false
    } catch (error) {
      console.log('清理监听器时出错:', error)
    }
  }
}

onMounted(() => {
  // 立即尝试检测钱包
  initializeWallet()
  
  // 监听ethereum对象的注入（某些钱包延迟注入）
  if (typeof window.ethereum === 'undefined') {
    window.addEventListener('ethereum#initialized', initializeWallet, {
      once: true,
    })
    
    // 备用检测
    setTimeout(initializeWallet, 3000)
  }
})

onUnmounted(() => {
  cleanupListeners()
})
</script>

<style scoped>
/* 这个组件没有UI，所以不需要样式 */
</style> 