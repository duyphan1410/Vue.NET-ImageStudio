<script setup>
import { ref, computed, watch,onMounted, onBeforeUnmount } from 'vue';
import { useCanvasStore } from '@/stores/canvasStore';
import { Lock, LockOpen } from 'lucide-vue-next';
import { Link, Link2Off } from 'lucide-vue-next';
import { FlipHorizontal2, FlipVertical2 } from 'lucide-vue-next';

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
const flipX = ref(false);
const flipY = ref(false);
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

  flipX.value = obj.flipX || false;
  flipY.value = obj.flipY || false;

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
    flipX.value = activeObj.value.flipX || false
    flipY.value = activeObj.value.flipY || false
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

const toggleFlip = (axis) => {
  if (!activeObj.value) return;
  if (axis === 'x') {
    flipX.value = !flipX.value;
    activeObj.value.set({ flipX: flipX.value });
  } else {
    flipY.value = !flipY.value;
    activeObj.value.set({ flipY: flipY.value });
  }
  console.log('[ImageProperties] Flip', axis, ':', axis === 'x' ? flipX.value : flipY.value);
  activeObj.value.setCoords();
  update();
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
    <div class="section-header-row">
      <div class="section-header">Position & Size</div>
      <button :class="['header-lock-btn', { locked: isLocked }]" @click="toggleLock">
        <component :is="isLocked ? Lock : LockOpen" :size="14" />
      </button>
    </div>

    <div class="pos-grid mt-12">
      <div class="input-col">
        <label class="mini-label">X</label>
        <div class="input-with-unit">
          <input 
            type="number" class="property-input-dark no-spin" :value="posX" :disabled="isLocked"
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
            type="number" class="property-input-dark no-spin" :value="posY" :disabled="isLocked"
            @input="e => updatePos(Number(e.target.value), 'y')"
            @blur="e => commitFill(e.target.value)"
          />
          <span class="unit-label">px</span>
        </div>
      </div>
    </div>

    <div class="size-grid mt-12">
      <div class="input-col">
        <label class="mini-label">W</label>
        <div class="input-with-unit">
          <input 
            type="number" class="property-input-dark no-spin" :value="width" :disabled="isLocked"
            @input="e => updateSize(Number(e.target.value), 'w')"
            @blur="e => commitFill(e.target.value)"
          />
          <span class="unit-label">px</span>
        </div>
      </div>
      <button class="lock-ratio-btn" :class="{ active: lockRatio }" @click="toggleLockRatio">
        <component :is="lockRatio ? Link : Link2Off" :size="16" />
      </button>
      <div class="input-col">
        <label class="mini-label">H</label>
        <div class="input-with-unit">
          <input 
            type="number" class="property-input-dark no-spin" :value="height" :disabled="isLocked"
            @input="e => updateSize(Number(e.target.value), 'h')"
            @blur="e => commitFill(e.target.value)"
          />
          <span class="unit-label">px</span>
        </div>
      </div>
    </div>

    <div class="divider mt-12"></div>

    <div class="transform-area mt-12">
      <div class="transform-header">
        <label class="mini-label">Rotation & Flip</label>
        <div class="flip-group">
          <button :class="['flip-mini-btn', { active: flipX }]" :disabled="isLocked" @click="() => { toggleFlip('x'); commitFill() }">
            <FlipHorizontal2 :size="14" />
          </button>
          <button :class="['flip-mini-btn', { active: flipY }]" :disabled="isLocked" @click="() => { toggleFlip('y'); commitFill() }">
            <FlipVertical2 :size="14" />
          </button>
        </div>
      </div>
      
      <div class="rotation-control-row mt-12">
        <input 
          type="range" class="custom-range" :value="rotation" min="-180" max="180" :disabled="isLocked"
          @input="e => updateRotation(e.target.value)"
          @change="e => commitFill(e.target.value)" 
        />
        <span v-if="!showValueInput" class="property-value" @click="toggleValueInput">{{ rotation }}°</span>
        <input 
          v-else type="number" v-model.number="rotation" class="property-input-dark no-spin small-input" :disabled="isLocked"
          @input="e => updateRotation(e.target.value)"
          @change="e => { commitFill(e.target.value); showValueInput = false; }"
          @blur="showValueInput = false"
          v-autofocus
          />
      </div>
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

/* ẨN MŨI TÊN TRÌNH DUYỆT */
.no-spin::-webkit-outer-spin-button,
.no-spin::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
.no-spin { -moz-appearance: textfield; }

/* HEADER & DIVIDER */
.section-header-row { display: flex; justify-content: space-between; align-items: center; }
.section-header { font-size: 11px; font-weight: 700; color: #667eea; text-transform: uppercase; }
.header-lock-btn { background: transparent; border: none; color: #555; cursor: pointer; padding: 4px; }
.header-lock-btn.locked { color: #f87171; }
.divider { height: 1px; background: #3a3a3a; margin: 12px -12px; }

/* GRIDS */
.pos-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.size-grid { display: grid; grid-template-columns: 1fr 32px 1fr; gap: 8px; align-items: flex-end; }
.mini-label { font-size: 10px; color: #888; font-weight: 600; margin-bottom: 4px; display: block; }

.property-input-dark {
  width: 100%; background: #1a1a1a; border: 1px solid #333; color: #eee;
  padding: 6px 8px; border-radius: 4px; font-size: 12px; outline: none; height: 27px;
}

.input-with-unit { position: relative; }
.unit-label { position: absolute; right: 8px; top: 50%; transform: translateY(-50%); font-size: 10px; color: #444; pointer-events: none; }

.rotation-control-row { display: flex; align-items: center; gap: 10px; }
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
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: all 0.2s;
  font-size: 12px;
  color: #aaa;
  width: 40px;
  text-align: right;
  font-family: monospace;
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  height: 27px;
}
.property-value:hover {
  background: #3a3a3a;
}

.small-input {
  width: 40px;
  padding: 4px 6px;
  text-align: center;
  line-height: 1;
  height: 27px;
}

.transform-header { display: flex; justify-content: space-between; align-items: center; }
.flip-group { display: flex; gap: 2px; background: #1a1a1a; border: 1px solid #333; border-radius: 4px; padding: 2px; }
.flip-mini-btn {
  width: 28px; height: 22px; background: transparent; border: none;
  border-radius: 3px; color: #666; cursor: pointer; display: flex; align-items: center; justify-content: center;
}
.flip-mini-btn.active { background: #667eea; color: white; }

.lock-ratio-btn { background: transparent; border: none; color: #555; cursor: pointer; padding-bottom: 6px; }
.lock-ratio-btn.active { color: #667eea; }
.mt-12 { margin-top: 12px; }
</style>