export const onIdle = (fn: () => any) => {
  let id: number
  onBeforeMount(() => {
    id = requestIdleCallback(fn)
  })
  onBeforeUnmount(() => {
    cancelIdleCallback(id)
  })
}
