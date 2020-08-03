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
        const self=this

        // 指定回调函数的默认值
        onResolved=typeof onResolved==='function'?onResolved:value=>value
        onRejected=typeof onRejected==='function'?onRejected:reason=>{throw reason}

        return new Promise((resolve,reject)=>{
            // 执行器的回调函数
            // 根据执行的结果改变retuen的promise的状态/数据
            function handle(callback) {
                // 返回promise的结果由onResolved/onRejected执行结果决定
                try{
                    const result = callback(self.data)
                    if (result instanceof Promise){ // 2.如果当前返回的是promise，返回promise的结果就是这个结果
                        // result.then(
                        //     value => resolve(value),
                        //     reason => reject(reason)
                        // )
                        result.then(resolve,reject)
                    }else {   // 3.如果当前返回的不是promise，返回promise为成功，value就是返回值
                        resolve(result)
                    }
                } catch (e) {// 1.抛出异常 返回promise的结果为失败 reason为异常
                    reject(e)
                }
            }
            // 当前promise的状态是resolved
            if (self.status===RESOLVED){
                // 立即异步执行成功的回调函数
                setTimeout(()=>{
                    handle(onResolved)
                })
            } else if (self.status===REJECTED){ // 当前promise的状态是rejected
                setTimeout(()=>{
                    handle(onRejected)
                })
            } else { // 当前promise的状态是pending
                // 将成功和失败的回调函数保存到callbacks容器中
                self.callbacks.push({
                    onResolved(value){
                        handle(onResolved)
                    },
                    onRejected(reason){
                        handle(onRejected)
                    }
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
    Promise.resolve=function(value){}

    // promise函数对象reject方法
    // 返回一个指定reason失败的promise
    Promise.reject=function(reason){}

    // promise函数对象all方法
    // 返回一个promise 只有当所有promise成功才成功，否则失败
    Promise.all=function(promises){}

    // promise函数对象race方法
    // 返回一个promise 其结果由第一个完成的promise决定
    Promise.race=function(promises){}


    // 向外暴露promise函数
    window.Promise=Promise

})(window)
