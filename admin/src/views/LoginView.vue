<template>
  <div class="login-container">
    <div class="login-wrapper">
      <div class="login-card">
        <div class="login-header">
          <h1 class="login-title">公益管理系统</h1>
        </div>

        <a-form
          :model="formState"
          :rules="rules"
          @finish="onFinish"
          @finishFailed="onFinishFailed"
          layout="vertical"
          class="login-form"
        >
          <a-form-item label="用户名" name="username" class="form-item">
            <a-input
              v-model:value="formState.username"
              placeholder="请输入用户名"
              size="large"
              class="input-field"
            >
              <template #prefix>
                <UserOutlined class="input-icon" />
              </template>
            </a-input>
          </a-form-item>

          <a-form-item label="密码" name="password" class="form-item">
            <a-input-password
              v-model:value="formState.password"
              placeholder="请输入密码"
              size="large"
              class="input-field"
            >
              <template #prefix>
                <LockOutlined class="input-icon" />
              </template>
            </a-input-password>
          </a-form-item>

          <a-form-item class="form-item">
            <div class="form-options">
              <a class="forgot-password" href="#" @click="handleForgetPassword">忘记密码？</a>
            </div>
          </a-form-item>

          <a-form-item class="form-item">
            <a-button
              type="primary"
              html-type="submit"
              size="large"
              :loading="loading"
              class="login-button"
              block
            >
              登录
            </a-button>
          </a-form-item>
        </a-form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { UserOutlined, LockOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const loading = ref(false)

interface FormState {
  username: string
  password: string
  remember: boolean
}

const formState = reactive<FormState>({
  username: '',
  password: '',
  remember: false,
})

const rules = {
  username: [
    { required: true, message: '请输入用户名!', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度应在3-20个字符之间!', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码!', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位!', trigger: 'blur' },
  ],
}

const onFinish = async (values: FormState) => {
  loading.value = true

  try {
    await new Promise((resolve) => setTimeout(resolve, 1000))
    console.log('登录信息:', values)

    // 模拟登录验证
    if (values.username === 'admin' && values.password === '123456') {
      message.success('管理员登录成功！')
      localStorage.setItem('userInfo', JSON.stringify({ username: 'admin', role: 'admin' }))
      router.push('/')
    } else if (values.username === 'zhangsan' && values.password === '123456') {
      message.success('用户登录成功！')
      localStorage.setItem('userInfo', JSON.stringify({ username: 'zhangsan', role: 'user' }))
      router.push('/submit')
    } else {
      message.error('用户名或密码错误！')
    }
  } catch (error) {
    message.error('登录失败，请检查用户名和密码！')
  } finally {
    loading.value = false
  }
}

const onFinishFailed = (errorInfo: any) => {
  console.log('表单验证失败:', errorInfo)
  router.push('/')
}

const handleForgetPassword = () => {
  message.info('请联系系统管理员，进行密码重置！')
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  position: relative;
  overflow: hidden;
}

.login-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image:
    radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.3) 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 40% 40%, rgba(120, 119, 198, 0.2) 0%, transparent 50%);
  pointer-events: none;
}

.login-wrapper {
  width: 100%;
  max-width: 400px;
  position: relative;
  z-index: 1;
}

.login-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  padding: 40px;
  box-shadow:
    0 20px 40px rgba(0, 0, 0, 0.1),
    0 0 0 1px rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;
}

/* .login-card:hover {
  transform: translateY(-5px);
  box-shadow:
    0 30px 60px rgba(0, 0, 0, 0.15),
    0 0 0 1px rgba(255, 255, 255, 0.3);
} */

.login-header {
  text-align: center;
  margin-bottom: 32px;
}

.logo {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
  animation: logoFloat 3s ease-in-out infinite;
}

@keyframes logoFloat {
  0%,
  100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-5px);
  }
}

.login-title {
  font-size: 28px;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0 0 8px 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.login-subtitle {
  font-size: 16px;
  color: #666;
  margin: 0;
  font-weight: 400;
}

.login-form {
  margin-bottom: 24px;
}

.form-item {
  margin-bottom: 20px;
}

.form-item :deep(.ant-form-item-label) {
  padding-bottom: 8px;
}

.form-item :deep(.ant-form-item-label > label) {
  font-weight: 600;
  color: #333;
  font-size: 14px;
}

.input-field {
  border-radius: 12px;
  border: 2px solid #e8e8e8;
  transition: all 0.3s ease;
  background: rgba(255, 255, 255, 0.8);
}

.input-field:hover {
  border-color: #1890ff;
  background: rgba(255, 255, 255, 0.95);
}

.input-field:focus,
.input-field:focus-within {
  border-color: #1890ff;
  box-shadow: 0 0 0 3px rgba(24, 144, 255, 0.1);
  background: rgba(255, 255, 255, 1);
}

.input-icon {
  color: #999;
  font-size: 16px;
}

.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.forgot-password {
  color: #1890ff;
  text-decoration: none;
  font-size: 14px;
  transition: color 0.3s ease;
}

.forgot-password:hover {
  color: #40a9ff;
  text-decoration: underline;
}

.login-button {
  height: 48px;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
  border: none;
  box-shadow: 0 4px 12px rgba(24, 144, 255, 0.3);
  transition: all 0.3s ease;
}

/* .login-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(24, 144, 255, 0.4);
  background: linear-gradient(135deg, #40a9ff 0%, #1890ff 100%);
} */

.login-button:active {
  transform: translateY(0);
}

.login-footer {
  text-align: center;
  color: #666;
  font-size: 14px;
}

.login-footer a {
  color: #1890ff;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.3s ease;
}

.login-footer a:hover {
  color: #40a9ff;
  text-decoration: underline;
}

/* 响应式设计 */
@media (max-width: 480px) {
  .login-container {
    padding: 10px;
  }

  .login-card {
    padding: 30px 20px;
    border-radius: 16px;
  }

  .login-title {
    font-size: 24px;
  }

  .login-subtitle {
    font-size: 14px;
  }
}

/* 深色模式适配 */
@media (prefers-color-scheme: dark) {
  .login-card {
    background: rgba(30, 30, 30, 0.95);
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .login-title {
    color: #fff;
  }

  .login-subtitle {
    color: #ccc;
  }

  .form-item :deep(.ant-form-item-label > label) {
    color: #fff;
  }

  .input-field {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.2);
    color: #fff;
  }

  .login-footer {
    color: #ccc;
  }
}
</style>
