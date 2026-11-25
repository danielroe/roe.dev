import { defineWebSocketHandler } from 'nitro/h3'

import { useParty } from '../../../utils/party'

export default defineWebSocketHandler({
  open: async peer => (await useParty()).open(peer, new URL(peer.request.url)),
  message: async (peer, message) => (await useParty()).message(peer, message.text()),
  close: async peer => (await useParty()).close(peer),
  error: async peer => (await useParty()).close(peer),
})
