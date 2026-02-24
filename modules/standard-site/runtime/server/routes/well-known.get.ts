import { standardSiteDid, standardSitePublicationRkey } from '#standard-site-did.json'

export default defineEventHandler(event => {
  if (!standardSiteDid) {
    throw createError({ statusCode: 404, message: 'DID not configured' })
  }

  setResponseHeader(event, 'content-type', 'text/plain')
  return `at://${standardSiteDid}/site.standard.publication/${standardSitePublicationRkey}`
})
