import { publicationRkey } from '../../../../shared/tid'

export default defineEventHandler(event => {
  const { atproto } = useRuntimeConfig()
  if (!atproto.did) {
    throw createError({ status: 404, message: 'DID not configured' })
  }

  setResponseHeader(event, 'content-type', 'text/plain')
  return `at://${atproto.did}/site.standard.publication/${publicationRkey}`
})
