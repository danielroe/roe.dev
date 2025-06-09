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
  const terminalRef = useRef<HTMLDivElement>(null)

  const documentContent = useFormValue(['content']) as string
  const client = useClient({ apiVersion: '2025-02-10' })

  useEffect(() => {
    if (documentContent?.trim()) {
      setHasPreview(true)
    }
    else {
      setHasPreview(false)
    }
  }, [documentContent])

  const generateImage = useCallback(async () => {
    if (!documentContent || !hasPreview || !terminalRef.current) return

    setIsGenerating(true)

    try {
      const blob = await domToBlob(terminalRef.current, {
        width: 1200,
        height: 630,
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

  // Split text into lines that fit the terminal width
  const formatTextLines = useCallback((text: string) => {
    const words = text.split(' ')
    const lines: string[] = []
    let currentLine = ''
    const length = 55

    for (const word of words) {
      if (currentLine.length + word.length + 1 <= length) {
        currentLine += (currentLine ? ' ' : '') + word
      }
      else {
        if (currentLine) {
          lines.push(currentLine)
        }
        currentLine = word
      }
    }
    if (currentLine) {
      lines.push(currentLine)
    }
    return lines
  }, [])

  const textLines = documentContent ? formatTextLines(documentContent) : []

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
                  height: '630px',
                  padding: '80px 96px',
                  boxSizing: 'border-box',
                  transform: 'scale(0.47)',
                  transformOrigin: 'top left',
                  marginBottom: '-325px',
                  position: 'relative',
                }}
              >
                {/* Editor Window */}
                <div
                  style={{
                    width: '100%',
                    height: '100%',
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
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <div
                        style={{
                          width: '14px',
                          height: '14px',
                          borderRadius: '50%',
                          background: '#ff5f57',
                          border: '1px solid #e53e3e',
                        }}
                      />
                      <div
                        style={{
                          width: '14px',
                          height: '14px',
                          borderRadius: '50%',
                          background: '#ffbd2e',
                          border: '1px solid #d69e2e',
                        }}
                      />
                      <div
                        style={{
                          width: '14px',
                          height: '14px',
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
                        fontSize: '22px',
                        fontWeight: '500',
                        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                      }}
                    >
                      ~/answer.md
                    </div>
                  </div>

                  {/* Editor Content */}
                  <div
                    style={{
                      padding: '40px',
                      height: 'calc(100% - 72px)',
                      display: 'flex',
                      flexDirection: 'column',
                      fontWeight: 600,
                      fontFamily: 'JetBrains Mono',
                      fontSize: '24px',
                      lineHeight: '40px',
                      color: '#d0d0d0',
                      background: '#292d3e',
                    }}
                  >
                    {/* Content Lines */}
                    <div style={{ flex: 1 }}>
                      {textLines.map((line, index) => (
                        <div key={index} style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '4px' }}>
                          {/* Line Number */}
                          <div
                            style={{
                              width: '50px',
                              textAlign: 'right',
                              color: '#94a3b8',
                              paddingRight: '32px',
                              flexShrink: 0,
                              userSelect: 'none',
                              fontSize: '16px',
                            }}
                          >
                            {(index + 1).toString().padStart(2, ' ')}
                          </div>

                          {/* Content */}
                          <div>
                            {line}
                          </div>
                        </div>
                      ))}
                    </div>

                  </div>
                </div>
                {/* Bottom Branding */}
                <div
                  style={{
                    color: '#ffffff',
                    fontSize: '24px',
                    marginTop: '1.25rem',
                    marginRight: '1rem',
                    textAlign: 'right',
                    fontWeight: '500',
                  }}
                >
                  roe.dev/ama
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
