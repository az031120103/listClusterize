###长列表性能优化组件

    <template>
        <div class="list">
            <listClusterize
                :thisData="list"
                sliceSize="2">
                <template slot-scope="scope">
                    <div
                        class="item"
                        :data-code="scope.row.code">
                        {{scope.row.name}}
                    </div>
                </template>
            </listClusterize>
        </div>
    </template>

    <script>
        import ListClusterize from 'listClusterize.vue'

        export default {
            data() {
                return {
                    list: [
                        {
                            code: '200',
                            name: '上海'
                        },
                        {
                            code: '201',
                            name: '北京'
                        },
                        {
                            code: '202',
                            name: '天津'
                        },
                        {
                            code: '203',
                            name: '广州'
                        },
                        {
                            code: '204',
                            name: '合肥'
                        },
                        {
                            code: '205',
                            name: '南京'
                        }
                    ]
                }
            }
        }
    </script>

    <style scoped>
    </style>
    

