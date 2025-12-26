// stores/canvasStore.js
import { defineStore } from 'pinia';
import { markRaw } from 'vue'; // Bỏ toRaw không cần thiết
import { LayerService } from '@/services/LayerService';
import { ToolService } from '@/services/ToolService';

export const useCanvasStore = defineStore('canvas', {
  state: () => ({
    layers: [],
    selectedId: null,
    activeTool: 'brush',
    brushSize: 5,
    brushColor: '#000000',
    thumbnailRefs: new Map(),
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

    addLayer(name = 'New Layer') {
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
    },

    registerLayerCanvas(layerId, el) {
      const layer = this.layers.find(l => l.id === layerId);
      if (!layer) return;

      // Nếu fabric đã có, chỉ cập nhật DOM ref
      if (layer.fabric) {
        if (layer.canvasEl !== el) {
           console.log(`[Re-link] Update DOM ref for ${layerId}`);
           layer.canvasEl = el;
        }
        
        
        // CRITICAL FIX: Sau khi Vue re-render, phải apply lại tool
        // Vì Fabric có thể bị reset state
        if (this.selectedId === layerId) {
          console.log(`[Re-link] Re-applying tool to ${layerId}`);
          this.applyCurrentTool(layer.fabric);
        }
        return;
      }

      // Init Fabric Mới
      console.log(`[Init] Creating NEW Fabric instance for ${layerId}`);
      const fabricCanvas = LayerService.initCanvas(el);
      
      if (!fabricCanvas) {
        console.error(`[Init] Failed to create Fabric for ${layerId}`);
        return;
      }

      layer.fabric = markRaw(fabricCanvas);
      layer.canvasEl = el;

      // Setup Events
      fabricCanvas.on('path:created', (e) => {
         if (this.activeTool === 'eraser') {
            e.path.globalCompositeOperation = 'destination-out';
         }
         this.triggerUpdateThumbnail(layerId);
      });
      fabricCanvas.on('object:modified', () => this.triggerUpdateThumbnail(layerId));
      fabricCanvas.on('object:removed', () => this.triggerUpdateThumbnail(layerId));

      // Cập nhật quyền tương tác
      this.updateLayerInteractions();

      if (layer.clonedData) {
            console.log(`[Duplicate] Loading data for ${layerId}`);
            // Gọi Service nạp dữ liệu vào
            LayerService.loadFromJSON(fabricCanvas, layer.clonedData).then(() => {
                // Nạp xong thì xóa data tạm đi cho nhẹ
                delete layer.clonedData;
                // Update lại thumbnail cho layer mới
                this.triggerUpdateThumbnail(layerId);
            });
        }

      // Nếu đây là layer đang chọn, apply tool ngay
      if (this.selectedId === layerId) {
          console.log(`[Init] ${layerId} is selected, applying tool "${this.activeTool}"`);
          this.applyCurrentTool(fabricCanvas);
      } else {
          console.log(`[Init] ${layerId} is NOT selected, disabling it`);
      }
    },

    updateLayerInteractions() {
      console.log(`[Interactions] Updating for selectedId: ${this.selectedId}`);
      
      this.layers.forEach(layer => {
        if (!layer.fabric) return;

        const isSelected = layer.id === this.selectedId;

        if (isSelected) {
          console.log(`  ✅ ${layer.id}: ENABLED (drawing + selection)`);
          
          // Layer được chọn: Bật TẤT CẢ tính năng
          layer.fabric.selection = true; 
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
          layer.fabric.isDrawingMode = false; // Tắt vẽ
          layer.fabric.selection = false;     // Tắt selection box
          layer.fabric.skipTargetFind = true; // Bỏ qua mọi click
          layer.fabric.interactive = false;   // Tắt tương tác
          
          // CRITICAL: Vô hiệu hóa TẤT CẢ objects trong layer này
          layer.fabric.forEachObject(obj => {
            obj.selectable = false;
            obj.evented = false;
          });
          
          layer.fabric.discardActiveObject(); 
          layer.fabric.requestRenderAll(); 
        }
      });
    },

    // --- Tools ---
    setTool(toolId) {
      console.log(`[Tool] Switching to: ${toolId}`);
      this.activeTool = toolId;
    },

    applyCurrentTool(specificCanvas = null) {
        const canvas = specificCanvas || this.activeFabric;
        if (!canvas) {
            console.warn('[Tool] ⚠️ Cannot apply tool - no active canvas');
            return;
        }
        
        console.log(`[Tool] Applying "${this.activeTool}" to canvas`);

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
            ToolService.setupShapeListeners(canvas, this.activeTool, this.brushColor);
        } else if (this.activeTool === 'select') {
            ToolService.clearShapeListeners(canvas);
             canvas.isDrawingMode = false;
             canvas.selection = true;
             canvas.skipTargetFind = false;

             canvas.forEachObject(obj => {
               obj.selectable = true;
               obj.evented = true;
             });
        }
        canvas.requestRenderAll();
        console.log(`[Tool] Applied! isDrawingMode=${canvas.isDrawingMode}, selection=${canvas.selection}`);

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
    
    updateBrushSettings(size, color) {
        this.brushSize = size;
        this.brushColor = color;
        this.applyCurrentTool();
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
    },

    async duplicateActiveLayer() {
        // 1. Kiểm tra layer gốc
        const originalLayer = this.layers.find(l => l.id === this.selectedId);
        if (!originalLayer || !originalLayer.fabric) return;

        // 2. Nhờ Service lấy dữ liệu (JSON)
        const jsonData = LayerService.serializeCanvas(originalLayer.fabric);

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
            clonedData: jsonData // <--- Dữ liệu chờ được nạp
        });

        // 6. Chọn layer mới (việc nạp data sẽ do registerLayerCanvas lo)
        this.selectLayer(newId);
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
    },

    clearLayerContent(id) {
        const layer = this.layers.find(l => l.id === id);
        if (layer && layer.fabric) {
            // Gọi Service để xóa sạch
            LayerService.clearCanvas(layer.fabric);
            this.triggerUpdateThumbnail(id); // Nhớ update lại ảnh thu nhỏ
        }
    },
    
    // async duplicateActiveLayer() {
    //   const active = this.activeLayer;
    //   if (!active?.fabric) return;

    //   const newId = `layer_${Date.now()}`;
    //   const jsonData = active.fabric.toJSON();

    //   this.layers.push({
    //     id: newId,
    //     name: active.name + ' Copy',
    //     visible: true,
    //     canvasEl: null,
    //     fabric: null
    //   });

    //   await this.$nextTick();

    //   const newLayer = this.layers.find(l => l.id === newId);
    //   if (newLayer?.fabric) {
    //     newLayer.fabric.loadFromJSON(jsonData, () => {
    //       newLayer.fabric.requestRenderAll();
    //       this.triggerUpdateThumbnail(newId);
    //     });
    //   }

    //   this.selectedId = newId;
    //   this.updateLayerInteractions();
    // },
    
    // removeLayer(id) {
    //   if (this.layers.length <= 1) {
    //     alert('Cannot delete the last layer!');
    //     return;
    //   }

    //   const index = this.layers.findIndex(l => l.id === id);
    //   if (index === -1) return;

    //   const layer = this.layers[index];
    //   if (layer.fabric) {
    //     layer.fabric.dispose();
    //   }

    //   this.layers.splice(index, 1);
    //   this.thumbnailRefs.delete(id);

    //   if (this.selectedId === id) {
    //     this.selectedId = this.layers[Math.max(0, index - 1)].id;
    //     this.updateLayerInteractions();
    //     this.applyCurrentTool();
    //   }
    // }
  }
});