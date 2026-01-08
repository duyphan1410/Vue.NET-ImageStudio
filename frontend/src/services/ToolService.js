import { PencilBrush, Rect, Circle } from 'fabric';

// Biến cục bộ (Module scope) để lưu trạng thái vẽ hình
let isDrawingShape = false;
let shapeStartX = 0;
let shapeStartY = 0;
let activeShape = null;

// Lưu trữ reference của các hàm event để remove sau này
let _boundDown = null;
let _boundMove = null;
let _boundUp = null;

export const ToolService = {
  /**
   * Thiết lập chế độ vẽ Brush hoặc Eraser
   */
  setupBrush(canvas, mode, config = {}) {
    if (!canvas) return;
    
    // 1. Dọn dẹp các sự kiện vẽ hình nếu có trước đó
    this.clearShapeListeners(canvas);

    // 2. Cấu hình Brush/Eraser
    if (mode === 'brush') {
      canvas.isDrawingMode = true;
      canvas.selection = false;
      canvas.skipTargetFind = true;

      const brush = new PencilBrush(canvas);
      brush.width = config.size || 5;
      brush.color = config.color || '#000000';
      brush.globalCompositeOperation = 'source-over';
      canvas.freeDrawingBrush = brush;
      
      // Disable tất cả objects khi vẽ brush
      canvas.forEachObject(obj => {
        obj.selectable = false;
        obj.evented = false;
      });
    } 
    else if (mode === 'eraser') {
      canvas.isDrawingMode = true;
      canvas.selection = false;
      canvas.skipTargetFind = true;
      
      const eraser = new PencilBrush(canvas);
      eraser.width = config.size || 5;
      eraser.color = 'white'; 
      eraser.globalCompositeOperation = 'destination-out';
      canvas.freeDrawingBrush = eraser;
      
      // Disable tất cả objects khi vẽ eraser
      canvas.forEachObject(obj => {
        obj.selectable = false;
        obj.evented = false;
      });
    }
    
    canvas.defaultCursor = 'crosshair';
  },

  /**
   * Thiết lập chế độ vẽ Hình khối (Rect, Circle)
   */
  setupShapeListeners(canvas, shapeType, color, size) {
    if (!canvas) return;
    
    // 1. Tắt chế độ vẽ tự do
    canvas.isDrawingMode = false;
    canvas.selection = false; // Tắt khung chọn (blue selection box)
    canvas.skipTargetFind = false; // Cho phép detect objects
    
    // 2. ✅ FIX: Disable tất cả objects hiện có khi vẽ shape
    canvas.forEachObject(obj => {
      obj.selectable = false;
      obj.evented = false;
    });
    
    // 3. Dọn dẹp listener cũ để tránh bị double event
    this.clearShapeListeners(canvas);

    // 4. Bind `this` và tham số để dùng trong event handler
    _boundDown = (o) => this._onShapeDown(canvas, o, shapeType, color, size);
    _boundMove = (o) => this._onShapeMove(canvas, o, shapeType);
    _boundUp = () => this._onShapeUp(canvas);

    // 5. Gán sự kiện vào Canvas
    canvas.on('mouse:down', _boundDown);
    canvas.on('mouse:move', _boundMove);
    canvas.on('mouse:up', _boundUp);
    
    // Đổi trỏ chuột cho dễ nhìn
    canvas.defaultCursor = 'crosshair';
  },

  /**
   * Xóa tất cả shape listeners
   */
  clearShapeListeners(canvas) {
    if (!canvas) return;
    
    if (_boundDown) canvas.off('mouse:down', _boundDown);
    if (_boundMove) canvas.off('mouse:move', _boundMove);
    if (_boundUp) canvas.off('mouse:up', _boundUp);

    _boundDown = null;
    _boundMove = null;
    _boundUp = null;
    
    // Không set cứng canvas.selection = true
    // Để Store quyết định mode nào sẽ được apply tiếp theo
    canvas.defaultCursor = 'default';
  },

  resetAllTools(canvas) {
    if (!canvas) return;
    
    // Clear shape listeners
    this.clearShapeListeners(canvas);
    
    // Turn off drawing mode
    canvas.isDrawingMode = false;
    
    // Reset cursor
    canvas.defaultCursor = 'default';
    
    console.log('[ToolService] All tools reset for canvas');
  },

  _onShapeDown(canvas, o, type, color, size) {
    const pointer = canvas.getPointer(o.e);
    isDrawingShape = true;
    shapeStartX = pointer.x;
    shapeStartY = pointer.y;

    // Tạo hình với kích thước 0 ban đầu
    const commonOptions = {
      left: shapeStartX,
      top: shapeStartY,
      fill: 'transparent',
      stroke: color,
      strokeWidth: size,
      selectable: false, // Chưa cho chọn khi đang vẽ
      evented: false,
      uniformScaling: true
    };

    if (type === 'rectangle') {
      activeShape = new Rect({
        ...commonOptions,
        width: 0,
        height: 0,
      });
    } else if (type === 'circle') {
      activeShape = new Circle({
        ...commonOptions,
        radius: 0,
      });
    }

    if (activeShape) {
      canvas.add(activeShape);
    }
  },

  _onShapeMove(canvas, o, type) {
    if (!isDrawingShape || !activeShape) return;

    const pointer = canvas.getPointer(o.e);

    if (type === 'rectangle') {
      const w = Math.abs(pointer.x - shapeStartX);
      const h = Math.abs(pointer.y - shapeStartY);
      
      const left = pointer.x < shapeStartX ? pointer.x : shapeStartX;
      const top = pointer.y < shapeStartY ? pointer.y : shapeStartY;

      activeShape.set({
        width: w,
        height: h,
        left: left,
        top: top
      });
    } 
    else if (type === 'circle') {
      const dist = Math.sqrt(
        Math.pow(pointer.x - shapeStartX, 2) + 
        Math.pow(pointer.y - shapeStartY, 2)
      );
      activeShape.set({ radius: dist / 2 });
    }

    canvas.requestRenderAll();
  },

  _onShapeUp(canvas) {
    if (!isDrawingShape) return;
    
    isDrawingShape = false;
    
    if (activeShape) {
      // ✅ Vẽ xong: shape này có thể select được
      // (nhưng các object khác vẫn disabled - do setupShapeListeners)
      activeShape.set({
        selectable: true,
        evented: true
      });
      activeShape.setCoords();
      
      // Trigger event để Store biết mà cập nhật Thumbnail
      canvas.fire('object:modified'); 
      
      activeShape = null;
    }
  }
};