<script setup>
import { ref, computed, watch } from 'vue';
import { useCanvasStore } from '@/stores/canvasStore';
import { Bold, Italic } from 'lucide-vue-next';

const store = useCanvasStore();
const activeObj = computed(() => store.activeFabric?.getActiveObject());

const textContent = ref('');
const fontSize = ref(16);
const fontFamily = ref('Arial');
const fontWeight = ref('normal');
const fontStyle = ref('normal');
const textAlign = ref('left');
const lineHeight = ref(1.2);
const fillColor = ref('#000000');
const opacity = ref(100);

const fontFamilies = ['Arial', 'Helvetica', 'Georgia', 'Times New Roman', 'Courier New', 'Verdana'];

const isText = computed(() => 
  ['i-text', 'text', 'textbox'].includes(activeObj.value?.type)
);

watch(activeObj, (newObj) => {
  if (isText.value) {
    textContent.value = newObj.text || '';
    fontSize.value = newObj.fontSize || 16;
    fontFamily.value = newObj.fontFamily || 'Arial';
    fontWeight.value = newObj.fontWeight || 'normal';
    fontStyle.value = newObj.fontStyle || 'normal';
    textAlign.value = newObj.textAlign || 'left';
    lineHeight.value = newObj.lineHeight || 1.2;
    fillColor.value = newObj.fill || '#000000';
    opacity.value = Math.round((newObj.opacity || 1) * 100);
    console.log('[TextProperties] Load:', { font: fontFamily.value, size: fontSize.value });
  }
}, { deep: true });

const updateText = (val) => {
  textContent.value = val;
  if (activeObj.value) {
    activeObj.value.set({ text: val });
    update();
  }
};

const updateFontSize = (val) => {
  fontSize.value = val;
  if (activeObj.value) {
    activeObj.value.set({ fontSize: val });
    update();
  }
};

const updateFontFamily = (val) => {
  fontFamily.value = val;
  if (activeObj.value) {
    activeObj.value.set({ fontFamily: val });
    update();
  }
};

const toggleBold = () => {
  fontWeight.value = fontWeight.value === 'normal' ? 'bold' : 'normal';
  if (activeObj.value) {
    activeObj.value.set({ fontWeight: fontWeight.value });
    update();
  }
};

const toggleItalic = () => {
  fontStyle.value = fontStyle.value === 'normal' ? 'italic' : 'normal';
  if (activeObj.value) {
    activeObj.value.set({ fontStyle: fontStyle.value });
    update();
  }
};

const updateAlign = (val) => {
  textAlign.value = val;
  if (activeObj.value) {
    activeObj.value.set({ textAlign: val });
    update();
  }
};

const updateLineHeight = (val) => {
  lineHeight.value = val;
  if (activeObj.value) {
    activeObj.value.set({ lineHeight: val });
    update();
  }
};

const updateColor = (val) => {
  fillColor.value = val;
  if (activeObj.value) {
    activeObj.value.set({ fill: val });
    update();
  }
};

const updateOpacity = (val) => {
  opacity.value = val;
  if (activeObj.value) {
    activeObj.value.set({ opacity: val / 100 });
    update();
  }
};

const update = () => {
  store.activeFabric.requestRenderAll();
  store.triggerUpdateThumbnail(store.selectedId);
  store.saveState();
};
</script>

<template>
  <div class="property-section" v-if="isText">
    <div class="section-header">Text</div>

    <!-- Text Content -->
    <div class="property-row">
      <textarea 
        class="text-input"
        :value="textContent"
        @input="e => updateText(e.target.value)"
        placeholder="Enter text..."
        rows="3"
      ></textarea>
    </div>

    <!-- Font -->
    <div class="property-row">
      <label class="property-label">Font Family</label>
      <select 
        class="property-select"
        :value="fontFamily"
        @change="e => updateFontFamily(e.target.value)"
      >
        <option v-for="font in fontFamilies" :key="font" :value="font">{{ font }}</option>
      </select>
    </div>

    <!-- Font Size -->
    <div class="property-row">
      <label class="property-label">Font Size</label>
      <div class="slider-control">
        <input 
          type="range" 
          class="custom-range"
          :value="fontSize"
          @input="e => updateFontSize(e.target.value)"
          min="8" max="72"
        />
        <span class="property-value">{{ fontSize }}px</span>
      </div>
    </div>

    <!-- Font Style -->
    <div class="property-row style-controls">
      <button 
        :class="['style-btn', { active: fontWeight === 'bold' }]"
        @click="toggleBold"
        title="Bold"
      >
        <Bold :size="16" stroke-width="2.5" />
      </button>
      <button 
        :class="['style-btn', { active: fontStyle === 'italic' }]"
        @click="toggleItalic"
        title="Italic"
      >
        <Italic :size="16" stroke-width="2.5" />
      </button>
    </div>

    <!-- Alignment -->
    <div class="property-row">
      <label class="property-label">Alignment</label>
      <div class="align-controls">
        <button 
          :class="['align-btn', { active: textAlign === 'left' }]"
          @click="updateAlign('left')"
        >
          ⬅️
        </button>
        <button 
          :class="['align-btn', { active: textAlign === 'center' }]"
          @click="updateAlign('center')"
        >
          ⬆️⬇️
        </button>
        <button 
          :class="['align-btn', { active: textAlign === 'right' }]"
          @click="updateAlign('right')"
        >
          ➡️
        </button>
      </div>
    </div>

    <!-- Line Height -->
    <div class="property-row">
      <label class="property-label">Line Height</label>
      <div class="slider-control">
        <input 
          type="range" 
          class="custom-range"
          :value="lineHeight"
          @input="e => updateLineHeight(e.target.value)"
          min="0.8" max="2.5" step="0.1"
        />
        <span class="property-value">{{ lineHeight.toFixed(1) }}</span>
      </div>
    </div>

    <!-- Color -->
    <div class="property-row">
      <label class="property-label">Color</label>
      <div class="color-picker-row">
        <input 
          type="color" 
          class="color-input"
          :value="fillColor"
          @input="e => updateColor(e.target.value)"
        />
        <span class="color-value">{{ fillColor }}</span>
      </div>
    </div>

    <!-- Opacity -->
    <div class="property-row">
      <label class="property-label">Opacity</label>
      <div class="slider-control">
        <input 
          type="range" 
          class="custom-range"
          :value="opacity"
          @input="e => updateOpacity(e.target.value)"
          min="0" max="100"
        />
        <span class="property-value">{{ opacity }}%</span>
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

.text-input {
  width: 100%;
  padding: 8px;
  background: #1e1e1e;
  border: 1px solid #3a3a3a;
  border-radius: 4px;
  color: #e0e0e0;
  font-size: 12px;
  font-family: monospace;
  resize: vertical;
}

.text-input:focus {
  outline: none;
  border-color: #667eea;
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
  width: 40px;
  text-align: right;
  font-family: monospace;
}

.style-controls {
  display: flex;
  gap: 8px;
}

.style-btn {
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

.style-btn:hover {
  background: #353535;
}

.style-btn.active {
  background: #667eea;
  border-color: #667eea;
  color: #fff;
}

.align-controls {
  display: flex;
  gap: 8px;
}

.align-btn {
  flex: 1;
  padding: 6px;
  background: #1e1e1e;
  border: 1px solid #3a3a3a;
  border-radius: 4px;
  color: #aaa;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.align-btn:hover {
  background: #353535;
}

.align-btn.active {
  background: #667eea;
  border-color: #667eea;
  color: #fff;
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
</style>