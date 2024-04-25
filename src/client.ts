import type { Endpoint, IOramaClient, Method, OramaInitResponse, HeartBeatConfig, OramaError } from './types.js'
import type { SearchParams, Results, AnyDocument, AnyOrama, Nullable } from '@orama/orama'
import type { Message, InferenceType } from './answerSession.js'
import { formatElapsedTime } from '@orama/orama/components'
import { createId } from '@paralleldrive/cuid2'

import { AnswerSession } from './answerSession.js'
import { Cache } from './cache.js'
import * as CONST from './constants.js'
import { Collector } from './collector.js'
import { HeartBeat } from './heartbeat.js'
import { version } from '../package.json'

export interface SearchConfig {
  abortController?: AbortController
  fresh?: boolean
  debounce?: number
}

export type SearchMode = 'fulltext' | 'vector' | 'hybrid'

type AdditionalSearchParams = {
  mode?: SearchMode
  returning?: string[]
}

export type AnswerParams = {
  type: 'documentation'
  query: string
  messages: Array<{ role: 'user' | 'system'; content: string }>
  context: Results<any>['hits']
}

export type ClientSearchParams = SearchParams<AnyOrama> & AdditionalSearchParams

export type AnswerSessionParams = {
  inferenceType?: InferenceType
  initialMessages?: Message[]
  events?: {
    onMessageChange?: (messages: Message[]) => void
    onMessageLoading?: (receivingMessage: boolean) => void
    onAnswerAborted?: (aborted: true) => void
    onSourceChange?: <T = AnyDocument>(sources: Results<T>) => void
  }
}

export class OramaClient {
  private readonly id = createId()
  private readonly api_key: string
  private readonly endpoint: string
  private readonly collector?: Collector
  private readonly cache?: Cache<Results<AnyDocument>>
  private abortController?: AbortController
  private searchDebounceTimer?: NodeJS.Timer
  private searchRequestCounter = 0

  private heartbeat?: HeartBeat
  private initPromise?: Promise<OramaInitResponse | null>

  constructor(params: IOramaClient) {
    this.api_key = params.api_key
    this.endpoint = params.endpoint

    // Telemetry is enabled by default
    if (params.telemetry !== false) {
      const telementryConfig = {
        id: this.id,
        api_key: this.api_key,
        flushInterval: params.telemetry?.flushInterval ?? CONST.DEFAULT_TELEMETRY_FLUSH_INTERVAL,
        flushSize: params.telemetry?.flushSize ?? CONST.DEFAULT_TELEMETRY_FLUSH_SIZE
      }
      this.collector = Collector.create(telementryConfig)
    }

    // Cache is enabled by default
    if (params.cache !== false) {
      const cacheParams = {}
      this.cache = new Cache<Results<AnyDocument>>(cacheParams)
    }

    this.init()
  }

  public async search(query: ClientSearchParams, config?: SearchConfig): Promise<Nullable<Results<AnyDocument>>> {
    await this.initPromise

    const currentRequestNumber = ++this.searchRequestCounter
    const cacheKey = `search-${JSON.stringify(query)}`

    let searchResults: Results<AnyDocument>
    let roundTripTime: number
    let cached = false
    const shouldUseCache = config?.fresh !== true && this.cache?.has(cacheKey)

    const performSearch = async () => {
      try {
        const timeStart = Date.now()
        searchResults = await this.fetch<Results<AnyDocument>>('search', 'POST', { q: query }, this.abortController)
        const timeEnd = Date.now()
        searchResults.elapsed = await formatElapsedTime(BigInt(timeEnd * CONST.MICROSECONDS_BASE - timeStart * CONST.MICROSECONDS_BASE))
        roundTripTime = timeEnd - timeStart
        this.cache?.set(cacheKey, searchResults)
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          console.error('Search request failed', error)
          throw error
        }
      }

      if (this.collector) {
        this.collector.add({
          rawSearchString: query.term,
          resultsCount: searchResults?.hits?.length ?? 0,
          roundTripTime,
          query,
          cached,
          searchedAt: new Date()
        })
      }

      return searchResults
    }

    if (shouldUseCache && this.cache) {
      roundTripTime = 0
      searchResults = this.cache.get(cacheKey) as Results<AnyDocument>
      cached = true

      if (this.collector) {
        this.collector.add({
          rawSearchString: query.term,
          resultsCount: searchResults?.hits?.length ?? 0,
          roundTripTime,
          query,
          cached,
          searchedAt: new Date()
        })
      }
    } else {
      if (config?.debounce) {
        return new Promise((resolve, reject) => {
          clearTimeout(this.searchDebounceTimer)
          this.searchDebounceTimer = setTimeout(
            async () => {
              try {
                await performSearch()
                resolve(searchResults)
              } catch (error) {
                if ((error as any).name !== 'AbortError') {
                  console.error('Search request failed', error)
                  reject(error)
                }
              }
            },
            config?.debounce || 300
          )
        })
      }

      return performSearch()
    }

    if (currentRequestNumber === this.searchRequestCounter) {
      return searchResults
    }

    return null
  }

  public async vectorSearch(query: ClientSearchParams, config?: SearchConfig): Promise<Pick<Results<AnyDocument>, 'hits' | 'elapsed'>> {
    await this.initPromise

    const cacheKey = `vectorSearch-${JSON.stringify(query)}`

    let roundTripTime: number
    let searchResults: Results<AnyDocument>
    let cached = false

    const shouldUseCache = config?.fresh !== true && this.cache?.has(cacheKey)
    if (shouldUseCache === true && this.cache != null) {
      roundTripTime = 0
      searchResults = this.cache.get(cacheKey) as Results<AnyDocument>
      cached = true
    } else {
      const timeStart = Date.now()
      searchResults = await this.fetch<Results<AnyDocument>>('vector-search2', 'POST', { q: query }, config?.abortController)
      const timeEnd = Date.now()

      searchResults.elapsed = await formatElapsedTime(BigInt(timeEnd * CONST.MICROSECONDS_BASE - timeStart * CONST.MICROSECONDS_BASE))
      roundTripTime = timeEnd - timeStart

      this.cache?.set(cacheKey, searchResults)
    }

    if (this.collector != null) {
      this.collector.add({
        rawSearchString: query.term,
        resultsCount: searchResults.hits?.length ?? 0,
        roundTripTime,
        query,
        cached,
        searchedAt: new Date()
      })
    }

    return searchResults
  }

  public createAnswerSession(params?: AnswerSessionParams) {
    return new AnswerSession({
      inferenceType: params?.inferenceType || 'documentation',
      initialMessages: params?.initialMessages || [],
      oramaClient: this,
      events: params?.events
    })
  }

  public startHeartBeat(config: HeartBeatConfig): void {
    this.heartbeat?.stop()
    this.heartbeat = new HeartBeat({
      ...config,
      endpoint: this.endpoint + `/health?api-key=${this.api_key}`
    })
    this.heartbeat.start()
  }

  public stopHeartBeat(): void {
    this.heartbeat?.stop()
  }

  public async getPop(): Promise<string> {
    const g = await this.initPromise
    return g?.pop ?? ''
  }

  private init(): void {
    this.initPromise = this.fetch<OramaInitResponse>('init', 'GET')
      .then((b) => {
        this.collector?.setParams({
          endpoint: b.collectUrl,
          deploymentID: b.deploymentID,
          index: b.index
        })

        return b
      })
      .catch((err) => {
        console.log(err)
        return null
      })
  }

  private async fetch<T = unknown>(path: Endpoint, method: Method, body?: object, abortController?: AbortController): Promise<T> {
    if (abortController?.signal.aborted === true) {
      throw new Error('Request aborted')
    }

    const requestOptions: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
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

    if (!res.ok) {
      const error = new Error() as OramaError
      error.httpResponse = res
      throw error
    }

    return await res.json()
  }
}
