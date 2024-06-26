import { Button, Space, Select, message, Col, InputNumber, Row, Slider } from 'antd'
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import Recorder from 'js-audio-recorder';
import styles from './index.module.less'
import { audioStore, userStore } from '@/store'
import { userAsync, imageAsync } from '@/store/async'
import AllInput from './components/AllInput'
import ChatMessage from './components/ChatMessage'
import { ChatGpt, RequestAudioOptions } from '@/types'
import * as services from '@/request/api'
import Reminder from '@/components/Reminder'
import { formatTime, generateUUID } from '@/utils'
import { useScroll } from '@/hooks/useScroll'
// import useDocumentResize from '@/hooks/useDocumentResize'
import Layout from '@/components/Layout'
import useMobile from '@/hooks/useMobile'
import {grade as gradeOptions} from './config'
import MessageItem from './components/MessageItem'

function ChatPage() {
  const scrollRef = useRef<HTMLDivElement>(null)
  const { scrollToBottomIfAtBottom, scrollToBottom } = useScroll(scrollRef.current)
  const { token, setLoginModal } = userStore()
  const {
    chats,
    addChat,
    selectChatId,
    changeSelectChatId,
    setChatInfo,
    setChatDataInfo,
    delChatMessage
  } = audioStore()

  // const bodyResize = useDocumentResize()

  const isMobile = useMobile()
  const [model, setModel] = useState('gpt-3.5-turbo');
  const [lang, setLang]= useState('默认');
  const [grade, setGrade]= useState('成人');
  const [speed, setSpeed]= useState(100);
  useLayoutEffect(() => {
    if (scrollRef) {
      scrollToBottom()
    }
  }, [scrollRef.current, selectChatId, chats])


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
          // await userAsync.fetchUserSession();
          // if (!token) {
          //   setLoginOptions({
          //     open: true
          //   })
          //   return
          // }
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
    requestOptions: RequestAudioOptions
    assistantMessageId: string
  }) {
    const response = await services.postAudioChatCompletion(requestOptions, {
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
      
    if (!response?.success) {
      // 这里返回是错误 ...
      if (userMessageId) {
        setChatDataInfo(selectChatId, userMessageId, {
          status: 'error'
        })
      }
      
      setChatDataInfo(selectChatId, assistantMessageId, {
        status: 'error',
        message: `${data?.message || '❌ 请求异常，请稍后在尝试。'} \n \`\`\` ${JSON.stringify(response, null, 2)}   `
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
      message: response?.avoice,
      dateTime: response?.timestamp,
      text: response?.answer,
      time: response?.avtime,
      status: 'pass'
    })
  }

  const [fetchController, setFetchController] = useState<AbortController | null>(null)

  // 对话
  async function sendChatCompletions(res, refurbishOptions?: ChatGpt) {
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
      model: model,
      prompts: '',
      lang,
      speed,
      grade,
      messages: [...chatMessages.slice(chatMessages.length - 3 < 0 ? 0 : chatMessages.length - 3).map(i => ({
        role: i.role,
        content: i.message
      })), {
        role: 'user',
        content: res.text
      }],
      text: res.text,
      url: res.url,
      avtime: res.avtime,
      // quality: 'hd',
    }
    const assistantMessageId = refurbishOptions?.id || generateUUID()
    if (refurbishOptions?.requestOptions.parentMessageId && refurbishOptions?.id) {
      userMessageId = ''
      setChatDataInfo(selectChatId, assistantMessageId, {
        status: 'loading',
        role: 'assistant',
        message: '',
        dateTime: formatTime(),
        requestOptions
      })
    } else {
      setChatInfo(selectChatId, {
        id: userMessageId,
        message: res.url,
        text: res.text,
        time: res.avtime,
        dateTime: formatTime(),
        status: 'pass',
        role: 'user',
        requestOptions
      })
      setChatInfo(selectChatId, {
        id: assistantMessageId,
        message: '',
        dateTime: formatTime(),
        status: 'loading',
        role: 'assistant',
        requestOptions
      })
    }

    // const controller = new AbortController()
    const signal = fetchController?.signal
    // setFetchController(controller)
    serverChatCompletions({
      requestOptions,
      signal,
      userMessageId,
      assistantMessageId
    })
  }
  // const mediaRecorderRef: any = useRef(null);
  // const audioChunksRef = useRef([]);
  const recorder = useRef(null);
  useEffect(() => {
    recorder.current = new Recorder({
      // 采样位数，支持 8 或 16，默认是16
      sampleBits: 16,
      // 采样率，支持 11025、16000、22050、24000、44100、48000，根据浏览器默认值
      sampleRate: 16000,
      // 声道，支持 1 或 2， 默认是1
      numChannels: 1,
      // 是否边录边转换，默认是false
      compiling: false
    });
  }, [])
  const startRecording = async () => {
    console.log('start')
    try {
      recorder.current.start().then(
        () => {
          // this.drawRecord()
        },
        error => {
          // 出错了
          console.log(`${error.name} : ${error.message}`)
        }
      )
      // const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // // console.log(2222, stream)
      // mediaRecorderRef.current = new MediaRecorder(stream, {
      //   mimeType: 'audio/webm;codecs=opus',
      //   audioBitsPerSecond: 16000
      // });
      // mediaRecorderRef.current.start();

      // mediaRecorderRef.current.ondataavailable = (event) => {
      //   audioChunksRef.current.push(event.data);
      // };
    } catch (error) {
      console.log('Failed to start recording:', error);
      message.error('唤起麦克风失败');
    }
  };
  
  // 停止录制
  const stopRecording = () => {
    recorder.current.stop();
    const audioBlob = recorder.current.getWAVBlob()
    if (recorder.current.duration < 1) {
      message.error('时间太短了~');
      return;
    }
    // mediaRecorderRef.current.stop();
    const reader = new FileReader();
    reader.onloadend = () => {
      // FileReader完成读取后，result属性包含了一个data: URL，它是一个Base64编码的字符串
      const base64AudioMessage = reader?.result?.split(',')[1]; // 获取Base64编码字符串

      uploadAudio(base64AudioMessage);
    };

    // // 读取Blob对象为DataURL
    reader.readAsDataURL(audioBlob);
    
    // mediaRecorderRef.current.onstop = () => {
    //   const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
    //   // const audioUrl = URL.createObjectURL(audioBlob);
    //   const reader = new FileReader();
    //   reader.onloadend = () => {
    //     // FileReader完成读取后，result属性包含了一个data: URL，它是一个Base64编码的字符串
    //     const base64AudioMessage = reader?.result?.split(',')[1]; // 获取Base64编码字符串

    //     // 你可以在这里做任何你想要的事情，比如发送Base64编码的音频数据到服务器
    //     // const audio = new File([audioBlob], 'voice-recording.mp3', { type: 'audio/mpeg', lastModified: Date.now() });
    //     // console.log(audio);
    //     uploadAudio(base64AudioMessage);
    //   };

    //   // 读取Blob对象为DataURL
    //   reader.readAsDataURL(audioBlob);
      
    //   // setAudioFile(audio);

    //   // Reset the chunks for the next recording
    //   audioChunksRef.current = [];
      
    // };
  };

  // 上传音频文件
  const uploadAudio = async (audioFile) => {
    // sendChatCompletions('1', '2');
    const controller = new AbortController()
    // const signal = controller.signal
    setFetchController(controller)
    const response = await services.postAudioTransCompletion({token, voice: audioFile})
    if (response.success && response.text) {
      console.log('File successfully uploaded', response.text);
      sendChatCompletions({
        text: response.text,
        url: response.url
      });
      scrollToBottomIfAtBottom()
    } else {
      setFetchController(null);
      message.error('IR 没听清，请重述一下')
    }
  };
  const chatMessages = useMemo(() => {
    const chatList = chats.filter((c) => c.id === selectChatId)
    if (chatList.length <= 0) {
      return []
    }
    return chatList[0].data
  }, [selectChatId, chats])
  return (
    <div className={styles.chatPage}>
      <Layout
        menuExtraRender={() => <CreateChat />}
        route={{
          path: '/audio',
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
                options={[{label: 'GPT-3.5', value: 'gpt-3.5-turbo'}]}
                onChange={(e) => {
                  setModel(e.toString());
                }}
              />
              <Select
                size="middle"
                style={{ width: '100%' }}
                value={lang}
                options={[{label: '默认', value: '默认'}, {label: '中文', value: '中文'}, {label: '英语', value: '英语'}]}
                onChange={(e) => {
                  setLang(e.toString());
                }}
              />
              <Select
                size="middle"
                style={{ width: '100%' }}
                value={grade}
                options={gradeOptions}
                onChange={(e) => {
                  setGrade(e.toString());
                }}
              />
             <Row>
              <Col span={14}>
                <Slider
                  min={1}
                  max={100}
                  onChange={(v) => setSpeed(Number(v))}
                  value={typeof speed === 'number' ? speed : 100}
                />
              </Col>
              <Col span={2}>
                <InputNumber
                  min={1}
                  max={100}
                  style={{ margin: '0 16px' }}
                  value={speed}
                  onChange={(v) => setSpeed(Number(v))}
                />
              </Col>
             </Row>
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
              {chatMessages.map((item, idx) => {
                return (
                  <ChatMessage
                    key={item.dateTime + item.role + item.text}
                    position={item.role === 'user' ? 'right' : 'left'}
                    status={item.status}
                    content={item.message}
                    time={item.dateTime}
                    item={item}
                    model={item.requestOptions.options?.model}
                    onDelChatMessage={() => {
                      delChatMessage(selectChatId, item.id)
                    }}
                    onRefurbishChatMessage={() => {
                      console.log(item)
                      sendChatCompletions(item.requestOptions, {...item, id: ''})
                    }}
                    pluginInfo={item.plugin_info}
                  />
                )
              })}
              {chatMessages.length <= 0 && <Reminder from="audio" />}
              <div style={{ height: 80 }} />
            </div>
          </div>
          <div
            className={styles.chatPage_container_two}
            style={{
              position: isMobile? 'fixed' : 'absolute'
            }}
          >
            <AllInput
              disabled={!!fetchController}
              startRecording={startRecording}
              stopRecording={stopRecording}
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
