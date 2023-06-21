import { h } from 'vue'
import { ContentRendererMarkdown } from '#components'

export default defineComponent({
  props: {
    path: String,
  },
  async setup(props) {
    const value = await queryContent(props.path!).findOne()
    return () => h(ContentRendererMarkdown, { value })
  },
})
