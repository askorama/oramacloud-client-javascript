import type { Endpoint, IOramaClient, Method, OramaInitResponse, Optional } from './types.js'
import type { SearchParams, Results } from '@orama/orama'
import { formatElapsedTime } from '@orama/orama/components'
import cuid from 'cuid'
import fetchFn from './fetchFn.js'
import { Collector } from './collector.js'
import { throttle } from './throttle.js'
import * as CONST from './constants.js'

export class OramaClient {
  private readonly api_key: string
  private readonly endpoint: string
  private readonly collector: Promise<Collector | void>
  private readonly throttle: Optional<number>
  private readonly telemetry: Optional<boolean>
  private readonly telemetryFlushInterval: Optional<number>
  private readonly telemetryFlushSize: Optional<number>

  constructor (params: IOramaClient) {
    this.api_key = params.api_key
    this.endpoint = params.endpoint

    if (params.throttle !== undefined && params.throttle.enabled) {
      this.throttle = params?.throttle?.frequency ?? CONST.DEFAULT_THROTTLE_FREQUENCY
      this.search = throttle(this.search.bind(this), this.throttle) as typeof this.search
    }

    if (typeof params.telemetry === 'undefined') {
      this.telemetry = true
    } else {
      this.telemetry = params.telemetry?.enabled ?? true
      this.telemetryFlushInterval = params.telemetry?.flushInterval ?? CONST.DEFAULT_TELEMETRY_FLUSH_INTERVAL
      this.telemetryFlushSize = params.telemetry?.flushSize ?? CONST.DEFAULT_TELEMETRY_FLUSH_SIZE
    }

    this.init().catch(err => console.error(err))
    this.collector = this.init()
  }

  public async search (query: SearchParams): Promise<Results> {
    const timeStart = Date.now()
    const [results, contentEncoding] = await this.fetch<Results>('search', 'POST', query)
    const timeEnd = Date.now()
    results.elapsed = await formatElapsedTime(BigInt(timeEnd * CONST.MICROSECONDS_BASE - timeStart * CONST.MICROSECONDS_BASE))

    if (this.telemetry) {
      this.collector.then(collector => {
        if (collector != null) {
          collector.add({
            rawSearchString: query.term,
            resultsCount: results.hits.length,
            roundTripTime: timeEnd - timeStart,
            contentEncoding,
            query,
            searchedAt: new Date(timeStart)
          })
        }
      })
    }

    return results
  }

  private createCollector (body: OramaInitResponse): Collector {
    return Collector.create({
      id: cuid(),
      flushInterval: this.telemetryFlushInterval!,
      flushSize: this.telemetryFlushSize!,
      endpoint: body.collectUrl,
      api_key: this.api_key,
      deploymentID: body.deploymentID,
      index: body.index
    })
  }

  private async init (): Promise<Collector | void> {
    return await this.fetch<OramaInitResponse>('init', 'GET')
      .then(([b]) => {
        if (this.telemetry) {
          this.createCollector(b)
        }
      })
      .catch(err => console.log(err))
  }

  private async fetch<T = unknown> (path: Endpoint, method: Method, body?: object): Promise<[T, string?]> {
    const res = await fetchFn(
      `${this.endpoint}/${path}`,
      method,
      { Authorization: `Bearer ${this.api_key}` },
      body
    )

    const contentEncoding = res.headers.get('Content-Encoding') || undefined

    return [await res.json(), contentEncoding]
  }
}
