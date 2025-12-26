<template>
  <div id="canvas-wrapper" class="canvas-stage">
    <!-- Render từng layer riêng lẻ, không dùng v-for -->
    <div
      v-for="(layer, index) in store.layers"
      :key="layer.id"
      class="layer-wrapper"
      :style="{ 
        zIndex: index,
        pointerEvents: layer.id === store.selectedId ? 'auto' : 'none',
        display: layer.visible ? 'block' : 'none'
      }"
    >
      <canvas
        :ref="el => handleCanvasRef(layer.id, el, index)"
        class="layer-canvas"
      ></canvas>
    </div>
  </div>
</template>

<script setup>
import { useCanvasStore } from '@/stores/canvasStore';

const store = useCanvasStore();

function handleCanvasRef(layerId, el, index) {
  if (!el) return;
  
  const isSelected = layerId === store.selectedId;
  const pointerEvents = isSelected ? 'auto' : 'none';
  
  console.log(`[Canvas Ref] ${layerId} (z-index: ${index})`);
  console.log(`  - Selected: ${isSelected}`);
  console.log(`  - pointer-events: ${pointerEvents}`);
  console.log(`  - Element:`, el);
  
  store.registerLayerCanvas(layerId, el);
}
</script>

<style scoped>
#canvas-wrapper {
  background-image: linear-gradient(45deg, #ccc 25%, transparent 25%),
                    linear-gradient(-45deg, #ccc 25%, transparent 25%),
                    linear-gradient(45deg, transparent 75%, #ccc 75%),
                    linear-gradient(-45deg, transparent 75%, #ccc 75%);
  background-size: 20px 20px;
  background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
  background-color: #fff;
  box-shadow: 0 0 10px rgba(0,0,0,0.5); 
  width: 800px; 
  height: 600px;
  position: relative;
}

/* CRITICAL: Wrapper cho mỗi layer */
.layer-wrapper {
  position: absolute !important;
  top: 0 !important;
  left: 0 !important;
  width: 800px !important;
  height: 600px !important;
}

/* Canvas bên trong */
.layer-canvas {
  display: block;
  width: 800px !important;
  height: 600px !important;
}

/* Style cho các element mà Fabric tạo ra */
#canvas-wrapper :deep(.canvas-container) {
  position: absolute !important;
  top: 0 !important;
  left: 0 !important;
  width: 800px !important;
  height: 600px !important;
}

#canvas-wrapper :deep(.lower-canvas),
#canvas-wrapper :deep(.upper-canvas) {
  position: absolute !important;
  top: 0 !important;
  left: 0 !important;
}
</style>