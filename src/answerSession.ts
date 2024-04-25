import type { Results, AnyDocument } from '@orama/orama'
import { OramaClient } from './client.js'
import { EventEmitter } from './eventEmitter.js'

export type Context = Results<AnyDocument>['hits']

export type Message = {
  role: 'user' | 'assistant'
  content: string
}

export type Mode = 'fulltext' | 'vector' | 'hybrid'

export type InferenceType = 'documentation'

type AnswerParams = {
  mode: Mode
  initialMessages: Message[]
  inferenceType: InferenceType
  oramaClient: OramaClient
  events?: {
    onMessageChange?: (messages: Message[]) => void
    onMessageLoading?: (receivingMessage: boolean) => void
    onAnswerAborted?: (aborted: true) => void
  }
}

export class AnswerSession extends EventEmitter {
  private messages: Message[]
  private mode: Mode = 'fulltext'
  private inferenceType: InferenceType
  private oramaClient: OramaClient
  private endpoint: string
  private abortController?: AbortController
  private events: AnswerParams['events']

  constructor(params: AnswerParams) {
    super()
    this.messages = params.initialMessages || []
    this.mode = params.mode
    this.inferenceType = params.inferenceType
    this.oramaClient = params.oramaClient
    // @ts-expect-error - sorry TypeScript
    this.endpoint = `${this.oramaClient.endpoint}/answer?api-key=${this.oramaClient.api_key}`
    this.events = params.events
  }

  public askStream(question: string, context: Context): AsyncGenerator<string> {
    this.messages.push({ role: 'user', content: question })
    return this.fetchAnswer(question, context)
  }

  public async ask(question: string, context: Context): Promise<string> {
    const generator = this.askStream(question, context)
    let result = ''
    for await (const message of generator) {
      result = message
    }

    if (this.events?.onMessageChange) {
      this.events.onMessageChange(this.messages)
    }

    return result
  }

  public getMessages(): Message[] {
    return this.messages
  }

  public setMode(mode: Mode): void {
    this.mode = mode
  }

  public clearSession(): void {
    this.messages = []
  }

  private addNewEmptyAssistantMessage(): void {
    this.messages.push({ role: 'assistant', content: '' })
  }

  public abortAnswer() {
    if (this.abortController) {
      this.abortController.abort()
      this.abortController = undefined
      this.messages.pop()
    }
  }

  private async *fetchAnswer(query: string, context: Context): AsyncGenerator<string> {
    this.abortController = new AbortController()
    const { signal } = this.abortController

    const requestBody = {
      type: this.inferenceType,
      messages: this.messages,
      context,
      query
    }

    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody),
      signal
    })

    if (!response.ok || response.body == null) {
      throw response.statusText
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()

    if (this.events?.onMessageLoading) {
      this.events.onMessageLoading(true)
    }

    this.addNewEmptyAssistantMessage()

    const lastMessage = this.messages.at(-1) as Message

    try {
      while (true) {
        const { value, done } = await reader.read()
        if (done) {
          break
        }
        const decodedChunk = decoder.decode(value, { stream: true })
        lastMessage.content += decodedChunk

        if (this.events?.onMessageChange) {
          this.events.onMessageChange(this.messages)
        }

        yield lastMessage.content
      }
    } catch (err) {
      if ((err as any).name === 'AbortError') {
        this.emit('answer-aborted', true)
      } else {
        throw err
      }
    }

    if (this.events?.onMessageLoading) {
      this.events.onMessageLoading(false)
    }
  }
}
