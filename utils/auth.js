/**
 * 登录态工具：存储键与判断/清理方法统一出口
 *
 * 各页面不再各自定义 USER_KEY / TOKEN_KEY，统一从这里导入：
 *   import { isLoggedIn, clearAuth, USER_KEY, PROFILE_CACHE_KEY } from '@/utils/auth.js'
 */

// 本地存储键
export const USER_KEY = 'bt_fit_user'
export const TOKEN_KEY = 'bt_fit_token'
// BmiCard 个人信息缓存：换账号/退出登录时需清除，防止读到上个账号的身高体重
export const PROFILE_CACHE_KEY = 'bt_fit_profile'

/**
 * 是否已登录（以用户缓存中有 name 为准）
 */
export const isLoggedIn = () => {
	const user = uni.getStorageSync(USER_KEY)
	return !!(user && user.name)
}

/**
 * 清除本地登录态（token / 用户信息 / 个人资料缓存）
 */
export const clearAuth = () => {
	uni.removeStorageSync(TOKEN_KEY)
	uni.removeStorageSync(USER_KEY)
	uni.removeStorageSync(PROFILE_CACHE_KEY)
}
