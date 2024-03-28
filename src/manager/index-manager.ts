import type { Nullable } from '@orama/orama'
import type { CloudManager } from './index.js'
import type { Endpoint } from './types.js'

type IndexManagerParams = {
  manager: CloudManager
}

export class IndexManager {
  private manager: CloudManager
  private promiseChain: Promise<Response> = Promise.resolve() as unknown as Promise<Response>
  private indexId: Nullable<string> = null

  constructor(params: IndexManagerParams) {
    this.manager = params.manager
  }

  public index(id: string) {
    this.indexId = id
    return this
  }

  private addToChain(action: () => Promise<Response>) {
    this.promiseChain = this.promiseChain?.then(action, action) as unknown as Promise<Response>
    return this
  }

  public empty() {
    this.checkIndexID()
    return this.addToChain(() => this.callIndexWebhook('snapshot', []))
  }

  public snapshot(data: object) {
    this.checkIndexID()
    return this.addToChain(() => this.callIndexWebhook('snapshot', data))
  }

  public insert(data: object[]) {
    this.checkIndexID()
    return this.addToChain(() => this.callIndexWebhook('notify', { upsert: data }))
  }

  public update(data: object[]) {
    this.checkIndexID()
    return this.addToChain(() => this.callIndexWebhook('notify', { upsert: data }))
  }

  public delete(data: object[]) {
    this.checkIndexID()
    return this.addToChain(() => this.callIndexWebhook('notify', { remove: data }))
  }

  public deploy() {
    this.checkIndexID()
    return this.addToChain(() => this.callIndexWebhook('deploy'))
  }

  private checkIndexID() {
    if (!this.indexId) {
      throw new Error('Index ID is not set')
    }
  }

  private callIndexWebhook(endpoint: Endpoint, payload?: object): Promise<Response> {
    return this.manager.callIndexWebhook(endpoint, payload)
  }
}
