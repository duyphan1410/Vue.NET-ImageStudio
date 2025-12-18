<template>
  <div class="editor-container">
    <!-- Toolbar bên trái -->
    <div class="toolbar">
      <button 
        v-for="tool in tools" 
        :key="tool.id"
        :class="['tool-btn', { active: activeTool === tool.id }]"
        @click="setActiveTool(tool.id)"
        :title="tool.label"
      >
        {{ tool.icon }}
      </button>
      
      <div class="color-picker">
        <input type="color" v-model="brushColor" />
      </div>
      
      <div class="brush-size" v-if="['brush', 'eraser'].includes(activeTool)">
        <label>Size: {{ brushSize }}</label>
        <input type="range" v-model.number="brushSize" min="1" max="50" />
      </div>
    </div>

    <!-- Canvas ở giữa -->
    <div class="canvas-area">
      <canvas ref="canvasEl"></canvas>
    </div>

    <!-- Layer Panel bên phải -->
    <div class="layer-panel">
      <div class="panel-header">
        <h3>Layers</h3>
        <button @click="addEmptyLayer" class="add-layer-btn">➕</button>
      </div>

      <div class="layers-list">
        <div 
          v-for="(layer, index) in [...layers].reverse()" 
          :key="layer.id"
          :class="['layer-item', { active: layer.id === selectedId }]"
          @click="selectLayer(layer.id)"
          @contextmenu="openContextMenu($event, layer.id)"
        >
          <button 
            class="visibility-btn" 
            @click.stop="toggleVisibility(layer.id)"
          >
            {{ layer.visible ? '👁️' : '🚫' }}
          </button>
          
          <div class="layer-thumbnail">
            <canvas :ref="el => setThumbnailRef(el, layer.id)" width="40" height="40"></canvas>
          </div>
          
          <div class="layer-name">{{ layer.name }}</div>
          
          <button 
            class="more-btn" 
            @click.stop="toggleLayerMenu(layer.id)"
          >
            ⋮
          </button>

          <!-- Dropdown Menu -->
          <div v-if="layerMenuId === layer.id" class="layer-dropdown-menu" @click.stop>
            <button @click="duplicateLayer(layer.id)">Duplicate Layer</button>
            <button @click="moveToTop(layer.id)">Bring to Front</button>
            <button @click="moveToBottom(layer.id)">Send to Back</button>
            <button @click="moveUp(layer.id)">Bring Forward</button>
            <button @click="moveDown(layer.id)">Send Backward</button>
            <button @click="clearLayer(layer.id)">Clear Layer</button>
            <button @click="removeLayer(layer.id)" class="danger">Delete Layer</button>
          </div>
        </div>
      </div>

      <!-- Context Menu -->
      <div 
        v-if="contextMenu" 
        class="context-menu"
        :style="{ top: contextMenu.y + 'px', left: contextMenu.x + 'px' }"
        @click.stop
      >
        <button @click="duplicateLayer(contextMenu.layerId)">Duplicate Layer</button>
        <button @click="moveToTop(contextMenu.layerId)">Bring to Front</button>
        <button @click="moveToBottom(contextMenu.layerId)">Send to Back</button>
        <button @click="moveUp(contextMenu.layerId)">Bring Forward</button>
        <button @click="moveDown(contextMenu.layerId)">Send Backward</button>
        <hr />
        <button @click="clearLayer(contextMenu.layerId)">Clear Layer</button>
        <button @click="removeLayer(contextMenu.layerId)" class="danger">Delete Layer</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch, nextTick } from 'vue'
import { fabric } from 'fabric';

type FabricItem = fabric.Rect | fabric.Circle | fabric.Path | fabric.Text | fabric.Image | fabric.Object

interface LayerModel {
  id: string
  name: string
  visible: boolean
  canvas: fabric.Canvas | null
  objects: FabricItem[]
}

const canvasEl = ref<HTMLCanvasElement | null>(null)
let mainCanvas: fabric.Canvas
const thumbnailRefs = ref<Map<string, HTMLCanvasElement>>(new Map())

const layers = ref<LayerModel[]>([])
const selectedId = ref<string | null>(null)
const activeTool = ref('brush')
const brushSize = ref(5)
const brushColor = ref('#000000')
const layerMenuId = ref<string | null>(null)
const contextMenu = ref<{ x: number; y: number; layerId: string } | null>(null)

const tools = [
  { id: 'select', icon: '🖱️', label: 'Select' },
  { id: 'brush', icon: '🖌️', label: 'Brush' },
  { id: 'eraser', icon: '🧹', label: 'Eraser' },
  { id: 'rectangle', icon: '▭', label: 'Rectangle' },
  { id: 'circle', icon: '⭕', label: 'Circle' },
  { id: 'text', icon: '𝐓', label: 'Text' },
  { id: 'hand', icon: '✋', label: 'Pan' },
]

function createCheckerboardBackground() {
  const patternCanvas = document.createElement('canvas')
  const patternCtx = patternCanvas.getContext('2d')
  if (!patternCtx) return
  
  // Kích thước mỗi ô vuông
  const squareSize = 10
  patternCanvas.width = squareSize * 2
  patternCanvas.height = squareSize * 2
  
  // Vẽ pattern caro
  patternCtx.fillStyle = '#ffffff'
  patternCtx.fillRect(0, 0, squareSize * 2, squareSize * 2)
  
  patternCtx.fillStyle = '#e0e0e0'
  patternCtx.fillRect(0, 0, squareSize, squareSize)
  patternCtx.fillRect(squareSize, squareSize, squareSize, squareSize)
  
  // Tạo pattern và set làm background
  const pattern = patternCtx.createPattern(patternCanvas, 'repeat')
  if (pattern) {
    mainCanvas.backgroundImage = null
    mainCanvas.backgroundColor = pattern as any
    mainCanvas.renderAll()
  }
}

onMounted(() => {
  mainCanvas = new fabric.Canvas(canvasEl.value!, {
    width: 800,
    height: 600,
    selection: true,
    backgroundColor: null, // nền trong suốt
    preserveObjectStacking: true, // giữ thứ tự layer khi chọn
    isDrawingMode: false,
  })

  // Tạo background pattern caro (checkerboard)
  createCheckerboardBackground()

  // Event khi vẽ xong
  mainCanvas.on('path:created', (e: any) => {
    const path = e.path
    const currentLayer = layers.value.find(l => l.id === selectedId.value)
    if (currentLayer && path) {
      currentLayer.objects.push(path)
      updateThumbnail(currentLayer.id)
    }
    console.log(`Đã vẽ vào ${currentLayer.name}`)
  })

  // Event khi thêm object
  mainCanvas.on('object:added', (e: any) => {
    if (!e.target) return
    const currentLayer = layers.value.find(l => l.id === selectedId.value)
    if (currentLayer && !currentLayer.objects.includes(e.target)) {
      // Chỉ thêm nếu chưa có trong layer
      if (!(e.target instanceof fabric.Path)) { // Path đã được thêm trong path:created
        currentLayer.objects.push(e.target)
      }
      updateThumbnail(currentLayer.id)
    }
    console.log(`Đã thêm obj vừa vẽ vào ${currentLayer.name}`)
  })

  initLayers()
  setupDrawingMode()
  
  // Close menus when clicking outside
  document.addEventListener('click', () => {
    layerMenuId.value = null
    contextMenu.value = null
  })
})

watch([brushSize, brushColor], () => {
  setupDrawingMode()
})

function setThumbnailRef(el: any, layerId: string) {
  if (el) {
    thumbnailRefs.value.set(layerId, el)
  }
}


function setupDrawingMode() {
  mainCanvas.isDrawingMode = false

  if (activeTool.value === 'brush') {
    mainCanvas.isDrawingMode = true
    const brush = new fabric.PencilBrush(mainCanvas)
    brush.width = brushSize.value
    brush.color = brushColor.value
    mainCanvas.freeDrawingBrush = brush
    console.log(brush)
  }

  else if (activeTool.value === 'eraser') {
    mainCanvas.isDrawingMode = true

    // 🧩 Tạo "EraserBrush" thủ công cho Fabric v5
    const EraserBrush = fabric.util.createClass(fabric.PencilBrush, {
      _finalizeAndAddPath: function (pathData) {
        const path = this.createPath(pathData)
        path.globalCompositeOperation = 'destination-out'
        path.selectable = false
        path.evented = false
        this.canvas.add(path)
        this.canvas.requestRenderAll()
      },
    })

    const eraser = new EraserBrush(mainCanvas)
    eraser.width = brushSize.value
    eraser.color = 'rgba(0,0,0,1)'
    mainCanvas.freeDrawingBrush = eraser
  }

  else {
    mainCanvas.isDrawingMode = false
  }
}



function setActiveTool(toolId: string) {
  activeTool.value = toolId
  setupDrawingMode()
  
  // Nếu chọn rectangle hoặc circle, bật chế độ vẽ shape
  if (toolId === 'rectangle' || toolId === 'circle') {
    enableShapeDrawing(toolId)
  }
}

// const shapeClasses = {
//   rectangle: fabric.Rect,
//   circle: fabric.Circle,
//   triangle: fabric.Triangle,
//   line: fabric.Line,
// };

// const ShapeClass = shapeClasses[shapeType];
// if (ShapeClass) {
//   shape = new ShapeClass({
//     left: startX,
//     top: startY,
//     fill: brushColor.value,
//     stroke: brushColor.value,
//     strokeWidth: 2,
//   });
//   canvas.add(shape);
// }

function enableShapeDrawing(shapeType: string) {
  let isDrawing = false
  let startX = 0, startY = 0
  let shape: fabric.Object | null = null

  mainCanvas.on('mouse:down', (e) => {
    if (activeTool.value !== shapeType) return
    isDrawing = true
    const pointer = mainCanvas.getPointer(e.e)
    startX = pointer.x
    startY = pointer.y

    if (shapeType === 'rectangle') {
      shape = new fabric.Rect({
        left: startX,
        top: startY,
        width: 0,
        height: 0,
        fill: brushColor.value,
        stroke: brushColor.value,
        strokeWidth: 2,
      })
    } else if (shapeType === 'circle') {
      shape = new fabric.Circle({
        left: startX,
        top: startY,
        radius: 0,
        fill: 'transparent',
        stroke: brushColor.value,
        strokeWidth: 2,
      })
    }

    if (shape) {
      mainCanvas.add(shape as any)
    }
  })

  mainCanvas.on('mouse:move', (e) => {
    if (!isDrawing || !shape) return
    const pointer = mainCanvas.getPointer(e.e)

    if (shapeType === 'rectangle' && shape instanceof fabric.Rect) {
      const width = pointer.x - startX
      const height = pointer.y - startY
      shape.set({
        width: Math.abs(width),
        height: Math.abs(height),
        left: width > 0 ? startX : pointer.x,
        top: height > 0 ? startY : pointer.y,
      })
    } else if (shapeType === 'circle' && shape instanceof fabric.Circle) {
      const radius = Math.sqrt(Math.pow(pointer.x - startX, 2) + Math.pow(pointer.y - startY, 2))
      shape.set({ radius: radius / 2 })
    }

    mainCanvas.renderAll()
  })

  mainCanvas.on('mouse:up', () => {
    if (isDrawing && shape) {
      const currentLayer = layers.value.find(l => l.id === selectedId.value)
      if (currentLayer) {
        currentLayer.objects.push(shape)
        console.log(`Đã thêm hình ${shape} vào ${currentLayer.name}`)
        updateThumbnail(currentLayer.id)
      }
    }
    isDrawing = false
    shape = null
  })
}

function initLayers() {
  const layer1: LayerModel = {
    id: 'layer1',
    name: 'Layer 1',
    visible: true,
    canvas: null,
    objects: []
  }
  layers.value.push(layer1)
  selectedId.value = 'layer1'
  
  nextTick(() => {
    updateThumbnail('layer1')
  })
}

function updateThumbnail(layerId: string) {
  const layer = layers.value.find(l => l.id === layerId)
  if (!layer) return
  
  const thumbCanvas = thumbnailRefs.value.get(layerId)
  if (!thumbCanvas) return
  
  const ctx = thumbCanvas.getContext('2d')
  if (!ctx) return
  
  // Vẽ background caro cho thumbnail
  const squareSize = 5
  for (let i = 0; i < 40; i += squareSize) {
    for (let j = 0; j < 40; j += squareSize) {
      ctx.fillStyle = ((i / squareSize) + (j / squareSize)) % 2 === 0 ? '#ffffff' : '#e0e0e0'
      ctx.fillRect(i, j, squareSize, squareSize)
    }
  }
  
  // Nếu layer bị ẩn, vẽ overlay tối
  if (!layer.visible) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
    ctx.fillRect(0, 0, 40, 40)
  }
  
  // Draw miniature of objects
  const scale = 40 / Math.max(mainCanvas.width!, mainCanvas.height!)
  ctx.save()
  ctx.scale(scale, scale)
  
  layer.objects.forEach(obj => {
    if (obj && obj.visible) {
      obj.render(ctx as any)
    }
  })
  
  ctx.restore()
}

function renderAllLayers() {
  mainCanvas.clear()
  
  // Tạo lại background pattern caro
  createCheckerboardBackground()
  
  // Render theo thứ tự layer (layer đầu tiên ở dưới cùng)
  layers.value.forEach(layer => {
    if (layer.visible) {
      layer.objects.forEach(obj => {
        if (obj && !mainCanvas.getObjects().includes(obj)) {
          mainCanvas.add(obj as any)
        }
      })
    } else {
      layer.objects.forEach(obj => {
        if (obj) {
          mainCanvas.remove(obj as any)
        }
      })
    }
  })
  
  mainCanvas.renderAll()
  
  // Update all thumbnails
  layers.value.forEach(layer => {
    updateThumbnail(layer.id)
  })
}

function selectLayer(id: string) {
  selectedId.value = id
  const layer = layers.value.find(l => l.id === id)
  console.log('Selected layer:', layer.name)
}

function addEmptyLayer() {
  const newId = `layer${Date.now()}`
  const newLayer: LayerModel = {
    id: newId,
    name: `Layer ${layers.value.length + 1}`,
    visible: true,
    canvas: null,
    objects: []
  }
  layers.value.push(newLayer)
  selectedId.value = newId
  console.log(`Thêm ${newLayer.name}`)
  
  nextTick(() => {
    updateThumbnail(newId)
  })
}

function toggleVisibility(id: string) {
  const layer = layers.value.find(l => l.id === id)
  if (!layer) return
  
  layer.visible = !layer.visible
  
  // Ẩn/hiện tất cả objects trong layer
  layer.objects.forEach(obj => {
    if (obj) {
      if (layer.visible) {
        if (!mainCanvas.getObjects().includes(obj)) {
          mainCanvas.add(obj as any)
        }
      } else {
        mainCanvas.remove(obj as any)
      }
    }
  })
  
  if(layer.visible){
    console.log(`Bật ${layer.name}`)
  }else{
    console.log(`Tắt ${layer.name}`)
  }

  renderAllLayers()
  updateThumbnail(id)
}

async function duplicateLayer(id: string) {
  const index = layers.value.findIndex(l => l.id === id)
  if (index === -1) return

  const layer = layers.value[index]

  const newLayer: LayerModel = {
    id: `layer${Date.now()}`,
    name: `${layer.name} copy`,
    visible: true,
    canvas: null,
    objects: []
  }

  // 🧩 Trong Fabric v5, obj.clone(callback) là đồng bộ qua callback (không phải Promise)
  const clonedObjects: fabric.Object[] = []

  for (const obj of layer.objects) {
    if (!obj || typeof obj.clone !== 'function') continue

    await new Promise<void>((resolve) => {
      obj.clone((cloned: fabric.Object) => {
        if (cloned) {
          // Dịch vị trí để dễ thấy bản sao
          cloned.set({
            left: (obj.left || 0) + 10,
            top: (obj.top || 0) + 10
          })
          cloned.setCoords()

          // Lưu vào mảng layer
          clonedObjects.push(cloned)
          // Thêm vào canvas chính
          mainCanvas.add(cloned)
        }
        resolve()
      })
    })
  }

  newLayer.objects = clonedObjects
  layers.value.splice(index + 1, 0, newLayer)
  mainCanvas.renderAll()
}


function moveUp(id: string) {
  const index = layers.value.findIndex(l => l.id === id)
  if (index >= layers.value.length - 1) return
  
  // Swap trong array
  const temp = layers.value[index]
  layers.value[index] = layers.value[index + 1]
  layers.value[index + 1] = temp
  
  renderAllLayers()
  closeMenus()
}

function moveDown(id: string) {
  const index = layers.value.findIndex(l => l.id === id)
  if (index <= 0) return
  
  // Swap trong array
  const temp = layers.value[index]
  layers.value[index] = layers.value[index - 1]
  layers.value[index - 1] = temp
  
  renderAllLayers()
  closeMenus()
}

function moveToTop(id: string) {
  const index = layers.value.findIndex(l => l.id === id)
  if (index >= layers.value.length - 1) return
  
  const layer = layers.value.splice(index, 1)[0]
  layers.value.push(layer)
  
  renderAllLayers()
  closeMenus()
}

function moveToBottom(id: string) {
  const index = layers.value.findIndex(l => l.id === id)
  if (index <= 0) return
  
  const layer = layers.value.splice(index, 1)[0]
  layers.value.unshift(layer)
  
  renderAllLayers()
  closeMenus()
}

function clearLayer(id: string) {
  const layer = layers.value.find(l => l.id === id)
  if (!layer) return
  
  // Xóa tất cả objects khỏi canvas
  layer.objects.forEach(obj => {
    if (obj) {
      mainCanvas.remove(obj as any)
    }
  })
  
  layer.objects = []
  mainCanvas.renderAll()
  updateThumbnail(id)
  closeMenus()
}

async function removeLayer(id: string) {
  
  const layer = layers.value.find(l => l.id === id)
  if (!layer) return

  if (layers.value.length <= 1) {
    alert("Cannot delete the last layer!");
    closeMenus();
    return;
  }
  

  const wasActive = selectedId.value === id;
  const index = layers.value.findIndex(l => l.id === id);
  if (index === -1) {
      closeMenus();
      return;
  }

  layers.value.splice(index, 1);

  let nextSelectedId: string | null = null;
  if (wasActive) {
    // Nếu xóa layer đang active, chọn layer trên cùng mới
    nextSelectedId = layers.value[layers.value.length - 1]?.id || null;
  } else {
    // Nếu xóa một layer khác, giữ nguyên layer đang active
    nextSelectedId = selectedId.value;
  }
  
  await selectLayer(nextSelectedId);
  
  renderAllLayers()
  console.log(`Đã xóa ${layer.name}`)
  closeMenus()
}

function toggleLayerMenu(id: string) {
  layerMenuId.value = layerMenuId.value === id ? null : id
  contextMenu.value = null
}

function openContextMenu(event: MouseEvent, id: string) {
  event.preventDefault()
  contextMenu.value = {
    x: event.clientX,
    y: event.clientY,
    layerId: id
  }
  layerMenuId.value = null
}

function closeMenus() {
  layerMenuId.value = null
  contextMenu.value = null
}
</script>

<style scoped>
.editor-container {
  display: flex;
  padding: 10px;
  background: #2c2c2c;
  color: #fff;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
}

/* Toolbar */
.toolbar {
  width: 60px;
  background: #1a1a1a;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px 5px;
  gap: 5px;
  border-right: 1px solid #000;
}

.tool-btn {
  width: 45px;
  height: 45px;
  background: #2c2c2c;
  border: 1px solid #3c3c3c;
  border-radius: 4px;
  cursor: pointer;
  font-size: 20px;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tool-btn:hover {
  background: #3c3c3c;
}

.tool-btn.active {
  background: #0d7dd9;
  border-color: #0d7dd9;
}

.color-picker {
  margin-top: 10px;
  width: 45px;
  height: 45px;
}

.color-picker input {
  width: 100%;
  height: 100%;
  border: 2px solid #3c3c3c;
  border-radius: 4px;
  cursor: pointer;
}

.brush-size {
  margin-top: 15px;
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 5px;
}

.brush-size label {
  font-size: 10px;
  text-align: center;
  color: #ccc;
}

.brush-size input {
  width: 45px;
}

/* Canvas Area */
.canvas-area {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #2c2c2c;
  overflow: auto;
}

#canvas-wrapper {
  background-image: linear-gradient(45deg, #ccc 25%, transparent 25%),
                    linear-gradient(-45deg, #ccc 25%, transparent 25%),
                    linear-gradient(45deg, transparent 75%, #ccc 75%),
                    linear-gradient(-45deg, transparent 75%, #ccc 75%);
  background-size: 20px 20px;
  background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
}
canvas {
  background-color: transparent;
}

/* Layer Panel */
.layer-panel {
  width: 280px;
  background: #1a1a1a;
  border-left: 1px solid #000;
  display: flex;
  flex-direction: column;
  position: relative;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 15px;
  border-bottom: 1px solid #3c3c3c;
}

.panel-header h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
}

.add-layer-btn {
  background: transparent;
  border: none;
  color: #fff;
  font-size: 18px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
}

.add-layer-btn:hover {
  background: #3c3c3c;
}

.layers-list {
  flex: 1;
  overflow-y: auto;
  padding: 5px;
}

.layer-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px;
  margin-bottom: 4px;
  background: #2c2c2c;
  border: 1px solid #3c3c3c;
  border-radius: 4px;
  cursor: pointer;
  position: relative;
  transition: background 0.2s;
}

.layer-item:hover {
  background: #3c3c3c;
}

.layer-item.active {
  background: #0d7dd9;
  border-color: #0d7dd9;
}

.visibility-btn {
  background: transparent;
  border: none;
  font-size: 16px;
  cursor: pointer;
  padding: 4px;
  flex-shrink: 0;
}

.layer-thumbnail {
  width: 40px;
  height: 40px;
  border: 1px solid #3c3c3c;
  border-radius: 2px;
  overflow: hidden;
  flex-shrink: 0;
}

.layer-thumbnail canvas {
  display: block;
  width: 100%;
  height: 100%;
}

.layer-name {
  flex: 1;
  font-size: 13px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.more-btn {
  background: transparent;
  border: none;
  color: #fff;
  font-size: 20px;
  font-weight: bold;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 3px;
  flex-shrink: 0;
}

.more-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

/* Dropdown & Context Menu */
.layer-dropdown-menu,
.context-menu {
  position: absolute;
  background: #2c2c2c;
  border: 1px solid #3c3c3c;
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
  z-index: 1000;
  min-width: 180px;
  padding: 4px 0;
}

.layer-dropdown-menu {
  right: 0;
  top: 100%;
  margin-top: 4px;
}

.context-menu {
  position: fixed;
}

.layer-dropdown-menu button,
.context-menu button {
  width: 100%;
  background: transparent;
  border: none;
  color: #fff;
  padding: 8px 16px;
  text-align: left;
  cursor: pointer;
  font-size: 13px;
}

.layer-dropdown-menu button:hover,
.context-menu button:hover {
  background: #3c3c3c;
}

.layer-dropdown-menu button.danger,
.context-menu button.danger {
  color: #ff6b6b;
}

.layer-dropdown-menu hr,
.context-menu hr {
  border: none;
  border-top: 1px solid #3c3c3c;
  margin: 4px 0;
}
</style>