import React, { useCallback, useMemo } from 'react'
import { Stack, Text, Card, Box } from '@sanity/ui'

interface CharacterCountInputProps {
  value?: any
  onChange: (event: any) => void
  schemaType: any
  renderDefault: (props: any) => React.ReactElement
}

const BLUESKY_LIMIT = 300

function extractTextFromBlocks (blocks: any[]): string {
  if (!blocks || !Array.isArray(blocks)) return ''

  return blocks
    .filter(block => block._type === 'block')
    .map(block => {
      if (!block.children || !Array.isArray(block.children)) return ''
      return block.children
        .filter((child: any) => child._type === 'span')
        .map((child: any) => child.text || '')
        .join('')
    })
    .join('\n\n')
}

export function CharacterCountInput (props: CharacterCountInputProps) {
  const { value, onChange, schemaType, renderDefault } = props

  const textContent = useMemo(() => {
    return extractTextFromBlocks(value || [])
  }, [value])

  const characterCount = textContent.length
  const remaining = BLUESKY_LIMIT - characterCount

  const getStatusColor = (remaining: number) => {
    if (remaining < 0) return '#e03131' // Red - over limit
    if (remaining < 30) return '#fd7e14' // Orange - warning
    return '#51cf66' // Green - good
  }

  const handleChange = useCallback((event: any) => {
    onChange(event)
  }, [onChange])

  return (
    <Stack space={3}>
      {renderDefault({
        ...props,
        value,
        onChange: handleChange,
        schemaType,
      })}

      <Card padding={3} tone="default" border>
        <Stack space={2}>
          <Box style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text size={1} weight="semibold">
              Character count
            </Text>
            <Text
              size={1}
              weight="semibold"
              style={{
                color: getStatusColor(remaining),
              }}
            >
              {characterCount}
              /
              {BLUESKY_LIMIT}
            </Text>
          </Box>

          {remaining < 0 && (
            <Text size={1} style={{ color: '#e03131' }}>
              ⚠️ Over limit by
              {' '}
              {Math.abs(remaining)}
              {' '}
              characters
            </Text>
          )}

          {remaining >= 0 && remaining < 30 && (
            <Text size={1} style={{ color: '#fd7e14' }}>
              ⚠️
              {' '}
              {remaining}
              {' '}
              characters remaining
            </Text>
          )}
        </Stack>
      </Card>
    </Stack>
  )
}
