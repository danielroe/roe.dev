import { isValidEmoji } from '../../../shared/utils/emoji'
import { getRoom, getCount, setCount, getReactions, setReactions, broadcastCount, broadcastReaction } from '../../utils/websocket-rooms'

// Store peer to room mapping
const peerRooms = new WeakMap<any, string>()

export default defineWebSocketHandler({
  async open (peer) {
    const roomId = 'reactions'

    // Store room ID for this peer
    peerRooms.set(peer, roomId)

    const room = getRoom(roomId)
    room.connections.add(peer)

    // Send current reaction count
    peer.send(`count:${await getCount(roomId)}`)

    console.log(`[ws] open: room=${roomId}, connections=${room.connections.size}`)
  },

  async message (peer, message) {
    const messageStr = message.text()
    const roomId = peerRooms.get(peer) || 'reactions'

    console.log(`[ws] message: room=${roomId}, message=${messageStr}`)

    // Handle clearing votes
    if (messageStr === 'clear') {
      await setCount(roomId, 0)
      await broadcastCount(roomId, 0)
      return
    }

    // Handle reaction messages
    if (messageStr.startsWith('reaction:')) {
      const emoji = messageStr.replace('reaction:', '')

      // Validate emoji
      if (!isValidEmoji(emoji)) {
        return
      }

      // Store the reaction
      const reactions = await getReactions(roomId)
      reactions.push(emoji)
      // Keep only the last 100 reactions
      if (reactions.length > 100) reactions.shift()
      await setReactions(roomId, reactions)

      // Broadcast to all clients
      await broadcastReaction(roomId, emoji)
    }
  },

  async close (peer, _details) {
    const roomId = peerRooms.get(peer)
    if (roomId) {
      const room = getRoom(roomId)
      room.connections.delete(peer)

      // Clean up peer room mapping
      peerRooms.delete(peer)

      console.log(`[ws] close: room=${roomId}, connections=${room.connections.size}`)
    }
  },

  async error (peer, error) {
    console.error('[ws] error:', error)
  },
})
