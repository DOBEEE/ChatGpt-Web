import React, { useEffect, useState } from 'react'
import * as services from '@/request/api'
import { Button, Image, Radio, Popconfirm, Space, Tabs, Select, message, Upload } from 'antd'
import { img2Store, configStore, userStore } from '@/store'
const url = new URL(location.href)
const searchs = new URLSearchParams(url.search)
const taskid = searchs.get('taskid')
export default function Index() {
  const { token } = userStore()
  const [content, setContent] = useState(null)
  const [teachurl, setTeachurl] = useState('')
  const value = content || ''
  useEffect(() => {
    services
      .testresult({
        taskid,
        token
      })
      .then((res) => {
        if (res?.analysis) {
          setContent(res?.analysis)
          setTeachurl(res.teachurl)
        }
      })
  }, [])
  // const renderMdHtml = mdi.render(value)
  if (!content) {
    return (
      <div style={{textAlign: 'center', marginTop: 100}}>
        <div>正在解析中，请稍后~</div>
        <Button
            style={{width: 200, marginTop: 20}}
          onClick={async () => {
            const response = await services.testresult({
              taskid,
              token
            })
            if (response?.analysis) {
              setContent(response?.analysis)
              setTeachurl(response.teachurl)
            }
          }}
        >
          刷新
        </Button>
      </div>
    )
  }
  setTimeout(() => {
    MathJax.texReset()
    MathJax.typesetClear()
    MathJax.typesetPromise(document.querySelector('.analysis-json')[0])
  }, 500)
  return (
    <div className="analysis-json" style={{display: 'flex',flexDirection: 'column', justifyContent: 'center', alignItems: 'center', marginTop: 100}}>
      {value.analysis_json.map((i, idx) => (
        <div key={'s' + idx}>
          <div style={{ marginBottom: 10, fontSize: 14 }}>{i.content}</div>
          {i.image_list.length > 0 && i.image_list.map((img) => <Image key={img} src={img} />)}
        </div>
      ))}
      <div style={{ display: 'flex', flexDirection: 'row-reverse' }}>
        <Button
          onClick={() => {
            window.open(teachurl)
          }}
        >
          AI 讲解
        </Button>
      </div>
    </div>
  )
}
