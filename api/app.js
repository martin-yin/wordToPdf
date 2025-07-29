const Koa = require('koa');
const Router = require('koa-better-router');
const { query, testConnection, initDatabase } = require('./config/database');

const app = new Koa();
const api = Router({ prefix: '/api' });

// 解析JSON请求体
app.use(async (ctx, next) => {
  if (ctx.request.type === 'application/json') {
    try {
      const body = await new Promise((resolve, reject) => {
        let data = '';
        ctx.req.on('data', chunk => data += chunk);
        ctx.req.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            resolve({});
          }
        });
        ctx.req.on('error', reject);
      });
      ctx.request.body = body;
    } catch (error) {
      ctx.request.body = {};
    }
  }
  await next();
});

// CORS中间件
app.use(async (ctx, next) => {
  ctx.set('Access-Control-Allow-Origin', '*');
  ctx.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  ctx.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (ctx.method === 'OPTIONS') {
    ctx.status = 200;
    return;
  }
  
  await next();
});

const router = Router().loadMethods();

// 登录接口
router.post('/login', async (ctx, next) => {
  try {
    const { username, password } = ctx.request.body || {};
    
    if (!username || !password) {
      ctx.status = 400;
      ctx.body = { success: false, message: '用户名和密码不能为空' };
      return;
    }
    
    const users = await query(
      'SELECT id, username, role FROM admins WHERE username = ? AND password = ?',
      [username, password]
    );
    
    if (users.length > 0) {
      const user = users[0];
      ctx.body = {
        success: true,
        message: '登录成功',
        data: {
          id: user.id,
          username: user.username,
          role: user.role
        }
      };
    } else {
      ctx.status = 401;
      ctx.body = { success: false, message: '用户名或密码错误' };
    }
  } catch (error) {
    console.error('登录错误:', error);
    ctx.status = 500;
    ctx.body = { success: false, message: '服务器内部错误' };
  }
  
  return next();
});

// 修改密码接口
router.put('/password', async (ctx, next) => {
  try {
    const { username, oldPassword, newPassword } = ctx.request.body || {};
    
    if (!username || !oldPassword || !newPassword) {
      ctx.status = 400;
      ctx.body = { success: false, message: '参数不完整' };
      return;
    }
    
    // 验证原密码
    const users = await query(
      'SELECT id FROM admins WHERE username = ? AND password = ?',
      [username, oldPassword]
    );
    
    if (users.length === 0) {
      ctx.status = 401;
      ctx.body = { success: false, message: '原密码错误' };
      return;
    }
    
    // 更新密码
    await query(
      'UPDATE admins SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE username = ?',
      [newPassword, username]
    );
    
    ctx.body = { success: true, message: '密码修改成功' };
  } catch (error) {
    console.error('修改密码错误:', error);
    ctx.status = 500;
    ctx.body = { success: false, message: '服务器内部错误' };
  }
  
  return next();
});

// 提交学员资料接口
router.post('/student', async (ctx, next) => {
  try {
    const studentData = ctx.request.body || {};
    
    const {
      name, age, gender, phone, location_province, location_city, location_county,
      hobby, current_level, art_subject, learning_goal, teaching_method,
      teaching_time, learning_time, instrument_deposit
    } = studentData;
    
    if (!name || !gender || !phone || !current_level || !art_subject || !teaching_method || !teaching_time || !learning_time || !instrument_deposit) {
      ctx.status = 400;
      ctx.body = { success: false, message: '必填字段不能为空' };
      return;
    }
    
    const result = await query(
      `INSERT INTO students (
        name, age, gender, phone, location_province, location_city, location_county,
        hobby, current_level, art_subject, learning_goal, teaching_method,
        teaching_time, learning_time, instrument_deposit
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name, age, gender, phone, location_province, location_city, location_county,
        hobby, current_level, art_subject, learning_goal, teaching_method,
        teaching_time, learning_time, instrument_deposit
      ]
    );
    
    ctx.body = {
      success: true,
      message: '学员资料提交成功',
      data: { id: result.insertId }
    };
  } catch (error) {
    console.error('提交学员资料错误:', error);
    ctx.status = 500;
    ctx.body = { success: false, message: '服务器内部错误' };
  }
  
  return next();
});

// 获取学员列表接口
router.get('/students', async (ctx, next) => {
  try {
    const { page = 1, pageSize = 10, ...filters } = ctx.query;
    
    let sql = 'SELECT * FROM students WHERE 1=1';
    const params = [];
    
    // 添加筛选条件
    if (filters.name) {
      sql += ' AND name LIKE ?';
      params.push(`%${filters.name}%`);
    }
    if (filters.phone) {
      sql += ' AND phone LIKE ?';
      params.push(`%${filters.phone}%`);
    }
    if (filters.province) {
      sql += ' AND location_province = ?';
      params.push(filters.province);
    }
    if (filters.city) {
      sql += ' AND location_city = ?';
      params.push(filters.city);
    }
    if (filters.county) {
      sql += ' AND location_county = ?';
      params.push(filters.county);
    }
    if (filters.learningTime) {
      sql += ' AND learning_time = ?';
      params.push(filters.learningTime);
    }
    if (filters.teachingMethod) {
      sql += ' AND teaching_method = ?';
      params.push(filters.teachingMethod);
    }
    if (filters.instrumentDeposit) {
      sql += ' AND instrument_deposit = ?';
      params.push(filters.instrumentDeposit);
    }
    
    // 获取总数
    const countSql = sql.replace('SELECT *', 'SELECT COUNT(*) as total');
    const countResult = await query(countSql, params);
    const total = countResult[0].total;
    
    // 添加分页
    const limit = parseInt(pageSize) || 10;
    const offset = (parseInt(page) - 1) * limit || 0;
    sql += ` ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`;
    
    const students = await query(sql, params);
    
    ctx.body = {
      success: true,
      data: {
        list: students,
        total,
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      }
    };
  } catch (error) {
    console.error('获取学员列表错误:', error);
    ctx.status = 500;
    ctx.body = { success: false, message: '服务器内部错误' };
  }
  
  return next();
});

// 删除学员接口
// router.delete('/student/:id', async (ctx, next) => {
//   try {
//     const { id } = ctx.params;
    
//     await query('DELETE FROM students WHERE id = ?', [id]);
    
//     ctx.body = { success: true, message: '删除成功' };
//   } catch (error) {
//     console.error('删除学员错误:', error);
//     ctx.status = 500;
//     ctx.body = { success: false, message: '服务器内部错误' };
//   }
  
//   return next();
// });

// 以下接口需要鉴权

// 创建管理人员
router.post('/manager', async (ctx, next) => {
  try {
    const { username, password, role = 'user' } = ctx.request.body || {};
    
    if (!username || !password) {
      ctx.status = 400;
      ctx.body = { success: false, message: '用户名和密码不能为空' };
      return;
    }
    
    const result = await query(
      'INSERT INTO admins (username, password, role) VALUES (?, ?, ?)',
      [username, password, role]
    );
    
    ctx.body = {
      success: true,
      message: '管理人员创建成功',
      data: { id: result.insertId }
    };
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      ctx.status = 400;
      ctx.body = { success: false, message: '用户名已存在' };
    } else {
      console.error('创建管理人员错误:', error);
      ctx.status = 500;
      ctx.body = { success: false, message: '服务器内部错误' };
    }
  }
  
  return next();
});

// 获取管理人员列表
router.get('/manager', async (ctx, next) => {
  try {
    const managers = await query('SELECT id, username, role, created_at FROM admins ORDER BY created_at DESC');
    
    ctx.body = {
      success: true,
      data: managers
    };
  } catch (error) {
    console.error('获取管理人员列表错误:', error);
    ctx.status = 500;
    ctx.body = { success: false, message: '服务器内部错误' };
  }
  
  return next();
});

// 修改管理人员
router.put('/manager/:id', async (ctx, next) => {
  try {
    const { id } = ctx.params;
    const { username, password, role } = ctx.request.body || {};
    
    let sql = 'UPDATE admins SET updated_at = CURRENT_TIMESTAMP';
    const params = [];
    
    if (username) {
      sql += ', username = ?';
      params.push(username);
    }
    if (password) {
      sql += ', password = ?';
      params.push(password);
    }
    if (role) {
      sql += ', role = ?';
      params.push(role);
    }
    
    sql += ' WHERE id = ?';
    params.push(id);
    
    await query(sql, params);
    
    ctx.body = { success: true, message: '管理人员信息更新成功' };
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      ctx.status = 400;
      ctx.body = { success: false, message: '用户名已存在' };
    } else {
      console.error('修改管理人员错误:', error);
      ctx.status = 500;
      ctx.body = { success: false, message: '服务器内部错误' };
    }
  }
  
  return next();
});

// 删除管理人员
router.delete('/manager/:id', async (ctx, next) => {
  try {
    const { id } = ctx.params;
    
    await query('DELETE FROM admins WHERE id = ?', [id]);
    
    ctx.body = { success: true, message: '管理人员删除成功' };
  } catch (error) {
    console.error('删除管理人员错误:', error);
    ctx.status = 500;
    ctx.body = { success: false, message: '服务器内部错误' };
  }
  
  return next();
});

api.extend(router);
app.use(router.middleware());
app.use(api.middleware());

// 启动服务器
async function startServer() {
  try {
    // 测试数据库连接
    const isConnected = await testConnection();
    if (!isConnected) {
      console.error('数据库连接失败，服务器启动中止');
      process.exit(1);
    }
    
    // 初始化数据库
    await initDatabase();
    
    // 启动服务器
    app.listen(3000, () => {
      console.log('服务器启动成功，端口: 3000');
      console.log('API地址: http://localhost:3000/api');
    });
  } catch (error) {
    console.error('服务器启动失败:', error);
    process.exit(1);
  }
}

startServer();