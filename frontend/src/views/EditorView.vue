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
import { onMounted, onUnmounted, nextTick  } from 'vue';
import { useCanvasStore } from '@/stores/canvasStore';
import { useWorkspaceStore} from '@/stores/workspaceStore';
import Toolbar from '@/components/Editor/Toolbar.vue';
import EditorCanvas from '@/components/Editor/EditorCanvas.vue';
import PropertiesPanel from '@/components/Editor/PropertiesPanel.vue';

const store = useCanvasStore();

const workspaceStore = useWorkspaceStore()

// Xử lý phím tắt
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

// Khi bấm nút Export trên Header

onMounted(async () => {

  await nextTick()

  store.initFirstLayer();

  // Đăng ký sự kiện phím tắt
  window.addEventListener('keydown', handleKeyboard);

  if (!store.width || !store.height) {
      console.error('Invalid canvas dimensions')
      return
  }
  console.log('[Editor] Setting workspace:', {
    layers: store.layers.length,
    width: store.width,
    height: store.height
  })

  workspaceStore.setWorkspace('editor', () => {
    return {
      layers: store.layers.map(layer => ({
        id: layer.id,
        name: layer.name,
        visible: layer.visible,
        fabric: layer.fabric, // Truyền luôn fabric instance
        canvasEl: layer.canvasEl // Backup nếu cần
      })),
      width: store.width,
      height: store.height,
      dpi: store.dpi || 2
    }
  })
  console.log('[Editor] Workspace set. Ready:', workspaceStore.ready)
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