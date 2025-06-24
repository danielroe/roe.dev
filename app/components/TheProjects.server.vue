<template>
  <section class="flex flex-row flex-wrap gap-4">
    <template v-for="(categoryProjects, category) in groupedProjects" :key="category">
      <div class="w-full mb-6">
        <h2 class="text-lg font-medium mb-4 text-primary">
          {{ categoryLabels[category] || category }}
        </h2>
        <div class="flex flex-row flex-wrap gap-4">
          <ProjectCard
            v-for="project in categoryProjects"
            :key="project._id"
            :project="project"
          />
        </div>
      </div>
    </template>
  </section>
</template>

<script lang="ts" setup>
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
