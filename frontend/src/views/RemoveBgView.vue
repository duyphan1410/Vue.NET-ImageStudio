<script setup>
import { ref, onMounted, onUnmounted, watch } from "vue";
import { useRemoveBg } from '@/composables/useRemoveBg';
import { useWorkspaceStore } from "@/stores/workspaceStore"; 

const {
  originalImage,
  resultImage,
  isLoading,
  error,
  processFile,
  removeBg,
  reset
} = useRemoveBg()

const workspaceStore = useWorkspaceStore();

const isDragging = ref(false);
const uploadRef = ref(null);

function onFileChange(e) {
  const file = e.target.files[0]
  if (file) processFile(file)
}

const registerWorkspace = () => {
    workspaceStore.setWorkspace('remove-bg', () => {
        return {
            resultImage: resultImage.value // Chỉ cần trả về ảnh kết quả
        };
    });
};

onMounted(() => {
    registerWorkspace();
});


onUnmounted(() => {
    workspaceStore.clearWorkspace();
});

const handleFileDrop = (e) => {
  e.preventDefault();
  isDragging.value = false;
  const file = e.dataTransfer?.files[0];
  if (file) processFile(file);
};

const triggerFileInput = () => {
  uploadRef.value?.click();
};
//     error.value = "Please select a file first";
//     return;
//   }

//   isLoading.value = true;
//   error.value = null;

//   try {
//     const formData = new FormData();
//     formData.append("file", selectedFile.value);
    
//     const res = await api.post("api/image/remove-bg", formData, {
//       headers: { 
//         "Content-Type": "multipart/form-data" 
//       },
//       timeout: 60000
//     });

//     if (res.data && res.data.image) {
//       resultImage.value = "data:image/png;base64," + res.data.image;
//     } else {
//       error.value = "Invalid response from server";
//     }
//   } catch (err) {
//     console.error("Upload error:", err);
    
//     if (err.response) {
//       error.value = err.response.data?.error || `Server error: ${err.response.status}`;
//     } else if (err.request) {
//       error.value = "No response from server. Please check your connection.";
//     } else {
//       error.value = "An unexpected error occurred";
//     }
//   } finally {
//     isLoading.value = false;
//   }
// };

const downloadResult = () => {
  if (!resultImage.value) return;
  const link = document.createElement('a');
  link.download = `removed_bg_${Date.now()}.png`;
  link.href = resultImage.value;
  link.click();
};

</script>

<template>
  <div class="remove-bg-container">
    <!-- Header -->
    <div class="header">
      <div class="header-left">
        <h1>Remove Background</h1>
        <p class="subtitle">Remove image background automatically</p>
      </div>
      <div class="header-actions">
        <button 
          v-if="originalImage"
          class="secondary-btn"
          @click="reset"
        >
          <span class="icon">🔄</span>
          Reset
        </button>
      </div>
    </div>

    <!-- Hidden file input -->
    <input
      ref="uploadRef"
      type="file"
      @change="onFileChange"
      accept="image/*"
      class="hidden-input"
    />

    <!-- Main Content -->
    <div class="content">
      <!-- Upload Area or Preview -->
      <div 
        v-if="!originalImage"
        class="upload-area"
        :class="{ 'dragging': isDragging }"
        @dragover.prevent="isDragging = true"
        @dragleave.prevent="isDragging = false"
        @drop="handleFileDrop"
      >
        <div class="upload-content">
          <div class="upload-icon">📸</div>
          <h2>Drop your image here</h2>
          <p>or</p>
          <button class="upload-btn" @click="triggerFileInput">
            Choose File
          </button>
          <p class="upload-hint">
            Supports: JPG, PNG, WebP (max 10MB)
          </p>
        </div>
      </div>

      <!-- Comparison View -->
      <div v-else class="comparison-view">
        <!-- Original Image -->
        <div class="image-panel">
          <div class="panel-header">
            <h3>Original</h3>
          </div>
          <div class="image-container">
            <img :src="originalImage" alt="Original" />
          </div>
        </div>

        <!-- Arrow or Process Button -->
        <div class="separator">
          <button 
            v-if="!resultImage && !isLoading"
            class="process-btn"
            @click="removeBg"
          >
            <span class="arrow">→</span>
            <span class="text">Process</span>
          </button>
          <div v-if="isLoading" class="loading-indicator">
            <div class="spinner"></div>
            <p>Removing background...</p>
          </div>
          <div v-if="resultImage" class="success-indicator">
            <span class="checkmark">✓</span>
          </div>
        </div>

        <!-- Result Image -->
        <div class="image-panel">
          <div class="panel-header">
            <h3>Result</h3>
          </div>
          <div class="image-container with-checker">
            <img 
              v-if="resultImage" 
              :src="resultImage" 
              alt="Result"
            />
            <div v-else class="placeholder">
              <span class="placeholder-icon">🖼️</span>
              <p>Result will appear here</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Error Toast -->
    <transition name="slide-up">
      <div v-if="error" class="error-toast">
        <span class="error-icon">⚠️</span>
        <p>{{ error }}</p>
        <button @click="error = null" class="close-btn">✕</button>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.remove-bg-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #1e1e1e;
  color: #e0e0e0;
  overflow: hidden;
}

/* Header */
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

.primary-btn,
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
}

.primary-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.primary-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.primary-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.secondary-btn {
  background: transparent;
  border: 1px solid #3a3a3a;
  color: #e0e0e0;
}

.secondary-btn:hover {
  background: #2d2d2d;
  border-color: #4a4a4a;
}

.icon {
  font-size: 16px;
}

.hidden-input {
  display: none;
}

/* Content */
.content {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  overflow: auto;
}

/* Upload Area */
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

.upload-icon {
  font-size: 64px;
  margin-bottom: 16px;
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

/* Comparison View */
.comparison-view {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 24px;
  width: 100%;
  max-width: 1400px;
  align-items: center;
}

.image-panel {
  background: #252525;
  border: 1px solid #3a3a3a;
  border-radius: 12px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  height: 600px;
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

.image-container {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  overflow: hidden;
}

.image-container img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border-radius: 8px;
}

.image-container.with-checker {
  background-image:
    linear-gradient(45deg, #2d2d2d 25%, transparent 25%),
    linear-gradient(-45deg, #2d2d2d 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, #2d2d2d 75%),
    linear-gradient(-45deg, transparent 75%, #2d2d2d 75%);
  background-size: 20px 20px;
  background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
  background-color: #1e1e1e;
}

.placeholder {
  text-align: center;
  color: #666;
}

.placeholder-icon {
  font-size: 48px;
  display: block;
  margin-bottom: 16px;
  opacity: 0.5;
}

.placeholder p {
  margin: 0;
  font-size: 14px;
}

/* Separator */
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

.process-btn .arrow {
  font-size: 24px;
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

.checkmark {
  font-size: 32px;
  color: white;
}

/* Error Toast */
.error-toast {
  position: fixed;
  bottom: 24px;
  right: 24px;
  background: #2d2d2d;
  border: 1px solid #ff6b6b;
  border-radius: 8px;
  padding: 16px 20px;
  display: flex;
  align-items: center;
  gap: 12px;
  max-width: 400px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
  z-index: 1000;
}

.error-icon {
  font-size: 20px;
}

.error-toast p {
  flex: 1;
  margin: 0;
  font-size: 14px;
  color: #ff6b6b;
}

.close-btn {
  background: transparent;
  border: none;
  color: #888;
  font-size: 18px;
  cursor: pointer;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #e0e0e0;
}

/* Animations */
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

.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100px);
  opacity: 0;
}

/* Responsive */
@media (max-width: 1200px) {
  .comparison-view {
    grid-template-columns: 1fr;
    grid-template-rows: auto auto auto;
    gap: 20px;
  }

  .separator {
    flex-direction: row;
    min-width: auto;
  }

  .process-btn {
    flex-direction: row;
    padding: 12px 24px;
  }

  .process-btn .arrow {
    transform: rotate(90deg);
  }

  .image-panel {
    height: 400px;
  }
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

  .primary-btn,
  .secondary-btn {
    flex: 1;
  }

  .content {
    padding: 16px;
  }

  .upload-area {
    height: 300px;
  }

  .image-panel {
    height: 300px;
  }

  .error-toast {
    left: 16px;
    right: 16px;
    bottom: 16px;
  }
}
</style>