/**
 * Per-platform publishers for AMA threads. Each entry point takes
 * already-resolved post text (mentions swapped, footer appended) plus an
 * optional image and the original question as alt text.
 */
import type { H3Event } from 'h3'
import type { AppBskyEmbedImages, AppBskyFeedPost, AppBskyRichtextFacet } from '@atproto/api'
import { AtpAgent } from '@atproto/api'
import { BlobRef, jsonToLex } from '@atproto/lexicon'
import { createRestAPIClient } from 'masto'
import { parseURL, withProtocol } from 'ufo'
import { BLUESKY_IMAGE_MAX_BYTES } from '#shared/cms/blob'

export interface PublishImage {
  /** Publicly-fetchable URL (typically a PDS blob URL). */
  url: string
  width: number
  height: number
  /** Used by Mastodon, which rejects un-typed uploads. */
  mimeType?: string
}

export interface BlueskyImage {
  blob: unknown
  width: number
  height: number
  size?: number | null
}

export interface ResolvedPost {
  text: string
  /** Bluesky-only: facets covering mentions, hashtags, URLs. */
  facets?: AppBskyRichtextFacet.Main[]
}

// ---------- Bluesky ----------

async function resolveBlueskyPds (handle: string): Promise<string> {
  const resolved = await fetch(`https://bsky.social/xrpc/com.atproto.identity.resolveHandle?handle=${encodeURIComponent(handle)}`)
  if (!resolved.ok) throw new Error(`Failed to resolve Bluesky handle ${handle}: ${resolved.status}`)
  const { did } = await resolved.json() as { did: string }

  const didDoc = await fetch(`https://plc.directory/${encodeURIComponent(did)}`)
  if (!didDoc.ok) throw new Error(`Failed to resolve DID document for ${did}: ${didDoc.status}`)
  const doc = await didDoc.json() as { service?: Array<{ id: string, type: string, serviceEndpoint: string }> }
  const pds = doc.service?.find(s => s.id === '#atproto_pds')?.serviceEndpoint
  if (!pds) throw new Error(`No PDS endpoint found in DID document for ${did}`)
  return pds
}

export async function publishBlueskyThread (
  event: H3Event,
  posts: ResolvedPost[],
  image: BlueskyImage | undefined,
  altText: string,
): Promise<{ url: string }> {
  const config = useRuntimeConfig(event)
  const { identifier } = config.social.networks.bluesky
  const password = config.bluesky.accessToken

  const pdsUrl = await resolveBlueskyPds(identifier)
  const agent = new AtpAgent({ service: pdsUrl })
  await agent.login({ identifier, password })

  let replyTo: Required<AppBskyFeedPost.ReplyRef> | undefined
  const postUrls: string[] = []

  for (let i = 0; i < posts.length; i++) {
    const { text, facets = [] } = posts[i]!
    let embed: AppBskyEmbedImages.Main | undefined

    if (i === 0 && image) {
      if (image.size != null && image.size > BLUESKY_IMAGE_MAX_BYTES) {
        throw createError({
          statusCode: 413,
          statusMessage: `AMA image is ${image.size} bytes; Bluesky embeds must be under ${BLUESKY_IMAGE_MAX_BYTES}. Regenerate the image to compress it.`,
        })
      }
      const blob = jsonToLex(image.blob as never)
      if (!(blob instanceof BlobRef)) {
        throw new Error('AMA image is not a valid blob ref; cannot embed.')
      }

      embed = {
        $type: 'app.bsky.embed.images',
        images: [{
          alt: altText,
          image: blob,
          aspectRatio: {
            $type: 'app.bsky.embed.defs#aspectRatio',
            width: image.width,
            height: image.height,
          },
        }],
      }
    }

    // Resolve handle→DID just before posting (handles can change between
    // author time and publish, and Bluesky stores the DID in the facet).
    const resolvedFacets: AppBskyRichtextFacet.Main[] = await Promise.all(
      facets.map(async facet => {
        const features = await Promise.all(facet.features.map(async f => {
          if (f.$type !== 'app.bsky.richtext.facet#mention') return f
          const mention = f as { $type: string, did: string }
          try {
            const handle = mention.did.replace(/^@/, '')
            const res = await agent.resolveHandle({ handle })
            return { ...f, did: res.data.did }
          }
          catch (err) {
            console.warn(`Failed to resolve handle ${mention.did}:`, err)
            return f
          }
        }))
        return { ...facet, features: features as AppBskyRichtextFacet.Main['features'] }
      }),
    )

    const post = await agent.post({
      text,
      embed: embed as never,
      reply: replyTo,
      facets: resolvedFacets.length ? resolvedFacets : undefined,
    })

    const [_did, , rkey] = post.uri.replace('at://', '').split('/')
    const handle = identifier.includes('.') ? identifier : `${identifier}.bsky.social`
    postUrls.push(`https://bsky.app/profile/${handle}/post/${rkey}`)

    if (i === 0) {
      replyTo = {
        $type: 'app.bsky.feed.post#replyRef',
        root: { uri: post.uri, cid: post.cid },
        parent: { uri: post.uri, cid: post.cid },
      }
    }
    else if (replyTo) {
      replyTo.parent = { uri: post.uri, cid: post.cid }
    }
  }

  return { url: postUrls[0]! }
}

// ---------- Mastodon ----------

function splitIntoChunks (text: string, maxLength: number): string[] {
  if (text.length <= maxLength) return [text]

  const out: string[] = []
  const lines = text.split('\n')
  let current = ''

  for (const line of lines) {
    if ((current + '\n' + line).length > maxLength) {
      if (current.trim()) out.push(current.trim())
      current = ''
      if (line.length > maxLength) {
        // Hard wrap on whitespace as a last resort.
        for (const word of line.split(' ')) {
          if ((current + ' ' + word).length > maxLength) {
            if (current.trim()) out.push(current.trim())
            current = word
          }
          else {
            current = current ? current + ' ' + word : word
          }
        }
      }
      else {
        current = line
      }
    }
    else {
      current = current ? current + '\n' + line : line
    }
  }
  if (current.trim()) out.push(current.trim())
  return out
}

export async function publishMastodon (
  event: H3Event,
  text: string,
  image: PublishImage | undefined,
  altText: string,
): Promise<{ url: string }> {
  const config = useRuntimeConfig(event)
  const { identifier } = config.social.networks.mastodon

  const accessToken = config.mastodon.accessToken
  if (!accessToken) throw new Error('Mastodon access token not configured (NUXT_MASTODON_ACCESS_TOKEN).')

  const [username, domain] = identifier.split('@')
  if (!domain) throw new Error('Invalid Mastodon identifier; expected user@instance.')

  const webfinger = await $fetch<{ aliases?: string[] }>('.well-known/webfinger', {
    baseURL: withProtocol(domain, 'https://'),
    query: { resource: `acct:${identifier}` },
  })
  const { host, protocol } = parseURL(webfinger.aliases?.[0])
  if (!host || !protocol) throw new Error('Failed to discover Mastodon instance via webfinger.')

  const client = createRestAPIClient({ url: withProtocol(host, protocol), accessToken })

  const chunks = splitIntoChunks(text, 2000)
  let inReplyToId: string | undefined
  const urls: string[] = []

  for (let i = 0; i < chunks.length; i++) {
    let mediaIds: string[] = []
    if (i === 0 && image) {
      const mime = image.mimeType || 'image/png'
      const ext = mime.split('/')[1]?.split('+')[0] || 'png'
      const imageBuffer = await fetch(image.url).then(r => r.arrayBuffer())
      const file = new File([imageBuffer], `ama.${ext}`, { type: mime })
      const media = await client.v2.media.create({ file, description: altText })
      mediaIds = [media.id]
    }
    const status = await client.v1.statuses.create({
      status: chunks[i]!,
      mediaIds,
      inReplyToId,
    })
    urls.push(status.url || `https://${domain}/@${username}/${status.id}`)
    inReplyToId = status.id
  }
  return { url: urls[0]! }
}

// ---------- LinkedIn ----------

async function getLinkedInPersonURN (accessToken: string): Promise<string> {
  const profile = await $fetch<{ sub?: string }>('https://api.linkedin.com/v2/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!profile.sub) throw new Error('LinkedIn userinfo missing `sub` field.')
  return `urn:li:person:${profile.sub}`
}

async function uploadImageToLinkedIn (imageUrl: string, accessToken: string, personURN: string): Promise<string> {
  const register = await $fetch<{ value: { asset: string, uploadMechanism: Record<string, { uploadUrl: string }> } }>(
    'https://api.linkedin.com/v2/assets?action=registerUpload',
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
      body: {
        registerUploadRequest: {
          recipes: ['urn:li:digitalmediaRecipe:feedshare-image'],
          owner: personURN,
          serviceRelationships: [{ relationshipType: 'OWNER', identifier: 'urn:li:userGeneratedContent' }],
        },
      },
    },
  )
  const uploadUrl = register.value.uploadMechanism['com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest']!.uploadUrl

  const imageBuffer = await fetch(imageUrl).then(r => r.arrayBuffer())
  const uploadRes = await fetch(uploadUrl, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/octet-stream' },
    body: imageBuffer,
  })
  if (!uploadRes.ok) throw new Error(`LinkedIn image upload failed: ${uploadRes.status} ${await uploadRes.text()}`)

  return register.value.asset
}

export async function publishLinkedIn (
  event: H3Event,
  text: string,
  image: PublishImage | undefined,
  altText: string,
): Promise<{ url: string }> {
  const config = useRuntimeConfig(event)
  const accessToken = config.linkedin.accessToken
  if (!accessToken) throw new Error('LinkedIn access token not configured (NUXT_LINKEDIN_ACCESS_TOKEN).')

  const personURN = await getLinkedInPersonURN(accessToken)

  let shareMediaCategory: 'NONE' | 'IMAGE' = 'NONE'
  let media: unknown[] = []
  if (image) {
    const asset = await uploadImageToLinkedIn(image.url, accessToken, personURN)
    shareMediaCategory = 'IMAGE'
    media = [{ status: 'READY', description: { text: altText }, media: asset, title: { text: altText } }]
  }

  const post = await $fetch<{ id: string }>('https://api.linkedin.com/v2/ugcPosts', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${accessToken}`, 'X-Restli-Protocol-Version': '2.0.0' },
    body: {
      author: personURN,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: { text },
          shareMediaCategory,
          media,
        },
      },
      visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' },
    },
  })

  return { url: `https://www.linkedin.com/feed/update/${post.id}/` }
}
