<template>
  <div class="home-page">
    <div class="container">
      <div class="content-wrapper">
        <section class="hero">
          <img src="/title.png" alt="MyStanford" class="main-title-image" />
          <button class="arrow-button" @click="startWorkflow">
            <span class="arrow-icon">^</span>
          </button>
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
  padding: 80px 40px 60px;
  max-width: 600px;
  margin: 0 auto;
}

.hero {
  text-align: center;
}

.main-title-image {
  max-width: 100%;
  height: auto;
  width: 600px;
  margin-bottom: 50px;
  filter: 
    drop-shadow(0 0 20px rgba(255, 255, 255, 0.8))
    drop-shadow(0 0 40px rgba(255, 255, 255, 0.6))
    drop-shadow(0 0 60px rgba(255, 255, 255, 0.4))
    drop-shadow(0 0 80px rgba(255, 255, 255, 0.3))
    drop-shadow(0 0 100px rgba(255, 255, 255, 0.2));
  animation: imageGlow 3s ease-in-out infinite alternate;
} 

.arrow-button {
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0;
  margin: 0;
}

.arrow-icon {
  display: inline-block;
  font-size: 4em;
  color: #1917F9;
  font-weight: bold;
  animation: bounce 2s infinite;
  transition: all 0.3s ease;
  text-shadow: 
    0 0 15px rgba(255, 255, 255, 0.8),
    0 0 30px rgba(255, 255, 255, 0.6),
    0 0 45px rgba(255, 255, 255, 0.4);
}

.arrow-button:hover .arrow-icon {
  color: #4169E1;
  transform: scale(1.2);
  animation-duration: 0.5s;
  text-shadow: 
    0 0 20px rgba(255, 255, 255, 1),
    0 0 40px rgba(255, 255, 255, 0.8),
    0 0 60px rgba(255, 255, 255, 0.6);
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

@keyframes imageGlow {
  from {
    filter: 
      drop-shadow(0 0 20px rgba(255, 255, 255, 0.8))
      drop-shadow(0 0 40px rgba(255, 255, 255, 0.6))
      drop-shadow(0 0 60px rgba(255, 255, 255, 0.4))
      drop-shadow(0 0 80px rgba(255, 255, 255, 0.3))
      drop-shadow(0 0 100px rgba(255, 255, 255, 0.2));
  }
  to {
    filter: 
      drop-shadow(0 0 30px rgba(255, 255, 255, 1))
      drop-shadow(0 0 50px rgba(255, 255, 255, 0.8))
      drop-shadow(0 0 70px rgba(255, 255, 255, 0.6))
      drop-shadow(0 0 90px rgba(255, 255, 255, 0.5))
      drop-shadow(0 0 120px rgba(255, 255, 255, 0.4));
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .home-page {
    padding: 20px 0;
  }

  .content-wrapper {
    margin: 0 20px;
    padding: 60px 30px 40px;
    border-radius: 20px;
  }

  .main-title-image {
    width: 450px;
  }

  .arrow-icon {
    font-size: 3.5em;
  }
}

@media (max-width: 480px) {
  .content-wrapper {
    margin: 0 15px;
    padding: 50px 20px 30px;
    border-radius: 16px;
  }

  .main-title-image {
    width: 300px;
    margin-bottom: 30px;
  }

  .arrow-icon {
    font-size: 2.8em;
  }
}
</style> 