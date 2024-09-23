export default defineNuxtPlugin(() => {
  onPrehydrate(() => {
    const cal = Object.assign(
      function (...args: unknown[]) {
        cal.q.push(args)
      },
      {
        ns: {},
        q: [] as unknown[][],
        loaded: false,
      },
    )
    window.Cal = cal
  })

  const $script = useScript('https://app.cal.com/embed/embed.js', {
    trigger: 'manual',
  })
  $script.onLoaded(() => {
    window.Cal.loaded = true
    window.Cal('init', {
      origin: 'https://app.cal.com',
    })
    window.Cal('ui', {
      cssVarsPerTheme: {
        light: {
          'cal-bg-muted': '#e5e7eb',
          'cal-bg-emphasis': '#f3f4f6',
        },
        dark: {
          'cal-bg-muted': '#1f2937',
          'cal-bg-emphasis': '#374151',
        },
      },
      hideEventTypeDetails: false,
      layout: 'month_view',
    })
  })
  useRouter().beforeEach(to => {
    if (to.path === '/blog/open-invitation' || to.path === '/blog/funding') {
      $script.load()
    }
  })
})

declare global {
  interface Window {
    Cal: ((...args: unknown[]) => void) & {
      loaded: boolean
      q: unknown[][]
    }
  }
}
