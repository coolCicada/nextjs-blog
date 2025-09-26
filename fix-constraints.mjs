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

const sql = postgres(process.env.DATABASE_URL, { ssl: 'require' });

async function fixConstraints() {
  try {
    console.log('🔧 修复 interview_rooms 表的外键约束...\n');
    
    // 1. 删除现有的错误外键约束
    console.log('📋 删除错误的外键约束...');
    await sql`
      ALTER TABLE interview_rooms 
      DROP CONSTRAINT IF EXISTS interview_rooms_interviewer_id_fkey
    `;
    console.log('✅ 删除 interview_rooms_interviewer_id_fkey');
    
    await sql`
      ALTER TABLE interview_rooms 
      DROP CONSTRAINT IF EXISTS interview_rooms_candidate_id_fkey
    `;
    console.log('✅ 删除 interview_rooms_candidate_id_fkey');
    
    // 2. 添加正确的外键约束
    console.log('\n📋 添加正确的外键约束...');
    await sql`
      ALTER TABLE interview_rooms 
      ADD CONSTRAINT interview_rooms_interviewer_id_fkey 
      FOREIGN KEY (interviewer_id) REFERENCES interview_users(id) ON DELETE CASCADE
    `;
    console.log('✅ 添加正确的 interviewer_id 外键约束');
    
    await sql`
      ALTER TABLE interview_rooms 
      ADD CONSTRAINT interview_rooms_candidate_id_fkey 
      FOREIGN KEY (candidate_id) REFERENCES interview_users(id) ON DELETE SET NULL
    `;
    console.log('✅ 添加正确的 candidate_id 外键约束');
    
    // 3. 验证修复结果
    console.log('\n🔍 验证修复结果...');
    const constraints = await sql`
      SELECT 
        tc.constraint_name,
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name 
      FROM information_schema.table_constraints AS tc 
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY' 
        AND tc.table_name = 'interview_rooms';
    `;
    
    console.log('📋 修复后的外键约束:');
    constraints.forEach(c => {
      console.log(`  ✅ ${c.constraint_name}: ${c.table_name}.${c.column_name} -> ${c.foreign_table_name}.${c.foreign_column_name}`);
    });
    
    // 4. 测试创建房间功能
    console.log('\n🧪 测试创建房间功能...');
    
    // 先创建一个测试用户
    const user = await sql`
      INSERT INTO interview_users (name, email, role)
      VALUES ('测试面试官', 'test@example.com', 'interviewer')
      ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
      RETURNING *
    `;
    console.log('👤 测试用户:', user[0].id);
    
    // 创建测试房间
    const room = await sql`
      INSERT INTO interview_rooms (
        title, description, interviewer_id, 
        status, language, initial_code
      )
      VALUES (
        '测试房间', '这是一个测试房间', ${user[0].id}, 
        'waiting', 'javascript', 'console.log("Hello World");'
      )
      RETURNING *
    `;
    
    console.log('🏠 测试房间创建成功!');
    console.log(`   ID: ${room[0].id}`);
    console.log(`   标题: ${room[0].title}`);
    console.log(`   状态: ${room[0].status}`);
    
    // 清理测试数据
    await sql`DELETE FROM interview_rooms WHERE id = ${room[0].id}`;
    await sql`DELETE FROM interview_users WHERE id = ${user[0].id}`;
    console.log('🧹 清理测试数据完成');
    
    console.log('\n🎉 外键约束修复成功！创建房间功能现在应该可以正常工作了。');
    
  } catch (error) {
    console.error('❌ 修复失败:', error);
  } finally {
    await sql.end();
  }
}

fixConstraints();