<template>
  <div class="submit-container">
    <!-- 用户信息头部 -->
    <div class="user-header">
      <div class="user-info">
        <a-space>
          <UserOutlined />
          <span>{{ userInfo?.username }}（{{ userInfo?.role === 'admin' ? '管理员' : '用户' }}）</span>
        </a-space>
      </div>
      <a-button type="primary" @click="handleLogout" size="small">
        <LogoutOutlined />
        退出登录
      </a-button>
    </div>

    <div class="submit-wrapper">
      <div class="submit-card">
        <div class="submit-header">
          <h1 class="submit-title">学员信息提交</h1>
        </div>

        <a-form
          :model="formState"
          :rules="rules"
          @finish="onFinish"
          @finishFailed="onFinishFailed"
          layout="vertical"
          class="submit-form"
        >
          <a-row :gutter="16">
            <a-col :span="12">
              <a-form-item
                label="姓名"
                name="name"
                class="form-item"
              >
                <a-input
                  v-model:value="formState.name"
                  placeholder="请输入姓名"
                  size="large"
                  class="input-field"
                >
                  <template #prefix>
                    <UserOutlined class="input-icon" />
                  </template>
                </a-input>
              </a-form-item>
            </a-col>

            <a-col :span="12">
              <a-form-item
                label="年龄"
                name="age"
                class="form-item"
              >
                <a-input-number
                  v-model:value="formState.age"
                  placeholder="请输入年龄"
                  size="large"
                  class="input-field"
                  :min="1"
                  :max="100"
                  style="width: 100%"
                />
              </a-form-item>
            </a-col>
          </a-row>

          <a-row :gutter="16">
            <a-col :span="12">
              <a-form-item
                label="性别"
                name="gender"
                class="form-item"
              >
                <a-select
                  v-model:value="formState.gender"
                  placeholder="请选择性别"
                  size="large"
                  class="input-field"
                >
                  <a-select-option value="男">男</a-select-option>
                  <a-select-option value="女">女</a-select-option>
                </a-select>
              </a-form-item>
            </a-col>

            <a-col :span="12">
              <a-form-item
                label="手机号"
                name="phone"
                class="form-item"
              >
                <a-input
                  v-model:value="formState.phone"
                  placeholder="请输入手机号"
                  size="large"
                  class="input-field"
                  :status="phoneStatus"
                >
                  <template #suffix>
                    <LoadingOutlined v-if="phoneChecking" class="input-icon" />
                    <CheckCircleOutlined v-else-if="phoneStatus === 'success'" class="input-icon success-icon" />
                    <ExclamationCircleOutlined v-else-if="phoneStatus === 'error'" class="input-icon error-icon" />
                  </template>
                </a-input>
              </a-form-item>
            </a-col>
          </a-row>

          <a-row :gutter="16">
            <a-col :span="8">
              <a-form-item
                label="省份"
                name="location_province"
                class="form-item"
              >
                <a-select
                  v-model:value="formState.location_province"
                  placeholder="请选择省份"
                  size="large"
                  class="input-field"
                >
                  <a-select-option v-for="province in provinces" :key="province.code" :value="province.code">
                    {{ province.name }}
                  </a-select-option>
                </a-select>
              </a-form-item>
            </a-col>

            <a-col :span="8">
              <a-form-item
                label="城市"
                name="location_city"
                class="form-item"
              >
                <a-select
                  v-model:value="formState.location_city"
                  placeholder="请选择城市"
                  size="large"
                  class="input-field"
                >
                  <a-select-option v-for="city in cities" :key="city.code" :value="city.code">
                    {{ city.name }}
                  </a-select-option>
                </a-select>
              </a-form-item>
            </a-col>

            <a-col :span="8">
              <a-form-item
                label="区县"
                name="location_county"
                class="form-item"
              >
                <a-select
                  v-model:value="formState.location_county"
                  placeholder="请选择区县"
                  size="large"
                  class="input-field"
                >
                  <a-select-option v-for="county in counties" :key="county.code" :value="county.code">
                    {{ county.name }}
                  </a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
          </a-row>

          <a-form-item
            label="兴趣爱好"
            name="hobby"
            class="form-item"
          >
            <a-textarea
              v-model:value="formState.hobby"
              placeholder="请输入兴趣爱好，多个爱好用逗号分隔"
              :rows="3"
              size="large"
              class="input-field"
            />
          </a-form-item>

          <a-row :gutter="16">
            <a-col :span="12">
              <a-form-item
                label="当前水平"
                name="current_level"
                class="form-item"
              >
                <a-select
                  v-model:value="formState.current_level"
                  placeholder="请选择当前水平"
                  size="large"
                  class="input-field"
                >
                  <a-select-option value="初级">初级</a-select-option>
                  <a-select-option value="中级">中级</a-select-option>
                  <a-select-option value="高级">高级</a-select-option>
                </a-select>
              </a-form-item>
            </a-col>

            <a-col :span="12">
              <a-form-item
                label="艺术科目"
                name="art_subject"
                class="form-item"
              >
                <a-input
                  v-model:value="formState.art_subject"
                  placeholder="请输入艺术科目"
                  size="large"
                  class="input-field"
                >
                </a-input>
              </a-form-item>
            </a-col>
          </a-row>

          <a-form-item
            label="学习目标"
            name="learning_goal"
            class="form-item"
          >
            <a-textarea
              v-model:value="formState.learning_goal"
              placeholder="请描述您的学习目标"
              :rows="3"
              size="large"
              class="input-field"
            />
          </a-form-item>

          <a-row :gutter="16">
            <a-col :span="12">
              <a-form-item
                label="教学方式"
                name="teaching_method"
                class="form-item"
              >
                <a-select
                  v-model:value="formState.teaching_method"
                  placeholder="请选择教学方式"
                  size="large"
                  class="input-field"
                >
                  <a-select-option value="一对一">一对一</a-select-option>
                  <a-select-option value="一对多">一对多</a-select-option>
                </a-select>
              </a-form-item>
            </a-col>

            <a-col :span="12">
              <a-form-item
                label="上课时间"
                name="teaching_time"
                class="form-item"
              >
                <a-select
                  v-model:value="formState.teaching_time"
                  placeholder="请选择上课时间"
                  size="large"
                  class="input-field"
                >
                  <a-select-option value="线下课">线下课</a-select-option>
                  <a-select-option value="线上课">线上课</a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
          </a-row>

          <a-row :gutter="16">
            <a-col :span="12">
              <a-form-item
                label="学习时长"
                name="learning_time"
                class="form-item"
              >
                <a-select
                  v-model:value="formState.learning_time"
                  placeholder="请选择学习时长"
                  size="large"
                  class="input-field"
                >
                  <a-select-option value="50课时(1.5年)">50课时(1.5年)</a-select-option>
                  <a-select-option value="100课时(3年)">100课时(3年)</a-select-option>
                  <a-select-option value="200课时(5年)">200课时(5年)</a-select-option>
                </a-select>
              </a-form-item>
            </a-col>

            <a-col :span="12">
              <a-form-item
                label="器材押金"
                name="instrument_deposit"
                class="form-item"
              >
                <a-select
                  v-model:value="formState.instrument_deposit"
                  placeholder="请选择是否需要押金"
                  size="large"
                  class="input-field"
                >
                  <a-select-option value="需要押金">需要押金</a-select-option>
                  <a-select-option value="无需押金">无需押金</a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
          </a-row>

          <a-form-item class="form-item submit-item">
            <a-space size="large">
              <a-button
                type="primary"
                html-type="submit"
                size="large"
                :loading="loading"
                class="submit-button"
              >
                提交信息
              </a-button>
              <a-button
                size="large"
                @click="resetForm"
                class="reset-button"
              >
                重置表单
              </a-button>
            </a-space>
          </a-form-item>
        </a-form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, watch, onMounted } from 'vue'
import {
  UserOutlined,
  PhoneOutlined,
  BookOutlined,
  LoadingOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  LogoutOutlined
} from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import type { FormInstance } from 'ant-design-vue'
import { useRouter } from 'vue-router'
import pcaData from '@/assets/pca-code.json'

const router = useRouter()
const userInfo = ref<any>(null)
const loading = ref(false)
const phoneChecking = ref(false)
const phoneStatus = ref<'success' | 'error' | ''>('')

// 模拟已存在的手机号数据库
const existingPhones = [
  '13800138000',
  '13900139000',
  '15800158000',
  '18600186000'
]

// 地址数据
const provinces = ref<any[]>([])
const cities = ref<any[]>([])
const counties = ref<any[]>([])

interface FormState {
  name: string
  age: number | null
  gender: string
  phone: string
  location_province: string
  location_city: string
  location_county: string
  hobby: string
  current_level: string
  art_subject: string
  learning_goal: string
  teaching_method: string
  teaching_time: string
  learning_time: string
  instrument_deposit: string
}

const formState = reactive<FormState>({
  name: '',
  age: null,
  gender: '男',
  phone: '',
  location_province: '11',
  location_city: '1101',
  location_county: '110101',
  hobby: '',
  current_level: '',
  art_subject: '',
  learning_goal: '',
  teaching_method: '一对一',
  teaching_time: '线下课',
  learning_time: '50课时(1.5年)',
  instrument_deposit: '需要押金',
})

// 初始化地址数据和用户信息
onMounted(() => {
  // 获取用户信息
  const storedUserInfo = localStorage.getItem('userInfo')
  if (storedUserInfo) {
    userInfo.value = JSON.parse(storedUserInfo)
  }

  // 初始化地址数据
  provinces.value = pcaData
  updateCities()
  updateCounties()
})

// 退出登录
const handleLogout = () => {
  localStorage.removeItem('userInfo')
  message.success('退出登录成功！')
  router.push('/login')
}

// 更新城市列表
const updateCities = () => {
  const selectedProvince = provinces.value.find(p => p.code === formState.location_province)
  cities.value = selectedProvince ? selectedProvince.children : []
  if (cities.value.length > 0 && !cities.value.find(c => c.code === formState.location_city)) {
    formState.location_city = cities.value[0].code
  }
}

// 更新县区列表
const updateCounties = () => {
  const selectedCity = cities.value.find(c => c.code === formState.location_city)
  counties.value = selectedCity ? selectedCity.children : []
  if (counties.value.length > 0 && !counties.value.find(c => c.code === formState.location_county)) {
    formState.location_county = counties.value[0].code
  }
}

// 监听省份变化
watch(() => formState.location_province, () => {
  updateCities()
  updateCounties()
})

// 监听城市变化
watch(() => formState.location_city, () => {
  updateCounties()
})

// 手机号验证函数
const validatePhone = async (phone: string): Promise<boolean> => {
  if (!phone) return false

  // 手机号格式验证
  const phoneRegex = /^1[3-9]\d{9}$/
  if (!phoneRegex.test(phone)) {
    return false
  }

  // 模拟异步检查手机号是否重复
  phoneChecking.value = true
  await new Promise(resolve => setTimeout(resolve, 800))
  phoneChecking.value = false

  return !existingPhones.includes(phone)
}

// 监听手机号变化，实时验证
let phoneValidationTimer: number | null = null
watch(() => formState.phone, async (newPhone) => {
  if (!newPhone) {
    phoneStatus.value = ''
    return
  }

  // 防抖处理
  if (phoneValidationTimer) {
    clearTimeout(phoneValidationTimer)
  }

  phoneValidationTimer = setTimeout(async () => {
     const isValid = await validatePhone(newPhone)
     if (newPhone === formState.phone) { // 确保还是当前输入的手机号
       phoneStatus.value = isValid ? 'success' : 'error'
     }
   }, 500)
})

const rules = {
  name: [
    { required: true, message: '请输入姓名!', trigger: 'blur' },
    { min: 2, max: 20, message: '姓名长度应在2-20个字符之间!', trigger: 'blur' },
    { pattern: /^[\u4e00-\u9fa5]+$/, message: '姓名必须是中文字符!', trigger: 'blur' },
  ],
  age: [
    { required: true, message: '请输入年龄!', trigger: 'blur' },
    { type: 'number', min: 1, max: 100, message: '年龄必须是数字且不超过100!', trigger: 'blur' },
  ],
  gender: [
    { required: true, message: '请选择性别!', trigger: 'change' },
  ],
  phone: [
    { required: true, message: '请输入手机号!', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号格式!', trigger: 'blur' },
    {
      validator: async (_rule: any, value: string) => {
        if (!value) return Promise.resolve()
        const isValid = await validatePhone(value)
        if (!isValid) {
          return Promise.reject(new Error('该手机号已被注册，请使用其他手机号!'))
        }
        return Promise.resolve()
      },
      trigger: 'blur'
    },
  ],
  hobby: [
    { required: true, message: '请输入兴趣爱好!', trigger: 'blur' },
  ],
  current_level: [
    { required: true, message: '请选择当前水平!', trigger: 'change' },
  ],
  art_subject: [
    { required: true, message: '请输入艺术科目!', trigger: 'blur' },
  ],
  learning_goal: [
    { required: true, message: '请输入学习目标!', trigger: 'blur' },
  ],
  teaching_method: [
    { required: true, message: '请选择教学方式!', trigger: 'change' },
  ],
  teaching_time: [
    { required: true, message: '请选择上课时间!', trigger: 'change' },
  ],
  learning_time: [
    { required: true, message: '请选择学习时长!', trigger: 'change' },
  ],
  instrument_deposit: [
    { required: true, message: '请选择是否需要押金!', trigger: 'change' },
  ],
}

const onFinish = async (values: FormState) => {
  loading.value = true
  try {
    // 获取地址名称
    const provinceName = provinces.value.find(p => p.code === values.location_province)?.name || ''
    const cityName = cities.value.find(c => c.code === values.location_city)?.name || ''
    const countyName = counties.value.find(c => c.code === values.location_county)?.name || ''

    const submitData = {
      ...values,
      location: `${provinceName}${cityName}${countyName}`,
      submitter: userInfo.value?.username || 'unknown'
    }

    const response = await fetch('http://localhost:3000/api/student', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(submitData),
    })

    const result = await response.json()

    if (result.success) {
      message.success('学员信息提交成功！')
      resetForm(false)
    } else {
      message.error(result.message || '提交失败')
    }
  } catch (error) {
    console.error('提交学员信息失败:', error)
    message.error('网络错误，请检查后端服务是否启动')
  } finally {
    loading.value = false
  }
}

const onFinishFailed = (errorInfo: any) => {
  console.log('表单验证失败:', errorInfo)
  message.error('请检查表单信息并完善必填项！')
}

const resetForm = (notice: boolean = true) => {
  Object.assign(formState, {
    name: '',
    age: null,
    gender: '男',
    phone: '',
    location_province: '11',
    location_city: '1101',
    location_county: '110101',
    hobby: '',
    current_level: '',
    art_subject: '',
    learning_goal: '',
    teaching_method: '一对一',
    teaching_time: '线下课',
    learning_time: '50课时(1.5年)',
    instrument_deposit: '需要押金',
  })
  updateCities()
  updateCounties()
  phoneStatus.value = ''
  notice && message.info('表单已重置')
}
</script>

<style scoped>
.submit-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  padding: 20px;
}

.user-header {
  max-width: 1000px;
  margin: 0 auto 20px auto;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 12px;
  padding: 16px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.user-info {
  color: #666;
  font-size: 14px;
}

.submit-wrapper {
  max-width: 1000px;
  margin: 0 auto;
}

.submit-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  padding: 40px;
  box-shadow:
    0 20px 40px rgba(0, 0, 0, 0.1),
    0 0 0 1px rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.submit-header {
  text-align: center;
  margin-bottom: 40px;
}

.submit-title {
  font-size: 32px;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0 0 12px 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.submit-subtitle {
  font-size: 16px;
  color: #666;
  margin: 0;
  font-weight: 400;
}

.submit-form {
  margin-top: 32px;
}

.form-item {
  margin-bottom: 24px;
}

.form-item :deep(.ant-form-item-label) {
  padding-bottom: 8px;
}

.form-item :deep(.ant-form-item-label > label) {
  font-weight: 600;
  color: #333;
  font-size: 14px;
}

.input-icon {
  color: #999;
  font-size: 16px;
}

.success-icon {
  color: #52c41a;
}

.error-icon {
  color: #ff4d4f;
}

.submit-item {
  margin-top: 40px;
  text-align: center;
}

.submit-button {
  height: 48px;
  padding: 0 32px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
  border: none;
  box-shadow: 0 4px 12px rgba(24, 144, 255, 0.3);
  transition: all 0.3s ease;
}

.submit-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(24, 144, 255, 0.4);
}

.reset-button {
  height: 48px;
  padding: 0 32px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  border: 2px solid #d9d9d9;
  transition: all 0.3s ease;
}

.reset-button:hover {
  border-color: #1890ff;
  color: #1890ff;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .submit-container {
    padding: 10px;
  }

  .submit-card {
    padding: 20px;
    border-radius: 16px;
  }

  .submit-title {
    font-size: 24px;
  }

  .submit-subtitle {
    font-size: 14px;
  }

  .form-item {
    margin-bottom: 20px;
  }
}
</style>
