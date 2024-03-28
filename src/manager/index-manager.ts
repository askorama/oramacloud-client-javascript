import type { Nullable } from '@orama/orama'
import type { CloudManager } from './index.js'
import type { Endpoint } from './types.js'

type IndexManagerParams = {
  manager: CloudManager
}

export class IndexManager {
  private manager: CloudManager
  private indexId: Nullable<string> = null
  private operationStack: (() => Promise<Response>)[] = []
  private executing = false

  constructor(params: IndexManagerParams) {
    this.manager = params.manager
  }

  public index(id: string) {
    this.indexId = id
    return this
  }

  public empty() {
    this.checkIndexID()
    return this.enqueueOperation(() => this.callIndexWebhook('snapshot', []))
  }

  public snapshot(data: object) {
    this.checkIndexID()
    return this.enqueueOperation(() => this.callIndexWebhook('snapshot', data))
  }

  public insert(data: object[]) {
    this.checkIndexID()
    return this.enqueueOperation(() => this.callIndexWebhook('notify', { upsert: data }))
  }

  public update(data: object[]) {
    this.checkIndexID()
    return this.enqueueOperation(() => this.callIndexWebhook('notify', { upsert: data }))
  }

  public delete(data: object[]) {
    this.checkIndexID()
    return this.enqueueOperation(() => this.callIndexWebhook('notify', { remove: data }))
  }

  public deploy() {
    this.checkIndexID()
    return this.enqueueOperation(() => this.callIndexWebhook('deploy'))
  }

  private checkIndexID() {
    if (!this.indexId) {
      throw new Error('Index ID is not set')
    }
  }

  private enqueueOperation(operation: () => Promise<Response>) {
    this.operationStack.push(operation)
    if (!this.executing) {
      this.executeNext()
    }
  }

  private async executeNext() {
    if (this.operationStack.length === 0) {
      this.executing = false
      return
    }
    this.executing = true
    const operation = this.operationStack.shift()
    if (typeof operation === 'function') {
      await operation()
    }
    this.executeNext()
  }

  private callIndexWebhook(endpoint: Endpoint, payload?: object): Promise<Response> {
    return this.manager.callIndexWebhook(endpoint, payload)
  }
}
