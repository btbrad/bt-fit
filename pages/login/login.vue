<template>
	<view class="page">
		<!-- 品牌区 -->
		<view class="brand">
			<view class="brand-icon">
				<text class="brand-emoji">⚖️</text>
			</view>
			<text class="brand-name">体重记录</text>
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
						placeholder-style="color:#a6bed4"
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
						placeholder-style="color:#a6bed4"
						:maxlength="20"
					/>
					<text class="toggle" @click="showPassword = !showPassword">{{ showPassword ? '隐藏' : '显示' }}</text>
				</view>
			</view>

			<button class="login-btn" :class="{ 'login-btn--disabled': !canSubmit }" :disabled="!canSubmit" @click="onLogin">
				登 录
			</button>
		</view>

		<!-- 底部提示 -->
		<view class="footer-tip">演示账号：admin · 密码：123456</view>
	</view>
</template>

<script setup>
	import { ref, computed } from 'vue'
	import { onLoad } from '@dcloudio/uni-app'
	import { loginApi } from '@/api/index.js'

	const USER_KEY = 'bt_fit_user'
	const TOKEN_KEY = 'bt_fit_token'

	// 响应式状态
	const username = ref('')
	const password = ref('')
	const showPassword = ref(false)

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
		background: linear-gradient(180deg, #e6f2fe 0%, #f5f9fd 420rpx);
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
		background: linear-gradient(135deg, #5aa9f5 0%, #3b82f6 100%);
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 16rpx 32rpx rgba(59, 130, 246, 0.25);
	}
	.brand-emoji {
		font-size: 68rpx;
	}
	.brand-name {
		margin-top: 30rpx;
		font-size: 46rpx;
		font-weight: 700;
		color: #1f2a3a;
		letter-spacing: 4rpx;
	}
	.brand-sub {
		margin-top: 12rpx;
		font-size: 26rpx;
		color: #7d92a8;
	}

	/* 登录卡片 */
	.card {
		width: 100%;
		margin-top: 90rpx;
		background: #ffffff;
		border-radius: 36rpx;
		padding: 56rpx 44rpx 48rpx;
		box-sizing: border-box;
		box-shadow: 0 12rpx 40rpx rgba(59, 130, 246, 0.08);
	}

	.field {
		margin-bottom: 40rpx;
	}
	.field-label {
		display: block;
		font-size: 26rpx;
		color: #5b7691;
		margin-bottom: 14rpx;
	}
	.field-control {
		display: flex;
		align-items: center;
		background: #f0f7fe;
		border: 2rpx solid transparent;
		border-radius: 20rpx;
		padding: 0 24rpx;
		transition: border-color 0.2s;
	}
	.field-control:focus-within {
		border-color: #3b82f6;
	}
	.field-input {
		flex: 1;
		height: 92rpx;
		font-size: 30rpx;
		color: #1f2a3a;
	}
	.toggle {
		font-size: 24rpx;
		color: #3b82f6;
		padding: 10rpx 0 10rpx 20rpx;
	}

	/* 登录按钮 */
	.login-btn {
		margin-top: 16rpx;
		height: 92rpx;
		line-height: 92rpx;
		border-radius: 46rpx;
		background: linear-gradient(135deg, #5aa9f5 0%, #3b82f6 100%);
		color: #ffffff;
		font-size: 32rpx;
		font-weight: 600;
		letter-spacing: 12rpx;
		border: none;
		box-shadow: 0 12rpx 24rpx rgba(59, 130, 246, 0.3);
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
		color: #a6bed4;
	}
</style>
