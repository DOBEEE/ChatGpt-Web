import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { adminRouter, searchRouteDetail, webRouter } from './index'
import { userStore } from '@/store'

type AuthRouterProps = {
  children?: React.ReactNode
}
const authRoute = {
  1: 'all',
  2: [
    '/math'
  ],
}
/**
 * 权限校验
 * 校验登录及权限
 */
function AuthRouter(props: AuthRouterProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const { token, user_info, auth } = userStore()
  const { pathname } = location
  const routerDetail = searchRouteDetail(pathname, [...webRouter, ...adminRouter])
  const title = routerDetail?.configure?.title
  useEffect(() => {
    if (title) {
      document.title = title
    }

    if(token && user_info && location.pathname.includes('/login')){
      navigate('/')
      return 
    }
    if (location.pathname.includes('/math') && auth !== 1 && auth !== 2) {
      navigate('/')
      return 
    }
    if (!location.pathname.includes('/math') && auth == 2) {
      navigate('/math')
      return 
    }
    const userRole = user_info?.role || 'user'
    if (routerDetail?.configure?.verifToken && !token) {
      navigate('/')
      navigate('/login', {
        state: {
          form: routerDetail?.path
        }
      })
    } else if (token && !routerDetail?.configure?.role.includes(userRole)) {
      navigate('/')
      navigate('/404')
    }
  }, [pathname, routerDetail])

  return <>{props.children}</>
}

export default AuthRouter
