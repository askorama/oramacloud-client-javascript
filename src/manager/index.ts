import type { Nullable, insert } from '@orama/orama'
import type { Endpoint, Method } from './types.js'
import { IndexManager } from './index-manager.js'
import { API_V1_BASE_URL } from './constants.js'

type CloudManagerConfig = {
  api_key: string
}

type CallConfig = {
  method: Method
  headers: {
    'Content-Type': string
    Authorization: string
  }
  body?: string
}

type Payload = UpsertPayload | RemovePayload | InsertPayload

type UpsertPayload = {
  upsert: any[]
}

type RemovePayload = {
  remove: any[]
}

type InsertPayload = {
  insert: any[]
}

export class CloudManager {
  private indexId: Nullable<string> = null
  private apiKey: string

  constructor(config: CloudManagerConfig) {
    this.apiKey = config.api_key
  }

  index(indexId: string): IndexManager {
    return new IndexManager({ manager: this, indexID: indexId })
  }

  setIndexID(id: string) {
    this.indexId = id
  }

  async callIndexWebhook<T = unknown>(endpoint: Endpoint, payload?: T): Promise<Response> {
    const config: CallConfig = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`
      }
    }

    if (payload) {
      config.body = JSON.stringify(payload)
    }

    const resp = await fetch(`${API_V1_BASE_URL}/webhooks/${this.indexId}/${endpoint}`, config)

    return resp.json()
  }
}

