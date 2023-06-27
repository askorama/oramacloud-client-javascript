import { HeartBeatConfig } from './types.js'

export class HeartBeat {
  private intervalId?: number

  constructor (private readonly params: HeartBeatConstructor) {}

  public start (): void {
    this.stop()
    // @ts-expect-error - setInterval ID is actually a number
    this.intervalId = setInterval(this.beat.bind(this), this.params.frequency)
  }

  public stop (): void {
    if (this.intervalId) {
      clearInterval(this.intervalId)
    }
  }

  private beat (): void {
    navigator.sendBeacon?.(this.params.endpoint)
  }
}

export interface HeartBeatConstructor extends HeartBeatConfig {
  endpoint: string
}
