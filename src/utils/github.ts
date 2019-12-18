import { computed } from '@vue/composition-api'
import { useFetch } from 'vue-use-web'

export function useGithub(repo: string) {
  const { json } = useFetch(`https://api.github.com/repos/${repo}`, {})

  const stars = computed(() => json.value && json.value.stargazers_count)
  const language = computed(() => json.value && json.value.language)

  return { stars, language }
}
