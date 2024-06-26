import { chatStore, configStore, imageStore,img2Store, audioStore } from '@/store'
import { configAsync } from '@/store/async'
import { useEffect, useLayoutEffect } from 'react'
import LoginModal from '../LoginModal'
import ConfigModal from '../ConfigModal'
import { userStore } from '@/store'
import { notification } from 'antd'
import React from 'react'

type Props = {
  children: React.ReactElement
}

function Global(props: Props) {
  const { models, config, configModal, changeConfig, setConfigModal, notifications } = configStore()
  const { chats, addChat, changeSelectChatId } = chatStore()
  const { chats: audioChats, addChat: addAudioChat, changeSelectChatId: changeAudioSelectChatId } = audioStore()
  const { chats: imgChats, addChat: addImageChat, changeSelectChatId: changeImgSelectChatId } = imageStore()
  const { chats: img2Chats, addChat: addImage2Chat, changeSelectChatId: changeImg2SelectChatId } = img2Store()
  const { token, loginModal, setLoginModal } = userStore()

  const openNotification = ({
    key,
    title,
    content
  }: {
    key: string | number
    title: string
    content: string
  }) => {
    return notification.open({
      key,
      message: title,
      description: (
        <div
          dangerouslySetInnerHTML={{
            __html: content
          }}
        />
      ),
      onClick: () => {
        console.log('Notification Clicked!')
      }
    })
  }

  function delay(ms: number) {
	return new Promise(resolve => setTimeout(resolve, ms));
  }

  async function onOpenNotifications() {
    for (const item of notifications) {
      await openNotification({
        key: item.id,
        title: item.title,
        content: item.content
      })
	  await delay(500)
    }
  }

  useEffect(() => {
    if (chats.length <= 0) {
      addChat()
    } else {
      const id = chats[0].id
      changeSelectChatId(id)
    }
    if (imgChats.length <= 0) {
      addImageChat()
    } else {
      changeImgSelectChatId(imgChats[0].id)
    }
    if (img2Chats.length <= 0) {
      addImage2Chat()
    } else {
      changeImg2SelectChatId(img2Chats[0].id)
    }
    if (audioChats.length <= 0) {
      addAudioChat()
    } else {
      changeAudioSelectChatId(audioChats[0].id)
    }
	// configAsync.fetchConfig()
  }, [])

  useLayoutEffect(()=>{
	onOpenNotifications();
  },[notification])

  return (
    <>
      {props.children}
      <LoginModal
        open={loginModal}
        onCancel={() => {
          setLoginModal(false)
        }}
      />
      <ConfigModal
        open={configModal}
        onCancel={() => {
          setConfigModal(false)
        }}
        models={models}
        onChange={changeConfig}
        data={config}
      />
    </>
  )
}
export default Global
