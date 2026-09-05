<template>
	<view class="page">
		<!-- 用户信息卡片 -->
		<view class="profile-card">
			<view class="avatar">
				<image v-if="avatarUrl" class="avatar-img" :src="avatarUrl" mode="aspectFill" />
				<text v-else class="avatar-text">{{ avatarText }}</text>
			</view>
			<text class="nickname">{{ nickname }}</text>
			<view class="slogan">
				<text class="slogan-text">🌿 坚持记录 · 见证改变</text>
			</view>
		</view>

		<!-- 菜单区域 -->
		<view class="menu">
			<view
				class="menu-item"
				v-for="item in menus"
				:key="item.key"
				hover-class="menu-item--hover"
				:hover-stay-time="80"
				@click="onMenuTap(item)"
			>
				<view class="menu-icon" :style="{ background: item.bg }">
					<text class="menu-emoji">{{ item.icon }}</text>
				</view>
				<text class="menu-label">{{ item.label }}</text>
				<text class="menu-arrow">›</text>
			</view>
		</view>

		<!-- 底部退出登录 -->
		<view class="logout-wrap">
			<button class="logout-btn" @click="onLogout">退出登录</button>
		</view>
	</view>
</template>

<script setup>
	import { ref, computed } from 'vue'
	import { onShow } from '@dcloudio/uni-app'
	import { getProfileApi, logoutApi } from '@/api/index.js'

	const USER_KEY = 'bt_fit_user'
	const TOKEN_KEY = 'bt_fit_token'

	// 响应式状态
	const nickname = ref('')
	const avatarUrl = ref('')

	// 头像展示昵称首字
	const avatarText = computed(() => {
		const name = nickname.value.trim()
		return name ? name.charAt(0).toUpperCase() : '我'
	})

	// 获取用户信息：接口返回后替换头像与昵称，失败则回退本地缓存
	const fetchProfile = async () => {
		try {
			const data = await getProfileApi()
			nickname.value = data.nickname || data.name || ''
			avatarUrl.value = typeof data.avatar === 'string' && data.avatar.trim() ? data.avatar : ''
		} catch (err) {
			const user = uni.getStorageSync(USER_KEY)
			nickname.value = user && user.name ? user.name : ''
			avatarUrl.value = ''
		}
	}

	// 菜单配置
	const menus = [
		{ key: 'info', label: '个人信息', icon: '👤', bg: 'linear-gradient(135deg, #6ec6ff 0%, #42a5f5 100%)' },
		{ key: 'security', label: '账号安全', icon: '🔒', bg: 'linear-gradient(135deg, #ffb74d 0%, #ff9800 100%)' },
		{ key: 'about', label: '应用信息', icon: 'ℹ️', bg: 'linear-gradient(135deg, #81c784 0%, #66bb6a 100%)' }
	]

	// 菜单点击：应用信息跳转详情页，其余暂未实现
	const onMenuTap = (item) => {
		if (item.key === 'about') {
			uni.navigateTo({ url: '/pages/profile/about' })
			return
		}
		uni.showToast({ title: `${item.label}（开发中）`, icon: 'none' })
	}

	// 退出登录：二次确认后调用后端接口，成功再清空登录态并回到登录页
	const onLogout = () => {
		uni.showModal({
			title: '退出登录',
			content: '确定要退出当前账号吗？',
			confirmColor: '#e5484d',
			success: async res => {
				if (!res.confirm) return
				try {
					await logoutApi()
					uni.removeStorageSync(TOKEN_KEY)
					uni.removeStorageSync(USER_KEY)
					uni.showToast({ title: '已退出登录', icon: 'none' })
					setTimeout(() => {
						uni.reLaunch({ url: '/pages/login/login' })
					}, 400)
				} catch (err) {
					// 失败提示已由 request.js 统一 toast，接口失败则保持登录态
				}
			}
		})
	}

	// 页面生命周期：未登录则跳回登录页
	onShow(() => {
		const user = uni.getStorageSync(USER_KEY)
		if (!user || !user.name) {
			uni.reLaunch({ url: '/pages/login/login' })
			return
		}
		nickname.value = user.name
		fetchProfile()
	})
</script>

<style scoped>
	.page {
		min-height: 100vh;
		background: linear-gradient(180deg, #e8f5f0 0%, #f6f8f7 320rpx);
		padding: 60rpx 40rpx 60rpx;
		box-sizing: border-box;
		display: flex;
		flex-direction: column;
	}

	/* 用户信息卡片 */
	.profile-card {
		background: #ffffff;
		border-radius: 36rpx;
		padding: 90rpx 40rpx 70rpx;
		display: flex;
		flex-direction: column;
		align-items: center;
		box-shadow: 0 12rpx 40rpx rgba(16, 185, 129, 0.08);
	}
	.avatar {
		width: 180rpx;
		height: 180rpx;
		border-radius: 50%;
		background: linear-gradient(135deg, #34d399 0%, #10b981 100%);
		border: 8rpx solid #e6faf1;
		box-sizing: border-box;
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 16rpx 32rpx rgba(16, 185, 129, 0.25);
	}
	.avatar-text {
		font-size: 72rpx;
		font-weight: 600;
		color: #ffffff;
	}
	.avatar-img {
		width: 100%;
		height: 100%;
		border-radius: 50%;
	}
	.nickname {
		margin-top: 36rpx;
		font-size: 40rpx;
		font-weight: 700;
		color: #1f2d2a;
		letter-spacing: 2rpx;
	}
	.slogan {
		margin-top: 22rpx;
		padding: 10rpx 30rpx;
		background: #e8f5f0;
		border-radius: 999rpx;
	}
	.slogan-text {
		font-size: 24rpx;
		color: #4c8a75;
	}

	/* 菜单区域：横条竖排 */
	.menu {
		margin-top: 32rpx;
		background: #ffffff;
		border-radius: 36rpx;
		overflow: hidden;
		box-shadow: 0 12rpx 40rpx rgba(16, 185, 129, 0.06);
	}
	.menu-item {
		display: flex;
		align-items: center;
		padding: 30rpx 34rpx;
		border-bottom: 2rpx solid #f2f6f4;
	}
	.menu-item:last-child {
		border-bottom: none;
	}
	.menu-item--hover {
		background: #f6faf8;
	}
	.menu-icon {
		width: 68rpx;
		height: 68rpx;
		border-radius: 18rpx;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.menu-emoji {
		font-size: 36rpx;
	}
	.menu-label {
		flex: 1;
		margin-left: 24rpx;
		font-size: 30rpx;
		color: #1f2d2a;
	}
	.menu-arrow {
		font-size: 40rpx;
		color: #c6d0cb;
		line-height: 1;
	}

	/* 底部退出登录按钮 */
	.logout-wrap {
		padding-top: 40rpx;
	}
	.logout-btn {
		height: 92rpx;
		line-height: 92rpx;
		border-radius: 46rpx;
		background: #ffffff;
		color: #e5484d;
		font-size: 30rpx;
		font-weight: 600;
		letter-spacing: 4rpx;
		border: 2rpx solid #f6d5d4;
		box-shadow: 0 8rpx 24rpx rgba(229, 72, 77, 0.06);
	}
	.logout-btn::after {
		border: none;
	}
</style>
