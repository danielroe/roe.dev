import { useLocalStorage } from 'vue-use-web'
import { computed, Ref, onMounted, watch } from '@vue/composition-api'
import resolveConfig from 'tailwindcss/resolveConfig'
// @ts-ignore
import tailwindConfig from '../../tailwind.config.js'

const {
  theme: { colors },
} = resolveConfig(tailwindConfig)

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
        '--background': colors.gray['200'],
        '--accent': colors.gray['100'],
        '--text-base': colors.gray['800'],
        '--text-muted': colors.gray['700'],
      }
    } else {
      return {
        '--background': colors.gray['800'],
        '--accent': colors.gray['900'],
        '--text-base': colors.white,
        '--text-muted': colors.gray['300'],
      }
    }
  })

  return {
    theme,
    toggleTheme,
    themeStyle,
  }
}
