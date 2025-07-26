<template>
  <header class="header">
    <div class="header-content">
      <div class="logo">MyStanford</div>
      
      <div class="header-right">
        <!-- 地球图标 - 链接到首页 -->
        <router-link to="/" class="icon-item icon-link" title="首页">
          🌍
        </router-link>
        
        <!-- 金币图标 - 链接到定价 -->
        <router-link to="/pricing" class="icon-item icon-link" title="定价">
          💰
        </router-link>
        
        <!-- 钱包连接按钮 -->
        <button 
          class="wallet-link-btn"
          @click="handleWalletClick"
          :disabled="isConnecting"
        >
          Link to my wallet
        </button>
        
        <!-- 开始按钮 -->
        <button class="start-btn" @click="startWorkflow">
          Start
        </button>
      </div>
    </div>
  </header>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'

const store = useStore()
const router = useRouter()
const isConnecting = ref(false)

// 计算属性
const walletConnected = computed(() => store.state.walletConnected)
const currentAccount = computed(() => store.state.currentAccount)

const walletIcon = computed(() => {
  if (isConnecting.value) return '🔄'
  return walletConnected.value ? '✅' : '🔗'
})

const walletText = computed(() => {
  if (isConnecting.value) return '连接中...'
  if (walletConnected.value && currentAccount.value) {
    return formatAddress(currentAccount.value)
  }
  return '连接钱包'
})

// 方法
const formatAddress = (address) => {
  if (!address) return ''
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

const handleWalletClick = async () => {
  if (walletConnected.value) {
    disconnectWallet()
    return
  }

  if (typeof window.ethereum === 'undefined') {
    showNotification('error', `未检测到Web3钱包

请安装 MetaMask 扩展程序：
1. 访问 chrome.google.com/webstore
2. 搜索 "MetaMask" 并安装
3. 刷新页面并重试

支持钱包：MetaMask, Trust Wallet, Coinbase Wallet`)
    return
  }

  isConnecting.value = true

  try {
    const accounts = await window.ethereum.request({
      method: 'eth_requestAccounts'
    })
    
    if (accounts && accounts.length > 0) {
      store.commit('SET_WALLET_CONNECTED', true)
      store.commit('SET_CURRENT_ACCOUNT', accounts[0])
      
      // 监听账户和网络变化
      window.ethereum.on('accountsChanged', handleAccountsChanged)
      window.ethereum.on('chainChanged', handleChainChanged)
      
      showNotification('success', '✅ 钱包连接成功！')
    } else {
      throw new Error('NO_ACCOUNTS')
    }
    
  } catch (error) {
    console.error('钱包连接错误:', error)
    
    let errorMessage = ''
    
    if (error.code === 4001) {
      errorMessage = '用户拒绝了连接请求'
    } else if (error.code === -32002) {
      errorMessage = '已有连接请求待处理，请检查钱包'
    } else if (error.message === 'NO_ACCOUNTS') {
      errorMessage = '无法获取钱包账户，请确保钱包已解锁并有可用账户'
    } else {
      errorMessage = `连接失败: ${error.message || '未知错误'}`
    }
    
    showNotification('error', errorMessage)
    
  } finally {
    isConnecting.value = false
  }
}

const disconnectWallet = () => {
  store.commit('SET_WALLET_CONNECTED', false)
  store.commit('SET_CURRENT_ACCOUNT', null)
  
  // 移除事件监听
  if (window.ethereum) {
    try {
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged)
      window.ethereum.removeListener('chainChanged', handleChainChanged)
    } catch (error) {
      console.log('移除监听器时出错:', error)
    }
  }
  
  showNotification('success', '钱包已断开连接')
}

const handleAccountsChanged = (accounts) => {
  if (accounts.length === 0) {
    showNotification('error', '钱包账户已断开')
    disconnectWallet()
  } else if (accounts[0] !== currentAccount.value) {
    store.commit('SET_CURRENT_ACCOUNT', accounts[0])
    showNotification('success', `账户已切换到: ${formatAddress(accounts[0])}`)
  }
}

const handleChainChanged = (chainId) => {
  const chainNames = {
    '0x1': 'Ethereum 主网',
    '0x38': 'BSC 主网', 
    '0x89': 'Polygon 主网',
    '0xa86a': 'Avalanche 主网',
    '0xaa36a7': 'Sepolia 测试网',
    '0x5': 'Goerli 测试网'
  }
  
  const chainName = chainNames[chainId] || `网络 ${chainId}`
  showNotification('success', `已切换到: ${chainName}`)
  
  // 页面刷新以确保状态同步
  setTimeout(() => {
    window.location.reload()
  }, 2000)
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

const startWorkflow = () => {
  router.push('/workflow')
}
</script>

<style scoped>
.header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  background: linear-gradient(135deg, rgba(196, 181, 253, 0.95), rgba(221, 214, 254, 0.95));
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(161, 130, 253, 0.3);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 40px;
}

.logo {
  font-size: 1.8em;
  font-weight: 700;
  color: #2d2d2d;
  letter-spacing: -0.5px;
}

.header-right {
  display: flex;
  gap: 20px;
  align-items: center;
}

.icon-item {
  font-size: 1.5em;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
}

.icon-link {
  text-decoration: none;
  border-radius: 50%;
  transition: all 0.3s ease;
  background: rgba(255, 255, 255, 0.1);
}

.icon-link:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-2px) scale(1.1);
}

.icon-link.router-link-active {
  background: rgba(255, 255, 255, 0.3);
  box-shadow: 0 0 10px rgba(255, 255, 255, 0.3);
}

.wallet-link-btn {
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.9);
  color: #2d2d2d;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.9em;
  white-space: nowrap;
}

.wallet-link-btn:hover {
  background: rgba(255, 255, 255, 1);
  transform: translateY(-1px);
}

.start-btn {
  padding: 8px 20px;
  background: rgba(255, 255, 255, 0.9);
  color: #2d2d2d;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.9em;
}

.start-btn:hover {
  background: rgba(255, 255, 255, 1);
  transform: translateY(-1px);
}

.wallet-link-btn:disabled,
.start-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  pointer-events: none;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .header-content {
    padding: 10px 20px;
  }

  .logo {
    font-size: 1.4em;
  }

  .header-right {
    gap: 15px;
  }

  .icon-item {
    font-size: 1.2em;
    width: 32px;
    height: 32px;
  }

  .icon-link:hover {
    transform: translateY(-1px) scale(1.05);
  }

  .wallet-link-btn {
    padding: 6px 12px;
    font-size: 0.8em;
  }

  .start-btn {
    padding: 6px 16px;
    font-size: 0.8em;
  }
}
</style> 