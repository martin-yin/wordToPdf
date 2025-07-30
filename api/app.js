const Koa = require('koa');
const Router = require('koa-better-router');
const { query, testConnection, initDatabase } = require('./config/database');
const { log , getFullAddress, generatePDF } = require("./utils/index");

const app = new Koa();
const api = Router({ prefix: '/api' });

// 日志中间件
app.use(async (ctx, next) => {
  const start = Date.now();
  const { method, url, ip } = ctx.request;
  
  log('info', `${method} ${url} - 请求开始`, {
    ip,
    userAgent: ctx.request.headers['user-agent'],
    body: method === 'POST' || method === 'PUT' ? ctx.request.body : undefined
  });
  
  try {
    await next();
    const duration = Date.now() - start;
    log('info', `${method} ${url} - 请求完成`, {
      status: ctx.status,
      duration: `${duration}ms`
    });
  } catch (error) {
    const duration = Date.now() - start;
    log('error', `${method} ${url} - 请求失败`, {
      status: ctx.status || 500,
      duration: `${duration}ms`,
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
});

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
    
    log('info', '用户尝试登录', { username, ip: ctx.request.ip });
    
    if (!username || !password) {
      log('warn', '登录失败：用户名或密码为空', { username, ip: ctx.request.ip });
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
      log('info', '用户登录成功', { 
        userId: user.id, 
        username: user.username, 
        role: user.role, 
        ip: ctx.request.ip 
      });
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
      log('warn', '登录失败：用户名或密码错误', { username, ip: ctx.request.ip });
      ctx.status = 401;
      ctx.body = { success: false, message: '用户名或密码错误' };
    }
  } catch (error) {
    log('error', '登录接口异常', { username, error: error.message, stack: error.stack });
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
    log('error', '修改密码异常', { error: error.message, stack: error.stack });
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
      teaching_time, learning_time, instrument_deposit, pay_method, amount,
      public_welfare_teacher, from_institution, lesson_fee_with_instrument, lesson_fee_without_instrument
    } = studentData;
    
    log('info', '开始提交学员资料', { name, phone, art_subject, ip: ctx.request.ip });
    
    if (!name || !gender || !phone || !current_level || !art_subject || !teaching_method || !teaching_time || !learning_time || !instrument_deposit || !pay_method || !amount || !public_welfare_teacher || !from_institution || !lesson_fee_with_instrument || !lesson_fee_without_instrument) {
      log('warn', '学员资料提交失败：必填字段为空', { name, phone, missingFields: '必填字段检查失败' });
      ctx.status = 400;
      ctx.body = { success: false, message: '必填字段不能为空' };
      return;
    }
    
    const result = await query(
      `INSERT INTO students (
        name, age, gender, phone, location_province, location_city, location_county,
        hobby, current_level, art_subject, learning_goal, teaching_method,
        teaching_time, learning_time, instrument_deposit, pay_method, amount,
        public_welfare_teacher, from_institution, lesson_fee_with_instrument, lesson_fee_without_instrument
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name, age, gender, phone, location_province, location_city, location_county,
        hobby, current_level, art_subject, learning_goal, teaching_method,
        teaching_time, learning_time, instrument_deposit, pay_method, amount,
        public_welfare_teacher, from_institution, lesson_fee_with_instrument, lesson_fee_without_instrument
      ]
    );
    
    log('info', '学员资料提交成功', { 
      studentId: result.insertId, 
      name, 
      phone, 
      art_subject,
      ip: ctx.request.ip 
    });
    
    ctx.body = {
      success: true,
      message: '学员资料提交成功',
      data: { id: result.insertId }
    };
  } catch (error) {
    log('error', '学员资料提交异常', { 
      error: error.message, 
      stack: error.stack 
    });
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
      sql += ' AND phone = ?';
      params.push(filters.phone);
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
    
    // 转换地址编码为地址名称
    const studentsWithLocation = students.map(student => {
      const locationText = getFullAddress(
        student.location_province,
        student.location_city,
        student.location_county
      );
      
      return {
        ...student,
        location_text: locationText || '未知地址'
      };
    });
    
    ctx.body = {
      success: true,
      data: {
        list: studentsWithLocation,
        total,
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      }
    };
  } catch (error) {
    log('error', '获取学员列表异常', { error: error.message, stack: error.stack });
    ctx.status = 500;
    ctx.body = { success: false, message: '服务器内部错误' };
  }
  
  return next();
});

// 生成PDF接口
router.get('/student/:id/pdf', async (ctx, next) => {
  try {
    const { id } = ctx.params;
    
    log('info', '开始生成学员PDF', { studentId: id, ip: ctx.request.ip });
    
    // 获取学员信息
    const students = await query('SELECT * FROM students WHERE id = ?', [id]);
    if (students.length === 0) {
      log('warn', 'PDF生成失败：学员不存在', { studentId: id, ip: ctx.request.ip });
      ctx.status = 404;
      ctx.body = { success: false, message: '学员不存在' };
      return;
    }
    const student = students[0];
    
    log('info', '开始生成PDF文件', { 
      studentId: id, 
      studentName: student.name, 
      ip: ctx.request.ip 
    });
    
    // 生成PDF
    const pdfBuffer = await generatePDF(student);
    
    log('info', 'PDF生成成功', { 
      studentId: id, 
      studentName: student.name, 
      pdfSize: pdfBuffer.length,
      ip: ctx.request.ip 
    });
    
    // 设置响应头
    ctx.set('Content-Type', 'application/pdf');
    ctx.set('Content-Disposition', `attachment; filename="${encodeURIComponent(student.name || 'student')}_profile.pdf"`);
    
    ctx.body = pdfBuffer;
  } catch (error) {
    log('error', 'PDF生成异常', { 
      studentId: ctx.params.id, 
      error: error.message, 
      stack: error.stack,
      ip: ctx.request.ip 
    });
    ctx.status = 500;
    ctx.body = { success: false, message: '生成PDF失败: ' + error.message };
  }
  
  return next();
});

// 以下接口需要鉴权

// 创建管理人员
router.post('/manager', async (ctx, next) => {
  try {
    const { username, password, role = 'user', institution_name = '' } = ctx.request.body || {};
    
    if (!username || !password) {
      ctx.status = 400;
      ctx.body = { success: false, message: '用户名和密码不能为空' };
      return;
    }
    
    const result = await query(
      'INSERT INTO admins (username, password, role, institution_name) VALUES (?, ?, ?, ?)',
      [username, password, role, institution_name]
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
    const managers = await query('SELECT id, username, role, institution_name, created_at FROM admins WHERE role != "admin" ORDER BY created_at DESC');
    
    ctx.body = {
      success: true,
      data: managers
    };
  } catch (error) {
    log('error', '获取管理人员列表异常', { error: error.message, stack: error.stack });
    ctx.status = 500;
    ctx.body = { success: false, message: '服务器内部错误' };
  }
  
  return next();
});

// 修改管理人员
router.put('/manager/:id', async (ctx, next) => {
  try {
    const { id } = ctx.params;
    const { username, password, role, institution_name } = ctx.request.body || {};
    
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
    if (institution_name !== undefined) {
      sql += ', institution_name = ?';
      params.push(institution_name);
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
      log('error', '修改管理人员异常', { error: error.message, stack: error.stack });
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
    log('error', '删除管理人员异常', { error: error.message, stack: error.stack });
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
    log('info', '开始启动服务器');
    log('info', '正在测试数据库连接');
    const isConnected = await testConnection();
    if (!isConnected) {
      log('error', '数据库连接失败，服务器启动中止');
      process.exit(1);
    }
    log('info', '数据库连接成功');
    log('info', '正在初始化数据库');
    await initDatabase();
    log('info', '数据库初始化完成');
    app.listen(3000, () => {
      log('info', '服务器启动成功', { port: 3000, apiUrl: 'http://localhost:3000/api' });
    });
  } catch (error) {
    log('error', '服务器启动失败', { error: error.message, stack: error.stack });
    process.exit(1);
  }
}

startServer();