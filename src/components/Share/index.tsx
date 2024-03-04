import React, { useState } from 'react'
import { AutoComplete, Button, Input, Modal, message, Drawer, Upload, Image, Checkbox } from 'antd'
import styles from './index.module.less'
import { PlusOutlined, CloudDownloadOutlined, SyncOutlined } from '@ant-design/icons'
import { img2Store, configStore, userStore } from '@/store'
import * as services from '@/request/api'
export default (props) => {
  const { token } = userStore()
  const [open, setOpen] = useState(false)
  const [open2, setOpen2] = useState(false)
  const [shareText, setShareText] = useState('')
  const [fileList, setFileList] = useState([])
  const [cacheFileList, setCacheFileList] = useState([])
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewImage, setPreviewImage] = useState('')
  const [previewTitle, setPreviewTitle] = useState('')
  const showSelectImg = (e) => {
    e.stopPropagation();
    setOpen2(true);
    setCacheFileList(fileList);
  }
  const uploadButton = (
    <button
      style={{ border: 0, background: 'none', height: '100%', width: '100%' }}
      onClick={showSelectImg}
      type="button"
    >
      <PlusOutlined style={{ fontSize: 24 }} />
      {/* <div style={{ marginTop: 8 }}></div> */}
    </button>
  )
  const handlePreview = async (file) => {
    setPreviewImage(file.url || (file.preview as string))
    setPreviewOpen(true)
    setPreviewTitle(file.name || file.url!.substring(file.url!.lastIndexOf('/') + 1))
  }
  const handleCancel = () => setPreviewOpen(false)
  const handleChange = ({ fileList }) => setFileList(fileList)
  const checkboxHandle = (item) => {
    setCacheFileList((i) => {
      const idx = i.findIndex((ii) => ii.url === item.text)
      console.log(1111, idx, item)
      if (idx === -1) {
        console.log(1111, [...i, item])
        return [
          ...i,
          {
            url: item.text
          }
        ]
      }
      const res = [...i]
      res.splice(idx, 1)
      console.log(111221, idx, res)
      return res
    })
  }
  return (
    <>
      <Button
        className={styles.allInput_button}
        type="dashed"
        size="large"
        onClick={() => {
          setOpen(true)
        }}
      >
        分享
      </Button>
      <Drawer
        size="large"
        footer={(
          <div>
            <Button
              style={{ marginRight: 10 }}
              type="primary"
              size="middle"
              onClick={async () => {
                // ...fenxiang
                if (!shareText || !fileList || fileList.length === 0) {
                  message.error('不能有空值')
                  return
                }
                await services.shareImgs({
                  token,
                  brief: shareText,
                  content: fileList.map((i) => i.url),
                  type: 0
                })
                setFileList([])
                setCacheFileList([])
                setOpen(false)
                setShareText('')
                message.success('分享作品成功！可以去IUShow小程序查看并分享啦！')
              }}
            >
              确定
            </Button>
            <Button
              type="default"
              size="middle"
              onClick={() => {
                setFileList([])
                setCacheFileList([])
                setOpen(false)
                setShareText('')
              }}
            >
              取消
            </Button>
          </div>
        )}
        title="分享到IUShow，和小伙伴们一起欣赏！"
        onClose={() => setOpen(false)}
        open={open}
      >
        <Input.TextArea
          value={shareText}
          style={{ marginBottom: 20 }}
          placeholder="分享文案"
          rows={4}
          onChange={(e) => setShareText(e.target.value)}
        />
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
      <Drawer
        title="选择图片"
        size="large"
        footer={(
          <div>
            <Button
              style={{ marginRight: 10 }}
              type="primary"
              size="middle"
              onClick={() => {
                setFileList(cacheFileList)
                setCacheFileList([])
                setOpen2(false)
              }}
            >
              确定
            </Button>
            <Button
              type="default"
              size="middle"
              onClick={() => {
                setCacheFileList([])
                setOpen2(false)
              }}
            >
              取消
            </Button>
          </div>
        )}
        onClose={() => setOpen2(false)}
        open={open2}
      >
        <Image.PreviewGroup
          preview={{
            onChange: (current, prev) =>
              console.log(`current index: ${current}, prev index: ${prev}`)
          }}
        >
          <div className={styles.imgs_wrapper}>
            {props?.chatMessages
              ?.filter((i) => i.role !== 'user' && i.status !== 'error')
              .map((i) => (
                <div
                  key={i.text}
                  onClick={() => checkboxHandle(i)}
                  style={{ position: 'relative', width: 'fit-content' }}
                >
                  <Image width={200} src={i.text} preview={false} />
                  <Checkbox
                    style={{ position: 'absolute', right: 10, top: 10 }}
                    checked={!!cacheFileList.find((ii) => ii.url == i.text)}
                  />
                </div>
              ))}
          </div>
        </Image.PreviewGroup>
      </Drawer>
    </>
  )
}
