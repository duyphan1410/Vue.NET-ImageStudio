<template>
  <div class="properties-panel">
    <div class="panel-tabs">
      <button 
        :class="['tab-btn', { active: activeTab === 'layers' }]"
        @click="activeTab = 'layers'"
      >
        <Layers :size="20" stroke-width="1.5" />
        <span class="tab-label">Layers</span>
      </button>
      <button 
        :class="['tab-btn', { active: activeTab === 'properties' }]"
        @click="activeTab = 'properties'"
      >
        <Sliders :size="20" stroke-width="1.5" />
        <span class="tab-label">Properties</span>
      </button>
    </div>

    <div v-show="activeTab === 'layers'" class="tab-content">
      <div class="panel-header">
        <h3 class="panel-title">Layers</h3>
        <button @click="store.addLayer()" class="action-btn primary" title="Add new layer">
          <Plus :size="18" />
        </button>
      </div>

      <div class="layers-list">
        <div 
          v-for="(layer) in [...store.layers].reverse()" 
          :key="layer.id"
          :class="['layer-item', { 
            active: layer.id === store.selectedId,
            'has-menu': layerMenuId === layer.id 
          }]"
          @click="store.selectLayer(layer.id)"
        >
          <button 
            class="visibility-btn" 
            @click.stop="store.toggleLayerVisibility(layer.id)"
            :title="layer.visible ? 'Hide layer' : 'Show layer'"
          >
            <component 
              :is="layer.visible ? Eye : EyeOff" 
              :size="16" 
              :stroke-width="1.5"
            />
          </button>
          
          <div class="layer-thumbnail">
            <canvas :ref="el => store.setThumbnailRef(layer.id, el)" width="40" height="40"></canvas>
          </div>
          
          <div class="layer-info">
            <div class="layer-name">{{ layer.name }}</div>
          </div>
          
          <button 
            class="more-btn" 
            @click.stop="toggleLayerMenu(layer.id)"
            title="Layer options"
          >
            <MoreVertical :size="16" />
          </button>

          <transition name="dropdown">
            <div v-if="layerMenuId === layer.id" class="layer-dropdown-menu" @click.stop>
              <button @click="store.duplicateLayer(layer.id); closeMenus()" class="menu-item">
                <Copy :size="14" />
                <span>Duplicate</span>
              </button>
              
              <div class="menu-divider"></div>
              
              <button @click="store.reorderLayer(layer.id, 'top'); closeMenus()" class="menu-item">
                <ArrowUpToLine :size="14" />
                <span>Bring to Front</span>
              </button>
              <button @click="store.reorderLayer(layer.id, 'up'); closeMenus()" class="menu-item">
                <ArrowUp :size="14" />
                <span>Bring Forward</span>
              </button>
              <button @click="store.reorderLayer(layer.id, 'down'); closeMenus()" class="menu-item">
                <ArrowDown :size="14" />
                <span>Send Backward</span>
              </button>
              <button @click="store.reorderLayer(layer.id, 'bottom'); closeMenus()" class="menu-item">
                <ArrowDownToLine :size="14" />
                <span>Send to Back</span>
              </button>
              
              <div class="menu-divider"></div>
              
              <button @click="store.clearLayerContent(layer.id); closeMenus()" class="menu-item">
                <Eraser :size="14" />
                <span>Clear Content</span>
              </button>
              <button @click="store.removeLayer(layer.id); closeMenus()" class="menu-item danger">
                <Trash2 :size="14" />
                <span>Delete Layer</span>
              </button>
            </div>
          </transition>
        </div>
      </div>
    </div>

    <div v-show="activeTab === 'properties'" class="tab-content">
      <div class="panel-header">
        <h3 class="panel-title">Properties</h3>
      </div>

      <div class="properties-content">
        <div v-if="store.selectedId" class="property-group">
          <div class="property-section">
            <div class="section-header">Layer Settings</div>
            
            <div class="property-row">
              <label class="property-label">Name</label>
              <input 
                type="text" 
                class="property-input"
                :value="selectedLayer?.name"
                @input="e => updateLayerName(e.target.value)"
                placeholder="Layer name"
              />
            </div>

            <div class="property-row">
              <label class="property-label">Opacity</label>
              <div class="slider-control-mini">
                 <input 
                  type="range" 
                  class="custom-range"
                  min="0" max="100"
                  value="100" 
                  @input="console.log('Update opacity logic here')"
                />
                <span class="property-value">100%</span>
              </div>
            </div>
          </div>

          <div class="property-section">
            <div class="section-header">Transform</div>
            <div class="coming-soon">
              <Wrench :size="32" class="coming-soon-icon" />
              <p>Object properties coming soon</p>
            </div>
          </div>
        </div>

        <div v-else class="empty-state">
          <BoxSelect :size="48" class="empty-icon" stroke-width="1" />
          <p>Select a layer to view properties</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useCanvasStore } from '@/stores/canvasStore';

// 1. Import Lucide Icons
import { 
  Layers, Sliders, Plus, Eye, EyeOff, MoreVertical,
  Copy, ArrowUpToLine, ArrowUp, ArrowDown, ArrowDownToLine,
  Eraser, Trash2, BoxSelect, Wrench
} from 'lucide-vue-next';

const store = useCanvasStore();
const activeTab = ref('layers');
const layerMenuId = ref(null);

const selectedLayer = computed(() => 
  store.layers.find(l => l.id === store.selectedId)
);

function toggleLayerMenu(id) {
  layerMenuId.value = layerMenuId.value === id ? null : id;
}

function closeMenus() {
  layerMenuId.value = null;
}

function updateLayerName(name) {
  const layer = store.layers.find(l => l.id === store.selectedId);
  if (layer) {
    layer.name = name;
  }
}

function handleClickOutside(e) {
  if (!e.target.closest('.layer-dropdown-menu') && !e.target.closest('.more-btn')) {
    closeMenus();
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

<style scoped>
.properties-panel {
  width: 280px; /* Thu gọn lại một chút cho cân đối */
  background: #252525;
  border-left: 1px solid #1a1a1a;
  display: flex;
  flex-direction: column;
  box-shadow: -2px 0 8px rgba(0, 0, 0, 0.3);
  height: 100%; /* Full height */
}

/* Tabs */
.panel-tabs {
  display: flex;
  background: #1e1e1e;
  border-bottom: 1px solid #1a1a1a;
  flex-shrink: 0;
}

.tab-btn {
  flex: 1;
  padding: 12px 8px;
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  color: #666; /* Màu nhạt hơn khi chưa active */
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.tab-btn:hover {
  background: #252525;
  color: #aaa;
}

.tab-btn.active {
  color: #667eea;
  border-bottom-color: #667eea;
  background: #252525;
}

.tab-label {
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Tab Content */
.tab-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* Panel Header */
.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #333;
  background: #2d2d2d;
  flex-shrink: 0;
}

.panel-title {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  color: #e0e0e0;
  letter-spacing: 0.3px;
  text-transform: uppercase;
}

.action-btn {
  background: transparent;
  border: 1px solid #3a3a3a;
  color: #aaa;
  padding: 4px;
  width: 28px;
  height: 28px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-btn:hover {
  background: #3a3a3a;
  color: #fff;
  border-color: #555;
}

.action-btn.primary:hover {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-color: #667eea;
  color: #fff;
}

/* Layers List */
.layers-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.layer-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  background: #2d2d2d;
  border: 1px solid transparent; /* Viền ẩn để tránh nhảy layout */
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  transition: all 0.1s ease;
}

.layer-item:hover {
  background: #353535;
}

.layer-item.active {
  background: #3a3a3a;
  border-color: #555;
  box-shadow: inset 3px 0 0 #667eea; /* Marker bên trái chỉ thị active */
}

/* Các nút trong layer item */
.visibility-btn, .more-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 4px;
  color: #666;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
}

.visibility-btn:hover, .more-btn:hover {
  color: #e0e0e0;
  background: rgba(255,255,255,0.05);
}

.layer-thumbnail {
  width: 36px;
  height: 36px;
  border: 1px solid #444;
  border-radius: 4px;
  overflow: hidden;
  flex-shrink: 0;
  background-color: #fff;
  /* Checkerboard background */
  background-image:
    linear-gradient(45deg, #ccc 25%, transparent 25%),
    linear-gradient(-45deg, #ccc 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, #ccc 75%),
    linear-gradient(-45deg, transparent 75%, #ccc 75%);
  background-size: 8px 8px;
  background-position: 0 0, 0 4px, 4px -4px, -4px 0px;
}

.layer-thumbnail canvas {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.layer-info {
  flex: 1;
  min-width: 0;
}

.layer-name {
  font-size: 13px;
  font-weight: 500;
  color: #ccc;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.layer-item.active .layer-name {
  color: #fff;
}

/* Dropdown Menu */
.layer-dropdown-menu {
  position: absolute;
  right: 30px; /* Hiện bên trái nút 3 chấm */
  top: 30px;
  background: #1e1e1e;
  border: 1px solid #444;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
  z-index: 2000;
  min-width: 160px;
  padding: 4px;
}

.menu-item {
  width: 100%;
  background: transparent;
  border: none;
  color: #bbb;
  padding: 8px 10px;
  text-align: left;
  cursor: pointer;
  font-size: 12px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.menu-item:hover {
  background: #667eea;
  color: #fff;
}

.menu-item.danger:hover {
  background: #e53e3e;
}

.menu-divider {
  height: 1px;
  background: #333;
  margin: 4px 0;
}

/* Properties Tab Styles */
.properties-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.property-group {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.property-section {
  background: #2d2d2d;
  border: 1px solid #3a3a3a;
  border-radius: 6px;
  padding: 12px;
}

.section-header {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  color: #667eea;
  margin-bottom: 12px;
}

.property-row {
  margin-bottom: 12px;
}

.property-label {
  display: block;
  font-size: 12px;
  color: #888;
  margin-bottom: 6px;
}

.property-input {
  width: 100%;
  background: #1e1e1e;
  border: 1px solid #3a3a3a;
  color: #e0e0e0;
  padding: 6px 8px;
  border-radius: 4px;
  font-size: 13px;
}

.property-input:focus {
  outline: none;
  border-color: #667eea;
}

/* Slider Style (Tái sử dụng style đẹp) */
.slider-control-mini {
  display: flex;
  align-items: center;
  gap: 8px;
}

.custom-range {
  -webkit-appearance: none;
  flex: 1;
  height: 4px;
  background: #3a3a3a;
  border-radius: 2px;
  outline: none;
}

.custom-range::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 12px;
  height: 12px;
  background: #fff;
  border: 2px solid #667eea;
  border-radius: 50%;
  cursor: pointer;
}

.property-value {
  font-size: 12px;
  color: #aaa;
  width: 35px;
  text-align: right;
  font-family: monospace;
}

/* Empty State */
.empty-state, .coming-soon {
  text-align: center;
  padding: 40px 20px;
  color: #555;
}

.empty-icon, .coming-soon-icon {
  margin-bottom: 12px;
  opacity: 0.5;
  color: #667eea;
}

/* Scrollbar */
.layers-list::-webkit-scrollbar,
.properties-content::-webkit-scrollbar {
  width: 4px;
}

.layers-list::-webkit-scrollbar-thumb,
.properties-content::-webkit-scrollbar-thumb {
  background: #444;
  border-radius: 2px;
}
</style>