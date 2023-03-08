type Executor = (
  resolve: <T>(v?: T) => void,
  reject: <T>(v?: T) => void,
) => void

type OnFulfilled = <T>(v?: T) => unknown
type OnRejected = <T>(v?: T) => unknown
type Resolves = OnFulfilled[]
type Rejects = OnRejected[]

let id = 0
const noopFn = () => {}

function isThenable(obj: any) {
  return obj && obj.then && typeof obj.then === 'function'
}

class PromiseA {
  _resolves: Resolves = []
  _rejects: Rejects = []
  status: 'pending' | 'fulfilled' | 'rejected'
  value: unknown
  reason: unknown
  // TODO: for debug
  id: number

  constructor(executor?: Executor) {
    this.status = 'pending'
    this.id = ++id

    executor?.(this.resolve.bind(this), this.reject.bind(this))
  }

  resolve(v: unknown) {
    this.status = 'fulfilled'
    this.value = v
    this._resolves.forEach((cb) => {
      cb(v)
    })
  }

  reject(v: unknown) {
    this.status = 'rejected'
    this.reason = v
    this._rejects.forEach((cb) => {
      cb(v)
    })
  }

  then(onFulfilled?: OnFulfilled, onRejected?: OnRejected) {
    onFulfilled = onFulfilled ? onFulfilled : noopFn
    onRejected = onRejected ? onRejected : noopFn
    let next = new PromiseA()

    if ('pending' === this.status) {
      this._resolves.push(() => {
        const x = onFulfilled?.(this.value)
        resolveX(next, x)
      })
      this._rejects.push(() => {
        const x = onRejected?.(this.reason)
        resolveX(next, x)
      })
    } else if ('fulfilled' === this.status) {
      const x = onFulfilled?.(this.value)
      resolveX(next, x)
    } else if ('rejected' === this.status) {
      const x = onRejected?.(this.reason)
      resolveX(next, x)
    }
    return next
  }
}

let resolveX = (promise: PromiseA, x: unknown) => {
  if (promise === x)
    throw new TypeError('Chaining cycle detected for promise #<Promise>')

  if (x instanceof PromiseA) resolvePromise(promise, x)
  else if (isThenable(x)) resolveThen(promise, x)
  else promise.resolve(x)
}

let resolvePromise = (promise1: PromiseA, promise2: PromiseA) => {
  let status = promise2.status
  if ('pending' === status)
    return promise2.then(
      promise1.resolve.bind(promise1),
      promise1.reject.bind(promise1),
    )
  if ('fulfilled' === status) return promise1.resolve(promise2.value)
  if ('rejected' === status) return promise1.reject(promise2.reason)
}

let resolveThen = (promise: PromiseA, thenable: any) => {
  const resolve = (value: unknown) => {
    resolveX(promise, value)
  }
  const reject = (reason: unknown) => {
    promise.reject(reason)
  }
  thenable.then.call(thenable, resolve, reject)
}

console.log(
  new PromiseA((ful, rej) => {
    ful(4)
  })
    .then((r: any) => {
      let a = new Promise((ful) => {
        setTimeout(() => {
          ful(`${r}` + 4)
        }, 200)
      }).then((r) => {
        return r
      })
      // console.log(a.id) // should be 4
      return a
    })
    .then((r) => {
      console.log(r)
    }).id, // should be 6
)
