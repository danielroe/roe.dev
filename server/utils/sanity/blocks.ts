import type { AppBskyRichtextFacet } from '@atproto/api'
import type { PortableTextBlock } from '@portabletext/types'

type EntityMention = {
  _id: string
  name: string
  socialHandles: {
    bluesky?: string
    mastodon?: string
    linkedin?: string
  }
}

export function resolveTextForPlatform (blocks: PortableTextBlock[], platform: 'bluesky' | 'mastodon' | 'linkedin'): string {
  if (!blocks || !Array.isArray(blocks)) return ''

  // Process blocks and replace mentions with platform-specific handles
  return blocks
    .filter(block => block._type === 'block')
    .map(block => {
      if (!block.children || !Array.isArray(block.children)) return ''

      return block.children
        .filter(child => child._type === 'span')
        .map(child => {
          let text = child.text || ''

          // Check if this span has entity mention marks
          if (child.marks && Array.isArray(child.marks)) {
            for (const mark of child.marks) {
              // Find the corresponding markDef
              const markDef = block.markDefs?.find(def => def._key === mark)
              if (markDef?._type === 'entityMention' && markDef.entity) {
                const entity = markDef.entity as EntityMention
                if (entity?.socialHandles) {
                  const handle = entity.socialHandles[platform]
                  if (handle) {
                    text = `@${handle}`
                  }
                }
              }
            }
          }

          return text
        })
        .join('')
    })
    .join('\n\n')
}

export function resolveTextWithFacets (blocks: PortableTextBlock[], footer?: string): { text: string, facets: AppBskyRichtextFacet.Main[] } {
  if (!blocks || !Array.isArray(blocks)) {
    return { text: '', facets: [] }
  }

  // Build text with @mentions and track positions for facets
  let fullText = ''
  const facets: AppBskyRichtextFacet.Main[] = []

  for (const block of blocks.filter(block => block._type === 'block')) {
    if (!block.children || !Array.isArray(block.children)) {
      continue
    }

    let blockText = ''
    for (const child of block.children.filter(child => child._type === 'span')) {
      let text = child.text || ''

      // Check if this span has entity mention marks
      if (child.marks && Array.isArray(child.marks)) {
        for (const mark of child.marks) {
          const markDef = block.markDefs?.find(def => def._key === mark)
          if (markDef?._type === 'entityMention' && markDef.entity) {
            const entity = markDef.entity as EntityMention
            if (entity?.socialHandles?.bluesky) {
              const handle = entity.socialHandles.bluesky
              const mentionText = `@${handle}`

              // Calculate byte positions for the mention
              const startPos = Buffer.byteLength(fullText + blockText, 'utf8')
              const endPos = startPos + Buffer.byteLength(mentionText, 'utf8')

              // Store the handle for later DID resolution
              facets.push({
                index: {
                  byteStart: startPos,
                  byteEnd: endPos,
                },
                features: [{
                  $type: 'app.bsky.richtext.facet#mention',
                  did: handle, // This will be resolved to actual DID later
                }],
              })

              text = mentionText
            }
          }
          else if (markDef?._type === 'link') {
            const uri = markDef.href as string
            if (uri) {
              // Calculate byte positions for the link
              const startPos = Buffer.byteLength(fullText + blockText, 'utf8')
              const endPos = startPos + Buffer.byteLength(text, 'utf8')

              facets.push({
                index: {
                  byteStart: startPos,
                  byteEnd: endPos,
                },
                features: [{
                  $type: 'app.bsky.richtext.facet#link',
                  uri,
                }],
              })
            }
          }
        }
      }

      blockText += text
    }

    if (fullText && blockText) {
      fullText += '\n\n'
    }
    fullText += blockText
  }

  const textFromSanityBlocks = fullText

  // Append footer if provided and process its facets
  if (footer) {
    const footerStartPositionInFullText = Buffer.byteLength(textFromSanityBlocks, 'utf8')
    let processedFooterString = ''
    let lastIndexInOriginalFooter = 0

    const linkRegex = /(https?:\/\/[^\s]+|[^\s]+\.[^\s]+)/g
    let linkMatch

    while ((linkMatch = linkRegex.exec(footer)) !== null) {
      // Append text before this link match
      processedFooterString += footer.substring(lastIndexInOriginalFooter, linkMatch.index)

      const originalLinkText = linkMatch[0]
      let cleanLinkText = originalLinkText
      let actualUri = originalLinkText

      // Ensure actualUri has a protocol
      if (!actualUri.match(/^https?:\/\//)) {
        actualUri = `https://${actualUri}`
      }

      // Create cleanLinkText by stripping protocol and www.
      if (cleanLinkText.startsWith('https://')) {
        cleanLinkText = cleanLinkText.substring('https://'.length)
      }
      else if (cleanLinkText.startsWith('http://')) {
        cleanLinkText = cleanLinkText.substring('http://'.length)
      }
      if (cleanLinkText.startsWith('www.')) {
        cleanLinkText = cleanLinkText.substring('www.'.length)
      }

      const facetByteStartInProcessedFooter = Buffer.byteLength(processedFooterString, 'utf8')
      processedFooterString += cleanLinkText // Append the cleaned link text
      const facetByteEndInProcessedFooter = Buffer.byteLength(processedFooterString, 'utf8')

      facets.push({
        index: {
          byteStart: footerStartPositionInFullText + facetByteStartInProcessedFooter,
          byteEnd: footerStartPositionInFullText + facetByteEndInProcessedFooter,
        },
        features: [{
          $type: 'app.bsky.richtext.facet#link',
          uri: actualUri,
        }],
      })

      lastIndexInOriginalFooter = linkMatch.index + originalLinkText.length
    }

    // Append any remaining part of the footer after the last link
    processedFooterString += footer.substring(lastIndexInOriginalFooter)
    fullText = textFromSanityBlocks + processedFooterString // Update fullText with the processed footer

    // Add facets for hashtags in the processed footer string
    const hashtagRegexFooter = /#[\w-]+/g
    let hashtagMatch
    while ((hashtagMatch = hashtagRegexFooter.exec(processedFooterString)) !== null) {
      const tag = hashtagMatch[0]
      const tagStartInProcessedFooter = Buffer.byteLength(processedFooterString.substring(0, hashtagMatch.index), 'utf8')
      const tagEndInProcessedFooter = tagStartInProcessedFooter + Buffer.byteLength(tag, 'utf8')
      facets.push({
        index: {
          byteStart: footerStartPositionInFullText + tagStartInProcessedFooter,
          byteEnd: footerStartPositionInFullText + tagEndInProcessedFooter,
        },
        features: [{
          $type: 'app.bsky.richtext.facet#tag',
          tag: tag.substring(1),
        }],
      })
    }
  }

  // Add facets for hashtags in the main content (from Sanity blocks)
  const hashtagRegex = /#[\w-]+/g
  let match
  // Scan textFromSanityBlocks for hashtags. Indices are relative to the start of textFromSanityBlocks.
  while ((match = hashtagRegex.exec(textFromSanityBlocks)) !== null) {
    const tag = match[0]
    const startPos = Buffer.byteLength(textFromSanityBlocks.substring(0, match.index), 'utf8')
    const endPos = startPos + Buffer.byteLength(tag, 'utf8')

    // Check if this exact tag facet was already added (e.g. by footer processing if textFromSanityBlocks was empty, or duplicate in main content)
    const alreadyAdded = facets.some(
      f =>
        f.index.byteStart === startPos
        && f.index.byteEnd === endPos
        && f.features[0].$type === 'app.bsky.richtext.facet#tag'
        && ('tag' in f.features[0] && f.features[0].tag === tag.substring(1)),
    )
    if (!alreadyAdded) {
      facets.push({
        index: {
          byteStart: startPos,
          byteEnd: endPos,
        },
        features: [{
          $type: 'app.bsky.richtext.facet#tag',
          tag: tag.substring(1),
        }],
      })
    }
  }

  return { text: fullText, facets }
}
