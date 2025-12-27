<template>
  <div class="canvas-container">
    <div class="canvas-workspace">
      <div id="canvas-wrapper" class="canvas-stage">
        <!-- Canvas layers -->
        <div
          v-for="(layer, index) in store.layers"
          :key="layer.id"
          class="layer-wrapper"
          :style="{ 
            zIndex: index,
            pointerEvents: layer.id === store.selectedId ? 'auto' : 'none',
            display: layer.visible ? 'block' : 'none'
          }"
        >
          <canvas
            :ref="el => handleCanvasRef(layer.id, el, index)"
            class="layer-canvas"
          ></canvas>
        </div>
      </div>
    </div>

    <!-- Canvas Info Overlay - Fixed bottom với toggle -->
    <transition name="slide-up">
      <div v-if="showInfo" class="canvas-info">
        <div class="info-content">
          <div class="info-item">
            <span class="info-label">Canvas:</span>
            <span class="info-value">800 × 600px</span>
          </div>
          <div class="info-item">
            <span class="info-label">Zoom:</span>
            <span class="info-value">100%</span>
          </div>
        </div>
        <button 
          class="info-toggle-btn" 
          @click="showInfo = false"
          title="Hide canvas info"
        >
          <span class="toggle-icon">▼</span>
        </button>
      </div>
    </transition>

    <!-- Toggle Button when hidden -->
    <transition name="fade">
      <button 
        v-if="!showInfo"
        class="info-toggle-btn collapsed" 
        @click="showInfo = true"
        title="Show canvas info"
      >
        <span class="toggle-icon">▲</span>
      </button>
    </transition>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useCanvasStore } from '@/stores/canvasStore';

const store = useCanvasStore();
const showInfo = ref(true);

function handleCanvasRef(layerId, el, index) {
  if (!el) return;
  
  const isSelected = layerId === store.selectedId;
  const pointerEvents = isSelected ? 'auto' : 'none';
  
  console.log(`[Canvas Ref] ${layerId} (z-index: ${index})`);
  console.log(`  - Selected: ${isSelected}`);
  console.log(`  - pointer-events: ${pointerEvents}`);
  console.log(`  - Element:`, el);
  
  store.registerLayerCanvas(layerId, el);
}
</script>

<style scoped>
.canvas-container {
  width: 100%;
  height: 100%;
  position: relative;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.canvas-workspace {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: auto; /* Cho phép scroll nếu canvas quá lớn */
  padding: 20px;
}

#canvas-wrapper {
  background-image: 
    linear-gradient(45deg, #ddd 25%, transparent 25%),
    linear-gradient(-45deg, #ddd 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, #ddd 75%),
    linear-gradient(-45deg, transparent 75%, #ddd 75%);
  background-size: 20px 20px;
  background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
  background-color: #fff;
  box-shadow: 
    0 4px 16px rgba(0, 0, 0, 0.3),
    0 0 0 1px rgba(0, 0, 0, 0.1);
  border-radius: 4px;
  
  /* Canvas size - GIỮ CỐ ĐỊNH để Fabric.js tính toán đúng */
  width: 800px;
  height: 600px;
  
  position: relative;
  overflow: hidden;
  flex-shrink: 0; /* Không cho shrink */
}

.layer-wrapper {
  position: absolute !important;
  top: 0 !important;
  left: 0 !important;
  width: 800px !important;
  height: 600px !important;
}

.layer-canvas {
  display: block;
  width: 800px !important;
  height: 600px !important;
}

#canvas-wrapper :deep(.canvas-container) {
  position: absolute !important;
  top: 0 !important;
  left: 0 !important;
  width: 800px !important;
  height: 600px !important;
}

#canvas-wrapper :deep(.lower-canvas),
#canvas-wrapper :deep(.upper-canvas) {
  position: absolute !important;
  top: 0 !important;
  left: 0 !important;
  width: 800px !important;
  height: 600px !important;
}

/* Canvas Info - Fixed at bottom */
.canvas-info {
  position: absolute;
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 8px 8px 16px;
  background: rgba(37, 37, 37, 0.95);
  border: 1px solid #3a3a3a;
  border-radius: 6px;
  backdrop-filter: blur(10px);
  z-index: 10;
}

.info-content {
  display: flex;
  gap: 20px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
}

.info-label {
  color: #888;
  font-weight: 500;
}

.info-value {
  color: #e0e0e0;
  font-weight: 600;
  font-family: 'Courier New', monospace;
}

/* Toggle Button */
.info-toggle-btn {
  width: 28px;
  height: 28px;
  background: transparent;
  border: 1px solid #3a3a3a;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.info-toggle-btn:hover {
  background: rgba(102, 126, 234, 0.2);
  border-color: #667eea;
}

.info-toggle-btn.collapsed {
  position: absolute;
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(37, 37, 37, 0.95);
  border: 1px solid #3a3a3a;
  backdrop-filter: blur(10px);
  z-index: 10;
  padding: 8px 12px;
  width: auto;
  height: auto;
}

.toggle-icon {
  font-size: 10px;
  color: #aaa;
  transition: color 0.2s ease;
}

.info-toggle-btn:hover .toggle-icon {
  color: #667eea;
}

/* Slide up animation */
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(10px);
}

.slide-up-enter-to,
.slide-up-leave-from {
  opacity: 1;
  transform: translateX(-50%) translateY(0);
}

/* Fade animation */
.fade-enter-active,
.fade-leave-active {
  transition: all 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateX(-50%) scale(0.9);
}

.fade-enter-to,
.fade-leave-from {
  opacity: 1;
  transform: translateX(-50%) scale(1);
}

/* Responsive - Canvas workspace sẽ scroll nếu cần */
@media (max-width: 1400px) {
  .canvas-workspace {
    justify-content: flex-start;
    padding: 20px 40px;
  }
}

@media (max-width: 768px) {
  .canvas-workspace {
    padding: 10px 20px;
  }
  
  .canvas-info {
    bottom: 10px;
    padding: 6px 12px;
    gap: 12px;
  }
  
  .info-item {
    font-size: 11px;
  }
}
</style>