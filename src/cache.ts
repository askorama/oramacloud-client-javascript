import type { Optional } from "./types.js"
import { isBrowser } from "./utils.js"
import * as CONST from "./constants.js"

type CacheParams = {
  version: string
  persist?: boolean
}

type CacheMap<T = unknown> = Map<string, T>

export class Cache<V = unknown> {
  private cache: CacheMap<V>
  private readonly version: string 
  private readonly persist: boolean

  constructor(params: CacheParams) {
    this.cache = new Map()
    this.version = params.version
    this.persist = params.persist ?? true

    if (this.persist) {
      this.load()
    }
  }

  public set(key: string, value: V): void {
    this.cache.set(key, value)
  }

  public get(key: string): Optional<V> {
    return this.cache.get(key)
  }

  public has(key: string): boolean {
    return this.cache.has(key)
  }

  public delete(key: string): boolean {
    return this.cache.delete(key)
  }

  public clear(): void {
    this.cache.clear()
  }

  public size(): number {
    return this.cache.size
  }

  public save(): void {
    if (isBrowser) {
      const cacheData = JSON.stringify({ version: this.version, cache: [...this.cache] })
      localStorage.setItem(CONST.ORAMA_CACHE_LOCALSTORAGE_KEY, cacheData)
    }
  }

  public load(): void {
    if (isBrowser) {
      const cache = localStorage.getItem(CONST.ORAMA_CACHE_LOCALSTORAGE_KEY)

      if (cache != null) {
        const cacheData = JSON.parse(cache)
        if (cacheData.version !== this.version) {
          return this.clear()
        }

        this.cache = new Map(JSON.parse(cacheData.cache))
      }
    }
  }
}