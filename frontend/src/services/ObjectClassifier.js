export const ObjectType = {
    RASTER: 'raster',      // Ảnh, brush paths đã "nướng" thành image
    EDITABLE: 'editable',  // Text, shapes có thể edit thuộc tính
    VECTOR: 'vector'       // Paths, lines vẫn giữ vector
};

export const ObjectClassifier = {
    /**
     * Xác định loại object dựa trên type và metadata
     */
    classify(fabricObj) {
        // 1. Text objects luôn là EDITABLE
        if (fabricObj.type === 'i-text' || fabricObj.type === 'text' || fabricObj.type === 'textbox') {
            return ObjectType.EDITABLE;
        }

        // 2. Shapes cơ bản (rect, circle, polygon) là EDITABLE
        if (['rect', 'circle', 'ellipse', 'polygon', 'triangle'].includes(fabricObj.type)) {
            return ObjectType.EDITABLE;
        }

        // 3. Images (bao gồm cả paths đã convert) là RASTER
        if (fabricObj.type === 'image') {
            return ObjectType.RASTER;
        }

        // 4. Free drawing paths mặc định là VECTOR (nhưng có thể bake thành RASTER)
        if (fabricObj.type === 'path') {
            return fabricObj._isRasterized ? ObjectType.RASTER : ObjectType.VECTOR;
        }

        // 5. Groups cần kiểm tra con
        if (fabricObj.type === 'group') {
            // Nếu toàn bộ objects con đều RASTER -> group là RASTER
            const objects = fabricObj._objects || [];
            const allRaster = objects.every(obj => this.classify(obj) === ObjectType.RASTER);
            return allRaster ? ObjectType.RASTER : ObjectType.EDITABLE;
        }

        // Default fallback
        return ObjectType.VECTOR;
    },

    /**
     * Kiểm tra xem object có cần bảo vệ khỏi destructive editing không
     */
    isProtected(fabricObj) {
        const type = this.classify(fabricObj);
        return type === ObjectType.EDITABLE;
    },

    /**
     * Kiểm tra xem object có thể "bake" thành raster không
     */
    canRasterize(fabricObj) {
        const type = this.classify(fabricObj);
        return type === ObjectType.VECTOR || type === ObjectType.RASTER;
    },

    /**
     * Đánh dấu object đã được rasterize
     */
    markAsRasterized(fabricObj) {
        fabricObj._isRasterized = true;
        fabricObj._originalType = fabricObj.type; // Lưu type gốc để tham khảo
    }
};