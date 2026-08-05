<template>
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
</template>

<script setup>
	import { computed } from 'vue'

	const props = defineProps({
		records: { type: Array, default: () => [] }
	})

	// 最近一条记录（按日期升序取末位）
	const latest = computed(() => {
		if (!props.records.length) return null
		return [...props.records].sort((a, b) => a.date.localeCompare(b.date)).slice(-1)[0]
	})

	// 最近两次记录的体重差值
	const trend = computed(() => {
		if (props.records.length < 2) return null
		const sorted = [...props.records].sort((a, b) => a.date.localeCompare(b.date))
		const diff = sorted[sorted.length - 1].weight - sorted[sorted.length - 2].weight
		return +diff.toFixed(1)
	})
</script>

<style scoped>
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
</style>
