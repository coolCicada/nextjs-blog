import postgres from 'postgres';
import { readFileSync } from 'fs';

// 从 .env.local 读取环境变量
let envContent;
try {
  envContent = readFileSync('.env.local', 'utf8');
  const envVars = {};
  envContent.split('\n').forEach(line => {
    if (line.trim() && !line.startsWith('#')) {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length) {
        let value = valueParts.join('=').trim();
        if ((value.startsWith('"') && value.endsWith('"')) || 
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        envVars[key.trim()] = value;
      }
    }
  });
  Object.assign(process.env, envVars);
} catch (error) {
  console.error('无法读取 .env.local 文件:', error);
  process.exit(1);
}

// 使用优化的连接配置
const sql = postgres(process.env.DATABASE_URL, {
  ssl: 'require',
  max: 10,
  idle_timeout: 20,
  connect_timeout: 30,
  transform: {
    undefined: null
  },
  onnotice: () => {},
  connection: {
    application_name: 'db-diagnostics',
    statement_timeout: 30000,
    query_timeout: 25000,
  }
});

async function runDiagnostics() {
  console.log('🔍 数据库连接诊断开始...\n');
  
  try {
    // 1. 测试基本连接
    console.log('📡 测试数据库连接...');
    const startTime = Date.now();
    await sql`SELECT 1 as test`;
    const connectionTime = Date.now() - startTime;
    console.log(`✅ 连接成功 (${connectionTime}ms)`);
    
    // 2. 测试表存在性
    console.log('\n📋 检查表结构...');
    const tables = await sql`
      SELECT table_name, table_type
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE 'interview_%'
      ORDER BY table_name
    `;
    console.log('面试相关表:');
    tables.forEach(table => {
      console.log(`  ✅ ${table.table_name} (${table.table_type})`);
    });
    
    // 3. 测试性能关键查询
    console.log('\n⚡ 测试关键查询性能...');
    
    // 计算总房间数
    const roomCount = await sql`SELECT COUNT(*) as count FROM interview_rooms`;
    console.log(`📊 总房间数: ${roomCount[0].count}`);
    
    // 计算总用户数
    const userCount = await sql`SELECT COUNT(*) as count FROM interview_users`;
    console.log(`👥 总用户数: ${userCount[0].count}`);
    
    // 测试复杂查询性能
    console.log('\n🔍 测试复杂查询...');
    const complexQueryStart = Date.now();
    const roomsWithUsers = await sql`
      SELECT r.id, r.title, r.status, r.created_at,
             i.name as interviewer_name,
             c.name as candidate_name
      FROM interview_rooms r
      LEFT JOIN interview_users i ON r.interviewer_id = i.id
      LEFT JOIN interview_users c ON r.candidate_id = c.id
      ORDER BY r.created_at DESC
      LIMIT 10
    `;
    const complexQueryTime = Date.now() - complexQueryStart;
    console.log(`✅ 复杂查询完成 (${complexQueryTime}ms), 返回 ${roomsWithUsers.length} 条记录`);
    
    // 4. 测试连接池
    console.log('\n🏊 测试连接池性能...');
    const promises = [];
    for (let i = 0; i < 5; i++) {
      promises.push(
        sql`SELECT pg_sleep(0.1), ${i} as query_id`.then(() => {
          console.log(`  ✅ 并发查询 ${i + 1} 完成`);
        })
      );
    }
    
    const poolTestStart = Date.now();
    await Promise.all(promises);
    const poolTestTime = Date.now() - poolTestStart;
    console.log(`✅ 连接池测试完成 (${poolTestTime}ms)`);
    
    // 5. 检查数据库负载
    console.log('\n📈 检查数据库状态...');
    const dbStats = await sql`
      SELECT 
        count(*) as active_connections,
        (SELECT setting FROM pg_settings WHERE name = 'max_connections') as max_connections
      FROM pg_stat_activity 
      WHERE state = 'active'
    `;
    console.log(`🔗 活跃连接数: ${dbStats[0].active_connections}/${dbStats[0].max_connections}`);
    
    // 6. 生成建议
    console.log('\n💡 性能建议:');
    if (connectionTime > 5000) {
      console.log('⚠️  连接时间较长，考虑使用连接池');
    }
    if (complexQueryTime > 1000) {
      console.log('⚠️  查询时间较长，考虑添加索引');
    }
    if (parseInt(dbStats[0].active_connections) > parseInt(dbStats[0].max_connections) * 0.8) {
      console.log('⚠️  连接数接近上限，需要优化连接管理');
    }
    
    console.log('\n🎉 诊断完成！数据库连接正常。');
    
  } catch (error) {
    console.error('\n❌ 诊断失败:', {
      message: error.message,
      code: error.code,
      errno: error.errno,
      syscall: error.syscall,
      stack: error.stack?.split('\n').slice(0, 5).join('\n')
    });
    
    console.log('\n🔧 故障排除建议:');
    if (error.code === 'ETIMEDOUT') {
      console.log('  - 网络连接超时，检查网络连接');
      console.log('  - 数据库服务器可能过载');
      console.log('  - 尝试增加连接超时时间');
    }
    if (error.code === 'ECONNREFUSED') {
      console.log('  - 数据库服务未启动');
      console.log('  - 检查DATABASE_URL配置');
    }
    if (error.code === 'ENOTFOUND') {
      console.log('  - 数据库主机名无法解析');
      console.log('  - 检查网络DNS设置');
    }
  } finally {
    await sql.end();
  }
}

runDiagnostics();