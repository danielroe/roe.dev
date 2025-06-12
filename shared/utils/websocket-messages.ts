interface ConnectionsMessage {
  type: 'connections'
  payload: number
}

interface StatusMessage {
  type: 'status'
  payload: 'live' | 'default' | string
}

interface VotesMessage {
  type: 'votes'
  payload: {
    slug: string
    count: number
  }
}

interface CountMessage {
  type: 'count'
  payload: number
}

interface FeedbackMessage {
  type: 'feedback'
  payload: string[]
}

interface ReactionMessage {
  type: 'reaction'
  payload: string
}

interface ReactionsMessage {
  type: 'reactions'
  payload: string[]
}

interface ClearMessage {
  type: 'clear'
  payload: null
}

type WebSocketMessage =
  | ConnectionsMessage
  | StatusMessage
  | VotesMessage
  | CountMessage
  | FeedbackMessage
  | ReactionMessage
  | ReactionsMessage
  | ClearMessage

export function isVotesMessage (msg: unknown): msg is VotesMessage {
  return typeof msg === 'object' && msg !== null
    && 'type' in msg && msg.type === 'votes'
    && 'payload' in msg && typeof msg.payload === 'object'
    && msg.payload !== null && 'slug' in msg.payload && 'count' in msg.payload
}

export function isCountMessage (msg: unknown): msg is CountMessage {
  return typeof msg === 'object' && msg !== null
    && 'type' in msg && msg.type === 'count'
    && 'payload' in msg && typeof msg.payload === 'number'
}

export function isFeedbackMessage (msg: unknown): msg is FeedbackMessage {
  return typeof msg === 'object' && msg !== null
    && 'type' in msg && msg.type === 'feedback'
    && 'payload' in msg && Array.isArray(msg.payload)
}

export function isReactionMessage (msg: unknown): msg is ReactionMessage {
  return typeof msg === 'object' && msg !== null
    && 'type' in msg && msg.type === 'reaction'
    && 'payload' in msg && typeof msg.payload === 'string'
}

export function isReactionsMessage (msg: unknown): msg is ReactionsMessage {
  return typeof msg === 'object' && msg !== null
    && 'type' in msg && msg.type === 'reactions'
    && 'payload' in msg && Array.isArray(msg.payload)
}

export const serialize = {
  connections: (count: number): string => `connections:${count}`,
  status: (status: string): string => `status:${status}`,
  votes: (slug: string, count: number): string => `votes:${slug}:${count}`,
  count: (count: number): string => `count:${count}`,
  feedback: (feedback: string[]): string => `feedback:${JSON.stringify(feedback)}`,
  reaction: (emoji: string): string => `reaction:${emoji}`,
  reactions: (reactions: string[]): string => `reactions:${JSON.stringify(reactions)}`,
  clear: (): string => 'clear',
}

interface ParseResult<T extends WebSocketMessage> {
  success: true
  data: T
}

interface ParseError {
  success: false
  error: string
  rawMessage: string
}

type ParseResultOrError<T extends WebSocketMessage> = ParseResult<T> | ParseError

export const parse = {
  connections: (message: string): ParseResultOrError<ConnectionsMessage> => {
    if (!message.startsWith('connections:')) {
      return { success: false, error: 'Invalid connections message format', rawMessage: message }
    }

    const countStr = message.slice('connections:'.length)
    const count = parseInt(countStr, 10)

    if (isNaN(count)) {
      return { success: false, error: 'Invalid count value', rawMessage: message }
    }

    return { success: true, data: { type: 'connections', payload: count } }
  },

  status: (message: string): ParseResultOrError<StatusMessage> => {
    if (!message.startsWith('status:')) {
      return { success: false, error: 'Invalid status message format', rawMessage: message }
    }

    const status = message.slice('status:'.length)
    return { success: true, data: { type: 'status', payload: status } }
  },

  votes: (message: string): ParseResultOrError<VotesMessage> => {
    if (!message.startsWith('votes:')) {
      return { success: false, error: 'Invalid votes message format', rawMessage: message }
    }

    const parts = message.slice('votes:'.length).split(':')
    if (parts.length !== 2) {
      return { success: false, error: 'Invalid votes message structure', rawMessage: message }
    }

    const [slug, countStr] = parts
    const count = parseInt(countStr, 10)

    if (isNaN(count)) {
      return { success: false, error: 'Invalid count value', rawMessage: message }
    }

    return { success: true, data: { type: 'votes', payload: { slug, count } } }
  },

  count: (message: string): ParseResultOrError<CountMessage> => {
    if (!message.startsWith('count:')) {
      return { success: false, error: 'Invalid count message format', rawMessage: message }
    }

    const countStr = message.slice('count:'.length)
    const count = parseInt(countStr, 10)

    if (isNaN(count)) {
      return { success: false, error: 'Invalid count value', rawMessage: message }
    }

    return { success: true, data: { type: 'count', payload: count } }
  },

  feedback: (message: string): ParseResultOrError<FeedbackMessage> => {
    if (!message.startsWith('feedback:')) {
      return { success: false, error: 'Invalid feedback message format', rawMessage: message }
    }

    try {
      const jsonStr = message.slice('feedback:'.length)
      const feedback = JSON.parse(jsonStr)

      if (!Array.isArray(feedback)) {
        return { success: false, error: 'Feedback payload must be an array', rawMessage: message }
      }

      return { success: true, data: { type: 'feedback', payload: feedback } }
    }
    catch (error) {
      return { success: false, error: `JSON parse error: ${error}`, rawMessage: message }
    }
  },

  reaction: (message: string): ParseResultOrError<ReactionMessage> => {
    if (!message.startsWith('reaction:')) {
      return { success: false, error: 'Invalid reaction message format', rawMessage: message }
    }

    const emoji = message.slice('reaction:'.length)
    return { success: true, data: { type: 'reaction', payload: emoji } }
  },

  reactions: (message: string): ParseResultOrError<ReactionsMessage> => {
    if (!message.startsWith('reactions:')) {
      return { success: false, error: 'Invalid reactions message format', rawMessage: message }
    }

    try {
      const jsonStr = message.slice('reactions:'.length)
      const reactions = JSON.parse(jsonStr)

      if (!Array.isArray(reactions)) {
        return { success: false, error: 'Reactions payload must be an array', rawMessage: message }
      }

      return { success: true, data: { type: 'reactions', payload: reactions } }
    }
    catch (error) {
      return { success: false, error: `JSON parse error: ${error}`, rawMessage: message }
    }
  },

  clear: (message: string): ParseResultOrError<ClearMessage> => {
    if (message !== 'clear') {
      return { success: false, error: 'Invalid clear message format', rawMessage: message }
    }

    return { success: true, data: { type: 'clear', payload: null } }
  },
}

export function parseMessage (message: string): ParseResultOrError<WebSocketMessage> {
  const parsers = [
    parse.connections,
    parse.status,
    parse.votes,
    parse.count,
    parse.feedback,
    parse.reaction,
    parse.reactions,
    parse.clear,
  ]

  for (const parser of parsers) {
    const result = parser(message)
    if (result.success) {
      return result
    }
  }

  return { success: false, error: 'Unknown message format', rawMessage: message }
}
