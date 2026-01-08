<template>
  <div class="toolbar">
    <!-- Drawing Tools -->
    <div class="toolbar-section">
      <div class="section-label">Tools</div>
      <div class="tool-group">
        <button 
          v-for="tool in drawingTools" 
          :key="tool.id"
          :class="['tool-btn', { active: store.activeTool === tool.id }]"
          @click="handleToolClick(tool.id)"
          :title="tool.label"
        >
          <span class="tool-icon">{{ tool.icon }}</span>
        </button>
      </div>
    </div>

    <!-- Shape Tools -->
    <div class="toolbar-section">
      <div class="section-label">Shapes</div>
      <div class="tool-group">
        <button 
          v-for="tool in shapeTools" 
          :key="tool.id"
          :class="['tool-btn', { active: store.activeTool === tool.id }]"
          @click="handleToolClick(tool.id)"
          :title="tool.label"
        >
          <span class="tool-icon">{{ tool.icon }}</span>
        </button>
      </div>
    </div>

    <!-- Color Picker -->
    <div class="toolbar-section">
      <div class="section-label">Color</div>
      <div class="color-picker-wrapper">
        <input 
          type="color" 
          :value="store.brushColor" 
          @input="e => store.updateBrushSettings(store.brushSize, e.target.value)"
          class="color-input"
        />
      </div>
    </div>

    <!-- Brush Size -->
    <div class="toolbar-section" v-if="['brush', 'eraser', 'rectangle', 'circle'].includes(store.activeTool)">
      <div class="section-label">Size</div>
      <div class="slider-control">
        <input 
          type="range" 
          :value="store.brushSize" 
          @input="e => store.updateBrushSettings(Number(e.target.value), store.brushColor)"
          min="1" 
          max="50"
          class="size-slider"
        />
        <span class="size-value">{{ store.brushSize }}px</span>
      </div>
    </div>

    <!-- History Controls -->
    <div class="toolbar-section">
      <div class="section-label">History</div>
      <div class="tool-group">
        <button 
          class="tool-btn"
          @click="store.undo()" 
          :disabled="store.historyIndex <= 0"
          title="Undo (Ctrl+Z)"
        >
          <span class="tool-icon">↩️</span>
        </button>
        <button 
          class="tool-btn"
          @click="store.redo()" 
          :disabled="store.historyIndex >= store.historyStack.length - 1"
          title="Redo (Ctrl+Y)"
        >
          <span class="tool-icon">↪️</span>
        </button>
      </div>
    </div>
    <input 
      type="file" 
      ref="fileInputRef" 
      accept="image/*"
      style="display: none" 
      @change="handleFileChange"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useCanvasStore } from '@/stores/canvasStore';

const store = useCanvasStore();
const fileInputRef = ref(null);

// 1. Kích hoạt input ẩn
const triggerFileInput = () => {
  fileInputRef.value.click();
};

// 2. Xử lý khi user chọn file
const handleFileChange = async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  // Validate nhanh
  if (!file.type.match('image.*')) {
    alert('Vui lòng chọn file ảnh!');
    return;
  }

  // Gọi action trong store
  await store.addImage(file);
  
  event.target.value = '';
};

const handleToolClick = (toolId) => {
  if (toolId === 'image') {
    triggerFileInput();
  } else {
    store.setTool(toolId);
  }
};

const drawingTools = [
  { id: 'select', icon: '🖱️', label: 'Select (V)' },
  { id: 'brush', icon: '🖌️', label: 'Brush (B)' },
  { id: 'eraser', icon: '🧹', label: 'Eraser (E)' },
  { id: 'image', icon: '🖼️', label: 'Add Image (I)' },
];

const shapeTools = [
  { id: 'rectangle', icon: '▭', label: 'Rectangle (R)' },
  { id: 'circle', icon: '⭕', label: 'Circle (C)' },
];
</script>

<style scoped>
.toolbar {
  width: 72px;
  background: #252525;
  border-right: 1px solid #1a1a1a;
  display: flex;
  flex-direction: column;
  padding: 8px 0;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.3);
  overflow-y: auto;
  overflow-x: hidden;
  height: 100%; /* Quan trọng: chiếm full height */
  flex-shrink: 0; /* Không cho shrink */
}

.toolbar-section {
  padding: 1px 8px 8px 8px;
  border-bottom: 1px solid #1a1a1a;
  flex-shrink: 0; /* Giữ nguyên kích thước */
}

.section-label {
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  color: #888;
  margin-bottom: 8px;
  text-align: center;
  letter-spacing: 0.5px;
}

.tool-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.tool-btn {
  width: 56px;
  height: 48px;
  background: #2d2d2d;
  border: 1px solid #3a3a3a;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  flex-shrink: 0;
}

.tool-btn:hover:not(:disabled) {
  background: #3a3a3a;
  border-color: #4a4a4a;
  transform: translateY(-1px);
}

.tool-btn.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-color: #667eea;
  box-shadow: 0 0 12px rgba(102, 126, 234, 0.4);
}

.tool-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.tool-icon {
  font-size: 22px;
}

/* Color Picker */
.color-picker-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.color-input {
  width: 56px;
  height: 48px;
  border: 2px solid #3a3a3a;
  border-radius: 6px;
  cursor: pointer;
  background: transparent;
}

.color-input::-webkit-color-swatch-wrapper {
  padding: 4px;
}

.color-input::-webkit-color-swatch {
  border: none;
  border-radius: 4px;
}

/* Slider Control */
.slider-control {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.size-slider {
  width: 56px;
  height: 4px;
  -webkit-appearance: none;
  appearance: none;
  background: #3a3a3a;
  border-radius: 2px;
  outline: none;
}

.size-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 14px;
  height: 14px;
  background: #667eea;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s;
}

.size-slider::-webkit-slider-thumb:hover {
  background: #764ba2;
  transform: scale(1.2);
}

.size-value {
  font-size: 11px;
  color: #aaa;
  font-weight: 500;
}

/* Scrollbar */
.toolbar::-webkit-scrollbar {
  width: 4px;
}

.toolbar::-webkit-scrollbar-track {
  background: #1a1a1a;
}

.toolbar::-webkit-scrollbar-thumb {
  background: #3a3a3a;
  border-radius: 2px;
}

.toolbar::-webkit-scrollbar-thumb:hover {
  background: #4a4a4a;
}
</style>