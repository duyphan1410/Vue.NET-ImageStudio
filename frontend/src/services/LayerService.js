import { Canvas } from 'fabric';
import { useCanvasStore } from '@/stores/canvasStore';

function setupCanvasSelectionStyle(canvas) {
  canvas.set({
    selectionBorderColor: '#667eea',
    selectionColor: 'rgba(102, 126, 234, 0.1)',
    selectionLineWidth: 2,
    selectionDashArray: [5, 5]
  });
}


export const LayerService = {
  // ... (giữ lại hàm initCanvas cũ) ...
  initCanvas(el, callbacks = {}) {
    const canvas = new Canvas(el, {
      width: 800,
      height: 600,
      backgroundColor: null,
      preserveObjectStacking: true,
      selection: true,
    });
    const store = useCanvasStore();
    setupCanvasSelectionStyle(canvas);

    if (callbacks.onSelect) {
      canvas.on('selection:created', (e) => {
        store.setSelectedObject(e.selected?.[0] || null);
        callbacks.onSelect(e.selected?.[0] || null);
      });

      canvas.on('selection:updated', (e) => {
        store.setSelectedObject(e.selected?.[0] || null);
        callbacks.onSelect(e.selected?.[0] || null);
      });
    }

    if (callbacks.onClear) {
      canvas.on('selection:cleared', () => {
        if (store.isUndoing) return;
        store.clearSelection();
        callbacks.onClear();
      });
    }
    return canvas;
  },

  // 1. Lấy dữ liệu từ Canvas để chuẩn bị clone
  serializeCanvas(fabricInstance) {
    if (!fabricInstance) return null;
    // Trả về object JSON chứa toàn bộ hình ảnh/nét vẽ
    return fabricInstance.toJSON(['editorId', 'selectable', 'evented']);
  },

  exportProjectState(layersArray, selectedId, selectedObject) {
    // Map qua từng layer để lấy JSON
    if (selectedObject && !selectedObject.editorId) {
      console.warn('[History] Cảnh báo: Object đang chọn không có editorId!');
    }

    return {
      selectedId,
      selectedObject: selectedObject ? {
        editorId: selectedObject.get('editorId'),
        type: selectedObject.type
      } : null,
      layers: layersArray.map(layer => ({
        id: layer.id,
        name: layer.name,
        visible: layer.visible,
        canvasData: layer.fabric
          ? layer.fabric.toJSON(['editorId', 'selectable', 'evented'])
          : (layer.pendingData || null)
      }))
    };
  },

  // 2. Nạp dữ liệu vào Canvas mới (kèm logic dịch chuyển vị trí)
  async loadFromJSON(fabricInstance, json) {
    if (!fabricInstance || !json) return;

    // Load data vào canvas mới
    await fabricInstance.loadFromJSON(json);

    fabricInstance.requestRenderAll();
  },

  // 3. Dọn dẹp bộ nhớ (Quan trọng để không bị tràn RAM)
  disposeCanvas(fabricInstance) {
    if (fabricInstance) {
      // Hủy bỏ các event listener và xóa references
      fabricInstance.dispose();
    }
  },

  // 4. Xóa sạch nội dung (Clear)
  clearCanvas(fabricInstance) {
    if (fabricInstance) {
      fabricInstance.clear();
      fabricInstance.requestRenderAll();
    }
  }
};