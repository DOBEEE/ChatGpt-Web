import { AutoComplete, Button, Input, Modal, message } from 'antd'
import styles from './index.module.less'
import { ClearOutlined, CloudDownloadOutlined, SyncOutlined } from '@ant-design/icons'
import { useMemo, useState } from 'react'
import { promptStore } from '@/store'
import useDocumentResize from '@/hooks/useDocumentResize'
import { htmlToImage } from '@/utils'

type Props = {
  disabled?: boolean
  clearMessage?: () => void
  onStopFetch?: () => void
  stopRecording: () => void
  startRecording: () => void
}

function AllInput(props: Props) {
  const {startRecording, stopRecording} = props;
  const [prompt, setPrompt] = useState('')
  const { localPrompt } = promptStore()

  const bodyResize = useDocumentResize()

  const [downloadModal, setDownloadModal] = useState({
    open: false,
    loading: false
  })

  const searchOptions = useMemo(() => {
    if (prompt.startsWith('/')) {
      return localPrompt
        .filter((item: { key: string }) =>
          item.key.toLowerCase().includes(prompt.substring(1).toLowerCase())
        )
        .map((obj) => {
          return {
            label: obj.key,
            value: obj.value
          }
        })
    } else {
      return []
    }
  }, [prompt])

  // 保存聊天记录到图片
  async function downloadChatRecords() {
    setDownloadModal((d) => ({ ...d, loading: true }))
    htmlToImage('image-wrapper')
      .then(() => {
		message.success('下载聊天记录成功')
        setDownloadModal((d) => ({ ...d, loading: false }))
      })
      .catch(() => {
        message.error('下载聊天记录失败')
      })
  }

  return (
    <div className={styles.allInput}>
      {/* <AutoComplete
        value={prompt}
        options={searchOptions}
        style={{
          width: '100%',
          maxWidth: 800
        }}
        onSelect={(value) => {
          // 这里选择后直接发送
          //   props?.onSend?.(value)
          // 并且将输入框清空
          // 修改为选中放置在输入框内
          setPrompt(value)
        }}
      >
        <Input.TextArea
          value={prompt}
          // showCount
          size="large"
          placeholder="问点什么吧..."
          // (Shift + Enter = 换行)
          autoSize={{
            maxRows: 4
          }}
          onPressEnter={(e) => {
            if (e.key === 'Enter' && e.keyCode === 13 && e.shiftKey) {
              // === 无操作 ===
            } else if (e.key === 'Enter' && e.keyCode === 13 && bodyResize.width > 800) {
              if (!props.disabled) {
                props?.onSend?.(prompt)
                setPrompt('')
              }
              e.preventDefault() //禁止回车的默认换行
            }
          }}
          onChange={(e) => {
            setPrompt(e.target.value)
          }}
        />
      </AutoComplete> */}
      <div style={{width: '100%',padding: '0 20px'}}>
      {props.disabled ? (
        <Button
          className={styles.allInput_button}
          type="primary"
          size="large"
          ghost
          danger
          disabled={!props.disabled}
          style={{width: '100%', height: 40}} 
          onClick={() => {
            props.onStopFetch?.()
          }}
        >
          <SyncOutlined spin /> 停止回答 🤚
        </Button>
      ) : (
        <Button className={styles.audioStartBtn} type="primary" style={{width: '100%', height: 40}} onMouseDown={startRecording} onMouseUp={stopRecording} onTouchEnd={stopRecording} onTouchStart={startRecording}>
          按下说话
        </Button>
      )}
      </div>

      <Modal
        title="保存当前对话记录"
        open={downloadModal.open}
        onOk={() => {
          downloadChatRecords()
        }}
        confirmLoading={downloadModal.loading}
        onCancel={() => {
          setDownloadModal({ open: false, loading: false })
        }}
      >
        <p>是否将当前对话记录保存为图片？</p>
      </Modal>
    </div>
  )
}

export default AllInput
