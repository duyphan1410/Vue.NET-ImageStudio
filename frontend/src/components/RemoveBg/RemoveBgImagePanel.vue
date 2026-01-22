<script setup>
import { Image as ImageIcon,Edit3 } from 'lucide-vue-next';

defineProps({
  title: String,
  image: String,
  withChecker: Boolean,
  showEdit: Boolean,
  isLoading: Boolean,
});

const emit = defineEmits(['edit']);
</script>

<template>
  <div class="image-panel">
    <div class="panel-header">
      <h3>{{ title }}</h3>
      <button
        v-if="showEdit && image"
        :disabled="isLoading"
        class="edit-btn"
        @click="emit('edit')"
        title="Refine edges"
      >
        <Edit3 :size="16" />Edit
      </button>
    </div>
    <div 
      class="image-container"
      :class="{ 'with-checker': withChecker }"
    >
      <img 
        v-if="image" 
        :src="image" 
        :alt="title"
      />
      <div v-else class="placeholder">
        <div class="placeholder-icon-wrapper">
          <ImageIcon :size="48" color="#666" stroke-width="1.5" />
        </div>
        <p>Result will appear here</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.image-panel {
  background: #252525;
  border: 1px solid #3a3a3a;
  border-radius: 12px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 400px;
  max-height: calc(100vh - 180px);
}

.panel-header {
  padding: 16px 20px;
  border-bottom: 1px solid #3a3a3a;
  background: #2d2d2d;
}

.panel-header h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #e0e0e0;
}

.edit-btn {
  padding: 6px 12px;
  border: 1px solid #3a3a3a;
  background: transparent;
  color: #e0e0e0;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
}

.edit-btn:hover {
  background: #3a3a3a;
  border-color: #667eea;
  color: #667eea;
}

.image-container {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  overflow: hidden;
  aspect-ratio: 16 / 9;
}

.image-container img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border-radius: 8px;
}

.image-container.with-checker {
  background-image: 
    linear-gradient(45deg, #ddd 25%, transparent 25%),
    linear-gradient(-45deg, #ddd 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, #ddd 75%),
    linear-gradient(-45deg, transparent 75%, #ddd 75%);
  background-size: 20px 20px;
  background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
  background-color: #fff;
}

.placeholder {
  text-align: center;
  color: #666;
}

.placeholder-icon-wrapper {
  margin-bottom: 16px;
  display: flex;
  justify-content: center;
  opacity: 0.5;
}

.placeholder p {
  margin: 0;
  font-size: 14px;
}

/* Desktop (1024px - 1400px) */
@media (max-width: 1400px) {
  .image-panel {
    max-height: calc(100vh - 160px);
  }
}

/* Tablet (768px - 1024px) */
@media (max-width: 1024px) {
  .image-panel {
    max-height: 500px;
    min-height: 350px;
  }
}

/* Mobile (< 768px) */
@media (max-width: 768px) {
  .image-panel {
    max-height: 400px;
    min-height: 280px;
  }
}

/* Màn hình ngắn (chiều cao < 700px) */
@media (max-height: 700px) {
  .image-panel {
    max-height: calc(100vh - 140px);
    min-height: 200px;
  }
}
</style>