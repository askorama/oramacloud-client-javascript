import type { SearchParams, Results, Nullable } from '@orama/orama'
import { OramaClient } from '../client.js'
import { IOramaCloudData, IUseSearch } from '../types.js'

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

  async search (query: SearchParams): Promise<IUseSearch> {
    let ready = false
    let results: Nullable<Results> = null
    let error: Nullable<Error> = null

    ready = true

    try {
      const oramaResults = await this.client.search(query)
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
