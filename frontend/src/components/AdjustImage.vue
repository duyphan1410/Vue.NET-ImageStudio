<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from "vue";
import api from "../services/api";

// State management
const activeTab = ref('Adjust');
const selectedFile = ref(null);
const originalImage = ref(null);
const editedImage = ref(null);
const isLoading = ref(false);
const error = ref(null);
const isDragging = ref(false);
const uploadRef = ref(null);

// Canvas refs and drawing state
const canvasRef = ref(null);
const canvasContext = ref(null);
const isDrawing = ref(false);
const lastX = ref(0);
const lastY = ref(0);
const startX = ref(0);
const startY = ref(0);
const tempCanvas = ref(null);  // For temporary drawing of shapes
const brushType = ref('round'); // 'round' or 'square'

// Adjustment values
const brightness = ref(100);
const contrast = ref(100);
const saturation = ref(100);
const rotateAngle = ref(0);
const flipX = ref(false);
const flipY = ref(false);

// Drawing tools
const selectedTool = ref('brush');
const brushSize = ref(5);
const brushColor = ref('#000000');

// Undo/Redo state
const undoStack = ref([]);
const redoStack = ref([]);
const maxStackSize = 20; // Giới hạn số lượng undo để tránh dùng quá nhiều bộ nhớ
const isFirstDraw = ref(true);

// Thêm function để lưu trạng thái canvas
const saveCanvasState = () => {
  if (!canvasRef.value) return;

  // Nếu là lần vẽ đầu tiên, lưu trạng thái canvas trống
  if (isFirstDraw.value) {
    const emptyCanvas = document.createElement('canvas');
    emptyCanvas.width = canvasRef.value.width;
    emptyCanvas.height = canvasRef.value.height;
    undoStack.value.push(emptyCanvas.toDataURL());
    isFirstDraw.value = false;
  }

  // Lưu trạng thái hiện tại vào undoStack
  undoStack.value.push(canvasRef.value.toDataURL());
  // Xóa redoStack khi có action mới
  redoStack.value = [];
  // Giới hạn kích thước stack
  if (undoStack.value.length > maxStackSize) {
    undoStack.value.shift();
  }
};
const pushUndoState = () => {
  
  if (canvasRef.value) {
    undoStack.value.push(canvasRef.value.toDataURL());
  }
  
  if (undoStack.value.length > maxStackSize) {
    undoStack.value.shift();
  }
  // xóa redo khi có action mới
  redoStack.value = [];
};

const undo = () => {
  if (!canvasRef.value || undoStack.value.length <= 1) return;
  
  // Lưu trạng thái hiện tại vào redoStack trước khi undo
  redoStack.value.push(canvasRef.value.toDataURL());
  
  // Xóa trạng thái hiện tại khỏi undoStack
  undoStack.value.pop();
  
  // Lấy trạng thái trước đó (không xóa khỏi undoStack)
  const previousState = undoStack.value[undoStack.value.length - 1];
  
  const img = new Image();
  img.src = previousState;
  img.onload = () => {
    canvasContext.value.clearRect(0, 0, canvasRef.value.width, canvasRef.value.height);
    canvasContext.value.drawImage(img, 0, 0);
  };
  
  // Giới hạn kích thước redoStack
  if (redoStack.value.length > maxStackSize) {
    redoStack.value.shift();
  }
};

// Function redo
const redo = () => {
  if (!canvasRef.value || redoStack.value.length === 0) return;
  
  // Lấy trạng thái tiếp theo từ redoStack
  const nextState = redoStack.value.pop();
  
  // Lưu trạng thái hiện tại vào undoStack
  undoStack.value.push(canvasRef.value.toDataURL());
  
  const img = new Image();
  img.src = nextState;
  img.onload = () => {
    canvasContext.value.clearRect(0, 0, canvasRef.value.width, canvasRef.value.height);
    canvasContext.value.drawImage(img, 0, 0);
  };
  
  // Giới hạn kích thước undoStack
  if (undoStack.value.length > maxStackSize) {
    undoStack.value.shift();
  }
};
const canUndo = computed(() =>{
  console.log('undoStack length:', undoStack.value.length, 'can undo:', undoStack.value.length > 1);
  return undoStack.value.length > 1;
});
const canRedo = computed(() => {

  console.log('redoStack length:', redoStack.value.length , 'can redo:', redoStack.value.length > 0);
  return redoStack.value.length > 0;
});



// File handling
const handleFileDrop = (e) => {
  e.preventDefault();
  isDragging.value = false;
  
  const file = e.dataTransfer?.files[0];
  if (file) processFile(file);
};

const handleFileSelect = (e) => {
  const file = e.target?.files[0];
  if (file) processFile(file);
};

const processFile = (file) => {
  // Validate file type
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!validTypes.includes(file.type)) {
    error.value = "Please select a valid image file (JPEG, PNG, WebP)";
    return;
  }

  // Validate file size (max 10MB)
  if (file.size > 10 * 1024 * 1024) {
    error.value = "File size must be less than 10MB";
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    originalImage.value = e.target.result;
    editedImage.value = e.target.result;
    error.value = null;
    // Reset undo/redo stacks for new image
    undoStack.value = [];
    redoStack.value = [];
    isFirstDraw.value = true;
  };
  reader.readAsDataURL(file);
};

const triggerFileInput = () => {
  uploadRef.value?.click();
};

// Tab handling
const switchTab = (tab) => {
  activeTab.value = tab;
};
const imageStyle = computed(() => ({
  filter: `brightness(${brightness.value}%) contrast(${contrast.value}%) saturate(${saturation.value}%)`,
  transform: `rotate(${rotateAngle.value}deg) scaleX(${flipX.value ? -1 : 1}) scaleY(${flipY.value ? -1 : 1})`,
 
}));

const filters = {
  bright: "brightness(120%)",
  dark: "brightness(70%)",
  vivid: "saturate(150%)",
  bw: "grayscale(100%)"
};

const currentFilter = ref(""); 
const applyFilter = (filterType) => {
  if (!editedImage.value) return;
  // áp dụng filter ngay lập tức bằng CSS
  currentFilter.value = filters[filterType] || "";
};

let adjustmentTimeout = null;


// Reset image
const resetToOriginal = () => {
  if (originalImage.value) {
    editedImage.value = originalImage.value;
    brightness.value = 100;
    contrast.value = 100;
    saturation.value = 100;
    rotateAngle.value = 0;
    flipX.value = false;
    flipY.value = false;
    currentFilter.value = "";
  }
};

const flipImage = (axis) => {
  // Implement flip logic\
  if (axis === 'x') flipX.value = !flipX.value;
  if (axis === 'y') flipY.value = !flipY.value;

  // Apply flip immediately using CSS

  
};  
// Drawing functions
const initCanvas = () => {
  if (!canvasRef.value || !editedImage.value) return;

  const img = new Image();
  img.crossOrigin = "anonymous";
  img.src = editedImage.value;
  
  img.onload = () => {
    const container = canvasRef.value.parentElement;
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    
    const scale = Math.min(
      containerWidth / img.width,
      containerHeight / img.height
    );
    
    canvasRef.value.width = img.width;
    canvasRef.value.height = img.height;
    canvasRef.value.style.width = `${img.width * scale}px`;
    canvasRef.value.style.height = `${img.height * scale}px`;
    
    canvasContext.value = canvasRef.value.getContext('2d');
    canvasContext.value.clearRect(0, 0, canvasRef.value.width, canvasRef.value.height);
    canvasContext.value.drawImage(img, 0, 0);

    // *** SỬA LỖI: Chỉ reset khi chưa có undo stack ***
    if (undoStack.value.length === 0) {
      undoStack.value.push(canvasRef.value.toDataURL());
      redoStack.value = [];
      isFirstDraw.value = true;
    }
  };
};

const getCanvasCoordinates = (e) => {
  const rect = canvasRef.value.getBoundingClientRect();
  const scaleX = canvasRef.value.width / rect.width;
  const scaleY = canvasRef.value.height / rect.height;
  
  // Handle both mouse and touch events
  const clientX = e.touches ? e.touches[0].clientX : e.clientX;
  const clientY = e.touches ? e.touches[0].clientY : e.clientY;
  
  return {
    x: (clientX - rect.left) * scaleX,
    y: (clientY - rect.top) * scaleY
  };
};

const initTempCanvas = () => {
  tempCanvas.value = document.createElement('canvas');
  tempCanvas.value.width = canvasRef.value.width;
  tempCanvas.value.height = canvasRef.value.height;
  const tempCtx = tempCanvas.value.getContext('2d');
  tempCtx.drawImage(canvasRef.value, 0, 0);
};


const startDrawing = (e) => {
  if (!canvasContext.value) return;

  if (undoStack.value.length > maxStackSize) {
    undoStack.value.shift();
  }
  redoStack.value = [];

  isDrawing.value = true;
  const coords = getCanvasCoordinates(e);
  lastX.value = coords.x;
  lastY.value = coords.y;
  startX.value = coords.x;
  startY.value = coords.y;

  if (selectedTool.value === 'rectangle') {
    initTempCanvas();
  }

  if (selectedTool.value === 'brush') {
    canvasContext.value.globalCompositeOperation = 'source-over';
    const size = brushSize.value;
    canvasContext.value.beginPath();
    canvasContext.value.arc(coords.x, coords.y, size/2, 0, Math.PI * 2);
    canvasContext.value.fillStyle = brushColor.value;
    canvasContext.value.fill();
  } else if (selectedTool.value === 'eraser') {
    const size = brushSize.value;
    canvasContext.value.save();
    canvasContext.value.globalCompositeOperation = 'destination-out';
    canvasContext.value.beginPath();
    canvasContext.value.arc(coords.x, coords.y, size/2, 0, Math.PI * 2);
    canvasContext.value.fill();
    canvasContext.value.restore();
  }

  isFirstDraw.value = false;
};


const draw = (e) => {
  if (!isDrawing.value || !canvasContext.value) return;

  const coords = getCanvasCoordinates(e);
  const currentX = coords.x;
  const currentY = coords.y;

  if (selectedTool.value === 'brush') {
    const size = brushSize.value;
    canvasContext.value.globalCompositeOperation = 'source-over';
    canvasContext.value.beginPath();
    canvasContext.value.moveTo(lastX.value, lastY.value);
    canvasContext.value.lineTo(currentX, currentY);
    canvasContext.value.strokeStyle = brushColor.value;
    canvasContext.value.lineWidth = size;
    canvasContext.value.lineCap = brushType.value;
    canvasContext.value.lineJoin = brushType.value;
    canvasContext.value.stroke();
  } else if (selectedTool.value === 'eraser') {
    // ✅ Xóa từng nét để trong suốt
    const size = brushSize.value;
    canvasContext.value.save();
    canvasContext.value.globalCompositeOperation = 'destination-out';
    canvasContext.value.beginPath();
    canvasContext.value.moveTo(lastX.value, lastY.value);
    canvasContext.value.lineTo(currentX, currentY);
    canvasContext.value.lineWidth = size;
    canvasContext.value.lineCap = 'round';
    canvasContext.value.lineJoin = 'round';
    canvasContext.value.stroke();
    canvasContext.value.restore();
  } else if (selectedTool.value === 'rectangle') {
    const size = brushSize.value;
    canvasContext.value.clearRect(0, 0, canvasRef.value.width, canvasRef.value.height);
    canvasContext.value.drawImage(tempCanvas.value, 0, 0);
    canvasContext.value.beginPath();
    canvasContext.value.moveTo(lastX.value, lastY.value);
    canvasContext.value.lineTo(currentX, currentY);
    canvasContext.value.strokeStyle = brushColor.value;
    canvasContext.value.lineWidth = size;
    canvasContext.value.stroke();
  }

  lastX.value = currentX;
  lastY.value = currentY;
};


const stopDrawing = () => {
  if (isDrawing.value) {
    isDrawing.value = false;
    undoStack.value.push(canvasRef.value.toDataURL());
    if (undoStack.value.length > maxStackSize) {
      undoStack.value.shift();
    }
    redoStack.value = [];
  }
};

// Watch for tab changes and image changes
const initializeCanvasIfNeeded = () => {
  if (activeTab.value === 'Draw' && editedImage.value) {
    // Wait for the next tick to ensure canvas is mounted
    nextTick(() => {
      initCanvas();
    });
  }
};

watch(() => activeTab.value, (newTab) => {
  if (newTab === 'Draw') {
    initializeCanvasIfNeeded();
  }
});
watch(activeTab, (newTab, oldTab) => {
  // ✅ Mỗi lần rời tab vẽ, lưu canvas hiện tại
  if (oldTab === 'Draw' && canvasRef.value) {
    editedImage.value = canvasRef.value.toDataURL();
  }
});
watch(() => editedImage.value, (newImage) => {
  if (activeTab.value === 'Draw' && newImage) {
    initializeCanvasIfNeeded();
  }
});

// Lifecycle hooks for canvas
onMounted(() => {
  if (editedImage.value) {
    initializeCanvasIfNeeded();
  }
});

onUnmounted(() => {
  stopDrawing();
});

const downloadEditedImage = () => {
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.src = editedImage.value;
  img.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');

    // Áp dụng filter
   ctx.filter = `${imageStyle.value.filter} ${currentFilter.value}`;

    
    // Xử lý transform
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((rotateAngle.value * Math.PI) / 180);
    ctx.scale(flipX.value ? -1 : 1, flipY.value ? -1 : 1);
    ctx.drawImage(img, -img.width / 2, -img.height / 2);

    // Xuất ra file
    const link = document.createElement('a');
    link.download = `edited-image-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };
};

</script>

<template>
  <div class="editor-container">
    <!-- Header -->
    <div class="header">
      <div class="header-left">
        <h1>Image Editor</h1>
      </div>
      <div class="header-actions">
        <button class="primary-btn upload-btn" @click="triggerFileInput">
          <span class="icon">⬆️</span>
          Upload Image
        </button>
        <button 
          class="secondary-btn"
          :disabled="!editedImage"
          @click="downloadEditedImage"
        >
          <span class="icon">↓</span>
          Download
        </button>
      </div>
      
      <!-- Hidden file input -->
      <input
        ref="uploadRef"
        type="file"
        @change="handleFileSelect"
        accept="image/*"
        class="hidden-input"
      />
    </div>

    <!-- Tabs -->
    <div class="tabs">
      <button 
        v-for="tab in ['Adjust', 'Filters', 'Draw']" 
        :key="tab" 
        :class="['tab-btn', { active: activeTab === tab }]"
        @click="switchTab(tab)"
      >
        {{ tab }}
      </button>
    </div>

    <div class="editor-content">
      <!-- Sidebar -->
      <div class="sidebar">
        <!-- Adjust Tab Content -->
        <div v-if="activeTab === 'Adjust'" class="adjustment-controls">
          <div class="control-group">
            <label>Brightness</label>
            <input 
              type="range" 
              v-model="brightness" 
              min="0" 
              max="200"
            />
            <span>{{ brightness }}%</span>
          </div>

          <div class="control-group">
            <label>Contrast</label>
            <input 
              type="range" 
              v-model="contrast" 
              min="0" 
              max="200"
            />
            <span>{{ contrast }}%</span>
          </div>

          <div class="control-group">
            <label>Saturation</label>
            <input 
              type="range" 
              v-model="saturation" 
              min="0" 
              max="200"
            />
            <span>{{ saturation }}%</span>
          </div>
        </div>

        <div v-if="activeTab === 'Filters'" class="filter-controls">
        <button class="filter-btn" @click="applyFilter('bright')">Bright</button>
        <button class="filter-btn" @click="applyFilter('dark')">Dark</button>
        <button class="filter-btn" @click="applyFilter('vivid')">Vivid</button>
        <button class="filter-btn" @click="applyFilter('bw')">B&W</button>
        </div>



        <!-- Draw Tab Content -->
        <div v-if="activeTab === 'Draw'" class="drawing-controls">
<div class="tools">
  <button 
    v-for="tool in ['brush', 'rectangle', 'eraser']"
    :key="tool"
    :class="['tool-btn', { active: selectedTool === tool }]"
    @click="selectedTool = tool"
  >
    <span v-if="tool === 'brush'">✏️</span>
    <span v-else-if="tool === 'rectangle'">▭</span>
    <span v-else>⌫</span>
  </button>

  <!-- Nút đổi ngòi -->
  <button 
    class="tool-btn"
    @click="brushType = brushType === 'round' ? 'square' : 'round'"
    :title="`Brush tip: ${brushType}`"
  >
    {{ brushType === 'round' ? '○' : '□' }}
  </button>

  <!-- Undo/Redo buttons -->
  <button 
    class="tool-btn"
    @click="undo"
    :disabled="!canUndo"
    title="Undo"
  >
    ↩
  </button>
  <button 
    class="tool-btn"
    @click="redo"
    :disabled="!canRedo"
    title="Redo"
  >
    ↪
  </button>
</div>
          <div class="brush-settings">
            <label>Brush Size</label>
            <input 
              type="range" 
              v-model="brushSize" 
              min="1" 
              max="50"
            />
            <span>{{ brushSize }}px</span>

            <label>Color</label>
            <input 
              type="color" 
              v-model="brushColor"
            />
          </div>
        </div>

        <!-- Common Controls -->
        <div class="common-controls">
          <button class="reset-btn" @click="resetToOriginal">Reset to Original</button>
          <div class="transform-controls">
            <!-- slider for rotate -->
            <div class="rotate-slider">
              <label>Rotate</label>
              <input 
                type="range" 
                v-model="rotateAngle" 
                min="0" 
                max="360"
              />
              <span>{{ rotateAngle }}°</span>
            </div>
            <button class="transform-btn" @click="() => flipImage('x')">Flip X</button>
            <button class="transform-btn" @click="() => flipImage('y')">Flip Y</button>
          </div>
        </div>
      </div>

      <!-- Enhanced Canvas Area -->
        <div 
        class="canvas-area"
        :class="{ 'dragging': isDragging }"
        @dragover.prevent="isDragging = true"
        @dragleave.prevent="isDragging = false"
        @drop="handleFileDrop"
      >
        <div v-if="!editedImage" class="upload-placeholder">
          <div class="upload-icon">
            <span class="icon-large">⬆️</span>
          </div>
          <h3>Drop your image here</h3>
          <p>or</p>
          <button class="upload-btn-large" @click="triggerFileInput">
            Choose File
          </button>
          <p class="upload-hint">
            Supports: JPG, PNG, WebP (max 10MB)
          </p>
        </div>
        <div v-else-if="isLoading" class="loading-overlay">
          <div class="spinner"></div>
          <p>Processing...</p>
        </div>
        <template v-else>
          <div class="image-container">
            <!-- Preview image layer -->
            <img 
              v-if="activeTab !== 'Draw'"
              :src="editedImage" 
              :style="[{ filter: `${imageStyle.filter} ${currentFilter}` }, { transform: imageStyle.transform }]"
              alt="Editing preview"
              class="preview-image"
            />
            <!-- Drawing canvas layer -->
            <canvas
              v-if="activeTab === 'Draw'"
              ref="canvasRef"
              class="drawing-canvas"
              :style="[{ filter: `${imageStyle.filter} ${currentFilter}` }, { transform: imageStyle.transform }]"
              @mousedown.prevent="startDrawing" 
              @mousemove.prevent="draw"
              @mouseup.prevent="stopDrawing"
              @mouseleave.prevent="stopDrawing"
              @touchstart.prevent="startDrawing"
              @touchmove.prevent="draw"
              @touchend.prevent="stopDrawing"
              
            ></canvas>
          </div>
        </template>
      </div>
    </div>

    <!-- Error Display -->
    <div v-if="error" class="error-message">
      {{ error }}
    </div>
  </div>
</template>

<style scoped>
.editor-container {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: white;
}

.header {
  padding: 1rem 2rem;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
}

.header-left h1 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #18181B;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.primary-btn {
  background: #18181B;
  color: white;
  border: none;
  padding: 0.75rem 1.25rem;
  border-radius: 6px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  transition: background 0.2s;
}

.primary-btn:hover {
  background: #2c2c30;
}

.secondary-btn {
  background: white;
  border: 1px solid #e4e4e7;
  padding: 0.75rem 1.25rem;
  border-radius: 6px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
}

.secondary-btn:hover {
  background: #f4f4f5;
}

.secondary-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.hidden-input {
  display: none;
}

.tabs {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  background: #f5f5f5;
}

.tab-btn {
  padding: 0.75rem 1.5rem;
  border: none;
  background: transparent;
  cursor: pointer;
  border-radius: 6px;
  font-weight: 500;
  color: #4b5563;
  transition: all 0.2s;
}

.tab-btn.active {
  background: white;
  color: #18181B;
}

.editor-content {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.sidebar {
  width: 300px;
  padding: 1.5rem;
  border-right: 1px solid #eee;
  overflow-y: auto;
  background: white;
}

.control-group {
  margin-bottom: 1.5rem;
}

.control-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #374151;
}

.canvas-area {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8f9fa;
  transition: all 0.2s;
  padding: 2rem;
  position: relative;
}

.canvas-area.dragging {
  background: #e9ecef;
  border: 2px dashed #4263eb;
}

.upload-placeholder {
  text-align: center;
  color: #4b5563;
}

.icon-large {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.upload-btn-large {
  background: #18181B;
  color: white;
  border: none;
  padding: 1rem 2rem;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  margin: 1rem 0;
  cursor: pointer;
  transition: background 0.2s;
}

.upload-btn-large:hover {
  background: #2c2c30;
}

.upload-hint {
  color: #6b7280;
  font-size: 0.875rem;
  margin-top: 0.5rem;
}

.image-container {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
}

.preview-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.drawing-canvas {
  max-width: 100%;
  max-height: 100%;
  cursor: crosshair;
  /* Tạo pattern checkerboard để hiện vùng trong suốt */
  background-image: 
    linear-gradient(45deg, #f0f0f0 25%, transparent 25%), 
    linear-gradient(-45deg, #f0f0f0 25%, transparent 25%), 
    linear-gradient(45deg, transparent 75%, #f0f0f0 75%), 
    linear-gradient(-45deg, transparent 75%, #f0f0f0 75%);
  background-size: 20px 20px;
  background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
  image-rendering: pixelated;
}

.error-message {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  background: #fee2e2;
  color: #991b1b;
  padding: 1rem 1.5rem;
  border-radius: 6px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  z-index: 1000;
  animation: slideIn 0.3s ease-out;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #18181B;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.filter-btn {
  padding: 0.75rem 1.5rem;
  border: 1px solid #e4e4e7;
  border-radius: 6px;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 0.5rem;
  width: 100%;
}

.filter-btn:hover {
  background: #f4f4f5;
}

.tools {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

.tool-btn {
  width: 40px;
  height: 40px;
  border: 1px solid #e4e4e7;
  border-radius: 6px;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.tool-btn.active {
  background: #f4f4f5;
  border-color: #18181B;
}

.tool-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: #f4f4f5;
}

.brush-settings {
  margin-top: 1.5rem;
}

.brush-settings label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #374151;
}

.transform-controls {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
}

.transform-btn {
  flex: 1;
  padding: 0.75rem;
  border: 1px solid #e4e4e7;
  border-radius: 6px;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
}

.transform-btn:hover {
  background: #f4f4f5;
}

.reset-btn {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #e4e4e7;
  border-radius: 6px;
  background: white;
  color: #dc2626;
  cursor: pointer;
  transition: all 0.2s;
}

.reset-btn:hover {
  background: #fee2e2;
  border-color: #dc2626;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes slideIn {
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

/* Responsive Design */
@media (max-width: 768px) {
  .header {
    flex-direction: column;
    gap: 1rem;
    padding: 1rem;
  }

  .sidebar {
    width: 100%;
    max-width: none;
    border-right: none;
    border-bottom: 1px solid #eee;
  }

  .editor-content {
    flex-direction: column;
  }

  .canvas-area {
    height: 50vh;
  }
}

@media (max-width: 480px) {
  .header-actions {
    flex-direction: column;
    width: 100%;
  }

  .primary-btn,
  .secondary-btn {
    width: 100%;
  }

  .tabs {
    padding: 0.5rem;
  }

  .tab-btn {
    padding: 0.5rem 1rem;
  }
  .filter-controls {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(60px, 1fr));
  gap: 0.5rem;
}

.filter-preview {
  text-align: center;
  cursor: pointer;
  font-size: 0.75rem; /* chữ nhỏ gọn */
}

.preview-box {
  width: 50px;
  height: 50px;
  overflow: hidden;
  border: 1px solid #ddd;
  border-radius: 6px;
  margin: 0 auto 0.25rem;
}

.preview-box img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

}
</style>