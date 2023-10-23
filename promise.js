const PENDING = 'PENDING'
const FULFILLED = 'FULFILLED'
const REJECTED = 'REJECTED'

//利用x的值来判断是调用promise2的resolve还是reject
function resolvePromise(promise2, x, resolve, reject) {
    //核心流程
    if (promise2 === x) {
        return reject(new TypeError('错误'))
    }
    //考虑和其他人写的promise兼容
    if ((typeof x === 'object' && x !== null) || typeof x === 'function') {
        let called = false
        try { //then()可能由defineProperty实现，可能发生异常
            let then = x.then
            if (typeof then === 'function') {
                //为promise，x.then 可能触发getter引起异常
                then.call(x, y => {
                    if (called) return
                    called = true
                    resolvePromise(promise2, y, resolve, reject)
                }, r => {
                    if (called) return
                    called = true
                    reject(r)
                })
            } else { //{} {then:{}}
                resolve(x)
            }
        } catch (e) {
            if (called) return
            called = true
            reject(e)
        }
    } else {
        resolve(x) //说明返回的是一个普通值，直接放到promise2.resolve中
    }
}

class Promise {
    constructor(executor) {
        this.status = PENDING
        this.value = undefined
        this.reason = undefined
        this.onResolvedCallbacks = []  //成功回调方法
        this.onRejectedCallbacks = []  //失败回调方法
        const resolve = (value) => {
            if (this.status === PENDING) {
                this.value = value
                this.status = FULFILLED //修改状态

                this.onResolvedCallbacks.forEach(fn => fn())

            }
        }
        const reject = (reason) => {
            if (this.status === PENDING) {
                this.reason = reason
                this.status = REJECTED

                this.onRejectedCallbacks.forEach(fn => fn())
            }
        }
        try {
            executor(resolve, reject)
        } catch (e) {
            reject(e)
        }

    }
    then(onFulfilled, onRejected) {
        onFulfilled = typeof onFulfilled == 'function' ? onFulfilled : v => v
        onRejected = typeof onRejected == 'function' ? onRejected : err => { throw err }
        //用于实现链式调用
        let promise2 = new Promise((resolve, reject) => {
            if (this.status === FULFILLED) {//成功调用成功方法
                setTimeout(() => {
                    try {
                        let x = onFulfilled(this.value)
                        resolvePromise(promise2, x, resolve, reject)
                    } catch (e) {
                        reject(e)
                    }
                }, 0)
            }
            if (this.status === REJECTED) {//失败调用失败方法
                setTimeout(() => {
                    try {
                        let x = onRejected(this.reason)
                        resolvePromise(promise2, x, resolve, reject)
                    } catch (e) {
                        reject(e)
                    }
                }, 0)
            }
            if (this.status === PENDING) {  //代码是异步调用resolve或者reject
                this.onResolvedCallbacks.push(() => {
                    setTimeout(() => {
                        try {
                            // to do...
                            let x = onFulfilled(this.value)
                            resolvePromise(promise2, x, resolve, reject)
                        } catch (e) {
                            reject(e)
                        }
                    }, 0)
                })
                this.onRejectedCallbacks.push(() => {
                    setTimeout(() => {
                        try {
                            //to do...
                            let x = onRejected(this.reason)
                            resolvePromise(promise2, x, resolve, reject)
                        } catch (e) {
                            reject(e)
                        }
                    }, 0)
                })
            }
        })
        return promise2


    }
}

Promise.deferred = function () {
    let dfd = {}
    dfd.promise = new Promise((resolve, reject) => {
        dfd.resolve = resolve
        dfd.reject = reject
    })
    return dfd
}



module.exports = Promise