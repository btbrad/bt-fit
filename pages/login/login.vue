<template>
	<view class="page" :style="pageStyle">
		<!-- 品牌区 -->
		<view class="brand">
			<view class="brand-icon">
				<image class="brand-logo" src="/static/logo.png" mode="aspectFit" />
			</view>
			<text class="brand-name">BT体重记录</text>
			<text class="brand-sub">坚持记录，见证改变 💪</text>
		</view>

		<!-- 登录卡片 -->
		<view class="card">
			<view class="field">
				<text class="field-label">用户名</text>
				<view class="field-control">
					<input
						class="field-input"
						v-model="username"
						placeholder="请输入用户名"
						placeholder-style="color:#aab4b0"
						:maxlength="20"
					/>
				</view>
			</view>

			<view class="field">
				<text class="field-label">密码</text>
				<view class="field-control">
					<input
						class="field-input"
						v-model="password"
						:password="!showPassword"
						placeholder="请输入密码"
						placeholder-style="color:#aab4b0"
						:maxlength="20"
					/>
					<text class="toggle" @click="showPassword = !showPassword">{{ showPassword ? '隐藏' : '显示' }}</text>
				</view>
			</view>

			<button class="login-btn" :class="{ 'login-btn--disabled': !canSubmit }" :disabled="!canSubmit" @click="onLogin">
				登 录
			</button>
		</view>

	</view>
</template>

<script setup>
	import { ref, computed } from 'vue'
	import { onLoad } from '@dcloudio/uni-app'
	import { loginApi } from '@/api/index.js'
	import { USER_KEY, TOKEN_KEY, PROFILE_CACHE_KEY } from '@/utils/auth.js'

	// 响应式状态
	const username = ref('')
	const password = ref('')
	const showPassword = ref(false)

	// 顶部留白：本页为自定义导航栏（navigationStyle: custom），需自行避开状态栏。
	// 状态栏高度在 APP / 微信小程序取设备实际值，H5 等取不到时按 0 处理；
	// 再叠加 44px 自定义导航栏（微信胶囊按钮所在区域）+ 24px 留白，保证各端都不贴顶。
	const getStatusBarHeight = () => {
		try {
			return uni.getSystemInfoSync().statusBarHeight || 0
		} catch (e) {
			return 0
		}
	}
	const pageStyle = { paddingTop: `${getStatusBarHeight() + 44 + 24}px` }

	const canSubmit = computed(() => username.value.trim() !== '' && password.value !== '')

	// 登录（调用后端接口）
	const onLogin = async () => {
		if (!canSubmit.value) return

		try {
			const data = await loginApi({
				username: username.value.trim(),
				password: password.value
			})

			// 保存登录态：token 供 request.js 自动携带，用户信息供页面展示/登录判断
			if (data.token) {
				uni.setStorageSync(TOKEN_KEY, data.token)
			}
			uni.setStorageSync(USER_KEY, {
				name: data.username || username.value.trim(),
				loginTime: Date.now()
			})
			// 清除上个账号的个人资料缓存，避免首页 BMI 卡片读到旧数据
			uni.removeStorageSync(PROFILE_CACHE_KEY)

			uni.showToast({ title: '登录成功 🎉', icon: 'none' })
			setTimeout(() => {
				uni.reLaunch({ url: '/pages/index/index' })
			}, 400)
		} catch (err) {
			// 失败提示已由 request.js 统一 toast，这里无需额外处理
		}
	}

	// 已登录则直接进入主页
	onLoad(() => {
		const user = uni.getStorageSync(USER_KEY)
		if (user && user.name) {
			uni.reLaunch({ url: '/pages/index/index' })
		}
	})
</script>

<style scoped>
	.page {
		min-height: 100vh;
		background: linear-gradient(180deg, #e8f5f0 0%, #f6f8f7 420rpx);
		/* 顶部留白由 pageStyle 按状态栏高度动态计算（APP / 小程序），此处仅作兜底 */
		padding: 100rpx 48rpx 60rpx;
		box-sizing: border-box;
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	/* 品牌区 */
	.brand {
		display: flex;
		flex-direction: column;
		align-items: center;
	}
	.brand-icon {
		width: 140rpx;
		height: 140rpx;
		border-radius: 44rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 16rpx 32rpx rgba(16, 185, 129, 0.25);
	}
	.brand-logo {
		width: 100%;
		height: 100%;
		border-radius: 44rpx;
	}
	.brand-name {
		margin-top: 30rpx;
		font-size: 46rpx;
		font-weight: 700;
		color: #1f2d2a;
		letter-spacing: 4rpx;
	}
	.brand-sub {
		margin-top: 12rpx;
		font-size: 26rpx;
		color: #7a8a85;
	}

	/* 登录卡片 */
	.card {
		width: 100%;
		margin-top: 90rpx;
		background: #ffffff;
		border-radius: 36rpx;
		padding: 56rpx 44rpx 48rpx;
		box-sizing: border-box;
		box-shadow: 0 12rpx 40rpx rgba(16, 185, 129, 0.08);
	}

	.field {
		margin-bottom: 40rpx;
	}
	.field-label {
		display: block;
		font-size: 26rpx;
		color: #8a9994;
		margin-bottom: 14rpx;
	}
	.field-control {
		display: flex;
		align-items: center;
		background: #f4faf7;
		border: 2rpx solid transparent;
		border-radius: 20rpx;
		padding: 0 24rpx;
		transition: border-color 0.2s;
	}
	.field-control:focus-within {
		border-color: #10b981;
	}
	.field-input {
		flex: 1;
		height: 92rpx;
		font-size: 30rpx;
		color: #1f2d2a;
	}
	.toggle {
		font-size: 24rpx;
		color: #10b981;
		padding: 10rpx 0 10rpx 20rpx;
	}

	/* 登录按钮 */
	.login-btn {
		margin-top: 16rpx;
		height: 92rpx;
		line-height: 92rpx;
		border-radius: 46rpx;
		background: linear-gradient(135deg, #34d399 0%, #10b981 100%);
		color: #ffffff;
		font-size: 32rpx;
		font-weight: 600;
		letter-spacing: 12rpx;
		border: none;
		box-shadow: 0 12rpx 24rpx rgba(16, 185, 129, 0.3);
	}
	.login-btn::after {
		border: none;
	}
	.login-btn--disabled {
		opacity: 0.45;
		box-shadow: none;
	}

	.footer-tip {
		margin-top: 48rpx;
		font-size: 22rpx;
		color: #aab4b0;
	}
</style>
