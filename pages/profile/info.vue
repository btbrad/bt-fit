<template>
	<view class="page">
		<!-- 个人信息卡片 -->
		<view class="info-card">
			<view class="item" v-for="field in fields" :key="field.key">
				<text class="item-label">{{ field.label }}</text>
				<view class="item-body">
					<!-- 展示态 -->
					<view v-if="editingKey !== field.key" class="item-display">
						<text class="item-value" :class="{ 'item-value--empty': isEmpty(field) }">{{ displayValue(field) }}</text>
						<text class="item-edit-btn" @click="onEdit(field)">修改</text>
					</view>
					<!-- 修改态 -->
					<view v-else class="item-edit">
						<view v-if="field.type !== 'date'" class="item-control">
							<input
								v-if="field.type === 'input'"
								class="item-input"
								v-model="draft"
								:placeholder="field.placeholder"
								placeholder-style="color:#b8c8c2"
								:maxlength="field.maxlength"
								:focus="true"
							/>
							<input
								v-else-if="field.type === 'digit'"
								class="item-input"
								v-model="draft"
								type="digit"
								:placeholder="field.placeholder"
								placeholder-style="color:#b8c8c2"
								:maxlength="6"
							/>
							<view v-else-if="field.type === 'gender'" class="radio-group">
								<view
									class="radio-item"
									v-for="option in GENDER_OPTIONS"
									:key="option"
									@click="onGenderSelect(option)"
								>
									<view class="radio-dot" :class="{ 'radio-dot--checked': draft === option }">
										<view v-if="draft === option" class="radio-dot-inner"></view>
									</view>
									<text class="radio-label">{{ option }}</text>
								</view>
							</view>
						</view>
						<!-- 日期字段：与首页相同的日期选择器 -->
						<picker
							v-if="field.type === 'date'"
							mode="date"
							:value="draft || today"
							start="1900-01-01"
							:end="today"
							@change="onDateChange"
						>
							<view class="picker-value" :class="{ 'picker-value--empty': !draft }">{{ draft || '请选择生日' }} <text class="caret">▾</text></view>
						</picker>
						<view class="item-actions">
							<text class="action-btn action-btn--cancel" @click="onCancelEdit">取消</text>
							<text class="action-btn action-btn--save" @click="onSave(field)">保存</text>
						</view>
					</view>
				</view>
			</view>
		</view>
	</view>
</template>

<script setup>
	import { ref, reactive, computed } from 'vue'
	import { onShow } from '@dcloudio/uni-app'
	import { getProfileApi, updateProfileApi } from '@/api/index.js'

	const USER_KEY = 'bt_fit_user'

	// 性别选项为展示文案，后端存储值为 male / female / other
	const GENDER_OPTIONS = ['男', '女', '保密']
	const GENDER_VALUE_MAP = { 男: 'male', 女: 'female', 保密: 'other' }

	// 字段配置：type 决定修改态控件类型，min/max 用于数值校验
	const fields = [
		{ key: 'nickname', label: '昵称', type: 'input', placeholder: '请输入昵称', maxlength: 20 },
		{ key: 'gender', label: '性别', type: 'gender' },
		{ key: 'height', label: '身高', type: 'digit', unit: 'cm', min: 50, max: 300, placeholder: '如 175' },
		{ key: 'initial_weight', label: '初始体重', type: 'digit', unit: 'kg', min: 10, max: 500, placeholder: '如 65.5' },
		{ key: 'birthday', label: '生日', type: 'date' }
	]

	// 个人信息数据
	const profile = reactive({
		nickname: '',
		gender: '',
		height: '',
		initial_weight: '',
		birthday: ''
	})

	// 修改状态：editingKey 为正在修改的字段 key，draft 为修改中的草稿值
	const editingKey = ref('')
	const draft = ref('')

	// 今天（YYYY-MM-DD），作为生日选择器的结束日期
	const today = computed(() => formatDate(new Date()))

	function formatDate(date) {
		const y = date.getFullYear()
		const m = String(date.getMonth() + 1).padStart(2, '0')
		const d = String(date.getDate()).padStart(2, '0')
		return `${y}-${m}-${d}`
	}

	// 后端性别值为 male / female / other，归一化为展示文案「男/女/保密」
	function normalizeGender(value) {
		if (value === 'male') return '男'
		if (value === 'female') return '女'
		if (value === 'other') return '保密'
		return typeof value === 'string' ? value : ''
	}

	// 是否未填写（展示态用于置灰）
	const isEmpty = (field) => {
		const val = profile[field.key]
		return val === '' || val == null
	}

	// 展示文案：数值带单位，未填显示「未填写」
	const displayValue = (field) => {
		if (isEmpty(field)) return '未填写'
		return field.type === 'digit' ? `${profile[field.key]} ${field.unit}` : String(profile[field.key])
	}


	// 加载个人信息：接口返回后填充，失败则回退本地缓存
	const fetchProfile = async () => {
		try {
			const data = await getProfileApi()
			profile.nickname = data.nickname || data.name || ''
			profile.gender = normalizeGender(data.gender !== undefined ? data.gender : data.sex)
			profile.height = data.height !== undefined ? data.height : ''
			profile.initial_weight = data.initial_weight !== undefined ? data.initial_weight : ''
			profile.birthday = data.birthday || ''
		} catch (err) {
			const user = uni.getStorageSync(USER_KEY)
			profile.nickname = user && user.name ? user.name : ''
		}
	}

	// 点击「修改」进入修改态，草稿取当前值
	const onEdit = (field) => {
		editingKey.value = field.key
		draft.value = isEmpty(field) ? '' : String(profile[field.key])
	}

	// 取消修改：丢弃草稿退出修改态
	const onCancelEdit = () => {
		editingKey.value = ''
		draft.value = ''
	}

	// 性别单选
	const onGenderSelect = (option) => {
		draft.value = option
	}

	// 生日选择
	const onDateChange = (e) => {
		draft.value = e.detail.value
	}

	// 校验草稿，通过则返回要提交的值，失败返回 undefined（已 toast 提示）
	const validate = (field) => {
		if (field.type === 'input') {
			const v = draft.value.trim()
			if (!v) {
				uni.showToast({ title: '昵称不能为空', icon: 'none' })
				return undefined
			}
			return v
		}
		if (field.type === 'gender') {
			if (!draft.value) {
				uni.showToast({ title: '请选择性别', icon: 'none' })
				return undefined
			}
			return draft.value
		}
		if (field.type === 'digit') {
			const num = parseFloat(draft.value)
			if (isNaN(num)) {
				uni.showToast({ title: `请输入正确的${field.label}`, icon: 'none' })
				return undefined
			}
			if (num < field.min || num > field.max) {
				uni.showToast({ title: `${field.label}需在 ${field.min}~${field.max} ${field.unit} 之间`, icon: 'none' })
				return undefined
			}
			return num
		}
		if (field.type === 'date') {
			if (!draft.value) {
				uni.showToast({ title: '请选择生日', icon: 'none' })
				return undefined
			}
			if (draft.value > today.value) {
				uni.showToast({ title: '生日不能晚于今天', icon: 'none' })
				return undefined
			}
			return draft.value
		}
	}

	// 保存修改：调用后端接口，成功后更新本地数据并退出修改态
	const onSave = async (field) => {
		const value = validate(field)
		if (value === undefined) return

		// 性别提交后端约定值（male / female / other）
		const payload = field.key === 'gender' ? GENDER_VALUE_MAP[value] || value : value

		try {
			await updateProfileApi({ [field.key]: payload })
			profile[field.key] = value
			// 昵称同步到本地用户缓存，保证「我的」页回退展示一致
			if (field.key === 'nickname') {
				const user = uni.getStorageSync(USER_KEY) || {}
				user.name = value
				uni.setStorageSync(USER_KEY, user)
			}
			uni.showToast({ title: '保存成功', icon: 'none' })
			editingKey.value = ''
			draft.value = ''
		} catch (err) {
			// 失败提示已由 request.js 统一 toast，保持修改态便于重试
		}
	}

	// 页面生命周期：未登录则跳回登录页，已登录加载个人信息
	onShow(() => {
		const user = uni.getStorageSync(USER_KEY)
		if (!user || !user.name) {
			uni.reLaunch({ url: '/pages/login/login' })
			return
		}
		fetchProfile()
	})
</script>

<style scoped>
	.page {
		min-height: 100vh;
		background: linear-gradient(180deg, #e8f5f0 0%, #f6f8f7 320rpx);
		padding: 40rpx;
		box-sizing: border-box;
	}

	/* 信息卡片 */
	.info-card {
		background: #ffffff;
		border-radius: 36rpx;
		overflow: hidden;
		box-shadow: 0 12rpx 40rpx rgba(16, 185, 129, 0.06);
	}
	.item {
		padding: 34rpx;
		border-bottom: 2rpx solid #f2f6f4;
	}
	.item:last-child {
		border-bottom: none;
	}
	.item-label {
		font-size: 26rpx;
		color: #7a8a85;
	}

	/* 展示态 */
	.item-display {
		margin-top: 18rpx;
		display: flex;
		align-items: center;
	}
	.item-value {
		flex: 1;
		font-size: 30rpx;
		color: #1f2d2a;
	}
	.item-value--empty {
		color: #b0bdb8;
	}
	.item-edit-btn {
		padding: 10rpx 28rpx;
		background: #e8f5f0;
		color: #10b981;
		font-size: 24rpx;
		border-radius: 999rpx;
	}

	/* 修改态 */
	.item-edit {
		margin-top: 18rpx;
	}
	.item-control {
		height: 80rpx;
		padding: 0 24rpx;
		background: #f4faf7;
		border: 2rpx solid #d5efe6;
		border-radius: 20rpx;
		display: flex;
		align-items: center;
	}
	.radio-group {
		flex: 1;
		display: flex;
		align-items: center;
	}
	.radio-item {
		display: flex;
		align-items: center;
		margin-right: 40rpx;
	}
	.radio-item:last-child {
		margin-right: 0;
	}
	.radio-dot {
		width: 32rpx;
		height: 32rpx;
		border-radius: 50%;
		border: 3rpx solid #c6d0cb;
		box-sizing: border-box;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.radio-dot--checked {
		border-color: #10b981;
	}
	.radio-dot-inner {
		width: 16rpx;
		height: 16rpx;
		border-radius: 50%;
		background: #10b981;
	}
	.radio-label {
		margin-left: 12rpx;
		font-size: 28rpx;
		color: #1f2d2a;
	}
	.item-input {
		flex: 1;
		height: 100%;
		font-size: 30rpx;
		color: #1f2d2a;
	}
	/* 日期选择器：与首页 RecordForm 相同的样式 */
	.picker-value {
		height: 80rpx;
		line-height: 80rpx;
		padding: 0 22rpx;
		background: #f3f6f5;
		border-radius: 16rpx;
		font-size: 30rpx;
		color: #1f2d2a;
		box-sizing: border-box;
	}
	.picker-value--empty {
		color: #b8c8c2;
	}
	.caret {
		color: #aab4b0;
		float: right;
	}
	.item-actions {
		margin-top: 20rpx;
		display: flex;
		justify-content: flex-end;
	}
	.action-btn {
		padding: 10rpx 36rpx;
		font-size: 26rpx;
		border-radius: 999rpx;
	}
	.action-btn--cancel {
		background: #f4f6f5;
		color: #7a8a85;
		margin-right: 24rpx;
	}
	.action-btn--save {
		background: linear-gradient(135deg, #34d399 0%, #10b981 100%);
		color: #ffffff;
		box-shadow: 0 8rpx 20rpx rgba(16, 185, 129, 0.25);
	}
</style>
