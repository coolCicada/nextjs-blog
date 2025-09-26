import postgres from 'postgres';

// 创建优化的数据库连接配置
const sql = postgres(process.env.DATABASE_URL!, {
  ssl: 'require',
  // 连接池配置
  max: 20,                      // 最大连接数
  idle_timeout: 20,             // 空闲连接超时时间（秒）
  connect_timeout: 30,          // 连接超时时间（秒）
  // 查询配置  
  transform: {
    undefined: null
  },
  // 错误处理
  onnotice: () => {},           // 忽略notice消息
  // 重试配置
  connection: {
    application_name: 'nextjs-interview-app',
    statement_timeout: 30000,   // SQL语句超时时间（毫秒）
    query_timeout: 25000,       // 查询超时时间（毫秒）
  }
});

export { sql };