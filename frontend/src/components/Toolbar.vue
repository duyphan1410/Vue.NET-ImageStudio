<template>
  <div class="toolbar">
    <template v-for="section in toolSections" :key="section.id">
      <div class="toolbar-section">
        <div class="section-label">{{ section.label }}</div>
        <div class="tool-group">
          <button 
            v-for="item in section.items"
            :key="item.id"
            :class="['tool-btn', { active: isToolActive(item.id) }]"
            :disabled="item.disabled"
            @click="handleItemClick(item)"
            :title="item.label"
          >
            <component :is="item.icon" :size="20" stroke-width="1.5" />
          </button>
        </div>
      </div>
    </template>

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

    <div class="toolbar-section" v-if="showSizeControl">
      <div class="section-label">Size</div>
      
      <div class="slider-control">
        <div class="brush-preview-box">
          <div 
            class="brush-preview-circle"
            :style="{ 
              width: store.brushSize + 'px', 
              height: store.brushSize + 'px',
              backgroundColor: store.brushColor 
            }"
          ></div>
        </div>

        <div class="range-wrapper">
          <input 
            type="range" 
            :value="store.brushSize" 
            @input="e => store.updateBrushSettings(Number(e.target.value), store.brushColor)"
            min="1" max="50"
            class="custom-range"
          />
        </div>

        <span class="size-badge">{{ store.brushSize }} px</span>
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
import { ref, computed } from 'vue';
import { useCanvasStore } from '@/stores/canvasStore';
import { 
  MousePointer2, Brush, Eraser, Image as ImageIcon, 
  Square, Circle, Undo2, Redo2 
} from 'lucide-vue-next';

const store = useCanvasStore();
const fileInputRef = ref(null);

// --- 1. CONFIG DATA (Linh động toàn bộ ở đây) ---
// Dùng computed để trạng thái disabled của Undo/Redo tự cập nhật
const toolSections = computed(() => [
  {
    id: 'drawing',
    label: 'Tools',
    items: [
      { id: 'select', icon: MousePointer2, label: 'Select (V)', type: 'tool' },
      { id: 'brush', icon: Brush, label: 'Brush (B)', type: 'tool' },
      { id: 'eraser', icon: Eraser, label: 'Eraser (E)', type: 'tool' },
      { id: 'image', icon: ImageIcon, label: 'Add Image (I)', type: 'action', action: triggerFileInput },
    ]
  },
  {
    id: 'shapes',
    label: 'Shapes',
    items: [
      { id: 'rectangle', icon: Square, label: 'Rectangle (R)', type: 'tool' },
      { id: 'circle', icon: Circle, label: 'Circle (C)', type: 'tool' },
    ]
  },
  {
    id: 'history',
    label: 'History',
    items: [
      { 
        id: 'undo', icon: Undo2, label: 'Undo (Ctrl+Z)', type: 'action', 
        action: () => store.undo(), 
        disabled: store.historyIndex <= 0 
      },
      { 
        id: 'redo', icon: Redo2, label: 'Redo (Ctrl+Y)', type: 'action', 
        action: () => store.redo(), 
        disabled: store.historyIndex >= store.historyStack.length - 1 
      },
    ]
  }
]);

// --- 2. LOGIC XỬ LÝ ---

// Kiểm tra tool nào đang active để tô màu nút
const isToolActive = (id) => store.activeTool === id;

// Kiểm tra khi nào hiện thanh trượt Size
const showSizeControl = computed(() => 
  ['brush', 'eraser', 'rectangle', 'circle'].includes(store.activeTool)
);

// Hàm xử lý click chung cho mọi nút
const handleItemClick = (item) => {
  if (item.type === 'tool') {
    store.setTool(item.id);
  } else if (item.type === 'action' && item.action) {
    item.action();
  }
};

// Logic upload ảnh
const triggerFileInput = () => fileInputRef.value.click();

const handleFileChange = async (event) => {
  const file = event.target.files[0];
  if (file && file.type.match('image.*')) {
    await store.addImage(file);
  }
  event.target.value = '';
};
</script>

<style scoped>
/* 1. KHUNG CHÍNH TOOLBAR */
.toolbar {
  width: 68px; 
  background: #1e1e1e; /* Màu nền tối hơn chút cho giống các app đồ họa xịn */
  border-right: 1px solid #333;
  display: flex;
  flex-direction: column;
  padding: 12px 0;
  gap: 8px;
  height: 100%;
  overflow-y: auto; /* Cho phép cuộn nếu màn hình thấp */
  overflow-x: hidden;
  align-items: center; /* QUAN TRỌNG: Căn giữa tất cả mọi thứ */
}

/* 2. CÁC PHẦN SECTION */
.toolbar-section {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-bottom: 8px;
  border-bottom: 1px solid #2a2a2a; /* Đường kẻ mờ hơn */
}

.toolbar-section:last-child {
  border-bottom: none;
}

.section-label {
  font-size: 9px; /* Nhỏ lại chút cho tinh tế */
  font-weight: 700;
  text-transform: uppercase;
  color: #666;
  margin-bottom: 6px;
  text-align: center;
  letter-spacing: 0.5px;
}

/* 3. NHÓM NÚT BẤM */
.tool-group {
  display: flex;
  flex-direction: column;
  gap: 8px; /* Khoảng cách giữa các nút */
  width: 100%;
  align-items: center;
}

.tool-btn {
  width: 40px;  /* Giảm xuống 40px nhìn sẽ gọn gàng hơn */
  height: 40px;
  background: #2a2a2a; /* Màu nền nút nhạt hơn nền toolbar chút */
  border: 1px solid transparent; /* Viền ẩn */
  border-radius: 6px; /* Bo góc mềm mại hơn */
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  color: #a0a0a0;
  position: relative;
}

/* Hover effect */
.tool-btn:hover:not(:disabled) {
  background: #3a3a3a;
  color: #fff;
  transform: translateY(-1px); /* Nhấc nhẹ nút lên */
}

/* Active effect */
.tool-btn.active {
  background: #667eea; /* Màu tím chủ đạo */
  color: #fff;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3); /* Bóng đổ tím */
}

.tool-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
  background: transparent;
}

/* 4. COLOR PICKER */
.color-picker-wrapper {
  width: 40px;
  height: 40px;
  border-radius: 50%; /* Hình tròn cho đẹp */
  overflow: hidden;
  border: 2px solid #3a3a3a;
  cursor: pointer;
  transition: transform 0.2s;
}

.color-picker-wrapper:hover {
  transform: scale(1.1);
  border-color: #fff;
}

.color-input {
  width: 150%; /* Hack để che cái icon mặc định của input color */
  height: 150%;
  margin: -25%;
  cursor: pointer;
  border: none;
  padding: 0;
}

.slider-control {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  width: 100%;
}

/* 1. Phần xem trước kích thước (Preview Box) */
.brush-preview-box {
  width: 44px; 
  height: 44px;
  border: 1px dashed #444; /* Viền đứt nét để định hình khung */
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #1e1e1e; /* Màu nền tối hơn toolbar chút */
  margin-bottom: 4px;
}

.brush-preview-circle {
  border-radius: 50%;
  box-shadow: 0 0 2px rgba(255,255,255,0.2); /* Bóng nhẹ cho dễ nhìn nếu màu đen */
  transition: all 0.1s ease; /* Hiệu ứng mượt khi kéo */
}

/* 2. Style thanh trượt (Custom Range Input) */
.range-wrapper {
  width: 100%;
  padding: 0 4px;
  box-sizing: border-box;
}

.custom-range {
  -webkit-appearance: none; /* Tắt giao diện mặc định */
  width: 100%;
  height: 4px;
  background: #444;
  border-radius: 2px;
  outline: none;
  cursor: pointer;
}

/* Style cho cục trượt (Thumb) - Webkit (Chrome/Edge/Safari) */
.custom-range::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #fff; /* Màu trắng nổi bật */
  border: 2px solid #667eea; /* Viền tím */
  box-shadow: 0 2px 4px rgba(0,0,0,0.3);
  margin-top: -4.5px; /* Căn giữa theo chiều dọc */
  transition: transform 0.1s;
}

.custom-range:active::-webkit-slider-thumb {
  transform: scale(1.2); /* Phóng to nhẹ khi đang kéo */
  background: #667eea;
}

/* Style cho cục trượt (Thumb) - Firefox */
.custom-range::-moz-range-thumb {
  width: 14px;
  height: 14px;
  border: 2px solid #667eea;
  border-radius: 50%;
  background: #fff;
  cursor: pointer;
}

.size-badge {
  font-size: 10px;
  color: #888;
  background: #1a1a1a;
  padding: 2px 6px;
  border-radius: 4px;
  border: 1px solid #333;
  min-width: 32px;
  text-align: center;
}

/* Scrollbar tinh tế */
.toolbar::-webkit-scrollbar {
  width: 4px;
}

.toolbar::-webkit-scrollbar-track {
  background: transparent;
}

.toolbar::-webkit-scrollbar-thumb {
  background: #444;
  border-radius: 4px;
}

.toolbar::-webkit-scrollbar-thumb:hover {
  background: #555;
}
</style>