import {} from '@vue/runtime-dom'

import type { VNode } from 'vue'
const NullComponent = defineComponent({})

const recursiveProxy = (
  obj: Record<string, any>,
  depth = 0,
  namespace = ''
) => {
  return new Proxy(obj, {
    get(target, key: string) {
      const val = target[key]
      const newNamespace = [namespace, key].filter(Boolean).join('.')
      console.log(newNamespace)
      return depth < 2 && val && typeof val === 'object'
        ? recursiveProxy(val, depth + 1, newNamespace)
        : val
    },
  })
}
