export default defineEventHandler(async event => {
  // try to work around missing env variables on cloudflare workers
  console.log('runtime config 1', useRuntimeConfig(event))
  console.log('runtime config 2', useRuntimeConfig())
  console.log('runtime config 3', useRuntimeConfig(event))
  console.log('env', event.context)
})
