import { h } from 'vue'
import { ContentRendererMarkdown } from '#components'

export default defineComponent({
  props: {
    value: Object,
  },
  setup(props) {
    return () => h(ContentRendererMarkdown, { value: props.value })
  },
})
