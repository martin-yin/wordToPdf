const Koa = require('koa');
const Router = require('koa-better-router');
const { query, testConnection, initDatabase } = require('./config/database');
const fs = require('fs');
const path = require('path');
const Docxtemplater = require('docxtemplater');
const PizZip = require('pizzip');
const { exec } = require('child_process');

// 日志工具函数
function log(level, message, data = null) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
  
  if (data) {
    console.log(logMessage, data);
  } else {
    console.log(logMessage);
  }
}

// 数字转中文大写函数
function numberToChinese(num) {
  if (!num || isNaN(num)) return '';
  
  const digits = ['零', '壹', '贰', '叁', '肆', '伍', '陆', '柒', '捌', '玖'];
  const units = ['', '拾', '佰', '仟'];
  const bigUnits = ['', '万', '亿'];
  
  // 处理小数部分
  const parts = num.toString().split('.');
  const integerPart = parseInt(parts[0]);
  const decimalPart = parts[1];
  
  if (integerPart === 0) {
    if (decimalPart) {
      let result = '';
      if (decimalPart.length >= 1) {
        result += digits[parseInt(decimalPart[0])] + '角';
      }
      if (decimalPart.length >= 2) {
        result += digits[parseInt(decimalPart[1])] + '分';
      }
      return result || '零元';
    }
    return '零元';
  }
  
  let result = '';
  let numStr = integerPart.toString();
  let len = numStr.length;
  
  for (let i = 0; i < len; i++) {
    const digit = parseInt(numStr[i]);
    const pos = len - i - 1;
    
    if (digit !== 0) {
      result += digits[digit] + units[pos % 4];
      if (pos >= 4 && pos % 4 === 0) {
        result += bigUnits[Math.floor(pos / 4)];
      }
    } else if (result && !result.endsWith('零')) {
      result += '零';
    }
  }
  
  // 处理万和亿
  if (len > 4) {
    const wanPos = len - 4;
    if (wanPos > 0 && wanPos <= 4) {
      result = result.replace(/零+万/, '万');
    }
  }
  
  result += '元';
  
  // 处理小数部分
  if (decimalPart) {
    if (decimalPart.length >= 1 && decimalPart[0] !== '0') {
      result += digits[parseInt(decimalPart[0])] + '角';
    }
    if (decimalPart.length >= 2 && decimalPart[1] !== '0') {
      result += digits[parseInt(decimalPart[1])] + '分';
    }
  } else {
    result += '整';
  }
  
  return result;
}

// 加载地址数据
const pcaData = JSON.parse(fs.readFileSync(path.join(__dirname, 'pca-code.json'), 'utf8'));

// 地址编码转换函数
function getLocationName(code, type = 'all') {
  if (!code) return '';
  
  // 查找省份
  for (const province of pcaData) {
    if (province.code === code) {
      return province.name;
    }
    
    // 查找城市
    if (province.children) {
      for (const city of province.children) {
        if (city.code === code) {
          return type === 'all' ? `${province.name} ${city.name}` : city.name;
        }
        
        // 查找区县
        if (city.children) {
          for (const county of city.children) {
            if (county.code === code) {
              return type === 'all' ? `${province.name} ${city.name} ${county.name}` : county.name;
            }
          }
        }
      }
    }
  }
  
  return code; // 如果找不到，返回原编码
}

// 根据省市区编码获取完整地址
function getFullAddress(provinceCode, cityCode, countyCode) {
  const parts = [];
  
  if (provinceCode) {
    const provinceName = getLocationName(provinceCode, 'single');
    if (provinceName && provinceName !== provinceCode) {
      parts.push(provinceName);
    }
  }
  
  if (cityCode) {
    const cityName = getLocationName(cityCode, 'single');
    if (cityName && cityName !== cityCode) {
      parts.push(cityName);
    }
  }
  
  if (countyCode) {
    const countyName = getLocationName(countyCode, 'single');
    if (countyName && countyName !== countyCode) {
      parts.push(countyName);
    }
  }
  
  return parts.join(' ');
}

// PDF生成函数
function generatePDF(studentData) {
  return new Promise((resolve, reject) => {
    try {
      // 读取模板文件
      const templatePath = path.join(__dirname, 'template_word.docx');
      const content = fs.readFileSync(templatePath, 'binary');

      // 创建PizZip实例并加载文档
      const zip = new PizZip(content);

      // 创建docxtemplater实例
      const doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
      });

      // 准备模板数据
      const templateData = {
        name: studentData.name || '',
        age: studentData.age || '',
        gender: studentData.gender || '',
        phone: studentData.phone || '',
        location_province: getLocationName(studentData.location_province, 'single') || '',
        location_city: getLocationName(studentData.location_city, 'single') || '',
        location_county: getLocationName(studentData.location_county, 'single') || '',
        hobby: studentData.hobby || '',
        current_level: studentData.current_level || '',
        art_subject: studentData.art_subject || '',
        learning_goal: studentData.learning_goal || '',
        teaching_method: studentData.teaching_method === '一对一' ? '☑一对一 □一对多' : '□一对一 ☑一对多',
        teaching_time: studentData.teaching_time === '线下课' ? ' ☑线下课 □线上课' : ' □线下课 ☑线上课',
        learning_time: (() => {
          const options = ['50课时(1.5年)', '100课时(3年)', '200课时(5年)'];
          return options.map(option => 
            studentData.learning_time === option ? `☑${option} ` : `□${option} `
          ).join(' ');
        })(),
        instrument_deposit: studentData.instrument_deposit === '需要押金' ? ' ☑需要押金\n□无需押金' : ' □需要押金\n☑无需押金',
        pay_method: (() => {
          const payMethods = {
            '微信': '☑微信 □支付宝 □银行转账',
            '支付宝': '□微信 ☑支付宝 □银行转账',
            '银行转账': '□微信 □支付宝 ☑银行转账'
          };
          return payMethods[studentData.pay_method] || '□微信 □支付宝 □银行转账';
        })(),
        amount: studentData.amount || '',
        amount_in_words: studentData.amount ? numberToChinese(studentData.amount) : '',
        public_welfare_teacher: studentData.public_welfare_teacher || '',
        from_institution: studentData.from_institution || '',
        lesson_fee_with_instrument: studentData.lesson_fee_with_instrument || '',
        lesson_fee_without_instrument: studentData.lesson_fee_without_instrument || '',
      };

      // 渲染文档
      doc.render(templateData);
      
      // 生成Word文档缓冲区
      const buf = doc.getZip().generate({ type: 'nodebuffer' });
      
      // 创建临时文件
      const timestamp = Date.now();
      const tempDocxPath = path.join(__dirname, `temp_${timestamp}.docx`);
      const tempPdfPath = path.join(__dirname, `temp_${timestamp}.pdf`);
      
      // 写入临时Word文件
      fs.writeFileSync(tempDocxPath, buf);
      
      // 使用soffice命令转换为PDF
      const command = `soffice --headless --convert-to pdf --outdir "${__dirname}" "${tempDocxPath}"`;
      
      exec(command, (error, stdout, stderr) => {
        // 清理临时Word文件
        if (fs.existsSync(tempDocxPath)) {
          fs.unlinkSync(tempDocxPath);
        }
        
        if (error) {
          reject(new Error('PDF转换失败: ' + error.message));
          return;
        }
        
        // 检查PDF文件是否生成成功
        if (fs.existsSync(tempPdfPath)) {
          // 读取PDF文件
          const pdfBuffer = fs.readFileSync(tempPdfPath);
          
          // 清理临时PDF文件
          fs.unlinkSync(tempPdfPath);
          
          resolve(pdfBuffer);
        } else {
          reject(new Error('PDF文件生成失败'));
        }
      });
      
    } catch (error) {
      reject(new Error('生成PDF时出错: ' + error.message));
    }
  });
}

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
    
    // 测试数据库连接
    log('info', '正在测试数据库连接');
    const isConnected = await testConnection();
    if (!isConnected) {
      log('error', '数据库连接失败，服务器启动中止');
      process.exit(1);
    }
    log('info', '数据库连接成功');
    
    // 初始化数据库
    log('info', '正在初始化数据库');
    await initDatabase();
    log('info', '数据库初始化完成');
    
    // 启动服务器
    app.listen(3000, () => {
      log('info', '服务器启动成功', { port: 3000, apiUrl: 'http://localhost:3000/api' });
    });
  } catch (error) {
    log('error', '服务器启动失败', { error: error.message, stack: error.stack });
    process.exit(1);
  }
}

startServer();