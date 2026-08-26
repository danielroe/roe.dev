<script setup lang="ts">
import type { dev } from '#shared/lex'
import type { Loose } from '#shared/cms/strict'

definePageMeta({ layout: false })
useHead({ title: 'Projects - admin - Daniel Roe' })

interface CategoryEntry {
  rkey: string
  uri: string
  cid: string
  value: Loose<dev.roe.projectCategory.Main>
}

interface ProjectEntry {
  rkey: string
  uri: string
  cid: string
  value: Loose<dev.roe.project.Main>
}

const { data: categoriesData, refresh: refreshCategories, loading: categoriesLoading } = useAdminFetch<CategoryEntry[]>('/api/admin/project-categories', { default: () => [] })
const { data: projectsData, refresh: refreshProjects, loading: projectsLoading } = useAdminFetch<ProjectEntry[]>('/api/admin/projects', { default: () => [] })

const showSkeleton = computed(() =>
  (categoriesLoading.value || projectsLoading.value)
  && !categoriesData.value.length,
)

const sortedCategories = computed(() => {
  return [...(categoriesData.value ?? [])].sort((a, b) => (a.value.order ?? 100) - (b.value.order ?? 100))
})

/**
 * Per-category reactive project lists wired to formkit/drag-and-drop. Each
 * category's projects are sortable independently; cross-category drag is
 * intentionally not enabled (different parent ref).
 */
const categoryDnD = computed(() => {
  return sortedCategories.value.map(category => {
    const itemsForCategory = (projectsData.value ?? [])
      .filter(it => it.value.category?.uri === category.uri)
      .sort((a, b) => (a.value.order ?? 100) - (b.value.order ?? 100))

    return { category, items: itemsForCategory }
  })
})

async function removeCategory (rkey: string, title: string) {
  if (!confirm(`Delete category "${title}"? Projects in this category will be left orphaned.`)) return
  const previous = categoriesData.value
  categoriesData.value = categoriesData.value.filter(c => c.rkey !== rkey)
  try {
    await $fetch(`/api/admin/project-categories/${rkey}`, { method: 'DELETE' })
    refreshCategories()
  }
  catch (error) {
    categoriesData.value = previous
    throw error
  }
}

async function removeProject (rkey: string, name: string) {
  if (!confirm(`Delete project "${name}"?`)) return
  const previous = projectsData.value
  projectsData.value = projectsData.value.filter(i => i.rkey !== rkey)
  try {
    await $fetch(`/api/admin/projects/${rkey}`, { method: 'DELETE' })
    refreshProjects()
  }
  catch (error) {
    projectsData.value = previous
    throw error
  }
}

/**
 * After a drag-and-drop reorder, persist the new order by writing each
 * project's `order` field to match its array position. Cheap-ish: one PUT per
 * project in the affected category.
 */
async function persistProjectOrder (items: ProjectEntry[]) {
  const orders = new Map(items.map((item, i) => [item.rkey, (i + 1) * 10]))
  projectsData.value = projectsData.value.map(item => {
    const order = orders.get(item.rkey)
    return order === undefined ? item : { ...item, value: { ...item.value, order } }
  })
  await Promise.all(items.map((item, i) => {
    const value = { ...item.value, order: (i + 1) * 10 }
    delete (value as Record<string, unknown>).$type
    return $fetch(`/api/admin/projects/${item.rkey}`, { method: 'PUT', body: value })
  }))
  refreshProjects()
}
</script>

<template>
  <AdminShell title="Projects">
    <div class="flex flex-wrap items-center gap-2 mb-6">
      <NuxtLink
        to="/admin/projects/categories/new"
        class="text-sm bg-accent text-primary px-3 py-1 hover:bg-accent/80 transition-colors"
      >
        New category
      </NuxtLink>
      <NuxtLink
        v-if="categoriesData?.length"
        to="/admin/projects/items/new"
        class="text-sm bg-primary text-background px-3 py-1 hover:bg-primary/90 transition-colors"
      >
        New project
      </NuxtLink>
    </div>

    <p
      v-if="!showSkeleton && !categoriesData?.length"
      class="text-muted text-sm"
    >
      No categories yet. Create a category before adding projects.
    </p>

    <div
      v-if="showSkeleton"
      class="flex flex-col gap-8"
      aria-hidden="true"
    >
      <section
        v-for="i in 3"
        :key="i"
      >
        <header class="flex items-center gap-3 mb-2">
          <h2 class="text-lg">
            <AdminSkeleton class="bg-accent w-40" />
          </h2>
          <span class="text-xs text-muted">
            <AdminSkeleton class="bg-accent w-16" />
          </span>
        </header>
        <AdminSkeletonRows
          variant="card"
          :rows="3"
        />
      </section>
    </div>

    <div
      v-else
      class="flex flex-col gap-8"
    >
      <section
        v-for="bucket in categoryDnD"
        :key="bucket.category.rkey"
      >
        <header class="flex items-center gap-3 mb-2">
          <h2 class="text-lg">
            {{ bucket.category.value.title }}
          </h2>
          <span class="text-xs text-muted">order {{ bucket.category.value.order ?? 100 }}</span>
          <div class="ml-auto flex gap-3 text-sm">
            <NuxtLink
              :to="`/admin/projects/categories/${bucket.category.rkey}`"
              class="text-muted hover:text-primary transition-colors"
            >
              Edit
            </NuxtLink>
            <button
              type="button"
              class="text-muted hover:text-red-500 transition-colors"
              @click="removeCategory(bucket.category.rkey, bucket.category.value.title)"
            >
              Delete
            </button>
          </div>
        </header>

        <AdminProjectDraggable
          :items="bucket.items"
          @reorder="persistProjectOrder"
          @remove="removeProject"
        />
      </section>
    </div>
  </AdminShell>
</template>
