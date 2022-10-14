// const config = useRuntimeConfig()
// const baseURL = `https://cloud.axiom.co/api/v1/datasets/${config.axiom.dataset}/ingest`
export default defineNitroPlugin(() => {
  // if (process.dev) {
  //   return
  // }
  // for (const name of ['log', 'warn', 'error', 'info']) {
  //   const original = console[name]
  //   console[name] = (arg: any, ...args: any[]) => {
  //     $fetch(baseURL, {
  //       method: 'POST',
  //       body: [
  //         { name, message: arg, args, timestamp: new Date().toISOString() },
  //       ],
  //       headers: { Authorization: `Bearer ${config.axiom.accessKey}` },
  //     })
  //     original(...args)
  //   }
  // }
})
