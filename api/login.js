import { $http } from '@/utils/request.js'

/**
 * 用户登录
 * @param {Object} data 请求参数
 * @param {string} data.username 用户名
 * @param {string} data.password 密码
 * @returns {Promise} resolve 后端返回的 data（约定含 token / 用户信息，按实际返回调整）
 */
export const loginApi = (data) => {
	// 登录前无 token，不携带登录态
	return $http.post('/api/login', data, { auth: false })
}
