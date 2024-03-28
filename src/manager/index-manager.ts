import type { Nullable } from '@orama/orama'
import type { CloudManager } from './index.js'
import type { Endpoint, EndpointDeploy, EndpointNotify, EndpointSnapshot } from './types.js'
import * as CONST from './constants.js'

type IndexManagerParams = {
  manager: CloudManager
}

type SnapshotData = object[] | object

type CallWebhookPayload<E extends Endpoint> = E extends EndpointSnapshot
  ? SnapshotData
  : E extends EndpointNotify
    ? object[]
    : E extends EndpointDeploy
      ? undefined
      : never

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
    return this.enqueueOperation(() => this.callIndexWebhook<EndpointSnapshot>(CONST.ENDPOINT_SNAPSHOT, []))
  }

  public snapshot(data: CallWebhookPayload<EndpointSnapshot>) {
    this.checkIndexID()
    return this.enqueueOperation(() => this.callIndexWebhook<EndpointSnapshot>(CONST.ENDPOINT_SNAPSHOT, data))
  }

  public insert(data: CallWebhookPayload<EndpointNotify>) {
    this.checkIndexID()
    return this.enqueueOperation(() => this.callIndexWebhook<EndpointNotify>(CONST.ENDPOINT_NOTIFY, { upsert: data }))
  }

  public update(data: CallWebhookPayload<EndpointNotify>) {
    this.checkIndexID()
    return this.enqueueOperation(() => this.callIndexWebhook<EndpointNotify>(CONST.ENDPOINT_NOTIFY, { upsert: data }))
  }

  public delete(data: CallWebhookPayload<EndpointNotify>) {
    this.checkIndexID()
    return this.enqueueOperation(() => this.callIndexWebhook<EndpointNotify>(CONST.ENDPOINT_NOTIFY, { remove: data }))
  }

  public deploy() {
    this.checkIndexID()
    return this.enqueueOperation(() => this.callIndexWebhook<EndpointDeploy>(CONST.ENDPOINT_DEPLOY))
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

  private callIndexWebhook<E extends Endpoint>(endpoint: E, payload?: CallWebhookPayload<E>) {
    return this.manager.callIndexWebhook(endpoint, payload)
  }
}
