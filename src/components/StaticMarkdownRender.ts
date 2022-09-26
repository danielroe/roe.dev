import type { Directive } from 'vue'
import { createElementBlock } from 'vue'

const cache: Record<string, string> = {}
const CacheHTMLDirective: Directive<any, string> = {
  created(el, binding) {
    if (cache[binding.value]) {
      el.innerHTML = cache[binding.value]
    } else if (el.innerHTML && el.innerHTML !== '<!---->') {
      cache[binding.value] = el.innerHTML
    }
  },
}

export default defineComponent({
  props: {
    // eslint-disable-next-line vue/require-default-prop
    cacheKey: String,
    // eslint-disable-next-line vue/require-default-prop
    value: Object,
  },
  setup(props) {
    const key = props.cacheKey || useRoute().fullPath
    const nuxtApp = useNuxtApp()

    const shouldSkipRender = () => !nuxtApp.isIdle || cache[key]

    return () => {
      return withDirectives(
        createElementBlock(
          'div',
          process.client && shouldSkipRender()
            ? { innerHTML: cache[key] || '<!---->' }
            : null,
          process.client && shouldSkipRender()
            ? []
            : [
                h(resolveComponent('LazyContentRendererMarkdown'), {
                  value: props.value,
                }),
              ]
        ),
        [[CacheHTMLDirective, key]]
      )
    }
  },
})
