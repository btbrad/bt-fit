import { $http } from '@/utils/request.js'

/**
 * 获取用户信息
 * @returns {Promise} resolve 后端返回的 data（用户信息）
 */
export const getProfileApi = () => {
	return $http.get('/api/profile')
}

/**
 * 修改用户信息
 * @param {Object} data 请求参数（如 nickname / avatar / height 等，按实际后端字段调整）
 * @returns {Promise} resolve 后端返回的 data
 */
export const updateProfileApi = (data) => {
	return $http.put('/api/profile', data)
}
