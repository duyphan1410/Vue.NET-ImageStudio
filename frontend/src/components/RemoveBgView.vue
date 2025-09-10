<script setup>
import { ref } from "vue";
import api from "../services/api";

const selectedFile = ref(null);
const resultImage = ref(null);
const isLoading = ref(false);
const error = ref(null);

const onFileChange = (e) => {
  selectedFile.value = e.target.files[0];
  resultImage.value = null; // Clear previous result
  error.value = null; // Clear previous error
};

const uploadFile = async () => {
  if (!selectedFile.value) {
    error.value = "Please select a file first";
    return;
  }

  // Validate file type
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!validTypes.includes(selectedFile.value.type)) {
    error.value = "Please select a valid image file (JPEG, PNG, WebP)";
    return;
  }

  // Validate file size (max 10MB)
  if (selectedFile.value.size > 10 * 1024 * 1024) {
    error.value = "File size must be less than 10MB";
    return;
  }

  isLoading.value = true;
  error.value = null;

  try {
    const formData = new FormData();
    formData.append("file", selectedFile.value);
    
    const res = await api.post("api/image/remove-bg", formData, {
      headers: { 
        "Content-Type": "multipart/form-data" 
      },
      timeout: 60000 // 60 seconds timeout
    });

    if (res.data && res.data.image) {
      resultImage.value = "data:image/png;base64," + res.data.image;
    } else {
      error.value = "Invalid response from server";
    }
  } catch (err) {
    console.error("Upload error:", err);
    
    if (err.response) {
      // Server responded with error status
      error.value = err.response.data?.error || `Server error: ${err.response.status}`;
    } else if (err.request) {
      // Request was made but no response received
      error.value = "No response from server. Please check your connection.";
    } else {
      // Something else happened
      error.value = "An unexpected error occurred";
    }
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <div class="container">
    <h1 class="title">Remove Background Demo</h1>
    
    <div class="upload-section">
      <div class="file-input-wrapper">
        <input 
          type="file" 
          @change="onFileChange" 
          accept="image/*"
          :disabled="isLoading"
          class="file-input"
        />
      </div>
      <button 
        @click="uploadFile" 
        :disabled="!selectedFile || isLoading"
        class="upload-button"
      >
        {{ isLoading ? 'Processing...' : 'Upload & Remove BG' }}
      </button>
    </div>

    <!-- Error display -->
    <div v-if="error" class="error">
      <p>Error: {{ error }}</p>
    </div>

    <!-- Loading indicator -->
    <div v-if="isLoading" class="loading">
      <p>Processing image... Please wait.</p>
    </div>

    <!-- Result display -->
    <div v-if="resultImage" class="result">
      <h2>Result:</h2>
      <div class="image-container">
        <img :src="resultImage" alt="Processed" class="result-image" />
      </div>
      <div class="download-section">
        <a :href="resultImage" :download="`removed_bg_${Date.now()}.png`" class="download-link">
          <button class="download-button">Download Result</button>
        </a>
      </div>
    </div>
  </div>
</template>

<style scoped>
.container {
  width: 100%;
  margin: 0 auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  background-color: white;
  color: black;
  min-height: calc(100vh - 80px);
}

.title {
  text-align: center;
  margin-bottom: 30px;
  color: #333;
  font-size: 2rem;
  font-weight: 600;
}

.upload-section {
  width: 100%;
  max-width: 500px;
  margin: 20px 0;
  display: flex;
  flex-direction: column;
  gap: 15px;
  align-items: center;
}

.file-input-wrapper {
  width: 100%;
}

.file-input {
  width: 100%;
  padding: 12px;
  border: 2px dashed #007bff;
  border-radius: 8px;
  background-color: #f8f9fa;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.file-input:hover {
  border-color: #0056b3;
  background-color: #e9ecef;
}

.file-input:disabled {
  background-color: #e9ecef;
  cursor: not-allowed;
  opacity: 0.6;
}

.upload-button {
  padding: 12px 24px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 500;
  transition: background-color 0.3s ease;
  min-width: 200px;
}

.upload-button:hover:not(:disabled) {
  background-color: #0056b3;
}

.upload-button:disabled {
  background-color: #6c757d;
  cursor: not-allowed;
}

.error {
  width: 100%;
  max-width: 500px;
  background-color: #f8d7da;
  color: #721c24;
  padding: 15px;
  border-radius: 6px;
  margin: 10px 0;
  border: 1px solid #f5c6cb;
}

.loading {
  width: 100%;
  max-width: 500px;
  background-color: #d1ecf1;
  color: #0c5460;
  padding: 15px;
  border-radius: 6px;
  margin: 10px 0;
  border: 1px solid #bee5eb;
  text-align: center;
}

.result {
  width: 100%;
  max-width: 600px;
  margin-top: 30px;
  text-align: center;
}

.result h2 {
  margin-bottom: 20px;
  color: #333;
}

.image-container {
  margin: 20px 0;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  padding: 20px;
  background-color: #f8f9fa;
  display: flex;
  justify-content: center;
  align-items: center;
}

.result-image {
  max-width: 100%;
  max-height: 500px;
  height: auto;
  border-radius: 4px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.download-section {
  margin-top: 20px;
}

.download-link {
  text-decoration: none;
}

.download-button {
  padding: 12px 24px;
  background-color: #28a745;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 500;
  transition: background-color 0.3s ease;
}

.download-button:hover {
  background-color: #218838;
}

/* Responsive design */
@media (max-width: 768px) {
  .container {
    padding: 15px;
  }
  
  .title {
    font-size: 1.5rem;
  }
  
  .upload-section {
    max-width: 100%;
  }
  
  .error, .loading {
    max-width: 100%;
  }
  
  .result {
    max-width: 100%;
  }
  
  .image-container {
    padding: 15px;
  }
}

@media (max-width: 480px) {
  .container {
    padding: 10px;
  }
  
  .upload-button, .download-button {
    width: 100%;
    min-width: auto;
  }
  
  .file-input {
    padding: 10px;
  }
}
</style>