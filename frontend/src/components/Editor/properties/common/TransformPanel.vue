<script setup>
import { ref, computed, watch,onMounted, onBeforeUnmount } from 'vue';
import { useCanvasStore } from '@/stores/canvasStore';
import { Lock, LockOpen } from 'lucide-vue-next';
import { Link, Link2Off } from 'lucide-vue-next';


const store = useCanvasStore();
const activeObj = computed(() => store.selectedObject);

const isLocked = computed({
  get: () => store.isLocked,
  set: (val) => {
    const obj = store.activeFabric?.getActiveObject();
    store.applyLock(obj, val);
  }
});

const posX = ref(0);
const posY = ref(0);
const width = ref(0);
const height = ref(0);
const rotation = ref(0);
// const isLocked = ref(false);
const lockRatio = ref(false);
const originalRatio = ref(1);

const showValueInput = ref(false);

const toggleValueInput = () => {
  if (isLocked.value) return;
  showValueInput.value = !showValueInput.value;
};

let boundObj = null;

const getLockState = (obj) => {
  if (!obj) return false;
  return obj.lockMovementX && obj.lockMovementY;
};

const normalizeAngle = (angle = 0) => {
  let a = angle % 360;
  if (a < 0) a += 360;
  return a;
};

function normalizeObjectOrigin(obj) {
  if (obj.type === 'path') return;
  if (!obj || obj.originX === 'center') return;
  if (obj.__originNormalized) return;

  const center = obj.getCenterPoint();

  obj.set({
    originX: 'center',
    originY: 'center',
    left: center.x,
    top: center.y,
  });

  obj.setCoords();
  obj.__originNormalized = true;
}


watch([posX, posY], ([x, y]) => {
  const obj = activeObj.value;
  if (!obj) return;

  if (obj.__isTransforming) return;

  obj.set({
    left: x,
    top: y,
  });

  obj.setCoords();
  store.activeFabric.requestRenderAll();
});


let rafId = null;

function syncThrottled(obj) {
  if (rafId) return;

  rafId = requestAnimationFrame(() => {
    rafId = null;
    syncFromObject(obj);
  });
}


const syncFromObject = (obj, { final = false } = {}) => {
  if (!obj) return;

  posX.value = Math.round(obj.left);
  posY.value = Math.round(obj.top);

  if (final) {
    const w = obj.getScaledWidth();
    const h = obj.getScaledHeight();

    width.value = Math.round(w);
    height.value = Math.round(h);

    if (w && h) {
      originalRatio.value = w / h;
    }
  }

  if (final || obj.angle !== rotation.value) {
    rotation.value = normalizeAngle(obj.angle || 0);
  }

  if (final) {
    isLocked.value = getLockState(obj);
  }
};

watch(activeObj, (newObj, oldObj) => {
  if (oldObj) {
    oldObj.off('moving');
    oldObj.off('scaling');
    oldObj.off('rotating');
    oldObj.off('modified');
  }

  boundObj = newObj;

  if (!newObj) {
    posX.value = 0;
    posY.value = 0;
    width.value = 0;
    height.value = 0;
    rotation.value = 0;
    isLocked.value = false;
    lockRatio.value = false;
    return;
  }

  store.syncLockState(newObj);

  lockRatio.value = !!newObj.lockRatio;

  const sideControls = ['ml', 'mr', 'mt', 'mb'];
  sideControls.forEach(control => {
    newObj.setControlVisible(control, !lockRatio.value);
  });
  
  // CÀI ĐẶT HÀNH VI CHUỘT:
  newObj.set({
    lockUniScaling: lockRatio.value, // Khóa tỉ lệ nếu biến lockRatio là true
    // lockScalingFlip: true,
    // centeredScaling: true
  });

  normalizeObjectOrigin(newObj);
  syncFromObject(newObj, { final: true });  

  newObj.on('moving', () => {
    newObj.__isTransforming = true;
    syncThrottled(newObj);
  });

  newObj.on('scaling', () => {
    newObj.__isTransforming = true;
    syncThrottled(newObj);
  });

  newObj.on('rotating', () => {
    newObj.__isTransforming = true;
    syncThrottled(newObj);
  });
  newObj.on('modified', () => {
    newObj.__isTransforming = false;
    syncFromObject(newObj, { final: true })
  });
    
}, { immediate: true });

const updatePos = (val, axis) => {
  const obj = activeObj.value;
  if (!obj) return;

  const center = obj.getCenterPoint();

  if (axis === 'x') center.x = val;
  else center.y = val;

  obj.setPositionByOrigin(center, 'center', 'center');
  obj.setCoords();
  update();
};

const toggleLockRatio = () => {
  const obj = activeObj.value;
  if (!obj) return;

  const next = !lockRatio.value;
  lockRatio.value = next;

  // 1. Lưu trạng thái tùy chỉnh
  obj.set({
    lockRatio: next,
    // lockScalingFlip: true,
    // centeredScaling: true
  });

  // 2. PHƯƠNG PHÁP V6: Ẩn các nốt kéo ở cạnh để ép Uniform Scaling
  const sideControls = ['ml', 'mr', 'mt', 'mb'];
  sideControls.forEach(control => {
    // Nếu lockRatio = true thì visible = false (ẩn đi)
    obj.setControlVisible(control, !next);
  });

  // 3. Cập nhật tỉ lệ cho Input
  if (next) {
    const w = obj.width * obj.scaleX;
    const h = obj.height * obj.scaleY;
    originalRatio.value = w / h;
  }

  obj.setCoords();
  store.activeFabric.requestRenderAll();
};

const updateSize = (val, axis) => {
  const obj = activeObj.value;
  if (!obj) return;
  console.log(obj.lockUniScaling);
  const baseWidth  = obj.width  || 1;
  const baseHeight = obj.height || 1;

  if (axis === 'w') {
    width.value = val;

    const newScaleX = val / baseWidth;
    obj.set({ scaleX: newScaleX });

    if (lockRatio.value) {
      const newDisplayHeight = val / originalRatio.value;
      height.value = Math.round(newDisplayHeight);
      obj.set({ scaleY: newDisplayHeight / baseHeight });
    }
    console.log("[lockRatio.value] là:",lockRatio.value);

  } else {
    height.value = val;

    const newScaleY = val / baseHeight;
    obj.set({ scaleY: newScaleY });

    if (lockRatio.value) {
      const newDisplayWidth = val * originalRatio.value;
      width.value = Math.round(newDisplayWidth);
      obj.set({ scaleX: newDisplayWidth / baseWidth });
    }
    console.log("[lockRatio.value] là:",lockRatio.value);
  }

  obj.setCoords();
  update();
};

const updateRotation = (val) => {
  let numericVal = Number(val);

  numericVal = Math.max(-180, Math.min(180, numericVal));

  rotation.value = numericVal;

  if (activeObj.value) {
    activeObj.value.set({
      originX: 'center',
      originY: 'center',
      angle: numericVal
    });

    activeObj.value.setCoords();
  }
  update();
};

const toggleLock = () => {
  const obj = activeObj.value;
  if (!obj) return;

  const newState = !isLocked.value;
  
  obj.set({
    hasControls: !newState,
    lockMovementX: newState,
    lockMovementY: newState,
    lockScalingX: newState,
    lockScalingY: newState,
    lockRotation: newState,
    editable: !newState
  });
  isLocked.value = newState;
  obj.setCoords();
  store.activeFabric.requestRenderAll();
  store.saveState();
};

const commitFill = (val) => {
  store.triggerUpdateThumbnail(store.selectedId);
  store.endHistory();
};

const update = () => {
  store.activeFabric.requestRenderAll();
};
</script>

<template>
  <div class="property-section">
    <div class="section-header">Position & Size</div>

    <!-- Position: X - Y -->
    <div class="pos-grid mt-12">
      <div class="input-col">
        <label class="mini-label">X</label>
        <div class="input-with-unit">
          <input 
            type="number" 
            class="property-input-dark"
            :value="posX"
            :disabled="isLocked"
            @input="e => updatePos(Number(e.target.value), 'x')"
            @blur="e => commitFill(e.target.value)"
          />
          <span class="unit-label">px</span>
        </div>
      </div>
      <div class="input-col">
        <label class="mini-label">Y</label>
        <div class="input-with-unit">
          <input 
            type="number" 
            class="property-input-dark"
            :value="posY"
            :disabled="isLocked"
            @input="e => updatePos(Number(e.target.value), 'y')"
            @blur="e => commitFill(e.target.value)"
          />
          <span class="unit-label">px</span>
        </div>
      </div>
    </div>

    <!-- Size: W - Lock Button - H -->
    <div class="size-grid mt-12">
      <div class="input-col">
        <label class="mini-label">W</label>
        <div class="input-with-unit">
          <input 
            type="number" 
            class="property-input-dark"
            :value="width"
            :disabled="isLocked"
            @input="e => updateSize(Number(e.target.value), 'w')"
            @blur="e => commitFill(e.target.value)"
          />
          <span class="unit-label">px</span>
        </div>
      </div>

      <button
        class="lock-ratio-btn"
        :class="{ active: lockRatio }"
        @click="toggleLockRatio"
        title="Lock aspect ratio"
      >
        <component
          :is="lockRatio ? Link : Link2Off"
          :size="18"
        />
      </button>

      <div class="input-col">
        <label class="mini-label">H</label>
        <div class="input-with-unit">
          <input 
            type="number" 
            class="property-input-dark"
            :value="height"
            :disabled="isLocked"
            @input="e => updateSize(Number(e.target.value), 'h')"
            @blur="e => commitFill(e.target.value)"
          />
          <span class="unit-label">px</span>
        </div>
      </div>
    </div>

    <!-- Rotation -->
    <div class="property-row mt-12">
      <label class="property-label">Rotation</label>
      <div class="slider-control">
        <input 
          type="range" 
          class="custom-range"
          :value="rotation"
          :disabled="isLocked"
          min="-180" max="180"
          @input="e => updateRotation(e.target.value)"
          @change="e => commitFill(e.target.value)"
        />
        <span 
          v-if="!showValueInput"
          class="property-value"
          @click="toggleValueInput"
        >{{ rotation }}°</span>
        <input 
          v-else
          type="number"
          v-model.number="rotation"
          :disabled="isLocked"
          min="-180" max="180"
          class="property-input-dark"
          @input="e => updateRotation(e.target.value)"
          @change="e => {
            commitFill(e.target.value);
            showValueInput = false;
          }"
          @blur="showValueInput = false"
          v-autofocus
        />
      </div>
    </div>

    <!-- Lock -->
    <div class="property-row mt-12">
      <button 
        :class="['lock-btn', { locked: isLocked }]"
        @click="toggleLock"
      >
        <component :is="isLocked ? Lock : LockOpen" :size="16" stroke-width="1.5" />
        <span>{{ isLocked ? 'Locked' : 'Unlocked' }}</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
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

.property-label {
  display: block;
  font-size: 12px;
  color: #888;
  margin-bottom: 6px;
}

/* ✅ Position Grid: X - Y (2 cột bằng nhau) */
.pos-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

/* ✅ Size Grid: W - Button - H (cân đối) */
.size-grid {
  display: grid;
  grid-template-columns: 1fr 40px 1fr;
  gap: 8px;
  align-items: flex-end;
}

.input-col {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.mini-label {
  font-size: 10px;
  color: #888;
  font-weight: 600;
  margin-bottom: 0;
  display: block;
}

.input-with-unit {
  position: relative;
  display: flex;
  align-items: center;
}

.property-input-dark {
  width: 100%;
  background: #1a1a1a;
  border: 1px solid #333;
  color: #eee;
  padding: 6px 24px 6px 8px;
  border-radius: 4px;
  font-size: 12px;
  outline: none;
}

.property-input-dark:focus {
  border-color: #667eea;
}

.property-input-dark:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.unit-label {
  position: absolute;
  right: 8px;
  font-size: 10px;
  color: #444;
  pointer-events: none;
}

.mt-12 { margin-top: 12px; }

/* ẩn mũi tên của input number */
input::-webkit-outer-spin-button,
input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.property-row {
  margin-bottom: 0;
}

/* ✅ Lock Ratio Button - căn giữa với các input */
.lock-ratio-btn {
  width: 40px;
  height: 32px;
  background: #1e1e1e;
  border: 1px solid #3a3a3a;
  border-radius: 4px;
  color: #666;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  flex-shrink: 0;
}

.lock-ratio-btn:hover {
  background: #353535;
  color: #e0e0e0;
  border-color: #4a4a4a;
}

.lock-ratio-btn.active {
  background: #5c7cfa;
  border-color: #5c7cfa;
  color: #fff;
  box-shadow: 0 0 8px rgba(92, 124, 250, 0.3);
}

.slider-control {
  display: flex;
  align-items: center;
  gap: 8px;
}

.slider-control input[type="number"] {
  width: 55px;  /* ← Input number fix width */
  flex-shrink: 0;
}

.custom-range {
  -webkit-appearance: none;
  flex: 1;
  height: 4px;
  background: #3a3a3a;
  border-radius: 2px;
  outline: none;
  cursor: pointer;
}

.custom-range::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 12px;
  height: 12px;
  background: #fff;
  border: 2px solid #667eea;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.1s;
}

.custom-range::-webkit-slider-thumb:hover {
  transform: scale(1.2);
  background: #667eea;
}

.custom-range::-moz-range-thumb {
  width: 12px;
  height: 12px;
  background: #fff;
  border: 2px solid #667eea;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.1s;
}

.custom-range:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.property-value {
  font-size: 12px;
  color: #aaa;
  width: 40px;
  text-align: right;
  font-family: monospace;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: all 0.2s;
}

.property-value:hover {
  background: #3a3a3a;
}

.lock-btn {
  width: 100%;
  padding: 8px 12px;
  background: #1e1e1e;
  border: 1px solid #3a3a3a;
  border-radius: 4px;
  color: #aaa;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.2s;
}

.lock-btn:hover {
  background: #353535;
  color: #e0e0e0;
}

.lock-btn.locked {
  background: #dc2626;
  border-color: #dc2626;
  color: #fff;
}
</style>