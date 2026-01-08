<template>
  <div class="properties-panel">
    <!-- Tabs -->
    <div class="panel-tabs">
      <button 
        :class="['tab-btn', { active: activeTab === 'layers' }]"
        @click="activeTab = 'layers'"
      >
        <span class="tab-icon">📚</span>
        <span class="tab-label">Layers</span>
      </button>
      <button 
        :class="['tab-btn', { active: activeTab === 'properties' }]"
        @click="activeTab = 'properties'"
      >
        <span class="tab-icon">⚙️</span>
        <span class="tab-label">Properties</span>
      </button>
    </div>

    <!-- Layers Tab -->
    <div v-show="activeTab === 'layers'" class="tab-content">
      <div class="panel-header">
        <h3 class="panel-title">Layers</h3>
        <button @click="store.addLayer()" class="action-btn primary" title="Add new layer">
          <span>➕</span>
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
            {{ layer.visible ? '👁️' : '👁️‍🗨️' }}
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
            ⋮
          </button>

          <!-- Dropdown Menu -->
          <transition name="dropdown">
            <div v-if="layerMenuId === layer.id" class="layer-dropdown-menu" @click.stop>
              <button @click="store.duplicateActiveLayer(); closeMenus()" class="menu-item">
                <span class="menu-icon">📋</span>
                <span>Duplicate Layer</span>
              </button>
              
              <div class="menu-divider"></div>
              
              <button @click="store.reorderLayer(layer.id, 'top'); closeMenus()" class="menu-item">
                <span class="menu-icon">⬆️</span>
                <span>Bring to Front</span>
              </button>
              <button @click="store.reorderLayer(layer.id, 'up'); closeMenus()" class="menu-item">
                <span class="menu-icon">🔼</span>
                <span>Bring Forward</span>
              </button>
              <button @click="store.reorderLayer(layer.id, 'down'); closeMenus()" class="menu-item">
                <span class="menu-icon">🔽</span>
                <span>Send Backward</span>
              </button>
              <button @click="store.reorderLayer(layer.id, 'bottom'); closeMenus()" class="menu-item">
                <span class="menu-icon">⬇️</span>
                <span>Send to Back</span>
              </button>
              
              <div class="menu-divider"></div>
              
              <button @click="store.clearLayerContent(layer.id); closeMenus()" class="menu-item">
                <span class="menu-icon">🗑️</span>
                <span>Clear Layer</span>
              </button>
              <button @click="store.removeLayer(layer.id); closeMenus()" class="menu-item danger">
                <span class="menu-icon">❌</span>
                <span>Delete Layer</span>
              </button>
            </div>
          </transition>
        </div>
      </div>
    </div>

    <!-- Properties Tab -->
    <div v-show="activeTab === 'properties'" class="tab-content">
      <div class="panel-header">
        <h3 class="panel-title">Properties</h3>
      </div>

      <div class="properties-content">
        <div v-if="store.selectedId" class="property-group">
          <div class="property-section">
            <div class="section-header">Layer</div>
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
              <div class="property-control">
                <input 
                  type="range" 
                  class="property-slider"
                  min="0" 
                  max="100"
                  value="100"
                />
                <span class="property-value">100%</span>
              </div>
            </div>
          </div>

          <!-- Future: Object properties will go here -->
          <div class="property-section">
            <div class="section-header">Transform</div>
            <div class="coming-soon">
              <span>🚧</span>
              <p>Object properties coming soon</p>
            </div>
          </div>
        </div>

        <div v-else class="empty-state">
          <span class="empty-icon">📋</span>
          <p>Select a layer or object to view properties</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useCanvasStore } from '@/stores/canvasStore';

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
  width: 320px;
  background: #252525;
  border-left: 1px solid #1a1a1a;
  display: flex;
  flex-direction: column;
  box-shadow: -2px 0 8px rgba(0, 0, 0, 0.3);
}

/* Tabs */
.panel-tabs {
  display: flex;
  background: #1e1e1e;
  border-bottom: 1px solid #1a1a1a;
}

.tab-btn {
  flex: 1;
  padding: 14px 8px;
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  color: #888;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.tab-btn:hover {
  background: #252525;
  color: #e0e0e0;
}

.tab-btn.active {
  color: #667eea;
  border-bottom-color: #667eea;
  background: #252525;
}

.tab-icon {
  font-size: 20px;
}

.tab-label {
  font-size: 11px;
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
  padding: 16px 20px;
  border-bottom: 1px solid #1a1a1a;
  background: #2d2d2d;
}

.panel-title {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #e0e0e0;
  letter-spacing: 0.3px;
}

.action-btn {
  background: transparent;
  border: 1px solid #3a3a3a;
  color: #e0e0e0;
  padding: 6px 10px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 16px;
}

.action-btn:hover {
  background: #3a3a3a;
  border-color: #4a4a4a;
}

.action-btn.primary:hover {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-color: #667eea;
}

/* Layers List */
.layers-list {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
}

.layer-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  margin-bottom: 6px;
  background: #2d2d2d;
  border: 1px solid #3a3a3a;
  border-radius: 8px;
  cursor: pointer;
  position: relative;
  transition: all 0.2s ease;
}

.layer-item:hover {
  background: #353535;
  border-color: #4a4a4a;
  transform: translateX(-2px);
}

.layer-item.active {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.2) 0%, rgba(118, 75, 162, 0.2) 100%);
  border-color: #667eea;
  box-shadow: 0 0 12px rgba(102, 126, 234, 0.2);
}

.visibility-btn {
  background: transparent;
  border: none;
  font-size: 18px;
  cursor: pointer;
  padding: 4px;
  flex-shrink: 0;
  opacity: 0.6;
  transition: all 0.2s;
}

.visibility-btn:hover {
  opacity: 1;
  transform: scale(1.1);
}

.layer-thumbnail {
  width: 44px;
  height: 44px;
  border: 1px solid #3a3a3a;
  border-radius: 6px;
  overflow: hidden;
  flex-shrink: 0;
  background-image:
    linear-gradient(45deg, #ccc 25%, transparent 25%),
    linear-gradient(-45deg, #ccc 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, #ccc 75%),
    linear-gradient(-45deg, transparent 75%, #ccc 75%);
  background-size: 8px 8px;
  background-position: 0 0, 0 4px, 4px -4px, -4px 0px;
  background-color: #fff;
}

.layer-thumbnail canvas {
  display: block;
  width: 100%;
  height: 100%;
}

.layer-info {
  flex: 1;
  min-width: 0;
}

.layer-name {
  font-size: 13px;
  font-weight: 500;
  color: #e0e0e0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.more-btn {
  background: transparent;
  border: none;
  color: #888;
  font-size: 20px;
  font-weight: bold;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  flex-shrink: 0;
  transition: all 0.2s;
}

.more-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #e0e0e0;
}

/* Dropdown Menu */
.layer-dropdown-menu {
  position: absolute;
  right: 8px;
  top: 100%;
  margin-top: 4px;
  background: #2d2d2d;
  border: 1px solid #3a3a3a;
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
  z-index: 1001;
  min-width: 200px;
  padding: 6px;
  overflow: hidden;
  pointer-events: auto; /* Đảm bảo menu luôn có pointer events */
}

/* Khi có menu mở, disable hover cho tất cả layers khác */
.layers-list:has(.layer-dropdown-menu) .layer-item:not(:has(.layer-dropdown-menu)) {
  pointer-events: none;
}

.layers-list:has(.layer-dropdown-menu) .layer-item:not(:has(.layer-dropdown-menu)):hover {
  background: #2d2d2d;
  border-color: #3a3a3a;
  transform: none;
}

/* Layer có menu đang mở vẫn giữ z-index cao */
.layer-item.has-menu {
  z-index: 1002;
  position: relative;
}

.menu-item {
  width: 100%;
  background: transparent;
  border: none;
  color: #e0e0e0;
  padding: 10px 12px;
  text-align: left;
  cursor: pointer;
  font-size: 13px;
  border-radius: 4px;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 10px;
}

.menu-item:hover {
  background: #3a3a3a;
}

.menu-item.danger {
  color: #ff6b6b;
}

.menu-item.danger:hover {
  background: rgba(255, 107, 107, 0.1);
}

.menu-icon {
  font-size: 14px;
  opacity: 0.8;
}

.menu-divider {
  height: 1px;
  background: #3a3a3a;
  margin: 6px 0;
}

/* Dropdown Animation */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

/* Properties Content */
.properties-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.property-group {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.property-section {
  background: #2d2d2d;
  border: 1px solid #3a3a3a;
  border-radius: 8px;
  padding: 16px;
}

.section-header {
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  color: #888;
  letter-spacing: 0.5px;
  margin-bottom: 12px;
}

.property-row {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 12px;
}

.property-row:last-child {
  margin-bottom: 0;
}

.property-label {
  font-size: 12px;
  color: #aaa;
  font-weight: 500;
}

.property-input {
  background: #252525;
  border: 1px solid #3a3a3a;
  color: #e0e0e0;
  padding: 8px 10px;
  border-radius: 6px;
  font-size: 13px;
  transition: all 0.2s;
}

.property-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.property-control {
  display: flex;
  align-items: center;
  gap: 10px;
}

.property-slider {
  flex: 1;
  height: 4px;
  -webkit-appearance: none;
  appearance: none;
  background: #3a3a3a;
  border-radius: 2px;
  outline: none;
}

.property-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 14px;
  height: 14px;
  background: #667eea;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s;
}

.property-slider::-webkit-slider-thumb:hover {
  background: #764ba2;
  transform: scale(1.2);
}

.property-value {
  font-size: 12px;
  color: #aaa;
  font-weight: 500;
  min-width: 40px;
  text-align: right;
}

.coming-soon {
  text-align: center;
  padding: 30px 20px;
  color: #666;
}

.coming-soon span {
  font-size: 40px;
  display: block;
  margin-bottom: 12px;
}

.coming-soon p {
  font-size: 13px;
  margin: 0;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #666;
}

.empty-icon {
  font-size: 48px;
  display: block;
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-state p {
  font-size: 13px;
  margin: 0;
  line-height: 1.5;
}

/* Scrollbar */
.layers-list::-webkit-scrollbar,
.properties-content::-webkit-scrollbar {
  width: 6px;
}

.layers-list::-webkit-scrollbar-track,
.properties-content::-webkit-scrollbar-track {
  background: #1e1e1e;
}

.layers-list::-webkit-scrollbar-thumb,
.properties-content::-webkit-scrollbar-thumb {
  background: #3a3a3a;
  border-radius: 3px;
}

.layers-list::-webkit-scrollbar-thumb:hover,
.properties-content::-webkit-scrollbar-thumb:hover {
  background: #4a4a4a;
}
</style>