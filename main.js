import App from './App'
import { createSSRApp } from 'vue'
import $http from './utils/request.js'

export function createApp() {
	const app = createSSRApp(App)

	// 全局请求接口：Options API 中可通过 this.$http 调用
	app.config.globalProperties.$http = $http

	return {
		app
	}
}
