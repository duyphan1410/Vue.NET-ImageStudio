<script setup>
import { ref, computed, watch } from 'vue';
import { useCanvasStore } from '@/stores/canvasStore';

const store = useCanvasStore();

const activeObj = computed(() => store.selectedObject);

const isShape = computed(() =>
  ['rect', 'circle', 'ellipse', 'polygon', 'triangle'].includes(activeObj.value?.type)
);

const fillColor = ref('#000000');
const strokeColor = ref('#000000');
const strokeWidth = ref(0);
const strokeDash = ref('solid');
const opacity = ref(100);
const cornerRadius = ref(0);

const showStrokeWidthInput = ref(false);
const showCornerRadiusInput = ref(false);

const toggleStrokeWidthInput = () => {
  if (store.isLocked) return;
  showStrokeWidthInput.value = !showStrokeWidthInput.value;
};

const toggleCornerRadiusInput = () => {
  if (store.isLocked) return;
  showCornerRadiusInput.value = !showCornerRadiusInput.value;
};
/**
 * Load data khi object thay đổi
 */

 const previewFill = (val) => {
  if (!activeObj.value) return;
  fillColor.value = val;
  activeObj.value.set({ fill: val });
  activeObj.value.canvas.requestRenderAll();
};

const previewStrokeColor = (val) => {
  if (!activeObj.value) return;
  strokeColor.value = val;
  activeObj.value.set({ stroke: val });
  activeObj.value.canvas.requestRenderAll();
};

const commitFill = (val) => {
  store.triggerUpdateThumbnail(store.selectedId);
  store.endHistory();
};


const normalizeColor = (color, fallback = '#000000') => {
  if (!color || color === 'transparent') return fallback;
  return color;
};

watch(activeObj, (obj) => {
  if (!obj || !isShape.value) return;

  fillColor.value   = normalizeColor(obj.fill);
  strokeColor.value = normalizeColor(obj.stroke);
  strokeWidth.value = obj.strokeWidth || 0;
  strokeDash.value  = obj.strokeDashArray ? 'dashed' : 'solid';
  opacity.value     = Math.round((obj.opacity ?? 1) * 100);

  if (obj.type === 'rect') {
    cornerRadius.value = obj.rx || 0;
  }
}, { immediate: true, deep: true });
/**
 * ===== UPDATE HELPERS =====
 */
const applyUpdate = () => {
  const canvas = activeObj.value?.canvas;
  if (!canvas) return;

  canvas.requestRenderAll();
};


const updateStrokeWidth = (val) => {
  if (!activeObj.value) return;
  let width = Number(val);
  width = Math.max(0, Math.min(20, width));
  strokeWidth.value = width;
  activeObj.value.set({ strokeWidth: width });
  applyUpdate();
};

const updateStrokeDash = (val) => {
  if (!activeObj.value) return;
  strokeDash.value = val;
  activeObj.value.set({
    strokeDashArray: val === 'solid' ? null : [5, 5]
  });
  applyUpdate();
};

const updateCornerRadius = (val) => {
  if (!activeObj.value || activeObj.value.type !== 'rect') return;
  let r = Number(val);
  r = Math.max(0, Math.min(50, r));
  cornerRadius.value = r;
  activeObj.value.set({ rx: r, ry: r });
  applyUpdate();
};
</script>

<template>
  <div class="property-section" v-if="isShape">
    <div class="section-header">Shape</div>

    <!-- Fill -->
    <div class="property-row">
      <label class="property-label">Fill Color</label>
      <div class="color-picker-row">
        <input
          type="color"
          class="color-input"
          :value="fillColor"
          :disabled="store.isLocked"
          @focus="store.startHistory()"
          @input="e => previewFill(e.target.value)"
          @change="e => commitFill(e.target.value)"
        />
        <span class="color-value">{{ fillColor }}</span>
      </div>
    </div>

    <!-- Stroke Width -->
    <div class="property-row">
      <label class="property-label">Stroke Width</label>
      <div class="slider-control">
        <input
          type="range"
          class="custom-range"
          :value="strokeWidth"
          :disabled="store.isLocked"
          min="0"
          max="20"
          @input="e => updateStrokeWidth(e.target.value)"
          @change="e => commitFill(e.target.value)"
        />
        <span 
          v-if="!showStrokeWidthInput"
          class="property-value"
          @click="toggleStrokeWidthInput"
        >{{ strokeWidth }}px</span>
        <input 
          v-else
          type="number"
          v-model.number="strokeWidth"
          :disabled="store.isLocked"
          min="0" max="20"
          class="property-input-dark"
          @input="e => updateStrokeWidth(e.target.value)"
          @change="e => {
            commitFill(e.target.value);
            showStrokeWidthInput = false;
          }"
          @blur="showStrokeWidthInput = false"
          v-autofocus
        />
      </div>
    </div>

    <!-- Stroke Color -->
    <div class="property-row">
      <label class="property-label">Stroke Color</label>
      <div class="color-picker-row">
        <input
          type="color"
          class="color-input"
          :value="strokeColor"
          :disabled="store.isLocked"
          @focus="store.startHistory()"
          @input="e => previewStrokeColor(e.target.value)"
          @change="e => commitFill(e.target.value)"
        />
        <span class="color-value">{{ strokeColor }}</span>
      </div>
    </div>

    <!-- Stroke Style -->
    <div class="property-row">
      <label class="property-label">Stroke Style</label>
      <select
        class="property-select"
        :value="strokeDash"
        :disabled="store.isLocked"
        @change="e => updateStrokeDash(e.target.value)"
        @mouseup="store.endHistory()"
      >
        <option value="solid">Solid</option>
        <option value="dashed">Dashed</option>
      </select>
    </div>

    <!-- Corner Radius -->
    <div v-if="activeObj?.type === 'rect'" class="property-row">
      <label class="property-label">Corner Radius</label>
      <div class="slider-control">
        <input
          type="range"
          class="custom-range"
          :value="cornerRadius"
          :disabled="store.isLocked"
          min="0"
          max="50"
          @input="e => updateCornerRadius(e.target.value)"
          @change="e => commitFill(e.target.value)"
        />
        <span 
          v-if="!showCornerRadiusInput"
          class="property-value"
          @click="toggleCornerRadiusInput"
        >{{ cornerRadius }}px</span>
        <input 
          v-else
          type="number"
          v-model.number="cornerRadius"
          :disabled="store.isLocked"
          min="0" max="50"
          class="property-input-dark"
          @input="e => updateCornerRadius(e.target.value)"
          @change="e => {
            commitFill(e.target.value);
            showCornerRadiusInput = false;
          }"
          @blur="showCornerRadiusInput = false"
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

.property-select {
  width: 100%;
  padding: 6px 8px;
  background: #1e1e1e;
  border: 1px solid #3a3a3a;
  border-radius: 4px;
  color: #e0e0e0;
  font-size: 12px;
  cursor: pointer;
}

.property-select:focus {
  outline: none;
  border-color: #667eea;
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
</style>