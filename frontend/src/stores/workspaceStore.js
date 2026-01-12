import { defineStore } from 'pinia'
import { ref,computed } from 'vue'

export const useWorkspaceStore = defineStore('workspace', () => {
  const activeType = ref(null)
  const payloadGetter = ref(null)

  function setWorkspace(type, getPayload) {
    activeType.value = type
    payloadGetter.value = getPayload
  }

  function clearWorkspace() {
    activeType.value = null
    payloadGetter.value = null
  }

  const ready = computed(() => {
    return !!activeType.value && typeof payloadGetter.value === 'function'  
  })

  return {
    activeType,
    payloadGetter,
    ready,
    setWorkspace,
    clearWorkspace
  }
})
