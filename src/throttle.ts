type ThrottleFunction = (...args: any[]) => void
type VoidFunction = (...args: any[]) => void

export function throttle (func: ThrottleFunction, limit: number): VoidFunction {
  let inThrottle: boolean

  return function (...args: any[]): void {
    // @ts-expect-error - `this` cannot be casted to `any`
    const context = this
    if (!inThrottle) {
      func.apply(context, args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}
