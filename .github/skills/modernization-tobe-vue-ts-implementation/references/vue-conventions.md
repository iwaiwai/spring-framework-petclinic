# Vue 3 + TypeScript Conventions for PetClinic

## Component Structure

Use Vue 3 Composition API with `<script setup lang="ts">` syntax exclusively.

### Single File Component Template

```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { Owner } from '@/types/owner'
import { fetchOwners } from '@/api/owner'

const owners = ref<Owner[]>([])
const loading = ref(true)
const error = ref<string | null>(null)

onMounted(async () => {
  try {
    owners.value = await fetchOwners()
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Unknown error'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div>
    <div v-if="loading">Loading...</div>
    <div v-else-if="error">{{ error }}</div>
    <div v-else>
      <!-- content -->
    </div>
  </div>
</template>
```

## TypeScript Interfaces

Define all interfaces in `src/main/frontend/src/types/<domain>.ts`:

```typescript
export interface Owner {
  id: number
  firstName: string
  lastName: string
  address: string
  city: string
  telephone: string
  pets: Pet[]
}

export interface Pet {
  id: number
  name: string
  birthDate: string
  type: PetType
  visits: Visit[]
}
```

## API Client Pattern

Use a typed API client in `src/main/frontend/src/api/<domain>.ts`:

```typescript
import type { Owner } from '@/types/owner'

const BASE_URL = '/api'

export async function searchOwners(lastName: string): Promise<Owner[]> {
  const response = await fetch(`${BASE_URL}/owners?lastName=${encodeURIComponent(lastName)}`)
  if (!response.ok) throw new Error(`Search failed: ${response.status}`)
  return response.json()
}
```

## Vue Router Integration

Configure routes to match legacy URL structure:

```typescript
import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/owners/find',
      name: 'findOwners',
      component: () => import('@/components/owners/FindOwners.vue')
    },
    {
      path: '/owners',
      name: 'ownersList',
      component: () => import('@/components/owners/OwnersList.vue')
    }
  ]
})
```

## Vite Configuration

```typescript
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  build: {
    outDir: '../webapp/vue',
    emptyOutDir: true
  },
  server: {
    proxy: {
      '/api': 'http://localhost:8080'
    }
  }
})
```

## Preserving Legacy Behavior

### Form Submission

Legacy JSP forms do full page submissions. Vue forms should:
1. Intercept submit with `@submit.prevent`
2. Call the API endpoint
3. Handle the response identically to the legacy flow (redirects, error display)

### Table Rendering

Legacy JSP renders `<table>` elements with IDs. Vue components must render the same
semantic HTML with matching IDs and class names that E2E tests rely on.

### Error Messages

Legacy Spring MVC validation produces specific error message text. Vue must display
the exact same messages — either by calling the server validation endpoint or by
replicating the validation rules with identical messages client-side.
