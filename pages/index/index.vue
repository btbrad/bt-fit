<template>
	<view class="page">
		<!-- 顶部标题 -->
		<AppHeader />

		<!-- 数据概览 -->
		<WeightSummary :records="records" />

		<!-- 录入 / 修改 -->
		<RecordForm ref="recordFormRef" :editing="editing" @submit="onSubmit" @cancel="editing = null" />

		<!-- 列表 -->
		<RecordList :records="records" @edit="onEdit" @remove="onRemove" />

		<view v-if="records.length" class="load-more">
			<text v-if="loadingMore">加载中...</text>
			<text v-else-if="!hasMore">— 没有更多了 —</text>
		</view>
	</view>
</template>

<script setup>
	import { ref } from 'vue'
	import { onShow, onReachBottom } from '@dcloudio/uni-app'
	import AppHeader from './components/AppHeader.vue'
	import WeightSummary from './components/WeightSummary.vue'
	import RecordForm from './components/RecordForm.vue'
	import RecordList from './components/RecordList.vue'
	import { addWeightRecordApi, getWeightRecordsApi } from '@/api/index.js'

	const USER_KEY = 'bt_fit_user'

	// 响应式状态
	const records = ref([])
	const editing = ref(null) // 正在编辑的记录对象，null 表示新增态
	const recordFormRef = ref(null) // RecordForm 实例，用于新增成功后清空体重输入
	const PER_PAGE = 20 // 每页条数
	const page = ref(1) // 当前页码
	const hasMore = ref(true) // 是否还有下一页
	const loadingMore = ref(false) // 上拉加载锁，防止重复触发

	// 拉取指定页数据；refresh 为 true 时重置到第一页并清空列表
	const fetchRecords = async (refresh = false) => {
		if (loadingMore.value) return
		if (!refresh && !hasMore.value) return
		loadingMore.value = true
		try {
			const data = await getWeightRecordsApi({ page: page.value, per_page: PER_PAGE })
			// 兼容后端直接返回数组，或 { list/items/records, total } 两种结构
			const list = Array.isArray(data) ? data : (data.list || data.items || data.records || [])
			const normalized = list.map(normalizeRecord)
			records.value = refresh ? normalized : records.value.concat(normalized)
			// 本页不满一页或已累计全部 total，说明没有更多
			const total = Array.isArray(data) || data.total === undefined ? null : +data.total
			hasMore.value = list.length === PER_PAGE && (total === null || records.value.length < total)
			if (hasMore.value) page.value++
		} catch (e) {
			// 失败提示由 request 封装统一 toast
		} finally {
			loadingMore.value = false
		}
	}

	// 首次进入 / 刷新：回到第一页
	const loadRecords = () => {
		page.value = 1
		hasMore.value = true
		records.value = []
		fetchRecords(true)
	}

	// 上拉触底：加载下一页
	const onReachBottomHandler = () => {
		fetchRecords()
	}

	// 字段归一化：后端 id / recorded_at / weight -> 前端 id / date / weight
	const normalizeRecord = (item) => ({
		id: String(item.id),
		date: String(item.recorded_at || '').slice(0, 10),
		weight: +item.weight
	})

	// 表单提交：新增（调用接口后拉取最新列表）或更新（本地）
	const onSubmit = async ({ id, date, weight }) => {
		if (id) {
			const idx = records.value.findIndex(r => r.id === id)
			if (idx > -1) {
				records.value.splice(idx, 1, { ...records.value[idx], date, weight })
			}
			uni.showToast({ title: '已更新 ✅', icon: 'none' })
			editing.value = null
			return
		}
		try {
			await addWeightRecordApi({
				weight,
				recorded_at: date
			})
			uni.showToast({ title: '记录成功 🎉', icon: 'none' })
			recordFormRef.value && recordFormRef.value.resetWeight()
			// 重新拉取第一页，以服务端数据为准
			loadRecords()
		} catch (e) {
			// 失败提示由 request 封装统一 toast，这里只需保持表单不重置
		}
	}

	// 点击列表项进入编辑
	const onEdit = (item) => {
		editing.value = item
		uni.pageScrollTo({ scrollTop: 0, duration: 200 })
	}

	// 删除记录（二次确认）
	const onRemove = (id) => {
		uni.showModal({
			title: '删除记录',
			content: '确定要删除这条记录吗？',
			confirmColor: '#ef4444',
			success: res => {
				if (res.confirm) {
					records.value = records.value.filter(r => r.id !== id)
					if (editing.value && editing.value.id === id) editing.value = null
					uni.showToast({ title: '已删除 🗑️', icon: 'none' })
				}
			}
		})
	}

	// 页面生命周期
	onShow(() => {
		// 登录态校验：未登录则跳回登录页
		const user = uni.getStorageSync(USER_KEY)
		if (!user || !user.name) {
			uni.reLaunch({ url: '/pages/login/login' })
			return
		}
		loadRecords()
	})

	// 上拉触底加载下一页
	onReachBottom(onReachBottomHandler)
</script>

<style>
	.page {
		min-height: 100vh;
		background: linear-gradient(180deg, #e8f5f0 0%, #f6f8f7 320rpx);
		padding: 30rpx 28rpx 60rpx;
		box-sizing: border-box;
	}

	.load-more {
		margin-top: 24rpx;
		text-align: center;
		font-size: 24rpx;
		color: #b6bfbb;
	}
</style>
