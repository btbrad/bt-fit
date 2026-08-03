<template>
	<view class="page">
		<!-- 顶部标题 -->
		<view class="header">
			<view class="header-title">
				<text class="header-emoji">⚖️</text>
				<text class="header-text">体重记录</text>
			</view>
			<text class="header-sub">坚持记录，见证改变 💪</text>
		</view>

		<!-- 数据概览 -->
		<view class="summary">
			<view class="summary-card main">
				<text class="summary-label">📊 当前体重</text>
				<view class="summary-value-row">
					<text class="summary-value">{{ latest ? latest.weight : '--' }}</text>
					<text class="summary-unit">kg</text>
				</view>
				<view class="summary-trend">
					<text v-if="trend !== null" :class="['trend', trend < 0 ? 'down' : 'up']">
						{{ trend < 0 ? '📉' : '📈' }} 较上次 {{ trend > 0 ? '+' : '' }}{{ trend.toFixed(1) }} kg
					</text>
					<text v-else class="trend muted">{{ latest ? '暂无对比数据' : '快添加第一条记录吧' }}</text>
				</view>
			</view>
			<view class="summary-card side">
				<text class="summary-label">📝 记录数</text>
				<text class="summary-value small">{{ records.length }}</text>
				<text class="summary-unit">条</text>
			</view>
		</view>

		<!-- 录入 / 修改 -->
		<view class="form-card">
			<view class="form-title">{{ editingId ? '✏️ 修改记录' : '➕ 新增记录' }}</view>
			<view class="form-row">
				<view class="form-item">
					<text class="form-label">📅 日期</text>
					<picker mode="date" :value="form.date" @change="onDateChange">
						<view class="picker-value">{{ form.date }} <text class="caret">▾</text></view>
					</picker>
				</view>
				<view class="form-item">
					<text class="form-label">⚖️ 体重 (kg)</text>
					<input class="weight-input" type="digit" v-model="form.weight" placeholder="如 65.5" />
				</view>
			</view>
			<view class="form-actions">
				<button v-if="editingId" class="btn cancel" @click="cancelEdit">取消</button>
				<button class="btn primary" @click="save">{{ editingId ? '💾 保存' : '✅ 记录' }}</button>
			</view>
		</view>

		<!-- 列表 -->
		<view class="list">
			<view class="list-title">📜 记录列表</view>
			<view v-if="!sortedRecords.length" class="empty">
				<text class="empty-emoji">📭</text>
				<text class="empty-text">还没有记录，快来添加第一条吧！</text>
			</view>
			<view v-else class="record-list">
				<view class="record" v-for="item in sortedRecords" :key="item.id" @click="editRecord(item)">
					<view class="record-left">
						<text class="record-date">{{ formatDate(item.date) }}</text>
						<view class="record-weight-row">
							<text class="record-weight">{{ item.weight }}</text>
							<text class="record-unit">kg</text>
							<text v-if="item.diff !== null" :class="['record-diff', item.diff < 0 ? 'down' : 'up']">
								{{ item.diff > 0 ? '+' : '' }}{{ item.diff.toFixed(1) }}
							</text>
						</view>
					</view>
					<text class="record-del" @click.stop="removeRecord(item.id)">🗑️</text>
				</view>
			</view>
		</view>

		<view class="footer-tip">💡 数据保存在本地，请勿随意清理缓存</view>
	</view>
</template>

<script setup>
	import { ref, reactive, computed } from 'vue'
	import { onLoad } from '@dcloudio/uni-app'

	const STORAGE_KEY = 'bt_fit_weight_records'

	// 响应式状态
	const records = ref([])
	const form = reactive({
		date: '',
		weight: ''
	})
	const editingId = ref(null)

	// 计算属性
	const latest = computed(() => {
		if (!records.value.length) return null
		return [...records.value].sort((a, b) => a.date.localeCompare(b.date)).slice(-1)[0]
	})

	const trend = computed(() => {
		if (records.value.length < 2) return null
		const sorted = [...records.value].sort((a, b) => a.date.localeCompare(b.date))
		const diff = sorted[sorted.length - 1].weight - sorted[sorted.length - 2].weight
		return +diff.toFixed(1)
	})

	const sortedRecords = computed(() => {
		// 日期倒序展示，并计算与「上一次（更早）」记录的差值
		const desc = [...records.value].sort((a, b) => b.date.localeCompare(a.date))
		const asc = [...records.value].sort((a, b) => a.date.localeCompare(b.date))
		return desc.map(r => {
			const idx = asc.findIndex(x => x.id === r.id)
			const diff = idx > 0 ? +(r.weight - asc[idx - 1].weight).toFixed(1) : null
			return { ...r, diff }
		})
	})

	// 方法
	const today = () => {
		const d = new Date()
		const m = String(d.getMonth() + 1).padStart(2, '0')
		const day = String(d.getDate()).padStart(2, '0')
		return `${d.getFullYear()}-${m}-${day}`
	}

	const loadRecords = () => {
		const data = uni.getStorageSync(STORAGE_KEY)
		records.value = Array.isArray(data) ? data : []
	}

	const persist = () => {
		uni.setStorageSync(STORAGE_KEY, records.value)
	}

	const onDateChange = (e) => {
		form.date = e.detail.value
	}

	const save = () => {
		const w = parseFloat(form.weight)
		if (isNaN(w) || w <= 0 || w > 500) {
			uni.showToast({ title: '请输入有效体重 😅', icon: 'none' })
			return
		}
		if (editingId.value) {
			const idx = records.value.findIndex(r => r.id === editingId.value)
			if (idx > -1) {
				records.value.splice(idx, 1, { ...records.value[idx], date: form.date, weight: w })
			}
			editingId.value = null
			uni.showToast({ title: '已更新 ✅', icon: 'none' })
		} else {
			records.value.push({
				id: String(Date.now()),
				date: form.date,
				weight: w
			})
			uni.showToast({ title: '记录成功 🎉', icon: 'none' })
		}
		persist()
		form.weight = ''
	}

	const editRecord = (item) => {
		editingId.value = item.id
		form.date = item.date
		form.weight = String(item.weight)
		uni.pageScrollTo({ scrollTop: 0, duration: 200 })
	}

	const cancelEdit = () => {
		editingId.value = null
		form.date = today()
		form.weight = ''
	}

	const removeRecord = (id) => {
		uni.showModal({
			title: '删除记录',
			content: '确定要删除这条记录吗？',
			confirmColor: '#ef4444',
			success: res => {
				if (res.confirm) {
					records.value = records.value.filter(r => r.id !== id)
					if (editingId.value === id) cancelEdit()
					persist()
					uni.showToast({ title: '已删除 🗑️', icon: 'none' })
				}
			}
		})
	}

	const formatDate = (d) => {
		const date = new Date(d + 'T00:00:00')
		const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
		const m = String(date.getMonth() + 1).padStart(2, '0')
		const day = String(date.getDate()).padStart(2, '0')
		return `${date.getFullYear()}-${m}-${day} ${weekdays[date.getDay()]}`
	}

	// 页面生命周期
	onLoad(() => {
		form.date = today()
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

	/* 顶部标题 */
	.header {
		display: flex;
		flex-direction: column;
		padding: 10rpx 8rpx 26rpx;
	}
	.header-title {
		display: flex;
		align-items: center;
	}
	.header-emoji {
		font-size: 48rpx;
		margin-right: 14rpx;
	}
	.header-text {
		font-size: 46rpx;
		font-weight: 700;
		color: #1f2d2a;
	}
	.header-sub {
		margin-top: 10rpx;
		font-size: 26rpx;
		color: #7a8a85;
	}

	/* 概览卡片 */
	.summary {
		display: flex;
		gap: 20rpx;
	}
	.summary-card {
		background: #ffffff;
		border-radius: 24rpx;
		padding: 28rpx 30rpx;
		box-shadow: 0 8rpx 30rpx rgba(45, 120, 100, 0.08);
	}
	.summary-card.main {
		flex: 1;
		display: flex;
		flex-direction: column;
	}
	.summary-card.side {
		width: 200rpx;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
	}
	.summary-label {
		font-size: 24rpx;
		color: #8a9994;
	}
	.summary-value-row {
		display: flex;
		align-items: baseline;
		margin-top: 10rpx;
	}
	.summary-value {
		font-size: 64rpx;
		font-weight: 800;
		color: #14b886;
		line-height: 1.1;
	}
	.summary-value.small {
		font-size: 52rpx;
		margin-top: 14rpx;
	}
	.summary-unit {
		font-size: 26rpx;
		color: #8a9994;
		margin-left: 8rpx;
	}
	.summary-trend {
		margin-top: 14rpx;
	}
	.trend {
		font-size: 24rpx;
		font-weight: 600;
	}
	.trend.up {
		color: #f0883e;
	}
	.trend.down {
		color: #14b886;
	}
	.trend.muted {
		color: #aab4b0;
		font-weight: 400;
	}

	/* 录入卡片 */
	.form-card {
		margin-top: 28rpx;
		background: #ffffff;
		border-radius: 24rpx;
		padding: 30rpx 28rpx;
		box-shadow: 0 8rpx 30rpx rgba(45, 120, 100, 0.08);
	}
	.form-title {
		font-size: 30rpx;
		font-weight: 700;
		color: #1f2d2a;
		margin-bottom: 24rpx;
	}
	.form-row {
		display: flex;
		gap: 22rpx;
	}
	.form-item {
		flex: 1;
		display: flex;
		flex-direction: column;
	}
	.form-label {
		font-size: 24rpx;
		color: #8a9994;
		margin-bottom: 12rpx;
	}
	.picker-value,
	.weight-input {
		height: 80rpx;
		line-height: 80rpx;
		padding: 0 22rpx;
		background: #f3f6f5;
		border-radius: 16rpx;
		font-size: 30rpx;
		color: #1f2d2a;
		box-sizing: border-box;
	}
	.weight-input {
		text-align: left;
	}
	.caret {
		color: #aab4b0;
		float: right;
	}
	.form-actions {
		display: flex;
		gap: 20rpx;
		margin-top: 28rpx;
	}
	.btn {
		flex: 1;
		height: 84rpx;
		line-height: 84rpx;
		border-radius: 16rpx;
		font-size: 30rpx;
		font-weight: 600;
		border: none;
		padding: 0;
		margin: 0;
	}
	.btn.primary {
		background: #14b886;
		color: #ffffff;
	}
	.btn.cancel {
		flex: 0 0 200rpx;
		background: #eef3f1;
		color: #5a6b66;
	}
	.btn.primary::after,
	.btn.cancel::after {
		border: none;
	}

	/* 列表 */
	.list {
		margin-top: 36rpx;
	}
	.list-title {
		font-size: 30rpx;
		font-weight: 700;
		color: #1f2d2a;
		margin: 0 6rpx 18rpx;
	}
	.empty {
		background: #ffffff;
		border-radius: 24rpx;
		padding: 70rpx 30rpx;
		display: flex;
		flex-direction: column;
		align-items: center;
	}
	.empty-emoji {
		font-size: 80rpx;
	}
	.empty-text {
		margin-top: 18rpx;
		font-size: 26rpx;
		color: #aab4b0;
	}
	.record-list {
		display: flex;
		flex-direction: column;
		gap: 18rpx;
	}
	.record {
		display: flex;
		align-items: center;
		justify-content: space-between;
		background: #ffffff;
		border-radius: 20rpx;
		padding: 26rpx 30rpx;
		box-shadow: 0 4rpx 16rpx rgba(45, 120, 100, 0.06);
	}
	.record-left {
		display: flex;
		flex-direction: column;
	}
	.record-date {
		font-size: 24rpx;
		color: #8a9994;
		margin-bottom: 8rpx;
	}
	.record-weight-row {
		display: flex;
		align-items: baseline;
	}
	.record-weight {
		font-size: 40rpx;
		font-weight: 700;
		color: #1f2d2a;
	}
	.record-unit {
		font-size: 24rpx;
		color: #8a9994;
		margin-left: 8rpx;
	}
	.record-diff {
		font-size: 24rpx;
		font-weight: 600;
		margin-left: 16rpx;
		padding: 2rpx 14rpx;
		border-radius: 20rpx;
	}
	.record-diff.up {
		color: #f0883e;
		background: rgba(240, 136, 62, 0.12);
	}
	.record-diff.down {
		color: #14b886;
		background: rgba(20, 184, 134, 0.12);
	}
	.record-del {
		font-size: 38rpx;
		padding: 10rpx;
	}

	.footer-tip {
		margin-top: 36rpx;
		text-align: center;
		font-size: 22rpx;
		color: #b6bfbb;
	}
</style>
