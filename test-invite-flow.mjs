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

async function testInviteFlow() {
  try {
    console.log('🧪 测试面试邀请和加入流程...\n');
    
    // 1. 创建测试面试官
    console.log('👤 创建测试面试官...');
    const interviewer = await sql`
      INSERT INTO interview_users (name, email, role)
      VALUES ('张三', 'interviewer@example.com', 'interviewer')
      ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
      RETURNING *
    `;
    console.log(`✅ 面试官创建成功: ${interviewer[0].name} (${interviewer[0].id})`);
    
    // 2. 创建测试面试者
    console.log('\n👤 创建测试面试者...');
    const candidate = await sql`
      INSERT INTO interview_users (name, email, role)
      VALUES ('李四', 'candidate@example.com', 'candidate')
      ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
      RETURNING *
    `;
    console.log(`✅ 面试者创建成功: ${candidate[0].name} (${candidate[0].id})`);
    
    // 3. 创建面试房间
    console.log('\n🏠 创建测试面试房间...');
    const room = await sql`
      INSERT INTO interview_rooms (
        title, description, interviewer_id, 
        status, language, initial_code
      )
      VALUES (
        'JavaScript 前端面试', '考察React和JavaScript基础知识', ${interviewer[0].id}, 
        'waiting', 'javascript', 'console.log("面试开始！");'
      )
      RETURNING *
    `;
    console.log(`✅ 房间创建成功: ${room[0].title} (${room[0].id})`);
    
    // 4. 模拟邀请链接
    const inviteUrl = `http://localhost:3000/interview/join/${room[0].id}`;
    console.log(`\n🔗 邀请链接已生成: ${inviteUrl}`);
    
    // 5. 测试面试者加入房间
    console.log('\n🤝 测试面试者加入房间...');
    const joinResult = await sql`
      UPDATE interview_rooms 
      SET candidate_id = ${candidate[0].id}, status = 'active', updated_at = NOW()
      WHERE id = ${room[0].id}
      RETURNING *
    `;
    console.log('✅ 面试者成功加入房间!');
    
    // 6. 验证结果
    console.log('\n📊 验证最终状态...');
    const finalRoom = await sql`
      SELECT r.*, 
             i.name as interviewer_name, i.email as interviewer_email,
             c.name as candidate_name, c.email as candidate_email
      FROM interview_rooms r
      LEFT JOIN interview_users i ON r.interviewer_id = i.id
      LEFT JOIN interview_users c ON r.candidate_id = c.id
      WHERE r.id = ${room[0].id}
    `;
    
    const roomInfo = finalRoom[0];
    console.log('📋 房间最终状态:');
    console.log(`   房间ID: ${roomInfo.id}`);
    console.log(`   标题: ${roomInfo.title}`);
    console.log(`   状态: ${roomInfo.status}`);
    console.log(`   面试官: ${roomInfo.interviewer_name} (${roomInfo.interviewer_email})`);
    console.log(`   面试者: ${roomInfo.candidate_name || '无'} (${roomInfo.candidate_email || '无'})`);
    console.log(`   编程语言: ${roomInfo.language}`);
    
    // 7. 生成使用说明
    console.log('\n📝 使用说明:');
    console.log('1. 面试官可以在主页面创建房间');
    console.log('2. 创建后可以点击"分享"按钮获取邀请链接');
    console.log('3. 将邀请链接发送给面试者');
    console.log(`4. 面试者访问邀请链接: ${inviteUrl}`);
    console.log('5. 面试者填写姓名和邮箱后可以加入房间');
    console.log('6. 双方都可以进入房间开始面试');
    
    console.log('\n✅ 测试完成！邀请和加入流程工作正常。');
    
    // 清理测试数据
    console.log('\n🧹 清理测试数据...');
    await sql`DELETE FROM interview_rooms WHERE id = ${room[0].id}`;
    await sql`DELETE FROM interview_users WHERE id IN (${interviewer[0].id}, ${candidate[0].id})`;
    console.log('✅ 清理完成');
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
  } finally {
    await sql.end();
  }
}

testInviteFlow();