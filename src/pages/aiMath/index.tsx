import {
  PlusOutlined,
  LoadingOutlined
} from '@ant-design/icons'
import { Button, Image,Radio, Popconfirm, Space, Tabs, Select, message, Upload } from 'antd'
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import styles from './index.module.less'
import { img2Store, configStore, userStore } from '@/store'
import { image2Async } from '@/store/async'
import AllInput from './components/AllInput'
import ChatMessage from './components/ChatMessage'
import { ChatGpt, ImgChatGpt, RequestChatOptions } from '@/types'
import * as services from '@/request/api'
import Reminder from '@/components/Reminder'
import { filterObjectNull, formatTime, generateUUID } from '@/utils'
import { useScroll } from '@/hooks/useScroll'
import Layout from '@/components/Layout'
import useMobile from '@/hooks/useMobile'
import MessageItem from './components/MessageItem'

function ChatPage() {
  const scrollRef = useRef<HTMLDivElement>(null)
  const { scrollToBottomIfAtBottom, scrollToBottom } = useScroll(scrollRef.current)
  const { token, setLoginModal } = userStore()
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


  const isMobile = useMobile()

  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState([]);
  const [, refresh] = useState({});
  useEffect(() => {
    const url = new URL(location.href)
    const searchs = new URLSearchParams(url.search)
    const taskid = searchs.get('taskid');
    if(taskid) {
      services
      .testresult({
        taskid,
        token,
        type: 1
      })
      .then((res) => {
        if (res?.analysis) {
          setChatDataInfo(selectChatId, taskid, {
            taskid: taskid,
            text: res?.analysis,
            teachurl: res?.teachurl,
            dateTime: res?.timestamp,
            status: 'pass'
          });
        }
      })
    }
  }, [])
  useLayoutEffect(() => {
    if (scrollRef) {
      scrollToBottom()
    }
  }, [scrollRef.current, selectChatId, chats])

  // useEffect(() => {
  //   if (token) {
  //     image2Async.fetchChatMessages()
  //     // pluginAsync.fetchGetPlugin()
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
        新建解题
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
    const response = await services.testsearch(requestOptions)
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
      taskid: response?.taskid,
      text: '',
      // teachurl: response?.teachurl,
      dateTime: response?.timestamp,
      status: 'pass'
    })
  }

  const [fetchController, setFetchController] = useState<AbortController | null>(null)
  // const shareImgsHandle = (params) => {
  //   return services.shareImgs({
  //     ...params,
  //     token,
  //   })
  // }
  // 对话
  async function sendChatCompletions(vaule, refurbishOptions?: ImgChatGpt) {
    if (!token) {
      setLoginModal(true);
      return;
    }
    // const selectChat = chats.filter((c) => c.id === selectChatId)[0]
    // const parentMessageId = refurbishOptions?.requestOptions.parentMessageId || selectChat.id
    let userMessageId = generateUUID()
    const requestOptions = {
      token,
      chatid: selectChatId,
      // message: vaule,
      // imgtype: type,
      testtext: vaule,
      // imgsize: size,
      testimg: imageUrl[0]?.url
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
  const uploadButton = (
    <button style={{ border: 0,width: '100%', background: 'none' }} type="button">
      {loading ? <LoadingOutlined /> : <PlusOutlined />}
      <div style={{ marginTop: 8 }}>上传图片</div>
    </button>
  );
  const handleChange = (info) => {
    setImageUrl(info?.fileList?.map(i => ({uid:i.uid,status: i.status, url: i?.response?.url})));
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
              image2Async.fetchDelUserMessages({ id: item.id, type: 'del' })
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
              accept="image/*"
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
            <div className="analysis-wrap" id="image-wrapper">
              {chatMessages?.map((item) => {
                return (
                  <ChatMessage
                    key={item.dateTime + item.role + item.text + item.taskid}
                    position={item.role === 'user' ? 'right' : 'left'}
                    status={item.status}
                    content={item.text}
                    time={item.dateTime}
                    teachurl={item.teachurl}
                    taskid={item.taskid}
                    token={token}
                    updateChatValue={(response) => {
                      setChatDataInfo(selectChatId, item.id, {
                        // taskid: response?.taskid,
                        text: response?.analysis,
                        teachurl: response?.teachurl,
                        dateTime: response?.timestamp,
                        status: 'pass'
                      });
                      refresh({});
                    }}
                    requestOptions={item.requestOptions}
                    onDelChatMessage={() => {
                      delChatMessage(selectChatId, item.id)
                    }}
                    onRefurbishChatMessage={() => {
                      console.log(item)
                      // sendChatCompletions(item?.requestOptions?.userMessage, {...item, id: ''})
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
              // shareImgsHandle={shareImgsHandle}
              onSend={(value) => {
                // if (value.startsWith('/')) return
                sendChatCompletions(value)
                scrollToBottomIfAtBottom()
              }}
              // chatMessages={chatMessages}
              clearMessage={() => {
                if (token) {
                  image2Async.fetchDelUserMessages({ id: selectChatId, type: 'clear' })
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
