#!/usr/bin/env node

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
 *   node scripts/youtube-auth.js
 *
 * Or with credentials file path:
 *   node scripts/youtube-auth.js ./path/to/credentials.json
 *
 * To refresh an existing token:
 *   node scripts/youtube-auth.js --refresh "your_refresh_token"
 */

import { createServer } from 'node:http'
import { parse } from 'node:url'
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

// Required YouTube API scopes
const SCOPES = [
  'https://www.googleapis.com/auth/youtube', // Video upload
  'https://www.googleapis.com/auth/youtube.force-ssl', // Playlist management
]

const REDIRECT_URI = 'http://localhost:8080/callback'
const PORT = 8080

class YouTubeAuthGenerator {
  constructor (credentialsPath) {
    this.credentialsPath = credentialsPath || this.findCredentialsFile()
    this.credentials = this.loadCredentials()
  }

  findCredentialsFile () {
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

  loadCredentials () {
    try {
      const content = readFileSync(this.credentialsPath, 'utf8')
      const data = JSON.parse(content)

      // Handle both direct credentials and wrapped format
      const creds = data.installed || data.web || data

      if (!creds.client_id || !creds.client_secret) {
        throw new Error('Missing client_id or client_secret in credentials file')
      }

      return creds
    }
    catch (error) {
      console.error('❌ Error loading credentials:', error.message)
      process.exit(1)
    }
  }

  generateAuthUrl () {
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

  async exchangeCodeForTokens (code) {
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
      console.error('❌ Error exchanging code for tokens:', error.message)
      throw error
    }
  }

  async refreshAccessToken (refreshToken) {
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

      return await response.json()
    }
    catch (error) {
      console.error('❌ Error refreshing token:', error.message)
      throw error
    }
  }

  startServer () {
    return new Promise((resolve, reject) => {
      const server = createServer(async (req, res) => {
        const parsedUrl = parse(req.url, true)

        if (parsedUrl.pathname === '/callback') {
          const { code, error } = parsedUrl.query

          if (error) {
            res.writeHead(400, { 'Content-Type': 'text/html' })
            res.end(`<h1>Authorization Error</h1><p>${error}</p>`)
            reject(new Error(`Authorization error: ${error}`))
            return
          }

          if (code) {
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
              res.end(`<h1>❌ Token Exchange Error</h1><p>${error.message}</p>`)
              reject(error)
            }
          }
        }
        else {
          res.writeHead(404, { 'Content-Type': 'text/plain' })
          res.end('Not found')
        }
      })

      server.listen(PORT, err => {
        if (err) reject(err)
      })
    })
  }

  async generateTokens () {
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
      console.error('❌ Authorization failed:', error.message)
      throw error
    }
  }

  displayResults (tokens) {
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
      console.log(`node scripts/youtube-auth.js --refresh "${tokens.refresh_token}"`)
      console.log('\n💡 For automatic token refresh in production, set these environment variables:')
      console.log(`NUXT_YOUTUBE_REFRESH_TOKEN=${tokens.refresh_token}`)
      console.log(`NUXT_YOUTUBE_CLIENT_ID=${this.credentials.client_id}`)
      console.log(`NUXT_YOUTUBE_CLIENT_SECRET=${this.credentials.client_secret}`)
    }
  }

  async handleRefreshToken (refreshToken) {
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
      console.error('❌ Failed to refresh token:', error.message)
      console.log('\n💡 You may need to re-authorize the application:')
      console.log('   node scripts/youtube-auth.js')
      process.exit(1)
    }
  }
}

// Main execution
async function main () {
  const args = process.argv.slice(2)

  // Handle refresh token mode
  if (args[0] === '--refresh') {
    if (!args[1]) {
      console.error('❌ Please provide a refresh token: --refresh "your_refresh_token"')
      process.exit(1)
    }

    const generator = new YouTubeAuthGenerator()
    await generator.handleRefreshToken(args[1])
    return
  }

  // Normal authorization flow
  const credentialsPath = args[0]
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
    console.error('❌ Failed to generate tokens:', error.message)
    process.exit(1)
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n👋 Goodbye!')
  process.exit(0)
})

main().catch(console.error)
