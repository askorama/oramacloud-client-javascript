import { type SearchParams } from '@orama/orama'

export interface SearchEvent {
  rawSearchString?: string,
  query: SearchParams,
  resultsCount: number,
  roundTripTime: number,
  contentEncoding?: string,
  searchedAt: Date,
}

export interface ICollector {
  id: string,
  flushInterval: number
  flushSize: number
  endpoint: string
  api_key: string
  deploymentID: string
  index: string
}

export interface OramaInitResponse {
  orama: string,
  deploymentID: string,
  deploymentDatetime: string,
  collectUrl: string,
  index: string,
}

export interface IOramaClient {
  api_key: string
  endpoint: string
  throttle?: number
}

export type Endpoint =
  | 'search'
  | 'init'
  | 'info'
  | 'health'

export type Method =
  | 'GET'
  | 'POST'

