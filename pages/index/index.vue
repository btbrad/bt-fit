<template>
	<view class="page">
		<!-- 顶部标题 -->
		<AppHeader />

		<!-- BMI 分析卡片（顶部） -->
		<BmiCard ref="bmiCardRef" :records="records" />

		<!-- 数据概览 -->
		<WeightSummary :records="records" />

		<!-- 录入（修改请到记录列表页） -->
		<RecordForm ref="recordFormRef" @submit="onSubmit" />
	</view>
</template>

<script setup>
	import { ref } from 'vue'
	import { onShow } from '@dcloudio/uni-app'
	import AppHeader from './components/AppHeader.vue'
	import BmiCard from './components/BmiCard.vue'
	import WeightSummary from './components/WeightSummary.vue'
	import RecordForm from '@/components/RecordForm.vue'
	import { addWeightRecordApi, getWeightRecordsApi } from '@/api/index.js'

	const USER_KEY = 'bt_fit_user'

	// 响应式状态
	const records = ref([])
	const recordFormRef = ref(null) // RecordForm 实例，用于新增成功后清空体重输入
	const bmiCardRef = ref(null) // BmiCard 实例，用于页面 onShow 时刷新个人信息（如从个人信息页返回）
	const PER_PAGE = 100 // 概览卡片需要全量数据，用大分页尽量一次拉全
	const MAX_PAGES = 20 // 翻页安全上限，防止接口异常时死循环
	const loading = ref(false) // 加载锁，防止重复触发

	// 字段归一化：后端 id / recorded_at / weight -> 前端 id / date / weight
	const normalizeRecord = (item) => ({
		id: String(item.id),
		date: String(item.recorded_at || '').slice(0, 10),
		weight: +item.weight
	})

	// 翻页拉全所有记录，保证概览统计（记录数 / 最新体重 / BMI）准确
	const loadRecords = async () => {
		if (loading.value) return
		loading.value = true
		try {
			const list = []
			for (let p = 1; p <= MAX_PAGES; p++) {
				const data = await getWeightRecordsApi(
					{ page: p, per_page: PER_PAGE },
					{ loading: p === 1 } // 仅第一页显示全局 loading，避免翻页闪烁
				)
				// 兼容后端直接返回数组，或 { list/items/records, total } 两种结构
				const arr = Array.isArray(data) ? data : (data.list || data.items || data.records || [])
				list.push(...arr.map(normalizeRecord))
				if (arr.length < PER_PAGE) break // 本页不满，说明已拉完
			}
			records.value = list
		} catch (e) {
			// 失败提示由 request 封装统一 toast
		} finally {
			loading.value = false
		}
	}

	// 表单提交：新增（调用接口后拉取最新列表）
	const onSubmit = async ({ date, weight }) => {
		try {
			await addWeightRecordApi({
				weight,
				recorded_at: date
			})
			uni.showToast({ title: '记录成功 🎉', icon: 'none' })
			recordFormRef.value && recordFormRef.value.resetWeight()
			// 重新拉取全量，以服务端数据为准
			loadRecords()
		} catch (e) {
			// 失败提示由 request 封装统一 toast，这里只需保持表单不重置
		}
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
		bmiCardRef.value && bmiCardRef.value.refresh()
	})
</script>

<style>
	.page {
		min-height: 100vh;
		background: linear-gradient(180deg, #e8f5f0 0%, #f6f8f7 320rpx);
		padding: 30rpx 28rpx 60rpx;
		box-sizing: border-box;
	}
</style>
