<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import {
  LogoutOutlined,
  UserOutlined,
  LockOutlined,
  FileTextOutlined,
  SettingOutlined,
  DownOutlined,
  ReloadOutlined,
} from '@ant-design/icons-vue'
import {
  provinces,
  getCitiesByProvince,
  getCountiesByCity,
  getNameByCode,
  type Region,
} from '@/utils/regions'

const router = useRouter()
const userInfo = ref<any>(null)

// 筛选条件接口
interface FilterType {
  province?: string
  city?: string
  county?: string
  phone: string
  name: string
  learningTime?: string
  teachingMethod?: string
  instrumentDeposit?: string
}

// 学员数据接口
interface StudentRecord {
  key: string
  name: string
  phone: string
  province: string
  city: string
  county: string
  learningTime: string
  teachingMethod: string
  instrumentDeposit: string
  submitTime: string
}

// 筛选条件
const filters = reactive<FilterType>({
  province: undefined,
  city: undefined,
  county: undefined,
  phone: '',
  name: '',
  learningTime: undefined,
  teachingMethod: undefined,
  instrumentDeposit: undefined,
})

// 地区数据
const cities = ref<Region[]>([])
const counties = ref<Region[]>([])

// 查看模态框相关
const viewModalVisible = ref(false)
const viewRecord = ref<StudentRecord | null>(null)

// 密码修改模态框相关
const passwordModalVisible = ref(false)
const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
})

// 表格数据
const tableData = ref<StudentRecord[]>([])
const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: (total: number) => `共 ${total} 条记录`,
})

// 表格列定义
const columns = [
  { title: '姓名', dataIndex: 'name', key: 'name', width: 100 },
  { title: '手机号', dataIndex: 'phone', key: 'phone', width: 120 },
  { title: '省份', dataIndex: 'province', key: 'province', width: 80 },
  { title: '城市', dataIndex: 'city', key: 'city', width: 80 },
  { title: '区县', dataIndex: 'county', key: 'county', width: 80 },
  { title: '学习时长', dataIndex: 'learningTime', key: 'learningTime', width: 100 },
  { title: '教学方式', dataIndex: 'teachingMethod', key: 'teachingMethod', width: 100 },
  { title: '器材押金', dataIndex: 'instrumentDeposit', key: 'instrumentDeposit', width: 100 },
  { title: '操作', key: 'action', width: 150, fixed: 'right' },
]

onMounted(() => {
  const storedUserInfo = localStorage.getItem('userInfo')
  if (storedUserInfo) {
    userInfo.value = JSON.parse(storedUserInfo)
  }
  loadTableData()
})

const handleLogout = () => {
  localStorage.removeItem('userInfo')
  message.success('退出登录成功！')
  router.push('/login')
}

const handleUserManagement = () => {
  message.info('机构人员管理功能开发中...')
}

const handlePasswordChange = () => {
  passwordModalVisible.value = true
}

// 关闭密码修改模态框
const handlePasswordModalClose = () => {
  passwordModalVisible.value = false
  passwordForm.oldPassword = ''
  passwordForm.newPassword = ''
  passwordForm.confirmPassword = ''
}

// 确认修改密码
const handlePasswordSubmit = async () => {
  if (!passwordForm.oldPassword) {
    message.error('请输入原密码')
    return
  }
  if (!passwordForm.newPassword) {
    message.error('请输入新密码')
    return
  }
  if (passwordForm.newPassword.length < 6) {
    message.error('新密码长度不能少于6位')
    return
  }
  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    message.error('两次输入的密码不一致')
    return
  }

  try {
    const response = await fetch('http://localhost:3000/api/password', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: userInfo.value?.username,
        oldPassword: passwordForm.oldPassword,
        newPassword: passwordForm.newPassword,
      }),
    })

    const result = await response.json()

    if (result.success) {
      message.success('密码修改成功！')
      handlePasswordModalClose()
    } else {
      message.error(result.message || '密码修改失败')
    }
  } catch (error) {
    console.error('修改密码失败:', error)
    message.error('网络错误，请检查后端服务是否启动')
  }
}

const onProvinceChange = (value: string) => {
  filters.city = undefined
  filters.county = undefined
  cities.value = value ? getCitiesByProvince(value) : []
  counties.value = []
}

const onCityChange = (value: string) => {
  filters.county = undefined
  counties.value = value ? getCountiesByCity(value) : []
}

const handleSearch = () => {
  pagination.current = 1
  loadTableData()
}

const handleReset = () => {
  filters.province = undefined
  filters.city = undefined
  filters.county = undefined
  filters.phone = ''
  filters.name = ''
  filters.learningTime = undefined
  filters.teachingMethod = undefined
  filters.instrumentDeposit = undefined
  cities.value = []
  counties.value = []
  loadTableData()
}

const handleExport = () => {
  message.info('导出功能开发中...')
}

const handleRefresh = () => {
  loadTableData()
}

const handleView = (record: StudentRecord) => {
  viewRecord.value = record
  viewModalVisible.value = true
}

// 关闭查看模态框
const handleViewModalClose = () => {
  viewModalVisible.value = false
  viewRecord.value = null
}

// 获取完整地址
const getFullAddress = (provinceCode: string, cityCode: string, countyCode: string) => {
  const provinceName = getNameByCode(provinceCode)
  const cityName = getNameByCode(cityCode)
  const countyName = getNameByCode(countyCode)
  return `${provinceName} ${cityName} ${countyName}`
}

const handleEdit = (record: any) => {
  message.info('编辑功能开发中...')
}

const handleDelete = async (record: any) => {
  try {
    const response = await fetch(`http://localhost:3000/api/student/${record.key}`, {
      method: 'DELETE',
    })

    const result = await response.json()

    if (result.success) {
      message.success('删除成功！')
      loadTableData() // 重新加载数据
    } else {
      message.error(result.message || '删除失败')
    }
  } catch (error) {
    console.error('删除学员失败:', error)
    message.error('网络错误，请检查后端服务是否启动')
  }
}

const loadTableData = async () => {
  try {
    const params = new URLSearchParams({
      page: pagination.current.toString(),
      pageSize: pagination.pageSize.toString(),
      ...(filters.name && { name: filters.name }),
      ...(filters.phone && { phone: filters.phone }),
      ...(filters.province && { province: filters.province }),
      ...(filters.city && { city: filters.city }),
      ...(filters.county && { county: filters.county }),
      ...(filters.learningTime && { learningTime: filters.learningTime }),
      ...(filters.teachingMethod && { teachingMethod: filters.teachingMethod }),
      ...(filters.instrumentDeposit && { instrumentDeposit: filters.instrumentDeposit }),
    })

    const response = await fetch(`http://localhost:3000/api/students?${params}`)
    const result = await response.json()

    if (result.success) {
      tableData.value = result.data.list.map((item: any) => ({
        key: item.id.toString(),
        name: item.name,
        phone: item.phone,
        province: item.location_province,
        city: item.location_city,
        county: item.location_county,
        learningTime: item.learning_time,
        teachingMethod: item.teaching_method,
        instrumentDeposit: item.instrument_deposit,
        submitTime: new Date(item.created_at).toLocaleString('zh-CN'),
      }))
      pagination.total = result.data.total
      pagination.current = result.data.page
      pagination.pageSize = result.data.pageSize
    } else {
      message.error(result.message || '获取数据失败')
    }
  } catch (error) {
    console.error('获取学员数据失败:', error)
    message.error('网络错误，请检查后端服务是否启动')
  }
}
</script>

<template>
  <div class="home-container">
    <!-- 用户信息头部 -->
    <div class="user-header">
      <div class="user-info">
        <span
          >欢迎，{{ userInfo?.username }} ({{
            userInfo?.role === 'admin' ? '管理员' : '用户'
          }})</span
        >
      </div>
      <div class="header-actions">
        <a-dropdown>
          <template #overlay>
            <a-menu>
              <a-menu-item key="1" @click="handleUserManagement">
                <UserOutlined />
                机构人员管理
              </a-menu-item>
              <a-menu-item key="2" @click="handlePasswordChange">
                <LockOutlined />
                管理员密码修改
              </a-menu-item>
            </a-menu>
          </template>
          <a-button>
            <SettingOutlined />
            管理设置
            <DownOutlined />
          </a-button>
        </a-dropdown>
        <a-button type="primary" danger @click="handleLogout" style="margin-left: 12px">
          <template #icon>
            <LogoutOutlined />
          </template>
          退出登录
        </a-button>
      </div>
    </div>

    <!-- 主要内容 -->
    <div class="home-content">
      <div class="filter-section">
        <a-card title="" size="small">
          <a-row :gutter="[16, 16]">
            <a-col :span="6">
              <a-form-item label="手机号">
                <a-input v-model:value="filters.phone" placeholder="请输入手机号" allow-clear />
              </a-form-item>
            </a-col>
            <a-col :span="6">
              <a-form-item label="姓名">
                <a-input v-model:value="filters.name" placeholder="请输入姓名" allow-clear />
              </a-form-item>
            </a-col>
            <a-col :span="6">
              <a-form-item label="教学方式">
                <a-select
                  v-model:value="filters.teachingMethod"
                  placeholder="请选择教学方式"
                  allow-clear
                >
                  <a-select-option value="线上教学">线上教学</a-select-option>
                  <a-select-option value="线下教学">线下教学</a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
            <a-col :span="6">
              <a-form-item label="省份">
                <a-select
                  v-model:value="filters.province"
                  placeholder="请选择省份"
                  allow-clear
                  @change="onProvinceChange"
                >
                  <a-select-option
                    v-for="province in provinces"
                    :key="province.code"
                    :value="province.code"
                  >
                    {{ province.name }}
                  </a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
            <a-col :span="6">
              <a-form-item label="城市">
                <a-select
                  v-model:value="filters.city"
                  placeholder="请选择城市"
                  allow-clear
                  @change="onCityChange"
                >
                  <a-select-option v-for="city in cities" :key="city.code" :value="city.code">
                    {{ city.name }}
                  </a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
            <a-col :span="6">
              <a-form-item label="区县">
                <a-select v-model:value="filters.county" placeholder="请选择区县" allow-clear>
                  <a-select-option
                    v-for="county in counties"
                    :key="county.code"
                    :value="county.code"
                  >
                    {{ county.name }}
                  </a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
          </a-row>
          <a-row>
            <a-col :span="24" style="text-align: right">
              <a-space>
                <a-button @click="handleReset">重置</a-button>
                <a-button type="primary" @click="handleSearch">搜索</a-button>
                <a-button type="default" @click="handleExport">导出数据</a-button>
              </a-space>
            </a-col>
          </a-row>
        </a-card>
      </div>

      <!-- 数据表格 -->
      <div class="table-section">
        <a-card>
          <template #title>
            <div style="display: flex; justify-content: space-between; align-items: center">
              <span>学员资料列表</span>
              <a-button type="primary" size="small" @click="handleRefresh">
                <template #icon>
                  <ReloadOutlined />
                </template>
                刷新
              </a-button>
            </div>
          </template>

          <a-table
            :columns="columns"
            :data-source="tableData"
            :pagination="pagination"
            :scroll="{ x: 1500 }"
            size="small"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'action'">
                <a-space>
                  <a-button type="link" size="small" @click="handleView(record)">查看</a-button>
                  <a-button type="link" size="small" @click="handleEdit(record)">编辑</a-button>
                  <a-popconfirm
                    title="确定要删除这条记录吗？"
                    @confirm="handleDelete(record)"
                    ok-text="确定"
                    cancel-text="取消"
                  >
                    <a-button type="link" size="small" danger>删除</a-button>
                  </a-popconfirm>
                </a-space>
              </template>
            </template>
          </a-table>
        </a-card>
      </div>
    </div>
    <!-- 查看详情模态框 -->
    <a-modal
      v-model:open="viewModalVisible"
      title="学员详细信息"
      width="600px"
      :footer="null"
      @cancel="handleViewModalClose"
    >
      <div v-if="viewRecord" class="view-modal-content">
        <a-descriptions :column="2" bordered>
          <a-descriptions-item label="姓名">{{ viewRecord.name }}</a-descriptions-item>
          <a-descriptions-item label="手机号">{{ viewRecord.phone }}</a-descriptions-item>
          <a-descriptions-item label="完整地址" :span="2">
            {{ getFullAddress(viewRecord.province, viewRecord.city, viewRecord.county) }}
          </a-descriptions-item>
          <a-descriptions-item label="学习时长">{{ viewRecord.learningTime }}</a-descriptions-item>
          <a-descriptions-item label="教学方式">{{
            viewRecord.teachingMethod
          }}</a-descriptions-item>
          <a-descriptions-item label="器材押金">{{
            viewRecord.instrumentDeposit
          }}</a-descriptions-item>
          <a-descriptions-item label="提交时间">{{ viewRecord.submitTime }}</a-descriptions-item>
        </a-descriptions>
      </div>
      <template #footer>
        <a-button @click="handleViewModalClose">关闭</a-button>
      </template>
    </a-modal>

    <!-- 密码修改模态框 -->
    <a-modal
      v-model:open="passwordModalVisible"
      title="管理员密码修改"
      width="400px"
      @cancel="handlePasswordModalClose"
    >
      <div class="password-modal-content">
        <a-form layout="vertical">
          <a-form-item label="原密码" required>
            <a-input-password
              v-model:value="passwordForm.oldPassword"
              placeholder="请输入原密码"
              size="large"
            />
          </a-form-item>
          <a-form-item label="新密码" required>
            <a-input-password
              v-model:value="passwordForm.newPassword"
              placeholder="请输入新密码（至少6位）"
              size="large"
            />
          </a-form-item>
          <a-form-item label="确认新密码" required>
            <a-input-password
              v-model:value="passwordForm.confirmPassword"
              placeholder="请再次输入新密码"
              size="large"
            />
          </a-form-item>
        </a-form>
      </div>
      <template #footer>
        <a-space>
          <a-button @click="handlePasswordModalClose">取消</a-button>
          <a-button type="primary" @click="handlePasswordSubmit">确认修改</a-button>
        </a-space>
      </template>
    </a-modal>
  </div>
</template>

<style scoped>
.home-container {
  min-height: 100vh;
  background: #f0f2f5;
  padding: 20px;
}

.user-header {
  background: white;
  padding: 16px 24px;
  border-radius: 8px;
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.user-info {
  font-size: 16px;
  color: #333;
  font-weight: 500;
}

.header-actions {
  display: flex;
  align-items: center;
}

.home-content {
  background: white;
  padding: 24px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.page-header {
  margin-bottom: 24px;
  text-align: center;
}

.page-title {
  margin: 0 0 8px 0;
  color: #1890ff;
  font-size: 28px;
  font-weight: 600;
}

.page-subtitle {
  margin: 0;
  color: #666;
  font-size: 16px;
}

.filter-section {
  margin-bottom: 20px;
}

.filter-section .ant-form-item {
  margin-bottom: 8px;
}

.filter-section .ant-form-item-label {
  font-weight: 500;
}

.table-section {
  margin-top: 20px;
}

.ant-table-wrapper {
  border-radius: 6px;
  overflow: hidden;
}

.ant-table-thead > tr > th {
  background: #fafafa;
  font-weight: 600;
}

.ant-btn-link {
  padding: 0;
  height: auto;
}

.view-modal-content {
  padding: 16px 0;
}

.view-modal-content .ant-descriptions-item-label {
  font-weight: 600;
  background-color: #fafafa;
}

.password-modal-content {
  padding: 16px 0;
}

.password-modal-content .ant-form-item {
  margin-bottom: 16px;
}

.password-modal-content .ant-form-item-label {
  font-weight: 500;
}
</style>
