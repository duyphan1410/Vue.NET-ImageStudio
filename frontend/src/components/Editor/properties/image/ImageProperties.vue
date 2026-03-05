<script setup>
import { ref, computed, watch } from 'vue';
import { useCanvasStore } from '@/stores/canvasStore';
import { FlipHorizontal2, FlipVertical2 } from 'lucide-vue-next';

import { filters } from 'fabric';

const store = useCanvasStore();
const activeObj = computed(() => store.selectedObject);

const opacity = ref(100);
const borderWidth = ref(0);
const borderColor = ref('#000000');
const showBorderWidthInput = ref(false);

const brightness = ref(0);
const contrast = ref(0);
const saturation = ref(0);

const showBrightnessInput = ref(false);
const showContrastInput = ref(false);
const showSaturationInput = ref(false);

const toggleBrightnessInput = () => {
  if (store.isLocked) return;
  showBrightnessInput.value = !showBrightnessInput.value;
};
const toggleContrastInput = () => {
  if (store.isLocked) return;
  showContrastInput.value = !showContrastInput.value;
};
const toggleSaturationInput = () => {
  if (store.isLocked) return;
  showSaturationInput.value = !showSaturationInput.value;
};
const toggleBorderWidthInput = () => {
  if (store.isLocked) return;
  showBorderWidthInput.value = !showBorderWidthInput.value;
};

let isRendering = false;

watch(
  () => activeObj.value,
  () => {
    const obj = activeObj.value;
    if (obj?.type !== 'image') return;

    // opacity
    opacity.value = Math.round((obj.opacity ?? 1) * 100);

    // border
    borderWidth.value = obj.strokeWidth ?? 0;
    borderColor.value = obj.stroke ?? '#000000';

    // filters
    const filtersArr = obj.filters ?? [];

    brightness.value = Math.round((filtersArr[0]?.brightness ?? 0) * 100);
    contrast.value = Math.round((filtersArr[1]?.contrast ?? 0) * 100);
    saturation.value = Math.round((filtersArr[2]?.saturation ?? 0) * 100);
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

const updateBrightness = (val) => {
  if (!activeObj.value) return;

  const img = activeObj.value;
  const value = Number(val) / 100;

  brightness.value = val;

  if (!img.filters) img.filters = [];

  img.filters[0] = new filters.Brightness({
    brightness: value
  });

  img.applyFilters();
  update();
};

const updateContrast = (val) => {
  if (!activeObj.value) return;

  const img = activeObj.value;
  const value = Number(val) / 100;

  contrast.value = val;

  if (!img.filters) img.filters = [];

  img.filters[1] = new filters.Contrast({
    contrast: value
  });

  img.applyFilters();
  update();
};

const updateSaturation = (val) => {
  if (!activeObj.value) return;

  const img = activeObj.value;
  const value = Number(val) / 100;

  saturation.value = val;

  if (!img.filters) img.filters = [];

  img.filters[2] = new filters.Saturation({
    saturation: value
  });

  img.applyFilters();
  update();
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

    <!-- Brightness -->
    <div class="property-row">
      <label class="property-label">Brightness</label>
      <div class="slider-control">
        <input 
          type="range" 
          class="custom-range"
          :value="brightness"
          :disabled="store.isLocked"
          @input="e => updateBrightness(e.target.value)"
          min="-100" max="100"
          @change="e => commitFill(e.target.value)"
        />
        <span 
          v-if="!showBrightnessInput"
          class="property-value"
          :disabled="store.isLocked"
          @click="toggleBrightnessInput"
        >{{ brightness }}</span>
        <input 
          v-else
          type="number"
          v-model.number="brightness"
          :disabled="store.isLocked"
          min="-100" max="100"
          class="property-input-dark"
          @input="e => updateBrightness(e.target.value)"
          @change="e => {
            commitFill(e.target.value);
            showBrightnessInput = false;
          }"
          @blur="showBrightnessInput = false"
          v-autofocus
        />
      </div>
    </div>

    <!-- Contrast -->
    <div class="property-row">
      <label class="property-label">Contrast</label>
      <div class="slider-control">
        <input 
          type="range" 
          class="custom-range"
          :value="contrast"
          :disabled="store.isLocked"
          @input="e => updateContrast(e.target.value)"
          min="-100" max="100"
          @change="e => commitFill(e.target.value)"
        />
        <span 
          v-if="!showContrastInput"
          class="property-value"
          :disabled="store.isLocked"
          @click="toggleContrastInput"
        >{{ contrast }}</span>
        <input 
          v-else
          type="number"
          v-model.number="contrast"
          :disabled="store.isLocked"
          min="-100" max="100"
          class="property-input-dark"
          @input="e => updateContrast(e.target.value)"
          @change="e => {
            commitFill(e.target.value);
            showContrastInput = false;
          }"
          @blur="showContrastInput = false"
          v-autofocus
        />
      </div>
    </div>

    <!-- Saturation -->
    <div class="property-row">
      <label class="property-label">Saturation</label>
      <div class="slider-control">
        <input 
          type="range" 
          class="custom-range"
          :value="saturation"
          :disabled="store.isLocked"
          @input="e => updateSaturation(e.target.value)"
          min="-100" max="100"
          @change="e => commitFill(e.target.value)"
        />
        <span 
          v-if="!showSaturationInput"
          class="property-value"
          :disabled="store.isLocked"
          @click="toggleSaturationInput"
        >{{ saturation }}</span>
        <input 
          v-else
          type="number"
          v-model.number="saturation"
          :disabled="store.isLocked"
          min="-100" max="100"
          class="property-input-dark"
          @input="e => updateSaturation(e.target.value)"
          @change="e => {
            commitFill(e.target.value);
            showSaturationInput = false;
          }"
          @blur="showSaturationInput = false"
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

.property-value {
  font-size: 12px;
  color: #aaa;
  width: 40px;
  text-align: right;
  font-family: monospace;
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
  width: 40px;
  height: 27px;
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