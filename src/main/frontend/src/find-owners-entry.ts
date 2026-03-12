import { createApp } from 'vue'
import FindOwnersView from '@/components/find-owners/FindOwnersView.vue'

const el = document.getElementById('vue-app')
if (el) {
  createApp(FindOwnersView).mount(el)
}
