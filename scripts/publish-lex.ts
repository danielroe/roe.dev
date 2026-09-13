/**
 * Publish the `dev.roe.*` schemas in `lexicons.ts` to the PDS as
 * `com.atproto.lexicon.schema` records, so third parties can resolve them.
 *
 * `--identity roe.dev` is load-bearing: the authority is the reversed handle,
 * and the account's canonical handle is `danielroe.dev`, which would derive
 * `dev.danielroe`. Both handles resolve to the same DID.
 *
 * Usage:
 *   pnpm lex:publish --dry-run
 *   pnpm lex:publish
 *   pnpm lex:publish --prune
 */
import process from 'node:process'

import { main } from 'airspace/cli'

// The CLI reads `AIRSPACE_APP_PASSWORD`; the site already holds the same app
// password as `NUXT_ATPROTO_PASSWORD`, so it isn't worth a second .env entry.
process.env.AIRSPACE_APP_PASSWORD ||= process.env.NUXT_ATPROTO_PASSWORD

process.exit(await main(['lexicons', 'publish', '--identity', 'roe.dev', ...process.argv.slice(2)]))
