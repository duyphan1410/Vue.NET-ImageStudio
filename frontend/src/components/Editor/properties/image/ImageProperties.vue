<script setup>
import { ref, computed, watch } from 'vue';
import { useCanvasStore } from '@/stores/canvasStore';
import { FlipHorizontal2, FlipVertical2 } from 'lucide-vue-next';

const store = useCanvasStore();
const activeObj = computed(() => store.selectedObject);

const opacity = ref(100);
const flipX = ref(false);
const flipY = ref(false);
const borderWidth = ref(0);
const borderColor = ref('#000000');
const showBorderWidthInput = ref(false);

const toggleBorderWidthInput = () => {
  if (store.isLocked) return;
  showBorderWidthInput.value = !showBorderWidthInput.value;
};

let isRendering = false;

watch(
  () => activeObj.value?.editorId,
  () => {
    const obj = activeObj.value;
    if (obj?.type !== 'image') return;

    opacity.value = Math.round((obj.opacity ?? 1) * 100);
    flipX.value = !!obj.flipX;
    flipY.value = !!obj.flipY;
    borderWidth.value = obj.strokeWidth ?? 0;
    borderColor.value = obj.stroke ?? '#000000';
  },
  { immediate: true }
);

const updateOpacity = (val) => {
  opacity.value = val;
  if (activeObj.value) {
    activeObj.value.set({ opacity: val / 100 });
    update();
  }
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

const updateBorder = (val, type) => {

  const obj = activeObj.value;
  if (!activeObj.value) return;

  if (type === 'width') {
    borderWidth.value = val;
    obj.set({ 
      strokeWidth: Number(val),
      // Đảm bảo luôn có màu viền khi tăng độ dày
      stroke: obj.stroke || borderColor.value 
    });
  } else {
    borderColor.value = val;
    obj.set({ 
      stroke: val,
      // Đảm bảo viền có độ dày ít nhất là 1 nếu người dùng chọn màu
      strokeWidth: obj.strokeWidth || (borderWidth.value > 0 ? borderWidth.value : 1) 
    });
  }

  obj.setCoords();

  // Thay vì gọi update() trực tiếp, ta dùng logic này:
  if (!isRendering) {
    isRendering = true;
    requestAnimationFrame(() => {
      store.activeFabric.requestRenderAll();
      isRendering = false;
    });
  }
};

const update = () => {
  store.activeFabric.requestRenderAll();
};

const commitFill = (val) => {
  store.triggerUpdateThumbnail(store.selectedId);
  store.endHistory();
};
</script>

<template>
  <div class="property-section" v-if="activeObj?.type === 'image'">
    <div class="section-header">Image</div>

    <!-- Flip -->
    <div class="property-row flip-controls">
      <button 
        :class="['flip-btn', { active: flipX }]"
        :disabled="store.isLocked"
        @click="toggleFlip('x')"
        title="Flip Horizontal"
      >
        <FlipHorizontal2 :size="18" />
      </button>
      <button 
        :class="['flip-btn', { active: flipY }]"
        :disabled="store.isLocked"
        @click="toggleFlip('y')"
        title="Flip Vertical"
      >
        <FlipVertical2 :size="18" />
      </button>
    </div>

    <!-- Border -->
    <div class="property-row">
      <label class="property-label">Border Width</label>
      <div class="slider-control">
        <input 
          type="range" 
          class="custom-range"
          :value="borderWidth"
          :disabled="store.isLocked"
          @input="e => updateBorder(e.target.value, 'width')"
          min="0" max="20"
          @change="e => commitFill(e.target.value)"
        />
        <span 
          v-if="!showBorderWidthInput"
          class="property-value"
          :disabled="store.isLocked"
          @click="toggleBorderWidthInput"
        >{{ borderWidth }}px</span>
        <input 
          v-else
          type="number"
          v-model.number="borderWidth"
          :disabled="store.isLocked"
          min="0" max="20"
          class="property-input-dark"
          @input="e => updateBorder(e.target.value, 'width')"
          @change="e => {
            commitFill(e.target.value);
            showBorderWidthInput = false;
          }"
          @blur="showBorderWidthInput = false"
          v-autofocus
        />
      </div>
    </div>

    <div class="property-row">
      <label class="property-label">Border Color</label>
      <div class="color-picker-row">
        <input 
          type="color" 
          class="color-input"
          :value="borderColor"
          :disabled="store.isLocked"
          @input="e => updateBorder(e.target.value, 'color')"
          @mouseup="e => commitFill(e.target.value)"
        />
        <span class="color-value">{{ borderColor }}</span>
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

.slider-control {
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
}

.flip-controls {
  display: flex;
  gap: 8px;
}

.flip-btn {
  flex: 1;
  padding: 8px;
  background: #1e1e1e;
  border: 1px solid #3a3a3a;
  border-radius: 4px;
  color: #aaa;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.flip-btn:hover:not(:disabled) {
  background: #353535;
  color: #e0e0e0;
}

.flip-btn.active:not(:disabled) {
  background: #667eea;
  border-color: #667eea;
  color: #fff;
}

.flip-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: #1e1e1e;
  border-color: #3a3a3a;
  color: #666;
}

.color-picker-row {
  display: flex;
  gap: 8px;
  align-items: center;
}

.color-input {
  width: 40px;
  height: 28px;
  border: 1px solid #3a3a3a;
  border-radius: 4px;
  cursor: pointer;
}

.color-value {
  font-size: 12px;
  color: #aaa;
  font-family: monospace;
}

.property-input-dark {
  width: 50px;
  background: #1a1a1a;
  border: 1px solid #333;
  color: #eee;
  padding: 6px 8px;
  border-radius: 4px;
  font-size: 12px;
  outline: none;
}

.property-input-dark::-webkit-outer-spin-button,
.property-input-dark::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.property-input-dark:focus {
  border-color: #667eea;
}

.property-input-dark:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.property-value {
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: all 0.2s;
}

.property-value:hover {
  background: #3a3a3a;
}
</style>