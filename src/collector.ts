import fetchFn from "./fetchFn.js"
import { SearchEvent, ICollector } from "./types.js"

type Data = object[]

export class Collector {
  private readonly id: string
  private data: Data
  private flushInterval: number
  private flushSize: number
  private endpoint: string
  private api_key: string
  private readonly index: string
  private readonly deploymentID: string

  public static create (params: ICollector) {
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

  public add (data: SearchEvent) {
    this.data.push({
      index: this.index,
      id: this.id,
      source: 'fe',
      deploymentID: this.deploymentID,
      rawSearchString: data.rawSearchString,
      query: data.query,
      resultsCount: data.resultsCount,
      roundTripTime: data.roundTripTime,
      contentEncoding: data.contentEncoding,
      searchedAt: data.searchedAt,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      referrer: typeof location !== 'undefined' ? location.toString() : undefined,
    })

    if (this.data.length >= this.flushSize) {
      this.flush()
    }
  }

  public flush() {
    if (this.data.length === 0) {
      return
    }

    // Swap out the data array *sync*
    // so that we can continue to collect events
    let data = this.data
    this.data = []

    fetchFn(this.endpoint, 'POST', {
      Authorization: `Bearer ${this.api_key}`
    }, data)  
      .catch(err => console.error(err))
  }

  private start () {
    setInterval(this.flush.bind(this), this.flushInterval)
  }
}