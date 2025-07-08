export default defineEventHandler(async () => {
  const { result } = await runTask('sync')
  return result
})
