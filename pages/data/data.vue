<template>
	<view class="page">
		<!-- 时间范围选择 -->
		<view class="card range-card">
			<view class="range-tabs">
				<view
					v-for="p in presets"
					:key="p.key"
					:class="['range-tab', preset === p.key ? 'range-tab--active' : '']"
					hover-class="range-tab--hover"
					:hover-stay-time="80"
					@click="onPresetTap(p.key)"
				>
					{{ p.label }}
				</view>
			</view>

			<!-- 自定义：起止日期选择 -->
			<view v-if="preset === 'custom'" class="range-pickers">
				<picker mode="date" :value="startDate" :end="endDate" @change="e => onDateChange(e.detail.value, 'start')">
					<view class="picker-box">
						<text class="picker-label">开始</text>
						<text class="picker-value">{{ startDate }}</text>
					</view>
				</picker>
				<text class="picker-sep">至</text>
				<picker mode="date" :value="endDate" :start="startDate" :end="todayStr" @change="e => onDateChange(e.detail.value, 'end')">
					<view class="picker-box">
						<text class="picker-label">结束</text>
						<text class="picker-value">{{ endDate }}</text>
					</view>
				</picker>
			</view>
		</view>

		<!-- 体重折线图（uCharts qiun-data-charts 组件） -->
		<view class="card chart-card">
			<view class="chart-head">
				<view class="chart-title">
					<uni-icons type="bars" :size="18" color="#10b981" />
					<text class="chart-title-text">体重趋势</text>
				</view>
				<text class="chart-count">{{ loading ? '加载中...' : chartRecords.length ? `共 ${chartRecords.length} 条记录` : '' }}</text>
			</view>
			<view class="chart-box">
				<qiun-data-charts
					v-if="chartRecords.length"
					type="line"
					canvasId="weightTrendChart"
					:canvas2d="true"
					:chartData="chartData"
					:opts="chartOpts"
				/>
				<view v-else class="chart-empty">
					<text class="chart-empty-icon">📉</text>
					<text class="chart-empty-text">{{ loading ? '加载中...' : '该时间段暂无记录' }}</text>
				</view>
			</view>
		</view>

		<!-- 区间统计 -->
		<view v-if="statItems.length" class="card stats-card">
			<view class="stat-item" v-for="s in statItems" :key="s.label">
				<text class="stat-label">{{ s.label }}</text>
				<text :class="['stat-value', s.cls]">{{ s.text }}</text>
			</view>
		</view>

		<!-- 查看记录列表入口 -->
		<view class="card list-entry" hover-class="list-entry--hover" @click="goRecords">
			<text class="list-entry-icon">📋</text>
			<text class="list-entry-text">查看记录列表</text>
			<text class="list-entry-arrow">›</text>
		</view>
	</view>
</template>

<script setup>
	import { ref, computed } from 'vue'
	import { onShow } from '@dcloudio/uni-app'
	import { getWeightRecordsApi } from '@/api/index.js'

	const USER_KEY = 'bt_fit_user'
	const MAX_PAGES = 20 // 翻页安全上限，防止接口异常时死循环
	const PER_PAGE = 100 // 图表用大分页，尽量一次拉全

	// 快捷范围预设
	const presets = [
		{ key: '7d', label: '近7天' },
		{ key: '30d', label: '近30天' },
		{ key: '90d', label: '近90天' },
		{ key: 'custom', label: '自定义' }
	]

	const pad2 = n => String(n).padStart(2, '0')

	const fmtDate = d => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`

	// 'YYYY-MM-DD' -> 'M/D'，作为折线图 X 轴刻度
	const fmtMD = str => {
		const [, m, d] = str.split('-').map(Number)
		return `${m}/${d}`
	}

	// 字段归一化：后端 id / recorded_at / weight -> 前端 id / date / weight
	const normalizeRecord = item => ({
		id: String(item.id),
		date: String(item.recorded_at || '').slice(0, 10),
		weight: +item.weight
	})

	const preset = ref('30d') // 默认最近 30 天
	const startDate = ref('')
	const endDate = ref('')
	const todayStr = ref(fmtDate(new Date()))
	const loading = ref(false)
	const chartRecords = ref([]) // 升序排列，供折线图使用

	// 解析当前所选时间范围（含今天，如近30天 = 今天往前推 29 天）
	const resolveRange = () => {
		if (preset.value === 'custom') {
			return { start: startDate.value, end: endDate.value }
		}
		const end = todayStr.value // 快捷范围始终以"今天"为锚点
		const days = preset.value === '7d' ? 7 : preset.value === '90d' ? 90 : 30
		const [y, m, d] = end.split('-').map(Number)
		const s = new Date(y, m - 1, d)
		s.setDate(s.getDate() - (days - 1))
		return { start: fmtDate(s), end }
	}

	// 切换预设；进入自定义时以切换前的范围初始化起止日期
	const onPresetTap = key => {
		if (preset.value === key) return
		if (key === 'custom') {
			const { start, end } = resolveRange()
			startDate.value = start
			endDate.value = end
		} else if (preset.value === 'custom') {
			// 离开自定义：清空日期，快捷范围回到以"今天"为锚点
			startDate.value = ''
			endDate.value = ''
		}
		preset.value = key
		loadData()
	}

	// 自定义起止日期变更
	const onDateChange = (val, which) => {
		if (which === 'start') {
			if (val > endDate.value) {
				uni.showToast({ title: '开始日期不能晚于结束日期', icon: 'none' })
				return
			}
			startDate.value = val
		} else {
			if (val < startDate.value) {
				uni.showToast({ title: '结束日期不能早于开始日期', icon: 'none' })
				return
			}
			endDate.value = val
		}
		loadData()
	}

	// 拉取记录：接口支持 start_date / end_date 时由后端过滤，否则翻页拉全后前端过滤兜底
	const fetchAllRecords = async ({ start, end }) => {
		const list = []
		for (let page = 1; page <= MAX_PAGES; page++) {
			const data = await getWeightRecordsApi(
				{ page, per_page: PER_PAGE, start, end },
				{ loading: page === 1 } // 仅第一页显示全局 loading，避免翻页闪烁
			)
			const arr = Array.isArray(data) ? data : (data.list || data.items || data.records || [])
			list.push(...arr.map(normalizeRecord))
			if (arr.length < PER_PAGE) break // 本页不满，说明已拉完
		}
		return list
	}

	// 加载所选范围内的数据
	const loadData = async () => {
		loading.value = true
		try {
			const { start, end } = resolveRange()
			const all = await fetchAllRecords({ start, end })
			chartRecords.value = all
				.filter(r => r.date >= start && r.date <= end && r.weight > 0)
				.sort((a, b) => a.date.localeCompare(b.date)) // 折线图要求时间递增
		} catch (e) {
			// 失败提示由 request 封装统一 toast
		} finally {
			loading.value = false
		}
	}

	// 折线图数据：categories = 日期刻度，series = 体重值
	const chartData = computed(() => ({
		categories: chartRecords.value.map(r => fmtMD(r.date)),
		series: [{ name: '体重', data: chartRecords.value.map(r => r.weight) }]
	}))

	// 折线图样式配置（覆盖 uCharts line 默认配置）
	const chartOpts = {
		color: ['#10b981'],
		fontSize: 11,
		padding: [15, 15, 0, 5],
		enableScroll: false,
		legend: { show: false },
		xAxis: {
			disableGrid: true,
			fontColor: '#8a9994',
			labelCount: 4
		},
		yAxis: {
			gridType: 'dash',
			dashLength: 2,
			fontColor: '#8a9994',
			splitNumber: 4
		},
		extra: {
			line: { type: 'curve', width: 2, activeType: 'hollow' },
			tooltip: { showBox: true }
		}
	}

	// 区间统计：最高 / 最低 / 区间变化
	const statItems = computed(() => {
		const rs = chartRecords.value
		if (!rs.length) return []
		const weights = rs.map(r => r.weight)
		const change = rs[rs.length - 1].weight - rs[0].weight
		const cls = change < 0 ? 'down' : change > 0 ? 'up' : ''
		return [
			{ label: '最高体重', text: `${Math.max(...weights).toFixed(1)} kg` },
			{ label: '最低体重', text: `${Math.min(...weights).toFixed(1)} kg` },
			{ label: '区间变化', text: `${change > 0 ? '+' : ''}${change.toFixed(1)} kg`, cls }
		]
	})

	// 跳转记录列表页
	const goRecords = () => {
		uni.navigateTo({ url: '/pages/records/records' })
	}

	// 页面生命周期：未登录则跳回登录页；每次进入刷新数据与"今天"
	onShow(() => {
		const user = uni.getStorageSync(USER_KEY)
		if (!user || !user.name) {
			uni.reLaunch({ url: '/pages/login/login' })
			return
		}
		todayStr.value = fmtDate(new Date())
		loadData()
	})
</script>

<style scoped>
	.page {
		min-height: 100vh;
		background: linear-gradient(180deg, #e8f5f0 0%, #f6f8f7 320rpx);
		padding: 30rpx 28rpx 60rpx;
		box-sizing: border-box;
	}

	.card {
		background: #ffffff;
		border-radius: 36rpx;
		padding: 30rpx;
		box-shadow: 0 12rpx 40rpx rgba(16, 185, 129, 0.08);
	}

	/* 时间范围选择 */
	.range-card {
		padding: 24rpx 30rpx 30rpx;
	}

	.range-tabs {
		display: flex;
		gap: 16rpx;
	}

	.range-tab {
		flex: 1;
		height: 64rpx;
		line-height: 64rpx;
		text-align: center;
		font-size: 26rpx;
		color: #4c5a55;
		background: #f2f7f4;
		border-radius: 999rpx;
		transition: all 0.2s;
	}

	.range-tab--hover {
		background: #e6f3ed;
	}

	.range-tab--active {
		background: linear-gradient(135deg, #34d399 0%, #10b981 100%);
		color: #ffffff;
		font-weight: 600;
		box-shadow: 0 8rpx 20rpx rgba(16, 185, 129, 0.28);
	}

	.range-pickers {
		margin-top: 24rpx;
		display: flex;
		align-items: center;
		gap: 16rpx;
	}

	.range-pickers picker {
		flex: 1;
	}

	.picker-box {
		display: flex;
		align-items: center;
		justify-content: space-between;
		height: 76rpx;
		padding: 0 26rpx;
		background: #f2f7f4;
		border-radius: 20rpx;
	}

	.picker-label {
		font-size: 24rpx;
		color: #8a9994;
	}

	.picker-value {
		font-size: 28rpx;
		color: #1f2d2a;
		font-weight: 600;
	}

	.picker-sep {
		font-size: 26rpx;
		color: #aab4b0;
	}

	/* 折线图卡片 */
	.chart-card {
		margin-top: 24rpx;
	}

	.chart-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 20rpx;
	}

	.chart-title {
		display: flex;
		align-items: center;
		gap: 8rpx;
	}

	.chart-title-text {
		font-size: 30rpx;
		font-weight: 700;
		color: #1f2d2a;
	}

	.chart-count {
		font-size: 24rpx;
		color: #aab4b0;
	}

	.chart-box {
		width: 100%;
		height: 480rpx;
	}

	.chart-empty {
		height: 100%;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
	}

	.chart-empty-icon {
		font-size: 56rpx;
	}

	.chart-empty-text {
		margin-top: 12rpx;
		font-size: 26rpx;
		color: #aab4b0;
	}

	/* 区间统计 */
	.stats-card {
		margin-top: 24rpx;
		display: flex;
	}

	.stat-item {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 10rpx;
	}

	.stat-item + .stat-item {
		border-left: 2rpx solid #f2f6f4;
	}

	.stat-label {
		font-size: 24rpx;
		color: #8a9994;
	}

	.stat-value {
		font-size: 36rpx;
		font-weight: 800;
		color: #1f2d2a;
	}

	.stat-value.up {
		color: #f0883e;
	}

	.stat-value.down {
		color: #14b886;
	}

	/* 查看记录列表入口 */
	.list-entry {
		margin-top: 24rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 12rpx;
		padding: 28rpx;
		background: linear-gradient(135deg, #34d399 0%, #10b981 100%);
		box-shadow: 0 12rpx 30rpx rgba(16, 185, 129, 0.25);
	}
	.list-entry--hover {
		transform: scale(0.98);
	}
	.list-entry-icon {
		font-size: 30rpx;
	}
	.list-entry-text {
		font-size: 30rpx;
		font-weight: 600;
		color: #ffffff;
	}
	.list-entry-arrow {
		font-size: 34rpx;
		color: rgba(255, 255, 255, 0.85);
	}
</style>
