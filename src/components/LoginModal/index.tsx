import { getCode } from '@/request/api'
import { userAsync } from '@/store/async'
import { RequestLoginParams } from '@/types'
import {
  HeartFilled,
  LockOutlined,
  UserOutlined,
  RedditCircleFilled,
  SlackCircleFilled,
  TwitterCircleFilled
} from '@ant-design/icons'
import { LoginForm, ProFormCaptcha, ProFormText } from '@ant-design/pro-form'
import { Button, Form, FormInstance, Modal, Space, Tabs } from 'antd'
import { useState } from 'react'
import { useNavigation, useLocation } from 'react-router-dom'

type Props = {
  open: boolean
  onCancel: () => void
}

type LoginType = 'code' | 'password' | 'register' | string;

export function LoginCard(props: {
  form: FormInstance<RequestLoginParams>
  onSuccess: () => void,
  type?: LoginType
}) {

  const location = useLocation();

  function getQueryParam(key: string) {
    const queryString = location.search || window.location.search;
    const urlParams = new URLSearchParams(queryString);
    return urlParams.get(key) || '';
  }

  const { type = 'password' } = props;

  const [loginTabsValue, setLoginTabsValue] = useState<LoginType>('login');
  const [loginType, setLoginType] = useState<LoginType>(type);

  return (
    <LoginForm<RequestLoginParams>
      form={props.form}
      logo="http://irchat.yixinshe.vip/images/static/logo.svg"
      title=""
      subTitle="IR Chat 🚀"
      // actions={(
      //   <div
      //     style={{
      //       textAlign: 'center',
      //       fontSize: 14
      //     }}
      //   >
      //     <p>登录即代表你同意 <a href="https://www.baidu.com/">《平台协议》</a>和<a href="https://www.baidu.com/">《隐私政策》</a> </p>
      //   </div>
      // )}
      contentStyle={{
        width: '100%',
        maxWidth: '340px',
        minWidth: '100px'
      }}
      submitter={{
        searchConfig: {
          submitText: loginType === 'register' ? '注册&登录' : '登录',
        }
      }}
      onFinish={async (e) => {
        return new Promise((resolve, reject) => {
          userAsync
            .fetchLogin({ ...e })
            .then((res) => {
              if (res.code) {
                reject(false)
                return
              }
              props.onSuccess?.()
              resolve(true)
            })
            .catch(() => {
              reject(false)
            })
        })
      }}
    >
      {/* <Tabs
        centered
        activeKey={loginTabsValue}
        onChange={(activeKey) => {
          props.form.resetFields()
          const type = activeKey === 'login' ? 'password' : activeKey
          setLoginType(type)
          setLoginTabsValue(activeKey)
        }}
        items={[
          {
            key: 'login',
            label: '账户登录',
          },
          // {
          //   key: 'register',
          //   label: '注册账户',
          // },
        ]}
      /> */}
      <ProFormText
        fieldProps={{
          size: 'large',
          prefix: <UserOutlined />
        }}
        name="user"
        placeholder="请输入账号"
        rules={[
          {
            required: true,
          }
        ]}
      />
      {
        loginType !== 'password' && (
          <ProFormCaptcha
            fieldProps={{
              size: 'large',
              prefix: <LockOutlined />
            }}
            captchaProps={{
              size: 'large'
            }}
            placeholder="验证码"
            captchaTextRender={(timing, count) => {
              if (timing) {
                return `${count} ${'获取验证码'}`
              }
              return '获取验证码'
            }}
            name="code"
            rules={[
              {
                required: true,
                message: '请输入验证码！'
              }
            ]}
            onGetCaptcha={async () => {
              const account = props.form.getFieldValue('account')
              return new Promise((resolve, reject) =>
                getCode({ source: account })
                  .then(() => resolve())
                  .catch(reject)
              )
            }}
          />
        )
      }
      {
        loginType !== 'code' && (
          <ProFormText.Password
            name="pwd"
            fieldProps={{
              size: 'large',
              prefix: <LockOutlined className={'prefixIcon'} />,
            }}
            placeholder="请输入密码"
            rules={[
              {
                required: true,
                message: '6位及以上字母数字',
                // pattern: /^(?:[a-zA-Z]{6,}|\d{6,}|(?=.*\d)(?=.*[a-zA-Z])[a-zA-Z\d]{6,})$/
              },
            ]}
          />
        )
      }
      <div style={{ textAlign: 'right' }}>
        {
          (loginTabsValue === 'login' && loginType === 'code') && (
            <Button type="link" onClick={() => {
              props.form.resetFields()
              setLoginType('password')
            }}
            >
              密码登录
            </Button>
          )
        }
        {/* {
          (loginTabsValue === 'login' && loginType === 'password') && (
            <Button type="link" onClick={() => {
              props.form.resetFields()
              setLoginType('code')
            }}
            >
              验证码登录
            </Button>
          )
        } */}
      </div>
      <div
        style={{
          marginBlockEnd: 24
        }}
      />
    </LoginForm>
  )
}

// 登录注册弹窗
function LoginModal(props: Props) {
  const [loginForm] = Form.useForm()

  const onCancel = () => {
    props.onCancel()
    loginForm.resetFields()
  }

  return (
    <Modal open={props.open} footer={null} destroyOnClose onCancel={onCancel}>
      <LoginCard form={loginForm} onSuccess={onCancel} />
    </Modal>
  )
}

export default LoginModal
