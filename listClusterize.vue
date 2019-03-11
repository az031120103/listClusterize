<template>
    <section
        class="clusterize-list"
        :style="{paddingTop: `${paddingTop}px`}"
        v-if="visibleData && visibleData.length">
        <template v-for="(item, index) in visibleData">
            <slot :row="item" :index="index"></slot>
        </template>
        <slot name="loadMore"></slot>
    </section>
</template>

<script>
    /**
     * 长列表分片加载组件
     * @author leeroy
     * @editor 2019-01-25
     */
    import Utils from './utils/utils'

    const VISIBLE_SLICE_COUNT = 3
    export default {
        data() {
            return {
                processing: false,
                currentSliceIndex: 0,
                paddingTop: 0,
                startBoundary: null,
                topBoundary: null,
                bottomBoundary: null,
                topSpaces: []
            }
        },
        props: {
            thisData: {
                type: Array,
                default() {
                    return []
                }
            },
            isLoading: {
                type: Boolean,
                default: false
            },
            isDrained: {
                type: Boolean,
                default: true
            },
            sliceSize: {
                type: Number,
                default: 20
            },
            sliceThreshold: {
                type: Number,
                default: 20
            }
        },
        watch: {
        },
        computed: {
            // 数据分段 [slice0, slice1, slice2, ...]
            slices() {
                return this.getSlices(this.thisData, this.sliceSize)
            },
            visibleData() {
                const {slices, currentSliceIndex} = this
                const visibleSlices = slices.slice(
                    currentSliceIndex,
                    currentSliceIndex + VISIBLE_SLICE_COUNT
                )
                const startIndex = (visibleSlices[0] && visibleSlices[0].startIndex) || 0
                const amount = visibleSlices.reduce(
                    (amount, slice) => slice.amount + amount,
                    0
                )
                return (this.thisData && this.thisData.slice(startIndex, startIndex + amount)) || []
            },
            shouldOptimize() {
                const {slices} = this
                return slices.length > VISIBLE_SLICE_COUNT
            }
        },
        methods: {
            // 计算生成 slices
            getSlices(data, sliceSize) {
                data = data || this.thisData
                sliceSize = sliceSize || this.sliceSize
                let slices = []
                for(let i = 0, amount = data.length; amount >= 0; i++, amount -= sliceSize) {
                    slices.push({
                        startIndex: sliceSize * i,
                        amount: amount > sliceSize ? sliceSize : amount
                    })
                }
                return slices
            },
            bindScrollHandler() {
                window.addEventListener('scroll', Utils.debounce(this.handleClusterizeScroll, 50), false)
            },
            removeScrollHandler() {
                window.removeEventListener('scroll', this.handleClusterizeScroll, false)
            },
            // 滚动事件处理
            handleClusterizeScroll() {
                if (!this.shouldOptimize || this.processing) {
                    return
                }
                if (!this.topBoundary || !this.bottomBoundary) {
                    return
                }
                const sliceThreshold = this.sliceThreshold
                const {slices, currentSliceIndex, topSpaces} = this
                const topBoundaryLoc = this.topBoundary.getBoundingClientRect().top
                const bottomBoundaryLoc = this.bottomBoundary.getBoundingClientRect().top
                const containerTop = this.$el.getBoundingClientRect().top
                if (
                    bottomBoundaryLoc < Math.abs(sliceThreshold) &&
                    currentSliceIndex + VISIBLE_SLICE_COUNT < slices.length
                ) {
                    this.processing = true
                    const startY = this.startBoundary.getBoundingClientRect().top
                    const topSpace = topBoundaryLoc - startY
                    this.currentSliceIndex = this.currentSliceIndex + 1
                    this.topSpaces = this.topSpaces.concat(topSpace)
                    this.bindBoundaryEls()
                    this.processing = false
                    return
                }

                if (
                    topBoundaryLoc > Math.abs(containerTop + this.paddingTop + sliceThreshold) &&
                    currentSliceIndex > 0
                ) {
                    this.processing = true
                    this.currentSliceIndex = this.currentSliceIndex - 1
                    this.topSpaces = this.topSpaces.slice(0, topSpaces.length - 1)
                    this.bindBoundaryEls()
                    this.processing = false
                }
            },
            // 获取 slice[1] 第一个元素
            bindBoundaryEls() {
                const {slices, currentSliceIndex} = this
                const nodeList = this.$el.children
                // 获取 slice[0] 首位元素
                this.startBoundary = nodeList[0]
                // 获取 slice[1] 首位元素
                this.topBoundary = nodeList[slices[currentSliceIndex].amount]
                // 获取 slice[2] 末位元素
                this.bottomBoundary = nodeList[
                    slices[currentSliceIndex].amount +
                    slices[currentSliceIndex + 1].amount -
                    1
                ]
            },
            unbindBoundaryEls() {
                this.startBoundary = null
                this.topBoundary = null
                this.bottomBoundary = null
            },
            mayLoadMore() {
                const {top: containerY} = this.$el.getBoundingClientRect()
                const containerHeight = this.$el.clientHeight
                const {top: placeholderY} = this.$slots.loadMore.getBoundingClientRect()
                if (placeholderY <= containerHeight + containerY) {
                    this.$emit('loadMore')
                }
            },
            // 观察 slices[1] 出现在可视区
            handleObserve([entry]) {
                if (!entry.isIntersecting) return
                const {isLoading, isDrained} = this
                if (isLoading || isDrained) return
                this.$emit('loadMore')
            },
            // 开始观察 slices[1]
            startObserve() {
                // 销毁已经存在的 Observer
                this.stopObserve()
                this.observer = new IntersectionObserver(this.handleObserve)
                this.observer.observe(this.$slots.loadMore)
            },
            // 停止观察 slices[1]
            stopObserve() {
                if (this.observer) {
                    this.observer.disconnect()
                    this.observer = undefined
                }
            }
        },
        mounted() {
            const {isDrained} = this
            this.bindScrollHandler()
            if (this.shouldOptimize) {
                this.bindBoundaryEls()
            }
            if (isDrained) return
            this.startObserve()
        },
        updated() {
            if (this.shouldOptimize) {
                this.bindBoundaryEls()
                this.paddingTop = this.topSpaces.reduce((total, curr) => curr + total, 0)
            } else {
                this.unbindBoundaryEls()
                this.paddingTop = 0
                this.currentSliceIndex = 0
                this.topSpaces = []
            }
            const {isLoading, isDrained} = this
            if (isLoading) return
            if (isDrained) {
                this.stopObserve()
                return
            }
            if (!isDrained) {
                this.startObserve()
                return
            }
            this.mayLoadMore()
        },
        destroyed() {
            this.removeScrollHandler()
            this.unbindBoundaryEls()
            this.stopObserve()
            this.paddingTop = 0
            this.currentSliceIndex = 0
            this.topSpaces = []
        }
    }
</script>

<style lang="scss" scoped>
    .clusterize-list {}
</style>
