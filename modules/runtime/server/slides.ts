import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

export default defineCachedEventHandler(async event => {
  const Key = event.path.split('/').pop()
  const config = useRuntimeConfig(event)

  // Configure the S3 client for Cloudflare R2
  const s3Client = new S3Client({
    endpoint: config.cloudflare.s3Url,
    region: 'auto',
    credentials: {
      accessKeyId: config.cloudflare.r2TokenId,
      secretAccessKey: config.cloudflare.r2TokenKey,
    },
  })

  return await getSignedUrl(s3Client, new GetObjectCommand({ Bucket: 'slides', Key }), { expiresIn: 60 * 60 * 24 * 2 })
}, { maxAge: 60 * 60 * 24 })
