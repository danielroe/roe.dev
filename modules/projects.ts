import { readFile } from 'node:fs/promises'

import { addTemplate, addTypeTemplate, defineNuxtModule, useNuxt } from 'nuxt/kit'
import { resolve } from 'pathe'
import yaml from 'js-yaml'

export interface ProjectItem {
  name: string
  description?: string
  url?: string
  repo?: string
  image?: string
  icon?: string
  archived?: boolean
  order?: number
}

export interface ProjectCategory {
  category: string
  order?: number
  items: ProjectItem[]
}

export default defineNuxtModule({
  meta: {
    name: 'projects',
  },
  async setup () {
    const nuxt = useNuxt()
    const filePath = resolve(nuxt.options.rootDir, 'content/projects.yml')

    let categories: ProjectCategory[] = []
    try {
      const raw = await readFile(filePath, 'utf-8')
      const parsed = yaml.load(raw) as ProjectCategory[] | null
      categories = Array.isArray(parsed) ? parsed : []
    }
    catch (err: unknown) {
      if ((err as NodeJS.ErrnoException)?.code !== 'ENOENT') throw err
    }

    categories = categories
      .map(c => ({
        ...c,
        items: [...(c.items || [])].sort(
          (a, b) => (a.order ?? 100) - (b.order ?? 100),
        ),
      }))
      .sort((a, b) => (a.order ?? 100) - (b.order ?? 100))

    addTemplate({
      filename: 'projects.mjs',
      getContents: () => `export const projects = ${JSON.stringify(categories)}`,
      write: true,
    })

    nuxt.options.nitro.virtual ||= {}
    nuxt.options.nitro.virtual['#projects.json'] = () =>
      `export const projects = ${JSON.stringify(categories)}`

    nuxt.options.nitro.externals ||= {}
    nuxt.options.nitro.externals.inline ||= []
    nuxt.options.nitro.externals.inline.push('#projects.json')

    addTypeTemplate({
      filename: 'types/projects.d.ts',
      getContents: () => `
interface ProjectItem {
  name: string
  description?: string
  url?: string
  repo?: string
  image?: string
  icon?: string
  archived?: boolean
  order?: number
}
interface ProjectCategory {
  category: string
  order?: number
  items: ProjectItem[]
}

declare module '#build/projects.mjs' {
  export const projects: ProjectCategory[]
}

declare module '#projects.json' {
  export const projects: ProjectCategory[]
}
`,
    }, { nuxt: true, nitro: true })
  },
})
