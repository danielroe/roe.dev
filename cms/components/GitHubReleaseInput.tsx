import React, { useCallback, useEffect, useState } from 'react'
import { Box, Button, Flex, Select, Text, useToast } from '@sanity/ui'
import { set, unset } from 'sanity'
import { useSecrets, SettingsView } from '@sanity/studio-secrets'

interface GitHubRelease {
  id: number
  tag_name: string
  name: string
  published_at: string
  draft: boolean
  prerelease: boolean
}

interface GitHubReleaseInputProps {
  elementProps: any
  onChange: (patch: any) => void
  value?: string
  schemaType: any
}

const namespace = 'github'
const secretKeys = [
  {
    key: 'token',
    title: 'GitHub Personal Access Token',
    description: 'Token for accessing GitHub API to fetch releases from danielroe/slides repository. Requires "public_repo" or "repo" permissions.',
  },
]

export function GitHubReleaseInput (props: GitHubReleaseInputProps) {
  const { onChange, value, elementProps } = props
  const [releases, setReleases] = useState<GitHubRelease[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const toast = useToast()
  const { secrets, loading: secretsLoading } = useSecrets(namespace)

  const hasGitHubToken = useCallback((): boolean => {
    return !!secrets && typeof secrets === 'object' && secrets !== null && 'token' in secrets && !!secrets.token
  }, [secrets])

  const fetchReleases = useCallback(async () => {
    const githubToken: string = hasGitHubToken() ? (secrets as any).token : null

    if (!githubToken) {
      if (!secretsLoading) {
        setShowSettings(true)
      }
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Fetch releases from GitHub API using the secret token
      const response = await fetch('https://api.github.com/repos/danielroe/slides/releases', {
        headers: {
          'Authorization': `token ${githubToken}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'roe.dev-cms',
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch releases: ${response.statusText}`)
      }

      const data = await response.json()
      setReleases(data)
    }
    catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch releases'
      setError(errorMessage)
      toast.push({
        status: 'error',
        title: 'Failed to fetch GitHub releases',
        description: errorMessage,
      })
    }
    finally {
      setLoading(false)
    }
  }, [secrets, secretsLoading, toast, hasGitHubToken])

  useEffect(() => {
    fetchReleases()
  }, [fetchReleases])

  const handleChange = useCallback((selectedValue: string) => {
    if (selectedValue) {
      onChange(set(selectedValue))
    }
    else {
      onChange(unset())
    }
  }, [onChange])

  const selectedRelease = releases.find(release => release.tag_name === value)

  // Show settings dialog if no token is configured
  if (showSettings) {
    return (
      <SettingsView
        title="GitHub Configuration"
        namespace={namespace}
        keys={secretKeys}
        onClose={() => {
          setShowSettings(false)
        }}
      />
    )
  }

  return (
    <Box>
      <Flex direction="column" gap={3}>
        <Flex justify="space-between" align="center">
          <Text size={1} weight="semibold">GitHub Release</Text>
          <Flex gap={2}>
            <Button
              text="Settings"
              mode="ghost"
              tone="default"
              fontSize={1}
              onClick={() => setShowSettings(true)}
            />
            <Button
              text="Refresh"
              mode="ghost"
              tone="primary"
              fontSize={1}
              onClick={fetchReleases}
              loading={loading}
            />
          </Flex>
        </Flex>

        {error && (
          <Box padding={3} style={{ backgroundColor: '#fef2f2', borderRadius: '4px' }}>
            <Text size={1} style={{ color: '#dc2626' }}>
              {error}
            </Text>
          </Box>
        )}

        {!hasGitHubToken()
          ? (
              <Box padding={3} style={{ backgroundColor: '#fef3cd', borderRadius: '4px' }}>
                <Text size={1} style={{ color: '#92400e' }}>
                  GitHub token not configured. Click "Settings" to add your token.
                </Text>
              </Box>
            )
          : null}

        <Select
          {...elementProps}
          value={value || ''}
          onChange={event => handleChange(event.currentTarget.value)}
          disabled={loading || !!error || !hasGitHubToken()}
        >
          <option value="">Select a release...</option>
          {releases.map(release => (
            <option key={release.id} value={release.tag_name}>
              {release.name || release.tag_name}
              {release.draft && ' (Draft)'}
              {release.prerelease && ' (Pre-release)'}
              {' - '}
              {new Date(release.published_at).toLocaleDateString()}
            </option>
          ))}
        </Select>

        {selectedRelease && (
          <Box padding={3}>
            <Text size={1}>
              <strong>Selected:</strong>
              {' '}
              {selectedRelease.name || selectedRelease.tag_name}
              <br />
              <strong>Published:</strong>
              {' '}
              {new Date(selectedRelease.published_at).toLocaleDateString()}
              <br />
              <strong>Slides URL:</strong>
              {' '}
              <code>
                /slides/
                {selectedRelease.tag_name}
                .pdf
              </code>
            </Text>
          </Box>
        )}
      </Flex>
    </Box>
  )
}
