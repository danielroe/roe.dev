import { addVitePlugin, addWebpackPlugin, defineNuxtModule } from 'nuxt/kit'
import { createUnplugin } from 'unplugin'
import { parseURL } from 'ufo'
import MagicString from 'magic-string'

const plugin = createUnplugin(() => {
  const replaced: string[] = []
  return {
    name: 'lazy-hydrate',
    enforce: 'post',
    transformInclude (id) {
      return parseURL(id).pathname.endsWith('.vue')
    },
    transform (code, id) {
      const chunks = code.matchAll(
        /const _hoisted_(?<chunk>\d+)(?<value>[\s\S]*?)(;$|\n(?=const ))/gm,
      )
      const s = new MagicString(code)
      const registeredChunks: Record<string, any> = {}
      for (const chunk of chunks) {
        if (!chunk.groups) continue
        if (chunk.groups.value in registeredChunks) {
          const replacementChunk = registeredChunks[chunk.groups.value]
          s.replace(
            new RegExp(`(?<!const )_hoisted_${chunk.groups.chunk}\\b`, 'g'),
            `_hoisted_${replacementChunk}`,
          )
          replaced.push(chunk.groups.value)
          // console.log('replaced', chunk.groups.value, id)
          // if (chunk.groups.value[chunk.groups.value.length - 1] !== ';') {
          //   console.log({ code, chunk: chunk.groups.chunk })
          // }
          continue
        }
        registeredChunks[chunk.groups.value] = chunk.groups.chunk
      }
      if (s.hasChanged()) {
        return {
          code: s.toString(),
          map: s.generateMap({ includeContent: true, source: id }),
        }
      }
    },
    buildEnd () {
      console.log('Saved', Buffer.from(replaced.join('')).length, 'bytes')
    },
  }
})

export default defineNuxtModule({
  meta: {
    name: 'dedupe-hoisted-nodes',
  },
  setup () {
    addVitePlugin(plugin.vite())
    addWebpackPlugin(plugin.webpack())
  },
})
