<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useCanvasStore } from '@/stores/canvasStore'; // Import store để gọi hàm export
import { exportWorkspace } from '@/services/ExportService'
import { useWorkspaceStore } from '@/stores/workspaceStore'
import { 
  Palette, 
  PencilRuler, 
  Scissors, 
  Paintbrush, 
  SlidersHorizontal, 
  Download, 
  Settings,
  FileImage, // Icon cho PNG/WebP
  Save       // Icon cho Save Project
} from 'lucide-vue-next';

// --- Logic Dropdown ---
const store = useCanvasStore();
const isExportMenuOpen = ref(false);
const exportMenuRef = ref(null);

const workspaceStore = useWorkspaceStore();

const toggleExportMenu = () => {
  isExportMenuOpen.value = !isExportMenuOpen.value;
};

const closeExportMenu = () => {
  isExportMenuOpen.value = false;
};

// Xử lý click ra ngoài để đóng menu
const handleClickOutside = (event) => {
  if (exportMenuRef.value && !exportMenuRef.value.contains(event.target)) {
    closeExportMenu();
  }
};

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});

const isExporting = ref(false)

async function handleExport(format) {
  console.log('=== EXPORT DEBUG START ===');
  console.log('Format requested:', format);
  console.log('workspaceStore.ready:', workspaceStore.ready);
  console.log('workspaceStore.activeType:', workspaceStore.activeType);
  console.log('workspaceStore.payloadGetter:', typeof workspaceStore.payloadGetter);

  if (!workspaceStore.ready) {
    console.warn('❌ Workspace not ready yet');
    console.log('activeType:', workspaceStore.activeType);
    console.log('payloadGetter:', workspaceStore.payloadGetter);
    return;
  }

  // Test payload
  try {

    const testData = workspaceStore.payloadGetter();
    if (workspaceStore.activeType === 'editor') {
      console.log('Editor payload:', {
        width: testData.width,
        height: testData.height,
        dpi: testData.dpi
      })
    } else if (workspaceStore.activeType === 'remove-bg') {
      console.log('RemoveBG payload:', {
        hasResultImage: !!testData.resultImage
      })
    }

  } catch (err) {
    console.error('❌ Payload test failed:', err);
  }

  try {
    await exportWorkspace(workspaceStore, format);
    closeExportMenu();
    console.log('✅ Export success');
  } catch (err) {
    console.error('❌ Export failed:', err.message);
  }
}

</script>

<template>
  <div id="app-root">
    <header class="app-header">
      <div class="header-left">
        <div class="app-brand">
          <Palette class="brand-icon" :size="24" />
          <span class="brand-name">ImageStudio</span>
        </div>
        
        <nav class="main-nav">
          <router-link to="/" class="nav-link">
            <PencilRuler :size="18" />
            <span class="nav-text">Editor</span>
          </router-link>
          
          <router-link to="/remove-bg" class="nav-link">
            <Scissors :size="18" />
            <span class="nav-text">Remove BG</span>
          </router-link>
          
          <router-link to="/paint-image" class="nav-link">
            <Paintbrush :size="18" />
            <span class="nav-text">Paint</span>
          </router-link>
          
          <router-link to="/adjust-image" class="nav-link">
            <SlidersHorizontal :size="18" />
            <span class="nav-text">Adjust</span>
          </router-link>
        </nav>
      </div>

      <div class="header-right">
        <div class="export-wrapper" ref="exportMenuRef">
          <button 
            class="header-btn" 
            :class="{ active: isExportMenuOpen }"
            @click="toggleExportMenu" 
            title="Export Options"
          >
            <Download :size="20" />
          </button>

          <transition name="fade">
            <div v-if="isExportMenuOpen" class="export-dropdown">
              <div class="dropdown-header">Export As</div>
              
              <button class="dropdown-item" :disabled="!workspaceStore.ready" @click="handleExport('png')">
                <FileImage :size="16" />
                <span>Export PNG</span>
              </button>
              
              <button class="dropdown-item" @click="handleExport('webp')">
                <FileImage :size="16" />
                <span>Export WebP</span>
              </button>
              
              <div class="dropdown-divider"></div>
              
              <button class="dropdown-item disabled" disabled title="Coming soon">
                <Save :size="16" />
                <span>Save Project</span>
                <span class="badge-soon">Soon</span>
              </button>
            </div>
          </transition>
        </div>

        <button class="header-btn" title="Settings">
          <Settings :size="20" />
        </button>
      </div>
    </header>

    <main class="main-content">
      <router-view></router-view>
    </main>
  </div>
</template>

<style>
/* --- Global Reset & Base Styles (Giữ nguyên) --- */
* { box-sizing: border-box; margin: 0; padding: 0; }

html, body {
  margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
}

#app { width: 100vw; height: 100vh; overflow: hidden; background: #1e1e1e; }
#app-root { width: 100%; height: 100%; display: flex; flex-direction: column; overflow: hidden; }

/* --- App Header --- */
.app-header {
  height: 48px;
  min-height: 48px;
  background: #1a1a1a;
  border-bottom: 1px solid #2d2d2d;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  z-index: 1000;
}

.header-left { display: flex; align-items: center; gap: 24px; }

.app-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  padding-right: 24px;
  border-right: 1px solid #2d2d2d;
  color: #667eea;
}

.brand-icon { color: #667eea; }

.brand-name {
  font-size: 16px;
  font-weight: 700;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: -0.5px;
}

.main-nav { display: flex; gap: 4px; }

.nav-link {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-radius: 6px;
  text-decoration: none;
  color: #aaa;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.nav-link:hover { background: #2d2d2d; color: #e0e0e0; }

.nav-link.router-link-exact-active {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.15) 0%, rgba(118, 75, 162, 0.15) 100%);
  color: #667eea;
  font-weight: 600;
}

.header-right { display: flex; align-items: center; gap: 8px; }

.header-btn {
  width: 36px;
  height: 36px;
  background: transparent;
  border: 1px solid #2d2d2d;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #aaa;
  position: relative; /* Để dropdown căn theo nút */
}

.header-btn:hover, .header-btn.active {
  background: #2d2d2d;
  border-color: #3a3a3a;
  color: #fff;
}

/* --- EXPORT DROPDOWN STYLES (MỚI) --- */
.export-wrapper {
  position: relative;
}

.export-dropdown {
  position: absolute;
  top: calc(100% + 8px); /* Cách nút một chút */
  right: 0;
  background: #252525;
  border: 1px solid #3a3a3a;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
  min-width: 180px;
  padding: 6px;
  z-index: 2000;
  transform-origin: top right;
}

.dropdown-header {
  font-size: 11px;
  font-weight: 600;
  color: #666;
  text-transform: uppercase;
  padding: 8px 10px 4px 10px;
  letter-spacing: 0.5px;
}

.dropdown-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  background: transparent;
  border: none;
  color: #e0e0e0;
  font-size: 13px;
  cursor: pointer;
  border-radius: 6px;
  text-align: left;
  transition: all 0.2s;
}

.dropdown-item:hover:not(.disabled) {
  background: #3a3a3a;
  color: #fff;
}

.dropdown-item.disabled {
  opacity: 0.5;
  cursor: not-allowed;
  color: #888;
  justify-content: space-between; /* Để đẩy chữ Soon sang phải */
}

.dropdown-divider {
  height: 1px;
  background: #3a3a3a;
  margin: 4px 0;
}

.badge-soon {
  font-size: 9px;
  background: #333;
  color: #888;
  padding: 2px 6px;
  border-radius: 4px;
  border: 1px solid #444;
}

/* Animation Dropdown */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.main-content {
  flex: 1;
  width: 100%;
  height: calc(100vh - 48px);
  overflow: hidden;
  position: relative;
}

/* Responsive */
@media (max-width: 768px) {
  .brand-name { display: none; }
  .nav-text { display: none; }
  .nav-link { padding: 8px; }
  .app-brand { padding-right: 16px; }
  .main-nav { gap: 4px; }
}

@media (max-width: 480px) {
  .app-header { padding: 0 12px; }
  .header-left { gap: 12px; }
  .header-btn { width: 32px; height: 32px; }
}

div, p, h1, h2, h3, h4, h5, h6, span, button, input { color: inherit; }
</style>