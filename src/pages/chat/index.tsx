import {
  CommentOutlined,
  DeleteOutlined,
  GitlabFilled,
  RedditCircleFilled,
  RedditSquareFilled
} from '@ant-design/icons'
import { Button, Modal, Popconfirm, Space, Tabs, Select, message, Badge } from 'antd'
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import {aiCharts} from './config';
import styles from './index.module.less'
import { chatStore, configStore, userStore } from '@/store'
import { userAsync, chatAsync, pluginAsync } from '@/store/async'
import RoleNetwork from './components/RoleNetwork'
import RoleLocal from './components/RoleLocal'
import AllInput from './components/AllInput'
import ChatMessage from './components/ChatMessage'
import { ChatGpt, RequestChatOptions } from '@/types'
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

function ChatPage() {
  const scrollRef = useRef<HTMLDivElement>(null)
  const { scrollToBottomIfAtBottom, scrollToBottom } = useScroll(scrollRef.current)
  const { token, setLoginModal } = userStore()
  const [ currentId, setCurrentId ] = useState(null)
  const [character, setCharacter]= useState(aiCharts[0].prompt);
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
  } = chatStore()

  const bodyResize = useDocumentResize()

  const isMobile = useMobile()
  useLayoutEffect(() => {
    if (scrollRef) {
      scrollToBottom()
    }
  }, [scrollRef.current, selectChatId, chats])

  useEffect(() => {
    if (!token) {
      setLoginModal(true)
      // chatAsync.fetchChatMessages()
      // pluginAsync.fetchGetPlugin()
    }
  }, [token])

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
        onClick={() => {
          // if (!token) {
          //   setLoginOptions({
          //     open: true
          //   })
          //   return
          // }
          if (!token) {
            setLoginModal(true);
            return;
          }
          addChat()
        }}
      >
        新建对话
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
    setCurrentId(assistantMessageId);
    const response = await services.postChatStreamCompletions(requestOptions, {
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
        console.log(error.name)
      })
    
    // if (requestOptions.model === 'gpt-4') {
      const reader = response.body?.getReader?.()
      let alltext = ''
      while (true) {
        const { done, value } = (await reader?.read()) || {}
        if (done) {
          setFetchController(null);
          break
        }
        // 将获取到的数据片段显示在屏幕上
        const text = new TextDecoder('utf-8').decode(value)
        const texts = handleChatData(text)
        console.log(111,alltext, text);
        for (let i = 0; i < texts.length; i++) {
          const { timestamp, parentMessageId, answer, segment } = texts[i];
          console.log('answer', `${answer}`)
          alltext += answer;
          if (segment === 'start') {
            if (userMessageId) {
              setChatDataInfo(selectChatId, userMessageId, {
                status: 'pass'
              })
            }
            setChatInfo(
              selectChatId,
              {
                // parentMessageId
              },
              {
                id: assistantMessageId,
                text: alltext,
                dateTime: timestamp,
                status: 'loading',
                // role,
                requestOptions
              }
            )
          }
          if (segment === 'text') {
            setChatDataInfo(selectChatId, assistantMessageId, {
              text: alltext,
              dateTime: timestamp,
              status: 'pass'
            })
          }
          if (segment === 'stop') {
            setFetchController(null);
            if (userMessageId) {
              setChatDataInfo(selectChatId, userMessageId, {
                status: 'pass'
              })
            }
            setChatDataInfo(selectChatId, assistantMessageId, {
              text: alltext,
              dateTime: timestamp,
              status: 'pass'
            })
          }
        }
        scrollToBottomIfAtBottom()
      }
      return;
    // }
    
    if (!response?.success) {
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
      fetchController?.abort()
      setFetchController(null)
      message.error('请求失败')
      return
    }
    setFetchController(null);
    if (userMessageId) {
      setChatDataInfo(selectChatId, userMessageId, {
        status: 'pass'
      })
    }
    setChatDataInfo(selectChatId, assistantMessageId, {
      text: response?.answer,
      dateTime: response?.timestamp,
      status: 'pass'
    })
  }

  const [fetchController, setFetchController] = useState<AbortController | null>(null)

  // 对话
  async function sendChatCompletions(vaule: string, refurbishOptions?: ChatGpt) {
    if (!token) {
      setLoginModal(true);
      return;
    }
    const selectChat = chats.filter((c) => c.id === selectChatId)[0]
    const parentMessageId = refurbishOptions?.requestOptions.parentMessageId || selectChat.id
    let userMessageId = generateUUID()
    const requestOptions = {
      chatid: selectChatId,
      model: config.model,
      token,
      userMessage: vaule,
      // message: vaule,
      prompts: character,
      messages: [...chatMessages.slice(chatMessages.length - 3 < 0 ? 0 : chatMessages.length - 3).map(i => ({
        role: i.role,
        content: i.text
      })), {
        role: 'user',
        content: vaule
      }]
      // prompt: vaule,
      // parentMessageId,
      // persona_id: selectChat?.persona_id || refurbishOptions?.persona_id || '',
      // options: filterObjectNull({
      //   ...config,
      //   ...refurbishOptions?.requestOptions.options
      // })
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
          path: '/',
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
              chatAsync.fetchDelUserMessages({ id: item.id, type: 'del' })
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
                // defaultValue={config.model}
                value={config.model}
                options={models.map((m) => ({ ...m, label: 'AI模型: ' + m.label }))}
                onChange={(e) => {
                  changeConfig({
                    ...config,
                    model: e.toString()
                  })
                }}
              />
              <Select
                size="middle"
                style={{ width: '100%' }}
                value={character}
                options={aiCharts.map(i => ({label: i.act, value: i.prompt}))}
                onChange={(e) => {
                  setCharacter(e.toString())
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
                    model={item?.requestOptions?.options?.model}
                    onDelChatMessage={() => {
                      delChatMessage(selectChatId, item.id)
                    }}
                    onRefurbishChatMessage={() => {
                      console.log(item)
                      sendChatCompletions(item?.requestOptions?.userMessage, {...item, id: ''})
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
              onSend={(value) => {
                if (value.startsWith('/')) return
                sendChatCompletions(value)
                scrollToBottomIfAtBottom()
              }}
              clearMessage={() => {
                if (!token) {
                  setLoginModal(true);
                } else {
                  chatAsync.fetchDelUserMessages({ id: selectChatId, type: 'clear' })
                }
              }}
              onStopFetch={() => {
                // 结束
                console.log(2222233)
                setFetchController((c) => {
                  c?.abort()
                  setChatDataInfo(selectChatId, currentId, {
                    status: 'pass'
                  })
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
