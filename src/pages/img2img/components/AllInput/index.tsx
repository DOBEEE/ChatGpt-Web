import { AutoComplete, Button, Input, Modal, message, Drawer ,Upload, Image , Checkbox} from 'antd'
import styles from './index.module.less'
import { PlusOutlined, CloudDownloadOutlined, SyncOutlined } from '@ant-design/icons'
import { useMemo, useState } from 'react'
import { promptStore } from '@/store'
import useDocumentResize from '@/hooks/useDocumentResize'
import { htmlToImage } from '@/utils'
import promptsImage from '@/assets/prompts-image.json';
import Share from '@/components/Share'
type Props = {
  onSend: (value: string) => void
  disabled?: boolean
  imageUrl: string
  clearMessage?: () => void
  onStopFetch?: () => void
  chatMessages: any;
  shareImgsHandle?: (params: any) => Promise<any>
}

function AllInput(props: Props) {
  const [prompt, setPrompt] = useState('')
  const bodyResize = useDocumentResize()

  const [downloadModal, setDownloadModal] = useState({
    open: false,
    loading: false
  })

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
      {bodyResize.width > 800 && (
        <div
          className={styles.allInput_icon}
          onClick={() => {
            setDownloadModal((d) => ({ ...d, open: true }))
          }}
        >
          <CloudDownloadOutlined />
        </div>
      )}
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
      > */}
        {/* <Input.TextArea
          value={prompt}
          showCount
          maxLength={120}
          size="large"
          placeholder="分享内容"
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
        /> */}
      {/* </AutoComplete> */}
      {props.disabled ? (
        <Button
          className={styles.allInput_button}
          type="primary"
          size="large"
          ghost
          danger
          disabled={!props.disabled}
          onClick={() => {
            props.onStopFetch?.()
          }}
        >
          <SyncOutlined spin /> 停止回答 🤚
        </Button>
      ) : (
        <Button
          className={styles.allInput_button}
          type="primary"
          size="large"
          disabled={!props.imageUrl || props.disabled}
          onClick={() => {
            props?.onSend?.(prompt)
            setPrompt('')
          }}
        >
          变身
        </Button>
      )}
      <Share chatMessages={props.chatMessages} />
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
