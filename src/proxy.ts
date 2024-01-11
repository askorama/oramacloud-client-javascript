import type { OpenAI } from 'openai'
import type { IOramaProxy } from './types.js'
import * as CONST from './constants.js'

export type EmbeddingModel = keyof typeof embeddingsModels
export type ChatModel = keyof typeof chatModels
export type ChatMessage = OpenAI.ChatCompletionMessageParam

export type ChatParams = {
  messages: ChatMessage[]
  model: ChatModel
}

const OPENAI_EMBEDDINGS_MODEL_ADA = 'text-embedding-ada-002'
const ORAMA_EMBEDDINGS_MODEL_GTE_SMALL = 'gte-small'
const ORAMA_EMBEDDINGS_MODEL_MINILM_L6 = 'MiniLM-L6-v2'
const ORAMA_EMBEDDINGS_MODEL_MINILM_L12 = 'MiniLM-L12-v2'

const OPENAI_CHAT_MODEL_GPT4_1106_PREVIEW = 'gpt-4-1106-preview'
const OPENAI_CHAT_MODEL_GPT4 = 'gpt-4'
const OPENAI_CHAT_MODEL_GPT3_5_TURBO = 'gpt-3.5-turbo'
const OPENAI_CHAT_MODEL_GPT3_3_5_TURBO_16K = 'gpt-3.5-turbo-16k'

const embeddingsModels = {
  [`openai/${OPENAI_EMBEDDINGS_MODEL_ADA}`]: OPENAI_EMBEDDINGS_MODEL_ADA
  // Will be available soon
  // [`orama/${ORAMA_EMBEDDINGS_MODEL_GTE_SMALL}`]: ORAMA_EMBEDDINGS_MODEL_GTE_SMALL,
  // [`orama/${ORAMA_EMBEDDINGS_MODEL_MINILM_L6}`]: ORAMA_EMBEDDINGS_MODEL_MINILM_L6,
  // [`orama/${ORAMA_EMBEDDINGS_MODEL_MINILM_L12}`]: ORAMA_EMBEDDINGS_MODEL_MINILM_L12
}

const chatModels = {
  [`openai/${OPENAI_CHAT_MODEL_GPT3_5_TURBO}`]: OPENAI_CHAT_MODEL_GPT3_5_TURBO,
  [`openai/${OPENAI_CHAT_MODEL_GPT4}`]: OPENAI_CHAT_MODEL_GPT4,
  [`openai/${OPENAI_CHAT_MODEL_GPT3_3_5_TURBO_16K}`]: OPENAI_CHAT_MODEL_GPT3_3_5_TURBO_16K,
  [`openai/${OPENAI_CHAT_MODEL_GPT4_1106_PREVIEW}`]: OPENAI_CHAT_MODEL_GPT4_1106_PREVIEW
}

export class OramaProxy {
  private CSRFToken = ''
  private ready: Promise<boolean>
  private readonly api_key: string
  private publicKey?: CryptoKey

  constructor(params: IOramaProxy) {
    this.api_key = params.api_key

    this.ready = this.init()
      .then(() => true)
      .catch((err) => {
        console.log(err)
        return false
      })
  }

  public async generateEmbeddings(text: string, model: EmbeddingModel): Promise<number[]> {
    const isReady = await this.ready

    if (!isReady) {
      console.log('OramaProxy had an error during the initialization')
      return []
    }

    const endpoint = `${CONST.ORAMA_PROXY_ENDPOINT}${CONST.ORAMA_PROXY_EMBEDDINGS_ENDPOINT}?apiKey=${this.api_key}`
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: this.getHeaders(),
      body: new URLSearchParams({
        query: text,
        csrf: this.CSRFToken,
        model: embeddingsModels[model]
      }).toString()
    })

    return response.json()
  }

  public async chat(params: ChatParams): Promise<string> {
    const isReady = await this.ready

    if (!isReady) {
      console.log('OramaProxy had an error during the initialization')
      return ''
    }

    let response = ''

    for await (const msg of this.chatStream(params)) {
      response += msg
    }

    return response
  }

  public async *chatStream(params: ChatParams): AsyncGenerator<string> {
    const endpoint = `${CONST.ORAMA_PROXY_ENDPOINT}${CONST.ORAMA_PROXY_CHAT_ENDPOINT}?apiKey=${this.api_key}`

    let messages = params.messages
    if (this.publicKey) {
      messages = await Promise.all(messages.map(async (message) => {
        if (!message.content) {
          return message
        }
        if (typeof message.content !== 'string') {
          return message
        }
        return {
          ...message,
          content: await encryptData(this.publicKey!, message.content)
        }
      })) as any // Too hard to type this
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: this.getHeaders(),
      body: new URLSearchParams({
        messages: JSON.stringify(messages),
        csrf: this.CSRFToken,
        model: chatModels[params.model]
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
      yield decodedChunk
    }
  }

  private async init() {
    const endpoint = `${CONST.ORAMA_PROXY_ENDPOINT}${CONST.ORAMA_PROXY_INIT_ENDPOINT}?apiKey=${this.api_key}`
    const response = await fetch(endpoint, {
      headers: {
        referer: this.getReferrer()
      }
    })

    const data = await response.json()
    this.CSRFToken = data.csrfToken
    if (data.encryption?.enabled === true) {
      this.publicKey = await importPublicKey(restoreKey(data.encryption.publicKey))
    }
  }

  private isServer() {
    return typeof window === 'undefined'
  }

  private getHeaders() {
    return {
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      referer: this.getReferrer()
    }
  }

  private getReferrer() {
    return this.isServer() ? 'http://localhost' : window.location.href
  }
}

async function importPublicKey(keyData: ArrayBuffer) {
  const key = await crypto.subtle.importKey(
    "spki",
    keyData,
    { name: "RSA-OAEP", hash: { name: "SHA-256" } },
    true,
    ["encrypt"]
  );
  return key;
}

async function encryptPieceData(publicKey: CryptoKey, encodedData: Uint8Array) {
  const encryptedData = await crypto.subtle.encrypt(
      { name: "RSA-OAEP" },
      publicKey,
      encodedData
  );
  return new Uint8Array(encryptedData);
}

function restoreKey(s: number[]): Uint8Array {
  return Uint8Array.from(s)
}

const BATCH_SIZE = 50
async function encryptData(publicKey: CryptoKey, data: string) {
  const encodedData = new TextEncoder().encode(data);

  const arr = []
  for (let i = 0; i < encodedData.length; i += BATCH_SIZE) {
    const item = encodedData.subarray(i, i + BATCH_SIZE)
    const encryptedData = await encryptPieceData(publicKey, item)
    arr.push(Array.from(encryptedData))
  }

  return arr
}