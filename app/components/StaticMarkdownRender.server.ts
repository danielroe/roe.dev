import { MDCRenderer } from '#components'
import { blogBodyLoaders } from '#build/markdown/blog/index.mjs'
import { pageBodyLoaders } from '#build/markdown/page/index.mjs'

export default defineComponent({
  props: {
    collection: { type: String as () => 'page' | 'blog', required: true },
    path: { type: String, required: true },
  },
  async setup (props) {
    const slug = props.path.replace(/^\/(?:blog\/)?/, '').replace(/\/$/, '')
    const loaders = props.collection === 'blog' ? blogBodyLoaders : pageBodyLoaders
    const loader = loaders[slug]

    if (!loader) {
      return () => null
    }

    const parsed = await loader()
    return () => h(MDCRenderer, { body: parsed.body, tag: 'div' })
  },
})
