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

/**
 * 修改密码
 * @param {Object} data 请求参数
 * @param {string} data.old_password 原密码
 * @param {string} data.new_password 新密码
 * @param {string} data.confirm_password 确认密码
 * @returns {Promise} resolve 后端返回的 data
 */
export const changePasswordApi = (data) => {
	return $http.post('/api/change-password', data)
}
