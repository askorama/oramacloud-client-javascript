import fetchFn from './fetchFn.js'
import { SearchEvent, ICollector } from './types.js'

type Data = object[]

export class Collector {
  private readonly id: string
  private data: Data
  private readonly flushInterval: number
  private readonly flushSize: number
  private readonly endpoint: string
  private readonly api_key: string
  private readonly index: string
  private readonly deploymentID: string

  public static create (params: ICollector): Collector {
    const collector = new Collector(params)
    collector.start()
    return collector
  }

  private constructor (params: ICollector) {
    this.data = []
    this.id = params.id
    this.flushInterval = params.flushInterval
    this.flushSize = params.flushSize
    this.endpoint = params.endpoint
    this.api_key = params.api_key
    this.index = params.index
    this.deploymentID = params.deploymentID
  }

  public add (data: SearchEvent): void {
    this.data.push({
      rawSearchString: data.rawSearchString,
      query: data.query,
      resultsCount: data.resultsCount,
      roundTripTime: data.roundTripTime,
      contentEncoding: data.contentEncoding,
      searchedAt: data.searchedAt,
      // The referer is different for every event:
      // the user can search in different pages of the website
      // and the referer will be different for each page
      referer: typeof location !== 'undefined' ? location.toString() : undefined
      // The user agent instead is the same for every event
      // and can be gather from the request headers in the worker
    })

    if (this.data.length >= this.flushSize) {
      this.flush()
    }
  }

  public flush (): void {
    if (this.data.length === 0) {
      return
    }

    // Swap out the data array *sync*
    // so that we can continue to collect events
    const data = this.data
    this.data = []

    const body = {
      source: 'fe',
      deploymentID: this.deploymentID,
      index: this.index,
      id: this.id,
      events: data
    }

    fetchFn(this.endpoint, 'POST', {
      Authorization: `Bearer ${this.api_key}`
    }, body)
      .catch(err => console.error(err))
  }

  private start (): void {
    setInterval(this.flush.bind(this), this.flushInterval)
  }
}
