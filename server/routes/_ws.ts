import { getRoom, getCount, getStatus, setCount, broadcastConnections, broadcastCount } from '../utils/websocket-rooms'

// Store peer to room mapping
const peerRooms = new WeakMap<any, string>()

export default defineWebSocketHandler({
  async open (peer) {
    const roomId = 'site'

    // Store room ID for this peer
    peerRooms.set(peer, roomId)

    const room = getRoom(roomId)
    room.connections.add(peer)

    // Send current vote count
    peer.send(`count:${await getCount(roomId)}`)

    // Let everyone know someone new is viewing the site
    await broadcastConnections(roomId, room.connections.size)

    // Let people know if I'm streaming
    const status = await getStatus(roomId)
    peer.send(`status:${status}`)

    console.log(`[ws] open: room=${roomId}, connections=${room.connections.size}`)
  },

  async message (peer, message) {
    const messageStr = message.text()
    const roomId = peerRooms.get(peer) || 'site'

    console.log(`[ws] message: room=${roomId}, message=${messageStr}`)

    // Handle clearing votes from slide deck
    if (messageStr === 'clear') {
      await setCount(roomId, 0)
      await broadcastCount(roomId, 0)
    }
  },

  async close (peer, _details) {
    const roomId = peerRooms.get(peer)
    if (roomId) {
      const room = getRoom(roomId)
      room.connections.delete(peer)

      // Update connection count
      await broadcastConnections(roomId, room.connections.size)

      // Clean up peer room mapping
      peerRooms.delete(peer)

      console.log(`[ws] close: room=${roomId}, connections=${room.connections.size}`)
    }
  },

  async error (peer, error) {
    console.error('[ws] error:', error)
  },
})
