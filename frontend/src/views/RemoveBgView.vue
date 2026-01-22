<script setup>
import { onMounted, onUnmounted } from 'vue';
import { useRemoveBg } from '@/composables/useRemoveBg';
import { useWorkspaceStore } from '@/stores/workspaceStore';

import RemoveBgHeader from '@/components/RemoveBg/RemoveBgHeader.vue';
import RemoveBgUploadArea from '@/components/RemoveBg/RemoveBgUploadArea.vue';
import RemoveBgComparison from '@/components/RemoveBg/RemoveBgComparison.vue';
import RemoveBgErrorToast from '@/components/RemoveBg/RemoveBgErrorToast.vue';
import RemoveBgEditor from '@/components/RemoveBg/RemoveBgEditor.vue';

const workspaceStore = useWorkspaceStore();

const {
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
} = useRemoveBg();

onMounted(() => {
  workspaceStore.setWorkspace('remove-bg', () => ({
    resultImage: resultImage.value
  }));
});

onUnmounted(() => {
  workspaceStore.clearWorkspace();
});
</script>

<template>
  <div class="remove-bg-container">
    <!-- Editor Mode -->
    <RemoveBgEditor
      v-if="isEditing"
      :image="editedImage"
      :original-image="originalImage"
      @save="saveEdited"
      @cancel="cancelEditing"
    />

    <RemoveBgHeader 
      :has-image="!!originalImage"
      :disabled="isEditing"
      @reset="reset"
    />

    <div class="content">
      <RemoveBgUploadArea
        v-if="!originalImage"
        :disabled="isEditing"
        @file-selected="processFile"
      />

      <RemoveBgComparison
        v-else
        :original-image="originalImage"
        :result-image="resultImage"
        :is-loading="isLoading"
        :disabled="isEditing"
        @process="removeBg"
        @edit="startEditing"
      />
    </div>

    <RemoveBgErrorToast
      v-if="error"
      :message="error"
      @close="error = null"
    />
  </div>
</template>

<style scoped>
.remove-bg-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #1e1e1e;
  color: #e0e0e0;
  overflow: hidden;
}

.content {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  overflow: auto;
  min-height: 0;
}

@media (max-width: 768px) {
  .content {
    padding: 16px;
  }
}
</style>