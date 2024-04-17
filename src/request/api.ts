import {
	ChatsInfo,
  ConsumeRecordInfo,
  DrawRecord,
  InvitationRecordInfo,
  PersonaInfo,
  PluginInfo,
  ProductInfo,
  RequesPrepay,
  RequestChatOptions,
  RequestImagesGenerations,
  RequestLoginParams,
  ResponseConfigData,
  ResponseLoginData,
  SigninInfo,
  SubscriptionInfo,
  TurnoverInfo,
  UserInfo,
  WithdrawalRecordInfo
} from '@/types'
import request from '.'
import { formatTime } from '@/utils'
import { TableData } from '@/types/admin'

// 获取验证码
export function getCode(params: { source: string }) {
  return request.get('/api/send_sms', params)
}

// 登录
export function postLogin(params: RequestLoginParams) {
  return request.post<ResponseLoginData>('/api/login', params, {
    'Content-Type': 'application/x-www-form-urlencoded'
  })

  return request.postStreams<ResponseLoginData>('/api/s_login', params, {headers: {
    'Content-Type': 'application/x-www-form-urlencoded'
  }})
}

// 获取用户信息
export function getUserInfo(params) {
  return request.get<UserInfo>('/api/userinfo', params)
}

// 获取用户信息
export function getUserSession() {
  return request.get<UserInfo>('/api/v1/user/session')
}
export function postChatCompletion(
  params: RequestChatOptions,
  config?: {
    headers?: { [key: string]: any }
    options?: { [key: string]: any }
  }
) {
  return request.postStreams<Response>('/api/textchat', params, config, true)
}
// 请求对话
export function postChatCompletions(
  params: RequestChatOptions,
  config?: {
    headers?: { [key: string]: any }
    options?: { [key: string]: any }
  }
) {
  return request.postStreams<Response>('/api/textchat', params, config, true)
}
export function postChatStreamCompletions(
  params: RequestChatOptions,
  config?: {
    headers?: { [key: string]: any }
    options?: { [key: string]: any }
  }
) {
  return request.postStream<Response>('/api/textchatstream', params, config, true)
}

export function postImageCompletions(
  params: RequestChatOptions,
  config?: {
    headers?: { [key: string]: any }
    options?: { [key: string]: any }
  }
) {
  return request.postStreams<Response>('/api/imagechat', params, config, true)
}
export function postImage2Completions(
  params: RequestChatOptions,
  config?: {
    headers?: { [key: string]: any }
    options?: { [key: string]: any }
  }
) {
  return request.postStreams<Response>('/api/portrait', params, config, true)
}

export function postAudioChatCompletion(
  params,
  config?: {
    headers?: { [key: string]: any }
    options?: { [key: string]: any }
  }
) {
  return request.postStreams<Response>('/api/voicechat', params, config, true)
}

export function postAudioTransCompletion(
  params: {
    voice: string,
  },
  config?: {
    headers?: { [key: string]: any }
    options?: { [key: string]: any }
  }
) {
  return request.postStreams<Response>('/api/asr', params, config)
}

// 请求绘画
export function postImagesGenerations(
  params: RequestImagesGenerations,
  headers?: { [key: string]: any },
  options?: { [key: string]: any }
) {
  const formData = new FormData()
  Object.keys(params).forEach((key) => {
    formData.append(key, params[key])
  })
  return request.post<Array<DrawRecord>>(
    '/api/images/generations',
    formData,
    {
      'Content-Type': 'multipart/form-data',
      ...headers
    },
    options
  )
}

// 获取商品列表
export function getProduct() {
  return request.get<{
    products: Array<ProductInfo>
    pay_types: Array<string>
  }>('/api/product')
}

// 获取用户消费记录
export function getUserTurnover(params: { page: number; page_size: number }) {
  return request.get<{ count: number; rows: Array<TurnoverInfo> }>('/api/turnover', params)
}

// 提交订单
export function postPayPrecreate(params: RequesPrepay) {
  return request.post<{
    order_id: string
    pay_url: string
    pay_key: string
    qrcode?: string
  }>('/api/pay/precreate', params)
}

// 卡密充值
export function postUseCarmi(params: { carmi: string }) {
  return request.post('/api/use_carmi', params)
}

// 签到
export function postSignin() {
  return request.post('/api/signin')
}

// 获取签到列表
export function getSigninList() {
  return request.get<Array<SigninInfo>>('/api/signin/list')
}

// 获取角色数据
export function getPersonas(){
	return request.get<Array<PersonaInfo>>('/api/persona')
}

// 新增角色数据
export function postPersona(params: PersonaInfo){
	return request.post('/api/persona', params)
}

// 重置用户密码
export function putUserPassword(params: RequestLoginParams) {
  return request.put('/api/user/password', params)
}
export function shareImgs(params: RequestLoginParams) {
  return request.post('/api/create', params)
}
// 获取配置数据
export function getConfig() {
  return request.get<ResponseConfigData>('/api/config')
}

// 获取用户记录
export function getUserRecords(params: { page: number; page_size: number; type: string | number }) {
  return request.get<TableData<InvitationRecordInfo | ConsumeRecordInfo | WithdrawalRecordInfo>>(
    '/api/user/records',
    params
  )
}

// 申请提现
export function postUserWithdrawal(params: WithdrawalRecordInfo) {
  return request.post('/api/user/withdrawal', params)
}

// 消息列表
export function getUserMessages(){
	return request.get<Array<ChatsInfo>>('/api/user/messages')
}

// 删除用户对话
export function delUserMessages(params: { parent_message_id?: string | number }){
	return request.del('/api/user/messages', params)
}

// 获取插件数据
export function getPlugin(){
	return request.get<Array<PluginInfo>>('/api/plugin')
}

// 安装插件
export function putInstalledPlugin(id: string | number){
	return request.put(`/api/plugin/installed/${id}`)
}

// 卸载插件
export function putUninstallPlugin(id: string | number){
	return request.put(`/api/plugin/uninstall/${id}`)
}

// 获取绘画数据
export function getDrawImages(params: {
  page: number,
  page_size: number,
  type: 'gallery' | 'me' | string
}){
	return request.get<TableData<DrawRecord>>('/api/images', params)
}

// 修改绘画状态
export function setDrawImages(params: {
  id?: string | number,
  status?: number
}){
	return request.put('/api/images', params)
}

export function upload(params: any) {
  return request.post<ResponseConfigData>('/api/upload', params)
}
export function testsearch(params: any) {
  return request.post<ResponseConfigData>('/api/testsearch', params)
}

export function testresult(params: any) {
  return request.get<ResponseConfigData>('/api/testresult', params)
}