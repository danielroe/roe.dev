import { ContentRenderer } from '#components'

export default defineComponent({
  props: {
    collection: { type: String as () => 'page' | 'blog', required: true },
    path: { type: String, required: true },
  },
  async setup (props) {
    if (import.meta.dev) {
      const { data } = await useAsyncData(() =>
        queryCollection(props.collection).path(props.path!).first(),
      )
      return () => h(ContentRenderer, { value: data.value! })
    }
    const value = await queryCollection(props.collection).path(props.path!).first()
    return () => h(ContentRenderer, { value })
  },
})
