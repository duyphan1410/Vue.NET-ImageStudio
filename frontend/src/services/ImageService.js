// services/ImageService.js
import { FabricImage } from 'fabric';

export const ImageService = {

    fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = (error) => reject(error);
        });
    },

    async createImageObject(file, canvas) {
        
        const base64Str = await this.fileToBase64(file);

        const img = await FabricImage.fromURL(base64Str, {
            crossOrigin: 'anonymous'
        });

        img.set({
            left: canvas.width / 2,
            top: canvas.height / 2,
            originX: 'center',
            originY: 'center',
            selectable: true
        });

        const scale = Math.min(
            canvas.width / img.width,
            canvas.height / img.height,
            1
        );
        img.scale(scale);

        return img;
    },
};
