import {
  CommentOutlined,
  DeleteOutlined,
  GitlabFilled,
  RedditCircleFilled,
  RedditSquareFilled
} from '@ant-design/icons'
import { Button, Modal,Radio, Popconfirm, Space, Tabs, Select, message, Badge } from 'antd'
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import styles from './index.module.less'
import { imageStore, configStore, userStore } from '@/store'
import { userAsync, chatAsync, imageAsync } from '@/store/async'
import RoleNetwork from './components/RoleNetwork'
import RoleLocal from './components/RoleLocal'
import AllInput from './components/AllInput'
import ChatMessage from './components/ChatMessage'
import { ChatGpt, ImgChatGpt, RequestChatOptions } from '@/types'
import * as services from '@/request/api'
import Reminder from '@/components/Reminder'
import { filterObjectNull, formatTime, generateUUID, handleChatData } from '@/utils'
import { useScroll } from '@/hooks/useScroll'
import useDocumentResize from '@/hooks/useDocumentResize'
import Layout from '@/components/Layout'
import useMobile from '@/hooks/useMobile'
import PersonaModal from '@/components/PersonaModal'
import PluginModal from '@/components/pluginModal'
import MessageItem from './components/MessageItem'

const typeOptions = ['默认', '中国画', '3D绘图', '素描画', '像素画', '油画', '水彩画', '印象主义',
'木刻艺术', '涂抹油画', '立体像素艺术', '技术绘图', '新表现主义', '电致发光多边几何', '纸雕', '霓虹立体派', '水彩像素艺术', '涂抹木炭画', '剪纸轮廓', '涂抹中国水墨画', '动漫水彩', '3D 皮克斯风格卡通', '霓虹线描', '等距乐高', '彩饰手抄本'];
const sizeOptions = [
  {
    label: '1024x1024',
    value: '1024x1024'
  },
  {
    label: '1792x1024',
    value: '1792x1024'
  },
  {
    label: '1024x1792',
    value: '1024x1792'
  },
]
function ChatPage() {
  const scrollRef = useRef<HTMLDivElement>(null)
  const { scrollToBottomIfAtBottom, scrollToBottom } = useScroll(scrollRef.current)
  const { token, setLoginModal } = userStore()
  const { config, models, changeConfig, setConfigModal } = configStore()
  const {
    chats,
    fetchUserSession,
    addChat,
    delChat,
    clearChats,
    selectChatId,
    changeSelectChatId,
    setChatInfo,
    setChatDataInfo,
    clearChatMessage,
    delChatMessage
  } = imageStore()

  const bodyResize = useDocumentResize()

  const isMobile = useMobile()
  const [size, setSize] = useState('1024x1024');
  const [style, setStyle] = useState('vivid');
  const [type, setType] = useState('默认');
  const [model, setModel] = useState('dall-e-3');

  useLayoutEffect(() => {
    if (scrollRef) {
      scrollToBottom()
    }
  }, [scrollRef.current, selectChatId, chats])

  // useEffect(() => {
  //   if (token) {
  //     chatAsync.fetchChatMessages()
  //     pluginAsync.fetchGetPlugin()
  //   }
  // }, [token])

  // 当前聊天记录
  const chatMessages = useMemo(() => {
    const chatList = chats.filter((c) => c.id === selectChatId)
    if (chatList.length <= 0) {
      return []
    }
    return chatList[0].data
  }, [selectChatId, chats])

  // 创建对话按钮
  const CreateChat = () => {
    return (
      <Button
        block
        type="dashed"
        style={{
          marginBottom: 6,
          marginLeft: 0,
          marginRight: 0
        }}
        onClick={async () => {
          // if (!token) {
          //   setLoginOptions({
          //     open: true
          //   })
          //   return
          // }
          addChat()
        }}
      >
        新建绘图
      </Button>
    )
  }

  // 对接服务端方法
  async function serverChatCompletions({
    requestOptions,
    signal,
    userMessageId,
    assistantMessageId,
  }: {
    userMessageId?: string
    signal: AbortSignal
    requestOptions: RequestChatOptions
    assistantMessageId: string
  }) {
    const response = await services.postImageCompletions(requestOptions, {
      options: {
        // headers: {
        //   Authorization: 
        // },
        signal
      }
    })
      .then((res) => {
        return res
      })
      .catch((error) => {
        // 终止： AbortError
      })
      
    if (!response?.success) {
      
      fetchController?.abort()
      setFetchController(null)
      // message.error('请求失败')
      // const data = await response.json();
      // 这里返回是错误 ...
      if (userMessageId) {
        setChatDataInfo(selectChatId, userMessageId, {
          status: 'error'
        })
      }
      
      setChatDataInfo(selectChatId, assistantMessageId, {
        status: 'error',
        text: `${response?.message || '❌ 请求异常，请稍后在尝试。'}`
      })
      
      return
    }
    setFetchController(null);
    if (userMessageId) {
      setChatDataInfo(selectChatId, userMessageId, {
        status: 'pass'
      })
    }
    setChatDataInfo(selectChatId, assistantMessageId, {
      text: response?.imgurl,
      dateTime: response?.timestamp,
      status: 'pass'
    })
  }

  const [fetchController, setFetchController] = useState<AbortController | null>(null)
  const shareImgsHandle = (params) => {
    return services.shareImgs({
      ...params,
      token,
    })
  }
  // 对话
  async function sendChatCompletions(vaule: string, refurbishOptions?: ImgChatGpt) {
    if (!token) {
      setLoginModal(true);
      return;
    }
    const selectChat = chats.filter((c) => c.id === selectChatId)[0]
    const parentMessageId = refurbishOptions?.requestOptions.parentMessageId || selectChat.id
    let userMessageId = generateUUID()
    const requestOptions = {
      token,
      chatid: selectChatId,
      model: model,
      message: vaule,
      imgtype: type,
      imgstyle: style,
      imgsize: size,
      // quality: 'hd',
    }
    const assistantMessageId = refurbishOptions?.id || generateUUID()
    if (refurbishOptions?.requestOptions.parentMessageId && refurbishOptions?.id) {
      userMessageId = ''
      setChatDataInfo(selectChatId, assistantMessageId, {
        status: 'loading',
        role: 'assistant',
        text: '',
        dateTime: formatTime(),
        requestOptions
      })
    } else {
      setChatInfo(selectChatId, {
        id: userMessageId,
        text: vaule,
        dateTime: formatTime(),
        status: 'pass',
        role: 'user',
        requestOptions
      })
      setChatInfo(selectChatId, {
        id: assistantMessageId,
        text: '',
        dateTime: formatTime(),
        status: 'loading',
        role: 'assistant',
        requestOptions
      })
    }

    const controller = new AbortController()
    const signal = controller.signal
    setFetchController(controller)
    serverChatCompletions({
      requestOptions,
      signal,
      userMessageId,
      assistantMessageId
    })
  }

  return (
    <div className={styles.chatPage}>
      <Layout
        menuExtraRender={() => <CreateChat />}
        route={{
          path: '/image',
          routes: chats
        }}
        menuDataRender={(item) => {
          return item
        }}
        menuItemRender={(item, dom) => (
          <MessageItem
            isSelect={item.id === selectChatId}
            isPersona={!!item.persona_id}
            name={item.name}
            onConfirm={() => {
              imageAsync.fetchDelUserMessages({ id: item.id, type: 'del' })
            }}
          />
        )}
        menuFooterRender={(props) => {
          //   if (props?.collapsed) return undefined;
          return (
            <Space direction="vertical" style={{ width: '100%' }}>
              <Select
                size="middle"
                style={{ width: '100%' }}
                value={model}
                options={[{label: 'dall-e-3', value: 'dall-e-3'}]}
                onChange={(e) => {
                  setModel(e.toString());
                }}
              />
              <Select
                size="middle"
                style={{ width: '100%' }}
                value={size}
                options={sizeOptions}
                onChange={(e) => {
                  setSize(e);
                }}
              />
               <Radio.Group style={{width: '100%'}} value={style} onChange={(v) => {setStyle(v.target.value)}}>
                <Radio.Button style={{width: '50%'}} value="vivid">生动</Radio.Button>
                <Radio.Button style={{width: '50%'}} value="natural">自然</Radio.Button>
               </Radio.Group>
              <Select
                size="middle"
                style={{ width: '100%' }}
                value={type}
                options={typeOptions.map(i => ({label: i, value: i}))}
                onChange={(e) => {
                  setType(e);
                }}
              />
              {/* <Input addonBefore="宽度" value={} /> */}
              {/* <Popconfirm
                title="删除全部对话"
                description="您确定删除全部会话对吗? "
                onConfirm={() => {
                  if (token) {
                    imageAsync.fetchDelUserMessages({ type: 'delAll' })
                  } else {
                    clearChats()
                  }
                }}
                onCancel={() => {
                  // ==== 无操作 ====
                }}
                okText="Yes"
                cancelText="No"
              >
                <Button block danger type="dashed" ghost>
                  清除所有对话
                </Button>
              </Popconfirm> */}
            </Space>
          )
        }}
        menuProps={{
          onClick: (r) => {
            const id = r.key.replace('/', '')
            if (selectChatId !== id) {
              changeSelectChatId(id)
            }
          }
        }}
      >
        <div className={styles.chatPage_container}>
          {/* {
            chatMessages[0]?.persona_id && <div className={styles.chatPage_container_persona}>当前为预置角色对话</div>
          } */}
          <div ref={scrollRef} className={styles.chatPage_container_one}>
            <div id="image-wrapper">
              {chatMessages.map((item) => {
                return (
                  <ChatMessage
                    key={item.dateTime + item.role + item.text}
                    position={item.role === 'user' ? 'right' : 'left'}
                    status={item.status}
                    content={item.text}
                    time={item.dateTime}
                    model={item.requestOptions.options?.model}
                    onDelChatMessage={() => {
                      delChatMessage(selectChatId, item.id)
                    }}
                    onRefurbishChatMessage={() => {
                      console.log(item)
                      sendChatCompletions(item.requestOptions.message, {...item, id: ''})
                    }}
                    pluginInfo={item.plugin_info}
                  />
                )
              })}
              {chatMessages.length <= 0 && <Reminder />}
              <div style={{ height: 80 }} />
            </div>
          </div>
          <div
            className={styles.chatPage_container_two}
            style={{
              position: isMobile ? 'fixed' : 'absolute'
            }}
          >
            <AllInput
              disabled={!!fetchController}
              shareImgsHandle={shareImgsHandle}
              onSend={(value) => {
                if (value.startsWith('/')) return
                sendChatCompletions(value)
                scrollToBottomIfAtBottom()
              }}
              chatMessages={chatMessages}
              clearMessage={() => {
                if (token) {
                  imageAsync.fetchDelUserMessages({ id: selectChatId, type: 'clear' })
                } else {
                  setLoginModal(true)
                }
              }}
              onStopFetch={() => {
                // 结束
                setFetchController((c) => {
                  c?.abort()
                  return null
                })
              }}
            />
          </div>
        </div>
      </Layout>
    </div>
  )
}
export default ChatPage
