import { getRoom, getCount, setCount, getVotes, setVotes, incrementVote, broadcast } from '../../utils/websocket-rooms'

// Store peer to room mapping
const peerRooms = new WeakMap<any, string>()

export default defineWebSocketHandler({
  async open (peer) {
    // Extract room ID from URL path - we need to get this from the peer context
    // For now, we'll use a default approach since we can't access the event directly
    // The room ID should be passed via URL query parameter or stored in peer context
    const roomId = 'default' // This will need to be handled differently

    if (!roomId || !/^[\da-z]+$/.test(roomId)) {
      peer.close(1003, 'Invalid room ID')
      return
    }

    // Store room ID for this peer
    peerRooms.set(peer, roomId)

    const room = getRoom(roomId)
    room.connections.add(peer)

    // Send current vote count and votes data
    peer.send(`count:${await getCount(roomId)}`)
    peer.send(`votes:${JSON.stringify(await getVotes(roomId))}`)

    console.log(`[ws] open: room=${roomId}, connections=${room.connections.size}`)
  },

  async message (peer, message) {
    const messageStr = message.text()
    const roomId = peerRooms.get(peer)

    if (!roomId) {
      return
    }

    console.log(`[ws] message: room=${roomId}, message=${messageStr}`)

    // Handle clearing votes
    if (messageStr === 'clear') {
      await setCount(roomId, 0)
      await setVotes(roomId, {})
      await broadcast(roomId, 'count:0')
      await broadcast(roomId, 'votes:{}')
      return
    }

    // Handle voting for a specific option
    if (messageStr.startsWith('vote:')) {
      const optionId = messageStr.slice(5)
      if (optionId) {
        const votes = await incrementVote(roomId, optionId)
        const totalCount = Object.values(votes).reduce((sum, count) => sum + count, 0)
        await setCount(roomId, totalCount)
        await broadcast(roomId, `votes:${JSON.stringify(votes)}`)
        await broadcast(roomId, `count:${totalCount}`)
      }
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
