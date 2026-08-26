<template>
	<view class="form-card">
		<view class="form-title">{{ editing ? '✏️ 修改记录' : '➕ 新增记录' }}</view>
		<view class="form-row">
			<view class="form-item">
				<text class="form-label">📅 日期</text>
				<picker mode="date" :value="form.date" @change="onDateChange">
					<view class="picker-value">{{ form.date }} <text class="caret">▾</text></view>
				</picker>
			</view>
			<view class="form-item">
				<text class="form-label">⚖️ 体重 (kg)</text>
				<input class="weight-input" type="digit" v-model="form.weight" placeholder="如 65.5" />
			</view>
		</view>
		<view class="form-actions">
			<button v-if="editing" class="btn cancel" @click="cancel">取消</button>
			<button class="btn primary" @click="save">{{ editing ? '💾 保存' : '✅ 记录' }}</button>
		</view>
	</view>
</template>

<script setup>
	import { reactive, watch } from 'vue'

	const props = defineProps({
		editing: { type: Object, default: null }
	})
	const emit = defineEmits(['submit', 'cancel'])

	// 当天日期，用于初始值与重置
	const today = () => {
		const d = new Date()
		const m = String(d.getMonth() + 1).padStart(2, '0')
		const day = String(d.getDate()).padStart(2, '0')
		return `${d.getFullYear()}-${m}-${day}`
	}

	const form = reactive({
		date: today(),
		weight: ''
	})

	// 编辑目标变化时回填表单；退出编辑则重置为新增态
	watch(() => props.editing, (item) => {
		if (item) {
			form.date = item.date
			form.weight = String(item.weight)
		} else {
			form.date = today()
			form.weight = ''
		}
	})

	const onDateChange = (e) => {
		form.date = e.detail.value
	}

	const save = () => {
		const w = parseFloat(form.weight)
		if (isNaN(w) || w <= 0 || w > 500) {
			uni.showToast({ title: '请输入有效体重 😅', icon: 'none' })
			return
		}
		emit('submit', {
			id: props.editing ? props.editing.id : null,
			date: form.date,
			weight: w
		})
	}

	const cancel = () => {
		emit('cancel')
	}

	// 清空体重输入（日期保留为当天），供父组件在新增成功后调用
	const resetWeight = () => {
		form.weight = ''
	}

	defineExpose({ resetWeight })
</script>

<style scoped>
	.form-card {
		margin-top: 28rpx;
		background: #ffffff;
		border-radius: 24rpx;
		padding: 30rpx 28rpx;
		box-shadow: 0 8rpx 30rpx rgba(45, 120, 100, 0.08);
	}
	.form-title {
		font-size: 30rpx;
		font-weight: 700;
		color: #1f2d2a;
		margin-bottom: 24rpx;
	}
	.form-row {
		display: flex;
		gap: 22rpx;
	}
	.form-item {
		flex: 1;
		display: flex;
		flex-direction: column;
	}
	.form-label {
		font-size: 24rpx;
		color: #8a9994;
		margin-bottom: 12rpx;
	}
	.picker-value,
	.weight-input {
		height: 80rpx;
		line-height: 80rpx;
		padding: 0 22rpx;
		background: #f3f6f5;
		border-radius: 16rpx;
		font-size: 30rpx;
		color: #1f2d2a;
		box-sizing: border-box;
	}
	.weight-input {
		text-align: left;
	}
	.caret {
		color: #aab4b0;
		float: right;
	}
	.form-actions {
		display: flex;
		gap: 20rpx;
		margin-top: 28rpx;
	}
	.btn {
		flex: 1;
		height: 84rpx;
		line-height: 84rpx;
		border-radius: 16rpx;
		font-size: 30rpx;
		font-weight: 600;
		border: none;
		padding: 0;
		margin: 0;
	}
	.btn.primary {
		background: #14b886;
		color: #ffffff;
	}
	.btn.cancel {
		flex: 0 0 200rpx;
		background: #eef3f1;
		color: #5a6b66;
	}
	.btn.primary::after,
	.btn.cancel::after {
		border: none;
	}
</style>
