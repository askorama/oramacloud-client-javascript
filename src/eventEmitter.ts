import type { Message } from './answerSession.js'

type Events = {
  'message-change': (messages: Message[]) => void
  'message-loading': (receivingMessage: boolean) => void
}

export class EventEmitter<T = Events> {
  private events: { [K in keyof T]?: T[K][] } = {}

  on<K extends keyof T>(event: K, listener: T[K]) {
    if (!this.events[event]) {
      this.events[event] = []
    }
    ;(this.events[event] as T[K][]).push(listener)
  }

  // @ts-expect-error - sorry TypeScript
  emit<K extends keyof T>(event: K, ...args: Parameters<T[K]>) {
    const listeners = (this.events[event] as T[K][]) || []
    if (listeners) {
      for (const listener of listeners) {
        // @ts-expect-error - no way I will type this
        listener(...args)
      }
    }
  }
}
