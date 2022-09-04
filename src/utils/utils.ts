
// eslint-disable-next-line
export const debounce = (fn: (...args: any[]) => void, delay: number) => {
  // eslint-disable-next-line
  let timer: any = null
  // eslint-disable-next-line
  return function (this: any, ...args: any[]) {
    timer && clearTimeout(timer)
    timer = setTimeout(() => fn.apply(this, args), delay)
  }
}
