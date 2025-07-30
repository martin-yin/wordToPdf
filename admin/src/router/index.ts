import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import { message } from 'ant-design-vue'

// 扩展路由元信息类型
declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean
    roles?: string[]
  }
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
      meta: { requiresAuth: true, roles: ['admin'] }
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue'),
    },
    {
      path: '/submit',
      name: 'submit',
      component: () => import('../views/SubmitView.vue'),
      meta: { requiresAuth: true, roles: ['admin', 'user'] }
    },
    {
      path: '/data-management',
      name: 'data-management',
      component: () => import('../views/DataManagement.vue'),
      meta: { requiresAuth: true, roles: ['admin'] }
    },
    {
      path: '/staff-management',
      name: 'staff-management',
      component: () => import('../views/StaffManagement.vue'),
      meta: { requiresAuth: true, roles: ['admin'] }
    },
  ],
})

// 路由守卫
router.beforeEach((to, from, next) => {
  const userInfo = localStorage.getItem('userInfo')
  const user = userInfo ? JSON.parse(userInfo) : null

  // 如果访问登录页面且已登录，根据角色跳转
  if (to.name === 'login' && user) {
    if (user.role === 'admin') {
      next('/')
    } else if (user.role === 'user') {
      next('/submit')
    } else {
      next()
    }
    return
  }

  // 检查是否需要登录
  if (to.meta.requiresAuth) {
    if (!user) {
      message.warning('请先登录！')
      next('/login')
      return
    }

    // 检查角色权限
    if (to.meta.roles && !to.meta.roles.includes(user.role)) {
      message.error('您没有权限访问该页面！')
      // 根据用户角色跳转到对应页面
      if (user.role === 'admin') {
        next('/')
      } else if (user.role === 'user') {
        next('/submit')
      } else {
        next('/login')
      }
      return
    }
  }

  next()
})

export default router
