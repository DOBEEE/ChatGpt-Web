import React, { useState, useEffect } from 'react'
import { Input, Button, Drawer, Flex, Image, Card } from 'antd'
import { img2Store, configStore, userStore } from '@/store'
import * as services from '@/request/api'
import { formatTime } from '@/utils'
import styles from './index.module.less'
const { Search } = Input
export default function ListBtn({ setChatDataInfo, selectChatId }: any) {
  const [open, setOpen] = useState(false)

  const { token } = userStore()
  const [cache, setCache] = useState([])
  const [list, setList] = useState([])
  useEffect(() => {
    services
      .getClassinfo({
        token
      })
      .then((res) => {
        setCache(res.class || [])
        setList(res.class || [])
      })
  }, [])
  const onSearch = (v) => {
    if (!v) {
      setList(cache)
      return
    }
    // const res = findNestedValue(cache, v);
    // console.log(3335, res)
    // setList(res);
    let _res = []
    let res = []
    cache.forEach((item, idx) => {
      _res.push({ ...item, classes: [] })
      item.classes.forEach((i, idx2) => {
        _res[idx].classes.push({ ...i, tests: [] })
        i.tests.forEach((ii) => {
          if (ii.tid == v) {
            _res[idx].classes[idx2].tests.push({ ...ii })
            res = JSON.parse(JSON.stringify(_res))
            console.log(3335, res)
            setList(res)
          }
        })
      })
    })
  }
  const showDrawer = () => {
    setOpen(true)
  }

  const onClose = () => {
    setOpen(false)
  }
  const clickhandle = (taskid) => {
    if (taskid) {
      setOpen(false)
      services
        .testresult({
          taskid,
          token,
          type: 1
        })
        .then((res) => {
          if (res?.analysis) {
            const t = +new Date;
            setChatDataInfo(selectChatId, taskid + t, {
              // id: userMessageId,
              text: '',
              dateTime: formatTime(),
              status: 'pass',
              role: 'user',
              requestOptions: {
                token,
                chatid: selectChatId,
                // message: vaule,
                // imgtype: type,
                testtext: '',
                // imgsize: size,
                testimg: res.testimg
                // quality: 'hd',
              }
            })
            setTimeout(() => {
              setChatDataInfo(selectChatId, taskid + 1 + t, {
                taskid: taskid,
                text: res?.analysis,
                teachurl: res?.teachurl,
                dateTime: res?.timestamp,
                status: 'pass'
              })
            }, 1000)
          }
        })
    }
  }
  return (
    <>
      <Button
        style={{ marginLeft: 12 }}
        type="primary"
        size="large"
        onClick={() => {
          showDrawer()
          // navigate('/aimathlist');
        }}
      >
        题库
      </Button>
      <Drawer title="题库" width={'70%'} onClose={onClose} open={open}>
        <div className={styles.listBtn}>
          <div style={{ padding: '20px' }}>
            <Search placeholder="请输入要搜索的题目编号" onSearch={onSearch} enterButton />
          </div>

          {list.map((item) => (
            <div key={item.grade} style={{ padding: '20px', fontSize: 22 }}>
              <div>{item.grade}</div>
              {item.classes.map((i, idx) => (
                <div key={idx} style={{ padding: '20px' }}>
                  <Card title={i.name} style={{ width: '100%' }}>
                    <Flex wrap gap="small">
                      {i.tests.map((ii) => (
                        <div
                        className='list-btn'
                          key={ii.xzid}
                          style={{ width: '400px', border: '1px solid #eee', padding: 4, display: 'flex', height: '200px', flexDirection: 'column',justifyContent: 'space-between' }}
                        >
                          <Image
                            style={{ cursor: 'pointer', border: '1px solid #eee', flex: 1 }}
                            key={ii.tid}
                            // height={'100%'}
                            // width={'100%'}
                            preview={true}
                            src={ii.img}
                          />
                          <Button
                            style={{ width: '100%' }}
                            onClick={() => {
                              clickhandle(ii.xzid)
                            }}
                          >
                            解题
                          </Button>
                        </div>
                      ))}
                    </Flex>
                  </Card>
                </div>
              ))}
            </div>
          ))}
        </div>
      </Drawer>
    </>
  )
}
