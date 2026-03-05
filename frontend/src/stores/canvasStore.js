import { defineStore } from 'pinia';
import { markRaw, nextTick } from 'vue';
import { LayerService } from '@/services/LayerService';
import { ToolService } from '@/services/ToolService';
import { ImageService } from '@/services/ImageService';
import { SmartEraserService } from '@/services/SmartEraserService';
import { Group, Path } from 'fabric';

export const useCanvasStore = defineStore('canvas', {
  state: () => ({
    layers: [],
    selectedId: null,
    activeTool: 'brush',
    brushSize: 5,
    brushColor: '#000000',
    thumbnailRefs: new Map(),

    width: 800,   // Canvas width (px)
    height: 600,  // Canvas height (px)
    dpi: 1,

    historyStack: [],     // Ngăn xếp lưu lịch sử
    historyIndex: -1,     // Con trỏ vị trí hiện tại (-1 là chưa có gì)
    isUndoing: false,     // Cờ báo hiệu đang Undo/Redo để chặn Save đè
    isLoadingFromJSON: false,
    isEditingProperty: false,
    selectedObject: null,
    isLocked: false,
  }),

  getters: {
    activeLayer: (state) => state.layers.find(l => l.id === state.selectedId),
    activeFabric: (state) => {
      const layer = state.layers.find(l => l.id === state.selectedId);
      return layer ? layer.fabric : null;
    }
  },

  actions: {
    // --- Init ---
    initFirstLayer() {
      if (this.layers.length === 0) {
        this.addLayer('Layer 1');
      }
    },

    setSelectedObject(obj) {
      if (!obj) {
        this.selectedObject = null;
        return;
      }

      // Đảm bảo object này có ID (phòng trường hợp object mới tạo chưa có)
      if (!obj.get('editorId')) {
        obj.set('editorId', crypto.randomUUID());
        console.log(`[Selection] ID mới: ${obj.editorId}`);
      }

      // Gán tham chiếu để Vue/Bảng thuộc tính hoạt động
      this.selectedObject = obj;

      console.log(`[Selection] Đã chọn object: ${obj.editorId}`);
    },

    clearSelection() {
      if (this.isUndoing) return;
      this.selectedObject = null;
    },

    startHistory() {
      this.isEditingProperty = true;
    },

    endHistory() {
      this.isEditingProperty = false;
      this.saveState(); // CHỈ LƯU 1 LẦN
    },

    syncLockState(obj) {
      if (!obj) {
        this.isLocked = false;
        return;
      }
      this.isLocked = (
        obj.lockMovementX &&
        obj.lockMovementY &&
        obj.lockScalingX &&
        obj.lockScalingY &&
        obj.lockRotation
      );
      console.log('[Store] Synced lock state:', this.isLocked);
    },

    applyLock(obj, locked) {
      if (!obj) return;
      obj.set({
        lockMovementX: locked,
        lockMovementY: locked,
        lockScalingX: locked,
        lockScalingY: locked,
        lockRotation: locked,
        hasControls: !locked,
      });
      obj.setCoords();
      this.isLocked = locked;
      console.log('[Store] Applied lock:', locked);
    },

    addLayer(name = 'New Layer', options = {}) {
      const { skipHistory = false } = options;
      const newId = `layer_${Date.now()}`;
      this.layers.push({
        id: newId,
        name: name,
        visible: true,
        canvasEl: null,
        fabric: null
      });
      // Chọn layer mới -> Vue sẽ tự update DOM pointer-events nhờ binding trong template
      this.selectedId = newId;

      this.updateLayerInteractions();
      if (!skipHistory) {
        this.saveState();
      }
    },

    async addImage(file) {
      const activeLayer = this.layers.find(l => l.id === this.selectedId);

      if (!activeLayer || !activeLayer.fabric) {
        alert('Vui lòng chọn một layer để thêm ảnh!');
        return;
      }

      const canvas = activeLayer.fabric;

      const img = await ImageService.createImageObject(file, canvas);

      if (!img.editorId) {
        img.editorId = crypto.randomUUID();  // Failsafe
      }

      canvas.add(img);
      canvas.setActiveObject(img);

      this.setTool('select');

      activeLayer.fabric.requestRenderAll();
      this.triggerUpdateThumbnail(activeLayer.id);
      this.saveState();
    },

    async bakeSelectedObject() {
      const layer = this.layers.find(l => l.id === this.selectedId);
      if (!layer?.fabric) return;

      const activeObj = layer.fabric.getActiveObject();
      if (!activeObj) {
        alert('Vui lòng chọn một object để bake!');
        return;
      }

      await SmartEraserService.bakeObject(activeObj, layer.fabric);
      this.triggerUpdateThumbnail(layer.id);
      this.saveState();
    },

    async bakeAllPathsInLayer(layerId) {
      const layer = this.layers.find(l => l.id === layerId);
      if (!layer?.fabric) return;

      const objects = layer.fabric.getObjects().slice();

      for (const obj of objects) {
        if (obj.type === 'path' && !obj._isRasterized) {
          await SmartEraserService.bakeObject(obj, layer.fabric);
        }
      }

      this.triggerUpdateThumbnail(layerId);
      this.saveState();
    },

    toggleLayerVisibility(id) {
      const layer = this.layers.find(l => l.id === id);
      if (!layer) return;

      layer.visible = !layer.visible;
      this.saveState();
    },

    async registerLayerCanvas(layerId, el) {
      // console.log('🧪 SmartEraserService check:', {
      //   exists: !!SmartEraserService,
      //   applyToLayers: typeof SmartEraserService?.applyToLayers
      // });

      const layer = this.layers.find(l => l.id === layerId);
      if (!layer) return;

      // Nếu fabric đã có, chỉ cập nhật DOM ref
      if (layer.fabric) {
        if (layer.canvasEl !== el) {
          layer.canvasEl = el;
        }

        this.triggerUpdateThumbnail(layerId);

        // Sau khi Vue re-render, phải apply lại tool
        // Vì Fabric có thể bị reset state
        if (this.selectedId === layerId) {
          this.applyCurrentTool(layer.fabric);
        }
        return;
      }

      // Init Fabric Mới
      const fabricCanvas = LayerService.initCanvas(el);

      if (!fabricCanvas) {
        console.error(`[Init] Failed to create Fabric for ${layerId}`);
        return;
      }

      layer.fabric = markRaw(fabricCanvas);
      layer.canvasEl = el;

      // ===== SELECTION EVENTS (CHO PROPERTY PANEL) =====
      fabricCanvas.on('selection:created', (e) => {
        const obj = e.selected?.[0] || null;
        if (!obj) return;
        this.applySelectionStyle(obj);
        this.setSelectedObject(obj);
      });

      fabricCanvas.on('selection:updated', (e) => {
        const obj = e.selected?.[0] || null;
        if (!obj) return;

        this.applySelectionStyle(obj);
        this.setSelectedObject(obj);
      });

      fabricCanvas.on('selection:cleared', () => {
        this.clearSelection();
      });


      fabricCanvas.on('path:created', async (e) => {
        if (this.activeTool === 'eraser') {
          // 1. Lấy eraser path vừa vẽ
          this.isUndoing = true;
          const eraserPath = e.path;

          // const zoom = fabricCanvas.getZoom() || 1;
          // eraserPath.strokeWidth = this.eraserSize / zoom;
          // eraserPath.setCoords();


          // eraserPath.set({
          //   selectable: false,
          //   evented: false,
          //   erasable: false
          // });

          // 2. Xóa path preview khỏi canvas hiện tại
          const eraserGeometry = eraserPath.toObject(['path', 'strokeWidth', 'left', 'top', 'width', 'height', 'pathOffset']);

          if (eraserGeometry.width === 0) eraserGeometry.width = 1;
          if (eraserGeometry.height === 0) eraserGeometry.height = 1;

          // remove path khỏi canvas
          fabricCanvas.remove(eraserPath);
          fabricCanvas.requestRenderAll();

          const activeLayer = this.layers.find(l => l.id === this.selectedId);

          // Nếu không có layer active hoặc layer đó bị khóa/ẩn -> Dừng
          if (!activeLayer || !activeLayer.visible || !activeLayer.fabric) {
            console.warn('⚠️ No active layer to erase');
            return;
          }
          try {
            // Vì Service mới là Async, ta phải await để đảm bảo xóa xong hết mới chạy tiếp
            await SmartEraserService.applyToLayers(
              eraserGeometry,
              [activeLayer],
              (targetLayerId) => this.triggerUpdateThumbnail(targetLayerId)
            );

            this.isUndoing = false;

            this.saveState();
          } catch (error) {
            console.error('❌ Eraser Failed:', error);
            this.isUndoing = false;
          }
          return; // Không save state ở đây
        } else {
          const path = e.path;

          path.set({
            editorId: crypto.randomUUID(),
            objectType: 'path',
            selectable: true,
            evented: true,
          });

          const center = path.getCenterPoint();

          // console.log('Vị trí pathOffset:', {
          //   left: path.pathOffset.x,
          //   top: path.pathOffset.y
          // });

          path.set({
            originX: 'center',
            originY: 'center',
            left: center.x,
            top: center.y
          });

          path.setCoords();

          fabricCanvas.requestRenderAll();
        }

        this.triggerUpdateThumbnail(layerId);
        this.saveState();
      });

      // fabricCanvas.on('object:added', () => {
      //   if (this.activeTool === 'eraser') return;
      //   if (this.isEditingProperty) return;
      //   this.triggerUpdateThumbnail(layerId);
      //   this.saveState();
      // });

      fabricCanvas.on('object:modified', () => {
        if (this.activeTool === 'eraser') return;
        if (this.isEditingProperty) return;
        this.triggerUpdateThumbnail(layerId);
        this.saveState()
      });
      fabricCanvas.on('object:removed', () => {
        if (this.activeTool === 'eraser') return;
        this.triggerUpdateThumbnail(layerId);
        this.saveState()
      });

      // Cập nhật quyền tương tác
      this.updateLayerInteractions();

      // NẠP DỮ LIỆU TỪ LỊCH SỬ HOẶC DUPLICATE
      const dataToLoad = layer.clonedData || layer.pendingData;

      if (dataToLoad) {
        // console.log(`[Duplicate] Loading data for ${layerId}`);
        LayerService.loadFromJSON(fabricCanvas, dataToLoad,
          () => { this.isLoadingFromJSON = true; },
          () => { this.isLoadingFromJSON = false; }
        ).then(() => {
          delete layer.clonedData;
          delete layer.pendingData;
          this.triggerUpdateThumbnail(layerId);
        });
      } else {
        // Nếu là layer trắng tinh mới tạo, cũng render thumbnail (để ra màu trắng/caro)
        this.triggerUpdateThumbnail(layerId);
      }

      // Nếu đây là layer đang chọn, apply tool ngay
      if (this.selectedId === layerId) {
        // console.log(`[Init] ${layerId} is selected, applying tool "${this.activeTool}"`);
        this.applyCurrentTool(fabricCanvas);
      } else {
        // console.log(`[Init] ${layerId} is NOT selected, disabling it`);
      }
    },

    updateLayerInteractions() {
      // console.log(`[Interactions] Updating for selectedId: ${this.selectedId}`);

      this.layers.forEach(layer => {
        if (!layer.fabric) return;

        const isSelected = layer.id === this.selectedId;

        if (isSelected) {
          console.log(`  ✅ ${layer.id}: ENABLED (drawing + selection)`);

          // Layer được chọn: Bật TẤT CẢ tính năng
          // layer.fabric.selection = true; 
          layer.fabric.skipTargetFind = false;
          layer.fabric.interactive = true; // Đảm bảo tương tác

          // VÔ HIỆU HÓA tất cả object events từ layer khác đang bị chọn nhầm
          layer.fabric.forEachObject(obj => {
            obj.selectable = true;
            obj.evented = true;
          });

        } else {
          console.log(`  ❌ ${layer.id}: DISABLED (no interaction)`);

          // Layer KHÔNG được chọn: TẮT HOÀN TOÀN
          // layer.fabric.isDrawingMode = false; // Tắt vẽ
          layer.fabric.selection = false;     // Tắt selection box
          layer.fabric.skipTargetFind = true; // Bỏ qua mọi click
          layer.fabric.interactive = false;   // Tắt tương tác

          // CRITICAL: Vô hiệu hóa TẤT CẢ objects trong layer này
          layer.fabric.forEachObject(obj => {
            obj.selectable = false;
            obj.evented = false;
          });

          // layer.fabric.discardActiveObject();
          // layer.fabric.requestRenderAll();
        }
      });
    },

    // --- Tools ---
    setTool(toolId) {
      // console.log(`[Tool] Switching to: ${toolId}`);
      this.activeTool = toolId;
    },

    applyCurrentTool(specificCanvas = null) {
      const canvas = specificCanvas || this.activeFabric;
      if (!canvas) {
        console.warn('[Tool] ⚠️ Cannot apply tool - no active canvas');
        return;
      }

      // console.log(`[Tool] Applying "${this.activeTool}" to canvas`);

      // Reset ALL tools
      ToolService.resetAllTools(canvas);
      // Reset các layer khác
      this.layers.forEach(l => {
        if (l.fabric && l.fabric !== canvas) {
          l.fabric.isDrawingMode = false;
          ToolService.clearShapeListeners(l.fabric);

          // Đảm bảo layer khác không bắt events
          l.fabric.selection = false;
          l.fabric.skipTargetFind = true;
        }
      });

      // Apply tool cho layer đích
      if (['brush', 'eraser'].includes(this.activeTool)) {
        ToolService.setupBrush(canvas, this.activeTool, {
          size: this.brushSize,
          color: this.brushColor
        });
      } else if (['rectangle', 'circle'].includes(this.activeTool)) {
        ToolService.setupShapeListeners(canvas, this.activeTool, this.brushColor, this.brushSize);
        canvas.selection = false;
        // canvas.forEachObject(obj => {
        //   obj.selectable = false;
        //   obj.evented = false;
        // });
      } else if (this.activeTool === 'select') {
        ToolService.clearShapeListeners(canvas);
        canvas.isDrawingMode = false;
        canvas.selection = true;
        canvas.skipTargetFind = false;
        // canvas.defaultCursor = 'default';

        canvas.forEachObject(obj => {
          obj.selectable = true;
          obj.evented = true;
        });
      }
      canvas.requestRenderAll();
      // console.log(`[Tool] Applied! isDrawingMode=${canvas.isDrawingMode}, selection=${canvas.selection}`);
    },

    applySelectionStyle(obj) {
      if (!obj) return;

      obj.set({
        borderColor: '#667eea',
        cornerColor: '#667eea',
        cornerSize: 8,
        cornerStyle: 'circle',
        transparentCorners: false,
        cornerStrokeColor: '#fff'
      });
    },

    triggerUpdateThumbnail(layerId) {
      const thumbnailCanvas = this.thumbnailRefs.get(layerId);
      const layer = this.layers.find(l => l.id === layerId);

      if (!thumbnailCanvas || !layer?.fabric) return;

      const ctx = thumbnailCanvas.getContext('2d');
      const dataURL = layer.fabric.toDataURL({ format: 'png', quality: 0.5 });
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, 40, 40);
        ctx.drawImage(img, 0, 0, 40, 40);
      };
      img.src = dataURL;
    },

    setThumbnailRef(layerId, el) {
      if (el) {
        this.thumbnailRefs.set(layerId, el);
      }
    },

    selectLayer(id) {
      console.log(`\n[Layer] ========== SELECTING LAYER: ${id} ==========`);
      this.selectedId = id;

      // CRITICAL: Update interactions TRƯỚC khi apply tool
      this.updateLayerInteractions();

      // Apply tool cho layer mới
      const targetLayer = this.layers.find(l => l.id === id);
      if (targetLayer?.fabric) {
        console.log(`[Layer] Applying current tool to ${id}`);
        this.applyCurrentTool(targetLayer.fabric);
      } else {
        console.warn(`[Layer] ⚠️ Layer ${id} has no fabric yet`);
      }
    },

    // updateBrushSettings(size, color) {
    //   this.brushSize = size;
    //   this.brushColor = color;

    //   const canvas = this.activeFabric;
    //   if (!canvas) return;

    //   if (canvas.freeDrawingBrush) {
    //     canvas.freeDrawingBrush.width = size;
    //     if (this.activeTool === 'brush') {
    //       canvas.freeDrawingBrush.color = color;
    //     }
    //   }

    //   // 2. Chỉ cập nhật Cursor nếu đang ở chế độ vẽ
    //   if (canvas.isDrawingMode) {
    //     // Dùng kỹ thuật kiểm tra đơn giản để tránh render SVG quá dày đặc
    //     // Nếu bạn đang dùng Fabric 6, hãy dùng freeDrawingCursor
    //     const newCursor = (this.activeTool === 'brush')
    //       ? ToolService._createBrushCursor(size, color)
    //       : ToolService._createEraserCursor(size);

    //     canvas.freeDrawingCursor = newCursor;
    //     canvas.defaultCursor = newCursor;
    //   }

    //   this.applyCurrentTool();
    // },

    previewBrushColor(color) {
      const canvas = this.activeFabric;
      if (!canvas || !canvas.freeDrawingBrush) return;

      // Chỉ preview màu
      if (this.activeTool === 'brush') {
        canvas.freeDrawingBrush.color = color;
      }
    },

    commitBrushColor(color) {
      const canvas = this.activeFabric;
      if (!canvas) return;

      this.brushColor = color; // Lưu vào state của Pinia

      if (canvas.freeDrawingBrush && this.activeTool === 'brush') {
        canvas.freeDrawingBrush.color = color;
      }

      // Cập nhật Cursor một lần duy nhất khi chốt màu
      if (canvas.isDrawingMode) {
        const newCursor = (this.activeTool === 'brush')
          ? ToolService._createBrushCursor(this.brushSize, color)
          : ToolService._createEraserCursor(this.brushSize);

        canvas.freeDrawingCursor = newCursor;
        canvas.defaultCursor = newCursor;
      }

      this.applyCurrentTool();
    },

    previewBrushSize(size) {
      const canvas = this.activeFabric;
      if (!canvas || !canvas.freeDrawingBrush) return;

      // Cập nhật giá trị hiển thị trên UI ngay lập tức
      this.brushSize = size;

      // Cập nhật độ dày nét vẽ thực tế
      canvas.freeDrawingBrush.width = size;
    },

    // 2. Vẽ lại Cursor sau khi người dùng thả thanh trượt ra
    commitBrushSize(size) {
      const canvas = this.activeFabric;
      if (!canvas) return;

      this.brushSize = size;

      if (canvas.isDrawingMode) {
        // Vẽ lại con trỏ SVG mới với kích thước vừa chốt
        const newCursor = (this.activeTool === 'brush')
          ? ToolService._createBrushCursor(size, this.brushColor)
          : ToolService._createEraserCursor(size);

        canvas.freeDrawingCursor = newCursor;
        canvas.defaultCursor = newCursor;
      }
    },

    reorderLayer(id, direction) {
      const index = this.layers.findIndex(l => l.id === id);
      if (index === -1) return;

      if (direction === 'up' && index < this.layers.length - 1) {
        // Đổi chỗ với phần tử phía trên
        [this.layers[index], this.layers[index + 1]] = [this.layers[index + 1], this.layers[index]];
      }
      else if (direction === 'down' && index > 0) {
        // Đổi chỗ với phần tử phía dưới
        [this.layers[index], this.layers[index - 1]] = [this.layers[index - 1], this.layers[index]];
      }
      else if (direction === 'top' && index < this.layers.length - 1) {
        // Đưa lên đầu mảng (Top Z-Index)
        const layer = this.layers.splice(index, 1)[0];
        this.layers.push(layer);
      }
      else if (direction === 'bottom' && index > 0) {
        // Đưa về cuối mảng (Bottom Z-Index)
        const layer = this.layers.splice(index, 1)[0];
        this.layers.unshift(layer);
      }
      this.updateLayerInteractions();
      this.saveState();
    },

    async duplicateLayer(targetId = null) {
      // Kiểm tra layer gốc
      const idToDuplicate = targetId || this.selectedId;

      if (!idToDuplicate) return;
      // Tìm layer gốc dựa trên ID đã xác định
      const originalLayer = this.layers.find(l => l.id === idToDuplicate);
      // Nếu layer đó không tồn tại hoặc chưa khởi tạo Fabric, dừng lại
      if (!originalLayer || !originalLayer.fabric) {
        console.warn('Cannot duplicate: Layer not found or empty');
        return;
      }

      // Nhờ Service lấy dữ liệu (JSON)
      const jsonSnapshot = originalLayer.fabric.toJSON();
      const jsonClone = JSON.parse(JSON.stringify(jsonSnapshot));

      // LOGIC OFFSET DI CHUYỂN NGAY TRÊN DỮ LIỆU (Chỉ chạy khi Duplicate)
      if (jsonClone.objects && Array.isArray(jsonClone.objects)) {
        jsonClone.objects.forEach(obj => {
          obj.left = (obj.left || 0) + 20;
          obj.top = (obj.top || 0) + 20;
        });
      }
      // 3. Tạo ID mới
      const newId = `layer_${Date.now()}`;

      // 4. Tìm vị trí để chèn (ngay bên trên layer gốc)
      const index = this.layers.indexOf(originalLayer);

      // 5. Push vào mảng (Vue sẽ tự render DOM div/canvas)
      // QUAN TRỌNG: Ta lưu jsonData vào biến tạm `clonedData`
      this.layers.splice(index + 1, 0, {
        id: newId,
        name: `${originalLayer.name} copy`,
        visible: true,
        canvasEl: null,
        fabric: null,
        pendingData: jsonClone// <--- Dữ liệu chờ được nạp
      });

      // 6. Chọn layer mới (việc nạp data sẽ do registerLayerCanvas lo)
      this.selectLayer(newId);
      this.saveState();
    },

    // --- LOGIC REMOVE (LÀM MỚI) ---
    removeLayer(id) {
      // Không cho xóa layer cuối cùng
      if (this.layers.length <= 1) {
        alert("Cannot delete the last layer!");
        return;
      }

      const index = this.layers.findIndex(l => l.id === id);
      if (index === -1) return;

      const layer = this.layers[index];

      // 1. Nhờ Service dọn dẹp Fabric (Free memory)
      // Nếu không làm bước này, fabric instance vẫn ngầm tồn tại gây leak RAM
      if (layer.fabric) {
        LayerService.disposeCanvas(layer.fabric);
      }

      // 2. Xóa khỏi mảng (Vue sẽ tự xóa DOM)
      this.layers.splice(index, 1);

      // 3. Logic chọn lại layer khác thông minh
      // Nếu layer bị xóa đang được chọn -> Phải chọn layer khác thay thế
      if (this.selectedId === id) {
        // Ưu tiên chọn layer bên dưới (index - 1), nếu không có thì chọn layer bên trên (index bây giờ)
        const newIndex = Math.max(0, index - 1);
        // Kiểm tra kỹ xem layer tại newIndex có tồn tại không
        if (this.layers[newIndex]) {
          this.selectLayer(this.layers[newIndex].id);
        }
      }

      // 4. Update lại Z-Index cho các layer còn lại
      this.updateLayerInteractions();
      this.saveState();
    },

    clearLayerContent(id) {
      const layer = this.layers.find(l => l.id === id);
      if (layer && layer.fabric) {
        /// 1. Chặn Auto-save
        this.isUndoing = true;

        // 2. Xóa & Update Thumbnail
        LayerService.clearCanvas(layer.fabric);
        this.triggerUpdateThumbnail(id);

        // 3. Mở lại Auto-save
        this.isUndoing = false;
      }
      this.saveState();
    },

    saveState() {
      // Nếu đang trong quá trình Undo/Redo thì KHÔNG lưu đè
      if (this.isUndoing || this.isEditingProperty) return;

      console.log('[History.saveState] Called', {
        activeTool: this.activeTool,
        selectedObject: this.selectedObject?.editorId || 'null',
        historyIndex: this.historyIndex,
        stackLength: this.historyStack.length
      });

      // Nếu đang đứng ở quá khứ mà vẽ nét mới -> Xóa tương lai đi
      // Ví dụ: A -> B -> C. Undo về B. Vẽ nét D. Kết quả: A -> B -> D (C bị xóa)
      if (this.historyIndex < this.historyStack.length - 1) {
        this.historyStack = this.historyStack.slice(0, this.historyIndex + 1);
      }

      if (this.selectedObject && !this.selectedObject.editorId) {
        this.selectedObject.editorId = `obj_${crypto.randomUUID()}`;
        console.warn('[History] ⚠️ Assigned missing editorId to selectedObject:', this.selectedObject.editorId);
      }

      // Tạo Snapshot
      const snapshot = LayerService.exportProjectState(this.layers, this.selectedId, this.selectedObject);
      console.log('[History] Snapshot created, selectedObject editorId:', snapshot.selectedObject?.editorId);

      // Đẩy vào stack
      this.historyStack.push(snapshot);
      this.historyIndex++;

      // Giới hạn 20 bước (để tiết kiệm RAM)
      if (this.historyStack.length > 20) {
        this.historyStack.shift();
        if (this.historyIndex > 0) {
          this.historyIndex--;
        }
      }

      console.log(`[History] Saved. Steps: ${this.historyIndex + 1}/${this.historyStack.length}`);
    },

    async undo() {
      if (this.historyIndex <= 0) return; // Không còn gì để lùi

      this.isUndoing = true; // Bật cờ
      this.historyIndex--;   // Lùi con trỏ

      console.log('[History.undo]', {
        historyIndex: this.historyIndex,
        stackLength: this.historyStack.length,
        snapshot: this.historyStack[this.historyIndex]  // ← In snapshot
      });

      await this.loadState(this.historyStack[this.historyIndex]);
      this.isUndoing = false; // Tắt cờ
    },

    async redo() {
      if (this.historyIndex >= this.historyStack.length - 1) return; // Không còn tương lai

      this.isUndoing = true;
      this.historyIndex++;   // Tiến con trỏ
      await this.loadState(this.historyStack[this.historyIndex]);
      this.isUndoing = false;
    },

    async loadState(snapshot) {
      if (!snapshot) return;

      // Bật cờ để các listener (như selection:cleared) không vô tình reset store
      this.isUndoing = true;

      try {
        // BƯỚC 1: Dọn dẹp layer cũ (Chỉ dọn dẹp canvas, KHÔNG reset selectedObject ở đây)
        this.layers.forEach(l => {
          if (l.fabric) LayerService.disposeCanvas(l.fabric);
        });

        // BƯỚC 2: Gán dữ liệu khung cho Vue render DOM
        this.layers = snapshot.layers.map(item => ({
          id: item.id,
          name: item.name,
          visible: item.visible,
          canvasEl: null,
          fabric: null,
          pendingData: item.canvasData
        }));

        // Đợi Vue cập nhật lại các thẻ <canvas> vào DOM
        await nextTick();

        // BƯỚC 3: Khởi tạo lại Fabric và nạp JSON
        const initPromises = this.layers.map(async (layer) => {
          const el = document.getElementById(`canvas-${layer.id}`);
          if (el) {
            layer.fabric = LayerService.initCanvas(el, {
              onSelect: (obj) => this.setSelectedObject(obj),
              onClear: () => this.clearSelection(),
            });
            // Đợi nạp xong JSON cho từng layer
            await LayerService.loadFromJSON(layer.fabric, layer.pendingData);
          }
        });

        await Promise.all(initPromises);

        // Đợi thêm 1 tick để Fabric ổn định các đối tượng trong RAM
        await nextTick();

        await new Promise(r => setTimeout(r, 10));

        // BƯỚC 4: Khôi phục Selection
        this.selectedId = snapshot.selectedId;
        const targetId = snapshot.selectedObject?.editorId;

        if (targetId) {
          const activeLayer = this.layers.find(l => l.id === this.selectedId);
          const canvas = activeLayer?.fabric;

          if (canvas) {
            // Tìm đối tượng "sống" vừa được tạo ra từ JSON
            const restoredObj = canvas.getObjects().find(o => o.editorId === targetId);

            if (restoredObj) {
              restoredObj.set({ selectable: true, evented: true });
              canvas.setActiveObject(restoredObj);
              // Gán lại tham chiếu mới cho Store (Bảng thuộc tính sẽ nhận diện tại đây)
              this.selectedObject = restoredObj;
              restoredObj.setCoords();
              canvas.requestRenderAll();

              return; // Kết thúc thành công
            }
          }
        }

        // Nếu chạy xuống đến đây (không return ở trên) nghĩa là:
        // Snapshot này không có object nào được chọn HOẶC không tìm thấy object đó
        this.selectedObject = null;

      } finally {
        // Tắt cờ sau khi mọi thứ đã xong
        this.isUndoing = false;
      }
    },

    setCanvasSize(width, height) {
      this.width = width;
      this.height = height;
      // Update tất cả fabric canvas
      this.layers.forEach(layer => {
        if (layer.fabric) {
          layer.fabric.setDimensions({ width, height });
        }
      });
    }
  }
});