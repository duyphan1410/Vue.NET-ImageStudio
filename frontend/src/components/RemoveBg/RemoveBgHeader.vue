<script setup>
import { RotateCcw } from 'lucide-vue-next';

defineProps({
  hasImage: Boolean
});

defineEmits(['reset']);
</script>

<template>
  <div class="header">
    <div class="header-left">
      <h1>Remove Background</h1>
      <p class="subtitle">Remove image background automatically</p>
    </div>
    <div class="header-actions">
      <button 
        v-if="hasImage"
        class="secondary-btn"
        @click="$emit('reset')"
      >
        <RotateCcw :size="16" />
        Reset
      </button>
    </div>
  </div>
</template>

<style scoped>
.header {
  padding: 5px 24px;
  border-bottom: 1px solid #2d2d2d;
  border-bottom-right-radius: 2%;
  border-bottom-left-radius: 2%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #252525;
  flex-shrink: 0;
}

.header-left h1 {
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 4px 0;
  color: #e0e0e0;
}

.subtitle {
  font-size: 13px;
  color: #888;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.secondary-btn {
  padding: 10px 20px;
  border-radius: 6px;
  font-weight: 500;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;
  border: none;
  background: transparent;
  border: 1px solid #3a3a3a;
  color: #e0e0e0;
}

.secondary-btn:hover {
  background: #2d2d2d;
  border-color: #4a4a4a;
}

@media (max-width: 768px) {
  .header {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
  }

  .header-actions {
    width: 100%;
  }

  .secondary-btn {
    flex: 1;
  }
}
</style>