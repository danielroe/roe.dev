export default defineEventHandler(async event => {
  // try to work around missing env variables on cloudflare workers
  useRuntimeConfig(event)
})
