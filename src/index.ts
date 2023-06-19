import { Results, type SearchParams } from '@orama/orama'
import { formatElapsedTime } from '@orama/orama/components'
import { Collector } from './collector.js'

interface IOramaClient {
  api_key: string
  endpoint: string
}

type Endpoint =
  | 'search'
  | 'init'
  | 'info'
  | 'health'

type Method =
  | 'GET'
  | 'POST'

export class OramaClient {
  private ready = false
  private readonly api_key: string
  private readonly endpoint: string
  private collector: Collector

  constructor (params: IOramaClient) {
    this.api_key = params.api_key
    this.endpoint = params.endpoint
    this.collector = new Collector({
      flushInterval: 5000,  // @todo: make this configurable?
      flushSize: 25,  // @todo: make this configurable?
      endpoint: `${this.endpoint}/collect`, // @todo: change this to actual telemetry endpoint
      api_key: this.api_key // @todo: change this to actual telemetry api key
    })

    this.init()
      .then(this.setReady)
      .catch(err => console.error(err))
  }

  public async search (query: SearchParams): Promise<Results> {
    if (!this.ready) {
      console.warn('OramaClient is not ready yet. Operation will be delayed.')
    }

    const timeStart = Date.now()
    const results = await this.fetch<Results>('search', 'POST', query)
    const timeEnd = Date.now()

    results.elapsed = await formatElapsedTime(BigInt(timeEnd - timeStart))

    await this.collector.add({
      query,
      results,
      timeStart,
      timeEnd
    })

    return results
  }

  private setReady (): void {
    this.ready = true
  }

  private async init (): Promise<void> {
    await this.fetch('init', 'POST')
  }

  private async fetch<T = unknown> (path: Endpoint, method: Method, body?: object): Promise<T> {
    const requestOptions: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.api_key}`
      }
    }

    if (method === 'POST' && body !== undefined) {
      requestOptions.body = JSON.stringify(body)
    }

    const res = await fetch(`${this.endpoint}/${path}`, requestOptions)

    return await res.json()
  }
}
