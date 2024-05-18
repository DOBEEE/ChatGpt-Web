import menuList from '@/routers/menu_list'
import styles from './index.module.less'
import { joinTrim } from '@/utils'
import { Dropdown, Space } from 'antd';
import { Link, useLocation } from 'react-router-dom'
import { useMemo } from 'react'
import { DownOutlined, SmileOutlined } from '@ant-design/icons';
import { chatStore, userStore } from '@/store'
type Props = {
  mode?: 'vertical' | 'horizontal' | 'inline'
}

function MenuList(props: Props) {
  const location = useLocation()
const { auth } = userStore();
  const pathname = useMemo(() => {
    return location.pathname
  }, [location])
  console.log(3333, auth)
  const { mode = 'horizontal' } = props
  if (mode === 'horizontal') {
    return (
      <div className={joinTrim([styles.menuList, styles['menuList_' + mode]])}>
        {menuList.web.slice(0, 5).map((item) => {
          const isExternal = /^(http:\/\/|https:\/\/)/.test(item.path)
          let path = item.path;
          if (item.name === '网页中心') {
            path = item.path + encodeURIComponent(`${userStore.getState().username}`);
          }
          if (item.name === '小灯学长' && auth !== 1) {
            return;
          }
          return (
            <Link key={path} to={path} target={isExternal ? '_blank' : '_self'}>
              <div
                className={joinTrim([styles.item, pathname === item.path ? styles.select_item : ''])}
              >
                <span className={styles.item_icon}>{item.icon}</span>
                <div className={styles.item_text}>
                  <p className={styles.item_title}>{item.name}</p>
                  {mode !== 'horizontal' && (
                    <span className={styles.item_message}>{item.message}</span>
                  )}
                </div>
              </div>
            </Link>
          )
        })}
        <Dropdown menu={{ items: menuList.web.slice(5).map((item, idx) => {
          const isExternal = /^(http:\/\/|https:\/\/)/.test(item.path)
          let path = item.path;
          if (item.name === '网页中心') {
            path = item.path + encodeURIComponent(`${userStore.getState().username}`);
          }
          return {
            key: idx,
            label: (
              <Link key={path} to={path} target={isExternal ? '_blank' : '_self'}>
                <div
                  className={joinTrim([styles.item, pathname === item.path ? styles.select_item : ''])}
                  style={{display: 'flex',flexDirection: 'row', whiteSpace:'nowrap'}}
                >
                  <span style={{marginRight: 10}} className={styles.item_icon}>{item.icon}</span>
                  <div className={styles.item_text}>
                    <p className={styles.item_title}>{item.name}</p>
                    {mode !== 'horizontal' && (
                      <span className={styles.item_message}>{item.message}</span>
                    )}
                  </div>
                </div>
              </Link>
            ),
          }
          
        }) }}
        >
          <div style={{color: '#999', marginLeft: 6}} onClick={(e) => e.preventDefault()}>
            <Space>
              更多工具
              <DownOutlined />
            </Space>
          </div>
        </Dropdown>
      </div>
    )
  }
  return (
    <div className={joinTrim([styles.menuList, styles['menuList_' + mode]])}>
      {menuList.web.map((item) => {
        const isExternal = /^(http:\/\/|https:\/\/)/.test(item.path)
        let path = item.path;
        if (item.name === '网页中心') {
          path = item.path + encodeURIComponent(`${userStore.getState().username}`);
        }
        return (
          <Link key={path} to={path} target={isExternal ? '_blank' : '_self'}>
            <div
              className={joinTrim([styles.item, pathname === item.path ? styles.select_item : ''])}
            >
              <span className={styles.item_icon}>{item.icon}</span>
              <div className={styles.item_text}>
                <p className={styles.item_title}>{item.name}</p>
                {mode !== 'horizontal' && (
                  <span className={styles.item_message}>{item.message}</span>
                )}
              </div>
            </div>
          </Link>
        )
      })}
    </div>
  )
}

export default MenuList
