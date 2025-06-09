import { CheckmarkIcon as CheckIcon } from '@sanity/icons'
import { useDocumentOperation } from 'sanity'
import type { DocumentActionComponent } from 'sanity'

export const PublishAction: DocumentActionComponent = props => {
  const { publish } = useDocumentOperation(props.id, props.type)
  const { patch } = useDocumentOperation(props.id, props.type)

  const document = props.draft || props.published
  const isReady = document?.publishStatus === 'ready'
  const isPublished = document?.publishStatus === 'published'
  const hasResponse = (document?.posts as any[])?.length > 0

  // Don't show the action if there's no response or if already published
  if (!hasResponse || isPublished) {
    return null
  }

  return {
    label: isReady ? 'Ready to publish ✓' : 'Mark as ready to publish',
    icon: CheckIcon,
    disabled: isReady,
    tone: isReady ? 'positive' : 'primary',
    shortcut: !isReady ? 'mod+shift+p' : undefined,
    onHandle: () => {
      if (isReady) return

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
