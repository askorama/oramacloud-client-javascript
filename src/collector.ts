interface ICollector {
  flushInterval: number
  flushSize: number
  endpoint: string
  api_key: string
}

type Data = object[]

export class Collector {
  private data: Data
  private flushInterval: number
  private flushSize: number
  private endpoint: string
  private api_key: string

  constructor (params: ICollector) {
    this.data = []
    this.flushInterval = params.flushInterval
    this.flushSize = params.flushSize
    this.endpoint = params.endpoint
    this.api_key = params.api_key
  }

  public async add (data: object): Promise<void> {
    this.data.push(data)

    if (this.data.length >= this.flushSize) {
      await this.flush()
    }
  }

  public async flush (): Promise<void> {
    await fetch(this.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.api_key}`
      },
      body: JSON.stringify(this.data)
    })

    this.data = []
  }

  public async start (): Promise<void> {
    setInterval(this.flush.bind(this), this.flushInterval)
  }
}