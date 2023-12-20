import type { IOramaProxy } from './types.js'
import * as CONST from './constants.js'

export class OramaProxy {
  private CSRFToken: string = ''
  private ready = false
  private readonly api_key: string

  constructor(params: IOramaProxy) {
    this.api_key = params.api_key

    this.init()
      .then(() => (this.ready = true))
      .catch((err) => console.log(err))
  }

  public async generateEmbeddings(text: string): Promise<number[]> {
    if (!this.ready) {
      console.log('OramaProxy is not ready yet')
      return []
    }

    const endpoint = `${CONST.ORAMA_PROXY_ENDPOINT}${CONST.ORAMA_PROXY_EMBEDDINGS_ENDPOINT}?apiKey=${this.api_key}`
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
      },
      referrer: this.getReferrer(),
      body: new URLSearchParams({
        query: text,
        csrf: this.CSRFToken
      }).toString()
    })

    return response.json()
  }

  public async chat<T = unknown>(messages: T[], onChunk: (chunk: string) => any): Promise<void> {
    if (!this.ready) {
      console.log('OramaProxy is not ready yet')
    }

    const endpoint = `${CONST.ORAMA_PROXY_ENDPOINT}${CONST.ORAMA_PROXY_CHAT_ENDPOINT}?apiKey=${this.api_key}`

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
      },
      referrer: this.getReferrer(),
      body: new URLSearchParams({
        messages: JSON.stringify(messages),
        csrf: this.CSRFToken
      }).toString()
    })

    if (!response.ok || response.body == null) {
      throw response.statusText
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()

    while (true) {
      const { value, done } = await reader.read()
      if (done) {
        break
      }

      const decodedChunk = decoder.decode(value, { stream: true })
      onChunk(decodedChunk)
    }
  }

  private async init() {
    const endpoint = `${CONST.ORAMA_PROXY_ENDPOINT}${CONST.ORAMA_PROXY_INIT_ENDPOINT}?apiKey=${this.api_key}`
    const response = await fetch(endpoint, {
      referrer: this.getReferrer()
    })

    const data = await response.json()

    this.CSRFToken = data.csrfToken
  }

  private isServer() {
    return typeof window === 'undefined'
  }

  private getReferrer() {
    return this.isServer() ? 'http://localhost' : window.location.href
  }
}
