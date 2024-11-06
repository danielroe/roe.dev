import crypto from 'node:crypto'
import { addServerHandler, createResolver, defineNuxtModule, updateRuntimeConfig, useRuntimeConfig } from 'nuxt/kit'
import { $fetch } from 'ofetch'
import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3'

export default defineNuxtModule({
  meta: {
    name: 'slides',
  },
  async setup () {
    const config = useRuntimeConfig()
    const resolver = createResolver(import.meta.url)

    if (!config.github.token) return

    const $gh = $fetch.create({
      baseURL: 'https://api.github.com/repos/danielroe/slides/releases',
      headers: {
        Authorization: `token ${config.github.token}`,
      },
    })

    config.cloudflare.r2TokenKey = crypto.createHash('sha256').update(config.cloudflare.r2TokenKey).digest('hex')

    updateRuntimeConfig({
      cloudflare: config.cloudflare,
    })

    // Configure the S3 client for Cloudflare R2
    const s3Client = new S3Client({
      endpoint: config.cloudflare.s3Url,
      region: 'auto',
      credentials: {
        accessKeyId: config.cloudflare.r2TokenId,
        // Hash the secret access key
        secretAccessKey: config.cloudflare.r2TokenKey,
      },
    })

    const talks = await import('../app/data/talks.json').then(r => r.default)

    const Bucket = 'slides'
    for (const talk of talks) {
      if (!talk.release) continue

      const Key = `${talk.release}.pdf`

      const headResponse = await s3Client.send(new HeadObjectCommand({ Bucket, Key })).catch(() => null)
      if (!headResponse) {
        const release = await $gh<GitHubRelease>(`/tags/${talk.release}`)
        const id = release?.assets.find(a => a.name.endsWith('.pdf'))?.id

        if (!id) continue

        const file = await $gh(`/assets/${id}`, {
          responseType: 'arrayBuffer',
          headers: { Accept: 'application/octet-stream' },
        })

        // Upload file to Cloudflare R2
        await s3Client.send(new PutObjectCommand({ Bucket, Key, Body: Buffer.from(file) }))
      }

      // add handler for this endpoint
      addServerHandler({
        handler: resolver.resolve('./runtime/server/slides'),
        route: `/slides/${Key}`,
      })
    }
  },
})

interface GitHubRelease {
  assets: Array<{ id: number, name: string }>
}

/**

// How to obtain a Cloudflare R2 token with the necessary permissions

await $fetch(`https://api.cloudflare.com/client/v4/user/tokens`, {
  method: 'post',
  headers: {
    authorization: `Bearer ${'<token with permission to create tokens>'}`,
  },
  body: {
    name: 'r2 upload token',
    policies: [
      {
        effect: 'allow',
        resources: {
          [`com.cloudflare.edge.r2.bucket.${config.accountId}_default_slides`]: '*',
        },
        permission_groups: [
          {
            id: '2efd5506f9c8494dacb1fa10a3e7d5b6',
            name: 'Workers R2 Storage Bucket Item Write',
          },
        ],
      },
    ],
  },
})

*/
