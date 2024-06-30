export const hasLocalStorage = typeof localStorage !== 'undefined'

type SSESourcePayload = {
  type: 'sources'
  message: object
}

type SSETextStreamPayload = {
  type: 'text'
  message: string
  endOfBlock: boolean
}

type SSEParsedPayload = SSESourcePayload | SSETextStreamPayload

type SSEPayload = {
  data: string
  event: string
}

export function throttle(func: (...args: any[]) => any, limit: number) {
  let inThrottle: boolean
  return function () {
    const args = arguments
    const context = this
    if (!inThrottle) {
      func.apply(context, args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

export function debounce(func: (...args: any[]) => any, delay: number) {
  let debounceTimer: NodeJS.Timer
  return function () {
    const context = this
    const args = arguments
    clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => func.apply(context, args), delay)
  }
}

export function parseSSE(input: string): SSEPayload {
  const [event, ...data] = input.split('\n')
  const eventData = data.join('\n').replace('data: ', '')

  return {
    event: event.replace('event: ', ''),
    data: eventData
  }
}
