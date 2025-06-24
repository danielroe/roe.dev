<template>
  <dl
    v-if="data"
    class="block md:flex flex-row flex-wrap leading-normal uppercase text-xs"
  >
    <template v-if="data.language">
      <dt class="float-left md:float-none mr-2 text-muted">
        Language
      </dt>
      <dd class="mr-4 flex items-center gap-1">
        <span
          class="w-2 h-2 rounded-full"
          :style="{ backgroundColor: getLanguageColor(data.language) }"
        />
        {{ data.language }}
      </dd>
    </template>
    <template v-if="data.stars !== undefined">
      <dt class="float-left md:float-none mr-2 text-muted">
        Stars
      </dt>
      <dd class="mr-4">
        {{ data.stars.toLocaleString() }}
      </dd>
    </template>
  </dl>
</template>

<script setup lang="ts">
interface Props {
  owner?: string
  repo?: string
}

interface GitHubData {
  stars: number
  language: string
}

const props = defineProps<Props>()

const { data } = await useFetch<GitHubData>(`/api/github/repo/${props.owner}/${props.repo}`, {
  key: `github-${props.owner}-${props.repo}`,
  default: () => ({ stars: 0, language: '' }),
  server: false, // Only fetch on client side
})

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
