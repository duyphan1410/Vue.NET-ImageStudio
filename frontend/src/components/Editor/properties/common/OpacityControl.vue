<script setup>
import {ref, computed, watch } from 'vue';
import { useCanvasStore } from '@/stores/canvasStore';

const store = useCanvasStore();

const activeObj = computed(() => store.selectedObject);

const opacity = ref(100);
const showValueInput = ref(false);

const toggleValueInput = () => {
  if (store.isLocked) return;
  showValueInput.value = !showValueInput.value;
};


watch(activeObj, (obj) => {
  if (!obj) return;
  opacity.value     = Math.round((obj.opacity ?? 1) * 100);
}, { immediate: true });

const applyUpdate = () => {
  const canvas = activeObj.value?.canvas;
  if (!canvas) return;

  canvas.requestRenderAll();
};

const updateOpacity = (val) => {
  const obj = activeObj.value;
  if (!obj) return;
  let o = Number(val);
  o = Math.max(0, Math.min(100, o));
  opacity.value = o;
  obj.set('opacity', o / 100);
  obj.dirty = true;
  applyUpdate();
};

const commitOpacity = () => {
  const obj = activeObj.value;
  if (!obj) return;

  store.triggerUpdateThumbnail(store.selectedId);
  store.endHistory();
};


</script>

<template>
  <div class="property-section">
    <div class="section-header">Opacity
      <div class="property-row">
        <div class="slider-control">
          <input 
            type="range" 
            :value="opacity"
            :disabled="store.isLocked"
            min="0" max="100" 
            class="custom-range"
            @mousedown="store.startHistory()"
            @input="e => updateOpacity(e.target.value)"
            @change="e => commitOpacity(e.target.value)"
          />
          <span 
            v-if="!showValueInput"
            class="property-value"
            @click="toggleValueInput"
          >{{ opacity }}%</span>
          <input 
            v-else
            type="number"
            v-model.number="opacity"
            :disabled="store.isLocked"
            min="0" max="100"
            class="property-input-dark"
            @input="e => updateOpacity(e.target.value)"
            @change="e => {
              commitOpacity(e.target.value);
              showValueInput = false;
            }"
            @blur="showValueInput = false"
            v-autofocus
          />
        </div>
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

</style>