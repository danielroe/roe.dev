import { addPlugin, createResolver, defineNuxtModule, useNuxt } from '@nuxt/kit'
import { withoutLeadingSlash, withoutTrailingSlash } from 'ufo'
import { relative } from 'pathe'

export default defineNuxtModule({
  meta: {
    name: 'prefetch-fix',
  },
  setup () {
    // const nuxt = useNuxt()
    // nuxt.hook('vite:extendConfig', (config, { isClient }) => {
    //   if (!isClient) return
    //   const renderBuiltUrl = config.experimental!.renderBuiltUrl!
    //   const buildDir = withoutLeadingSlash(
    //     withoutTrailingSlash(nuxt.options.app.buildAssetsDir)
    //   )
    //   const r = (filename: string) => './' + relative(buildDir, filename)
    //   config.experimental!.renderBuiltUrl = (path, type) => {
    //     if (type.hostType === 'js' && path.endsWith('css')) {
    //       return {
    //         runtime: `!window.__mounted ? "${r(type.hostId)}" : "./${r(path)}"`,
    //       }
    //     }
    //     return renderBuiltUrl(path, type)
    //   }
    // })

    const { resolve } = createResolver(import.meta.url)
    addPlugin(resolve('./runtime/defer-preload.client'))
  },
})
