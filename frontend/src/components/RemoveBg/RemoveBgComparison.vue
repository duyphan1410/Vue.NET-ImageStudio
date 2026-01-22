<script setup>
import RemoveBgImagePanel from './RemoveBgImagePanel.vue';
import RemoveBgProcessButton from './RemoveBgProcessButton.vue';

defineProps({
  originalImage: String,
  resultImage: String,
  isLoading: Boolean
});

defineEmits(['process', 'edit']);
</script>

<template>
  <div class="comparison-view">
    <RemoveBgImagePanel
      title="Original"
      :image="originalImage"
    />

    <RemoveBgProcessButton
      :result-image="resultImage"
      :is-loading="isLoading"
      @process="$emit('process')"
    />

    <RemoveBgImagePanel
      title="Result"
      :image="resultImage"
      with-checker
      show-edit
      @edit="$emit('edit')"
    />
  </div>
</template>

<style scoped>
.comparison-view {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  grid-template-rows: minmax(400px, calc(100vh - 180px));
  gap: 24px;
  width: 100%;
  max-width: 1400px;
  height: 100%; /* Chiếm hết chiều cao */
  max-height: 800px;
  align-items: center;
}

@media (max-width: 1200px) {
  .comparison-view {
    grid-template-columns: 1fr;
    grid-template-rows: auto auto auto;
    gap: 20px;
  }
}
</style>