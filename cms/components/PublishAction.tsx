import { CheckmarkIcon as CheckIcon } from '@sanity/icons'
import { useDocumentOperation } from 'sanity'
import type { DocumentActionComponent } from 'sanity'

export const PublishAction: DocumentActionComponent = props => {
  const { publish } = useDocumentOperation(props.id, props.type)
  const { patch } = useDocumentOperation(props.id, props.type)

  const document = props.draft || props.published
  const isPublished = document?.publishStatus === 'published'

  const hasTextContent = (document?.posts as any[])?.some(post => {
    if (!post.content || !Array.isArray(post.content)) return false
    return post.content.some((block: any) => {
      if (block._type === 'block' && block.children) {
        return block.children.some((child: any) => child.text && child.text.trim().length > 0)
      }
      return false
    })
  })

  const hasImage = !!(document as any)?.generatedImage?.asset?._ref
  const hasContent = hasTextContent && hasImage

  if (isPublished) {
    return null
  }

  return {
    label: 'Mark as ready to publish',
    icon: CheckIcon,
    disabled: !hasContent,
    tone: 'positive',
    shortcut: 'mod+shift+p',
    onHandle: () => {
      // Set the publish status to 'ready'
      patch.execute([
        {
          set: {
            publishStatus: 'ready',
          },
        },
      ])

      // Publish the document to make the changes live
      if (!publish.disabled) {
        publish.execute()
      }

      props.onComplete()
    },
  }
}
