/**
 * LinkedIn OAuth Token Generator
 *
 * This script helps you generate a LinkedIn access token with the proper scopes
 * for posting content. LinkedIn access tokens are valid for 60 days and must be
 * refreshed manually through re-authorization.
 *
 * Prerequisites:
 * 1. Create an app in LinkedIn Developers Portal (https://www.linkedin.com/developers/)
 * 2. Add the following redirect URI: http://localhost:8080/callback
 * 3. Enable the required scopes in your app settings:
 *    - openid (Use your name and photo)
 *    - profile (Use your name and photo)
 *    - email (Use the primary email address)
 *    - w_member_social (Create, modify, and delete posts on your behalf)
 * 4. Get your Client ID and Client Secret
 *
 * Usage:
 *   node scripts/linkedin-auth.ts
 *   node scripts/linkedin-auth.ts --client-id YOUR_CLIENT_ID --client-secret YOUR_CLIENT_SECRET
 *   node scripts/linkedin-auth.ts test YOUR_ACCESS_TOKEN
 *
 * Environment variables (alternative to command line args):
 *   LINKEDIN_CLIENT_ID=your_client_id
 *   LINKEDIN_CLIENT_SECRET=your_client_secret
 */

import { createServer } from 'node:http'
import { spawn } from 'node:child_process'
import { parse } from 'node:url'
import process from 'node:process'
import { randomBytes } from 'node:crypto'
import { defineCommand, runMain } from 'citty'

// Required LinkedIn API scopes
// Note: These scopes must be enabled in your LinkedIn app settings
const SCOPES = [
  'openid',
  'profile',
  'email',
  'w_member_social',
] as const

const REDIRECT_URI = 'http://localhost:8080/callback'
const PORT = 8080

interface LinkedInTokenResponse {
  access_token: string
  token_type: string
  expires_in: number
  scope: string
}

interface LinkedInProfile {
  sub: string
  name: string
  email: string
  picture?: string
}

interface AuthOptions {
  clientId?: string
  clientSecret?: string
}

class LinkedInAuthGenerator {
  private clientId: string
  private clientSecret: string
  private state: string

  constructor (options: AuthOptions = {}) {
    this.clientId = options.clientId || process.env.LINKEDIN_CLIENT_ID!
    this.clientSecret = options.clientSecret || process.env.LINKEDIN_CLIENT_SECRET!

    if (!this.clientId || !this.clientSecret) {
      console.error('❌ Missing LinkedIn credentials!')
      console.error('Please provide via command line or environment variables:')
      console.error('  --client-id YOUR_CLIENT_ID --client-secret YOUR_CLIENT_SECRET')
      console.error('Or set environment variables:')
      console.error('  LINKEDIN_CLIENT_ID=your_client_id')
      console.error('  LINKEDIN_CLIENT_SECRET=your_client_secret')
      process.exit(1)
    }

    // Generate a random state for CSRF protection
    this.state = randomBytes(32).toString('hex')
  }

  generateAuthUrl (): string {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.clientId,
      redirect_uri: REDIRECT_URI,
      scope: SCOPES.join(' '),
      state: this.state,
    })

    return `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`
  }

  async exchangeCodeForTokens (code: string, state: string): Promise<LinkedInTokenResponse> {
    // Verify state parameter
    if (state !== this.state) {
      throw new Error('Invalid state parameter - potential CSRF attack')
    }

    const tokenUrl = 'https://www.linkedin.com/oauth/v2/accessToken'
    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: REDIRECT_URI,
      client_id: this.clientId,
      client_secret: this.clientSecret,
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

      return await response.json() as LinkedInTokenResponse
    }
    catch (error) {
      console.error('❌ Error exchanging code for tokens:', error instanceof Error ? error.message : error)
      throw error
    }
  }

  startServer (): Promise<LinkedInTokenResponse> {
    return new Promise((resolve, reject) => {
      const server = createServer(async (req, res) => {
        const parsedUrl = parse(req.url || '', true)

        if (parsedUrl.pathname === '/callback') {
          const { code, error, error_description, state } = parsedUrl.query

          if (error) {
            res.writeHead(400, { 'Content-Type': 'text/html' })
            res.end(`<h1>Authorization Error</h1><p>${error}: ${error_description}</p>`)
            reject(new Error(`Authorization error: ${error} - ${error_description}`))
            return
          }

          if (code && state && typeof code === 'string' && typeof state === 'string') {
            try {
              const tokens = await this.exchangeCodeForTokens(code, state)

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

  async generateTokens (): Promise<LinkedInTokenResponse> {
    console.log('🔗 LinkedIn Access Token Generator')
    console.log('==================================\n')

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

      // Try to open the URL automatically
      try {
        const opener = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open'
        spawn(opener, [authUrl], { detached: true, stdio: 'ignore' }).unref()
      }
      catch {
        console.log('ℹ️ Could not open browser automatically')
      }

      console.log('⏳ Waiting for authorization...')
      const tokens = await serverPromise

      return tokens
    }
    catch (error) {
      console.error('❌ Authorization failed:', error instanceof Error ? error.message : error)
      throw error
    }
  }

  displayResults (tokens: LinkedInTokenResponse): void {
    console.log('\n🎉 Success! Here are your LinkedIn tokens:')
    console.log('==========================================\n')

    console.log('📋 Copy this to your environment variables:')
    console.log('```bash')
    console.log(`export NUXT_LINKEDIN_ACCESS_TOKEN="${tokens.access_token}"`)
    console.log('```\n')

    console.log('Or add to your .env file:')
    console.log('```env')
    console.log(`NUXT_LINKEDIN_ACCESS_TOKEN=${tokens.access_token}`)
    console.log('```\n')

    if (tokens.expires_in) {
      const expiryDate = new Date(Date.now() + (tokens.expires_in * 1000))
      console.log(`⏰ Access token expires: ${expiryDate.toLocaleString()}`)
      console.log('⚠️ LinkedIn tokens typically expire in 60 days')
    }

    console.log('\n📝 Important Notes:')
    console.log('• LinkedIn does not provide refresh tokens for most applications')
    console.log('• You will need to re-run this script when the token expires')
    console.log('• Consider setting up a calendar reminder for token renewal')

    console.log('\n🔄 To generate a new token when this expires:')
    console.log('node scripts/linkedin-auth.ts')
  }

  async testToken (accessToken: string): Promise<boolean> {
    console.log('\n🧪 Testing access token...')

    try {
      // Using OpenID Connect userinfo endpoint
      const response = await fetch('https://api.linkedin.com/v2/userinfo', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`API test failed: ${response.status} ${response.statusText}`)
      }

      const profile = await response.json() as LinkedInProfile
      console.log('✅ Token is valid!')
      console.log(`👤 Authenticated as: ${profile.name}${profile.email ? ` (${profile.email})` : ''}`)

      return true
    }
    catch (error) {
      console.error('❌ Token test failed:', error instanceof Error ? error.message : error)
      return false
    }
  }
}

const main = defineCommand({
  meta: {
    name: 'linkedin-auth',
    version: '1.0.0',
    description: 'LinkedIn OAuth Token Generator',
  },
  args: {
    'client-id': {
      type: 'string',
      description: 'LinkedIn app client ID',
    },
    'client-secret': {
      type: 'string',
      description: 'LinkedIn app client secret',
    },
  },
  subCommands: {
    generate: defineCommand({
      meta: {
        name: 'generate',
        description: 'Generate a new LinkedIn access token',
      },
      args: {
        'client-id': {
          type: 'string',
          description: 'LinkedIn app client ID',
        },
        'client-secret': {
          type: 'string',
          description: 'LinkedIn app client secret',
        },
      },
      async run ({ args }) {
        const generator = new LinkedInAuthGenerator({
          clientId: typeof args['client-id'] === 'string' ? args['client-id'] : undefined,
          clientSecret: typeof args['client-secret'] === 'string' ? args['client-secret'] : undefined,
        })

        try {
          const tokens = await generator.generateTokens()
          if (!tokens) {
            console.error('❌ Failed to generate tokens')
            process.exit(1)
          }

          generator.displayResults(tokens)

          // Test the token
          await generator.testToken(tokens.access_token)
        }
        catch (error: any) {
          console.error('❌ Failed to generate tokens:', error.message)
          process.exit(1)
        }
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
