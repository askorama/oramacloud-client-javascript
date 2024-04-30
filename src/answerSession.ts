import type { Results, AnyDocument, SearchParams, AnyOrama } from '@orama/orama'
import { OramaClient } from './client.js'

export type Context = Results<AnyDocument>['hits']

export type Message = {
  role: 'user' | 'assistant'
  content: string
}

export type InferenceType = 'documentation'

export type AnswerParams = {
  initialMessages: Message[]
  inferenceType: InferenceType
  oramaClient: OramaClient
  events?: {
    onMessageChange?: (messages: Message[]) => void
    onMessageLoading?: (receivingMessage: boolean) => void
    onAnswerAborted?: (aborted: true) => void
    onSourceChange?: <T = AnyDocument>(sources: Results<T>) => void
  }
}

export class AnswerSession {
  private messages: Message[]
  private inferenceType: InferenceType
  private oramaClient: OramaClient
  private endpoint: string
  private abortController?: AbortController
  private events: AnswerParams['events']

  constructor(params: AnswerParams) {
    this.messages = params.initialMessages || []
    this.inferenceType = params.inferenceType
    this.oramaClient = params.oramaClient
    // @ts-expect-error - sorry TypeScript
    this.endpoint = `${this.oramaClient.endpoint}/answer?api-key=${this.oramaClient.api_key}`
    this.events = params.events
  }

  public async askStream(params: SearchParams<AnyOrama>): Promise<AsyncGenerator<string>> {
    this.messages.push({ role: 'user', content: params.term ?? '' })
    const inferenceResult = await this.runInference(params)

    if (this.events?.onSourceChange) {
      this.events.onSourceChange(inferenceResult!)
    }

    return this.fetchAnswer(params.term ?? '', inferenceResult?.hits ?? [])
  }

  public async ask(params: SearchParams<AnyOrama>): Promise<string> {
    const generator = await this.askStream(params)
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

  private runInference(params: SearchParams<AnyOrama>) {
    return this.oramaClient.search(params)
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
        if (this.events?.onAnswerAborted) {
          this.events.onAnswerAborted(true)
        }
      } else {
        throw err
      }
    }

    if (this.events?.onMessageLoading) {
      this.events.onMessageLoading(false)
    }
  }
}
