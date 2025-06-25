export default defineEventHandler(async () => {
  const { result } = await runTask('dev-to:sync')
  return result
})
