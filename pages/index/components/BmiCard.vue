<template>
	<view class="bmi-card" :class="cardClass">
		<!-- 背景装饰圆 -->
		<view class="bmi-blob bmi-blob--big"></view>
		<view class="bmi-blob bmi-blob--small"></view>

		<!-- 加载中（首次进入且无缓存） -->
		<view v-if="loading" class="bmi-loading">
			<view class="bmi-loading-dot"></view>
			<text class="bmi-loading-text">正在计算 BMI...</text>
		</view>

		<!-- 未完善信息：引导去个人信息页 -->
		<view v-else-if="!status" class="bmi-empty" @click="goProfile">
			<view class="bmi-empty-icon">📏</view>
			<view class="bmi-empty-body">
				<text class="bmi-empty-title">完善身高体重，开启 BMI 分析</text>
				<text class="bmi-empty-sub">前往「个人信息」填写身高与体重</text>
			</view>
			<view class="bmi-empty-btn">去完善 ›</view>
		</view>

		<!-- 已完善：BMI 数值 + 分级徽章 + 标准刻度尺 -->
		<template v-else>
			<view class="bmi-head">
				<view class="bmi-head-left">
					<text class="bmi-label">🧮 BMI · 身体质量指数</text>
					<view class="bmi-value-row">
						<text class="bmi-value" :style="{ color: status.color }">{{ bmiText }}</text>
						<text class="bmi-unit">kg/m²</text>
					</view>
					<text class="bmi-meta">身高 {{ heightText }} cm · 体重 {{ weightText }} kg</text>
				</view>
				<view class="bmi-badge" :style="{ background: status.soft, color: status.color }">
					<text>{{ status.emoji }} {{ status.label }}</text>
				</view>
			</view>

			<view class="bmi-scale">
				<view class="bmi-track">
					<view class="bmi-seg bmi-seg--low"></view>
					<view class="bmi-seg bmi-seg--normal"></view>
					<view class="bmi-seg bmi-seg--over"></view>
					<view class="bmi-seg bmi-seg--obese"></view>
					<view class="bmi-marker" :style="{ left: markerLeft + '%', borderColor: status.color }"></view>
				</view>
				<view class="bmi-labels">
					<text class="bmi-label-item" style="flex: 45">偏瘦</text>
					<text class="bmi-label-item" style="flex: 65">正常</text>
					<text class="bmi-label-item" style="flex: 50">超重</text>
					<text class="bmi-label-item" style="flex: 60">肥胖</text>
				</view>
			</view>
		</template>
	</view>
</template>

<script setup>
	import { ref, computed, onMounted } from 'vue'
	import { getProfileApi } from '@/api/index.js'

	// 个人信息本地缓存键：首页进入先用缓存渲染，再拉接口刷新
	const PROFILE_CACHE_KEY = 'bt_fit_profile'

	const props = defineProps({
		records: { type: Array, default: () => [] }
	})

	// WHO 国际标准分级：偏瘦 < 18.5，正常 18.5 ~ 24.9，超重 25 ~ 29.9，肥胖 >= 30
	const BMI_LEVELS = [
		{ key: 'underweight', label: '偏瘦', emoji: '🪶', max: 18.5, color: '#3b82f6', soft: 'rgba(59, 130, 246, 0.12)' },
		{ key: 'normal', label: '正常', emoji: '🌿', max: 25, color: '#10b981', soft: 'rgba(16, 185, 129, 0.14)' },
		{ key: 'overweight', label: '超重', emoji: '⚠️', max: 30, color: '#f59e0b', soft: 'rgba(245, 158, 11, 0.14)' },
		{ key: 'obese', label: '肥胖', emoji: '🔥', max: Infinity, color: '#ef4444', soft: 'rgba(239, 68, 68, 0.12)' }
	]

	// 刻度尺展示区间 [14, 36]，与四个分段宽度（45 : 65 : 50 : 60）对应
	const SCALE_MIN = 14
	const SCALE_MAX = 36

	// 个人信息：身高 / 初始体重（未填为 ''）
	const height = ref('')
	const initialWeight = ref('')
	const loading = ref(false)

	// 进入页面先读缓存，避免每次都闪一次加载态
	const cached = uni.getStorageSync(PROFILE_CACHE_KEY)
	if (cached && typeof cached === 'object') {
		height.value = cached.height || ''
		initialWeight.value = cached.initial_weight || ''
	}

	// 最新体重：优先取最新一条记录，没有记录时回退到个人信息的初始体重
	const latestWeight = computed(() => {
		if (!props.records.length) return null
		return [...props.records].sort((a, b) => a.date.localeCompare(b.date)).slice(-1)[0].weight
	})
	const weight = computed(() => {
		if (latestWeight.value != null) return +latestWeight.value
		const w = parseFloat(initialWeight.value)
		return isNaN(w) || w <= 0 ? null : w
	})

	// BMI = 体重(kg) / 身高(m)^2，保留一位小数
	const bmi = computed(() => {
		const h = parseFloat(height.value)
		if (weight.value == null || isNaN(h) || h <= 0) return null
		return +(weight.value / Math.pow(h / 100, 2)).toFixed(1)
	})

	// 当前所处分级（按 WHO 标准），null 表示身高/体重未完善
	const status = computed(() => {
		if (bmi.value == null) return null
		return BMI_LEVELS.find(level => bmi.value < level.max) || BMI_LEVELS[BMI_LEVELS.length - 1]
	})

	// 各分级对应的卡片底色
	const cardClass = computed(() => (status.value ? `bmi-card--${status.value.key}` : ''))

	const bmiText = computed(() => (bmi.value == null ? '--' : bmi.value.toFixed(1)))

	// 展示文案：数值去掉多余的 .0（如 76.0 -> 76）
	const heightText = computed(() => parseFloat(height.value) || '')
	const weightText = computed(() => (weight.value == null ? '--' : weight.value.toFixed(1).replace(/\.0$/, '')))

	// 刻度尺上标记点的位置（百分比，越界收敛到两端）
	const markerLeft = computed(() => {
		if (bmi.value == null) return 0
		const p = ((bmi.value - SCALE_MIN) / (SCALE_MAX - SCALE_MIN)) * 100
		return Math.min(Math.max(p, 0), 100)
	})

	// 拉取个人信息：成功后写入缓存；失败沿用缓存/已有数据（提示由 request 封装统一 toast）
	let fetching = false
	const refresh = async () => {
		if (fetching) return
		fetching = true
		// 没有任何数据时才显示加载态，有缓存则静默刷新
		if (!height.value && !initialWeight.value) loading.value = true
		try {
			const data = await getProfileApi()
			height.value = data.height || ''
			initialWeight.value = data.initial_weight || ''
			uni.setStorageSync(PROFILE_CACHE_KEY, { height: height.value, initial_weight: initialWeight.value })
		} catch (e) {
			// 静默失败：保留已展示的数据
		} finally {
			loading.value = false
			fetching = false
		}
	}

	// 跳转个人信息页完善身高体重
	const goProfile = () => {
		uni.navigateTo({ url: '/pages/profile/info' })
	}

	onMounted(refresh)

	// 供父组件在页面 onShow 时调用（如从个人信息页返回后刷新身高）
	defineExpose({ refresh })
</script>

<style scoped>
	.bmi-card {
		position: relative;
		overflow: hidden;
		border-radius: 32rpx;
		padding: 34rpx 32rpx 30rpx;
		margin-bottom: 20rpx;
		background: #ffffff;
		box-shadow: 0 12rpx 40rpx rgba(16, 185, 129, 0.08);
	}

	/* 各分级下的浅色渐变底 */
	.bmi-card--underweight {
		background: linear-gradient(135deg, #f0f6ff 0%, #ffffff 60%);
	}
	.bmi-card--normal {
		background: linear-gradient(135deg, #ecfdf5 0%, #ffffff 60%);
	}
	.bmi-card--overweight {
		background: linear-gradient(135deg, #fffaeb 0%, #ffffff 60%);
	}
	.bmi-card--obese {
		background: linear-gradient(135deg, #fff1f2 0%, #ffffff 60%);
	}

	/* 背景装饰圆 */
	.bmi-blob {
		position: absolute;
		border-radius: 50%;
		pointer-events: none;
	}
	.bmi-blob--big {
		width: 280rpx;
		height: 280rpx;
		right: -100rpx;
		top: -120rpx;
	}
	.bmi-blob--small {
		width: 140rpx;
		height: 140rpx;
		right: 80rpx;
		bottom: -60rpx;
	}
	.bmi-card--underweight .bmi-blob--big {
		background: rgba(59, 130, 246, 0.08);
	}
	.bmi-card--underweight .bmi-blob--small {
		background: rgba(59, 130, 246, 0.05);
	}
	.bmi-card--normal .bmi-blob--big {
		background: rgba(16, 185, 129, 0.1);
	}
	.bmi-card--normal .bmi-blob--small {
		background: rgba(16, 185, 129, 0.06);
	}
	.bmi-card--overweight .bmi-blob--big {
		background: rgba(245, 158, 11, 0.1);
	}
	.bmi-card--overweight .bmi-blob--small {
		background: rgba(245, 158, 11, 0.06);
	}
	.bmi-card--obese .bmi-blob--big {
		background: rgba(239, 68, 68, 0.1);
	}
	.bmi-card--obese .bmi-blob--small {
		background: rgba(239, 68, 68, 0.06);
	}

	/* 内容层级高于装饰圆 */
	.bmi-head,
	.bmi-scale,
	.bmi-empty,
	.bmi-loading {
		position: relative;
		z-index: 1;
	}

	/* 加载中 */
	.bmi-loading {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 30rpx 0;
	}
	.bmi-loading-dot {
		width: 16rpx;
		height: 16rpx;
		border-radius: 50%;
		background: #10b981;
		animation: bmi-breathe 1s ease-in-out infinite alternate;
	}
	.bmi-loading-text {
		margin-left: 16rpx;
		font-size: 26rpx;
		color: #7a8a85;
	}
	@keyframes bmi-breathe {
		from {
			opacity: 0.3;
			transform: scale(0.8);
		}
		to {
			opacity: 1;
			transform: scale(1.2);
		}
	}

	/* 未完善信息 */
	.bmi-empty {
		display: flex;
		align-items: center;
	}
	.bmi-empty-icon {
		width: 92rpx;
		height: 92rpx;
		border-radius: 30rpx;
		background: linear-gradient(135deg, #e8f5f0 0%, #d5efe6 100%);
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 46rpx;
	}
	.bmi-empty-body {
		flex: 1;
		margin-left: 24rpx;
		display: flex;
		flex-direction: column;
	}
	.bmi-empty-title {
		font-size: 28rpx;
		font-weight: 600;
		color: #1f2d2a;
	}
	.bmi-empty-sub {
		margin-top: 8rpx;
		font-size: 22rpx;
		color: #8a9994;
	}
	.bmi-empty-btn {
		padding: 14rpx 28rpx;
		background: linear-gradient(135deg, #34d399 0%, #10b981 100%);
		border-radius: 999rpx;
		font-size: 24rpx;
		font-weight: 600;
		color: #ffffff;
		box-shadow: 0 8rpx 20rpx rgba(16, 185, 129, 0.25);
		flex-shrink: 0;
	}

	/* 头部：数值 + 分级徽章 */
	.bmi-head {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
	}
	.bmi-head-left {
		display: flex;
		flex-direction: column;
	}
	.bmi-label {
		font-size: 24rpx;
		color: #7a8a85;
		letter-spacing: 1rpx;
	}
	.bmi-value-row {
		margin-top: 12rpx;
		display: flex;
		align-items: baseline;
	}
	.bmi-value {
		font-size: 92rpx;
		font-weight: 800;
		line-height: 1.1;
		letter-spacing: -2rpx;
	}
	.bmi-unit {
		margin-left: 12rpx;
		font-size: 26rpx;
		color: #8a9994;
	}
	.bmi-meta {
		margin-top: 14rpx;
		font-size: 22rpx;
		color: #8a9994;
	}
	.bmi-badge {
		margin-top: 6rpx;
		padding: 14rpx 26rpx;
		border-radius: 999rpx;
		font-size: 26rpx;
		font-weight: 600;
		flex-shrink: 0;
	}

	/* 标准刻度尺 */
	.bmi-scale {
		margin-top: 32rpx;
	}
	.bmi-track {
		position: relative;
		display: flex;
		height: 16rpx;
	}
	.bmi-seg {
		height: 100%;
	}
	.bmi-seg--low {
		flex: 45;
		background: #60a5fa;
		border-radius: 999rpx 0 0 999rpx;
	}
	.bmi-seg--normal {
		flex: 65;
		background: #34d399;
	}
	.bmi-seg--over {
		flex: 50;
		background: #fbbf24;
	}
	.bmi-seg--obese {
		flex: 60;
		background: #f87171;
		border-radius: 0 999rpx 999rpx 0;
	}
	.bmi-marker {
		position: absolute;
		top: 50%;
		width: 28rpx;
		height: 28rpx;
		background: #ffffff;
		border: 6rpx solid #10b981;
		border-radius: 50%;
		box-sizing: border-box;
		transform: translate(-50%, -50%);
		box-shadow: 0 4rpx 12rpx rgba(31, 45, 42, 0.18);
		transition: left 0.4s ease;
	}
	.bmi-labels {
		margin-top: 14rpx;
		display: flex;
	}
	.bmi-label-item {
		font-size: 20rpx;
		color: #9aa8a3;
		text-align: center;
	}
</style>
