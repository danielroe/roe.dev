import { getRoom, getCount, getFeedback, setFeedback, broadcastFeedback } from '../../utils/websocket-rooms'

// Store peer to room mapping
const peerRooms = new WeakMap<any, string>()

export default defineWebSocketHandler({
  async open (peer) {
    const roomId = 'feedback'

    // Store room ID for this peer
    peerRooms.set(peer, roomId)

    const room = getRoom(roomId)
    room.connections.add(peer)

    // Send current feedback
    const feedback = await getFeedback(roomId)
    await broadcastFeedback(roomId, feedback, peer)

    // Send current count
    peer.send(`count:${await getCount(roomId)}`)

    console.log(`[ws] open: room=${roomId}, connections=${room.connections.size}`)
  },

  async message (peer, message) {
    const messageStr = message.text()
    const roomId = peerRooms.get(peer) || 'feedback'

    console.log(`[ws] message: room=${roomId}, message=${messageStr}`)

    // Handle clearing feedback
    if (messageStr === 'clear') {
      await setFeedback(roomId, [])
      await broadcastFeedback(roomId, [])
      return
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
