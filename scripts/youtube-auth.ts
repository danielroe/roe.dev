/**
 * YouTube OAuth Token Generator
 *
 * This script helps you generate a long-lived YouTube refresh token with the proper scopes
 * for uploading videos and managing playlists. The refresh token can be used to automatically
 * generate fresh access tokens without manual intervention.
 *
 * Prerequisites:
 * 1. Create a project in Google Cloud Console
 * 2. Enable YouTube Data API v3
 * 3. Create OAuth 2.0 credentials (Desktop application)
 * 4. Download the credentials JSON file
 *
 * Usage:
 *   node scripts/youtube-auth.ts
 *   node scripts/youtube-auth.ts --credentials ./path/to/credentials.json
 *   node scripts/youtube-auth.ts refresh "your_refresh_token"
 */

import { createServer } from 'node:http'
import { parse } from 'node:url'
import process from 'node:process'
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { defineCommand, runMain } from 'citty'

// Required YouTube API scopes
const SCOPES = [
  'https://www.googleapis.com/auth/youtube', // Video upload
  'https://www.googleapis.com/auth/youtube.force-ssl', // Playlist management
] as const

const REDIRECT_URI = 'http://localhost:8080/callback'
const PORT = 8080

interface YouTubeCredentials {
  client_id: string
  client_secret: string
  redirect_uris?: string[]
}

interface YouTubeTokenResponse {
  access_token: string
  token_type: string
  expires_in: number
  refresh_token?: string
}

interface CredentialsFile {
  installed?: YouTubeCredentials
  web?: YouTubeCredentials
  client_id?: string
  client_secret?: string
}

class YouTubeAuthGenerator {
  private credentialsPath: string
  private credentials: YouTubeCredentials

  constructor (credentialsPath?: string) {
    this.credentialsPath = credentialsPath || this.findCredentialsFile()
    this.credentials = this.loadCredentials()
  }

  findCredentialsFile (): string {
    const possiblePaths = [
      './credentials.json',
      './google-credentials.json',
      './oauth-credentials.json',
      './youtube-credentials.json',
      join(process.env.HOME || '', 'Downloads', 'credentials.json'),
    ]

    for (const path of possiblePaths) {
      if (existsSync(path)) {
        console.log(`Found credentials file: ${path}`)
        return path
      }
    }

    console.error('❌ No credentials file found. Please provide the path as an argument.')
    console.error('Expected file locations:')
    possiblePaths.forEach(path => console.error(`  - ${path}`))
    process.exit(1)
  }

  loadCredentials (): YouTubeCredentials {
    try {
      const content = readFileSync(this.credentialsPath, 'utf8')
      const data: CredentialsFile = JSON.parse(content)

      // Handle both direct credentials and wrapped format
      const creds = data.installed || data.web || data as YouTubeCredentials

      if (!creds.client_id || !creds.client_secret) {
        throw new Error('Missing client_id or client_secret in credentials file')
      }

      return {
        client_id: creds.client_id,
        client_secret: creds.client_secret,
        redirect_uris: creds.redirect_uris,
      }
    }
    catch (error) {
      console.error('❌ Error loading credentials:', error instanceof Error ? error.message : error)
      process.exit(1)
    }
  }

  generateAuthUrl (): string {
    const params = new URLSearchParams({
      client_id: this.credentials.client_id,
      redirect_uri: REDIRECT_URI,
      scope: SCOPES.join(' '),
      response_type: 'code',
      access_type: 'offline', // Important for refresh tokens
      prompt: 'consent', // Force consent to ensure refresh token
    })

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
  }

  async exchangeCodeForTokens (code: string): Promise<YouTubeTokenResponse> {
    const tokenUrl = 'https://oauth2.googleapis.com/token'
    const body = new URLSearchParams({
      client_id: this.credentials.client_id,
      client_secret: this.credentials.client_secret,
      code: code,
      grant_type: 'authorization_code',
      redirect_uri: REDIRECT_URI,
    })

    try {
      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`Token exchange failed: ${response.status} ${error}`)
      }

      return await response.json()
    }
    catch (error) {
      console.error('❌ Error exchanging code for tokens:', error instanceof Error ? error.message : error)
      throw error
    }
  }

  async refreshAccessToken (refreshToken: string): Promise<YouTubeTokenResponse> {
    const tokenUrl = 'https://oauth2.googleapis.com/token'
    const body = new URLSearchParams({
      client_id: this.credentials.client_id,
      client_secret: this.credentials.client_secret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    })

    try {
      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`Token refresh failed: ${response.status} ${error}`)
      }

      return await response.json() as YouTubeTokenResponse
    }
    catch (error) {
      console.error('❌ Error refreshing token:', error instanceof Error ? error.message : error)
      throw error
    }
  }

  startServer (): Promise<YouTubeTokenResponse> {
    return new Promise((resolve, reject) => {
      const server = createServer(async (req, res) => {
        const parsedUrl = parse(req.url || '', true)

        if (parsedUrl.pathname === '/callback') {
          const { code, error } = parsedUrl.query

          if (error) {
            res.writeHead(400, { 'Content-Type': 'text/html' })
            res.end(`<h1>Authorization Error</h1><p>${error}</p>`)
            reject(new Error(`Authorization error: ${error}`))
            return
          }

          if (code && typeof code === 'string') {
            try {
              const tokens = await this.exchangeCodeForTokens(code)

              res.writeHead(200, { 'Content-Type': 'text/html' })
              res.end(`
                <h1>✅ Authorization Successful!</h1>
                <p>You can close this window and return to the terminal.</p>
                <script>setTimeout(() => window.close(), 3000)</script>
              `)

              server.close()
              resolve(tokens)
            }
            catch (error) {
              res.writeHead(500, { 'Content-Type': 'text/html' })
              res.end(`<h1>❌ Token Exchange Error</h1><p>${error instanceof Error ? error.message : error}</p>`)
              reject(error)
            }
          }
        }
        else {
          res.writeHead(404, { 'Content-Type': 'text/plain' })
          res.end('Not found')
        }
      })

      server.listen(PORT, (err?: Error) => {
        if (err) reject(err)
      })
    })
  }

  async generateTokens (): Promise<YouTubeTokenResponse> {
    console.log('🔐 YouTube Access Token Generator')
    console.log('================================\n')

    console.log('Required scopes:')
    SCOPES.forEach(scope => console.log(`  ✓ ${scope}`))
    console.log()

    console.log('🌐 Starting local server for OAuth callback...')

    try {
      const serverPromise = this.startServer()
      const authUrl = this.generateAuthUrl()

      console.log('🚀 Please visit the following URL to authorize the application:')
      console.log(`\n${authUrl}\n`)
      console.log('💡 This should open automatically in your browser...')

      console.log('⏳ Waiting for authorization...')
      const tokens = await serverPromise

      return tokens
    }
    catch (error) {
      console.error('❌ Authorization failed:', error instanceof Error ? error.message : error)
      throw error
    }
  }

  displayResults (tokens: YouTubeTokenResponse): void {
    console.log('\n🎉 Success! Here are your tokens:')
    console.log('=====================================\n')

    console.log('📋 Copy these to your environment variables:')
    console.log('```bash')
    console.log(`export NUXT_YOUTUBE_ACCESS_TOKEN="${tokens.access_token}"`)
    if (tokens.refresh_token) {
      console.log(`export NUXT_YOUTUBE_REFRESH_TOKEN="${tokens.refresh_token}"`)
      console.log(`export NUXT_YOUTUBE_CLIENT_ID="${this.credentials.client_id}"`)
      console.log(`export NUXT_YOUTUBE_CLIENT_SECRET="${this.credentials.client_secret}"`)
    }
    console.log('```\n')

    console.log('Or add to your .env file:')
    console.log('```env')
    console.log(`NUXT_YOUTUBE_ACCESS_TOKEN=${tokens.access_token}`)
    if (tokens.refresh_token) {
      console.log(`NUXT_YOUTUBE_REFRESH_TOKEN=${tokens.refresh_token}`)
      console.log(`NUXT_YOUTUBE_CLIENT_ID=${this.credentials.client_id}`)
      console.log(`NUXT_YOUTUBE_CLIENT_SECRET=${this.credentials.client_secret}`)
    }
    console.log('```\n')

    if (tokens.expires_in) {
      const expiryDate = new Date(Date.now() + (tokens.expires_in * 1000))
      console.log(`⏰ Access token expires: ${expiryDate.toLocaleString()}`)
      if (tokens.refresh_token) {
        console.log('✅ Refresh token provided for automatic renewal')
      }
    }

    console.log('\n📝 Save the refresh token securely - you can use it to generate new access tokens!')

    if (tokens.refresh_token) {
      console.log('\n🔄 To refresh your access token later, you can use:')
      console.log(`node scripts/youtube-auth.ts --refresh "${tokens.refresh_token}"`)
      console.log('\n💡 For automatic token refresh in production, set these environment variables:')
      console.log(`NUXT_YOUTUBE_REFRESH_TOKEN=${tokens.refresh_token}`)
      console.log(`NUXT_YOUTUBE_CLIENT_ID=${this.credentials.client_id}`)
      console.log(`NUXT_YOUTUBE_CLIENT_SECRET=${this.credentials.client_secret}`)
    }
  }

  async handleRefreshToken (refreshToken: string): Promise<void> {
    console.log('🔄 Refreshing access token...')

    try {
      const tokens = await this.refreshAccessToken(refreshToken)

      console.log('\n🎉 Token refreshed successfully!')
      console.log('=====================================\n')

      console.log('📋 New access token:')
      console.log('```bash')
      console.log(`export NUXT_YOUTUBE_ACCESS_TOKEN="${tokens.access_token}"`)
      console.log('```\n')

      if (tokens.expires_in) {
        const expiryDate = new Date(Date.now() + (tokens.expires_in * 1000))
        console.log(`⏰ New token expires: ${expiryDate.toLocaleString()}`)
      }
    }
    catch (error) {
      console.error('❌ Failed to refresh token:', error instanceof Error ? error.message : error)
      console.log('\n💡 You may need to re-authorize the application:')
      console.log('   node scripts/youtube-auth.ts')
      process.exit(1)
    }
  }
}

const main = defineCommand({
  meta: {
    name: 'youtube-auth',
    version: '1.0.0',
    description: 'YouTube OAuth Token Generator',
  },
  args: {
    credentials: {
      type: 'positional',
      description: 'Path to credentials JSON file',
      required: false,
    },
  },
  subCommands: {
    generate: defineCommand({
      meta: {
        name: 'generate',
        description: 'Generate new YouTube access and refresh tokens',
      },
      args: {
        credentials: {
          type: 'positional',
          description: 'Path to credentials JSON file',
          required: false,
        },
      },
      async run ({ args }) {
        const credentialsPath = typeof args.credentials === 'string' ? args.credentials : undefined
        const generator = new YouTubeAuthGenerator(credentialsPath)

        try {
          const tokens = await generator.generateTokens()
          if (!tokens) {
            console.error('❌ Failed to generate tokens')
            process.exit(1)
          }
          generator.displayResults(tokens)
        }
        catch (error) {
          console.error('❌ Failed to generate tokens:', error instanceof Error ? error.message : error)
          process.exit(1)
        }
      },
    }),
    refresh: defineCommand({
      meta: {
        name: 'refresh',
        description: 'Refresh an existing access token',
      },
      args: {
        token: {
          type: 'positional',
          description: 'Refresh token to use',
          required: true,
        },
      },
      async run ({ args }) {
        if (typeof args.token !== 'string') {
          console.error('❌ Please provide a refresh token: youtube-auth refresh "your_refresh_token"')
          process.exit(1)
        }

        const generator = new YouTubeAuthGenerator()
        await generator.handleRefreshToken(args.token)
      },
    }),
  },
})

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n👋 Goodbye!')
  process.exit(0)
})

runMain(main)
