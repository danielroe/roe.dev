import type { ObjectInputProps, ObjectSchemaType } from 'sanity'
import { PatchEvent, set, unset } from 'sanity'
import { useState, useCallback, useEffect } from 'react'
import { Card, Text, Autocomplete, Box, Button, Flex, Spinner } from '@sanity/ui'
import { SearchIcon, LinkIcon } from '@sanity/icons'

interface GitHubRepo {
  id: number
  name: string
  full_name: string
  description: string | null
  html_url: string
  stargazers_count: number
  language: string | null
  updated_at: string
  owner: {
    login: string
    avatar_url: string
  }
  private: boolean
  value: string // Required for Autocomplete
}

interface GitHubRepoValue {
  owner: string
  name: string
  url: string
  lastUpdated: string
}

interface GitHubRepoStatsProps {
  owner: string
  name: string
}

function GitHubRepoStats ({ owner, name }: GitHubRepoStatsProps) {
  const [stats, setStats] = useState<{ stars?: number, language?: string } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      if (!GITHUB_TOKEN) {
        setLoading(false)
        return
      }

      try {
        const response = await fetch(`https://api.github.com/repos/${owner}/${name}`, {
          headers: {
            Authorization: `Bearer ${GITHUB_TOKEN}`,
            Accept: 'application/vnd.github.v3+json',
          },
        })

        if (response.ok) {
          const data = await response.json()
          setStats({
            stars: data.stargazers_count,
            language: data.language,
          })
        }
      }
      catch (error) {
        console.warn('Failed to fetch GitHub stats:', error)
      }
      finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [owner, name])

  if (loading) {
    return (
      <Flex align="center" gap={1}>
        <Spinner muted size={0} />
        <Text size={1} muted>Loading stats...</Text>
      </Flex>
    )
  }

  if (!stats) {
    return <Text size={1} muted>GitHub Repository</Text>
  }

  return (
    <Text size={1} muted>
      {stats.language && `${stats.language} • `}
      ⭐️
      {' '}
      {stats.stars?.toLocaleString() || 0}
    </Text>
  )
}

type GitHubSearchInputProps = ObjectInputProps<GitHubRepoValue, ObjectSchemaType>

// You'll need to get this from your environment/config
const GITHUB_TOKEN = process.env.SANITY_STUDIO_GITHUB_TOKEN

export function GitHubSearchInput (props: GitHubSearchInputProps) {
  const { value, onChange } = props
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [options, setOptions] = useState<GitHubRepo[]>([])
  const [error, setError] = useState<string | null>(null)

  const searchRepositories = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim() || !GITHUB_TOKEN) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(
        `https://api.github.com/search/repositories?q=${encodeURIComponent(searchQuery)}&per_page=10&sort=stars&order=desc`,
        {
          headers: {
            Authorization: `Bearer ${GITHUB_TOKEN}`,
            Accept: 'application/vnd.github.v3+json',
          },
        },
      )

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.statusText}`)
      }

      const data = await response.json()
      const repos = (data.items || []).map((repo: any) => ({
        ...repo,
        value: repo.full_name || `${repo.owner.login}/${repo.name}`,
      }))
      setOptions(repos)
    }
    catch (err) {
      console.error('GitHub search error:', err)
      setError(err instanceof Error ? err.message : 'Search failed')
      setOptions([])
    }
    finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (query) {
        searchRepositories(query)
      }
      else {
        setOptions([])
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [query, searchRepositories])

  const handleSelect = useCallback((repoValue: string) => {
    const repo = options.find(r => r.value === repoValue)
    if (!repo) return

    const repoData: GitHubRepoValue = {
      owner: repo.owner.login,
      name: repo.name,
      url: repo.html_url,
      lastUpdated: repo.updated_at,
    }

    onChange(PatchEvent.from(set(repoData)))
  }, [onChange, options])

  const handleClear = useCallback(() => {
    onChange(PatchEvent.from(unset()))
    setQuery('')
  }, [onChange])

  const handleQueryChange = useCallback((newQuery: string | null) => {
    setQuery(newQuery || '')
  }, [])

  const renderOption = useCallback((option: any) => {
    const repo = option as GitHubRepo
    return (
      <Card key={repo.id} padding={3} tone="default">
        <Flex align="center" gap={3}>
          <Box>
            <img
              src={repo.owner.avatar_url}
              alt={repo.owner.login}
              width={24}
              height={24}
              style={{ borderRadius: '50%' }}
            />
          </Box>
          <Box flex={1}>
            <Text weight="medium" size={1}>
              {repo.full_name}
            </Text>
            {repo.description && (
              <Box marginTop={2}>
                <Text size={1} muted>
                  {repo.description.slice(0, 80)}
                  {repo.description.length > 80 ? '...' : ''}
                </Text>
              </Box>
            )}
            <Box marginTop={2}>
              <Text size={0} muted>
                {repo.language && `${repo.language} • `}
                ⭐
                {' '}
                {repo.stargazers_count.toLocaleString()}
                {repo.private && ' • 🔒 Private'}
              </Text>
            </Box>
          </Box>
        </Flex>
      </Card>
    )
  }, [])

  return (
    <Box>
      {!GITHUB_TOKEN && (
        <Card tone="caution" padding={3} marginBottom={3}>
          <Text size={1}>
            ⚠️ GitHub token not configured. Set SANITY_STUDIO_GITHUB_TOKEN to enable repository search.
          </Text>
        </Card>
      )}

      {value
        ? (
            <Card padding={3} tone="positive" border>
              <Flex align="center" justify="space-between">
                <Box flex={1}>
                  <Text weight="medium">
                    {value.owner}
                    /
                    {value.name}
                  </Text>
                  <Box marginTop={3}>
                    <GitHubRepoStats owner={value.owner} name={value.name} />
                  </Box>
                </Box>
                <Flex gap={2}>
                  <Button
                    mode="ghost"
                    tone="default"
                    icon={LinkIcon}
                    onClick={() => window.open(value.url, '_blank')}
                    title="Open on GitHub"
                  />
                  <Button
                    mode="ghost"
                    tone="critical"
                    text="Remove"
                    onClick={handleClear}
                  />
                </Flex>
              </Flex>
            </Card>
          )
        : (
            <Autocomplete
              id="github-repo-search"
              fontSize={2}
              icon={SearchIcon}
              loading={loading}
              openButton
              options={options}
              placeholder="Search GitHub repositories..."
              onQueryChange={handleQueryChange}
              onSelect={handleSelect}
              renderOption={renderOption}
              filterOption={() => true} // We handle filtering on the server
            />
          )}

      {error && (
        <Card tone="critical" padding={3} marginTop={2}>
          <Text size={1}>
            Error:
            {' '}
            {error}
          </Text>
        </Card>
      )}
    </Box>
  )
}

export default GitHubSearchInput
