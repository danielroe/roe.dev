import { randomUUID } from 'node:crypto'
import { createError, getHeader, readRawBody } from 'h3'
import type { H3Event } from 'h3'
import type { AppBskyEmbedImages, AppBskyFeedPost, AppBskyRichtextFacet } from '@atproto/api'
import { AtpAgent } from '@atproto/api'
import { createRestAPIClient } from 'masto'
import { isValidSignature, SIGNATURE_HEADER_NAME } from '@sanity/webhook'
import type { PortableTextBlock } from '@portabletext/types'

import { parseURL, withProtocol } from 'ufo'
import { resolveTextForPlatform, resolveTextWithFacets } from '../utils/sanity/blocks'

interface AMADocument {
  _id: string
  _rev: string
  content: string
  posts: Array<{ content: PortableTextBlock[] }>
  publishStatus: string
  platforms: {
    bluesky?: boolean
    linkedin?: boolean
    mastodon?: boolean
  }
  image?: {
    url: string
    dimensions: {
      width: number
      height: number
    }
  }
  lastWebhookEvent?: {
    timestamp: string
    signature: string
  }
}

interface WebhookPayload {
  _id: string
  _rev: string
  publishStatus: string
  [key: string]: any
}

interface PublishResult {
  platform: string
  success: boolean
  url?: string
  error?: string
}

/**
 * Check if this webhook event has already been processed
 */
function isWebhookEventProcessed (document: AMADocument, signature: string, timestamp: string): boolean {
  if (import.meta.dev) {
    return false
  }

  if (!document.lastWebhookEvent) {
    return false
  }

  // Check if the signature matches (same event)
  if (document.lastWebhookEvent.signature === signature) {
    return true
  }

  // Check if this event is older than the last processed event (prevent replay attacks)
  const lastEventTime = new Date(document.lastWebhookEvent.timestamp).getTime()
  const currentEventTime = new Date(timestamp).getTime()

  return currentEventTime <= lastEventTime
}

export default defineEventHandler(async event => {
  const config = useRuntimeConfig(event)
  const timestamp = new Date().toISOString()

  // Get the raw body as string for signature verification
  const rawBody = await readRawBody(event, 'utf8')
  console.log('Received webhook payload:', rawBody)

  // Verify webhook signature using Sanity's official library
  const signature = getHeader(event, SIGNATURE_HEADER_NAME)
  const webhookSecret = config.sanity.webhookToken

  if (!webhookSecret) {
    console.error('SANITY_WEBHOOK_SECRET environment variable not set')
    throw createError({
      statusCode: 500,
      statusMessage: 'Webhook secret not configured',
    })
  }

  if (!signature || !(await isValidSignature(rawBody || '', signature, webhookSecret))) {
    console.error('Invalid webhook signature')
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
    })
  }

  const body: WebhookPayload = JSON.parse(rawBody || '{}')

  // Validate webhook payload
  if (!body._id || !body._rev || body.publishStatus !== 'ready') {
    console.log('Webhook ignored: Invalid payload or not ready to publish', {
      id: body._id,
      rev: body._rev,
      status: body.publishStatus,
    })
    return { success: false, message: 'Invalid payload or not ready to publish' }
  }

  const sanity = useSanity(event)

  try {
    const document = await sanity.client.fetch<AMADocument>(
      `*[_id == $id][0]{
        _id,
        _rev,
        content,
        posts[]{
          content[]{
            ...,
            markDefs[]{
              ...,
              _type == "entityMention" => {
                ...,
                entity->{
                  _id,
                  name,
                  socialHandles
                }
              }
            }
          }
        },
        publishStatus,
        platforms,
        "image": generatedImage.asset-> {
          url,
          "dimensions": metadata.dimensions
        },
        lastWebhookEvent
      }`,
      { id: body._id },
    )

    if (!document) {
      throw new Error('Document not found')
    }

    // Check for idempotency - prevent duplicate processing of the same webhook event
    if (isWebhookEventProcessed(document, signature, timestamp)) {
      console.log('Webhook ignored: Event already processed', {
        id: body._id,
        signature: signature.substring(0, 16) + '...',
        lastEvent: document.lastWebhookEvent?.timestamp,
      })
      return {
        success: true,
        message: 'Event already processed',
        status: document.publishStatus,
      }
    }

    if (!document.posts || document.posts.length === 0) {
      throw new Error('No posts found for publishing')
    }

    // Publish to platforms
    const results = await publishToPlatforms(event, document)

    const publishedLinks: Record<string, string> = {}
    results.forEach(result => {
      if (result.success && result.url) {
        publishedLinks[result.platform] = result.url
      }
    })

    const publishLog = results.map(result => ({
      _type: 'object',
      _key: randomUUID(),
      timestamp: new Date().toISOString(),
      platform: result.platform,
      status: result.success ? 'success' : 'error',
      message: result.success ? `Published: ${result.url}` : result.error,
    }))

    const finalStatus = results.some(r => r.success) ? 'success' : 'failed'
    await sanity.client
      .patch(document._id)
      .set({
        publishStatus: finalStatus,
        publishedLinks,
        publishLog,
        lastWebhookEvent: { timestamp, signature },
      })
      .commit()

    return null
  }
  catch (error) {
    console.error('Failed to publish AMA:', error)

    await sanity.client
      .patch(body._id)
      .set({
        publishStatus: 'failed',
        publishLog: [{
          _type: 'object',
          _key: randomUUID(),
          timestamp: new Date().toISOString(),
          platform: 'system',
          status: 'error',
          message: String(error),
        }],
        lastWebhookEvent: { timestamp, signature },
      })
      .commit()

    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to publish AMA',
    })
  }
})

async function publishToLinkedIn (event: H3Event, text: string, image: AMADocument['image'], altText: string): Promise<{ url: string }> {
  // Get LinkedIn access token from environment variable
  const config = useRuntimeConfig(event)
  const accessToken = config.linkedin.accessToken
  if (!accessToken) {
    throw new Error('LinkedIn access token not configured. Set NUXT_LINKEDIN_ACCESS_TOKEN environment variable.')
  }

  // Get person URN (LinkedIn user ID)
  const personURN = await getLinkedInPersonURN(accessToken)

  let shareMediaCategory = 'NONE'
  let media: any[] = []

  // Handle image upload if provided
  if (image?.url) {
    const uploadedImageURN = await uploadImageToLinkedIn(image.url, accessToken, personURN, altText)
    shareMediaCategory = 'IMAGE'
    media = [
      {
        status: 'READY',
        description: {
          text: altText,
        },
        media: uploadedImageURN,
        title: {
          text: 'AMA Post',
        },
      },
    ]
  }

  // Create the post
  const postData = {
    author: personURN,
    lifecycleState: 'PUBLISHED',
    specificContent: {
      'com.linkedin.ugc.ShareContent': {
        shareCommentary: {
          text,
        },
        shareMediaCategory,
        media,
      },
    },
    visibility: {
      'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
    },
  }

  const response = await fetch('https://api.linkedin.com/v2/ugcPosts', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'X-Restli-Protocol-Version': '2.0.0',
    },
    body: JSON.stringify(postData),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`LinkedIn API error: ${response.status} ${response.statusText} - ${errorText}`)
  }

  const result = await response.json()
  const postId = result.id

  // Extract the activity ID from the URN format
  const activityId = postId.split(':').pop()

  // Construct the post URL using the LinkedIn identifier from config
  const identifier = config.social?.networks?.linkedin?.identifier || 'daniel-roe'
  const url = `https://www.linkedin.com/posts/${identifier}_${activityId}`

  return { url }
}

/**
 * Get the LinkedIn person URN for the authenticated user
 */
async function getLinkedInPersonURN (accessToken: string): Promise<string> {
  const response = await fetch('https://api.linkedin.com/v2/userinfo', {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`LinkedIn profile API error: ${response.status} ${response.statusText} - ${errorText}`)
  }

  const profile = await response.json()

  if (!profile.sub) {
    throw new Error('LinkedIn profile API error: "sub" field (user ID) not found in /v2/userinfo response.')
  }
  return `urn:li:person:${profile.sub}`
}

/**
 * Upload an image to LinkedIn and return the media URN
 */
async function uploadImageToLinkedIn (imageUrl: string, accessToken: string, personURN: string, _altText: string): Promise<string> {
  // First, register the upload
  const registerUploadData = {
    registerUploadRequest: {
      recipes: ['urn:li:digitalmediaRecipe:feedshare-image'],
      owner: personURN,
      serviceRelationships: [
        {
          relationshipType: 'OWNER',
          identifier: 'urn:li:userGeneratedContent',
        },
      ],
    },
  }

  const registerResponse = await fetch('https://api.linkedin.com/v2/assets?action=registerUpload', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(registerUploadData),
  })

  if (!registerResponse.ok) {
    const errorText = await registerResponse.text()
    throw new Error(`LinkedIn upload registration error: ${registerResponse.status} ${registerResponse.statusText} - ${errorText}`)
  }

  const registerResult = await registerResponse.json()
  const uploadUrl = registerResult.value.uploadMechanism['com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest'].uploadUrl
  const asset = registerResult.value.asset

  // Download the image
  const imageResponse = await fetch(imageUrl)
  const imageBuffer = await imageResponse.arrayBuffer()

  // Upload the image
  const uploadResponse = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/octet-stream',
    },
    body: imageBuffer,
  })

  if (!uploadResponse.ok) {
    const errorText = await uploadResponse.text()
    throw new Error(`LinkedIn image upload error: ${uploadResponse.status} ${uploadResponse.statusText} - ${errorText}`)
  }

  return asset
}

async function publishToMastodon (event: H3Event, text: string, image: AMADocument['image'], altText: string): Promise<{ url: string }> {
  const config = useRuntimeConfig(event)
  const { identifier } = config.social.networks.mastodon

  const accessToken = config.mastodon.accessToken
  if (!accessToken) {
    throw new Error('Mastodon access token not configured. Set NUXT_MASTODON_ACCESS_TOKEN environment variable.')
  }

  // Parse mastodon identifier (e.g., "daniel@roe.dev")
  const [username, domain] = identifier.split('@')

  const data = await $fetch<{ subject: string, aliases: string[] }>('.well-known/webfinger', {
    baseURL: withProtocol(domain, 'https://'),
    query: {
      resource: `acct:${identifier}`,
    },
  })
  const { host, protocol } = parseURL(data.aliases[0])

  if (!host || !protocol) {
    throw new Error('Invalid Mastodon identifier')
  }

  const client = createRestAPIClient({
    url: withProtocol(host!, protocol!),
    accessToken,
  })
  console.log({
    url: `https://${domain}`,
    accessToken,
  })

  const threads = splitIntoThreads(text, 2000)
  const statusUrls: string[] = []
  let inReplyToId: string | undefined

  console.log('Publishing threads:', threads)

  for (let i = 0; i < threads.length; i++) {
    const threadText = threads[i]
    let mediaIds: string[] = []

    // Only add image to the first post
    if (i === 0 && image?.url) {
      // Upload image to Mastodon
      const imageResponse = await fetch(image.url + '?fm=jpg')
      const imageBlob = await imageResponse.blob()

      try {
        const mediaAttachment = await client.v2.media.create({
          file: imageBlob,
          description: altText,
        })

        console.log('mediaAttachment', mediaAttachment)

        mediaIds = [mediaAttachment.id]
      }
      catch (e) {
        console.log(e)
        throw e
      }
    }

    console.log({
      status: threadText,
      mediaIds,
      inReplyToId,
    })

    const status = await client.v1.statuses.create({
      status: threadText,
      mediaIds,
      inReplyToId,
    })
    console.log('Mastodon status created:', status)

    const url = status.url || `https://${domain}/@${username}/${status.id}`
    statusUrls.push(url)

    // Set up reply context for subsequent posts
    inReplyToId = status.id
  }

  // Return the first post URL as the main URL
  return { url: statusUrls[0] }
}

async function processManualThreads (posts: Array<{ content: PortableTextBlock[] }>): Promise<Array<{ text: string, facets: AppBskyRichtextFacet.Main[] }>> {
  const threads: Array<{ text: string, facets: AppBskyRichtextFacet.Main[] }> = []
  const footerText = '\n\nroe.dev/ama\n\n#ama' // Define footer text once

  for (let i = 0; i < posts.length; i++) {
    const post = posts[i]
    let combinedFacets: AppBskyRichtextFacet.Main[] = []
    let finalText = ''

    if (i === 0) {
      // For the first post, include the footer
      const { text: baseText, facets: baseFacets } = resolveTextWithFacets(post.content, footerText)
      finalText = baseText
      combinedFacets = baseFacets
    }
    else {
      // For subsequent posts, do not include the footer
      const { text: baseText, facets: baseFacets } = resolveTextWithFacets(post.content)
      finalText = baseText
      combinedFacets = baseFacets
    }

    threads.push({ text: finalText, facets: combinedFacets })
  }

  return threads
}

async function publishToPlatforms (event: H3Event, document: AMADocument): Promise<PublishResult[]> {
  const results: PublishResult[] = []

  // Publish to Bluesky with manual threading
  if (document.platforms?.bluesky !== false) {
    try {
      const blueskyThreads = await processManualThreads(document.posts)
      const blueskyResult = await publishToBlueskyThreads(event, blueskyThreads, document.image, document.content)
      results.push({ platform: 'bluesky', success: true, url: blueskyResult.url })
    }
    catch (error) {
      results.push({ platform: 'bluesky', success: false, error: String(error) })
    }
  }

  // Publish to other platforms without threading
  if (document.platforms?.mastodon !== false) {
    try {
      const mastodonText = resolveTextForPlatform(document.posts.flatMap(p => p.content), 'mastodon')
      const mastodonFullText = `${mastodonText}\n\nhttps://roe.dev/ama\n\n#ama`
      const mastodonResult = await publishToMastodon(event, mastodonFullText, document.image, document.content)
      results.push({ platform: 'mastodon', success: true, url: mastodonResult.url })
    }
    catch (error) {
      results.push({ platform: 'mastodon', success: false, error: String(error) })
    }
  }

  if (document.platforms?.linkedin !== false) {
    try {
      const linkedinText = resolveTextForPlatform(document.posts.flatMap(p => p.content), 'linkedin')
      const linkedinFullText = `${linkedinText}\n\nroe.dev/ama\n\n#ama`
      const linkedinResult = await publishToLinkedIn(event, linkedinFullText, document.image, document.content)
      results.push({ platform: 'linkedin', success: true, url: linkedinResult.url })
    }
    catch (error) {
      results.push({ platform: 'linkedin', success: false, error: String(error) })
    }
  }

  return results
}

async function publishToBlueskyThreads (event: H3Event, threads: Array<{ text: string, facets: AppBskyRichtextFacet.Main[] }>, image: AMADocument['image'], altText: string): Promise<{ url: string }> {
  const config = useRuntimeConfig(event)
  const { identifier } = config.social.networks.bluesky
  const password = config.bluesky.accessToken

  const agent = new AtpAgent({ service: 'https://bsky.social' })
  await agent.login({ identifier, password })

  const postUrls: string[] = []
  let replyTo: Required<AppBskyFeedPost.ReplyRef> | undefined

  for (let i = 0; i < threads.length; i++) {
    const { text: threadText, facets } = threads[i]
    let embed: Required<AppBskyEmbedImages.Main>

    // Only add image to the first post
    if (i === 0 && image) {
      const imageResponse = await fetch(image.url + '?fm=jpg')
      const imageBuffer = await imageResponse.arrayBuffer()
      const uploadResult = await agent.uploadBlob(new Uint8Array(imageBuffer), {
        encoding: 'image/png',
      })

      embed = {
        $type: 'app.bsky.embed.images',
        images: [{
          alt: altText,
          image: uploadResult.data.blob,
          aspectRatio: {
            $type: 'app.bsky.embed.defs#aspectRatio',
            width: image.dimensions.width,
            height: image.dimensions.height,
          },
        }],
      }
    }

    // Resolve handles to DIDs in facets
    const resolvedFacets = await Promise.all(
      facets.map(async facet => {
        const updatedFeatures = await Promise.all(
          facet.features.map(async _feature => {
            if (_feature.$type === 'app.bsky.richtext.facet#mention') {
              const feature = _feature as Required<AppBskyRichtextFacet.Mention>
              try {
                const handleWithoutAt = feature.did.replace('@', '')
                const response = await agent.resolveHandle({ handle: handleWithoutAt })
                return {
                  ...feature,
                  did: response.data.did,
                }
              }
              catch (error) {
                console.warn(`Failed to resolve handle ${feature.did}:`, error)
                return feature
              }
            }
            return _feature as Required<AppBskyRichtextFacet.Main>
          }),
        )
        return {
          ...facet,
          features: updatedFeatures,
        }
      }),
    )

    const post = await agent.post({
      text: threadText,
      embed: embed!,
      reply: replyTo,
      facets: resolvedFacets.length > 0 ? resolvedFacets : undefined,
    })

    const postUri = post.uri.replace('at://', '')
    const [_did, , rkey] = postUri.split('/')
    const handle = identifier.includes('.') ? identifier : `${identifier}.bsky.social`
    const url = `https://bsky.app/profile/${handle}/post/${rkey}`

    postUrls.push(url)

    // Set up reply context for subsequent posts
    if (i === 0) {
      replyTo = {
        $type: 'app.bsky.feed.post#replyRef',
        root: { uri: post.uri, cid: post.cid },
        parent: { uri: post.uri, cid: post.cid },
      }
    }
    else {
      replyTo!.parent = {
        uri: post.uri, cid: post.cid,
      }
    }
  }

  return { url: postUrls[0] }
}

function splitIntoThreads (text: string, maxLength: number): string[] {
  // If text fits in one post, return as-is
  if (text.length <= maxLength) {
    return [text]
  }

  const threads: string[] = []
  const lines = text.split('\n')
  let currentThread = ''

  for (const line of lines) {
    // If adding this line would exceed the limit
    if ((currentThread + '\n' + line).length > maxLength) {
      // If we have content in current thread, save it
      if (currentThread.trim()) {
        threads.push(currentThread.trim())
        currentThread = ''
      }

      // If single line is too long, split it at word boundaries
      if (line.length > maxLength) {
        const words = line.split(' ')
        let currentLine = ''

        for (const word of words) {
          if ((currentLine + ' ' + word).length > maxLength) {
            if (currentLine.trim()) {
              threads.push(currentLine.trim())
              currentLine = word
            }
            else {
              // Single word is too long, truncate it
              threads.push(word.substring(0, maxLength - 3) + '...')
              currentLine = ''
            }
          }
          else {
            currentLine = currentLine ? currentLine + ' ' + word : word
          }
        }

        if (currentLine.trim()) {
          currentThread = currentLine
        }
      }
      else {
        currentThread = line
      }
    }
    else {
      currentThread = currentThread ? currentThread + '\n' + line : line
    }
  }

  // Add remaining content
  if (currentThread.trim()) {
    threads.push(currentThread.trim())
  }

  return threads
}
