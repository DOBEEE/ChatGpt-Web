import { RequestLoginParams, WithdrawalRecordInfo } from '@/types'
import userStore from '../user/slice'
import chatStore from '../chat/slice'
import { getUserInfo, getUserSession, getUserRecords, postLogin, postUserWithdrawal, putUserPassword } from '@/request/api'

// 登录
export async function fetchLogin(params: RequestLoginParams) {
  const response = await postLogin(params)
  if (response.success) {
    userStore.getState().login({ token: response.token })
  }
  return response
}

// 获取用户信息
export async function fetchUserInfo() {
  const response = await getUserInfo({token: userStore.getState().token})
  if (!response.code) {
    userStore.getState().login({
      token: userStore.getState().token,
      tokens: response?.tokens,
      username: response?.user
    })
  }
  return response
}

// 校验session
export async function fetchUserSession() {
  const response = await getUserSession()
  if (!response.success) {
    userStore.getState().setLoginModal(true);
   throw new Error('未登录！');
  }
  return true;
}

// 重置用户密码
export async function fetchUserPassword(params: RequestLoginParams) {
  const response = await putUserPassword(params)
  if (!response.code) {
    userStore.getState().logout()
	chatStore.getState().clearChats()
  }
  return response
}

// 用户数据
export async function fetchUserRecords(params: {
  page: number
  page_size: number
  type: string | number
}) {
  const response = await getUserRecords({ ...params })
  if (!response.code) {
    userStore.getState().changeRecords(response.data, params.type)
  }
  return response
}

export async function fetchUserWithdrawal(params: WithdrawalRecordInfo) {
  const response = await postUserWithdrawal({ ...params })
  if (!response.code) {
	userStore.getState().changeUserCurrentAmount()
  }
  return response
}

export default {
  fetchUserInfo,
  fetchLogin,
  fetchUserSession,
  fetchUserPassword
}
