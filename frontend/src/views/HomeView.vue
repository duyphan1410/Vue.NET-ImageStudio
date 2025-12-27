<template>
  <div class="editor-layout">
    <Toolbar />
    <div class="main-content">
      <EditorCanvas />
    </div>
    <PropertiesPanel />
  </div>
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue';
import { useCanvasStore } from '@/stores/canvasStore';
import Toolbar from '@/components/Toolbar.vue';
import EditorCanvas from '@/components/EditorCanvas.vue';
import PropertiesPanel from '@/components/PropertiesPanel.vue';

const store = useCanvasStore();

// --- HÀM XỬ LÝ PHÍM TẮT ---
const handleKeyboard = (e) => {
  // Kiểm tra Ctrl (Window) hoặc Command (Mac) + Z
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
    e.preventDefault(); // Chặn hành động Undo mặc định của trình duyệt
    
    if (e.shiftKey) {
      // Ctrl + Shift + Z => Redo
      store.redo();
    } else {
      // Ctrl + Z => Undo
      store.undo();
    }
  }
};

onMounted(() => {
  store.initFirstLayer();

  // Đăng ký sự kiện phím tắt
  window.addEventListener('keydown', handleKeyboard);
});

onUnmounted(() => {
  // Dọn dẹp sự kiện khi thoát trang
  window.removeEventListener('keydown', handleKeyboard);
});
</script>

<style scoped>
.editor-layout {
  display: flex;
  height: 100%; /* Thay vì 100vh */
  width: 100%;
  background: #1e1e1e;
  color: #e0e0e0;
  overflow: hidden;
}

.main-content {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #2d2d2d;
  overflow: hidden; /* Không scroll */
  padding: 0; /* Bỏ padding */
  min-width: 0; /* Cho phép flex shrink */
}
</style>