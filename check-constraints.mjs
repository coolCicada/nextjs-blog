import postgres from 'postgres';
import { readFileSync } from 'fs';

// 从 .env.local 读取环境变量
const envContent = readFileSync('.env.local', 'utf8');
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

const sql = postgres(process.env.DATABASE_URL, { ssl: 'require' });

async function checkConstraints() {
  try {
    console.log('🔍 检查 interview_rooms 表的外键约束...\n');
    
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
    
    console.log('📋 interview_rooms 表的外键约束:');
    constraints.forEach(c => {
      console.log(`  ${c.constraint_name}: ${c.table_name}.${c.column_name} -> ${c.foreign_table_name}.${c.foreign_column_name}`);
    });

    // 检查是否存在 users 表
    console.log('\n🔍 检查现有表...');
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `;
    
    console.log('📋 数据库中的表:');
    tables.forEach(t => {
      console.log(`  - ${t.table_name}`);
    });
    
    await sql.end();
  } catch (error) {
    console.error('❌ 错误:', error);
    await sql.end();
  }
}

checkConstraints();