import type { Nullable } from '@orama/orama'
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

export class CloudManager {
  private indexId: Nullable<string> = null
  private apiKey: string

  constructor(config: CloudManagerConfig) {
    this.apiKey = config.api_key
  }

  newIndexManager(indexId: string): IndexManager {
    return new IndexManager({ manager: this }).index(indexId)
  }

  callIndexWebhook(endpoint: Endpoint, payload?: object): Promise<Response> {
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

    return fetch(`${API_V1_BASE_URL}/webhooks/${this.indexId}/${endpoint}`, config)
  }
}
