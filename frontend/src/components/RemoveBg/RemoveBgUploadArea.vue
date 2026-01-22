<script setup>
import { ref } from 'vue';
import { CloudUpload } from 'lucide-vue-next';

const emit = defineEmits(['file-selected']);

const isDragging = ref(false);
const uploadRef = ref(null);

const onFileChange = (e) => {
  const file = e.target.files[0];
  if (file) emit('file-selected', file);
};

const handleFileDrop = (e) => {
  e.preventDefault();
  isDragging.value = false;
  const file = e.dataTransfer?.files[0];
  if (file) emit('file-selected', file);
};

const triggerFileInput = () => {
  uploadRef.value?.click();
};
</script>

<template>
  <div
    class="upload-area"
    :class="{ 'dragging': isDragging }"
    @dragover.prevent="isDragging = true"
    @dragleave.prevent="isDragging = false"
    @drop="handleFileDrop"
  >
    <div class="upload-content">
      <div class="upload-icon-wrapper">
        <CloudUpload :size="64" color="#667eea" stroke-width="1.5" />
      </div>
      <h2>Drop your image here</h2>
      <p>or</p>
      <button class="upload-btn" @click="triggerFileInput">
        Choose File
      </button>
      <p class="upload-hint">
        Supports: JPG, PNG, WebP (max 10MB)
      </p>
    </div>

    <input
      ref="uploadRef"
      type="file"
      @change="onFileChange"
      accept="image/*"
      class="hidden-input"
    />
  </div>
</template>

<style scoped>
.upload-area {
  width: 100%;
  max-width: 600px;
  height: 400px;
  border: 2px dashed #3a3a3a;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #252525;
  transition: all 0.3s;
}

.upload-area.dragging {
  border-color: #667eea;
  background: rgba(102, 126, 234, 0.1);
}

.upload-content {
  text-align: center;
}

.upload-icon-wrapper {
  margin-bottom: 16px;
  display: flex;
  justify-content: center;
}

.upload-content h2 {
  font-size: 20px;
  margin: 0 0 12px 0;
  color: #e0e0e0;
}

.upload-content p {
  color: #888;
  margin: 12px 0;
}

.upload-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 12px 32px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.upload-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.upload-hint {
  font-size: 13px;
  color: #666;
  margin-top: 16px;
}

.hidden-input {
  display: none;
}

@media (max-width: 768px) {
  .upload-area {
    height: 300px;
  }
}
</style>