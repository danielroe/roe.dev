<template>
  <div class="flex-grow mx-auto p-4 w-full max-w-[37.50rem]">
    <header class="leading-none mt-[5vw] mb-[1vw]">
      <h1 class="text-2xl">Thank you!</h1>
    </header>
    <main class="text-muted text-lg">
      <p>Your response has been recorded. 😊</p>
      <p>
        <NuxtLink class="underlined-link" to="/">Home</NuxtLink>
      </p>
    </main>
  </div>
</template>

<script lang="ts" setup>
definePageMeta({ title: 'Thank you!' })
</script>
