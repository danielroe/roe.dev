export const requestIdleCallback =
  globalThis.requestIdleCallback ||
  function (cb) {
    const start = Date.now()
    const idleDeadline = {
      didTimeout: false,
      timeRemaining() {
        return Math.max(0, 50 - (Date.now() - start))
      },
    }
    return setTimeout(function () {
      cb(idleDeadline)
    }, 1)
  }

export const cancelIdleCallback =
  globalThis.cancelIdleCallback ||
  function (id) {
    clearTimeout(id)
  }

export const onIdle = (fn: () => any) => {
  let id: number
  onBeforeMount(() => {
    id = requestIdleCallback(fn)
  })
  onBeforeUnmount(() => {
    cancelIdleCallback(id)
  })
}
