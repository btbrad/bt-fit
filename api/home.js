import { $http } from '@/utils/request.js'

/**
 * 录入体重记录
 * @param {Object} data 请求参数
 * @param {number} data.weight 体重（kg）
 * @param {string} data.note 备注
 * @param {string} data.recorded_at 记录时间
 * @returns {Promise} resolve 后端返回的 data
 */
export const addWeightRecordApi = (data) => {
	return $http.post('/api/weight-records', data)
}

/**
 * 分页获取体重记录列表
 * @param {Object} params 查询参数
 * @param {number} params.page 页码，默认 1
 * @param {number} params.per_page 每页条数
 * @returns {Promise} resolve 后端返回的 data（约定含记录列表与分页信息）
 */
export const getWeightRecordsApi = (params) => {
	return $http.get('/api/weight-records', params)
}
