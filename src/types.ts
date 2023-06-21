import type { SearchParams } from '@orama/orama'

export type Optional<T = unknown> = T | undefined

export interface SearchEvent {
  rawSearchString?: string
  query: SearchParams
  resultsCount: number
  roundTripTime: number
  contentEncoding?: string
  searchedAt: Date,
  cached?: boolean
}

export interface ICollector {
  id: string
  flushInterval: number
  flushSize: number
  endpoint: string
  api_key: string
  deploymentID: string
  index: string
}

export interface OramaInitResponse {
  orama: string
  deploymentID: string
  deploymentDatetime: string
  collectUrl: string
  index: string
}

export interface IOramaClient {
  api_key: string
  endpoint: string
  throttle?: {
    frequency?: number
    enabled?: boolean
  }
  telemetry?: {
    enabled?: boolean
    flushInterval?: number
    flushSize?: number
  }
}

export type Endpoint =
  | 'search'
  | 'init'
  | 'info'
  | 'health'

export type Method =
  | 'GET'
  | 'POST'
