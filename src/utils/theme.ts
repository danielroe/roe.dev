import { useLocalStorage } from 'vue-use-web'
import { computed, Ref, ref, onMounted, watch } from '@vue/composition-api'
import resolveConfig from 'tailwindcss/resolveConfig'
// @ts-ignore
import tailwindConfig from '../../tailwind.config.js'

const fullConfig = resolveConfig(tailwindConfig)

type Theme = 'dark' | 'light'

let theme: Ref<Theme>

export function useTheme() {
  if (!theme) {
    const { value } = useLocalStorage('theme', ('dark' as unknown) as undefined)
    theme = value
  }

  onMounted(() => {
    watch(() => {
      localStorage.setItem('theme', theme.value)
    })
  })

  function toggleTheme() {
    if (theme.value === 'dark') theme.value = 'light'
    else theme.value = 'dark'
  }

  const themeStyle = computed(() => {
    if (theme.value === 'light') {
      return {
        '--background': fullConfig.theme.colors.gray['200'],
        '--accent': fullConfig.theme.colors.gray['100'],
        '--text-base': fullConfig.theme.colors.gray['800'],
        '--text-muted': fullConfig.theme.colors.gray['700'],
      }
    } else {
      return {
        '--background': fullConfig.theme.colors.gray['800'],
        '--accent': fullConfig.theme.colors.gray['900'],
        '--text-base': fullConfig.theme.colors.white,
        '--text-muted': fullConfig.theme.colors.gray['300'],
      }
    }
  })

  return {
    theme,
    toggleTheme,
    themeStyle,
  }
}
