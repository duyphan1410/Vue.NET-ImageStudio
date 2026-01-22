<script setup>
import { ArrowRight, Check } from 'lucide-vue-next';

defineProps({
  resultImage: String,
  isLoading: Boolean
});

defineEmits(['process']);
</script>

<template>
  <div class="separator">
    <button 
      v-if="!resultImage && !isLoading"
      class="process-btn"
      @click="$emit('process')"
    >
      <ArrowRight :size="24" class="arrow-icon" />
      <span class="text">Process</span>
    </button>
    
    <div v-if="isLoading" class="loading-indicator">
      <div class="spinner"></div>
      <p>Removing background...</p>
    </div>
    
    <div v-if="resultImage" class="success-indicator">
      <Check :size="32" color="white" stroke-width="3" />
    </div>
  </div>
</template>

<style scoped>
.separator {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-width: 120px;
}

.process-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 16px 24px;
  border-radius: 50px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.process-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.5);
}

.process-btn .text {
  font-size: 13px;
}

.loading-indicator {
  text-align: center;
}

.spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #3a3a3a;
  border-top-color: #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 12px;
}

.loading-indicator p {
  font-size: 13px;
  color: #888;
  margin: 0;
}

.success-indicator {
  width: 64px;
  height: 64px;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: scaleIn 0.3s ease-out;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@keyframes scaleIn {
  from {
    transform: scale(0);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

@media (max-width: 1200px) {
  .separator {
    flex-direction: row;
    min-width: auto;
  }

  .process-btn {
    flex-direction: row;
    padding: 12px 24px;
  }

  .process-btn .arrow-icon {
    transform: rotate(90deg);
  }
}
</style>