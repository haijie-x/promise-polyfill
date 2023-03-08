"use strict";

// src/index.ts
var id = 0;
var noopFn = () => {
};
function isThenable(obj) {
  return obj && obj.then && typeof obj.then === "function";
}
var PromiseA = class {
  constructor(executor) {
    this._resolves = [];
    this._rejects = [];
    this.status = "pending";
    this.id = ++id;
    executor == null ? void 0 : executor(this.resolve.bind(this), this.reject.bind(this));
  }
  resolve(v) {
    this.status = "fulfilled";
    this.value = v;
    this._resolves.forEach((cb) => {
      cb(v);
    });
  }
  reject(v) {
    this.status = "rejected";
    this.reason = v;
    this._rejects.forEach((cb) => {
      cb(v);
    });
  }
  then(onFulfilled, onRejected) {
    onFulfilled = onFulfilled ? onFulfilled : noopFn;
    onRejected = onRejected ? onRejected : noopFn;
    let next = new PromiseA();
    if ("pending" === this.status) {
      this._resolves.push(() => {
        const x = onFulfilled == null ? void 0 : onFulfilled(this.value);
        resolveX(next, x);
      });
      this._rejects.push(() => {
        const x = onRejected == null ? void 0 : onRejected(this.reason);
        resolveX(next, x);
      });
    } else if ("fulfilled" === this.status) {
      const x = onFulfilled == null ? void 0 : onFulfilled(this.value);
      resolveX(next, x);
    } else if ("rejected" === this.status) {
      const x = onRejected == null ? void 0 : onRejected(this.reason);
      resolveX(next, x);
    }
    return next;
  }
};
var resolveX = (promise, x) => {
  if (promise === x)
    throw new TypeError("Chaining cycle detected for promise #<Promise>");
  if (x instanceof PromiseA)
    resolvePromise(promise, x);
  else if (isThenable(x))
    resolveThen(promise, x);
  else
    promise.resolve(x);
};
var resolvePromise = (promise1, promise2) => {
  let status = promise2.status;
  if ("pending" === status)
    return promise2.then(
      promise1.resolve.bind(promise1),
      promise1.reject.bind(promise1)
    );
  if ("fulfilled" === status)
    return promise1.resolve(promise2.value);
  if ("rejected" === status)
    return promise1.reject(promise2.reason);
};
var resolveThen = (promise, thenable) => {
  const resolve = (value) => {
    resolveX(promise, value);
  };
  const reject = (reason) => {
    promise.reject(reason);
  };
  thenable.then.call(thenable, resolve, reject);
};
console.log(
  new PromiseA((ful, rej) => {
    ful(4);
  }).then((r) => {
    let a = new Promise((ful) => {
      setTimeout(() => {
        ful(`${r}4`);
      }, 200);
    }).then((r2) => {
      return r2;
    });
    return a;
  }).then((r) => {
    console.log(r);
  }).id
  // should be 6
);
