import type { Results, AnyDocument, SearchParams, AnyOrama } from '@orama/orama'
import { createId } from '@paralleldrive/cuid2'
import { Collector } from './collector.js'
import { ORAMA_ANSWER_ENDPOINT } from './constants.js'
import { OramaClient } from './client.js'
import { parseSSE, serializeUserContext } from './utils.js'

export type Context = Results<AnyDocument>['hits']

export type Message = {
  role: 'user' | 'assistant'
  content: string
}

export type InferenceType = 'documentation'

export type AnswerParams<UserContext = unknown> = {
  initialMessages: Message[]
  inferenceType: InferenceType
  oramaClient: OramaClient
  userContext?: UserContext
  events?: {
    onMessageChange?: (messages: Message[]) => void
    onMessageLoading?: (receivingMessage: boolean) => void
    onAnswerAborted?: (aborted: true) => void
    onSourceChange?: <T = AnyDocument>(sources: Results<T>) => void
    onQueryTranslated?: (query: SearchParams<AnyOrama>) => void
  }
}

export type AskParams = SearchParams<AnyOrama> & {
  userData?: unknown
}

export class AnswerSession {
  private messages: Message[]
  private inferenceType: InferenceType
  private oramaClient: OramaClient
  private endpoint: string
  private abortController?: AbortController
  private events: AnswerParams['events']
  private userContext?: AnswerParams['userContext']
  private conversationID: string
  private userID: string

  constructor(params: AnswerParams) {
    // @ts-expect-error - sorry again TypeScript :-)
    const oaramaAnswerHostAddress = params.oramaClient.answersApiBaseURL || ORAMA_ANSWER_ENDPOINT

    this.messages = params.initialMessages || []
    this.inferenceType = params.inferenceType
    this.oramaClient = params.oramaClient
    // @ts-expect-error - sorry TypeScript
    this.endpoint = `${oaramaAnswerHostAddress}/v1/answer?api-key=${this.oramaClient.api_key}`
    this.events = params.events
    this.conversationID = createId()
    this.userID = Collector.getUserID()
    this.userContext = params.userContext
  }

  public async askStream(params: AskParams): Promise<AsyncGenerator<string>> {
    this.messages.push({ role: 'user', content: params.term ?? '' })
    return this.fetchAnswer(params)
  }

  public async ask(params: AskParams): Promise<string> {
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

  private async *fetchAnswer(params: AskParams): AsyncGenerator<string> {
    this.abortController = new AbortController()

    const requestBody = new URLSearchParams()
    requestBody.append('type', this.inferenceType)
    requestBody.append('messages', JSON.stringify(this.messages))
    requestBody.append('query', params.term ?? '')
    requestBody.append('conversationId', this.conversationID)
    requestBody.append('userId', this.userID)
    // @ts-expect-error - yeah it's private but we need it here
    requestBody.append('endpoint', this.oramaClient.endpoint)
    requestBody.append('searchParams', JSON.stringify(params))

    if (this.userContext) {
      requestBody.append('userContext', serializeUserContext(this.userContext))
    }

    if (params.userData) {
      requestBody.append('userData', serializeUserContext(params.userData))
    }

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

            // MANAGE INCOMING SOURCES
            if (parsedMessage.type === 'sources') {
              if (this.events?.onSourceChange) {
                this.events.onSourceChange(parsedMessage.message)
              }

              // MANAGE INCOMING TRANSLATED QUERY
            } else if (parsedMessage.type === 'query-translated') {
              if (this.events?.onQueryTranslated) {
                this.events.onQueryTranslated(parsedMessage.message)
              }

              // MANAGE INCOMING MESSAGE CHUNK
            } else if (parsedMessage.type === 'text') {
              messageQueue.push(parsedMessage.message)

              // Process the message queue immediately, regardless of endOfBlock
              while (messageQueue.length > 0) {
                lastMessage.content += messageQueue.shift()

                if (this.events?.onMessageChange) {
                  this.events.onMessageChange(this.messages)
                }

                yield lastMessage.content
              }

              // ALL OTHER CASES
            } else {
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
