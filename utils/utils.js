/**
 * 函数去抖
 * @param {Function} fn 回调函数
 * @param {String} t 空闲多少毫秒执行回调
 */
function debounce(fn, t) {
    t = t || 300
    let debounceTid
    return (event) => {
        clearTimeout(debounceTid)
        debounceTid = setTimeout(() => {
            fn.call(this, event)
        }, t)
    }
}
