<template>
	<view class="page">
		<!-- 修改密码卡片 -->
		<view class="card">
			<view class="field">
				<text class="field-label">原密码</text>
				<view class="field-control">
					<input
						class="field-input"
						v-model="oldPassword"
						:password="!showOld"
						placeholder="请输入原密码"
						placeholder-style="color:#b8c8c2"
						:maxlength="20"
					/>
					<text class="toggle" @click="showOld = !showOld">{{ showOld ? '隐藏' : '显示' }}</text>
				</view>
			</view>

			<view class="field">
				<text class="field-label">新密码</text>
				<view class="field-control">
					<input
						class="field-input"
						v-model="newPassword"
						:password="!showNew"
						placeholder="请输入新密码（至少6位）"
						placeholder-style="color:#b8c8c2"
						:maxlength="20"
					/>
					<text class="toggle" @click="showNew = !showNew">{{ showNew ? '隐藏' : '显示' }}</text>
				</view>
			</view>

			<view class="field">
				<text class="field-label">确认密码</text>
				<view class="field-control">
					<input
						class="field-input"
						v-model="confirmPassword"
						:password="!showConfirm"
						placeholder="请再次输入新密码"
						placeholder-style="color:#b8c8c2"
						:maxlength="20"
					/>
					<text class="toggle" @click="showConfirm = !showConfirm">{{ showConfirm ? '隐藏' : '显示' }}</text>
				</view>
			</view>

			<button class="submit-btn" :class="{ 'submit-btn--disabled': !canSubmit }" :disabled="!canSubmit" @click="onSubmit">
				提 交
			</button>
		</view>
	</view>
</template>

<script setup>
	import { ref, computed } from 'vue'
	import { onShow } from '@dcloudio/uni-app'
	import { changePasswordApi } from '@/api/index.js'

	const USER_KEY = 'bt_fit_user'

	// 响应式状态
	const oldPassword = ref('')
	const newPassword = ref('')
	const confirmPassword = ref('')
	const showOld = ref(false)
	const showNew = ref(false)
	const showConfirm = ref(false)
	const submitting = ref(false)

	// 三项都填写且未在提交中才可提交
	const canSubmit = computed(
		() =>
			oldPassword.value !== '' &&
			newPassword.value !== '' &&
			confirmPassword.value !== '' &&
			!submitting.value
	)

	// 校验输入：通过返回 true，失败已 toast 提示
	const validate = () => {
		if (newPassword.value.length < 6) {
			uni.showToast({ title: '新密码至少 6 位', icon: 'none' })
			return false
		}
		if (newPassword.value === oldPassword.value) {
			uni.showToast({ title: '新密码不能与原密码相同', icon: 'none' })
			return false
		}
		if (newPassword.value !== confirmPassword.value) {
			uni.showToast({ title: '两次输入的新密码不一致', icon: 'none' })
			return false
		}
		return true
	}

	// 提交修改密码：成功后返回上一页
	const onSubmit = async () => {
		if (!canSubmit.value || !validate()) return

		submitting.value = true
		try {
			await changePasswordApi({
				old_password: oldPassword.value,
				new_password: newPassword.value,
				confirm_password: confirmPassword.value
			})
			uni.showToast({ title: '密码修改成功', icon: 'none' })
			setTimeout(() => {
				uni.navigateBack()
			}, 400)
		} catch (err) {
			// 失败提示已由 request.js 统一 toast，保留输入便于重试
		} finally {
			submitting.value = false
		}
	}

	// 页面生命周期：未登录则跳回登录页
	onShow(() => {
		const user = uni.getStorageSync(USER_KEY)
		if (!user || !user.name) {
			uni.reLaunch({ url: '/pages/login/login' })
			return
		}
	})
</script>

<style scoped>
	.page {
		min-height: 100vh;
		background: linear-gradient(180deg, #e8f5f0 0%, #f6f8f7 320rpx);
		padding: 40rpx;
		box-sizing: border-box;
	}

	/* 修改密码卡片 */
	.card {
		background: #ffffff;
		border-radius: 36rpx;
		padding: 48rpx 40rpx 40rpx;
		box-shadow: 0 12rpx 40rpx rgba(16, 185, 129, 0.06);
	}

	.field {
		margin-bottom: 36rpx;
	}
	.field-label {
		display: block;
		font-size: 26rpx;
		color: #7a8a85;
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

	/* 提交按钮 */
	.submit-btn {
		margin-top: 16rpx;
		height: 92rpx;
		line-height: 92rpx;
		border-radius: 46rpx;
		background: linear-gradient(135deg, #34d399 0%, #10b981 100%);
		color: #ffffff;
		font-size: 32rpx;
		font-weight: 600;
		letter-spacing: 8rpx;
		border: none;
		box-shadow: 0 12rpx 24rpx rgba(16, 185, 129, 0.3);
	}
	.submit-btn::after {
		border: none;
	}
	.submit-btn--disabled {
		opacity: 0.45;
		box-shadow: none;
	}
</style>
