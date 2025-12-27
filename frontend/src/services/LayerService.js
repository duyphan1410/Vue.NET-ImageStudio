import { Canvas } from 'fabric';

export const LayerService = {
  // ... (giữ lại hàm initCanvas cũ) ...
  initCanvas(el) {
    return new Canvas(el, {
      width: 800,
      height: 600,
      backgroundColor: null,
      preserveObjectStacking: true,
    });
  },

  // 1. Lấy dữ liệu từ Canvas để chuẩn bị clone
  serializeCanvas(fabricInstance) {
    if (!fabricInstance) return null;
    // Trả về object JSON chứa toàn bộ hình ảnh/nét vẽ
    return fabricInstance.toJSON();
  },

  exportProjectState(layersArray) {
    // Map qua từng layer để lấy JSON
    return layersArray.map(layer => ({
      id: layer.id,
      name: layer.name,
      visible: layer.visible,
      // Lưu ý: Chỉ lưu data nếu fabric instance tồn tại
      canvasData: layer.fabric 
          ? layer.fabric.toJSON() 
          : (layer.pendingData || null)
    }));
  },

  // 2. Nạp dữ liệu vào Canvas mới (kèm logic dịch chuyển vị trí)
  async loadFromJSON(fabricInstance, json) {
    if (!fabricInstance || !json) return;

    // Load data vào canvas mới
    await fabricInstance.loadFromJSON(json);

    // Logic Offset: Dịch chuyển các object một chút để người dùng biết là đã duplicate
    // fabricInstance.getObjects().forEach(obj => {
    //   obj.set({
    //     left: (obj.left || 0) + 20, // Dịch sang phải 20px
    //     top: (obj.top || 0) + 20,   // Dịch xuống dưới 20px
    //   });
    //   obj.setCoords(); // Cập nhật lại tọa độ click
    // });

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