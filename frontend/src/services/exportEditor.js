export async function exportEditor({ layers, width, height, dpi, format }) {
    try {
        console.log(
            '[ExportEditor] layers snapshot',
            layers.map(l => ({
                id: l.id,
                hasCanvas: !!l.canvasEl,
                hasFabric: !!l.fabric,
                visible: l.visible
            }))
        )

        if (!Array.isArray(layers)) {
            throw new Error('Invalid layers payload')
        }

        if (!layers.length) {
            throw new Error('No layers to export')
        }


        if (!layers || layers.length === 0) {
            throw new Error('No layers to export')
        }
        const exportCanvas = document.createElement('canvas')
        const exportWidth = Math.ceil(width * dpi)
        const exportHeight = Math.ceil(height * dpi)
        
        exportCanvas.width = exportWidth
        exportCanvas.height = exportHeight

        const ctx = exportCanvas.getContext('2d')
        if (!ctx) throw new Error('Export context init failed')

        // DPI scaling
        // ctx.save()
        // ctx.scale(dpi, dpi)

        ctx.clearRect(0, 0, exportWidth, exportHeight)

        // IMPORTANT: layers của bạn đang bottom → top trong array
        for (const layer of layers) {
            if (!layer.visible) continue
            if (layer.fabric) {
                // A. Lưu lại object đang chọn (nếu có)
                const activeObj = layer.fabric.getActiveObject();
                
                // B. Bỏ chọn để ẩn khung xanh đi
                if (activeObj) {
                    layer.fabric.discardActiveObject();
                    layer.fabric.renderAll(); // Bắt buộc: Vẽ lại trạng thái sạch
                }

                // C. Lấy canvas chứa ảnh thật (lowerCanvasEl)
                const sourceCanvas = layer.fabric.lowerCanvasEl;

                if (sourceCanvas && sourceCanvas.width > 0) {
                    // D. Vẽ trực tiếp (Rất nhanh, không cần toDataURL)
                    ctx.drawImage(
                        sourceCanvas, 
                        0, 0, exportWidth, exportHeight
                    );
                }

                // E. Khôi phục lại trạng thái chọn cho người dùng
                if (activeObj) {
                    layer.fabric.setActiveObject(activeObj);
                    layer.fabric.requestRenderAll(); // Vẽ lại khung xanh (async để đỡ lag)
                }
            } 
            // 2. Xử lý Canvas thường (Fallback)
            else if (layer.canvasEl) {
                ctx.drawImage(layer.canvasEl, 0, 0, exportWidth, exportHeight)
            }
            // if (layer.fabric) {
            //     const tempCanvas = document.createElement('canvas')
            //     tempCanvas.width = width
            //     tempCanvas.height = height

            //     const tempCtx = tempCanvas.getContext('2d')
            //     const dataURL = layer.fabric.toDataURL({
            //         format: 'png',
            //         quality: 1,
            //         multiplier: 1
            //     })

            //     const img = await loadImage(dataURL)
            //     ctx.drawImage(img, 0, 0, width, height)
            // }
            // // Fallback: nếu có canvasEl
            // else if (layer.canvasEl) {
            //     ctx.drawImage(layer.canvasEl, 0, 0, width, height)
            // }
        }

        ctx.restore()

        const mime =
            format === 'webp'
                ? 'image/webp'
                : 'image/png'

        return new Promise((resolve, reject) => {
            exportCanvas.toBlob(
                (blob) => {
                    if (blob) {
                        resolve(blob);
                    } else {
                        // Truyền lỗi cụ thể vào để log ra được nguyên nhân
                        reject(new Error(`Export failed: Canvas toBlob returned null. Check dimensions: ${width}x${height}`));
                    }
                },
                mime,
                format === 'webp' ? 0.92 : 1
            );
        })
    } catch (err) {
        console.error('[ExportEditor] Failed:', err)
        throw err // ⚠️ QUAN TRỌNG: throw lại error thật
    }
}

function loadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image()
        img.onload = () => resolve(img)
        img.onerror = reject
        img.src = src
    })
}