<template>
  <div class="editor-container">
    <div class="toolbar">
      <button 
        v-for="tool in tools" 
        :key="tool.id"
        :class="['tool-btn', { active: store.activeTool === tool.id }]"
        @click="store.setTool(tool.id)"
        :title="tool.label"
      >
        {{ tool.icon }}
      </button>
      
      <div class="color-picker">
        <input 
            type="color" 
            :value="store.brushColor" 
            @input="e => store.updateBrushSettings(store.brushSize, e.target.value)" 
        />
      </div>
      
      <div class="brush-size" v-if="['brush', 'eraser'].includes(store.activeTool)">
        <label>Size: {{ store.brushSize }}</label>
        <input 
            type="range" 
            :value="store.brushSize" 
            @input="e => store.updateBrushSettings(Number(e.target.value), store.brushColor)"
            min="1" max="50" 
        />
      </div>
    </div>

    <div class="canvas-area">
        <EditorCanvas />
    </div>

    <div class="layer-panel">
      <div class="panel-header">
        <h3>Layers</h3>
        <button @click="store.addLayer()" class="add-layer-btn">➕</button>
      </div>

      <div class="layers-list">
        <div 
          v-for="(layer) in [...store.layers].reverse()" 
          :key="layer.id"
          :class="['layer-item', { active: layer.id === store.selectedId }]"
          @click="store.selectLayer(layer.id)"
          @contextmenu="openContextMenu($event, layer.id)"
        >
          <button class="visibility-btn" @click.stop="layer.visible = !layer.visible">
            {{ layer.visible ? '👁️' : '🚫' }}
          </button>
          
          <div class="layer-thumbnail">
             <canvas :ref="el => store.setThumbnailRef(layer.id, el)" width="40" height="40"></canvas>
          </div>
          
          <div class="layer-name">{{ layer.name }}</div>
          
          <button class="more-btn" @click.stop="toggleLayerMenu(layer.id)">⋮</button>

          <div v-if="layerMenuId === layer.id" class="layer-dropdown-menu" @click.stop>
            <!-- <button @click="store.duplicateActiveLayer(); closeMenus()">Duplicate Layer</button> -->
            <button @click="store.duplicateActiveLayer(); closeMenus()">Duplicate Layer</button>

            <button @click="store.reorderLayer(layer.id, 'top'); closeMenus()">Bring to Front</button>
            <button @click="store.reorderLayer(layer.id, 'bottom'); closeMenus()">Send to Back</button>
            <button @click="store.reorderLayer(layer.id, 'up'); closeMenus()">Bring Forward</button>
            <button @click="store.reorderLayer(layer.id, 'down')">Send Backward</button>
            
            <hr />
            <button @click="store.clearLayerContent(layer.id); closeMenus()">Clear Layer</button>
            <button @click="store.removeLayer(layer.id); closeMenus()" class="danger">Delete Layer</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { useCanvasStore } from '@/stores/canvasStore';
import EditorCanvas from '@/components/EditorCanvas.vue';

const store = useCanvasStore();

watch(
  () => [store.activeTool, store.selectedId, store.brushSize, store.brushColor], 
  () => {
    console.log(`[BUG_TRACE] 2. Watcher triggered in View. SelectedId: ${store.selectedId}`); // <--- LOG 2
    // Bất cứ khi nào UI thay đổi, ép Store apply lại tool
    if (store.activeFabric) {
       store.applyCurrentTool();
    }else {
       console.log(`[BUG_TRACE] ⚠️ Watcher skipped applyCurrentTool (ActiveFabric is null)`);
    }
  },
  { deep: true }
);

const tools = [
  { id: 'select', icon: '🖱️', label: 'Select' },
  { id: 'brush', icon: '🖌️', label: 'Brush' },
  { id: 'eraser', icon: '🧹', label: 'Eraser' },
  { id: 'rectangle', icon: '▭', label: 'Rectangle' },
  { id: 'circle', icon: '⭕', label: 'Circle' },
];

const layerMenuId = ref(null);

// UI Logic đơn giản cho menu
function toggleLayerMenu(id) {
  layerMenuId.value = layerMenuId.value === id ? null : id;
}

function closeMenus() {
  layerMenuId.value = null;
}

// Khởi tạo layer đầu tiên
onMounted(() => {
    store.initFirstLayer();
    // Click outside to close menu
    document.addEventListener('click', closeMenus);
});
</script>

<style scoped>
.editor-container { 
  display: flex; 
  height: 100vh; 
  background: #2c2c2c; 
  color: #fff; 
}

/* Toolbar */
.toolbar {
  width: 60px;
  background: #1a1a1a;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px 5px;
  gap: 5px;
  border-right: 1px solid #000;
}

.tool-btn {
  width: 45px;
  height: 45px;
  background: #2c2c2c;
  border: 1px solid #3c3c3c;
  border-radius: 4px;
  cursor: pointer;
  font-size: 20px;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tool-btn:hover {
  background: #3c3c3c;
}

.tool-btn.active {
  background: #0d7dd9;
  border-color: #0d7dd9;
}

.color-picker {
  margin-top: 10px;
  width: 45px;
  height: 45px;
}

.color-picker input {
  width: 100%;
  height: 100%;
  border: 2px solid #3c3c3c;
  border-radius: 4px;
  cursor: pointer;
}

.brush-size {
  margin-top: 15px;
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 5px;
}

.brush-size label {
  font-size: 10px;
  text-align: center;
  color: #ccc;
}

.brush-size input {
  width: 45px;
}

/* Canvas Area */
.canvas-area {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #2c2c2c;
  overflow: auto;
  padding: 20px;
}

#canvas-wrapper {
  background-image: linear-gradient(45deg, #ccc 25%, transparent 25%),
                    linear-gradient(-45deg, #ccc 25%, transparent 25%),
                    linear-gradient(45deg, transparent 75%, #ccc 75%),
                    linear-gradient(-45deg, transparent 75%, #ccc 75%);
  background-size: 20px 20px;
  background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
  background-color: #fff;

  /* Thêm cái này để canvas nổi lên */
  box-shadow: 0 0 10px rgba(0,0,0,0.5); 
  
  /* Đảm bảo wrapper ôm sát canvas (nếu canvas 800x600) */
  width: 800px; 
  height: 600px;
}

.canvas-stage {
  position: relative;
  width: 800px;
  height: 600px;
  background: transparent;
}

.layer-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

canvas {
  background-color: transparent;
}

/* Layer Panel */
.layer-panel {
  width: 280px;
  background: #1a1a1a;
  border-left: 1px solid #000;
  display: flex;
  flex-direction: column;
  position: relative;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 15px;
  border-bottom: 1px solid #3c3c3c;
}

.panel-header h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
}

.add-layer-btn {
  background: transparent;
  border: none;
  color: #fff;
  font-size: 18px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
}

.add-layer-btn:hover {
  background: #3c3c3c;
}

.layers-list {
  flex: 1;
  overflow-y: auto;
  padding: 5px;
}

.layer-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px;
  margin-bottom: 4px;
  background: #2c2c2c;
  border: 1px solid #3c3c3c;
  border-radius: 4px;
  cursor: pointer;
  position: relative;
  transition: background 0.2s;
}

.layer-item:hover {
  background: #3c3c3c;
}

.layer-item.active {
  background: #0d7dd9;
  border-color: #0d7dd9;
}

.visibility-btn {
  background: transparent;
  border: none;
  font-size: 16px;
  cursor: pointer;
  padding: 4px;
  flex-shrink: 0;
}

.layer-thumbnail {
  width: 40px;
  height: 40px;
  border: 1px solid #3c3c3c;
  border-radius: 2px;
  overflow: hidden;
  flex-shrink: 0;

  /* Thêm nền caro ở đây (giống canvas chính nhưng thu nhỏ) */
  background-image:
      linear-gradient(45deg, #ccc 25%, transparent 25%),
      linear-gradient(-45deg, #ccc 25%, transparent 25%),
      linear-gradient(45deg, transparent 75%, #ccc 75%),
      linear-gradient(-45deg, transparent 75%, #ccc 75%);
  background-size: 10px 10px; /* Size nhỏ hơn cho thumbnail */
  background-position: 0 0, 0 5px, 5px -5px, -5px 0px;
  background-color: #fff;
}

.layer-thumbnail canvas {
  display: block;
  width: 100%;
  height: 100%;
}

.layer-name {
  flex: 1;
  font-size: 13px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.more-btn {
  background: transparent;
  border: none;
  color: #fff;
  font-size: 20px;
  font-weight: bold;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 3px;
  flex-shrink: 0;
}

.more-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

/* Dropdown & Context Menu */
.layer-dropdown-menu,
.context-menu {
  position: absolute;
  background: #2c2c2c;
  border: 1px solid #3c3c3c;
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
  z-index: 1000;
  min-width: 180px;
  padding: 4px 0;
}

.layer-dropdown-menu {
  right: 0;
  top: 100%;
  margin-top: 4px;
}

.context-menu {
  position: fixed;
}

.layer-dropdown-menu button,
.context-menu button {
  width: 100%;
  background: transparent;
  border: none;
  color: #fff;
  padding: 8px 16px;
  text-align: left;
  cursor: pointer;
  font-size: 13px;
}

.layer-dropdown-menu button:hover,
.context-menu button:hover {
  background: #3c3c3c;
}

.layer-dropdown-menu button.danger,
.context-menu button.danger {
  color: #ff6b6b;
}

.layer-dropdown-menu hr,
.context-menu hr {
  border: none;
  border-top: 1px solid #3c3c3c;
  margin: 4px 0;
}
</style>