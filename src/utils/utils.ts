
export const debounce = (fn: (...args: any[]) => void, delay: number) => {
  let timer: any = null
  return function (this: any, ...args: any[]) {
    timer && clearTimeout(timer)
    timer = setTimeout(() => fn.apply(this, args), delay)
  }
}
