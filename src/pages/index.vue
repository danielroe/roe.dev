<template>
  <div :class="$style.home">
    <header>
      <h2>Welcome!</h2>
    </header>
    <main>
      <StaticMarkdownRender v-if="page" :value="page" />
      <template v-if="sponsors.length">
        <hr
          class="block mx-auto my-8 content w-4 border-t-2 border-solid border-gray-700"
        />
        <h3 class="text-center font-bold mb-4">
          special thanks to
          <template v-if="$auth.user.sponsor">
            <span class="text-white">you</span>
            and
          </template>
        </h3>
        <div
          class="flex gap-3 flex-row flex-wrap max-w-md mx-auto justify-center relative"
        >
          <nuxt-img
            v-for="sponsor of sponsors"
            :key="sponsor"
            sizes="sm:70px"
            alt=""
            class="rounded-full"
            :class="{
              'border-solid border-[1px] border-yellow-400':
                $auth.user.avatar === sponsor,
            }"
            :src="sponsor"
            height="35"
            width="35"
          />
        </div>
      </template>
    </main>
  </div>
</template>

<script lang="ts" setup>
const { data: sponsors } = await useFetch('/api/sponsors')

useHead({
  meta: [{ hid: 'og:title', property: 'og:title', content: `Daniel Roe` }],
})

const { data: page } = await useAsyncHome()
</script>

<style module>
.home {
  p + p {
    @apply mt-4;
  }
}
</style>
