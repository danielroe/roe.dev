<template>
  <div class="flex-grow mx-auto p-4 w-full max-w-[70ch]">
    <header class="leading-none mt-[5vw] mb-[1vw]">
      <h1 class="text-2xl">Welcome!</h1>
    </header>
    <main :class="$style.home" class="text-lg">
      <StaticMarkdownRender v-if="page" :value="page" />
      <template v-if="sponsors && sponsors.length">
        <hr
          class="block mx-auto my-8 content w-4 border-t-2 border-solid border-gray-700"
        />
        <aside>
          <header class="text-center font-bold mb-4">
            special thanks to
            <template v-if="$auth.user.sponsor">
              <span class="text-white">you</span>
              and
            </template>
          </header>
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
              format="webp"
              height="35"
              width="35"
            />
          </div>
        </aside>
      </template>
    </main>
  </div>
</template>

<script lang="ts" setup>
const { data: sponsors } = await useFetch('/api/sponsors')

useHead({
  meta: [{ hid: 'og:title', property: 'og:title', content: `Daniel Roe` }],
})

const { data: page } = await useAsyncData(
  () =>
    ((process.server || process.dev) as true) &&
    queryContent('/').only(['title', 'type', 'body']).findOne()
)
</script>

<style module>
.home {
  p + p {
    @apply mt-4;
  }
}
</style>
