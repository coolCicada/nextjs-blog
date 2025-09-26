import postgres from 'postgres';

// 直接使用数据库URL（你可以从.env.local文件中复制）
const DATABASE_URL = "postgres://default:0PSAzL9mfvGx@ep-long-haze-18488404-pooler.us-east-1.aws.neon.tech/verceldb?sslmode=require";
const sql = postgres(DATABASE_URL, { ssl: 'require' });

async function initializeTables() {
  try {
    console.log('开始初始化面试数据库表...');
    
    // 创建面试用户表（独立于原有的users表）
    await sql`
      CREATE TABLE IF NOT EXISTS interview_users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        avatar TEXT,
        role VARCHAR(20) NOT NULL CHECK (role IN ('interviewer', 'candidate')),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;
    console.log('✓ interview_users 表创建成功');

    // 创建面试房间表
    await sql`
      CREATE TABLE IF NOT EXISTS interview_rooms (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(255) NOT NULL,
        description TEXT,
        interviewer_id UUID NOT NULL REFERENCES interview_users(id) ON DELETE CASCADE,
        candidate_id UUID REFERENCES interview_users(id) ON DELETE SET NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'active', 'completed', 'cancelled')),
        scheduled_at TIMESTAMP WITH TIME ZONE,
        started_at TIMESTAMP WITH TIME ZONE,
        ended_at TIMESTAMP WITH TIME ZONE,
        language VARCHAR(50) NOT NULL DEFAULT 'javascript',
        initial_code TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;
    console.log('✓ interview_rooms 表创建成功');

    // 创建代码会话表
    await sql`
      CREATE TABLE IF NOT EXISTS code_sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        room_id UUID NOT NULL REFERENCES interview_rooms(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        language VARCHAR(50) NOT NULL,
        version INTEGER NOT NULL DEFAULT 1,
        user_id UUID NOT NULL REFERENCES interview_users(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;
    console.log('✓ code_sessions 表创建成功');

    // 创建聊天消息表
    await sql`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        room_id UUID NOT NULL REFERENCES interview_rooms(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES interview_users(id) ON DELETE CASCADE,
        message TEXT NOT NULL,
        type VARCHAR(20) NOT NULL DEFAULT 'text' CHECK (type IN ('text', 'system')),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;
    console.log('✓ chat_messages 表创建成功');

    // 创建面试评价表
    await sql`
      CREATE TABLE IF NOT EXISTS interview_evaluations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        room_id UUID NOT NULL REFERENCES interview_rooms(id) ON DELETE CASCADE,
        interviewer_id UUID NOT NULL REFERENCES interview_users(id) ON DELETE CASCADE,
        candidate_id UUID NOT NULL REFERENCES interview_users(id) ON DELETE CASCADE,
        technical_score INTEGER NOT NULL CHECK (technical_score >= 1 AND technical_score <= 10),
        communication_score INTEGER NOT NULL CHECK (communication_score >= 1 AND communication_score <= 10),
        overall_rating INTEGER NOT NULL CHECK (overall_rating >= 1 AND overall_rating <= 10),
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;
    console.log('✓ interview_evaluations 表创建成功');

    // 创建索引
    await sql`CREATE INDEX IF NOT EXISTS idx_interview_users_email ON interview_users(email)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_interview_rooms_interviewer ON interview_rooms(interviewer_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_interview_rooms_candidate ON interview_rooms(candidate_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_interview_rooms_status ON interview_rooms(status)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_code_sessions_room ON code_sessions(room_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_chat_messages_room ON chat_messages(room_id)`;
    console.log('✓ 索引创建成功');

    console.log('🎉 面试数据库表初始化完成！');
    
    // 验证表是否创建成功
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE 'interview_%' 
      ORDER BY table_name
    `;
    
    console.log('\n📊 创建的表列表:');
    tables.forEach((table) => {
      console.log(`  - ${table.table_name}`);
    });

  } catch (error) {
    console.error('❌ 初始化数据库表失败:', error);
  } finally {
    await sql.end();
  }
}

initializeTables();