<script setup>
import { ref, onMounted, onBeforeUnmount } from "vue";

const stageRef = ref(null);
const layerRef = ref(null);

const stageConfig = ref({ width: 800, height: 550 });

onMounted(() => {
  const wrapper = document.querySelector(".canvas-wrapper");
  stageConfig.value.width = wrapper.clientWidth;
  stageConfig.value.height = wrapper.clientHeight;
  window.addEventListener("resize", () => {
    stageConfig.value.width = wrapper.clientWidth;
    stageConfig.value.height = wrapper.clientHeight;
  });
});

const uploadedImage = ref(null);
const tool = ref("brush"); // 'brush' | 'eraser' | 'select'
const brushColor = ref("#000000");
const brushSize = ref(10);

const lines = ref([]); // các stroke
const redoStack = ref([]); // dùng cho redo

// brush cursor preview
const cursor = ref({ x: 0, y: 0, visible: false });

function setTool(t) {
  tool.value = t;
}

function onFileChange(e) {
  const file = e.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    const img = new window.Image();
    img.src = reader.result;
    img.onload = () => {
      const maxW = stageConfig.value.width;
      const maxH = stageConfig.value.height;
      const scale = Math.min(maxW / img.width, maxH / img.height);

      uploadedImage.value = {
        image: img,
        width: img.width * scale,
        height: img.height * scale,
        x: (maxW - img.width * scale) / 2,
        y: (maxH - img.height * scale) / 2
      };
    };
  };
  reader.readAsDataURL(file);
}

// vẽ tự do
let isDrawing = false;
function onMouseDown(e) {
  if (tool.value !== "brush" && tool.value !== "eraser") return;
  isDrawing = true;
  redoStack.value = [];
  const pos = e.target.getStage().getPointerPosition();
  lines.value.push({
    tool: tool.value,
    color: brushColor.value,
    size: brushSize.value,
    points: [pos.x, pos.y],
  });
}
function onMouseMove(e) {
  const stage = e.target.getStage();
  const point = stage.getPointerPosition();

  // cập nhật preview cursor
  cursor.value = { x: point.x, y: point.y, visible: true };

  if (!isDrawing) return;
  const lastLine = lines.value[lines.value.length - 1];
  lastLine.points = lastLine.points.concat([point.x, point.y]);
}
function onMouseUp() {
  isDrawing = false;
}

function undo() {
  if (lines.value.length) redoStack.value.push(lines.value.pop());
}
function redo() {
  if (redoStack.value.length) lines.value.push(redoStack.value.pop());
}

// Keyboard shortcut
function handleKey(e) {
  if (e.ctrlKey && e.key.toLowerCase() === "z") {
    if (e.shiftKey) redo();
    else undo();
    e.preventDefault();
  } else if (e.ctrlKey && e.key.toLowerCase() === "y") {
    redo();
    e.preventDefault();
  }
}

onMounted(() => {
  window.addEventListener("keydown", handleKey);
});
onBeforeUnmount(() => {
  window.removeEventListener("keydown", handleKey);
});

async function saveImage() {
  const uri = stageRef.value.getNode().toDataURL({ mimeType: "image/png", pixelRatio: 1 });
  try {
    const res = await fetch("/api/image/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: uri }),
    });
    const txt = await res.text();
    if (!res.ok) throw new Error(`${res.status} ${txt}`);
    const data = JSON.parse(txt);
    alert("Saved to: " + data.url);
  } catch (err) {
    alert("Save failed: " + err.message);
  }
}
</script>

<template>
  <div class="editor-container">
    <div class="toolbar">
      <button @click="setTool('brush')">Brush</button>
      <button @click="setTool('eraser')">Eraser</button>
      <input type="color" v-model="brushColor" />
      <input type="range" min="1" max="50" v-model="brushSize" />
      <button @click="undo">Undo</button>
      <button @click="redo">Redo</button>
      <input type="file" @change="onFileChange" />
      <button @click="saveImage">Save</button>
    </div>

    <div class="canvas-wrapper">
      <v-stage
        ref="stageRef"
        :config="stageConfig"
        @mousedown="onMouseDown"
        @mousemove="onMouseMove"
        @mouseup="onMouseUp"
        @mouseleave="cursor.visible = false"
        @mouseenter="cursor.visible = true"
        @touchstart="onMouseDown"
        @touchmove="onMouseMove"
        @touchend="onMouseUp"
      >
        <v-layer ref="layerRef">
          <v-image v-if="uploadedImage" :config="uploadedImage" />
          <v-line
            v-for="(line, i) in lines"
            :key="i"
            :points="line.points"
            :stroke="line.tool === 'eraser' ? '#000' : line.color"
            :strokeWidth="line.size"
            :lineCap="'round'"
            :lineJoin="'round'"
            :globalCompositeOperation="line.tool === 'eraser' ? 'destination-out' : 'source-over'"
          />
          <!-- brush preview -->
          <v-circle
            v-if="cursor.visible"
            :config="{
              x: cursor.x,
              y: cursor.y,
              radius: brushSize / 2,
              stroke: 'black',
              strokeWidth: 1,
              dash: [4, 2]
            }"
          />
        </v-layer>
      </v-stage>
    </div>
  </div>
</template>

<style scoped>
.editor-container {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin: auto;
}

.toolbar {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}

.canvas-wrapper {
  display: inline-block;   /* để fit theo kích thước stage */
  border: 2px solid #444;
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  margin-top: 10px;
  background: #fff;
  width: 100%
}
</style>
