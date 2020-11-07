import { Ref, onMounted, watch } from '@nuxtjs/composition-api'
import useLocalStorage from './local-storage'

type Theme = 'dark' | 'light' | undefined

let theme: Ref<Theme>

export function useTheme() {
  if (!theme) theme = useLocalStorage<Theme>('theme', 'dark', true)

  onMounted(() => {
    watch(theme, () => localStorage.setItem('theme', theme.value || 'dark'))
  })

  function toggleTheme() {
    if (!theme.value || theme.value === 'dark') theme.value = 'light'
    else theme.value = 'dark'
  }

  return {
    theme,
    toggleTheme,
  }
}
