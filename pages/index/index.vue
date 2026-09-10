<template>
	<view class="page">
		<!-- 顶部标题 -->
		<AppHeader />

		<!-- BMI 分析卡片（顶部）：未登录展示「去登录」引导，不请求接口 -->
		<BmiCard ref="bmiCardRef" :records="records" :guest="!isLoggedInRef" />

		<!-- 数据概览：未登录为空数据，点击记录数跳登录页 -->
		<WeightSummary :records="records" :guest="!isLoggedInRef" />

		<!-- 录入（修改请到记录列表页）：未登录点击记录跳登录页 -->
		<RecordForm ref="recordFormRef" :guest="!isLoggedInRef" @submit="onSubmit" />
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
	import { isLoggedIn } from '@/utils/auth.js'

	// 响应式状态
	const isLoggedInRef = ref(false) // 是否已登录（未登录时卡片空数据 + 去登录引导）
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
		// 未登录可正常浏览首页：登录态卡片展示为空数据，不请求接口（小程序上架要求）
		isLoggedInRef.value = isLoggedIn()
		if (!isLoggedInRef.value) {
			records.value = []
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
