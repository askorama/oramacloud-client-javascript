export const hasLocalStorage = typeof localStorage !== 'undefined'

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
