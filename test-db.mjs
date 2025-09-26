import postgres from 'postgres';

// 从 .env.local 读取环境变量
import { readFileSync } from 'fs';

let envContent;
try {
  envContent = readFileSync('.env.local', 'utf8');
  const envVars = {};
  envContent.split('\n').forEach(line => {
    if (line.trim() && !line.startsWith('#')) {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length) {
        let value = valueParts.join('=').trim();
        // 移除引号
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

console.log('DATABASE_URL:', process.env.DATABASE_URL ? '已设置' : '未设置');

const sql = postgres(process.env.DATABASE_URL, { ssl: 'require' });

async function checkTableStructure() {
  try {
    console.log('检查面试表结构...');
    
    // 检查 interview_users 表
    const userColumns = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'interview_users'
      ORDER BY ordinal_position
    `;
    
    console.log('\n📊 interview_users 表结构:');
    userColumns.forEach((col) => {
      console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });

    // 检查 interview_rooms 表
    const roomColumns = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'interview_rooms'
      ORDER BY ordinal_position
    `;
    
    console.log('\n📊 interview_rooms 表结构:');
    roomColumns.forEach((col) => {
      console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });

    // 测试创建用户
    console.log('\n🧪 测试创建用户...');
    try {
      const testUser = await sql`
        INSERT INTO interview_users (name, email, role)
        VALUES ('测试面试官', 'test-interviewer@example.com', 'interviewer')
        ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
        RETURNING *
      `;
      console.log('✅ 用户创建成功:', testUser[0]);
      
      // 测试创建房间
      console.log('\n🧪 测试创建房间...');
      const testRoom = await sql`
        INSERT INTO interview_rooms (title, description, interviewer_id, language)
        VALUES ('测试房间', '这是一个测试房间', ${testUser[0].id}, 'javascript')
        RETURNING *
      `;
      console.log('✅ 房间创建成功:', testRoom[0]);
      
    } catch (testError) {
      console.error('❌ 测试创建失败:', testError);
    }

  } catch (error) {
    console.error('❌ 检查表结构失败:', error);
  } finally {
    await sql.end();
  }
}

checkTableStructure();