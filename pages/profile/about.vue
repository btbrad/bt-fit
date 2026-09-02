<template>
	<view class="page">
		<!-- 应用信息头部 -->
		<view class="about-header">
			<view class="app-icon">
				<text class="app-emoji">⚖️</text>
			</view>
			<text class="app-name">BTの体重</text>
			<text class="app-version">版本 {{ version }}</text>
		</view>

		<!-- 信息列表 -->
		<view class="info-card">
			<view class="info-item" v-for="item in infos" :key="item.label" hover-class="info-item--hover">
				<text class="info-label">{{ item.label }}</text>
				<text class="info-value">{{ item.value }}</text>
			</view>
		</view>

		<!-- 底部版权 -->
		<view class="footer">
			<text class="footer-text">🌿 坚持记录，见证改变</text>
			<text class="footer-copyright">Copyright © 2026 BTの体重</text>
		</view>
	</view>
</template>

<script setup>
	import { ref } from 'vue'

	// 应用信息：App/微信小程序端运行时读取打包版本，其他端回退到常量（发布新版本时与 manifest 同步修改）
	function getAppVersion() {
		// #ifdef APP-PLUS
		const info = uni.getSystemInfoSync()
		console.log('App 端运行时版本号：', info)
		// 真机调试跑在基座里时 appVersion 是基座版本，appWgtVersion 才是项目 manifest 的 versionName；云打包正式包后两者一致
		return info.appWgtVersion || info.appVersion
		// #endif
		// #ifdef MP-WEIXIN
		// 开发版返回 "develop"，体验/正式版返回对应版本号，均回退到常量
		const mpVersion = uni.getAccountInfoSync().miniProgram.version
		if (mpVersion && mpVersion !== 'develop') return mpVersion
		// #endif
		return '0.0.2'
	}

	const version = ref(getAppVersion())

	// 信息列表配置
	const infos = [
		{ label: '当前版本', value: `v${version.value}` },
		{ label: '应用简介', value: '简洁好用的体重记录工具' },
		{ label: '更新日期', value: '2026-09-01' },
		{ label: '联系我们', value: 'ahfybt@126.com' }
	]
</script>

<style scoped>
	.page {
		min-height: 100vh;
		background: linear-gradient(180deg, #e8f5f0 0%, #f6f8f7 320rpx);
		padding: 80rpx 40rpx 60rpx;
		box-sizing: border-box;
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	/* 应用信息头部 */
	.about-header {
		display: flex;
		flex-direction: column;
		align-items: center;
	}
	.app-icon {
		width: 160rpx;
		height: 160rpx;
		border-radius: 44rpx;
		background: linear-gradient(135deg, #34d399 0%, #10b981 100%);
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 16rpx 32rpx rgba(16, 185, 129, 0.25);
	}
	.app-emoji {
		font-size: 76rpx;
	}
	.app-name {
		margin-top: 30rpx;
		font-size: 42rpx;
		font-weight: 700;
		color: #1f2d2a;
	}
	.app-version {
		margin-top: 12rpx;
		font-size: 24rpx;
		color: #7a8a85;
	}

	/* 信息列表 */
	.info-card {
		width: 100%;
		margin-top: 70rpx;
		background: #ffffff;
		border-radius: 36rpx;
		overflow: hidden;
		box-shadow: 0 12rpx 40rpx rgba(16, 185, 129, 0.06);
	}
	.info-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 34rpx;
		border-bottom: 2rpx solid #f2f6f4;
	}
	.info-item:last-child {
		border-bottom: none;
	}
	.info-item--hover {
		background: #f6faf8;
	}
	.info-label {
		font-size: 28rpx;
		color: #7a8a85;
		flex-shrink: 0;
	}
	.info-value {
		margin-left: 40rpx;
		font-size: 28rpx;
		color: #1f2d2a;
		text-align: right;
	}

	/* 底部版权 */
	.footer {
		margin-top: auto;
		padding-top: 80rpx;
		display: flex;
		flex-direction: column;
		align-items: center;
	}
	.footer-text {
		font-size: 24rpx;
		color: #4c8a75;
	}
	.footer-copyright {
		margin-top: 14rpx;
		font-size: 22rpx;
		color: #b0bdb8;
	}
</style>
