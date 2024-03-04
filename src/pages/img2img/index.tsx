import {
  CommentOutlined,
  DeleteOutlined,
  GitlabFilled,
  PlusOutlined,
  LoadingOutlined
} from '@ant-design/icons'
import { Button, Image,Radio, Popconfirm, Space, Tabs, Select, message, Upload } from 'antd'
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import styles from './index.module.less'
import { img2Store, configStore, userStore } from '@/store'
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

const typeOptions = [
  {'label': '复古漫画', 'value': 0},
  {'label': '3D童话', 'value': 1},
  {'label': '二次元', 'value': 2},
  {'label': '小清新', 'value': 3},
  {'label': '未来科技', 'value': 4},
  {'label': '国画古风', 'value': 5},
  {'label': '将军百战', 'value': 6},
  {'label': '炫彩卡通', 'value': 7},
  {'label': '清雅国风', 'value': 8},
  {'label': '喜迎新年', 'value': 9}
]
function ChatPage() {
  const scrollRef = useRef<HTMLDivElement>(null)
  const { scrollToBottomIfAtBottom, scrollToBottom } = useScroll(scrollRef.current)
  const { token, setLoginModal } = userStore()
  const { config, models, changeConfig, setConfigModal } = configStore()
  const {
    chats,
    addChat,
    delChat,
    clearChats,
    selectChatId,
    changeSelectChatId,
    setChatInfo,
    setChatDataInfo,
    clearChatMessage,
    delChatMessage
  } = img2Store()

  const bodyResize = useDocumentResize()

  const isMobile = useMobile()
  // const [size, setSize] = useState('1024x1024');
  const [style, setStyle] = useState(0);
  const [styleText, setStyleText] = useState('复古漫画');
  // const [type, setType] = useState('默认');
  const [model, setModel] = useState('wanx-style-repaint-v1');
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState([]);
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
    const response = await services.postImage2Completions(requestOptions, {
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
  async function sendChatCompletions(refurbishOptions?: ImgChatGpt) {
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
      // message: vaule,
      // imgtype: type,
      imgstyle: Number(style),
      // imgsize: size,
      imgurl: imageUrl[0]?.url
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
        text: styleText,
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
  const uploadButton = (
    <button style={{ border: 0,width: '100%', background: 'none' }} type="button">
      {loading ? <LoadingOutlined /> : <PlusOutlined />}
      <div style={{ marginTop: 8 }}>上传图片</div>
    </button>
  );
  const handleChange = (info) => {
    console.log(1111, info.fileList.map(i => ({uid:i.uid,status: i.status, url: i?.response?.url})))
    setImageUrl(info.fileList.map(i => ({uid:i.uid,status: i.status, url: i?.response?.url})));
    return;
  };
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
            <Upload
              style={{width: '100%', overflow: 'hidden'}}
              name="avatar"
              listType="picture-card"
              className="avatar_uploader"
              accept="jpg, .jpeg, .png"
              // showUploadList={false}
              fileList={imageUrl}
              maxCount={1}
              action={'/api/upload'}
              data={{
                token
              }}
              // beforeUpload={beforeUpload}
              onChange={handleChange}
            >
              {(!imageUrl || imageUrl.length === 0) && uploadButton}
            </Upload>
              <Select
                size="middle"
                style={{ width: '100%' }}
                value={model}
                options={[{label: 'wanx-style-repaint-v1', value: 'wanx-style-repaint-v1'}]}
                onChange={(e) => {
                  setModel(e.toString());
                }}
              />
              <Select
                size="middle"
                style={{ width: '100%' }}
                value={style}
                options={typeOptions}
                onChange={(e, v) => {
                  setStyleText(v.label)
                  setStyle(e);
                }}
              />
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
                      sendChatCompletions({...item, id: ''})
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
              imageUrl={imageUrl?.[0]?.url}
              shareImgsHandle={shareImgsHandle}
              onSend={() => {
                // if (value.startsWith('/')) return
                sendChatCompletions()
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
