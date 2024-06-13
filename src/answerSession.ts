import type { Results, AnyDocument, SearchParams, AnyOrama } from '@orama/orama'
import { createId } from '@paralleldrive/cuid2'
import { Collector } from './collector.js'
import { ORAMA_ANSWER_ENDPOINT } from './constants.js'
import { OramaClient } from './client.js'
import { parseSSE } from './utils.js'

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
  private conversationID: string
  private userID: string

  constructor(params: AnswerParams) {
    this.messages = params.initialMessages || []
    this.inferenceType = params.inferenceType
    this.oramaClient = params.oramaClient
    // @ts-expect-error - sorry TypeScript
    this.endpoint = `${ORAMA_ANSWER_ENDPOINT}/v1/answer?api-key=${this.oramaClient.api_key}`
    this.events = params.events
    this.conversationID = createId()
    this.userID = Collector.getUserID()
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

    const requestBody = new URLSearchParams()
    requestBody.append('type', this.inferenceType)
    requestBody.append('messages', JSON.stringify(this.messages))
    requestBody.append('query', query)
    requestBody.append('conversationId', this.conversationID)
    requestBody.append('userId', this.userID)
    // @ts-expect-error - yeah it's private but we need it here
    requestBody.append('endpoint', this.oramaClient.endpoint)

    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: requestBody.toString(),
      signal: this.abortController.signal
    })

    if (!response.ok || !response.body) {
      throw new Error(response.statusText)
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    const messageQueue: string[] = []
    let buffer = ''

    if (this.events?.onMessageLoading) {
      this.events.onMessageLoading(true)
    }

    this.addNewEmptyAssistantMessage()

    const lastMessage = this.messages.at(-1) as Message

    try {
      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })

        let endOfMessageIndex

        // biome-ignore lint/suspicious/noAssignInExpressions: this saves a variable allocation on each iteration
        while ((endOfMessageIndex = buffer.indexOf('\n\n')) !== -1) {
          const rawMessage = buffer.slice(0, endOfMessageIndex)
          buffer = buffer.slice(endOfMessageIndex + 2)

          try {
            const event = parseSSE(rawMessage)
            const parsedMessage = JSON.parse(event.data)

            if (parsedMessage.type === 'sources') {
              if (this.events?.onSourceChange) {
                this.events.onSourceChange(parsedMessage.message)
                console.log(parsedMessage.message)
              }
              continue
            }

            messageQueue.push(parsedMessage.message)

            if (parsedMessage.endOfBlock) {
              while (messageQueue.length > 0) {
                lastMessage.content += messageQueue.shift()

                if (this.events?.onMessageChange) {
                  this.events.onMessageChange(this.messages)
                }

                yield lastMessage.content
              }
            }
          } catch (e) {
            console.error('Error parsing SSE event:', e)
            console.error('Raw message:', rawMessage)
          }
        }
      }
    } catch (err) {
      if ((err as any).name === 'AbortError') {
        if (this.events?.onAnswerAborted) {
          this.events.onAnswerAborted(true)
        }
      } else {
        throw err
      }
    } finally {
      reader.releaseLock()
    }

    if (this.events?.onMessageLoading) {
      this.events.onMessageLoading(false)
    }
  }
}
