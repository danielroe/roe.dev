import React, { useState, useCallback, useRef, useEffect } from 'react'
import { Stack, Text, Card, Button, Box, Badge, Flex, Switch } from '@sanity/ui'
import type { PortableTextTextBlock } from 'sanity'
import { set, useFormValue, useClient } from 'sanity'
import { createVideo } from '../utils/video-recorder'
import { calculateVideoDuration } from '../utils/video-animation-config'
import type { GSAPTimeline } from '../utils/video-gsap-animations'
import { createPreviewAnimation, stopAnimations } from '../utils/video-gsap-animations'
import { getHumanRelativeDate } from '../utils/date-formatting'
import {
  fetchAudioTracks,
  selectAudioTrack,
  generateContentHash,
  calculateAudioStartTime,
  type AudioTrack,
} from '../utils/audio-track-selector'

interface VideoGeneratorProps {
  onChange: (event: any) => void
  renderDefault: (props: any) => React.ReactElement
}

export function VideoContentGenerator (props: VideoGeneratorProps) {
  const { onChange, renderDefault } = props
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationProgress, setGenerationProgress] = useState(0)
  const [hasPreview, setHasPreview] = useState(false)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [audioEnabled, setAudioEnabled] = useState(true)
  const [availableAudioTracks, setAvailableAudioTracks] = useState<AudioTrack[]>([])
  const [selectedAudioTrack, setSelectedAudioTrack] = useState<AudioTrack | null>(null)
  const [isLoadingAudioTracks, setIsLoadingAudioTracks] = useState(false)
  const videoContainerRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const questionContentRef = useRef<HTMLDivElement>(null)
  const gsapAnimationRef = useRef<GSAPTimeline | null>(null)

  const dateOfDocument = useFormValue(['_createdAt']) as string
  const relativeDate = getHumanRelativeDate(dateOfDocument)

  const documentContent = useFormValue(['content']) as string
  const posts = useFormValue(['posts']) as Array<{ content: PortableTextTextBlock[] }>
  const existingVideo = useFormValue(['tiktokVideo']) as { asset?: { _ref: string } } | undefined
  const client = useClient({ apiVersion: '2025-02-10' })

  // Initialize video URL from existing asset
  useEffect(() => {
    const loadExistingVideo = async () => {
      if (existingVideo?.asset?._ref && !videoUrl) {
        try {
          const asset = await client.getDocument(existingVideo.asset._ref)
          if (asset?.url) {
            setVideoUrl(asset.url)
          }
        }
        catch (error) {
          console.warn('Failed to load existing video:', error)
        }
      }
    }

    loadExistingVideo()
  }, [existingVideo, client])

  useEffect(() => {
    if (documentContent?.trim() && posts?.length > 0) {
      setHasPreview(true)
    }
    else {
      setHasPreview(false)
    }
  }, [documentContent, posts])

  const getAnswerText = useCallback(() => {
    if (!posts || posts.length === 0) return ''

    const firstPost = posts[0]
    if (!firstPost?.content) return ''

    return (firstPost.content)
      .filter(block => block._type === 'block')
      .map(block =>
        block.children
          ?.map(child => child.text || '')
          .join('') || '',
      )
      .join('\n')
      .trim()
  }, [posts])

  const formattedQuestion = documentContent ? documentContent.trim() : ''
  const formattedAnswer = getAnswerText() ? getAnswerText().trim() : ''

  const typingIntervals = React.useMemo(() => {
    if (!formattedQuestion) return []

    const seed = formattedQuestion.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 1000
    const intervals: number[] = []
    const words = formattedQuestion.split(' ')

    let randomSeed = seed
    const seededRandom = () => {
      randomSeed = (randomSeed * 9301 + 49297) % 233280
      return randomSeed / 233280
    }

    for (let wordIndex = 0; wordIndex < words.length; wordIndex++) {
      const word = words[wordIndex]!

      if (wordIndex > 0) {
        intervals.push(Math.floor(seededRandom() * 100) + 50)
      }

      for (let charIndex = 0; charIndex < word.length; charIndex++) {
        intervals.push(Math.floor(seededRandom() * 50) + 30)
      }

      if (wordIndex < words.length - 1) {
        intervals.push(Math.floor(seededRandom() * 300) + 100)
      }
    }

    return intervals
  }, [formattedQuestion])

  const answerLines = React.useMemo(() => {
    if (!formattedAnswer) return []

    const paragraphs = formattedAnswer.split('\n').map(p => p.trim()).filter(Boolean)
    const lines: Array<{ text: string, isAfterLineBreak: boolean, isNewParagraph: boolean }> = []

    for (let paragraphIndex = 0; paragraphIndex < paragraphs.length; paragraphIndex++) {
      const paragraph = paragraphs[paragraphIndex]
      const isAfterLineBreak = paragraphIndex > 0
      let isFirstLineOfParagraph = true

      // Split by sentences but keep punctuation
      const sentenceMatches = paragraph.match(/[^.!?]*[.!?]+|[^.!?]+$/g) || [paragraph]

      for (const sentence of sentenceMatches) {
        const trimmed = sentence.trim()
        if (!trimmed) continue

        if (trimmed.length > 30) {
          const words = trimmed.split(' ')
          let currentLine = ''
          for (let i = 0; i < words.length; i++) {
            const word = words[i]
            if (currentLine.length + word.length + 1 <= 30) {
              currentLine += (currentLine ? ' ' : '') + word
            }
            else {
              if (currentLine) {
                lines.push({
                  text: currentLine,
                  isAfterLineBreak: isAfterLineBreak && isFirstLineOfParagraph,
                  isNewParagraph: paragraphIndex > 0 && isFirstLineOfParagraph,
                })
                isFirstLineOfParagraph = false
              }
              currentLine = word
            }
          }
          if (currentLine) {
            lines.push({
              text: currentLine,
              isAfterLineBreak: isAfterLineBreak && isFirstLineOfParagraph,
              isNewParagraph: paragraphIndex > 0 && isFirstLineOfParagraph,
            })
            isFirstLineOfParagraph = false
          }
        }
        else {
          lines.push({
            text: trimmed,
            isAfterLineBreak: isAfterLineBreak && isFirstLineOfParagraph,
            isNewParagraph: paragraphIndex > 0 && isFirstLineOfParagraph,
          })
          isFirstLineOfParagraph = false
        }
      }
    }

    return lines
  }, [formattedAnswer])

  const videoDuration = calculateVideoDuration(1, answerLines.length, formattedQuestion, typingIntervals)

  // Load available audio tracks
  useEffect(() => {
    const loadAudioTracks = async () => {
      if (!audioEnabled) return

      setIsLoadingAudioTracks(true)
      try {
        const tracks = await fetchAudioTracks(client)
        setAvailableAudioTracks(tracks)

        // Auto-select a track based on content
        if (tracks.length > 0 && formattedQuestion && formattedAnswer) {
          const contentHash = generateContentHash(formattedQuestion, formattedAnswer)
          const track = selectAudioTrack(tracks, videoDuration, contentHash)
          setSelectedAudioTrack(track)
        }
      }
      catch (error) {
        console.warn('Failed to load audio tracks:', error)
      }
      finally {
        setIsLoadingAudioTracks(false)
      }
    }

    loadAudioTracks()
  }, [audioEnabled, formattedQuestion, formattedAnswer, videoDuration, client])

  // Update selected track when content changes
  useEffect(() => {
    if (availableAudioTracks.length > 0 && formattedQuestion && formattedAnswer && audioEnabled) {
      const contentHash = generateContentHash(formattedQuestion, formattedAnswer)
      const track = selectAudioTrack(availableAudioTracks, videoDuration, contentHash)
      setSelectedAudioTrack(track)
    }
  }, [availableAudioTracks, formattedQuestion, formattedAnswer, videoDuration, audioEnabled])

  const generateVideo = useCallback(async () => {
    if (!documentContent || !hasPreview || !videoContainerRef.current) return

    setIsGenerating(true)
    setGenerationProgress(0)
    setVideoUrl(null)

    // Ensure preview animation is completely stopped before starting video generation
    if (gsapAnimationRef.current) {
      gsapAnimationRef.current.destroy()
      gsapAnimationRef.current = null
    }
    stopAnimations(videoContainerRef.current)

    // Add small delay to ensure cleanup is complete
    await new Promise(resolve => setTimeout(resolve, 100))

    try {
      const question = documentContent
      const answer = getAnswerText()

      const questionLines = [formattedQuestion]
      const videoAnswerLines = answerLines.map(line => line.text)

      const videoBlob = await createVideo({
        element: videoContainerRef.current,
        question,
        questionLines,
        answer,
        answerLines: videoAnswerLines,
        relativeDate,
        typingIntervals,
        audioTrack: audioEnabled && selectedAudioTrack ? selectedAudioTrack : undefined,
        audioStartTime: selectedAudioTrack
          ? calculateAudioStartTime(
              selectedAudioTrack,
              videoDuration,
              generateContentHash(formattedQuestion, formattedAnswer),
            )
          : 0,
        audioVolume: selectedAudioTrack?.volume || 0.7,
        onProgress: progress => {
          setGenerationProgress(Math.round(progress * 100))
        },
      })

      if (videoBlob) {
        const url = URL.createObjectURL(videoBlob)
        setVideoUrl(url)

        const asset = await client.assets.upload('file', videoBlob, {
          filename: `video-${Date.now()}.webm`,
        })

        onChange(set({
          _type: 'file',
          asset: {
            _type: 'reference',
            _ref: asset._id,
          },
        }))
      }
    }
    catch (error) {
      console.error('Error generating video:', error)
    }
    finally {
      setIsGenerating(false)
      setGenerationProgress(0)
    }
  }, [documentContent, hasPreview, getAnswerText, formattedQuestion, formattedAnswer, answerLines, relativeDate, typingIntervals, audioEnabled, selectedAudioTrack, videoDuration, onChange, client])

  useEffect(() => {
    return () => {
      if (videoUrl) {
        URL.revokeObjectURL(videoUrl)
      }
    }
  }, [videoUrl])

  const generateVideoMetadata = useCallback((question: string, answer: string): { title: string, description: string, hashtags: string[] } => {
    // Generate title - truncate question if too long
    const title = question.length > 47
      ? question.slice(0, 47) + '...'
      : question

    // Generate context-aware hashtags
    const contentText = `${question} ${answer}`.toLowerCase()

    const baseHashtags = ['AMA', 'QandA', 'Tech', 'Programming', 'Developer']
    const contextHashtags: string[] = []

    // Detect content-specific technologies and topics
    const techKeywords = {
      nuxt: ['Nuxt', 'NuxtJS'],
      vue: ['Vue', 'VueJS'],
      javascript: ['JavaScript', 'JS'],
      typescript: ['TypeScript', 'TS'],
      node: ['NodeJS', 'Node'],
      react: ['React', 'ReactJS'],
      css: ['CSS', 'Styling'],
      performance: ['Performance', 'Optimization'],
      security: ['Security', 'Auth'],
      database: ['Database', 'DB'],
      api: ['API', 'Backend'],
      frontend: ['Frontend', 'UI'],
      fullstack: ['FullStack', 'WebDev'],
      opensource: ['OpenSource', 'OSS'],
      git: ['Git', 'GitHub'],
      deployment: ['Deployment', 'DevOps'],
      testing: ['Testing', 'QA'],
      ai: ['AI', 'MachineLearning'],
      mobile: ['Mobile', 'App'],
      web: ['WebDevelopment', 'Web'],
    }

    for (const [keyword, tags] of Object.entries(techKeywords)) {
      if (contentText.includes(keyword)) {
        contextHashtags.push(...tags.slice(0, 1)) // Add only the first tag to avoid clutter
      }
    }

    // Combine and limit hashtags
    const allHashtags = [...baseHashtags, ...contextHashtags].slice(0, 8)

    // Generate description with Q&A format
    const shortAnswer = answer.length > 100
      ? answer.slice(0, 97) + '...'
      : answer

    const hashtagString = allHashtags.map(tag => `#${tag}`).join(' ')
    const description = `Q: ${question}\n\nA: ${shortAnswer}\n\n${hashtagString}`

    return { title, description, hashtags: allHashtags }
  }, [])

  // Copy to clipboard functionality
  const copyToClipboard = useCallback(async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text)
      console.log(`${type} copied to clipboard`)
    }
    catch (error) {
      console.error(`Failed to copy ${type}:`, error)
    }
  }, [])

  const metadata = React.useMemo(() => {
    if (!formattedQuestion || !formattedAnswer) {
      return { title: '', description: '', hashtags: [] }
    }
    return generateVideoMetadata(formattedQuestion, formattedAnswer)
  }, [formattedQuestion, formattedAnswer, generateVideoMetadata])

  // GSAP Animation Control for Preview
  useEffect(() => {
    if (!videoContainerRef.current) return

    // Stop any existing animations
    if (gsapAnimationRef.current) {
      gsapAnimationRef.current.destroy()
      gsapAnimationRef.current = null
    }
    stopAnimations(videoContainerRef.current)

    if (!hasPreview || isGenerating) {
      return
    }

    // Start GSAP preview animation
    try {
      gsapAnimationRef.current = createPreviewAnimation(videoContainerRef.current, typingIntervals)
    }
    catch (error) {
      console.warn('Failed to start GSAP preview:', error)
    }
  }, [hasPreview, isGenerating, formattedAnswer, typingIntervals])

  // Cleanup GSAP animation on unmount
  useEffect(() => {
    return () => {
      if (gsapAnimationRef.current) {
        gsapAnimationRef.current.destroy()
      }
      if (videoContainerRef.current) {
        stopAnimations(videoContainerRef.current)
      }
    }
  }, [])

  return (
    <Stack space={3}>
      <Card padding={3} tone="primary" border>
        <Stack space={3}>
          <Flex justify="space-between" align="center">
            <Text size={1} weight="semibold">
              Video Generator
            </Text>
            <Flex gap={2} align="center">
              <Badge tone="primary">
                {Math.ceil(videoDuration)}
                s
              </Badge>
              <Button
                text={isGenerating ? 'Generating Video...' : 'Generate Video'}
                tone="primary"
                onClick={generateVideo}
                disabled={!hasPreview || isGenerating}
                loading={isGenerating}
              />
            </Flex>
          </Flex>

          {isGenerating && (
            <Box>
              <Text size={1} weight="medium" style={{ marginBottom: '8px' }}>
                Generating video...
                {' '}
                {generationProgress}
                %
              </Text>
              <div
                style={{
                  width: '100%',
                  height: '8px',
                  backgroundColor: '#e0e0e0',
                  borderRadius: '4px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${generationProgress}%`,
                    height: '100%',
                    backgroundColor: '#2276fc',
                    borderRadius: '4px',
                    transition: 'width 0.3s ease',
                  }}
                />
              </div>
            </Box>
          )}

          {!hasPreview && (
            <Text size={0}>
              Add a question and response first to generate the video.
            </Text>
          )}

          {/* Audio Controls */}
          <Card padding={3} tone="transparent" border>
            <Stack space={3}>
              <Flex justify="space-between" align="center">
                <Text size={1} weight="semibold">Background Music</Text>
                <Switch
                  checked={audioEnabled}
                  onChange={event => setAudioEnabled(event.currentTarget.checked)}
                />
              </Flex>

              {audioEnabled && (
                <Stack space={2}>
                  {isLoadingAudioTracks && (
                    <Text size={0} style={{ color: '#666' }}>
                      Loading audio tracks...
                    </Text>
                  )}

                  {selectedAudioTrack && (
                    <Box>
                      <Text size={0} weight="medium" style={{ marginBottom: '4px' }}>
                        Selected Track:
                      </Text>
                      <Text size={0} style={{ color: '#666' }}>
                        "
                        {selectedAudioTrack.name}
                        " by
                        {' '}
                        {selectedAudioTrack.artist}
                        {selectedAudioTrack.tags.length > 0 && (
                          <span>
                            {' '}
                            •
                            {' '}
                            {selectedAudioTrack.tags.slice(0, 3).join(', ')}
                          </span>
                        )}
                      </Text>
                    </Box>
                  )}

                  {!selectedAudioTrack && !isLoadingAudioTracks && availableAudioTracks.length === 0 && (
                    <Text size={0} style={{ color: '#666' }}>
                      No audio tracks available. Add audio tracks in the CMS to enable background music.
                    </Text>
                  )}

                  {!selectedAudioTrack && !isLoadingAudioTracks && availableAudioTracks.length > 0 && (
                    <Text size={0} style={{ color: '#666' }}>
                      No suitable track found for this video duration.
                    </Text>
                  )}
                </Stack>
              )}
            </Stack>
          </Card>

          {documentContent && posts && (
            <Box>
              {videoUrl && (
                <Box marginBottom={3}>
                  <video
                    ref={videoRef}
                    controls
                    style={{
                      width: '100%',
                      maxWidth: '400px',
                      height: 'auto',
                      borderRadius: '8px',
                      aspectRatio: '9/16',
                    }}
                  >
                    <source src={videoUrl} type="video/webm" />
                  </video>
                </Box>
              )}

              {metadata.title && (
                <Card padding={3} tone="transparent" border marginBottom={3}>
                  <Stack space={3}>
                    <Text size={1} weight="semibold">Video Metadata</Text>

                    <Flex direction="column" gap={3}>
                      <Box>
                        <Flex justify="space-between" align="center" marginBottom={2}>
                          <Text size={1} weight="medium">Title</Text>
                          <Button
                            text="Copy Title"
                            tone="primary"
                            mode="ghost"
                            fontSize={0}
                            onClick={() => copyToClipboard(metadata.title, 'Title')}
                          />
                        </Flex>
                        <Card padding={2} tone="transparent" border>
                          <Text size={0} style={{ fontFamily: 'monospace' }}>
                            {metadata.title}
                          </Text>
                        </Card>
                      </Box>

                      <Box>
                        <Flex justify="space-between" align="center" marginBottom={2}>
                          <Text size={1} weight="medium">Description</Text>
                          <Button
                            text="Copy Description"
                            tone="primary"
                            mode="ghost"
                            fontSize={0}
                            onClick={() => copyToClipboard(metadata.description, 'Description')}
                          />
                        </Flex>
                        <Card padding={2} tone="transparent" border>
                          <Text size={0} style={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
                            {metadata.description}
                          </Text>
                        </Card>
                      </Box>

                      <Box>
                        <Flex justify="space-between" align="center" marginBottom={2}>
                          <Text size={1} weight="medium">Hashtags</Text>
                          <Button
                            text="Copy Hashtags"
                            tone="primary"
                            mode="ghost"
                            fontSize={0}
                            onClick={() => copyToClipboard(metadata.hashtags.map(tag => `#${tag}`).join(' '), 'Hashtags')}
                          />
                        </Flex>
                        <Card padding={2} tone="transparent" border>
                          <Text size={0} style={{ fontFamily: 'monospace' }}>
                            {metadata.hashtags.map(tag => `#${tag}`).join(' ')}
                          </Text>
                        </Card>
                      </Box>
                    </Flex>
                  </Stack>
                </Card>
              )}

              <div
                ref={videoContainerRef}
                className="video-container"
                style={{
                  width: '1080px',
                  height: '1920px',
                  position: 'relative',
                  overflow: 'hidden',
                  display: 'block',
                  transform: 'scale(0.2)',
                  transformOrigin: 'top left',
                  marginBottom: '-1536px',
                  marginRight: '-864px',
                  isolation: 'isolate',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    inset: '-9em',
                    background: 'linear-gradient(yellow 5%, fuchsia, royalblue 95%)',
                    filter: 'url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGhlaWdodD0iMCI+IDxmaWx0ZXIgaWQ9Im15RmlsdGVyIj4gPGZlVHVyYnVsZW5jZSB0eXBlPSJmcmFjdGFsTm9pc2UiIGJhc2VGcmVxdWVuY3k9Ii4wMDUgLjAwMSIgbnVtT2N0YXZlcz0iMiIgLz4gPGZlRGlzcGxhY2VtZW50TWFwIHhDaGFubmVsU2VsZWN0b3I9IlIiIHNjYWxlPSI1MDAiIGluPSJTb3VyY2VHcmFwaGljIiByZXN1bHQ9ImJhbmRzIiAvPiA8ZmVUdXJidWxlbmNlIHR5cGU9ImZyYWN0YWxOb2lzZSIgYmFzZUZyZXF1ZW5jeT0iMy43MSIgLz4gPGZlRGlzcGxhY2VtZW50TWFwIGluPSJiYW5kcyIgc2NhbGU9IjMyIiB4Q2hhbm5lbFNlbGVjdG9yPSJSIiAvPiA8L2ZpbHRlcj4gPC9zdmc+#myFilter")',
                  }}
                />

                <div
                  className="question-window"
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    width: '900px',
                    background: '#ffffff',
                    borderRadius: '24px',
                    boxShadow: 'rgb(4, 4, 4) 0px 0px 0px 1px, rgba(255, 255, 255, 0.18) 0px 1px 0px inset, rgba(0, 0, 0, 0.6) 0px 0px 18px 1px',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '64px',
                      background: '#292d3e',
                      borderTopLeftRadius: '24px',
                      borderTopRightRadius: '24px',
                      borderBottom: '0px',
                      display: 'flex',
                      alignItems: 'center',
                      paddingLeft: '32px',
                      position: 'relative',
                    }}
                  >
                    <div style={{ display: 'flex', gap: '16px' }}>
                      <div
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          background: '#ff5f57',
                          border: '1px solid #e53e3e',
                        }}
                      />
                      <div
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          background: '#ffbd2e',
                          border: '1px solid #d69e2e',
                        }}
                      />
                      <div
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          background: '#28ca42',
                          border: '1px solid #38a169',
                        }}
                      />
                    </div>

                    <div
                      style={{
                        position: 'absolute',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        color: '#64748b',
                        fontSize: '32px',
                        whiteSpace: 'nowrap',
                        fontWeight: '500',
                        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                      }}
                    >
                      ~/question.md
                    </div>
                  </div>

                  <div
                    style={{
                      padding: '48px',
                      display: 'flex',
                      flexDirection: 'column',
                      fontWeight: 600,
                      fontFamily: 'JetBrains Mono, Monaco, monospace',
                      fontSize: '32px',
                      lineHeight: '42px',
                      color: '#d0d0d0',
                      background: '#292d3e',
                    }}
                  >
                    <div
                      ref={questionContentRef}
                      className="question-content"
                      style={{
                        flex: 1,
                        position: 'relative',
                        whiteSpace: 'pre-wrap',
                        wordWrap: 'break-word',
                        lineHeight: '42px',
                        paddingRight: '40px',
                        overflowWrap: 'break-word',
                      }}
                      data-question-text={formattedQuestion}
                    >
                      {(() => {
                        const words = formattedQuestion.split(/\s+/).filter(Boolean)
                        let globalCharIndex = 0
                        const maxLineLength = 39

                        const lines: string[] = []
                        let currentLine = ''

                        for (const word of words) {
                          if (currentLine.length + word.length + 1 > maxLineLength && currentLine.length > 0) {
                            lines.push(currentLine.trim())
                            currentLine = word
                          }
                          else {
                            currentLine += (currentLine ? ' ' : '') + word
                          }
                        }
                        if (currentLine) {
                          lines.push(currentLine.trim())
                        }

                        return lines.map((line, lineIndex) => (
                          <div key={lineIndex} style={{ display: 'block' }}>
                            {line.split('').map((char, _charIndex) => {
                              const globalIndex = globalCharIndex++
                              return (
                                <span
                                  key={globalIndex}
                                  className={`question-char char-${globalIndex}`}
                                  style={{ opacity: 0, visibility: 'hidden' }}
                                >
                                  {char === ' ' ? '\u00A0' : char}
                                </span>
                              )
                            })}
                          </div>
                        ))
                      })()}
                    </div>
                  </div>
                </div>

                <div
                  className="answer-container"
                  style={{
                    position: 'absolute',
                    top: '150px',
                    left: '150px',
                    margin: '0 auto',
                    display: 'flex',
                    height: '75%',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    right: '60px',
                  }}
                >
                  {answerLines.map((line, index) => (
                    <div
                      key={index}
                      className="answer-line"
                      style={{
                        color: '#000000',
                        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                        fontSize: '58px',
                        fontWeight: '600',
                        lineHeight: '1.2',
                        textShadow: '0 2px 4px rgba(255, 255, 255, 0.8)',
                        marginBottom: '12px',
                        marginTop: line.isNewParagraph ? '48px' : (line.isAfterLineBreak ? '36px' : '0'),
                      }}
                    >
                      {line.text}
                    </div>
                  ))}
                </div>

                <div
                  className="cta-container"
                  style={{
                    position: 'absolute',
                    bottom: '200px',
                    left: '80px',
                    right: '80px',
                    textAlign: 'center',
                  }}
                >
                  <div
                    style={{
                      color: '#ffffff',
                      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                      fontSize: '48px',
                      fontWeight: 'bold',
                      textShadow: '0 4px 8px rgba(0, 0, 0, 0.5)',
                      marginBottom: '24px',
                    }}
                  >
                    Ask me anything at
                  </div>
                  <div
                    style={{
                      color: '#ffffff',
                      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                      fontSize: '64px',
                      fontWeight: 'bold',
                      textShadow: '0 4px 8px rgba(0, 0, 0, 0.5)',
                      textDecoration: 'underline',
                    }}
                  >
                    roe.dev/ama
                  </div>
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
