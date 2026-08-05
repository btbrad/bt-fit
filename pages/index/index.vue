<template>
	<view class="page">
		<!-- 顶部标题 -->
		<AppHeader />

		<!-- 数据概览 -->
		<WeightSummary :records="records" />

		<!-- 录入 / 修改 -->
		<RecordForm :editing="editing" @submit="onSubmit" @cancel="editing = null" />

		<!-- 列表 -->
		<RecordList :records="records" @edit="onEdit" @remove="onRemove" />

		<view class="footer-tip">💡 数据保存在本地，请勿随意清理缓存</view>
	</view>
</template>

<script setup>
	import { ref } from 'vue'
	import { onLoad } from '@dcloudio/uni-app'
	import AppHeader from './components/AppHeader.vue'
	import WeightSummary from './components/WeightSummary.vue'
	import RecordForm from './components/RecordForm.vue'
	import RecordList from './components/RecordList.vue'

	const STORAGE_KEY = 'bt_fit_weight_records'

	// 响应式状态
	const records = ref([])
	const editing = ref(null) // 正在编辑的记录对象，null 表示新增态

	// 本地存储
	const loadRecords = () => {
		const data = uni.getStorageSync(STORAGE_KEY)
		records.value = Array.isArray(data) ? data : []
	}

	const persist = () => {
		uni.setStorageSync(STORAGE_KEY, records.value)
	}

	// 表单提交：新增或更新
	const onSubmit = ({ id, date, weight }) => {
		if (id) {
			const idx = records.value.findIndex(r => r.id === id)
			if (idx > -1) {
				records.value.splice(idx, 1, { ...records.value[idx], date, weight })
			}
			uni.showToast({ title: '已更新 ✅', icon: 'none' })
		} else {
			records.value.push({
				id: String(Date.now()),
				date,
				weight
			})
			uni.showToast({ title: '记录成功 🎉', icon: 'none' })
		}
		editing.value = null
		persist()
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
					persist()
					uni.showToast({ title: '已删除 🗑️', icon: 'none' })
				}
			}
		})
	}

	// 页面生命周期
	onLoad(() => {
		loadRecords()
	})
</script>

<style>
	.page {
		min-height: 100vh;
		background: linear-gradient(180deg, #e8f5f0 0%, #f6f8f7 320rpx);
		padding: 30rpx 28rpx 60rpx;
		box-sizing: border-box;
	}

	.footer-tip {
		margin-top: 36rpx;
		text-align: center;
		font-size: 22rpx;
		color: #b6bfbb;
	}
</style>
