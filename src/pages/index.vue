<script setup>
const avatar = useNuxtApp().$auth.user.avatar
useHead({
  style: [
    {
      innerHTML: `
img[data-image-src='${avatar || 'null'}'] {
  border-style: solid;
  border-width: 1px;

  --tw-border-opacity: 1;

  border-color: rgb(250 204 21 / var(--tw-border-opacity));
}`,
    },
  ],
})
</script>

<template>
  <div class="flex-grow mx-auto p-4 w-full max-w-[37.50rem]">
    <header class="leading-none mt-[5vw] mb-[1vw]">
      <h1 class="text-2xl">Welcome!</h1>
    </header>
    <main :class="$style.home" class="text-lg">
      <StaticMarkdownRender path="/" />
      <hr
        class="block mx-auto my-8 content w-4 border-t-2 border-solid border-gray-700"
      />
      <aside>
        <header class="text-center font-bold mb-4">
          special thanks to
          <template v-if="$auth.user.sponsor">
            <span class="text-[var(--text-base)]">you</span>
            and
          </template>
        </header>
        <TheSponsors />
      </aside>
    </main>
  </div>
</template>
