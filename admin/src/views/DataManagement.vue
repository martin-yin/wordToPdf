<template>
  <div class="data-management-container">
    <!-- 用户信息头部 -->
    <div class="user-header">
      <div class="user-info">
        <a-space>
          <UserOutlined />
          <span>{{ userInfo?.username }}（管理员）</span>
        </a-space>
      </div>
      <a-button type="primary" @click="handleLogout" size="small">
        <LogoutOutlined />
        退出登录
      </a-button>
    </div>

    <div class="management-wrapper">
      <div class="management-card">
        <div class="management-header">
          <h1 class="management-title">提交资料管理</h1>
          <p class="management-subtitle">多维度筛选和管理学员提交的资料</p>
        </div>

        <!-- 筛选条件 -->
        <div class="filter-section">
          <a-card title="筛选条件" class="filter-card">
            <a-form layout="inline" class="filter-form">
              <a-row :gutter="[16, 16]">
                <a-col :span="6">
                  <a-form-item label="省份">
                    <a-select
                      v-model:value="filters.province"
                      placeholder="选择省份"
                      allowClear
                      @change="onProvinceChange"
                    >
                      <a-select-option v-for="province in provinces" :key="province.code" :value="province.code">
                        {{ province.name }}
                      </a-select-option>
                    </a-select>
                  </a-form-item>
                </a-col>
                <a-col :span="6">
                  <a-form-item label="城市">
                    <a-select
                      v-model:value="filters.city"
                      placeholder="选择城市"
                      allowClear
                      @change="onCityChange"
                    >
                      <a-select-option v-for="city in cities" :key="city.code" :value="city.code">
                        {{ city.name }}
                      </a-select-option>
                    </a-select>
                  </a-form-item>
                </a-col>
                <a-col :span="6">
                  <a-form-item label="县区">
                    <a-select
                      v-model:value="filters.county"
                      placeholder="选择县区"
                      allowClear
                    >
                      <a-select-option v-for="county in counties" :key="county.code" :value="county.code">
                        {{ county.name }}
                      </a-select-option>
                    </a-select>
                  </a-form-item>
                </a-col>
                <a-col :span="6">
                  <a-form-item label="手机号">
                    <a-input
                      v-model:value="filters.phone"
                      placeholder="输入手机号"
                      allowClear
                    />
                  </a-form-item>
                </a-col>
              </a-row>
              <a-row :gutter="[16, 16]">
                <a-col :span="6">
                  <a-form-item label="姓名">
                    <a-input
                      v-model:value="filters.name"
                      placeholder="输入姓名"
                      allowClear
                    />
                  </a-form-item>
                </a-col>
                <a-col :span="6">
                  <a-form-item label="学习时长">
                    <a-select
                      v-model:value="filters.learning_time"
                      placeholder="选择学习时长"
                      allowClear
                    >
                      <a-select-option value="1个月">1个月</a-select-option>
                      <a-select-option value="3个月">3个月</a-select-option>
                      <a-select-option value="6个月">6个月</a-select-option>
                      <a-select-option value="1年">1年</a-select-option>
                      <a-select-option value="长期">长期</a-select-option>
                    </a-select>
                  </a-form-item>
                </a-col>
                <a-col :span="6">
                  <a-form-item label="教学方式">
                    <a-select
                      v-model:value="filters.teaching_method"
                      placeholder="选择教学方式"
                      allowClear
                    >
                      <a-select-option value="一对一">一对一</a-select-option>
                      <a-select-option value="小班课">小班课</a-select-option>
                      <a-select-option value="大班课">大班课</a-select-option>
                      <a-select-option value="在线课程">在线课程</a-select-option>
                    </a-select>
                  </a-form-item>
                </a-col>
                <a-col :span="6">
                  <a-form-item label="器材押金">
                    <a-select
                      v-model:value="filters.instrument_deposit"
                      placeholder="选择器材押金"
                      allowClear
                    >
                      <a-select-option value="无需押金">无需押金</a-select-option>
                      <a-select-option value="500元">500元</a-select-option>
                      <a-select-option value="1000元">1000元</a-select-option>
                      <a-select-option value="1500元">1500元</a-select-option>
                      <a-select-option value="2000元">2000元</a-select-option>
                    </a-select>
                  </a-form-item>
                </a-col>
              </a-row>
              <a-row :gutter="[16, 16]">
                <a-col :span="6">
                  <a-form-item label="上课时间">
                    <a-select
                      v-model:value="filters.teaching_time"
                      placeholder="选择上课时间"
                      allowClear
                    >
                      <a-select-option value="工作日上午">工作日上午</a-select-option>
                      <a-select-option value="工作日下午">工作日下午</a-select-option>
                      <a-select-option value="工作日晚上">工作日晚上</a-select-option>
                      <a-select-option value="周末上午">周末上午</a-select-option>
                      <a-select-option value="周末下午">周末下午</a-select-option>
                      <a-select-option value="周末晚上">周末晚上</a-select-option>
                    </a-select>
                  </a-form-item>
                </a-col>
                <a-col :span="18">
                  <a-form-item>
                    <a-space>
                      <a-button type="primary" @click="handleSearch" :loading="loading">
                        <SearchOutlined />
                        搜索
                      </a-button>
                      <a-button @click="handleReset">
                        <ReloadOutlined />
                        重置
                      </a-button>
                      <a-button type="default" @click="handleExport">
                        <DownloadOutlined />
                        导出数据
                      </a-button>
                    </a-space>
                  </a-form-item>
                </a-col>
              </a-row>
            </a-form>
          </a-card>
        </div>

        <!-- 数据表格 -->
        <div class="table-section">
          <a-card title="学员资料列表" class="table-card">
            <template #extra>
              <a-space>
                <span>共 {{ total }} 条记录</span>
                <a-button type="link" @click="handleRefresh">
                  <ReloadOutlined />
                  刷新
                </a-button>
              </a-space>
            </template>

            <a-table
              :columns="columns"
              :data-source="dataSource"
              :loading="loading"
              :pagination="pagination"
              @change="handleTableChange"
              :scroll="{ x: 1500 }"
              size="middle"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'action'">
                  <a-space>
                    <a-button type="link" size="small" @click="handleView(record)">
                      <EyeOutlined />
                      查看
                    </a-button>
                    <a-button type="link" size="small" @click="handleEdit(record)">
                      <EditOutlined />
                      编辑
                    </a-button>
                    <a-button type="link" size="small" @click="handleGeneratePDF(record)">
                      <DownloadOutlined />
                      生成PDF
                    </a-button>
                    <a-popconfirm
                      title="确定要删除这条记录吗？"
                      @confirm="handleDelete(record)"
                    >
                      <a-button type="link" size="small" danger>
                        <DeleteOutlined />
                        删除
                      </a-button>
                    </a-popconfirm>
                  </a-space>
                </template>
                <template v-else-if="column.key === 'location'">
                  {{ getLocationText(record) }}
                </template>
              </template>
            </a-table>
          </a-card>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import {
  UserOutlined,
  LogoutOutlined,
  SearchOutlined,
  ReloadOutlined,
  DownloadOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined
} from '@ant-design/icons-vue'
import type { TableColumnsType } from 'ant-design-vue'
import pcaData from '@/assets/pca-code.json'

const router = useRouter()
const userInfo = ref<any>(null)
const loading = ref(false)

// 地址数据
const provinces = ref<any[]>([])
const cities = ref<any[]>([])
const counties = ref<any[]>([])

// 筛选条件类型
interface FilterType {
  province?: string
  city?: string
  county?: string
  phone: string
  name: string
  learning_time?: string
  teaching_method?: string
  instrument_deposit?: string
  teaching_time?: string
}

// 筛选条件
const filters = reactive<FilterType>({
  province: undefined,
  city: undefined,
  county: undefined,
  phone: '',
  name: '',
  learning_time: undefined,
  teaching_method: undefined,
  instrument_deposit: undefined,
  teaching_time: undefined
})

// 模拟数据
const mockData = [
  {
    id: 1,
    name: '张三',
    age: 25,
    gender: '男',
    phone: '13800138001',
    location_province: '110000',
    location_city: '110100',
    location_county: '110101',
    hobby: '音乐、绘画',
    current_level: '初级',
    art_subject: '钢琴',
    learning_goal: '考级',
    teaching_method: '一对一',
    teaching_time: '工作日晚上',
    learning_time: '6个月',
    instrument_deposit: '1000元',
    created_at: '2024-01-15 10:30:00'
  },
  {
    id: 2,
    name: '李四',
    age: 30,
    gender: '女',
    phone: '13900139002',
    location_province: '310000',
    location_city: '310100',
    location_county: '310101',
    hobby: '舞蹈、唱歌',
    current_level: '中级',
    art_subject: '声乐',
    learning_goal: '兴趣爱好',
    teaching_method: '小班课',
    teaching_time: '周末下午',
    learning_time: '1年',
    instrument_deposit: '无需押金',
    created_at: '2024-01-16 14:20:00'
  }
]

const dataSource = ref(mockData)
const total = ref(mockData.length)

// 分页配置
const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: total.value,
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: (total: number, range: [number, number]) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`
})

// 表格列配置
const columns: TableColumnsType = [
  {
    title: '姓名',
    dataIndex: 'name',
    key: 'name',
    width: 100,
    fixed: 'left'
  },
  {
    title: '年龄',
    dataIndex: 'age',
    key: 'age',
    width: 80
  },
  {
    title: '性别',
    dataIndex: 'gender',
    key: 'gender',
    width: 80
  },
  {
    title: '手机号',
    dataIndex: 'phone',
    key: 'phone',
    width: 120
  },
  {
    title: '地址',
    key: 'location',
    width: 200
  },
  {
    title: '艺术科目',
    dataIndex: 'art_subject',
    key: 'art_subject',
    width: 100
  },
  {
    title: '当前水平',
    dataIndex: 'current_level',
    key: 'current_level',
    width: 100
  },
  {
    title: '教学方式',
    dataIndex: 'teaching_method',
    key: 'teaching_method',
    width: 100
  },
  {
    title: '上课时间',
    dataIndex: 'teaching_time',
    key: 'teaching_time',
    width: 120
  },
  {
    title: '学习时长',
    dataIndex: 'learning_time',
    key: 'learning_time',
    width: 100
  },
  {
    title: '器材押金',
    dataIndex: 'instrument_deposit',
    key: 'instrument_deposit',
    width: 100
  },
  {
    title: '提交时间',
    dataIndex: 'created_at',
    key: 'created_at',
    width: 150
  },
  {
    title: '操作',
    key: 'action',
    width: 180,
    fixed: 'right'
  }
]

// 初始化
onMounted(() => {
  const storedUserInfo = localStorage.getItem('userInfo')
  if (storedUserInfo) {
    userInfo.value = JSON.parse(storedUserInfo)
  }

  provinces.value = pcaData
})

// 退出登录
const handleLogout = () => {
  localStorage.removeItem('userInfo')
  message.success('退出登录成功！')
  router.push('/login')
}

// 省份变化
const onProvinceChange = () => {
  const selectedProvince = provinces.value.find(p => p.code === filters.province)
  cities.value = selectedProvince ? selectedProvince.children : []
  filters.city = undefined
  filters.county = undefined
  counties.value = []
}

// 城市变化
const onCityChange = () => {
  const selectedCity = cities.value.find(c => c.code === filters.city)
  counties.value = selectedCity ? selectedCity.children : []
  filters.county = undefined
}

// 获取地址文本
const getLocationText = (record: any) => {
  const province = provinces.value.find(p => p.code === record.location_province)
  const city = province?.children?.find((c: any) => c.code === record.location_city)
  const county = city?.children?.find((c: any) => c.code === record.location_county)

  return `${province?.name || ''} ${city?.name || ''} ${county?.name || ''}`
}

// 搜索
const handleSearch = async () => {
  loading.value = true
  try {
    const params = new URLSearchParams()
    params.append('page', '1')
    params.append('pageSize', pagination.pageSize.toString())

    if (filters.name) params.append('name', filters.name)
    if (filters.phone) params.append('phone', filters.phone)
    if (filters.learning_time) params.append('learning_time', filters.learning_time)
    if (filters.teaching_method) params.append('teaching_method', filters.teaching_method)
    if (filters.instrument_deposit) params.append('instrument_deposit', filters.instrument_deposit)
    if (filters.teaching_time) params.append('teaching_time', filters.teaching_time)

    // 构建地址筛选
    if (filters.province || filters.city || filters.county) {
      const provinceName = provinces.value.find(p => p.code === filters.province)?.name || ''
      const cityName = cities.value.find(c => c.code === filters.city)?.name || ''
      const countyName = counties.value.find(c => c.code === filters.county)?.name || ''
      const location = `${provinceName}${cityName}${countyName}`.trim()
      if (location) params.append('location', location)
    }

    const response = await fetch(`http://localhost:3000/api/students?${params}`)
    const result = await response.json()

    if (result.success) {
      dataSource.value = result.data.map((item: any, index: number) => ({
        ...item,
        key: item.id || index
      }))
      pagination.total = result.total
      pagination.current = 1
      message.success('搜索完成')
    } else {
      message.error(result.message || '搜索失败')
    }
  } catch (error) {
    console.error('搜索失败:', error)
    message.error('网络错误，请检查后端服务是否启动')
  } finally {
    loading.value = false
  }
}

// 重置
const handleReset = () => {
  filters.province = undefined
  filters.city = undefined
  filters.county = undefined
  filters.phone = ''
  filters.name = ''
  filters.learning_time = undefined
  filters.teaching_method = undefined
  filters.instrument_deposit = undefined
  filters.teaching_time = undefined

  cities.value = []
  counties.value = []
  message.info('筛选条件已重置')
}

// 导出
const handleExport = () => {
  message.info('导出功能开发中...')
}

// 刷新
const handleRefresh = () => {
  message.success('数据已刷新')
}

// 表格变化
const handleTableChange = (pag: any) => {
  pagination.current = pag.current
  pagination.pageSize = pag.pageSize
}

// 查看详情
const handleView = (record: any) => {
  message.info(`查看 ${record.name} 的详细信息`)
}

// 编辑
const handleEdit = (record: any) => {
  message.info(`编辑 ${record.name} 的信息`)
}

// 删除
const handleDelete = async (record: any) => {
  try {
    const response = await fetch(`http://localhost:3000/api/student/${record.key}`, {
      method: 'DELETE',
    })

    const result = await response.json()

    if (result.success) {
      message.success(`已删除 ${record.name} 的记录`)
      // 重新搜索数据
      handleSearch()
    } else {
      message.error(result.message || '删除失败')
    }
  } catch (error) {
    console.error('删除学员失败:', error)
    message.error('网络错误，请检查后端服务是否启动')
  }
}

// 生成PDF
const handleGeneratePDF = async (record: any) => {
  try {
    message.loading('正在生成PDF，请稍候...', 0)

    const response = await fetch(`http://localhost:3000/api/student/${record.key}/pdf`)

    if (response.ok) {
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${record.name || 'student'}_profile.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      message.destroy()
      message.success(`${record.name} 的PDF已生成并下载`)
    } else {
      const result = await response.json()
      message.destroy()
      message.error(result.message || 'PDF生成失败')
    }
  } catch (error) {
    console.error('生成PDF失败:', error)
    message.destroy()
    message.error('网络错误，请检查后端服务是否启动')
  }
}
</script>

<style scoped>
.data-management-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  padding: 20px;
}

.user-header {
  max-width: 1200px;
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

.management-wrapper {
  max-width: 1200px;
  margin: 0 auto;
}

.management-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  padding: 40px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
}

.management-header {
  text-align: center;
  margin-bottom: 40px;
}

.management-title {
  font-size: 32px;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0 0 12px 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.management-subtitle {
  font-size: 16px;
  color: #666;
  margin: 0;
}

.filter-section {
  margin-bottom: 24px;
}

.filter-card {
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.filter-form .ant-form-item {
  margin-bottom: 16px;
}

.table-section {
  margin-top: 24px;
}

.table-card {
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.table-card .ant-table-wrapper {
  border-radius: 8px;
  overflow: hidden;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .data-management-container {
    padding: 10px;
  }

  .management-card {
    padding: 20px;
  }

  .filter-form .ant-col {
    width: 100% !important;
  }
}
</style>
