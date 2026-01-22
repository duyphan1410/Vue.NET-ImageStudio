<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { Paintbrush, Eraser, Undo, Redo, Save, X } from 'lucide-vue-next';

const props = defineProps({
  image: String,
  originalImage: String
});

const emit = defineEmits(['save', 'cancel']);

const canvasRef = ref(null);
const originalImageRef = ref(null);
const ctx = ref(null);

const isDrawing = ref(false);
const tool = ref('brush'); // 'brush' or 'eraser'
const brushSize = ref(20);

const history = ref([]);
const historyStep = ref(-1);

// Mouse position
const lastX = ref(0);
const lastY = ref(0);

onMounted(() => {
  initCanvas();
});

const initCanvas = () => {
  const canvas = canvasRef.value;
  if (!canvas) return;

  ctx.value = canvas.getContext('2d', { willReadFrequently: true });

  // Load original image (để restore)
  const originalImg = new Image();
  originalImg.crossOrigin = 'anonymous';
  originalImg.onload = () => {
    originalImageRef.value = originalImg;
  };
  originalImg.src = props.originalImage;

  // Load result image (ảnh đã remove bg)
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => {
    canvas.width = img.width;
    canvas.height = img.height;

    ctx.value.drawImage(img, 0, 0);
    saveState();
  };
  img.src = props.image;
};


const startDrawing = (e) => {
  isDrawing.value = true;
  const rect = canvasRef.value.getBoundingClientRect();
  const scaleX = canvasRef.value.width / rect.width;
  const scaleY = canvasRef.value.height / rect.height;
  
  lastX.value = (e.clientX - rect.left) * scaleX;
  lastY.value = (e.clientY - rect.top) * scaleY;
};

const draw = (e) => {
  if (!isDrawing.value) return;
  
  const rect = canvasRef.value.getBoundingClientRect();
  const scaleX = canvasRef.value.width / rect.width;
  const scaleY = canvasRef.value.height / rect.height;
  
  const x = (e.clientX - rect.left) * scaleX;
  const y = (e.clientY - rect.top) * scaleY;

  ctx.value.beginPath();
  ctx.value.moveTo(lastX.value, lastY.value);
  ctx.value.lineTo(x, y);
  
  if (tool.value === 'brush') {
        ctx.value.save();
        ctx.value.globalCompositeOperation = 'source-over';

        ctx.value.beginPath();
        ctx.value.arc(x, y, brushSize.value / 2, 0, Math.PI * 2);
        ctx.value.clip();

        ctx.value.drawImage(
            originalImageRef.value,
            0,
            0,
            canvasRef.value.width,
            canvasRef.value.height
        );

        ctx.value.restore();
    } else {
        ctx.value.globalCompositeOperation = 'destination-out';
        ctx.value.beginPath();
        ctx.value.moveTo(lastX.value, lastY.value);
        ctx.value.lineTo(x, y);
        ctx.value.lineWidth = brushSize.value;
        ctx.value.lineCap = 'round';
        ctx.value.stroke();
    }

    ctx.value.lineWidth = brushSize.value;
    ctx.value.lineCap = 'round';
    ctx.value.lineJoin = 'round';
    ctx.value.stroke();
    
    lastX.value = x;
    lastY.value = y;
};

const stopDrawing = () => {
  if (isDrawing.value) {
    isDrawing.value = false;
    saveState();
  }
};

const saveState = () => {
  historyStep.value++;
  history.value = history.value.slice(0, historyStep.value);
  history.value.push(canvasRef.value.toDataURL('image/png'));
  
  // Giới hạn history 20 steps
  if (history.value.length > 20) {
    history.value.shift();
    historyStep.value--;
  }
};

const undo = () => {
  if (historyStep.value > 0) {
    historyStep.value--;
    restoreState(history.value[historyStep.value]);
  }
};

const redo = () => {
  if (historyStep.value < history.value.length - 1) {
    historyStep.value++;
    restoreState(history.value[historyStep.value]);
  }
};

const restoreState = (dataUrl) => {
  const img = new Image();
  img.onload = () => {
    ctx.value.clearRect(0, 0, canvasRef.value.width, canvasRef.value.height);
    ctx.value.drawImage(img, 0, 0);
  };
  img.src = dataUrl;
};

const save = () => {
  const dataUrl = canvasRef.value.toDataURL('image/png');
  emit('save', dataUrl);
};

const cancel = () => {
  emit('cancel');
};

// Prevent context menu
const preventContextMenu = (e) => {
  e.preventDefault();
};
</script>

<template>
  <div class="editor-container">
    <div class="editor-header">
      <h2>Refine Edges</h2>
      <div class="header-actions">
        <button class="icon-btn" @click="cancel">
          <X :size="20" />
        </button>
      </div>
    </div>

    <div class="toolbar">
      <div class="tool-group">
        <button
          class="tool-btn"
          :class="{ active: tool === 'brush' }"
          @click="tool = 'brush'"
          title="Brush - Keep area"
        >
          <Paintbrush :size="20" />
          <span>Brush</span>
        </button>
        <button
          class="tool-btn"
          :class="{ active: tool === 'eraser' }"
          @click="tool = 'eraser'"
          title="Eraser - Remove area"
        >
          <Eraser :size="20" />
          <span>Eraser</span>
        </button>
      </div>

      <div class="tool-group">
        <label class="brush-size-label">
          Size: {{ brushSize }}px
        </label>
        <input
          type="range"
          v-model.number="brushSize"
          min="5"
          max="100"
          class="brush-size-slider"
        />
      </div>

      <div class="tool-group">
        <button
          class="icon-btn"
          @click="undo"
          :disabled="historyStep <= 0"
          title="Undo"
        >
          <Undo :size="20" />
        </button>
        <button
          class="icon-btn"
          @click="redo"
          :disabled="historyStep >= history.length - 1"
          title="Redo"
        >
          <Redo :size="20" />
        </button>
      </div>

      <button class="save-btn" @click="save">
        <Save :size="18" />
        Save Changes
      </button>
    </div>

    <div class="canvas-wrapper">
      <canvas
        ref="canvasRef"
        @mousedown="startDrawing"
        @mousemove="draw"
        @mouseup="stopDrawing"
        @mouseleave="stopDrawing"
        @contextmenu="preventContextMenu"
        :style="{ cursor: tool === 'brush' ? 'crosshair' : 'pointer' }"
      />
    </div>

    <div class="editor-footer">
      <p class="hint">
        <strong>Brush:</strong> Paint to restore removed areas |
        <strong>Eraser:</strong> Paint to remove areas
      </p>
    </div>
  </div>
</template>

<style scoped>
.editor-container {
  position: fixed;
  top: 48px;
  left: 0;
  right: 0;
  bottom: 0;
  background: #1e1e1e;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  padding: 0 32px;
}

.editor-header {
  padding: 16px 24px;
  border-bottom: 1px solid #2d2d2d;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #252525;
}

.editor-header h2 {
  margin: 0;
  font-size: 18px;
  color: #e0e0e0;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.toolbar {
  padding: 16px 24px;
  border-bottom: 1px solid #2d2d2d;
  background: #252525;
  display: flex;
  gap: 24px;
  align-items: center;
  flex-wrap: wrap;
}

.tool-group {
  display: flex;
  gap: 8px;
  align-items: center;
}

.tool-btn {
  padding: 10px 16px;
  border: 1px solid #3a3a3a;
  background: transparent;
  color: #e0e0e0;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.tool-btn:hover {
  background: #2d2d2d;
  border-color: #4a4a4a;
}

.tool-btn.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-color: transparent;
  color: white;
}

.brush-size-label {
  font-size: 13px;
  color: #888;
  min-width: 80px;
}

.brush-size-slider {
  width: 150px;
  height: 6px;
  border-radius: 3px;
  background: #3a3a3a;
  outline: none;
  -webkit-appearance: none;
}

.brush-size-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  cursor: pointer;
}

.brush-size-slider::-moz-range-thumb {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  cursor: pointer;
  border: none;
}

.icon-btn {
  padding: 10px;
  border: 1px solid #3a3a3a;
  background: transparent;
  color: #e0e0e0;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-btn:hover:not(:disabled) {
  background: #2d2d2d;
  border-color: #4a4a4a;
}

.icon-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.save-btn {
  margin-left: auto;
  padding: 10px 20px;
  border: none;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
  font-size: 14px;
}

.save-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
}

.canvas-wrapper {
  flex: 1;
  overflow: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.canvas-wrapper canvas {
    background-image: 
    linear-gradient(45deg, #ddd 25%, transparent 25%),
    linear-gradient(-45deg, #ddd 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, #ddd 75%),
    linear-gradient(-45deg, transparent 75%, #ddd 75%);
    background-size: 20px 20px;
    background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
    background-color: #fff;
    max-width: 100%;
    max-height: 100%;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    border-radius: 4px;
}

.editor-footer {
  padding: 12px 24px;
  border-top: 1px solid #2d2d2d;
  background: #252525;
}

.hint {
  margin: 0;
  font-size: 13px;
  color: #888;
  text-align: center;
}

.hint strong {
  color: #e0e0e0;
}

@media (max-width: 768px) {
  .toolbar {
    gap: 12px;
  }

  .tool-btn span {
    display: none;
  }

  .brush-size-slider {
    width: 100px;
  }

  .save-btn {
    margin-left: 0;
    width: 100%;
  }
}
</style>