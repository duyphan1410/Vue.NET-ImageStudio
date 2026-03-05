import { FabricImage, Group, Rect, Circle, Point, util, Path } from 'fabric'; // [FIX] Import util
import { ObjectClassifier, ObjectType } from '../utils/ObjectClassifier';

export const SmartEraserService = {
  /**
   * Apply eraser với logic phân loại
   */
  async applyToLayers(eraserGeometry, layers, triggerThumbnailUpdate) {
    console.log('🟡 [SmartEraser] applyToLayers called');

    for (const layer of layers) {
      if (!layer.visible || !layer.fabric) continue;

      const canvas = layer.fabric;
      // [FIX] Clone array để tránh lỗi khi remove object trong vòng lặp
      const objects = [...canvas.getObjects()];

      for (const obj of objects) {
        if (obj === eraserGeometry) continue;

        const padding = eraserGeometry.strokeWidth / 2;

        // Tạo bbox tạm để check va chạm nhanh
        const eraserBBox = new Rect({
          left: eraserGeometry.left - padding,
          top: eraserGeometry.top - padding,
          width: eraserGeometry.width + (padding * 2), // Cộng thêm padding 2 bên
          height: eraserGeometry.height + (padding * 2),
          absolutePositioned: true
        });

        // Kiểm tra va chạm với hộp đã được mở rộng
        if (!obj.intersectsWithObject(eraserBBox)) continue;

        const objType = ObjectClassifier.classify(obj);

        // Non-destructive trên v6 cần dùng ClipPath phức tạp hơn nhiều.
        if (objType === ObjectType.EDITABLE) {
          // Tạm thời convert sang destructive cho ổn định
          await this.applyNonDestructive(obj, eraserGeometry, canvas);
        } else {
          await this.applyDestructive(obj, eraserGeometry, canvas);
        }
      }

      if (triggerThumbnailUpdate) {
        triggerThumbnailUpdate(layer.id);
      }
    }
  },

  /**
   * XÓA DESTRUCTIVE - FIX FINAL V4: Sử dụng Fabric Render Engine
   * Logic: Tạo clone của eraser path và render trực tiếp lên context ảnh
   */
  async applyDestructive(obj, eraserGeometry, canvas) {
    // 1. Lấy khung bao chuẩn trên màn hình
    const objBounds = obj.getBoundingRect();

    // 2. Snapshot ảnh (High Quality)
    const multiplier = 2;
    const dataURL = obj.toDataURL({
      format: 'png',
      multiplier: multiplier,
      enableRetinaScaling: true
    });

    const imgElement = await this._loadImage(dataURL);

    // 3. Setup Canvas tạm
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = imgElement.width;
    tempCanvas.height = imgElement.height;

    const ctx = tempCanvas.getContext('2d');
    // Vẽ ảnh gốc vào
    ctx.drawImage(imgElement, 0, 0);

    // --- 🔥 TÍNH TỶ LỆ MAP (Giữ nguyên logic đúng của bạn) ---
    const scaleFactorX = imgElement.width / objBounds.width;
    const scaleFactorY = imgElement.height / objBounds.height;

    // 4. Cấu hình Eraser cho Context
    ctx.globalCompositeOperation = 'destination-out';

    // --- 🔥 THAY ĐỔI LỚN: KHÔNG DÙNG VÒNG LẶP M/L/Q NỮA ---
    // Chúng ta tạo ra một object Path tạm thời từ dữ liệu eraser
    // Để Fabric tự xử lý việc vẽ đường cong, offset, lineJoin, lineCap...

    const tempPath = new Path(eraserGeometry.path);

    // Tính toán vị trí của Path trên Canvas tạm (Image Space)
    // Công thức: (Vị trí Eraser trên màn hình - Vị trí Ảnh trên màn hình) * Tỷ lệ
    const relativeLeft = (eraserGeometry.left - objBounds.left) * scaleFactorX;
    const relativeTop = (eraserGeometry.top - objBounds.top) * scaleFactorY;

    // Apply các thuộc tính cho Path tạm
    tempPath.set({
      left: relativeLeft,
      top: relativeTop,
      scaleX: (eraserGeometry.scaleX || 1) * scaleFactorX, // Scale theo tỷ lệ ảnh
      scaleY: (eraserGeometry.scaleY || 1) * scaleFactorY,
      strokeWidth: eraserGeometry.strokeWidth, // Fabric tự scale strokeWidth theo scaleX/Y nên có thể ko cần nhân tay, nhưng để chắc chắn ta set strokeWidth gốc rồi để scale lo
      stroke: 'black',
      fill: null,
      strokeLineCap: eraserGeometry.strokeLineCap || 'round',
      strokeLineJoin: eraserGeometry.strokeLineJoin || 'round',
      originX: 'left', // Bắt buộc neo theo góc trên trái để khớp logic tính toán
      originY: 'top',
      globalCompositeOperation: 'destination-out'
    });

    // Vì strokeWidth trong Fabric bị ảnh hưởng bởi scale, ta cần chỉnh lại 1 chút
    // Nếu scale path lên 2 lần, nét vẽ sẽ to gấp đôi.
    // Logic đúng: Giữ nguyên strokeWidth gốc, và scale object lên.

    // Render Path trực tiếp lên Context
    tempPath.render(ctx);

    // ---------------------------------------------------------

    // 5. Tạo ảnh mới từ kết quả xóa
    const erasedDataURL = tempCanvas.toDataURL('image/png');
    const newImg = await FabricImage.fromURL(erasedDataURL);

    // 6. Đặt lại vị trí ảnh mới vào Canvas chính
    newImg.set({
      left: objBounds.left,
      top: objBounds.top,
      scaleX: objBounds.width / newImg.width,
      scaleY: objBounds.height / newImg.height,
      angle: 0,
      originX: 'left',
      originY: 'top'
    });

    ObjectClassifier.markAsRasterized(newImg);

    // 7. Swap object
    const index = canvas.getObjects().indexOf(obj);
    canvas.remove(obj);
    canvas.insertAt(index, newImg);
    canvas.requestRenderAll();

    return newImg;
  },

  /**
   * XÓA NON-DESTRUCTIVE - Tạo eraser mask overlay
   * Object gốc vẫn giữ nguyên, chỉ thêm một "lớp che" để tạo hiệu ứng xóa
   */
  async applyNonDestructive(obj, eraserGeometry, canvas) {
    console.log('🔷 [Non-Destructive] Erasing shape:', obj.type);

    // 1. Kiểm tra xem đã có clipPath chưa
    let currentClip = obj.clipPath;

    // 2. Tạo eraser path từ geometry
    const eraserPath = this._createEraserPath(eraserGeometry, obj);

    if (!currentClip) {
      // Lần đầu tiên xóa: Tạo clip mask từ chính hình đó (inverted)
      currentClip = this._createInitialClipMask(obj);
    }

    // 3. Merge eraser path vào clip mask hiện tại
    const updatedClip = this._subtractPathFromClip(currentClip, eraserPath, obj);

    // 4. Apply clip path mới
    obj.set({ clipPath: updatedClip });
    obj.setCoords();

    canvas.requestRenderAll();
    return obj;
  },

  /**
   * Đồng bộ vị trí eraser mask với object gốc
   */
  _syncEraserMask(obj, eraserGroup) {
    // Hook vào sự kiện moving/scaling/rotating
    const updateMask = () => {
      console.log('📍 Syncing mask position');
      eraserGroup.set({
        left: obj.left,
        top: obj.top,
        scaleX: obj.scaleX,
        scaleY: obj.scaleY,
        angle: obj.angle
      });
      eraserGroup.setCoords();
    };

    obj.on('moving', updateMask);
    obj.on('scaling', updateMask);
    obj.on('rotating', updateMask);
    obj.on('modified', updateMask);
  },

  /**
   * Clone path (helper)
   */
  async _clonePath(path) {
    return new Promise((resolve) => {
      path.clone((cloned) => {
        resolve(cloned);
      });
    });
  },

  /**
   * Load image helper
   */
  _loadImage(src) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.src = src;
    });
  },

  /**
   * Tạo Fabric Image từ data URL
   */
  async _createFabricImage(dataURL, originalObj, bounds, padding) {
    return new Promise((resolve) => {
      FabricImage.fromURL(dataURL, (fabricImg) => {
        fabricImg.set({
          left: originalObj.left - padding,
          top: originalObj.top - padding,
          scaleX: originalObj.scaleX,
          scaleY: originalObj.scaleY,
          angle: originalObj.angle,
          originX: originalObj.originX,
          originY: originalObj.originY,
          selectable: originalObj.selectable,
          evented: originalObj.evented,
        });
        resolve(fabricImg);
      });
    });
  },

  _createEraserPath(eraserGeometry, targetObj) {
    const pathData = eraserGeometry.path;

    // 1. Lấy ma trận nghịch đảo của object (để convert World -> Local)
    const invertedMatrix = util.invertTransform(targetObj.calcTransformMatrix());

    // 2. Biến đổi từng điểm của Path
    // Clone data để không ảnh hưởng path gốc
    const transformedPath = pathData.map(cmd => {
      const newCmd = [...cmd];

      // Hàm helper biến đổi điểm (x, y) qua ma trận
      const transformPoint = (x, y) => {
        const p = new Point(x, y);
        return util.transformPoint(p, invertedMatrix);
      };

      // M = MoveTo, L = LineTo, Q = Quadratic, C = Cubic
      if (cmd[0] === 'M' || cmd[0] === 'L') {
        const p = transformPoint(cmd[1], cmd[2]);
        newCmd[1] = p.x; newCmd[2] = p.y;
      }
      else if (cmd[0] === 'Q') {
        const p1 = transformPoint(cmd[1], cmd[2]); // Control point
        const p2 = transformPoint(cmd[3], cmd[4]); // End point
        newCmd[1] = p1.x; newCmd[2] = p1.y;
        newCmd[3] = p2.x; newCmd[4] = p2.y;
      }
      else if (cmd[0] === 'C') {
        const p1 = transformPoint(cmd[1], cmd[2]);
        const p2 = transformPoint(cmd[3], cmd[4]);
        const p3 = transformPoint(cmd[5], cmd[6]);
        newCmd[1] = p1.x; newCmd[2] = p1.y;
        newCmd[3] = p2.x; newCmd[4] = p2.y;
        newCmd[5] = p3.x; newCmd[6] = p3.y;
      }
      return newCmd;
    });

    // 3. Tạo Path mới với tọa độ đã convert
    // Lưu ý: Không set left/top nữa vì path data đã chứa tọa độ đúng
    const scale = (targetObj.scaleX + targetObj.scaleY) / 2;
    const fixedStrokeWidth = eraserGeometry.strokeWidth / scale;

    console.log(`🔍 DEBUG SCALE:
      - Object Scale: ${scale.toFixed(2)}
      - Eraser Gốc: ${eraserGeometry.strokeWidth}px
      - Eraser Sau Fix: ${fixedStrokeWidth.toFixed(2)}px
    `);

    const path = new Path(transformedPath, {
      strokeWidth: fixedStrokeWidth,
      stroke: 'black',
      fill: null,
      strokeLineCap: 'round',
      strokeLineJoin: 'round',
      originX: 'center',
      originY: 'center',
      absolutePositioned: false,
      globalCompositeOperation: 'destination-out'
    });

    path.set({
      scaleX: 1,
      scaleY: 1,
      angle: 0
    });
    path.setCoords();

    return path;
  },

  /**
   * Tạo clip mask ban đầu (toàn bộ shape)
   */
  _createInitialClipMask(obj) {

    const padding = (obj.strokeWidth || 0) + 2;

    const width = obj.width;
    const height = obj.height;

    return new Rect({
      left: 0, // Canh giữa theo tâm object
      top: 0,
      width: width + padding,
      height: height + padding,
      fill: 'black',
      strokeWidth: 0,

      originX: 'center', // QUAN TRỌNG: Neo từ tâm
      originY: 'center',

      // QUAN TRỌNG: Tắt Absolute để mask đi theo object
      absolutePositioned: false,
      inverted: false
    });
  },

  /**
   * Sử dụng Group với globalCompositeOperation
   */
  _subtractPathFromClip(currentClip, eraserPath, obj) {

    // Set composite operation để path "cắt bỏ" khỏi clip
    eraserPath.set({
      globalCompositeOperation: 'destination-out'
    });
    if (currentClip instanceof Group) {
      // ✅ TRƯỜNG HỢP ĐÃ LÀ GROUP (Lần xóa thứ 2 trở đi)
      // Chỉ cần thêm path mới vào group cũ.
      // KHÔNG tạo group mới lồng vào group cũ (nguyên nhân gây lệch/thu nhỏ).

      currentClip.add(eraserPath);

      // Quan trọng: Đánh dấu cần render lại nhưng KHÔNG ĐƯỢC gọi setCoords
      // để tránh việc Group tự tính lại tâm (center) dựa trên kích thước mới
      currentClip.dirty = true;

      // 🔒 KHÓA BOUNDING BOX
      currentClip._calcBounds = function () { };
      currentClip._updateObjectsCoords = function () { };

      return currentClip;
    } else {
      // ✅ TRƯỜNG HỢP ĐẦU TIÊN (Rect đơn lẻ)
      // Tạo Group mới chứa Rect nền và Path xóa
      const clipGroup = new Group([currentClip, eraserPath], {
        originX: 'center', // Đồng bộ tâm với Object
        originY: 'center',
        absolutePositioned: false,
        inverted: false
      });

      return clipGroup;
    }

    // const clipGroup = new Group([currentClip], {
    //   originX: 'center', 
    //   originY: 'center',
    //   absolutePositioned: false,
    //   inverted: false
    // });

    // clipGroup.add(eraserPath);

    // return clipGroup;
  },

  /**
   * BAKE FUNCTION - Convert EDITABLE objects thành RASTER khi cần
   * Ví dụ: User muốn "flatten" layer để tối ưu performance
   */
  resetEraser(obj, canvas) {
    if (obj.clipPath) {
      obj.set({ clipPath: null });
      obj.setCoords();
      canvas.requestRenderAll();
    }
  },

  /**
   * BAKE FUNCTION - Flatten object thành image khi cần
   * Dùng cho cả shapes và text
   */
  async bakeObject(obj, canvas) {
    console.log('🍞 Baking object to image:', obj.type);

    const dataURL = obj.toDataURL({
      format: 'png',
      multiplier: 2,
      enableRetinaScaling: true
    });

    const bounds = obj.getBoundingRect();
    const newImg = await FabricImage.fromURL(dataURL);

    newImg.set({
      left: bounds.left,
      top: bounds.top,
      scaleX: bounds.width / newImg.width,
      scaleY: bounds.height / newImg.height,
      angle: 0,
      originX: 'left',
      originY: 'top'
    });

    ObjectClassifier.markAsRasterized(newImg);

    const index = canvas.getObjects().indexOf(obj);
    canvas.remove(obj);
    canvas.insertAt(index, newImg);

    canvas.requestRenderAll();
    return newImg;
  },
};