import type { SearchParams, Results, Nullable, AnyDocument, AnyOrama } from '@orama/orama'
import { OramaClient } from '../client.js'

interface IOramaCloudData {
  endpoint: string
  apiKey: string
}

interface UseSearch {
  ready: boolean
  results: Nullable<Results<AnyDocument>>
  error: Nullable<Error>
}

export class OramaCloud {
  apiKey: string
  endpoint: string
  client: OramaClient

  constructor (clientData: IOramaCloudData) {
    this.apiKey = clientData.apiKey
    this.endpoint = clientData.endpoint
    try {
      this.client = new OramaClient({ api_key: this.apiKey, endpoint: this.endpoint })
    } catch (e: any) {
      throw new Error(e)
    }
  }

  async search (query: SearchParams<AnyOrama>): Promise<UseSearch> {
    let ready = false
    let results: Nullable<Results<AnyDocument>> = null
    let error: Nullable<Error> = null

    ready = true

    try {
      const oramaResults = await this.client?.search(query)
      results = oramaResults
    } catch (e: any) {
      error = e
    }

    return {
      ready,
      results,
      error
    }
  }
}
