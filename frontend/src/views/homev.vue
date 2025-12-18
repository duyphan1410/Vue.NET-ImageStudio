<template>
  <div class="editor">
    <canvas ref="canvasEl" width="600" height="400"></canvas>

    <div class="layer-panel">
      <div class="add-layer-button" @click="addEmptyLayer">
        <span>➕</span>
      </div>
      <div class="layers-list-container">
      <div 
        v-for="layer in [...layers].reverse()" :key="layer.id"
        :class="['layer-item', { active: layer.id === selectedId }]"
        @click="selectLayer(layer.id)"
      >
        {{ layer.name }}
        <button @click.stop="toggleVisibility(layer.id)">
          {{ layer.visible ? '👁' : '🚫' }}
        </button>
        <button @click.stop="moveUp(layer.id)">⬆</button>
        <button @click.stop="moveDown(layer.id)">⬇</button>
        <button @click.stop="moveToTop(layer.id)">⬆⬆</button>
        <button @click.stop="moveToBottom(layer.id)">⬇⬇</button>
        <button @click.stop="clearLayer(layer.id)">🧹</button>
        <button @click.stop="removeLayer(layer.id)">❌</button>
      </div>
    </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { Canvas, Rect, Group, type RectProps, type TOptions,type FabricObject} from 'fabric'

interface ShapeModel {
  id: string
  name: string
  visible: boolean
  config: Partial<RectProps>
}

interface LayerModel {
  id: string
  name: string
  zIndex: number
  visible: boolean
  shapes: ShapeModel[]
  group?: Group
}

const canvasEl = ref<HTMLCanvasElement | null>(null)
let canvas: Canvas

const layers = ref<LayerModel[]>([])

onMounted(() => {
  canvas = new Canvas(canvasEl.value!, {
    backgroundColor: '#fff',
    preserveObjectStacking: true,
  })

  initLayers()
  renderLayers()
})

function initLayers() {
  const red: ShapeModel = {
    id: 'rect1',
    name: 'Rect Red',
    visible: true,
    config: { left: 50, top: 60, width: 100, height: 100, fill: 'red' },
  }

  const blue: ShapeModel = {
    id: 'rect2',
    name: 'Rect Blue',
    visible: true,
    config: { left: 100, top: 120, width: 100, height: 100, fill: 'blue' },
  }

  layers.value.push({
    id: 'layer1',
    name: 'Layer 1',
    zIndex: 1,
    visible: true,
    shapes: [red],
  })

  layers.value.push({
    id: 'layer2',
    name: 'Layer 2',
    zIndex: 2,
    visible: true,
    shapes: [blue],
  })
}

function renderLayers() {
  canvas.clear()
  layers.value.forEach(layer => {
    const group = new Group(
      layer.shapes.map(s => new Rect(s.config as unknown as TOptions<RectProps>),
      { visible: layer.visible }
    ));
    layer.group = group
    canvas.add(group)
  })
  sortLayers()
  canvas.renderAll()
}

function sortLayers() {
  layers.value.sort((a, b) => a.zIndex - b.zIndex)
  layers.value.forEach(l => {
  if (l.group) canvas.bringObjectToFront(l.group as unknown as FabricObject);
});
}

function toggleVisibility(id: string) {
  const layer = layers.value.find(l => l.id === id)
  if (layer && layer.group) {
    layer.visible = !layer.visible
    layer.group.set('visible', layer.visible)
    canvas.renderAll()
  }
}

function moveUp(id: string) {
  const index = layers.value.findIndex(l => l.id === id)
  if (index < 0 || index === layers.value.length - 1) return

  const layer = layers.value[index]
  if (layer?.group) {
    // 1️⃣ Di chuyển object trong Fabric
    canvas.bringObjectForward(layer.group as unknown as FabricObject)
    canvas.renderAll()

    // 2️⃣ Đảo vị trí trong mảng Vue để panel cập nhật
    const temp = layers.value[index]
    layers.value[index] = layers.value[index + 1]
    layers.value[index + 1] = temp

    // 3️⃣ Ép Vue re-render (do swap có thể không reactive)
    layers.value = [...layers.value]
  }
  console.log(index)
}

function moveDown(id: string) {
  const index = layers.value.findIndex(l => l.id === id)
  if (index <= 0) return

  const layer = layers.value[index]
  if (layer?.group) {
    canvas.sendObjectBackwards(layer.group as unknown as FabricObject)
    canvas.renderAll()

    const temp = layers.value[index]
    layers.value[index] = layers.value[index - 1]
    layers.value[index - 1] = temp
    layers.value = [...layers.value]
  }
  console.log(index)
}


function moveToTop(id: string) {
  const index = layers.value.findIndex(l => l.id === id)
  if (index < 0 || index === layers.value.length - 1) return
  const layer = layers.value[index]
  if (layer?.group) {
    canvas.bringObjectToFront(layer.group as unknown as FabricObject)
    canvas.renderAll()
    
    const temp = layers.value[index]
    if(index == 0) {
      layers.value.shift();
    }
    else
    {
      layers.value.splice(index,1);
    }
    layers.value.push(temp);
    layers.value = [...layers.value]
  }
}

function moveToBottom(id: string) {
  const index = layers.value.findIndex(l => l.id === id)
  if (index <= 0) return
  const layer = layers.value[index]
  if (layer?.group) {
    canvas.sendObjectToBack(layer.group as unknown as FabricObject)
    canvas.renderAll()
    
    const temp = layers.value[index]
    if(index +1 == layers.value.length) {
      layers.value.splice(index,1);
    }
    else
    {
      layers.value.splice(index+1,1);
    }
    
    layers.value.unshift(temp);
    layers.value = [...layers.value]
  }
}

function addEmptyLayer() {
  layers.value.push({
    id: 'layer' + (layers.value.length+1),
    name: 'Layer ' + (layers.value.length + 1),
    zIndex: layers.value.length + 1,
    visible: true,
    shapes: [],
  })
  renderLayers()
}

function clearLayer(id: string) {
  const layer = layers.value.find(l => l.id === id)
  if (layer) {
    layer.shapes = []
    renderLayers()
  }
}

function removeLayer(id: string) {
  layers.value = layers.value.filter(l => l.id !== id)
  renderLayers()
}

const selectedId = ref<string | null>(null)
function selectLayer(id: string) {
  const index = layers.value.findIndex(l => l.id === id)
  console.log('Layer index:', index)
  selectedId.value = id
}
</script>

<style>
canvas{
  border: black 1px solid;
}
.editor {
  display: flex;
  gap: 20px;
}
.layer-panel {
  width: 200px;
  height: 400px;
  border: 1px solid #ccc;
  padding: 10px;
  display: flex;
  flex-direction: column;
}

.add-layer-button {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 40px;
  border-bottom: 1px solid #ccc;
  cursor: pointer;
  font-size: 24px;
  flex-shrink: 0; 
}
.add-layer-button:hover {
  background-color: #f0f0f0;
}

.layers-list-container{
  flex: 1;
  overflow-y: auto;
  padding: 5px;
}

.layer-item {
  width: 130px;
  height: 60px;
  cursor: pointer;
  padding: 5px;
  border-top: 1px solid #ddd;
  margin-bottom: 5px;
}
.layer-item.active {
  background: #e0f0ff;
}
</style>