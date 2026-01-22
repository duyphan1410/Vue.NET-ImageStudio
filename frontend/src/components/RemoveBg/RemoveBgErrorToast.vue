<script setup>
import { AlertTriangle, X } from 'lucide-vue-next';

defineProps({
  message: String
});

defineEmits(['close']);
</script>

<template>
  <Transition name="slide-up">
    <div class="error-toast">
      <AlertTriangle :size="20" color="#ff6b6b" />
      <p>{{ message }}</p>
      <button @click="$emit('close')" class="close-btn">
        <X :size="18" />
      </button>
    </div>
  </Transition>
</template>

<style scoped>
.error-toast {
  position: fixed;
  bottom: 24px;
  right: 24px;
  background: #2d2d2d;
  border: 1px solid #ff6b6b;
  border-radius: 8px;
  padding: 16px 20px;
  display: flex;
  align-items: center;
  gap: 12px;
  max-width: 400px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
  z-index: 1000;
}

.error-toast p {
  flex: 1;
  margin: 0;
  font-size: 14px;
  color: #ff6b6b;
}

.close-btn {
  background: transparent;
  border: none;
  color: #888;
  cursor: pointer;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #e0e0e0;
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100px);
  opacity: 0;
}

@media (max-width: 768px) {
  .error-toast {
    left: 16px;
    right: 16px;
    bottom: 16px;
  }
}
</style>