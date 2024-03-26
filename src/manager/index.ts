import type { Nullable } from '@orama/orama'

type CloudManagerConfig = {
  api_key: string
}

type Endpoint = 'snapshot' | 'notify' | 'deploy'

type Method = 'POST' | 'GET' | 'PUT' | 'DELETE'

type CallConfig = {
  method: Method
  headers: {
    'Content-Type': string
    Authorization: string
  }
  body?: string
}

export class CloudManager {
  private apiKey: string
  private indexId: Nullable<string> = null

  constructor(config: CloudManagerConfig) {
    this.apiKey = config.api_key
  }

  public index(id: string) {
    this.indexId = id

    return this
  }

  public async empty() {
    await this.call('snapshot', [])

    return this
  }

  public async snapshot(data: object) {
    await this.call('snapshot', data)

    return this
  }

  public async insert(data: object[]) {
    await this.call('notify', { upsert: data })

    return this
  }

  public async update(data: object[]) {
    await this.call('notify', { upsert: data })

    return this
  }

  public async delete(data: object[]) {
    await this.call('notify', { remove: data })

    return this
  }

  public async deploy() {
    await this.call('deploy')

    return this
  }

  private call(endpoint: Endpoint, payload?: object) {
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

    return fetch(`https://api.oramasearch.com/api/v1/webhooks/${this.indexId}/${endpoint}`, config)
  }
}
