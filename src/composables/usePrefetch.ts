export const usePrefetch = (fn: () => any) => {
  let id: number
  onBeforeMount(() => {
    id = requestIdleCallback(fn)
  })
  onBeforeUnmount(() => {
    cancelIdleCallback(id)
  })
}
