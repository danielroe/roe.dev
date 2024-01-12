<template>
  <div class="flex-grow px-4 py-2 md:px-12 md:py-4 w-full">
    <header class="leading-none mt-[5vw] mb-[1vw] max-w-[37.50rem]">
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
