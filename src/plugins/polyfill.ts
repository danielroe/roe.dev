globalThis.requestIdleCallback = process.client
  ? window.requestIdleCallback ||
    function (cb) {
      const start = Date.now()
      const idleDeadline = {
        didTimeout: false,
        timeRemaining() {
          return Math.max(0, 50 - (Date.now() - start))
        },
      }
      return window.setTimeout(function () {
        cb(idleDeadline)
      }, 1)
    }
  : ((() => {}) as any)

globalThis.cancelIdleCallback = process.client
  ? window.cancelIdleCallback ||
    function (id) {
      clearTimeout(id)
    }
  : () => {}

export default () => {}
