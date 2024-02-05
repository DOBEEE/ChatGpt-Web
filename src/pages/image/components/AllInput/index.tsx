import { AutoComplete, Button, Input, Modal, message, Drawer ,Upload, Image , Checkbox} from 'antd'
import styles from './index.module.less'
import { PlusOutlined, CloudDownloadOutlined, SyncOutlined } from '@ant-design/icons'
import { useMemo, useState } from 'react'
import { promptStore } from '@/store'
import useDocumentResize from '@/hooks/useDocumentResize'
import { htmlToImage } from '@/utils'
import promptsImage from '@/assets/prompts-image.json';
type Props = {
  onSend: (value: string) => void
  disabled?: boolean
  clearMessage?: () => void
  onStopFetch?: () => void
  chatMessages: any;
  shareImgsHandle?: (params: any) => Promise<any>
}

function AllInput(props: Props) {
  const [prompt, setPrompt] = useState('')
  const { localPrompt } = promptStore()
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  const [previewTitle, setPreviewTitle] = useState('');
  const [open, setOpen] = useState(false);
  const [open2, setOpen2] = useState(false);
  const [shareText, setShareText] = useState('')
  const [fileList, setFileList] = useState([]);
  const [cacheFileList, setCacheFileList] = useState([]);
  const bodyResize = useDocumentResize()

  const [downloadModal, setDownloadModal] = useState({
    open: false,
    loading: false
  })

  const searchOptions = useMemo(() => {
    if (prompt.startsWith('/')) {
      return promptsImage
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
  const showSelectImg = (e) => {
    e.stopPropagation();
    setOpen2(true);
    setCacheFileList(fileList);
  }
  const uploadButton = (
    <button style={{ border: 0, background: 'none', height: '100%',width: '100%' }} onClick={showSelectImg} type="button">
      <PlusOutlined style={{fontSize: 24}} />
      {/* <div style={{ marginTop: 8 }}></div> */}
    </button>
  );
  const handlePreview = async (file) => {

    setPreviewImage(file.url || (file.preview as string));
    setPreviewOpen(true);
    setPreviewTitle(file.name || file.url!.substring(file.url!.lastIndexOf('/') + 1));
  };
  const checkboxHandle = (item) => {
    setCacheFileList((i) => {
      const idx = i.findIndex(ii => ii.url === item.text);
      console.log(1111, idx, item)
      if (idx === -1) {
        console.log(1111, [...i, item])
        return [...i, {
          url: item.text
        }]
      }
      const res = [...i];
      res.splice(idx, 1);
      console.log(111221, idx, res)
      return res;
    })
  }
  const handleCancel = () => setPreviewOpen(false);
  const handleChange = ({ fileList }) =>
    setFileList(fileList);
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
      {/* <div
        className={styles.allInput_icon}
        onClick={() => {
          if (!props.disabled) {
            props?.clearMessage?.()
          } else {
            message.warning('请结束回答后在操作')
          }
        }}
      >
        <ClearOutlined />
      </div> */}
      <AutoComplete
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
        />
      </AutoComplete>
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
          disabled={!prompt || props.disabled}
          onClick={() => {
            props?.onSend?.(prompt)
            setPrompt('')
          }}
        >
          发送
        </Button>
      )}
      <Button
          className={styles.allInput_button}
          type="primary"
          size="large"
          onClick={() => {
            setOpen(true);
          }}
      >
          分享
      </Button>
        <Drawer
          size="large"
          footer={(
            <div>
            <Button
              style={{marginRight: 10}}
              type="primary"
              size="middle"
              onClick={async () => {
                // ...fenxiang
                if (!shareText || !fileList || fileList.length === 0) {
                  message.error('不能有空值');
                  return;
                }
                await props.shareImgsHandle({
                  brief: shareText,
                  content: fileList.map(i => i.url),
                  type: 0
                })
                setFileList([]);
                setCacheFileList([]);
                setOpen(false)
                setShareText('')
                message.success('分享作品成功！可以去IUShow小程序查看并分享啦！');
              }}
            >
              确定
            </Button>
            <Button
              type="default"
              size="middle"
              onClick={() => {
                setFileList([]);
                setCacheFileList([]);
                setOpen(false)
                setShareText('')
              }}
            >
              取消
            </Button>
            </div>
          )}
        title="分享到IUShow，和小伙伴们一起欣赏！" onClose={() => setOpen(false)} open={open}
        >
          <Input.TextArea value={shareText} style={{marginBottom: 20}} rows={4} onChange={(e) => setShareText(e.target.value)} />
          <Upload
            listType="picture-card"
            fileList={fileList}
            onPreview={handlePreview}
            onChange={handleChange}
          >
            {fileList.length >= 8 ? null : uploadButton}
          </Upload>
          <Modal open={previewOpen} title={previewTitle} footer={null} onCancel={handleCancel}>
            <img alt="example" style={{ width: '100%' }} src={previewImage} />
          </Modal>
        </Drawer>
        <Drawer title="选择图片" 
        size="large"
          footer={(
            <div>
            <Button
              style={{marginRight: 10}}
              type="primary"
              size="middle"
              onClick={() => {
                setFileList(cacheFileList);
                setCacheFileList([]);
                setOpen2(false)
              }}
            >
              确定
            </Button>
            <Button
              type="default"
              size="middle"
              onClick={() => {
                setCacheFileList([]);
                setOpen2(false)
              }}
            >
              取消
            </Button>
            </div>
          )}
           onClose={() => setOpen2(false)} open={open2}
        >
        <Image.PreviewGroup
          preview={{
            onChange: (current, prev) => console.log(`current index: ${current}, prev index: ${prev}`),
          }}
        >
          <div className={styles.imgs_wrapper}>
            {
              props?.chatMessages?.filter(i => i.role !== 'user' && i.status !== 'error').map(i => (
                <div key={i.text} onClick={() => checkboxHandle(i)} style={{position: 'relative', width: 'fit-content'}}>
                  <Image
                    width={200}
                    src={i.text}
                    preview={false}
                  />
                  <Checkbox style={{position: 'absolute', right: 10, top: 10}} checked={!!cacheFileList.find(ii => ii.url == i.text)} />
                </div>
              ))
            }
          </div>
          
          
        </Image.PreviewGroup>
        
        </Drawer>
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
