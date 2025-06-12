import { serialize } from '#shared/utils/websocket-messages'

interface RoomData {
  connections: Set<any>
}

// In-memory storage for WebSocket connections (these can't be persisted)
const rooms = new Map<string, RoomData>()

export function getRoom (roomId: string): RoomData {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, {
      connections: new Set(),
    })
  }
  return rooms.get(roomId)!
}

export async function getCount (roomId: string): Promise<number> {
  const storage = useStorage('ws')
  const count = await storage.getItem(`${roomId}:count`)
  return typeof count === 'number' ? count : 0
}

export async function setCount (roomId: string, count: number): Promise<void> {
  const storage = useStorage('ws')
  await storage.setItem(`${roomId}:count`, count)
}

export async function getStatus (roomId: string): Promise<string> {
  const storage = useStorage('ws')
  const status = await storage.getItem(`${roomId}:status`)
  return typeof status === 'string' ? status : 'default'
}

export async function setStatus (roomId: string, status: string): Promise<void> {
  const storage = useStorage('ws')
  await storage.setItem(`${roomId}:status`, status)
}

export async function getFeedback (roomId: string): Promise<string[]> {
  const storage = useStorage('ws')
  const feedback = await storage.getItem(`${roomId}:feedback`)
  return Array.isArray(feedback) ? feedback : []
}

export async function setFeedback (roomId: string, feedback: string[]): Promise<void> {
  const storage = useStorage('ws')
  await storage.setItem(`${roomId}:feedback`, feedback)
}

export async function getReactions (roomId: string): Promise<string[]> {
  const storage = useStorage('ws')
  const reactions = await storage.getItem(`${roomId}:reactions`)
  return Array.isArray(reactions) ? reactions : []
}

export async function setReactions (roomId: string, reactions: string[]): Promise<void> {
  const storage = useStorage('ws')
  await storage.setItem(`${roomId}:reactions`, reactions)
}

export async function getVotes (roomId: string): Promise<Record<string, number>> {
  const storage = useStorage('ws')
  const votes = await storage.getItem(`${roomId}:votes`)
  return typeof votes === 'object' && votes !== null ? votes as Record<string, number> : {}
}

export async function setVotes (roomId: string, votes: Record<string, number>): Promise<void> {
  const storage = useStorage('ws')
  await storage.setItem(`${roomId}:votes`, votes)
}

export async function incrementVote (roomId: string, optionId: string): Promise<Record<string, number>> {
  const votes = await getVotes(roomId)
  votes[optionId] = (votes[optionId] || 0) + 1
  await setVotes(roomId, votes)
  return votes
}

export async function broadcast (roomId: string, message: string, excludePeer?: any) {
  const room = getRoom(roomId)
  for (const peer of room.connections) {
    if (peer !== excludePeer) {
      peer.send(message)
    }
  }
}

/**
 * Convenience functions using shared message serialization
 */
export async function broadcastConnections (roomId: string, count: number, excludePeer?: any) {
  await broadcast(roomId, serialize.connections(count), excludePeer)
}

export async function broadcastStatus (roomId: string, status: string, excludePeer?: any) {
  await broadcast(roomId, serialize.status(status), excludePeer)
}

export async function broadcastVotes (roomId: string, slug: string, count: number, excludePeer?: any) {
  await broadcast(roomId, serialize.votes(slug, count), excludePeer)
}

export async function broadcastCount (roomId: string, count: number, excludePeer?: any) {
  await broadcast(roomId, serialize.count(count), excludePeer)
}

export async function broadcastFeedback (roomId: string, feedback: string[], excludePeer?: any) {
  await broadcast(roomId, serialize.feedback(feedback), excludePeer)
}

export async function broadcastReaction (roomId: string, emoji: string, excludePeer?: any) {
  await broadcast(roomId, serialize.reaction(emoji), excludePeer)
}

export async function broadcastReactions (roomId: string, reactions: string[], excludePeer?: any) {
  await broadcast(roomId, serialize.reactions(reactions), excludePeer)
}

export async function broadcastClear (roomId: string, excludePeer?: any) {
  await broadcast(roomId, serialize.clear(), excludePeer)
}

export { rooms }
