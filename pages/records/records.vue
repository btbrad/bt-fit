<template>
	<view class="page">
		<!-- 日期筛选 -->
		<view class="filter-card">
			<view class="filter-tabs">
				<view
					v-for="p in presets"
					:key="p.key"
					:class="['filter-tab', preset === p.key ? 'filter-tab--active' : '']"
					hover-class="filter-tab--hover"
					:hover-stay-time="80"
					@click="onPresetTap(p.key)"
				>
					{{ p.label }}
				</view>
			</view>

			<!-- 自定义：起止日期选择 -->
			<view v-if="preset === 'custom'" class="filter-pickers">
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

		<!-- 编辑态：点击列表项后出现修改表单 -->
		<RecordForm v-if="editing" :editing="editing" @submit="onSubmit" @cancel="editing = null" />

		<!-- 列表 -->
		<RecordList :records="records" @edit="onEdit" @remove="onRemove" />

		<!-- 上拉加载状态 -->
		<view v-if="records.length" class="load-more">
			<text v-if="loadingMore">加载中...</text>
			<text v-else-if="!hasMore">— 没有更多了 —</text>
			<text v-else class="load-more-hint">↑ 上拉加载更多</text>
		</view>
	</view>
</template>

<script setup>
	import { ref } from 'vue'
	import { onShow, onReachBottom } from '@dcloudio/uni-app'
	import RecordForm from '@/components/RecordForm.vue'
	import RecordList from './components/RecordList.vue'
	import { getWeightRecordsApi, deleteWeightRecordApi } from '@/api/index.js'

	const USER_KEY = 'bt_fit_user'

	// 快捷范围预设
	const presets = [
		{ key: 'all', label: '全部' },
		{ key: '7d', label: '近7天' },
		{ key: '30d', label: '近30天' },
		{ key: 'custom', label: '自定义' }
	]

	const pad2 = n => String(n).padStart(2, '0')

	const fmtDate = d => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`

	// 响应式状态
	const records = ref([])
	const editing = ref(null) // 正在编辑的记录对象，null 表示仅浏览
	const preset = ref('7d') // 默认最近 7 天
	const startDate = ref('')
	const endDate = ref('')
	const todayStr = ref(fmtDate(new Date()))
	const PER_PAGE = 20 // 每页条数
	const MAX_PAGES = 20 // 单次上拉自动翻页的安全上限，防止接口异常时死循环
	const page = ref(1) // 当前页码
	const hasMore = ref(true) // 是否还有下一页
	const loadingMore = ref(false) // 上拉加载锁，防止重复触发

	// 字段归一化：后端 id / recorded_at / weight -> 前端 id / date / weight
	const normalizeRecord = (item) => ({
		id: String(item.id),
		date: String(item.recorded_at || '').slice(0, 10),
		weight: +item.weight
	})

	// 今天往前推 days 天（'YYYY-MM-DD'）
	const daysAgo = (days) => {
		const [y, m, d] = todayStr.value.split('-').map(Number)
		const s = new Date(y, m - 1, d)
		s.setDate(s.getDate() - days)
		return fmtDate(s)
	}

	// 解析当前所选时间范围（含今天，如近7天 = 今天往前推 6 天）
	const resolveRange = () => {
		if (preset.value === 'all') return { start: '', end: '' }
		if (preset.value === 'custom') return { start: startDate.value, end: endDate.value }
		const days = preset.value === '7d' ? 7 : 30
		return { start: daysAgo(days - 1), end: todayStr.value }
	}

	// 切换预设；进入自定义时以切换前的范围初始化起止日期
	const onPresetTap = key => {
		if (preset.value === key) return
		if (key === 'custom') {
			const { start, end } = resolveRange()
			// 从「全部」进入时没有范围，回退为近7天
			startDate.value = start || daysAgo(6)
			endDate.value = end || todayStr.value
		} else if (preset.value === 'custom') {
			// 离开自定义：清空日期，快捷范围回到以"今天"为锚点
			startDate.value = ''
			endDate.value = ''
		}
		preset.value = key
		loadRecords()
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
		loadRecords()
	}

	// 拉取指定页数据；refresh 为 true 时重置到第一页并清空列表
	// 若本页按范围过滤后没有可见记录且还有下一页，则自动继续翻页，
	// 避免后端不支持 start/end 过滤时列表出现空洞（最多连翻 MAX_PAGES 页）
	const fetchRecords = async (refresh = false) => {
		if (loadingMore.value) return
		if (!refresh && !hasMore.value) return
		loadingMore.value = true
		try {
			const { start, end } = resolveRange()
			let fetched = 0
			while (fetched++ < MAX_PAGES) {
				const params = { page: page.value, per_page: PER_PAGE }
				if (start) {
					params.start = start
					params.end = end
				}
				const data = await getWeightRecordsApi(params, { loading: refresh && page.value === 1 })
				// 兼容后端直接返回数组，或 { list/items/records, total } 两种结构
				const arr = Array.isArray(data) ? data : (data.list || data.items || data.records || [])
				// 后端不支持 start/end 时由前端按所选范围兜底过滤
				const normalized = arr
					.map(normalizeRecord)
					.filter(r => !start || (r.date >= start && r.date <= end))
				records.value = records.value.concat(normalized)
				// 本页不满一页，说明没有更多
				hasMore.value = arr.length === PER_PAGE
				if (hasMore.value) page.value++
				if (normalized.length || !hasMore.value) break // 本页有可见记录或已拉完则停止
			}
		} catch (e) {
			// 失败提示由 request 封装统一 toast
		} finally {
			loadingMore.value = false
		}
	}

	// 首次进入 / 筛选变化：回到第一页
	const loadRecords = () => {
		editing.value = null // 列表刷新时退出编辑态
		page.value = 1
		hasMore.value = true
		records.value = []
		fetchRecords(true)
	}

	// 上拉触底：加载下一页
	const onReachBottomHandler = () => {
		fetchRecords()
	}

	// 表单提交：更新本地记录
	const onSubmit = ({ id, date, weight }) => {
		const idx = records.value.findIndex(r => r.id === id)
		if (idx > -1) {
			records.value.splice(idx, 1, { ...records.value[idx], date, weight })
		}
		uni.showToast({ title: '已更新 ✅', icon: 'none' })
		editing.value = null
	}

	// 点击列表项进入编辑：表单出现在页面顶部
	const onEdit = (item) => {
		editing.value = item
		uni.pageScrollTo({ scrollTop: 0, duration: 200 })
	}

	// 删除记录（二次确认）：调真实接口，成功后再更新本地列表
	const onRemove = (id) => {
		uni.showModal({
			title: '删除记录',
			content: '确定要删除这条记录吗？',
			confirmColor: '#ef4444',
			success: async (res) => {
				if (!res.confirm) return
				try {
					await deleteWeightRecordApi(id)
					records.value = records.value.filter(r => r.id !== id)
					if (editing.value && editing.value.id === id) editing.value = null
					uni.showToast({ title: '已删除 🗑️', icon: 'none' })
				} catch (e) {
					// 失败提示由 request 封装统一 toast
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
		todayStr.value = fmtDate(new Date())
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

	/* 日期筛选 */
	.filter-card {
		background: #ffffff;
		border-radius: 24rpx;
		padding: 24rpx 28rpx;
		box-shadow: 0 8rpx 30rpx rgba(45, 120, 100, 0.08);
	}
	.filter-tabs {
		display: flex;
		gap: 16rpx;
	}
	.filter-tab {
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
	.filter-tab--hover {
		background: #e6f3ed;
	}
	.filter-tab--active {
		background: linear-gradient(135deg, #34d399 0%, #10b981 100%);
		color: #ffffff;
		font-weight: 600;
		box-shadow: 0 8rpx 20rpx rgba(16, 185, 129, 0.28);
	}
	.filter-pickers {
		margin-top: 24rpx;
		display: flex;
		align-items: center;
		gap: 16rpx;
	}
	.filter-pickers picker {
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

	/* 上拉加载状态 */
	.load-more {
		margin-top: 24rpx;
		text-align: center;
		font-size: 24rpx;
		color: #b6bfbb;
	}
	.load-more-hint {
		color: #8a9994;
	}
</style>
