export const hasLocalStorage = typeof localStorage !== 'undefined'

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

export function parseSSE(data: string): SSEPayload {
  const lines = data.split('\n')
  const obj: Record<string, string> = {}
  for (const line of lines) {
    const [key, value] = line.split(': ')
    if (key) {
      obj[key] = value
    }
  }
  return obj as SSEPayload
}
