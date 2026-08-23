/**
 * 全局 HTTP 请求封装（基于 uni.request）
 *
 * 用法一（推荐，<script setup> 中直接导入）：
 *   import { $http } from '@/utils/request.js'
 *   const data = await $http.get('/user/info', { id: 1 })
 *   const res = await $http.post('/weight/add', { weight: 65.2 })
 *
 * 用法二（全局属性，Options API 中通过 this.$http 调用）：
 *   this.$http.post('/login', { username, password })
 */

// ========== 接口基础配置（按实际后端修改） ==========
const BASE_URL = 'http://127.0.0.1:5000' // 后端地址，TODO: 替换
const TIMEOUT = 10000 // 请求超时（毫秒）
const TOKEN_KEY = 'bt_fit_token' // 登录态 token 的存储键
const LOGIN_PAGE = '/pages/login/login' // 登录失效后跳转的页面

// 公共请求头（可按需扩展）
const COMMON_HEADER = {
	'Content-Type': 'application/json'
}

// ========== Loading 计数（支持并发请求只显示/关闭一次） ==========
let loadingCount = 0

function showLoading() {
	if (++loadingCount === 1) {
		uni.showLoading({ title: '加载中...', mask: true })
	}
}

function hideLoading() {
	if (loadingCount > 0 && --loadingCount === 0) {
		uni.hideLoading()
	}
}

/**
 * 发起 HTTP 请求
 * @param {Object} options
 * @param {string}   options.url        接口地址（支持相对路径，自动拼接 BASE_URL）
 * @param {string}   [options.method]   请求方法，默认 GET
 * @param {Object}   [options.data]     请求参数
 * @param {Object}   [options.header]   自定义请求头（会合并到公共请求头）
 * @param {number}   [options.timeout]  超时时间，默认 10s
 * @param {boolean}  [options.loading]  是否显示加载框，默认 true
 * @param {boolean}  [options.showError]业务失败时是否自动 toast 提示，默认 true
 * @param {boolean}  [options.auth]     是否携带登录态，默认 true
 * @returns {Promise} 成功时 resolve 业务数据（约定 { code, message, data } 中的 data）
 */
function request(options = {}) {
	const {
		url,
		method = 'GET',
		data = {},
		header = {},
		timeout = TIMEOUT,
		loading = true,
		showError = true,
		auth = true
	} = options

	// url 已是完整地址时直接使用，否则拼接 BASE_URL
	const fullUrl = /^https?:\/\//.test(url) ? url : BASE_URL + url

	// 附加登录态
	if (auth) {
		const token = uni.getStorageSync(TOKEN_KEY)
		if (token) {
			header.Authorization = `Bearer ${token}`
		}
	}

	if (loading) showLoading()

	return new Promise((resolve, reject) => {
		uni.request({
			url: fullUrl,
			method: method.toUpperCase(),
			data,
			header: { ...COMMON_HEADER, ...header },
			timeout,
			success: (res) => {
				const { statusCode, data: resData } = res

				// HTTP 层异常
				if (statusCode === 401) {
					handleUnauthorized()
					reject({ code: 401, message: '登录已过期' })
					return
				}
				if (statusCode !== 200) {
					showError && uni.showToast({ title: `服务异常(${statusCode})`, icon: 'none' })
					reject({ code: statusCode, message: '服务异常' })
					return
				}

				// 业务层：约定返回 { code, message, data }，code 为 0（或 200）表示成功
				if (resData.code === 0 || resData.code === 200) {
					resolve(resData.data !== undefined ? resData.data : resData)
				} else if (resData.code === 401) {
					handleUnauthorized()
					reject(resData)
				} else {
					showError && uni.showToast({ title: resData.message || '请求失败', icon: 'none' })
					reject(resData)
				}
			},
			fail: (err) => {
				showError && uni.showToast({ title: '网络异常，请检查网络连接', icon: 'none' })
				reject({ code: -1, message: '网络异常', detail: err })
			},
			complete: () => {
				if (loading) hideLoading()
			}
		})
	})
}

// 登录态失效：清除本地登录信息并跳转登录页
function handleUnauthorized() {
	uni.removeStorageSync(TOKEN_KEY)
	uni.removeStorageSync('bt_fit_user')
	uni.showToast({ title: '登录已过期，请重新登录', icon: 'none' })
	setTimeout(() => {
		uni.reLaunch({ url: LOGIN_PAGE })
	}, 600)
}

// ========== 快捷方法 ==========
request.get = (url, data = {}, options = {}) => request({ ...options, url, data, method: 'GET' })
request.post = (url, data = {}, options = {}) => request({ ...options, url, data, method: 'POST' })
request.put = (url, data = {}, options = {}) => request({ ...options, url, data, method: 'PUT' })
request.delete = (url, data = {}, options = {}) => request({ ...options, url, data, method: 'DELETE' })

// 挂到 uni 上，任何地方可直接 uni.$http 调用
uni.$http = request

// 导出：默认导出与 $http 均指向 request
export default request
export { request as $http }
