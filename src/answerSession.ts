import { OramaClient } from './client.js'
import type { Results, AnyDocument } from '@orama/orama'

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
}

export class AnswerSession {
  private messages: Message[]
  private mode: Mode = 'fulltext'
  private inferenceType: InferenceType
  private oramaClient: OramaClient
  private endpoint: string

  constructor(params: AnswerParams) {
    this.messages = params.initialMessages || []
    this.mode = params.mode
    this.inferenceType = params.inferenceType
    this.oramaClient = params.oramaClient
    // @ts-expect-error - sorry TypeScript
    this.endpoint = `${this.oramaClient.endpoint}/answer?api-key=${this.oramaClient.api_key}`
  }

  public ask(question: string, context: Context): AsyncGenerator<string> {
    this.messages.push({ role: 'user', content: question })
    return this.fetchAnswer(question, context)
  }

  public async ask2(question: string, context: Context): Promise<string> {
    const generator = this.ask(question, context)
    let result = ''
    for await (const message of generator) {
      result = message
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

  private removeLastMessage(): void {
    this.messages.pop()
  }

  private async *fetchAnswer(query: string, context: Context): AsyncGenerator<string> {
    const requestBody = {
      type: this.inferenceType,
      messages: this.messages,
      context,
      query
    }

    console.log(requestBody)

    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok || response.body == null) {
      throw response.statusText
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()

    this.addNewEmptyAssistantMessage()

    const lastMessage = this.messages.at(-1)

    while (true) {
      const { value, done } = await reader.read()
      if (done) {
        break
      }
      const decodedChunk = decoder.decode(value, { stream: true })
      lastMessage.content += decodedChunk
      yield lastMessage.content
    }
  }
}
