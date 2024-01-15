import { h } from 'vue'
import { ContentRendererMarkdown } from '#components'

export default defineComponent({
  props: {
    path: String,
  },
  async setup(props) {
    if (import.meta.dev) {
      const { data } = await useAsyncData(() =>
        queryContent(props.path!).findOne()
      )
      return () => h(ContentRendererMarkdown, { value: data.value! })
    }
    const value = await queryContent(props.path!).findOne()
    return () => h(ContentRendererMarkdown, { value })
  },
})
