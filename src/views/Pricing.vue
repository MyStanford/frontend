<template>
  <div class="pricing-page">
    <div class="container">
      <section class="pricing-section">
        <div class="pricing-grid">
          <div class="pricing-card">
            <div class="card-header">
              <h3>基础版</h3>
              <p class="plan-description">个人用户</p>
            </div>
            
            <div class="price-section">
              <div class="price">¥99</div>
              <div class="price-period">每月</div>
            </div>
            
            <ul class="pricing-features">
              <li>5位AI专家</li>
              <li>10次讨论/月</li>
              <li>基础存储</li>
              <li>邮件支持</li>
            </ul>
            
            <button class="select-plan-btn" @click="selectPlan('explorer')">
              选择基础版
            </button>
          </div>

          <div class="pricing-card featured">
            <div class="featured-badge">推荐</div>
            <div class="card-header">
              <h3>专业版</h3>
              <p class="plan-description">团队用户</p>
            </div>
            
            <div class="price-section">
              <div class="price">¥299</div>
              <div class="price-period">每月</div>
            </div>
            
            <ul class="pricing-features">
              <li>20位顶级AI专家</li>
              <li>无限讨论</li>
              <li>长期存储</li>
              <li>优先支持</li>
              <li>多模型切换</li>
            </ul>
            
            <button class="select-plan-btn" @click="selectPlan('innovator')">
              选择专业版
            </button>
          </div>

          <div class="pricing-card">
            <div class="card-header">
              <h3>企业版</h3>
              <p class="plan-description">大型企业</p>
            </div>
            
            <div class="price-section">
              <div class="price">¥999</div>
              <div class="price-period">每月</div>
            </div>
            
            <ul class="pricing-features">
              <li>无限AI专家</li>
              <li>定制模型</li>
              <li>企业安全</li>
              <li>API集成</li>
              <li>专属经理</li>
              <li>24小时支持</li>
            </ul>
            
            <button class="select-plan-btn" @click="selectPlan('enterprise')">
              联系销售
            </button>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
const selectPlan = (plan) => {
  const planNames = {
    'explorer': '基础版',
    'innovator': '专业版', 
    'enterprise': '企业版'
  }
  
  const planPrices = {
    'explorer': '¥99/月',
    'innovator': '¥299/月',
    'enterprise': '¥999/月'
  }
  
  // 支付链接
  const paymentUrl = 'https://web-1306902317.cos.ap-beijing.myqcloud.com/WechatIMG13.jpg?q-sign-algorithm=sha1&q-ak=AKIDrxUhAnFVEgakQIdbDo2pkidfJCYj3l3bu6LrIKSD97xFKrfcMPSXDtTBQFZBF0Be&q-sign-time=1753341446;1753345046&q-key-time=1753341446;1753345046&q-header-list=host&q-url-param-list=ci-process&q-signature=166569d62825c60803420d0101c274a27c3b298b&x-cos-security-token=9OiIUXsRhWz4uEpvlrFG7ZnpQQDm55Jaaf4668ff13e38fd1d3c0940bd8ae3eafiGb8yF0iLGL6dNQF65CWXKpqHI8jPMFobyiicCSuRP5WfWLfFQ2ycMAEX8Dkld7fLPpwetH09BNjXp5t0Q229uDibuaj8ry_SQkhMNcfNkOxOGnNrQy2tov4hG9wQ5Si9QEs5QOCBSpx-33Mp4Tw8wF3eeBi0KNOllhQJatYAEl9bOaDzi9b6jqGenMFbifJPytnZfmVEueFb8VZsNBmSLN-x9BUBTnAjOxwZjbkcJVr4W6hdO5qBMj1ADBAza1nfqKh_Dr81E_kfs0tdz07LA&ci-process=originImage'
  
  const confirmed = confirm(`确认选择 ${planNames[plan]} ${planPrices[plan]}？

点击"确定"联系管理员完成支付`)
      
  if (confirmed) {
    window.open(paymentUrl, '_blank')
  }
}
</script>

<style scoped>
.pricing-page {
  padding: 60px 0;
}

.pricing-section {
  max-width: 900px;
  margin: 0 auto;
  padding: 20px;
  min-height: calc(100vh - 120px);
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.pricing-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  max-width: 100%;
}

.pricing-card {
  background: var(--secondary-black);
  border: 2px solid var(--tertiary-black);
  border-radius: 10px;
  padding: 20px;
  text-align: center;
  transition: all 0.3s ease;
  position: relative;
  display: flex;
  flex-direction: column;
}

.pricing-card:hover {
  border-color: var(--accent-gray);
  transform: translateY(-3px);
}

.pricing-card.featured {
  border-color: var(--success-green);
}

.featured-badge {
  position: absolute;
  top: -10px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--success-green);
  color: var(--primary-black);
  padding: 4px 16px;
  border-radius: 15px;
  font-size: 0.8em;
  font-weight: 600;
}

.card-header {
  margin-bottom: 15px;
}

.pricing-card h3 {
  font-size: 1.3em;
  font-weight: 500;
  margin-bottom: 5px;
  color: var(--primary-white);
}

.plan-description {
  color: var(--accent-gray);
  font-size: 0.85em;
}

.price-section {
  margin-bottom: 20px;
}

.pricing-card .price {
  color: var(--success-green);
  font-size: 2em;
  font-weight: 300;
  margin-bottom: 3px;
}

.pricing-card .price-period {
  color: var(--accent-gray);
  font-size: 0.85em;
}

.pricing-features {
  list-style: none;
  margin-bottom: 20px;
  text-align: left;
  flex: 1;
}

.pricing-features li {
  padding: 5px 0;
  color: var(--primary-white);
  font-size: 0.85em;
  line-height: 1.3;
}

.pricing-features li::before {
  content: '✓';
  color: var(--success-green);
  font-weight: bold;
  margin-right: 8px;
}

.select-plan-btn {
  width: 100%;
  padding: 12px;
  background: transparent;
  color: var(--primary-white);
  border: 2px solid var(--accent-gray);
  border-radius: 6px;
  font-size: 0.9em;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: auto;
}

.select-plan-btn:hover {
  background: var(--primary-white);
  color: var(--primary-black);
  border-color: var(--primary-white);
}

.pricing-card.featured .select-plan-btn {
  background: var(--success-green);
  color: var(--primary-black);
  border-color: var(--success-green);
}

.pricing-card.featured .select-plan-btn:hover {
  background: var(--warning-yellow);
  border-color: var(--warning-yellow);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .pricing-grid {
    grid-template-columns: 1fr;
    gap: 15px;
  }
  
  .pricing-section {
    padding: 15px;
    min-height: auto;
  }
  
  .pricing-card {
    padding: 15px;
  }
  
  .pricing-card .price {
    font-size: 1.8em;
  }
}

@media (max-width: 1024px) and (min-width: 769px) {
  .pricing-grid {
    gap: 15px;
  }
  
  .pricing-card {
    padding: 18px;
  }
}
</style> 