import type { IncomingMessage } from 'node:http'
import type { Socket } from 'node:net'
import { defineHooks } from 'crossws'
import nodeAdapter from 'crossws/adapters/node'
import type { NodeAdapter } from 'crossws/adapters/node'
import { createError, defineEventHandler } from 'h3'

import { useParty } from '../../../utils/party'

const hooks = defineHooks({
  open: async peer => (await useParty()).open(peer, new URL(peer.request!.url!)),
  message: async (peer, message) => (await useParty()).message(peer, message.text()),
  close: async peer => (await useParty()).close(peer),
  error: async peer => (await useParty()).close(peer),
})

interface VercelRequestContext {
  upgradeWebSocket?: () => { req: IncomingMessage, socket: Socket, head: Buffer }
}

/**
 * Vercel Functions expose WebSocket upgrades through the request context
 * rather than the HTTP server's `upgrade` event, which the Nitro v2 Vercel
 * preset does not wire up. In development, Nitro handles the upgrade with
 * `hooks` directly.
 *
 * TODO: remove once the Nitro v2 Vercel preset handles upgrades (nitrojs/nitro#4317 covers v3 only).
 */
function upgradeVercelWebSocket () {
  const store = (globalThis as Record<symbol, { get?: () => VercelRequestContext | undefined } | undefined>)[Symbol.for('@vercel/request-context')]
  return store?.get?.()?.upgradeWebSocket?.()
}

let adapter: NodeAdapter | undefined

export default defineEventHandler({
  websocket: hooks,
  async handler (event) {
    const { req, res } = event.node
    const upgrade = req.headers.upgrade?.toLowerCase() === 'websocket' ? upgradeVercelWebSocket() : undefined
    if (!upgrade) {
      throw createError({ statusCode: 426, statusMessage: 'Upgrade Required' })
    }
    adapter ||= nodeAdapter({ hooks })
    await adapter.handleUpgrade(upgrade.req, upgrade.socket, upgrade.head)
    if (!res.headersSent && !res.writableEnded) {
      res.statusCode = 204
      res.end()
    }
  },
})
