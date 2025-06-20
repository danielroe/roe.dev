import React, { useState, useCallback, useRef, useEffect } from 'react'
import { Stack, Text, Card, Button, Box, Flex } from '@sanity/ui'
import { set, useFormValue, useClient } from 'sanity'
import { domToBlob } from 'modern-screenshot'

interface ImageGeneratorProps {
  onChange: (event: any) => void
  renderDefault: (props: any) => React.ReactElement
}

export function ImageGenerator (props: ImageGeneratorProps) {
  const { onChange, renderDefault } = props
  const [isGenerating, setIsGenerating] = useState(false)
  const [hasPreview, setHasPreview] = useState(false)
  const [visualLineCount, setVisualLineCount] = useState(1)
  const terminalRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  const formatter = new Intl.RelativeTimeFormat('en-US', { numeric: 'auto' })
  const dateOfDocument = useFormValue(['_createdAt']) as string
  const date = new Date(dateOfDocument)
  const relativeDate = formatter.format(
    Math.ceil((date.getTime() - new Date().setHours(23)) / (1000 * 60 * 60 * 24)),
    'day',
  )

  const documentContent = useFormValue(['content']) as string
  const client = useClient({ apiVersion: '2025-02-10' })

  // Format text for display - now just clean whitespace
  const formatText = useCallback((text: string) => {
    return text.trim()
  }, [])

  const formattedText = documentContent ? formatText(documentContent) : ''

  useEffect(() => {
    if (documentContent?.trim()) {
      setHasPreview(true)
    }
    else {
      setHasPreview(false)
    }
  }, [documentContent])

  // Calculate visual line count after text wrapping
  useEffect(() => {
    if (!formattedText) {
      setVisualLineCount(1)
      return
    }

    // Use setTimeout to ensure DOM is updated
    const timer = setTimeout(() => {
      if (contentRef.current) {
        // Account for the content area's padding-right: 40px
        const contentWidth = contentRef.current.clientWidth - 40 || 960

        const tempDiv = document.createElement('div')
        tempDiv.style.cssText = `
          position: absolute;
          visibility: hidden;
          width: ${contentWidth}px;
          font-family: JetBrains Mono, Monaco, monospace;
          font-size: 24px;
          line-height: 32px;
          white-space: pre-wrap;
          word-wrap: break-word;
          overflow-wrap: break-word;
          padding: 0;
          margin: 0;
        `
        tempDiv.textContent = formattedText
        document.body.appendChild(tempDiv)

        const lineHeight = 32
        const height = tempDiv.offsetHeight
        const lines = Math.ceil(height / lineHeight)
        setVisualLineCount(Math.max(1, lines))

        document.body.removeChild(tempDiv)
      }
    }, 0)

    return () => clearTimeout(timer)
  }, [formattedText])

  const generateImage = useCallback(async () => {
    if (!documentContent || !hasPreview || !terminalRef.current) return

    setIsGenerating(true)

    try {
      const blob = await domToBlob(terminalRef.current, {
        width: terminalRef.current.clientWidth,
        height: terminalRef.current.clientHeight,
        scale: 2,
        style: {
          transform: 'scale(1)',
          transformOrigin: 'top left',
        },
      })

      if (blob) {
        try {
          // Upload the image to Sanity as an asset
          const asset = await client.assets.upload('image', blob, {
            filename: `ama-generated-${Date.now()}.png`,
          })

          onChange(set({
            _type: 'image',
            asset: {
              _type: 'reference',
              _ref: asset._id,
            },
          }))
        }
        catch (error) {
          console.error('Error uploading image to Sanity:', error)
        }
      }
      setIsGenerating(false)
    }
    catch (error) {
      console.error('Error generating image:', error)
      setIsGenerating(false)
    }
  }, [documentContent, hasPreview, onChange, client])

  return (
    <Stack space={3}>
      <Card padding={3} tone="default" border>
        <Stack space={3}>
          <Flex justify="space-between" align="center">
            <Text size={1} weight="semibold">
              Generated Image
            </Text>
            <Button
              text={isGenerating ? 'Saving to Sanity...' : 'Save to Sanity'}
              tone="primary"
              onClick={generateImage}
              disabled={!hasPreview || isGenerating}
              loading={isGenerating}
            />
          </Flex>

          {documentContent && (
            <Box>
              {/* Editor Mockup */}
              <div
                ref={terminalRef}
                style={{
                  width: '1200px',
                  height: 'auto',
                  padding: '96px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  boxSizing: 'border-box',
                  transform: 'scale(0.47)',
                  transformOrigin: 'top left',
                  marginBottom: 'calc(-53% + 6rem)',
                  position: 'relative',
                }}
              >
                {/* Editor Window */}
                <div
                  style={{
                    width: '100%',
                    background: '#ffffff',
                    borderRadius: '16px',
                    boxShadow: 'rgb(4, 4, 4) 0px 0px 0px 1px, rgba(255, 255, 255, 0.18) 0px 1px 0px inset, rgba(0, 0, 0, 0.6) 0px 0px 18px 1px',
                    overflow: 'hidden',
                  }}
                >
                  {/* Editor Title Bar */}
                  <div
                    style={{
                      height: '64px',
                      background: '#292d3e',
                      borderTopLeftRadius: '16px',
                      borderTopRightRadius: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      paddingLeft: '20px',
                      position: 'relative',
                    }}
                  >
                    {/* Traffic Light Buttons */}
                    <div style={{ display: 'flex', gap: '14px' }}>
                      <div
                        style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          background: '#ff5f57',
                          border: '1px solid #e53e3e',
                        }}
                      />
                      <div
                        style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          background: '#ffbd2e',
                          border: '1px solid #d69e2e',
                        }}
                      />
                      <div
                        style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          background: '#28ca42',
                          border: '1px solid #38a169',
                        }}
                      />
                    </div>

                    {/* Editor Title */}
                    <div
                      style={{
                        position: 'absolute',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        color: '#64748b',
                        fontSize: '24px',
                        whiteSpace: 'nowrap',
                        fontWeight: '500',
                        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                      }}
                    >
                      ~/question.md
                    </div>
                  </div>

                  {/* Editor Content */}
                  <div
                    style={{
                      padding: '40px',
                      paddingLeft: '0px',
                      display: 'flex',
                      fontWeight: 600,
                      fontFamily: 'JetBrains Mono, Monaco, monospace',
                      fontSize: '24px',
                      lineHeight: '32px',
                      paddingTop: '48px',
                      paddingBottom: '64px',
                      color: '#d0d0d0',
                      background: '#292d3e',
                      counterReset: 'line-number',
                    }}
                  >
                    {/* Line Numbers Column */}
                    <div
                      style={{
                        width: '68px',
                        flexShrink: 0,
                        paddingRight: '32px',
                        color: '#94a3b8',
                        fontSize: '16px',
                        fontVariantNumeric: 'tabular-nums',
                        userSelect: 'none',
                        lineHeight: '32px',
                      }}
                    >
                      {/* Generate line numbers based on visual line count */}
                      {Array.from({ length: visualLineCount }, (_, index) => (
                        <div key={index} style={{ height: '32px', display: 'flex', justifyContent: 'flex-end' }}>
                          {(index + 1).toString().padStart(2, ' ')}
                        </div>
                      ))}
                    </div>

                    <div
                      ref={contentRef}
                      style={{
                        flex: 1,
                        whiteSpace: 'pre-wrap',
                        wordWrap: 'break-word',
                        lineHeight: '32px',
                        paddingRight: '40px',
                        maxWidth: 'calc(100% - 68px)',
                        overflowWrap: 'break-word',
                      }}
                    >
                      {formattedText}
                    </div>
                  </div>
                </div>
                {/* Bottom Branding */}
                <div
                  style={{
                    color: '#ffffff',
                    height: 0,
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                    fontSize: '24px',
                    marginRight: '1rem',
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    display: 'flex',
                    whiteSpace: 'nowrap',
                    textAlign: 'right',
                    fontWeight: '500',
                  }}
                >
                  <div style={{ marginTop: '1.25rem' }}>
                    roe.dev/ama
                  </div>
                  <div style={{ marginTop: '1.25rem' }}>
                    asked
                    {' '}
                    {relativeDate}
                  </div>
                </div>
                <div style={{
                  position: 'absolute',
                  inset: '0',
                  overflow: 'hidden',
                  zIndex: -1,
                }}
                >
                  <div
                    ref={terminalRef}
                    style={{
                      position: 'absolute',
                      background: 'linear-gradient(yellow 5%, fuchsia, royalblue 95%)',
                      filter: 'url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGhlaWdodD0iMCI+IDxmaWx0ZXIgaWQ9Im15RmlsdGVyIj4gPGZlVHVyYnVsZW5jZSB0eXBlPSJmcmFjdGFsTm9pc2UiIGJhc2VGcmVxdWVuY3k9Ii4wMDUgLjAwMSIgbnVtT2N0YXZlcz0iMiIgLz4gPGZlRGlzcGxhY2VtZW50TWFwIHhDaGFubmVsU2VsZWN0b3I9IlIiIHNjYWxlPSI1MDAiIGluPSJTb3VyY2VHcmFwaGljIiByZXN1bHQ9ImJhbmRzIiAvPiA8ZmVUdXJidWxlbmNlIHR5cGU9ImZyYWN0YWxOb2lzZSIgYmFzZUZyZXF1ZW5jeT0iMy43MSIgLz4gPGZlRGlzcGxhY2VtZW50TWFwIGluPSJiYW5kcyIgc2NhbGU9IjMyIiB4Q2hhbm5lbFNlbGVjdG9yPSJSIiAvPiA8L2ZpbHRlcj4gPC9zdmc+#myFilter")',
                      inset: '-9em',
                    }}
                  />
                </div>
              </div>
            </Box>
          )}
        </Stack>
      </Card>

      {renderDefault(props)}
    </Stack>
  )
}
