import { statSync } from 'node:fs'
import fsp from 'node:fs/promises'

import { join, relative } from 'pathe'
import { genArrayFromRaw, genDynamicImport, genString } from 'knitwork'
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
  setup() {
    const nuxt = useNuxt()
    const resolver = createResolver(import.meta.url)
    nuxt.options.pages = false

    nuxt.hook('app:templates', app => {
      const routerTemplate = app.templates.find(
        t => t.filename === 'vue-router.d.ts'
      )
      routerTemplate!.getContents = () => 'export * from "vue-router"'
    })

    addImports({
      name: 'definePageMeta',
      from: resolver.resolve('./runtime/define-page-meta'),
      priority: 20,
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
      async getContents() {
        const files = await readRecursive(resolver.resolve('../pages'))
        return `
        import { defineAsyncComponent } from 'vue';
        export default ${genArrayFromRaw(
          files.map(f => {
            const path = withLeadingSlash(
              relative(resolver.resolve('../pages'), f).replace(
                /(\/?index)?\.vue$/,
                ''
              )
            )
            return {
              path: path.includes('[')
                ? `/${path
                    .replace(/\[(.*)\]/g, '(?<$1>.+)')
                    .replace(/\//g, '\\/')}/`
                : genString(path),
              component: `defineAsyncComponent(${genDynamicImport(f, {
                interopDefault: true,
              })})`,
              meta: JSON.stringify(routeMeta[path] || {}),
            }
          })
        )}`
      },
    })
  },
})

async function readRecursive(dir: string) {
  const files = await fsp.readdir(dir)
  const result: string[] = []
  for (const file of files) {
    const path = join(dir, file)
    if (statSync(path).isDirectory()) {
      result.push(...(await readRecursive(path)))
    } else {
      result.push(path)
    }
  }
  return result
}
