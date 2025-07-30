<template>
  <div class="staff-management-container">
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

        <!-- 操作按钮 -->
        <div class="action-section">
          <a-button type="primary" @click="handleAdd" :icon="h(PlusOutlined)">
            新增人员
          </a-button>
        </div>

        <!-- 数据表格 -->
        <div class="table-section">
          <a-card title="人员列表" class="table-card">
            <template #extra>
              <a-space>
                <span>共 {{ staffList.length }} 条记录</span>
                <a-button type="link" @click="loadStaffList">
                  <ReloadOutlined />
                  刷新
                </a-button>
              </a-space>
            </template>

            <a-table
              :columns="columns"
              :data-source="staffList"
              :loading="loading"
              :pagination="false"
              size="middle"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'role'">
                  <a-tag :color="record.role === 'admin' ? 'red' : 'blue'">
                    {{ record.role === 'admin' ? '管理员' : '机构人员' }}
                  </a-tag>
                </template>
                <template v-if="column.key === 'created_at'">
                  {{ new Date(record.created_at).toLocaleString('zh-CN') }}
                </template>
                <template v-if="column.key === 'action'">
                  <a-space>
                    <a-button type="link" size="small" @click="handleEdit(record)">
                      <EditOutlined />
                      编辑
                    </a-button>
                    <a-popconfirm
                      title="确定要删除这个机构人员吗？"
                      @confirm="handleDelete(record)"
                      ok-text="确定"
                      cancel-text="取消"
                    >
                      <!-- <a-button type="link" size="small" danger :disabled="record.username === 'admin'">
                        <DeleteOutlined />
                        删除
                      </a-button> -->
                    </a-popconfirm>
                  </a-space>
                </template>
              </template>
            </a-table>
          </a-card>
        </div>
      </div>
    </div>

    <!-- 新增/编辑模态框 -->
    <a-modal
      v-model:open="modalVisible"
      :title="isEdit ? '编辑人员' : '新增人员'"
      @ok="handleSubmit"
      @cancel="handleCancel"
      :confirm-loading="submitLoading"
    >
      <a-form
        :model="formData"
        :rules="rules"
        ref="formRef"
        layout="vertical"
      >
        <a-form-item label="用户名" name="username">
          <a-input
            v-model:value="formData.username"
            placeholder="请输入用户名"
            :disabled="isEdit"
          />
        </a-form-item>
        <a-form-item label="密码" name="password">
          <a-input-password
            v-model:value="formData.password"
            :placeholder="isEdit ? '留空则不修改密码' : '请输入密码'"
          />
        </a-form-item>
        <!-- <a-form-item label="角色" name="role">
          <a-select v-model:value="formData.role" placeholder="请选择角色">
            <a-select-option value="admin">管理员</a-select-option>
            <a-select-option value="user">用户</a-select-option>
          </a-select>
        </a-form-item> -->
        <a-form-item label="机构名称" name="institution_name">
          <a-input
            v-model:value="formData.institution_name"
            placeholder="请输入机构名称（管理员默认为空）"
          />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, h } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import {
  UserOutlined,
  LogoutOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined
} from '@ant-design/icons-vue'
import type { FormInstance } from 'ant-design-vue'

interface UserInfo {
  id: number
  username: string
  role: string
}

interface StaffRecord {
  id: number
  username: string
  role: string
  institution_name: string
  created_at: string
}

interface FormData {
  username: string
  password: string
  role: string
}

const router = useRouter()
const userInfo = ref<UserInfo | null>(null)
const loading = ref(false)
const submitLoading = ref(false)
const modalVisible = ref(false)
const isEdit = ref(false)
const formRef = ref<FormInstance>()

// 表格数据
const staffList = ref<StaffRecord[]>([])

// 表格列定义
const columns = [
  { title: '用户名', dataIndex: 'username', key: 'username', width: 150 },
  { title: '角色', dataIndex: 'role', key: 'role', width: 100 },
  { title: '机构名称', dataIndex: 'institution_name', key: 'institution_name', width: 200 },
  { title: '创建时间', dataIndex: 'created_at', key: 'created_at', width: 180 },
  { title: '操作', key: 'action', width: 200, fixed: 'right' as const },
]

// 表单数据
const formData = reactive({
  username: '',
  password: '',
  role: 'user',
  institution_name: ''
})

// 用户名重复检查
const checkUsernameExists = async (username: string): Promise<boolean> => {
  try {
    const response = await fetch(`http://localhost:3000/api/manager/check-username?username=${encodeURIComponent(username)}`)
    const result = await response.json()
    return result.exists
  } catch (error) {
    console.error('检查用户名失败:', error)
    return false
  }
}

// 表单验证规则
const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度为3-20个字符', trigger: 'blur' },
    {
      validator: async (_rule: any, value: string) => {
        if (!value) return Promise.resolve()
        if (isEdit.value && currentRecord && value === currentRecord.username) {
          return Promise.resolve() // 编辑时如果用户名未改变，则不检查
        }
        const exists = await checkUsernameExists(value)
        if (exists) {
          return Promise.reject('用户名已存在，请选择其他用户名')
        }
        return Promise.resolve()
      },
      trigger: 'blur'
    }
  ],
  password: [
    {
      validator: (_rule: any, value: string) => {
        if (!isEdit.value && !value) {
          return Promise.reject('请输入密码')
        }
        if (value && (value.length < 6 || value.length > 20)) {
          return Promise.reject('密码长度为6-20个字符')
        }
        return Promise.resolve()
      },
      trigger: 'blur'
    }
  ],
  role: [
    { required: true, message: '请选择角色', trigger: 'change' }
  ]
}

let currentRecord: StaffRecord | null = null

onMounted(() => {
  const storedUserInfo = localStorage.getItem('userInfo')
  if (storedUserInfo) {
    userInfo.value = JSON.parse(storedUserInfo)
  }
  loadStaffList()
})

// 退出登录
const handleLogout = () => {
  localStorage.removeItem('userInfo')
  message.success('退出登录成功！')
  router.push('/login')
}

// 加载人员列表
const loadStaffList = async () => {
  try {
    loading.value = true
    const response = await fetch('http://localhost:3000/api/manager')
    const result = await response.json()

    if (result.success) {
      staffList.value = result.data
    } else {
      message.error(result.message || '获取人员列表失败')
    }
  } catch (error) {
    console.error('获取人员列表失败:', error)
    message.error('网络错误，请检查后端服务是否启动')
  } finally {
    loading.value = false
  }
}

// 新增人员
const handleAdd = () => {
  isEdit.value = false
  currentRecord = null
  Object.assign(formData, {
    username: '',
    password: '',
    role: 'user',
    institution_name: ''
  })
  modalVisible.value = true
}

// 编辑人员
const handleEdit = (record: StaffRecord) => {
  isEdit.value = true
  currentRecord = record
  Object.assign(formData, {
    username: record.username,
    password: '',
    role: record.role,
    institution_name: record.institution_name || ''
  })
  modalVisible.value = true
}

// 删除人员
const handleDelete = async (record: StaffRecord) => {
  try {
    const response = await fetch(`http://localhost:3000/api/manager/${record.id}`, {
      method: 'DELETE'
    })
    const result = await response.json()

    if (result.success) {
      message.success('删除成功')
      loadStaffList()
    } else {
      message.error(result.message || '删除失败')
    }
  } catch (error) {
    console.error('删除人员失败:', error)
    message.error('网络错误，请检查后端服务是否启动')
  }
}

// 提交表单
const handleSubmit = async () => {
  try {
    await formRef.value?.validate()
    submitLoading.value = true

    const submitData: any = {
      username: formData.username,
      role: formData.role,
      institution_name: formData.institution_name
    }

    // 只有在密码不为空时才提交密码
    if (formData.password) {
      submitData.password = formData.password
    }

    const url = isEdit.value
      ? `http://localhost:3000/api/manager/${currentRecord?.id}`
      : 'http://localhost:3000/api/manager'

    const method = isEdit.value ? 'PUT' : 'POST'

    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(submitData)
    })

    const result = await response.json()

    if (result.success) {
      message.success(isEdit.value ? '修改成功' : '新增成功')
      modalVisible.value = false
      loadStaffList()
    } else {
      message.error(result.message || (isEdit.value ? '修改失败' : '新增失败'))
    }
  } catch (error) {
    console.error('提交失败:', error)
    message.error('网络错误，请检查后端服务是否启动')
  } finally {
    submitLoading.value = false
  }
}

// 取消操作
const handleCancel = () => {
  modalVisible.value = false
  formRef.value?.resetFields()
}
</script>

<style scoped>
.staff-management-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.user-header {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 12px;
  padding: 16px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
}

.user-info {
  color: #666;
  font-size: 14px;
}

.management-wrapper {
  min-width: 1200px;
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

.action-section {
  margin-bottom: 24px;
  text-align: right;
}

.table-section {
  margin-top: 24px;
}

.table-card {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.table-card .ant-table-wrapper {
  border-radius: 8px;
  overflow: hidden;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .staff-management-container {
    padding: 10px;
  }

  .management-card {
    padding: 20px;
  }

  .action-section {
    text-align: left;
  }
}
</style>
