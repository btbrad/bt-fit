<template>
	<view class="list">
		<view class="list-title">📜 记录列表</view>
		<view v-if="!sortedRecords.length" class="empty">
			<text class="empty-emoji">📭</text>
			<text class="empty-text">还没有记录，快来添加第一条吧！</text>
		</view>
		<view v-else class="record-list">
			<view
				class="record"
				v-for="item in sortedRecords"
				:key="item.id"
				@click="emit('edit', item)"
			>
				<view class="record-left">
					<text class="record-date">{{ formatDate(item.date) }}</text>
					<view class="record-weight-row">
						<text class="record-weight">{{ item.weight }}</text>
						<text class="record-unit">kg</text>
						<text
							v-if="item.diff !== null"
							:class="['record-diff', item.diff < 0 ? 'down' : 'up']"
						>
							{{ item.diff > 0 ? '+' : '' }}{{ item.diff.toFixed(1) }}
						</text>
					</view>
				</view>
				<text class="record-del" @click.stop="emit('remove', item.id)">🗑️</text>
			</view>
		</view>
	</view>
</template>

<script setup>
	import { computed } from 'vue'

	const props = defineProps({
		records: { type: Array, default: () => [] }
	})
	const emit = defineEmits(['edit', 'remove'])

	// 日期倒序展示，并计算与「上一次（更早）」记录的差值
	const sortedRecords = computed(() => {
		const desc = [...props.records].sort((a, b) => b.date.localeCompare(a.date))
		const asc = [...props.records].sort((a, b) => a.date.localeCompare(b.date))
		return desc.map(r => {
			const idx = asc.findIndex(x => x.id === r.id)
			const diff = idx > 0 ? +(r.weight - asc[idx - 1].weight).toFixed(1) : null
			return { ...r, diff }
		})
	})

	const formatDate = (d) => {
		const date = new Date(d + 'T00:00:00')
		const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
		const m = String(date.getMonth() + 1).padStart(2, '0')
		const day = String(date.getDate()).padStart(2, '0')
		return `${date.getFullYear()}-${m}-${day} ${weekdays[date.getDay()]}`
	}
</script>

<style scoped>
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
</style>
