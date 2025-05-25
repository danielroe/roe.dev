<template>
  <div>
    <section
      v-for="category in sortedCategories"
      :key="category.category"
      class="mb-12"
    >
      <h2 class="text-lg">
        {{ category.category }}
      </h2>

      <div
        v-if="category.displayAsGrid"
        class="w-screen -mx-4 md:-mx-12 overflow-visible mt-4"
      >
        <ul
          class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 px-4 md:px-12"
        >
          <li
            v-for="item in sortedItems(category)"
            :key="item.name"
          >
            <div class="bg-accent flex flex-col">
              <div
                v-if="item.image"
                class="relative flex flex-col justify-end bg-gray-900 aspect-video overflow-hidden"
              >
                <NuxtImg
                  provider="sanity"
                  :src="item.image"
                  :alt="item.name"
                  class="w-full h-full object-cover"
                />
              </div>

              <div class="px-2 py-2 flex flex-col">
                <div class="flex justify-between items-start">
                  <h3 class="font-medium">
                    {{ item.name }}
                  </h3>
                </div>

                <p
                  v-if="item.description"
                  class="text-sm text-gray-600 dark:text-gray-400 mt-1"
                >
                  {{ item.description }}
                </p>

                <div class="mt-3 space-y-2">
                  <div
                    v-if="item.links && item.links.length"
                    class="flex flex-wrap gap-2"
                  >
                    <a
                      v-for="(link, i) in item.links"
                      :key="i"
                      :href="link.url"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="text-sm px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center gap-2"
                    >
                      <img
                        :src="`https://www.google.com/s2/favicons?domain=${getHost(link.url)}&sz=256`"
                        height="16"
                        width="16"
                        class="rounded-full"
                        alt=""
                        role="presentation"
                      >
                      {{ link.label || 'Visit' }}
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </li>
        </ul>
      </div>

      <ul
        v-else
        class="mt-4 pl-4 list-none"
      >
        <li
          v-for="item in sortedItems(category)"
          :key="item.name"
          class="mb-2"
        >
          <div class="flex items-center gap-1">
            <span v-if="item.links && item.links.length">
              <a
                :href="item.links?.[0]?.url"
                target="_blank"
                rel="noopener noreferrer"
              >{{ item.name }}</a>
            </span>
            <span v-else>{{ item.name }}</span>
          </div>

          <div
            v-if="item.description"
            class="text-sm text-gray-600 dark:text-gray-400 mt-1"
          >
            {{ item.description }}
          </div>

          <div
            v-if="item.links && item.links.length > 1"
            class="flex flex-wrap gap-2 mt-2"
          >
            <a
              v-for="(link, i) in item.links.slice(1)"
              :key="i"
              :href="link.url"
              target="_blank"
              rel="noopener noreferrer"
              class="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded"
            >
              {{ link.label || 'Link' }}
            </a>
          </div>
        </li>
      </ul>
    </section>
  </div>
</template>

<script setup lang="ts">
interface Link {
  url: string
  label?: string
}

interface UsesItem {
  name: string
  description?: string
  link?: string
  links?: Link[]
  image?: any
  order?: number
}

interface UsesCategory {
  _id: string
  category: string
  order: number
  displayAsGrid?: boolean
  items: UsesItem[]
}

const { data } = await useSanityQuery<UsesCategory[]>(`
  *[_type == "uses"] {
    _id,
    category,
    order,
    displayAsGrid,
    items[] {
      name,
      description,
      links[] {
        url,
        label
      },
      "image": image.asset->_id,
      order
    }
  }
`)

function getHost (url: string): string {
  try {
    const urlObj = new URL(url)
    return urlObj.origin
  }
  catch {
    return ''
  }
}

const sortedCategories = computed(() => {
  return [...(data.value || [])].sort((a, b) => (a.order || 100) - (b.order || 100))
})

const sortedItems = (category: UsesCategory) => {
  return [...(category.items || [])].sort((a, b) => (a.order || 100) - (b.order || 100))
}
</script>
