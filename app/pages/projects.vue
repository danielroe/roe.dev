<script setup lang="ts">
interface Project {
  _id: string
  name: string
  description?: string
  category?: string
  categories?: string[]
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

const { data: projects } = await useFetch<Project[]>('/api/projects')

useSeoMeta({
  title: 'Projects',
  description: 'Open source projects and tools I\'ve created.',
})

const groupedProjects = computed(() => {
  if (!projects.value) return {}

  const groups: Record<string, Project[]> = {}

  for (const project of projects.value) {
    const category = project.category || 'other'
    if (!groups[category]) {
      groups[category] = []
    }
    groups[category].push(project)
  }

  // Sort projects within each category
  for (const category in groups) {
    if (groups[category]) {
      groups[category].sort((a, b) => {
        // Featured projects first
        if (a.isFeatured && !b.isFeatured) return -1
        if (!a.isFeatured && b.isFeatured) return 1

        // Then by order
        if (a.order !== b.order) return (a.order || 100) - (b.order || 100)

        // Then by name
        return a.name.localeCompare(b.name)
      })
    }
  }

  return groups
})

const categoryLabels: Record<string, string> = {
  framework: 'Frameworks',
  library: 'Libraries',
  tool: 'Tools',
  template: 'Templates',
  example: 'Examples',
  plugin: 'Plugins',
  extension: 'Extensions',
  experiment: 'Experiments',
  docs: 'Documentation',
  other: 'Other',
}
</script>

<template>
  <div>
    <h1 class="text-3xl font-bold mb-8">
      Projects
    </h1>

    <p class="text-lg text-gray-600 dark:text-gray-400 mb-12 max-w-2xl">
      A collection of open source projects, tools, and experiments I've created.
      From Nuxt modules to developer utilities, these projects reflect my journey
      in building for the modern web.
    </p>

    <div
      v-if="!projects || !projects.length"
      class="text-center py-12"
    >
      <p class="text-gray-500 dark:text-gray-400">
        No projects found.
      </p>
    </div>

    <div
      v-else
      class="space-y-12"
    >
      <section
        v-for="(categoryProjects, category) in groupedProjects"
        :key="category"
        class="space-y-6"
      >
        <h2 class="text-2xl font-semibold text-gray-900 dark:text-gray-100">
          {{ categoryLabels[category] || category }}
        </h2>

        <section class="flex flex-row flex-wrap gap-4">
          <ProjectCard
            v-for="project in categoryProjects"
            :key="project._id"
            :project="project"
          />
        </section>
      </section>
    </div>
  </div>
</template>


