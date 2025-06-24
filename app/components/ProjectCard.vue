<template>
  <GridLink
    :href="primaryLink"
    :aria-label="`${project.name} project`"
    class="overflow-hidden md:min-h-[12rem] md:flex-[30%]"
  >
    <article class="relative h-full">
      <!-- Featured badge -->
      <span
        v-if="project.isFeatured"
        class="absolute flex top-0 right-0 pr-1 text-primary before:content-empty before:relative before:block before:w-full before:-mt-4 before:mb-2 before:bg-background before:rotate-30 before:scale-x-1000"
      >
        <span class="z-10 text-xs px-2 py-1 bg-blue-500 text-white rounded-full">
          ⭐ Featured
        </span>
      </span>

      <!-- Project icon -->
      <div class="flex items-center gap-3 mb-3">
        <div class="flex-shrink-0">
          <span
            v-if="project.logo && !project.logo.startsWith('http')"
            class="text-2xl"
            aria-hidden="true"
          >
            {{ project.logo }}
          </span>
          <img
            v-else-if="project.logo"
            :src="project.logo"
            :alt="`${project.name} logo`"
            class="w-8 h-8 rounded"
          >
          <span
            v-else
            class="text-2xl"
            aria-hidden="true"
          >
            📦
          </span>
        </div>
        <header class="flex-1 min-w-0">
          <h3 class="font-medium truncate">
            {{ project.name }}
          </h3>
          <p
            v-if="project.category"
            class="text-xs text-muted uppercase tracking-wide"
          >
            {{ categoryLabels[project.category] || project.category }}
          </p>
        </header>
      </div>

      <!-- Description -->
      <p
        v-if="project.description"
        class="text-sm text-muted mb-3 line-clamp-2"
      >
        {{ project.description }}
      </p>

      <!-- GitHub stats - fetched at runtime -->
      <ClientOnly v-if="project.githubRepo">
        <GitHubRepoStats
          :owner="project.githubRepo.owner"
          :repo="project.githubRepo.name"
          class="mb-3"
        />
      </ClientOnly>

      <!-- Tags -->
      <div
        v-if="project.tags?.length"
        class="flex flex-wrap gap-1 mb-3"
      >
        <span
          v-for="tag in project.tags.slice(0, 3)"
          :key="tag"
          class="inline-flex items-center px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 rounded"
        >
          {{ tag }}
        </span>
        <span
          v-if="project.tags.length > 3"
          class="inline-flex items-center px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 rounded"
        >
          +{{ project.tags.length - 3 }}
        </span>
      </div>

      <!-- Links preview -->
      <div
        v-if="additionalLinks.length"
        class="text-xs text-muted"
      >
        {{ additionalLinks.length }} additional link{{ additionalLinks.length > 1 ? 's' : '' }}
      </div>
    </article>
  </GridLink>
</template>

<script setup lang="ts">
interface Project {
  _id: string
  name: string
  description?: string
  category?: string
  order?: number
  isFeatured?: boolean
  githubRepo?: {
    owner?: string
    name?: string
    url?: string
    lastUpdated?: string
    stars?: number
    language?: string
    description?: string
    updatedAt?: string
  }
  links?: Array<{
    label: string
    url: string
    type?: string
  }>
  tags?: string[]
  logo?: string
}

interface Props {
  project: Project
}

const props = defineProps<Props>()

const categoryLabels: Record<string, string> = {
  framework: 'Framework',
  library: 'Library',
  tool: 'Tool',
  template: 'Template',
  example: 'Example',
  plugin: 'Plugin',
  extension: 'Extension',
  experiment: 'Experiment',
  docs: 'Documentation',
  other: 'Other',
}

const primaryLink = computed(() => {
  return props.project.githubRepo?.url || props.project.links?.[0]?.url || '#'
})

const additionalLinks = computed(() => {
  const links = props.project.links || []
  return props.project.githubRepo?.url ? links : links.slice(1)
})
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
