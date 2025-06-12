import { getRoom, getVotes, incrementVote, setVotes, broadcastVotes } from '../../utils/websocket-rooms'

// Store peer to multiple rooms mapping
const peerRooms = new WeakMap<any, Set<string>>()

export default defineWebSocketHandler({
  async open (peer) {
    // Initialize empty set of rooms for this peer
    peerRooms.set(peer, new Set())
    console.log('[ws] open: ready for room subscriptions')
  },

  async message (peer, message) {
    const messageStr = message.text()
    console.log(`[ws] message: ${messageStr}`)

    // Handle joining a room
    if (messageStr.startsWith('join:')) {
      const roomId = messageStr.slice(5)
      if (!roomId || !/^[\da-z]+$/.test(roomId)) {
        peer.close(1003, 'Invalid room ID')
        return
      }

      // Add room to peer's subscriptions
      const subscribedRooms = peerRooms.get(peer) || new Set()
      subscribedRooms.add(roomId)
      peerRooms.set(peer, subscribedRooms)

      const room = getRoom(roomId)
      room.connections.add(peer)

      // Send current vote count for this specific room
      const votes = await getVotes(roomId)
      const count = votes[roomId] || 0
      await broadcastVotes(roomId, roomId, count, peer)

      console.log(`[ws] joined room: ${roomId}, peer rooms: ${Array.from(subscribedRooms)}, room connections=${room.connections.size}`)
      return
    }

    // Handle leaving a room
    if (messageStr.startsWith('leave:')) {
      const roomId = messageStr.slice(6)
      const subscribedRooms = peerRooms.get(peer)
      if (subscribedRooms && subscribedRooms.has(roomId)) {
        subscribedRooms.delete(roomId)
        const room = getRoom(roomId)
        room.connections.delete(peer)
        console.log(`[ws] left room: ${roomId}, peer rooms: ${Array.from(subscribedRooms)}, room connections=${room.connections.size}`)
      }
      return
    }

    const subscribedRooms = peerRooms.get(peer)
    if (!subscribedRooms || subscribedRooms.size === 0) {
      peer.close(1003, 'Not subscribed to any rooms')
      return
    }

    // Handle clearing votes - clear all rooms this peer is subscribed to
    if (messageStr === 'clear') {
      for (const roomId of subscribedRooms) {
        await setVotes(roomId, {})
        await broadcastVotes(roomId, roomId, 0)
      }
      return
    }

    // Handle clearing votes for a specific room
    if (messageStr.startsWith('clear:')) {
      const roomId = messageStr.slice(6)
      if (subscribedRooms.has(roomId)) {
        await setVotes(roomId, {})
        await broadcastVotes(roomId, roomId, 0)
      }
      return
    }

    // Handle voting - message format: "vote:roomId:optionId"
    if (messageStr.startsWith('vote:')) {
      const [, roomId, optionId] = messageStr.split(':')
      if (roomId && optionId && subscribedRooms.has(roomId)) {
        const votes = await incrementVote(roomId, optionId)
        const count = votes[roomId] || 0
        await broadcastVotes(roomId, roomId, count)
      }
      return
    }
  },

  async close (peer, _details) {
    const subscribedRooms = peerRooms.get(peer)
    if (subscribedRooms) {
      // Remove peer from all subscribed rooms
      for (const roomId of subscribedRooms) {
        const room = getRoom(roomId)
        room.connections.delete(peer)
        console.log(`[ws] close: removed from room=${roomId}, connections=${room.connections.size}`)
      }
      peerRooms.delete(peer)
    }
  },

  async error (peer, error) {
    console.error('[ws] error:', error)
  },
})
