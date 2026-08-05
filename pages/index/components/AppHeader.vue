<template>
	<view class="header">
		<view class="header-title">
			<text class="header-emoji">⚖️</text>
			<text class="header-text">体重记录</text>
		</view>
		<text class="header-sub">坚持记录，见证改变 💪</text>
	</view>
</template>

<script setup>
	// 纯展示组件：顶部标题
</script>

<style scoped>
	.header {
		display: flex;
		flex-direction: column;
		padding: 10rpx 8rpx 26rpx;
	}
	.header-title {
		display: flex;
		align-items: center;
	}
	.header-emoji {
		font-size: 48rpx;
		margin-right: 14rpx;
	}
	.header-text {
		font-size: 46rpx;
		font-weight: 700;
		color: #1f2d2a;
	}
	.header-sub {
		margin-top: 10rpx;
		font-size: 26rpx;
		color: #7a8a85;
	}
</style>
