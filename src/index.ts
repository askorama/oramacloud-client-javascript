import type { Endpoint, IOramaClient, Method, OramaInitResponse, HeartBeatConfig } from './types.js'
import type { SearchParams, Results } from '@orama/orama'
import { formatElapsedTime } from '@orama/orama/components'
import cuid from 'cuid'

import { Cache } from './cache.js'
import * as CONST from './constants.js'
import { Collector } from './collector.js'
import { HeartBeat } from './heartbeat.js'
import { version } from '../package.json'

export class OramaClient {
  private readonly id = cuid()
  private readonly api_key: string
  private readonly endpoint: string
  private readonly collector?: Collector
  private readonly cache?: Cache<Results>

  private heartbeat?: HeartBeat
  private initPromise?: Promise<void>

  constructor (params: IOramaClient) {
    this.api_key = params.api_key
    this.endpoint = params.endpoint

    // Telemetry is enabled by default
    if (params.telemetry !== false) {
      const telementryConfig = {
        id: this.id,
        api_key: this.api_key,
        flushInterval: params.telemetry?.flushInterval ?? CONST.DEFAULT_TELEMETRY_FLUSH_INTERVAL,
        flushSize: params.telemetry?.flushSize ?? CONST.DEFAULT_TELEMETRY_FLUSH_SIZE,
      }
      this.collector = Collector.create(telementryConfig)
    }

    // Cache is enabled by default
    if (params.cache !== false) {
      const cacheParams = {}
      this.cache = new Cache<Results>(cacheParams)
    }

    this.init()
  }

  public async search (query: SearchParams, config?: SearchConfig): Promise<Results> {
    await this.initPromise

    const cacheKey = JSON.stringify(query)

    let roundTripTime: number
    let searchResults: Results
    let cached = false

    const shouldUseCache = config?.fresh !== true && this.cache?.has(cacheKey)
    if (shouldUseCache) {
      roundTripTime = 0
      searchResults = this.cache!.get(cacheKey)!
      cached = true
    } else {
      const timeStart = Date.now()
      searchResults = await this.fetch<Results>(
        'search',
        'POST',
        { q: query },
        config?.abortController
      )
      const timeEnd = Date.now()

      searchResults.elapsed = await formatElapsedTime(BigInt(timeEnd * CONST.MICROSECONDS_BASE - timeStart * CONST.MICROSECONDS_BASE))
      roundTripTime = timeEnd - timeStart

      this.cache?.set(cacheKey, searchResults)
    }

    if (this.collector) {
      this.collector.add({
        rawSearchString: query.term,
        resultsCount: searchResults.hits.length,
        roundTripTime,
        query,
        cached,
        searchedAt: new Date()
      })
    }

    return searchResults
  }

  public startHeartBeat (config: HeartBeatConfig): void {
    this.heartbeat?.stop()
    this.heartbeat = new HeartBeat({
      ...config,
      endpoint: this.endpoint + `/health?api-key=${this.api_key}`,
    })
    this.heartbeat.start()
  }

  public stopHeartBeat (): void {
    this.heartbeat?.stop()
  }

  private init() {
    this.initPromise = this.fetch<OramaInitResponse>('init', 'GET')
      .then(b => {
        this.collector?.setParams({
          endpoint: b.collectUrl,
          deploymentID: b.deploymentID,
          index: b.index
        })
      })
      .catch(err => console.log(err))
  }

  private async fetch<T = unknown> (path: Endpoint, method: Method, body?: object, abortController?: AbortController): Promise<T> {
    if (abortController && abortController.signal.aborted) {
      throw new Error('Request aborted')
    }

    const requestOptions: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        // Unfortunatelly we can't send this headers otherwise we should pay CORS preflight request
        // 'x-orama-instance-id': this.id,
        // 'x-orama-version': version
      },
      signal: abortController?.signal
    }

    if (method === 'POST' && body !== undefined) {
      const b = body as any
      b.version = version
      b.id = this.id

      requestOptions.body = Object.entries(b)
        .map(([key, value]) => `${key}=${encodeURIComponent(JSON.stringify(value))}`)
        .join('&')
    }

    const res: Response = await fetch(`${this.endpoint}/${path}?api-key=${this.api_key}`, requestOptions)

    return await res.json()
  }
}

export interface SearchConfig {
  abortController?: AbortController,
  fresh?: boolean
}
