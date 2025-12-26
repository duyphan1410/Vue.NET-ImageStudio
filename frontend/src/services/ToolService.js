import { PencilBrush, Rect, Circle } from 'fabric';

// Biến cục bộ (Module scope) để lưu trạng thái vẽ hình
// Vì tại 1 thời điểm chỉ có 1 người dùng thao tác chuột, nên để ở đây là an toàn.
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
    }
    else{
        canvas.isDrawingMode = false;
        canvas.selection = true; 
        canvas.skipTargetFind = false;
    }
  },

  /**
   * Thiết lập chế độ vẽ Hình khối (Rect, Circle)
   * Hàm này được gọi từ Store khi user chọn công cụ hình khối
   */
  setupShapeListeners(canvas, shapeType, color) {
    if (!canvas) return;
    
    // 1. Tắt chế độ vẽ tự do
    canvas.isDrawingMode = false;
    canvas.selection = false; // Tắt khung chọn (blue selection box)
    
    // 2. Dọn dẹp listener cũ để tránh bị double event
    this.clearShapeListeners(canvas);

    // 3. Bind `this` và tham số để dùng trong event handler
    // Lưu lại vào biến module để sau này remove được
    _boundDown = (o) => this._onShapeDown(canvas, o, shapeType, color);
    _boundMove = (o) => this._onShapeMove(canvas, o, shapeType);
    _boundUp = () => this._onShapeUp(canvas);

    // 4. Gán sự kiện vào Canvas
    canvas.on('mouse:down', _boundDown);
    canvas.on('mouse:move', _boundMove);
    canvas.on('mouse:up', _boundUp);
    
    // Đổi trỏ chuột cho dễ nhìn
    canvas.defaultCursor = 'crosshair';
  },

  /**
   * Hàm dọn dẹp (CỰC QUAN TRỌNG): 
   * Xóa các sự kiện mouse:down/move/up khi chuyển sang tool khác
   */
  clearShapeListeners(canvas) {
    if (!canvas) return;
    
    if (_boundDown) canvas.off('mouse:down', _boundDown);
    if (_boundMove) canvas.off('mouse:move', _boundMove);
    if (_boundUp) canvas.off('mouse:up', _boundUp);

    _boundDown = null;
    _boundMove = null;
    _boundUp = null;
    
    // Trả lại trạng thái mặc định
    canvas.defaultCursor = 'default';
    canvas.selection = true; // Bật lại khả năng chọn object
  },

  // ============================================================
  // INTERNAL HANDLERS (Logic bê từ HomeView cũ sang)
  // ============================================================

  _onShapeDown(canvas, o, type, color) {
    // Nếu click vào nút điều khiển của object khác thì không vẽ
    const pointer = canvas.getPointer(o.e);
    isDrawingShape = true;
    shapeStartX = pointer.x;
    shapeStartY = pointer.y;

    // Tạo hình với kích thước 0 ban đầu
    const commonOptions = {
        left: shapeStartX,
        top: shapeStartY,
        fill: 'transparent', // Hoặc fill màu nếu muốn
        stroke: color,
        strokeWidth: 2,
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
        
        // Logic vẽ ngược chiều (từ phải qua trái, dưới lên trên)
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
        // Tính bán kính theo đường chéo (Pythagoras)
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
        // Vẽ xong thì cho phép chọn lại object
        activeShape.set({
            selectable: true,
            evented: true
        });
        activeShape.setCoords();
        
        // Quan trọng: Trigger event để Store biết mà cập nhật Thumbnail
        canvas.fire('object:modified'); 
        
        activeShape = null;
    }
  }
};