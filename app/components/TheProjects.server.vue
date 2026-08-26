<script setup lang="ts">
import type { ProjectCategory } from '#shared/cms/projects'

const { data } = await useFetch<ProjectCategory[]>('/api/projects')

function slug (name: string) {
  return name.toLowerCase().replace(/[\s/]+/g, '-')
}
</script>

<template>
  <div>
    <section
      v-for="category in data || []"
      :id="slug(category.title)"
      :key="category._id"
      class="mb-16"
    >
      <h2 class="text-lg">
        {{ category.title }}
      </h2>

      <div class="w-screen -mx-4 md:-mx-12 overflow-visible mt-4">
        <ul
          class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 px-4 md:px-12 list-none"
        >
          <li
            v-for="item in category.items"
            :key="item.name"
            class="relative bg-accent flex"
            :class="[
              { 'opacity-60': item.archived },
              item.image ? 'flex-col' : '',
            ]"
          >
            <a
              :href="item.url || item.repo || undefined"
              target="_blank"
              rel="noopener noreferrer"
              class="flex flex-grow f-ring-accent"
              :class="item.image ? 'flex-col' : 'flex-row items-start gap-3 p-3'"
              :aria-label="item.name"
            >
              <div
                v-if="item.image"
                class="relative flex items-center justify-center bg-gray-100 dark:bg-gray-900 aspect-video overflow-hidden"
              >
                <img
                  :src="item.image.url"
                  :alt="item.image.alt"
                  loading="lazy"
                  :width="item.image.width ?? 640"
                  :height="item.image.height ?? 360"
                  class="w-full h-full object-cover"
                >
                <span
                  v-if="item.archived"
                  class="absolute top-2 left-2 px-2 py-0.5 bg-background/80 backdrop-blur-sm rounded text-[0.625rem] uppercase tracking-[0.15rem]"
                >
                  Archived
                </span>
              </div>

              <span
                v-else-if="item.icon"
                class="h-8 w-8 text-muted opacity-60 flex-shrink-0 mt-0.5 inline-block"
                :class="item.icon"
                aria-hidden="true"
              />

              <div
                class="flex flex-col flex-grow"
                :class="item.image ? 'px-3 py-3' : ''"
              >
                <h3 class="font-medium">
                  {{ item.name }}
                </h3>
                <p
                  v-if="item.description"
                  class="text-sm text-gray-600 dark:text-gray-400 mt-1"
                >
                  {{ item.description }}
                </p>
              </div>
            </a>

            <a
              v-if="item.repo && item.repo !== item.url"
              :href="item.repo"
              target="_blank"
              rel="noopener noreferrer"
              class="absolute top-2 right-2 p-1.5 bg-background/80 backdrop-blur-sm rounded-full hover:bg-background transition-colors f-ring"
              :aria-label="`GitHub repository for ${item.name}`"
            >
              <span
                class="h-4 w-4 i-ri:github-fill block"
                aria-hidden="true"
              />
            </a>
          </li>
        </ul>
      </div>
    </section>
  </div>
</template>
