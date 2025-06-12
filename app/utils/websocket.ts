import { parseMessage, type WebSocketMessage, type ParseResultOrError } from '#shared/utils/websocket-messages'

export interface WebSocketConfig {
  /** WebSocket endpoint path (e.g., '_ws', 'voting/_ws') */
  endpoint: string
  /** Host override (defaults to current host or environment) */
  host?: string
  /** Typed message handler for parsed messages */
  onParsedMessage?: (message: WebSocketMessage) => void
  onOpen?: () => void
  onClose?: () => void
  onError?: (error: Event) => void
  onParseError?: (error: ParseResultOrError<never>) => void
  /** Auto-reconnect on close (default: false) */
  autoReconnect?: boolean
  /** Reconnect delay in milliseconds (default: 1000) */
  reconnectDelay?: number
}

export class WebSocketConnection {
  private websocket: WebSocket | null = null
  private isConnecting = false
  private reconnectTimeout: NodeJS.Timeout | null = null
  private config: Required<WebSocketConfig>

  constructor (config: WebSocketConfig) {
    this.config = {
      host: this.getDefaultHost(),
      onParsedMessage: () => {},
      onOpen: () => {},
      onClose: () => {},
      onError: () => {},
      onParseError: () => {},
      autoReconnect: false,
      reconnectDelay: 1000,
      ...config,
    }
  }

  private getDefaultHost (): string {
    if (import.meta.server) return 'localhost:3000'

    // Client-side logic
    const envHost = import.meta.env?.VITE_PUBLIC_PARTYKIT_SERVER
    if (envHost) return envHost

    return import.meta.dev ? 'localhost:3000' : window.location.host
  }

  private get wsUrl (): string {
    const protocol = this.config.host.startsWith('localhost') ? 'ws:' : 'wss:'
    return `${protocol}//${this.config.host}/${this.config.endpoint}`
  }

  connect (): void {
    if (this.websocket?.readyState === WebSocket.OPEN || this.isConnecting || import.meta.test) {
      return
    }

    this.isConnecting = true
    this.websocket = new WebSocket(this.wsUrl)

    this.websocket.onopen = () => {
      this.isConnecting = false
      console.log(`[ws] connected to ${this.config.endpoint}`)
      this.config.onOpen()
    }

    this.websocket.onmessage = event => {
      // Try to parse and call the typed handler
      if (this.config.onParsedMessage) {
        const result = parseMessage(event.data as string)
        if (result.success) {
          this.config.onParsedMessage(result.data)
        }
        else if (this.config.onParseError) {
          this.config.onParseError(result)
        }
      }
    }

    this.websocket.onclose = () => {
      this.isConnecting = false
      console.log(`[ws] disconnected from ${this.config.endpoint}`)
      this.config.onClose()

      // Attempt to reconnect if enabled
      if (this.config.autoReconnect) {
        this.reconnectTimeout = setTimeout(() => {
          this.connect()
        }, this.config.reconnectDelay)
      }
    }

    this.websocket.onerror = error => {
      console.error(`[ws] error on ${this.config.endpoint}:`, error)
      this.isConnecting = false
      this.config.onError(error)
    }
  }

  send (message: string): boolean {
    if (this.websocket?.readyState === WebSocket.OPEN) {
      this.websocket.send(message)
      return true
    }
    return false
  }

  disconnect (): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
      this.reconnectTimeout = null
    }

    if (this.websocket) {
      this.websocket.close()
      this.websocket = null
    }
  }

  get readyState (): number | undefined {
    return this.websocket?.readyState
  }

  get isOpen (): boolean {
    return this.websocket?.readyState === WebSocket.OPEN
  }
}

export function createWebSocket (config: WebSocketConfig): WebSocketConnection {
  return new WebSocketConnection(config)
}
