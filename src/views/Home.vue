<template>
  <div class="home-page">
    <div class="container">
      <div class="content-wrapper">
        <section class="hero">
          <span class="arrow-icon" @click="startWorkflow">^</span>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const startWorkflow = () => {
  router.push('/workflow')
}
</script>

<style scoped>
.home-page {
  min-height: calc(100vh - 80px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
}

.content-wrapper {
  padding: 500px 40px 50px;
  max-width: 700px;
  margin: 0 auto;
}

.hero {
  text-align: center;
}



.arrow-icon {
  display: inline-block;
  font-size: 3.5em;
  color: #0000ba;
  font-weight: bold;
  animation: bounce 2s infinite;
  transition: all 0.2s ease;
  cursor: pointer;
  text-shadow: 
    0 0 10px rgba(1, 63, 79, 0.8),
    0 0 20px rgba(1, 63, 79, 0.6),
    0 0 30px rgba(1, 63, 79, 0.4);
}

.arrow-icon:hover {
  transform: scale(1.2);
  animation-duration: 0.8s;
  text-shadow: 
    0 0 15px rgba(1, 63, 79, 1),
    0 0 30px rgba(1, 63, 79, 0.8),
    0 0 45px rgba(1, 63, 79, 0.6);
}

@keyframes bounce {
  0%, 20%, 50%, 80%, 100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-15px);
  }
  60% {
    transform: translateY(-8px);
  }
}



/* 响应式设计 */
@media (max-width: 768px) {
  .home-page {
    padding: 20px 0;
  }

  .content-wrapper {
    margin: 0 20px;
    padding: 50px 30px 40px;
    border-radius: 10px;
  }



  .arrow-icon {
    font-size: 3em;
  }
}

@media (max-width: 480px) {
  .content-wrapper {
    margin: 0 15px;
    padding: 40px 20px 30px;
    border-radius: 8px;
  }



  .arrow-icon {
    font-size: 2.5em;
  }
}
</style> 