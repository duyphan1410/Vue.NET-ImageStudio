import { PencilBrush, Rect, Circle } from 'fabric';

let isDrawingShape = false;
let shapeStartX = 0;
let shapeStartY = 0;
let activeShape = null;

let _boundDown = null;
let _boundMove = null;
let _boundUp = null;

export const ToolService = {
  setupBrush(canvas, mode, config = {}) {
    if (!canvas) return;

    canvas.off('mouse:down');
    canvas.off('mouse:up');

    this.clearShapeListeners(canvas);

    if (mode === 'brush') {
      canvas.isDrawingMode = true;
      canvas.selection = false;
      canvas.skipTargetFind = true;

      const brushSize = config.size || 5;
      const brush = new PencilBrush(canvas);
      brush.width = brushSize;
      brush.color = config.color || '#000000';
      brush.globalCompositeOperation = 'source-over';
      canvas.freeDrawingBrush = brush;

      // canvas.freeDrawingCursor = this._createBrushCursor(brushSize, config.color);

      canvas.freeDrawingCursor = this._createBrushCursor(brushSize, config.color, false);
      // console.log('[ToolService] Brush cursor initialized at 45°');

      // ✅ Thay đổi cursor khi bấm chuột (vẽ → 90°)
      const onMouseDown = () => {
        canvas.freeDrawingCursor = this._createBrushCursor(brushSize, config.color, true);
        // console.log('[ToolService] Brush cursor rotated to 90° (drawing)');
      };

      const onMouseUp = () => {
        canvas.freeDrawingCursor = this._createBrushCursor(brushSize, config.color, false);
        // console.log('[ToolService] Brush cursor back to 45° (idle)');
      };

      canvas.on('mouse:down', onMouseDown);
      canvas.on('mouse:up', onMouseUp);

      canvas.forEachObject(obj => {
        obj.selectable = false;
        obj.evented = false;
      });
    }
    else if (mode === 'eraser') {
      canvas.isDrawingMode = true;
      canvas.selection = false;
      canvas.skipTargetFind = true;

      const eraserSize = config.size || 5;
      const eraser = new PencilBrush(canvas);
      eraser.width = eraserSize;
      eraser.color = 'white';
      eraser.globalCompositeOperation = 'destination-out';
      canvas.freeDrawingBrush = eraser;

      canvas.freeDrawingCursor = this._createEraserCursor(eraserSize);

      canvas.forEachObject(obj => {
        obj.selectable = false;
        obj.evented = false;
      });
    }
  },

  setupShapeListeners(canvas, shapeType, color, size) {
    if (!canvas) return;

    canvas.isDrawingMode = false;
    canvas.selection = false;
    canvas.skipTargetFind = false;

    canvas.forEachObject(obj => {
      obj.selectable = false;
      obj.evented = false;
    });

    this.clearShapeListeners(canvas);

    _boundDown = (o) => this._onShapeDown(canvas, o, shapeType, color, size);
    _boundMove = (o) => this._onShapeMove(canvas, o, shapeType);
    _boundUp = () => this._onShapeUp(canvas);

    canvas.on('mouse:down', _boundDown);
    canvas.on('mouse:move', _boundMove);
    canvas.on('mouse:up', _boundUp);

    if (shapeType === 'rectangle') {
      canvas.defaultCursor = `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20"><rect x="2" y="2" width="16" height="16" fill="none" stroke="%23667eea" stroke-width="1.5"/></svg>') 10 10, crosshair`;
    } else if (shapeType === 'circle') {
      canvas.defaultCursor = `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20"><circle cx="10" cy="10" r="8" fill="none" stroke="%23667eea" stroke-width="1.5"/></svg>') 10 10, crosshair`;
    }
  },

  clearShapeListeners(canvas) {
    if (!canvas) return;

    if (_boundDown) canvas.off('mouse:down', _boundDown);
    if (_boundMove) canvas.off('mouse:move', _boundMove);
    if (_boundUp) canvas.off('mouse:up', _boundUp);

    _boundDown = null;
    _boundMove = null;
    _boundUp = null;

    canvas.defaultCursor = 'default';
  },

  resetAllTools(canvas) {
    if (!canvas) return;

    this.clearShapeListeners(canvas);
    canvas.isDrawingMode = false;

    // 🔑 QUAN TRỌNG: Deselect object khi reset tool
    canvas.discardActiveObject();
    canvas.requestRenderAll();

  },


  _onShapeDown(canvas, o, type, color, size) {
    const pointer = canvas.getPointer(o.e);
    isDrawingShape = true;
    shapeStartX = pointer.x;
    shapeStartY = pointer.y;

    // console.log('[ToolService._onShapeDown]', type, 'at', pointer);

    const commonOptions = {
      editorId: crypto.randomUUID(),
      objectType: type,
      left: shapeStartX,
      top: shapeStartY,
      originX: 'left',
      originY: 'top',
      fill: 'transparent',
      stroke: color,
      strokeWidth: size,
      selectable: false,
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
      const dx = pointer.x - shapeStartX;
      const dy = pointer.y - shapeStartY;
      const r = Math.sqrt(dx * dx + dy * dy) / 2;

      activeShape.set({
        radius: r,
        left: shapeStartX - r,
        top: shapeStartY - r
      });
    }

    canvas.requestRenderAll();
  },

  _onShapeUp(canvas) {
    if (!isDrawingShape) return;

    isDrawingShape = false;

    if (activeShape) {
      if (!activeShape.editorId) {
        activeShape.editorId = `shape_${crypto.randomUUID()}`;
        // console.log('[ToolService._onShapeUp] Assigned editorId:', activeShape.editorId);
      }

      activeShape.set({
        selectable: true,
        evented: true
      });
      activeShape.setCoords();

      canvas.setActiveObject(activeShape);

      canvas.fire('object:modified');

      canvas.requestRenderAll();

      activeShape = null;
    }
  },

  // _createBrushCursor(size, color) {
  //   const adjustedSize = Math.max(size + 2, 8);
  //   const svg = `<svg width="${adjustedSize}" height="${adjustedSize}" viewBox="0 0 ${adjustedSize} ${adjustedSize}" xmlns="http://www.w3.org/2000/svg">
  //     <circle cx="${adjustedSize / 2}" cy="${adjustedSize / 2}" r="${adjustedSize / 2 - 1}" fill="${color}" opacity="0.9"/>
  //     <circle cx="${adjustedSize / 2}" cy="${adjustedSize / 2}" r="${adjustedSize / 2 - 1}" fill="none" stroke="white" stroke-width="1" stroke-dasharray="2,2"/>
  //   </svg>`;
  //   const encoded = encodeURIComponent(svg);
  //   const offset = Math.floor(adjustedSize / 2);
  //   return `url('data:image/svg+xml;utf8,${encoded}') ${offset} ${offset}, auto`;
  // },

  // _createEraserCursor(size) {
  //   const adjustedSize = Math.max(size + 2, 8);
  //   const svg = `<svg width="${adjustedSize}" height="${adjustedSize}" viewBox="0 0 ${adjustedSize} ${adjustedSize}" xmlns="http://www.w3.org/2000/svg">
  //     <circle cx="${adjustedSize / 2}" cy="${adjustedSize / 2}" r="${adjustedSize / 2 - 1}" fill="white" stroke="#ff4444" stroke-width="1.5" opacity="0.8"/>
  //     <line x1="${adjustedSize / 2 - 3}" y1="${adjustedSize / 2}" x2="${adjustedSize / 2 + 3}" y2="${adjustedSize / 2}" stroke="#ff4444" stroke-width="1"/>
  //   </svg>`;
  //   const encoded = encodeURIComponent(svg);
  //   const offset = Math.floor(adjustedSize / 2);
  //   return `url('data:image/svg+xml;utf8,${encoded}') ${offset} ${offset}, auto`;
  // },

  _createBrushCursor(size, color, isDrawing = false) {
    const maxCanvasSize = 64;
    const brushSize = Math.max(size + 4, 10);
    const iconSize = 16;
    const padding = 4;

    let canvasSize = brushSize + iconSize + padding * 2;
    let showIcon = true;

    // Nếu quá lớn, chỉ giữ vòng tròn
    if (canvasSize > maxCanvasSize) {
      canvasSize = maxCanvasSize;
      showIcon = false; // Ẩn icon nếu quá lớn
    }

    const brushCenter = brushSize / 2 + padding;
    const iconHalf = iconSize / 2;
    const iconTranslateX = brushCenter - iconHalf;
    const iconTranslateY = brushCenter - iconHalf;

    const iconRotate = isDrawing ? -35 : 0;

    // 🔑 Tính màu icon: nếu brush sáng → icon đen, brush tối → icon trắng
    const rgb = parseInt(color.slice(1), 16);
    const r = (rgb >> 16) & 255;
    const g = (rgb >> 8) & 255;
    const b = rgb & 255;
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    const iconColor = brightness > 128 ? '#000000' : '#ffffff';


    // console.log(`[Cursor] brush=${color}, brightness=${brightness.toFixed(0)}, icon=${iconColor}`);

    const svg = `<svg width="${canvasSize}" height="${canvasSize}" viewBox="0 0 ${canvasSize} ${canvasSize}" xmlns="http://www.w3.org/2000/svg">
      <!-- Vòng tròn brush preview (kích thước variable) -->
      <circle cx="${brushCenter}" cy="${brushCenter}" r="${brushSize / 2 - 1}" 
              fill="${color}" opacity="0.85"/>
      <circle cx="${brushCenter}" cy="${brushCenter}" r="${brushSize / 2 - 1}" 
              fill="none" stroke="${iconColor}" stroke-width="1.5" stroke-dasharray="3,3"/>
      
      <!-- Icon Brush (FIXED 16px, ở giữa canvas, màu tương phản) -->
      <g transform="translate(${iconTranslateX}, ${iconTranslateY}) rotate(${iconRotate} 8 8)">
        <path d="m11 10 3 3" stroke="${iconColor}" stroke-width="1.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M6.5 21A3.5 3.5 0 1 0 3 17.5a2.62 2.62 0 0 1-.708 1.792A1 1 0 0 0 3 21z" stroke="${iconColor}" stroke-width="1.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M9.969 17.031 21.378 5.624a1 1 0 0 0-3.002-3.002L6.967 14.031" stroke="${iconColor}" stroke-width="1.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
      </g>
    </svg>`;

    const encoded = encodeURIComponent(svg);
    const offset = Math.floor(canvasSize / 2);
    return `url('data:image/svg+xml;utf8,${encoded}') ${brushCenter} ${brushCenter}, auto`;

  },

  _createEraserCursor(size) {
    const maxCanvasSize = 80;
    const eraserSize = Math.max(size + 4, 10);
    const iconSize = 16;
    const padding = 4;

    let canvasSize = eraserSize + iconSize + padding * 2;
    let showIcon = true;

    // console.log(`[DEBUG] eraserSize=${eraserSize}, canvasSize=${canvasSize}, maxCanvasSize=${maxCanvasSize}`); // ← Debug

    if (canvasSize > maxCanvasSize) {
      canvasSize = maxCanvasSize;
      showIcon = false;
      // console.log('[DEBUG] Canvas quá lớn, ẩn icon');
    }

    const eraserCenter = canvasSize / 2;
    const iconHalf = iconSize / 2;
    const iconTranslateX = eraserCenter - iconHalf;
    const iconTranslateY = eraserCenter - iconHalf;

    const svg = `<svg width="${canvasSize}" height="${canvasSize}" viewBox="0 0 ${canvasSize} ${canvasSize}" xmlns="http://www.w3.org/2000/svg" style="pointer-events:none">
        <circle cx="${eraserCenter}" cy="${eraserCenter}" r="${eraserSize / 2 - 1}" 
                fill="rgba(248, 113, 113, 0.1)" stroke="#f87171" stroke-width="1.2" opacity="0.6"/>
        
        ${showIcon ? `
        <g transform="translate(${iconTranslateX}, ${iconTranslateY})">
          <path d="M21 21H8a2 2 0 0 1-1.42-.587l-3.994-3.999a2 2 0 0 1 0-2.828l10-10a2 2 0 0 1 2.829 0l5.999 6a2 2 0 0 1 0 2.828L12.834 21" 
                stroke="#ffffff" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="m5.082 11.09 8.828 8.828" 
                stroke="#ffffff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </g>
        ` : ''}
      </svg>`;

    const encoded = encodeURIComponent(svg);
    return `url('data:image/svg+xml;utf8,${encoded}') ${eraserCenter} ${eraserCenter}, auto`;
  }
};