import type { ClientSearchParams } from '../src/client.js'

export type Optional<T = unknown> = T | undefined

export type Override<T extends object, K extends { [P in keyof T]?: unknown }> = Omit<T, keyof K> & K

export interface SearchEvent {
  rawSearchString?: string
  query: ClientSearchParams
  resultsCount: number
  roundTripTime: number
  searchedAt: Date
  userId: string
  cached?: boolean
  identity?: string
  alias?: string
}

export interface ICollector {
  endpoint: string
  deploymentID: string
  index: string
}

export interface OramaInitResponse {
  deploymentID: string
  deploymentDatetime: string
  collectUrl: string
  index: string
  pop: string
  searchSession?: { token: string; maxAge: number } | { required: true }
}

export interface IOramaClient {
  api_key: string
  endpoint: string
  answersApiBaseURL?: string
  telemetry?: Partial<TelemetryConfig> | false
  cache?: Partial<CacheConfig> | false
}

export interface TelemetryConfig {
  flushInterval: number
  flushSize: number
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface CacheConfig {}

export interface HeartBeatConfig {
  frequency: number
}

export type Endpoint = 'search' | 'init' | 'info' | 'health' | 'vector-search2'

export type Method = 'GET' | 'POST'

export interface OramaError extends Error {
  httpResponse?: Response
}

export type IOramaProxy = {
  api_key: string
}
