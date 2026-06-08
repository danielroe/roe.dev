import { statSync } from 'node:fs'
import fsp from 'node:fs/promises'

import { join, relative } from 'pathe'
import {
  genSafeVariableName,
  genArrayFromRaw,
  genDynamicImport,
  genString,
  genImport,
} from 'knitwork'
import {
  addComponent,
  addImports,
  addTemplate,
  addRouteMiddleware,
  createResolver,
  defineNuxtModule,
  useNuxt,
} from 'nuxt/kit'
import { withLeadingSlash } from 'ufo'

import { pageMeta } from '../shared/page-meta'

export default defineNuxtModule({
  meta: {
    name: 'custom-router',
  },
  setup () {
    const nuxt = useNuxt()
    const resolver = createResolver(import.meta.url)
    nuxt.options.pages = false

    addImports({
      name: 'definePageMeta',
      from: resolver.resolve('./runtime/route-composables'),
      priority: 20,
    })

    addImports({
      name: 'useRoute',
      from: resolver.resolve('./runtime/route-composables'),
      priority: 20,
    })

    addImports({
      name: 'handleNavigationClicks',
      from: resolver.resolve('./runtime/route-composables'),
    })

    addComponent({
      filePath: resolver.resolve('./runtime/nuxt-link'),
      name: 'NuxtLink',
      priority: 20,
    })

    addComponent({
      filePath: resolver.resolve('./runtime/NuxtPage.vue'),
      name: 'NuxtPage',
      priority: 20,
    })

    addRouteMiddleware({
      name: 'path-params',
      global: true,
      path: resolver.resolve('./runtime/path.global.ts'),
    })

    const pagesDir = resolver.resolve('../../app/pages')
    const isAdminFile = (f: string) =>
      relative(pagesDir, f).split('/')[0] === 'admin'

    addTemplate({
      filename: 'routes.mjs',
      write: true,
      async getContents () {
        const files = await readRecursive(pagesDir)
        const staticImports = files.filter(f => !isAdminFile(f))
        const componentNames = Object.fromEntries(
          staticImports.map(f => [f, genSafeVariableName(f)]),
        )
        const routes = files.map(f => {
          const path = withLeadingSlash(
            relative(pagesDir, f).replace(
              /(\/?index)?\.vue$/,
              '',
            ),
          )
          const isDynamic = path.includes('[')
          return {
            path: isDynamic
              ? `/${path
                .replace(/\[(.*)\]/g, '(?<$1>.+)')
                .replace(/\//g, '\\/')}/`
              : genString(path),
            component: isAdminFile(f)
              ? `defineAsyncComponent(${genDynamicImport(f, { interopDefault: true })})`
              : componentNames[f],
            meta: JSON.stringify(pageMeta[path] || {}),
            _isDynamic: isDynamic,
          }
        })
          .sort((a, b) => Number(a._isDynamic) - Number(b._isDynamic))
          .map(({ _isDynamic, ...rest }) => rest)

        return `
        import { defineAsyncComponent } from 'vue'
        ${Object.entries(componentNames).map(([path, name]) => genImport(path, { name })).join('\n')}
        export default ${genArrayFromRaw(routes)}`
      },
    })
  },
})

async function readRecursive (dir: string) {
  const files = await fsp.readdir(dir)
  const result: string[] = []
  for (const file of files) {
    const path = join(dir, file)
    if (statSync(path).isDirectory()) {
      result.push(...(await readRecursive(path)))
    }
    else {
      result.push(path)
    }
  }
  return result
}
