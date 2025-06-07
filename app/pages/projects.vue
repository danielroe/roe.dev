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
    url: string
    stars: number
    language: string
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

const getLanguageColor = (language: string) => {
  const colors: Record<string, string> = {
    TypeScript: '#3178c6',
    JavaScript: '#f1e05a',
    Vue: '#4fc08d',
    Python: '#3572a5',
    Go: '#00add8',
    Rust: '#dea584',
    Java: '#b07219',
    PHP: '#4f5d95',
    CSS: '#563d7c',
    HTML: '#e34c26',
    Shell: '#89e051',
  }
  return colors[language] || '#6b7280'
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

        <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <article
            v-for="project in categoryProjects"
            :key="project._id"
            class="group relative bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow duration-200"
            :class="{ 'ring-2 ring-blue-500': project.isFeatured }"
          >
            <div class="flex items-start gap-4">
              <div class="flex-shrink-0">
                <span
                  v-if="project.logo && !project.logo.startsWith('http')"
                  class="text-3xl"
                  aria-hidden="true"
                >
                  {{ project.logo }}
                </span>
                <img
                  v-else-if="project.logo"
                  :src="project.logo"
                  :alt="`${project.name} logo`"
                  class="w-12 h-12 rounded"
                >
                <div
                  v-else
                  class="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded flex items-center justify-center"
                >
                  <span class="text-2xl">📦</span>
                </div>
              </div>

              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-2">
                  <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">
                    {{ project.name }}
                  </h3>
                  <span
                    v-if="project.isFeatured"
                    class="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full"
                  >
                    ⭐ Featured
                  </span>
                </div>

                <p
                  v-if="project.description"
                  class="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2"
                >
                  {{ project.description }}
                </p>

                <div
                  v-if="project.githubRepo"
                  class="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-4"
                >
                  <span
                    v-if="project.githubRepo.language"
                    class="flex items-center gap-1"
                  >
                    <span
                      class="w-3 h-3 rounded-full"
                      :style="{ backgroundColor: getLanguageColor(project.githubRepo.language) }"
                    />
                    {{ project.githubRepo.language }}
                  </span>
                  <span
                    v-if="project.githubRepo.stars"
                    class="flex items-center gap-1"
                  >
                    ⭐ {{ project.githubRepo.stars.toLocaleString() }}
                  </span>
                </div>

                <div class="flex flex-wrap gap-2 mb-4">
                  <span
                    v-for="tag in project.tags"
                    :key="tag"
                    class="inline-flex items-center px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 rounded"
                  >
                    {{ tag }}
                  </span>
                </div>

                <div class="flex flex-wrap gap-2">
                  <a
                    v-if="project.githubRepo?.url"
                    :href="project.githubRepo.url"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="inline-flex items-center gap-1 px-3 py-1 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    <svg
                      class="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                    </svg>
                    GitHub
                  </a>

                  <a
                    v-for="link in project.links"
                    :key="link.url"
                    :href="link.url"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="inline-flex items-center gap-1 px-3 py-1 text-sm font-medium text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20 rounded hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                  >
                    <svg
                      v-if="link.type === 'docs'"
                      class="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    <svg
                      v-else-if="link.type === 'demo'"
                      class="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      />
                    </svg>
                    <svg
                      v-else
                      class="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                      />
                    </svg>
                    {{ link.label }}
                  </a>
                </div>
              </div>
            </div>
          </article>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
