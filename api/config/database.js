const mysql = require('mysql2/promise');

// 数据库配置
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '123456789',
  database: 'admin_system',
  charset: 'utf8mb4',
  timezone: '+08:00',
  acquireTimeout: 60000,
  timeout: 60000,
  reconnect: true
};

// 创建连接池
const pool = mysql.createPool({
  ...dbConfig,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// 测试数据库连接
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('数据库连接成功');
    connection.release();
    return true;
  } catch (error) {
    console.error('数据库连接失败:', error.message);
    return false;
  }
}

// 执行SQL查询
async function query(sql, params = []) {
  try {
    const [rows] = await pool.execute(sql, params);
    return rows;
  } catch (error) {
    console.error('SQL执行错误:', error.message);
    throw error;
  }
}

// 初始化数据库和表
async function initDatabase() {
  try {
    // 创建数据库（如果不存在）
    const createDbConnection = await mysql.createConnection({
      host: dbConfig.host,
      user: dbConfig.user,
      password: dbConfig.password
    });
    
    await createDbConnection.execute(`CREATE DATABASE IF NOT EXISTS ${dbConfig.database} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    await createDbConnection.end();
    
    // 创建管理员表
    const createAdminTable = `
      CREATE TABLE IF NOT EXISTS admins (
        id INT PRIMARY KEY AUTO_INCREMENT,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role ENUM('admin', 'user') DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;
    
    await query(createAdminTable);
    console.log('管理员表创建成功');
    
    // 创建学员资料表
    const createStudentTable = `
      CREATE TABLE IF NOT EXISTS students (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(50) NOT NULL,
        age INT,
        gender ENUM('男', '女') NOT NULL,
        phone VARCHAR(20) NOT NULL,
        location_province VARCHAR(10) NOT NULL,
        location_city VARCHAR(10) NOT NULL,
        location_county VARCHAR(10) NOT NULL,
        hobby TEXT,
        current_level ENUM('初级', '中级', '高级') NOT NULL,
        art_subject VARCHAR(100) NOT NULL,
        learning_goal TEXT,
        teaching_method ENUM('一对一', '一对多') NOT NULL,
        teaching_time ENUM('线下课', '线上课') NOT NULL,
        learning_time VARCHAR(50) NOT NULL,
        instrument_deposit ENUM('需要押金', '无需押金') NOT NULL,
        pay_method VARCHAR(50) NOT NULL,
      amount DECIMAL(10,2) NOT NULL,
      public_welfare_teacher VARCHAR(100) NOT NULL,
        from_institution VARCHAR(200) NOT NULL,
        lesson_fee_with_instrument DECIMAL(10,2) NOT NULL,
        lesson_fee_without_instrument DECIMAL(10,2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;
    
    await query(createStudentTable);
    console.log('学员资料表创建成功');
    
    // 插入默认管理员账号
    const checkAdmin = await query('SELECT * FROM admins WHERE username = ?', ['admin']);
    if (checkAdmin.length === 0) {
      await query(
        'INSERT INTO admins (username, password, role) VALUES (?, ?, ?)',
        ['admin', '123456', 'admin']
      );
      console.log('默认管理员账号创建成功');
    }
    
    // 插入默认用户账号
    const checkUser = await query('SELECT * FROM admins WHERE username = ?', ['user']);
    if (checkUser.length === 0) {
      await query(
        'INSERT INTO admins (username, password, role) VALUES (?, ?, ?)',
        ['user', '123456', 'user']
      );
      console.log('默认用户账号创建成功');
    }
    
  } catch (error) {
    console.error('数据库初始化失败:', error.message);
    throw error;
  }
}

module.exports = {
  pool,
  query,
  testConnection,
  initDatabase
};