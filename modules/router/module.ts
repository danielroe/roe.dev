import { statSync } from 'node:fs'
import fsp from 'node:fs/promises'

import { join, relative } from 'pathe'
import {
  genSafeVariableName,
  genArrayFromRaw,
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

const routeMeta: Record<string, Record<string, any>> = {
  '/blog': {
    title: 'Blog',
  },
  '/talks': {
    title: 'Talks',
  },
  '/uses': {
    title: 'Uses',
  },
  '/work': {
    title: 'Work',
  },
}

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

    addTemplate({
      filename: 'routes.mjs',
      async getContents () {
        const files = await readRecursive(resolver.resolve('../../app/pages'))
        const componentNames = Object.fromEntries(
          files.map(f => [f, genSafeVariableName(f)]),
        )
        const routes = files.map(f => {
          const path = withLeadingSlash(
            relative(resolver.resolve('../app/pages'), f).replace(
              /(\/?index)?\.vue$/,
              '',
            ),
          )
          return {
            path: path.includes('[')
              ? `/${path
                .replace(/\[(.*)\]/g, '(?<$1>.+)')
                .replace(/\//g, '\\/')}/`
              : genString(path),
            // component: `defineAsyncComponent(${genDynamicImport(f, {
            //   interopDefault: true,
            // })})`,
            component: componentNames[f],
            meta: JSON.stringify(routeMeta[path] || {}),
          }
        })

        return `
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
