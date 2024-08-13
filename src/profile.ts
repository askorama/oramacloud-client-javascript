import { createId } from '@paralleldrive/cuid2'
import sendBeacon from './sendBeacon.js'
import { OramaInitResponse } from './types.js'
import { LOCAL_STORAGE_USER_ID_KEY } from './constants.js'

type ProfileConstructor = {
  endpoint: string
  apiKey: string
}

export class Profile {
  private readonly endpoint: string
  private readonly apiKey: string

  private userId: string
  private identity?: string
  private userAlias?: string

  constructor({ endpoint, apiKey }: ProfileConstructor) {
    if (!endpoint || !apiKey) {
      throw new Error('Endpoint and API Key are required to create a Profile')
    }

    if (typeof endpoint !== 'string' || typeof apiKey !== 'string') {
      throw new Error('Endpoint and API Key must be strings')
    }

    if (typeof localStorage !== 'undefined') {
      // Browser side
      const userId = localStorage.getItem(LOCAL_STORAGE_USER_ID_KEY)

      if (userId) {
        this.userId = userId
      } else {
        this.userId = createId()
        localStorage.setItem(LOCAL_STORAGE_USER_ID_KEY, this.userId)
      }
    } else {
      // Server side
      this.userId = createId()
    }

    this.endpoint = endpoint
    this.apiKey = apiKey
  }

  getIdentity() {
    return this.identity
  }

  getUserId() {
    return this.userId
  }

  getAlias() {
    return this.userAlias
  }

  async identify(initPromise: Promise<OramaInitResponse | null>, identity: string) {
    if (typeof identity !== 'string') {
      throw new Error('Identity must be a string')
    }

    await initPromise

    this.identity = identity
  }

  async alias(initPromise: Promise<OramaInitResponse | null>, alias: string) {
    if (typeof alias !== 'string') {
      throw new Error('Identity must be a string')
    }

    await initPromise

    this.userAlias = alias
  }

  reset() {
    this.userId = createId()
    this.identity = undefined
  }
}
