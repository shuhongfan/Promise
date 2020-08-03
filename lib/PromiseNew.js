// 自定义promise函数模块

// 匿名函数自调用IIFE
(function (window) {
    const PENDING='pending'
    const RESOLVED='resolved'
    const REJECTED='rejected'
    // Promise构造函数
    // excutor执行器函数
    function Promise(excutor) {
        // 将当前promise对象保存起来
        const self=this
        // 存储状态 给promise对象指定status属性 初始值为pending
        self.status=PENDING
        // 存储数据结果值 给promise对象指定一个用于存储结果数据的属性
        self.data=undefined
        // 存储回调函数 每个元素的结构 {onResolved(){},onRejected(){}}
        self.callbacks=[]

        // 用于改变状态的函数
        function resolve (value) {
            // 如果当前状态不是pending 直接结束
            if (self.status!==PENDING){
                return false
            }

            // 将状态改为resolved
            self.status=RESOLVED
            // 保存value数据
            self.data=value
            // 如果有待执行callback函数 立即异步执行回调函数
            if (self.callbacks.length>0){
                setTimeout(()=>{ // 放入队列执行成功回调
                    self.callbacks.forEach(callbacksObj=>{
                        callbacksObj.onResolved(value)
                    })
                })
            }
        }

        function reject(reason) {
            // 如果当前状态不是pending 直接结束
            if (self.status!==PENDING){
                return false
            }

            // 将状态改为rejected
            self.status=REJECTED
            // 保存value数据
            self.data=reason
            // 如果有待执行callback函数 立即异步执行回调函数
            if (self.callbacks.length>0){
                setTimeout(()=>{ // 放入队列执行失败回调
                    self.callbacks.forEach(callbacksObj=>{
                        callbacksObj.onRejected(reason)
                    })
                })
            }
        }

        // 立即同步执行excutor

        try{
            excutor(resolve,reject)
        } catch (e) {
            // 如果执行器抛出异常 promise对象变为失败rejected
            reject(e)
        }

    }

    // Promise原型对象then()
    // 指定成功失败的回调函数
    // 返回一个新的promise对象
    Promise.prototype.then=function(onResolved,onRejected){
        // 指定默认失败的回调 实现异常传透
        onRejected = typeof onRejected==='function'?onRejected:reason=>{throw reason}
        onResolved = typeof onResolved==='function'?onResolved:value=>value // 向后传递成功的value

        const self=this
        // 返回一个新的promise对象
        return new Promise((resolve,reject)=>{
            // 调用指定回调函数处理 根据执行结果 改变return的promise状态
            function handle(callback) {
                try{
                    const result = callback(self.data)
                    if (result instanceof Promise){// 3.如果回调函数是promise，retuen的promise就会和这个返回promise相同
                        // result.then(
                        //     value => {
                        //         resolve(value) // 当result成功时，让retuen的promise也成功
                        //     },
                        //     reason => {
                        //         reject(reject) // 当result失败时，让return的promise也失败
                        //     }
                        // )
                        result.then(resolve,reject)
                    }else {
                        resolve(result)// 2.如果回调函数执行返回非promise，return的promise就会成功，value就是return的值
                    }
                }catch (e) {
                    reject(e)// 1.如果执行抛出异常，retuen的promise就会失败，reason就是error
                }
            }
            if (self.status===PENDING){
                // 假设当前状态还是pending状态 将回调函数保存起来
                self.callbacks.push({
                    onResolved(value){
                        handle(onResolved)
                    },
                    onRejected(reason){
                        handle(onRejected)
                    }
                })
                // 如果当前是resolved状态 异步执行onResolved并改变return的promise状态
            } else if (self.status===RESOLVED){
                setTimeout(()=>{
                    handle(onResolved)
                })
            } else { //rejected
                setTimeout(()=>{
                    handle(onRejected)
                })
            }
        })
    }

    // Promise原型对象catch()
    // 指定失败回调函数
    // 返回新的promise对象
    Promise.prototype.catch=function(onRejected){
        return this.then(undefined,onRejected)
    }

    // promise函数对象resolve方法
    // 返回一个指定结果成功的promise
    Promise.resolve=function(value){
        // 返回一个成功/失败的promise
        return new Promise((resolve,reject)=>{
            // value是promise
            if (value instanceof Promise){ // 使用value的结果作为promise的结果
                value.then(resolve,reject)
            } else { // value不是promise promise变为成功 数据是value
                resolve(value)
            }
        })
    }

    // promise函数对象reject方法
    // 返回一个指定reason失败的promise
    Promise.reject=function(reason){
        // 返回一个失败的promise
        return new Promise((resolve,reject)=>{
            reject(reason)
        })
    }

    // promise函数对象all方法
    // 返回一个promise 只有当所有promise成功才成功，否则失败
    Promise.all=function(promises){
        // 用来保存所有成功value的数组
        const values = new Array(promises.length) // 用来保存所有成功value的数组
        // 用来保存成功promise的数量
        let resolvedCount = 0

        // 返回一个新的promise
        return new Promise((resolve,reject)=>{
            // 遍历获取每个promise的结果
            promises.forEach((p,index)=>{
                Promise.resolve(p).then(
                    value => {
                        resolvedCount++ //成功数量加1
                        // p成功 将成功的value保存values
                        // values.push(value)
                        values[index]=value
                        // console.log(values)
                        // 如果全部成功 将return的promise改为成功
                        if (resolvedCount===promises.length){
                            resolve(values)
                        }
                    },
                    reason => { // 只要有一个失败 return的promise就失败
                        reject(reason)
                    }
                )
            })
        })
    }

    // promise函数对象race方法
    // 返回一个promise 其结果由第一个完成的promise决定
    Promise.race=function(promises){
        // 返回一个promise
        return new Promise((resolve,reject)=>{
            // 遍历promises获取每个promise的结果
            promises.forEach((p,index)=>{
                Promise.resolve(p).then(
                    value => { // 一旦成功了，将return变为成功
                        resolve(value)
                    },
                    reason => { // 一旦失败了，将return变为失败
                        reject(reason)
                    }
                )
            })
        })
    }

    // 返回一个promise对象 在指定的时间后才产生结果
    Promise.resolveDelay=function(value,time){
        // 返回一个成功/失败的promise
        return new Promise((resolve,reject)=>{
            setTimeout(()=>{
                // value是promise
                if (value instanceof Promise){ // 使用value的结果作为promise的结果
                    value.then(resolve,reject)
                } else { // value不是promise promise变为成功，数据是value
                    resolve(value)
                }
            },time)
        })
    }

    // 返回一个promise对象 在指定的时间后才失败
    Promise.rejectDelay=function(reason,time){
        return new Promise((resolve,reject)=>{
            setTimeout(()=>{
                reject(reason)
            },time)
        })
    }

    // 向外暴露promise函数
    window.Promise=Promise

})(window)
