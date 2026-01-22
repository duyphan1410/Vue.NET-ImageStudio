import { ref } from 'vue'
import api from '@/services/api'

export function useRemoveBg() {
  const selectedFile = ref(null)
  const originalImage = ref(null)
  const resultImage = ref(null)
  const isLoading = ref(false)
  const error = ref(null)

  const isEditing = ref(false);
  const editedImage = ref(null);

  function processFile(file) {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!validTypes.includes(file.type)) {
      error.value = 'Invalid image format'
      return false
    }

    if (file.size > 10 * 1024 * 1024) {
      error.value = 'File too large'
      return false
    }

    selectedFile.value = file
    originalImage.value = URL.createObjectURL(file)
    resultImage.value = null
    error.value = null
    return true
  }

  async function removeBg() {
    if (!selectedFile.value) return

    isLoading.value = true
    error.value = null

    try {
      const formData = new FormData()
      formData.append('file', selectedFile.value)

      const res = await api.post('/api/image/remove-bg', formData)
      resultImage.value = 'data:image/png;base64,' + res.data.image
    } catch (e) {
      error.value = 'Remove background failed'
    } finally {
      isLoading.value = false
    }
  }

  const startEditing = () => {
    if (resultImage.value) {
      editedImage.value = resultImage.value;
      isEditing.value = true;
    }
  };

  // MỚI: Save edited image
  const saveEdited = (dataUrl) => {
    resultImage.value = dataUrl;
    isEditing.value = false;
  };

  // MỚI: Cancel editing
  const cancelEditing = () => {
    isEditing.value = false;
  };

  function reset() {
    selectedFile.value = null;
    originalImage.value = null;
    resultImage.value = null;
    error.value = null;
    editedImage.value = null;
    isEditing.value = false;
  }

  return {
    selectedFile,
    originalImage,
    resultImage,
    isLoading,
    error,
    processFile,
    removeBg,
    reset,
    isEditing,
    editedImage,
    startEditing,
    saveEdited,
    cancelEditing,
  }
}
