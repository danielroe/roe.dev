import type { PartyKitRoom, PartyKitServer } from 'partykit/server'

export default {
  async onConnect(ws, room) {
    const set = async (val: number) => {
      await room.storage.put('count', val)
      ws.send(`count:${val}`)
    }

    ws.send(`count:${await get(room)}`)
    ws.addEventListener('message', async ({ data }) => {
      if (data === 'vote') {
        await set((await get(room)) + 1)
      }
      if (data === 'clear') {
        await set(0)
      }
    })
  },
  async onRequest(_, room) {
    const val = (await get(room)) + 1
    await room.storage.put('count', val)
    room.broadcast(`count:${val}`)
    return new Response(null, { status: 204 })
  },
} satisfies PartyKitServer

const get = (room: PartyKitRoom) =>
  room.storage.get<number>('count').then(r => r || 0)
