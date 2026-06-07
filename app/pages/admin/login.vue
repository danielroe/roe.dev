<script setup lang="ts">
definePageMeta({ layout: false })

useHead({
  title: 'Sign in · admin',
})

const route = useRoute()
const next = computed(() => typeof route.query.next === 'string' ? route.query.next : '/admin')

const error = computed(() => {
  const e = route.query.error
  return typeof e === 'string' ? e : null
})
</script>

<template>
  <main class="min-h-screen flex items-center justify-center px-4">
    <div class="w-full max-w-sm bg-accent p-8 flex flex-col gap-6">
      <header>
        <h1 class="text-2xl">
          Sign in
        </h1>
        <p class="text-muted text-sm mt-1">
          atproto OAuth via npmx.social
        </p>
      </header>

      <p
        v-if="error"
        class="text-sm text-red-500"
      >
        {{ error }}
      </p>

      <form
        method="POST"
        action="/api/admin/auth/start"
      >
        <input
          type="hidden"
          name="next"
          :value="next"
        >
        <button
          type="submit"
          class="w-full text-center bg-primary text-background px-4 py-2 hover:bg-primary/90 transition-colors"
        >
          Sign in with atproto
        </button>
      </form>
    </div>
  </main>
</template>
