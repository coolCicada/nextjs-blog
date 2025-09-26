import { sql } from './index';

// 数据库操作辅助函数
const withRetry = async <T>(operation: () => Promise<T>, maxRetries = 3): Promise<T> => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      console.warn(`Database operation attempt ${attempt} failed:`, error.message);
      
      // 如果是最后一次尝试，抛出错误
      if (attempt === maxRetries) {
        throw error;
      }
      
      // 对于连接超时错误，等待一段时间后重试
      if (error.code === 'ETIMEDOUT' || error.code === 'ECONNRESET' || error.code === 'ENOTFOUND') {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000); // 指数退避，最大5秒
        console.log(`Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        // 对于其他错误，短暂等待后重试
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
  }
  throw new Error('All retry attempts failed');
};

// 数据类型定义
export interface InterviewUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'interviewer' | 'candidate';
  created_at: Date;
}

export interface InterviewRoom {
  id: string;
  title: string;
  description?: string;
  interviewer_id: string;
  candidate_id?: string;
  status: 'waiting' | 'active' | 'completed' | 'cancelled';
  scheduled_at?: Date;
  started_at?: Date;
  ended_at?: Date;
  language: string; // 编程语言
  initial_code?: string;
  created_at: Date;
  updated_at: Date;
}

export interface CodeSession {
  id: string;
  room_id: string;
  content: string;
  language: string;
  version: number;
  user_id: string; // 最后修改者
  created_at: Date;
}

export interface ChatMessage {
  id: string;
  room_id: string;
  user_id: string;
  message: string;
  type: 'text' | 'system';
  created_at: Date;
}

export interface InterviewEvaluation {
  id: string;
  room_id: string;
  interviewer_id: string;
  candidate_id: string;
  technical_score: number; // 1-10
  communication_score: number; // 1-10
  overall_rating: number; // 1-10
  notes?: string;
  created_at: Date;
}

// 数据库操作函数
export class InterviewDB {
  
  // 面试用户管理
  static async createUser(user: Omit<InterviewUser, 'id' | 'created_at'>): Promise<InterviewUser> {
    const result = await sql`
      INSERT INTO interview_users (name, email, avatar, role)
      VALUES (${user.name}, ${user.email}, ${user.avatar || null}, ${user.role})
      RETURNING *
    `;
    return result[0] as InterviewUser;
  }

  static async getUserById(id: string): Promise<InterviewUser | null> {
    const result = await sql`
      SELECT * FROM interview_users WHERE id = ${id}
    `;
    return result[0] as InterviewUser || null;
  }

  static async getUserByEmail(email: string): Promise<InterviewUser | null> {
    const result = await sql`
      SELECT * FROM interview_users WHERE email = ${email}
    `;
    return result[0] as InterviewUser || null;
  }

  // 面试房间管理
  static async createRoom(room: Omit<InterviewRoom, 'id' | 'created_at' | 'updated_at'>): Promise<InterviewRoom> {
    const result = await sql`
      INSERT INTO interview_rooms (
        title, description, interviewer_id, candidate_id, 
        status, scheduled_at, language, initial_code
      )
      VALUES (
        ${room.title}, ${room.description || null}, ${room.interviewer_id}, 
        ${room.candidate_id || null}, ${room.status}, ${room.scheduled_at || null}, 
        ${room.language}, ${room.initial_code || null}
      )
      RETURNING *
    `;
    return result[0] as InterviewRoom;
  }

  static async getRoomById(id: string): Promise<InterviewRoom | null> {
    const result = await sql`
      SELECT * FROM interview_rooms WHERE id = ${id}
    `;
    return result[0] as InterviewRoom || null;
  }

  static async updateRoomStatus(id: string, status: InterviewRoom['status']): Promise<InterviewRoom> {
    const result = await sql`
      UPDATE interview_rooms 
      SET status = ${status}, updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;
    return result[0] as InterviewRoom;
  }

  static async joinRoom(roomId: string, candidateId: string): Promise<InterviewRoom> {
    const result = await sql`
      UPDATE interview_rooms 
      SET candidate_id = ${candidateId}, status = 'active', updated_at = NOW()
      WHERE id = ${roomId}
      RETURNING *
    `;
    return result[0] as InterviewRoom;
  }

  static async getRoomsByUser(userId: string): Promise<InterviewRoom[]> {
    try {
      return await withRetry(async () => {
        console.log(`Fetching rooms for user: ${userId}`);
        const result = await sql`
          SELECT * FROM interview_rooms 
          WHERE interviewer_id = ${userId} OR candidate_id = ${userId}
          ORDER BY created_at DESC
          LIMIT 50
        `;
        console.log(`Found ${result.length} rooms for user ${userId}`);
        return result as unknown as InterviewRoom[];
      });
    } catch (error: any) {
      console.error('Failed to fetch rooms after retries:', error);
      // 返回空数组而不是抛出错误，这样前端可以正常工作
      return [];
    }
  }

  // 代码会话管理
  static async saveCodeSession(session: Omit<CodeSession, 'id' | 'created_at'>): Promise<CodeSession> {
    const result = await sql`
      INSERT INTO code_sessions (room_id, content, language, version, user_id)
      VALUES (${session.room_id}, ${session.content}, ${session.language}, ${session.version}, ${session.user_id})
      RETURNING *
    `;
    return result[0] as CodeSession;
  }

  static async getLatestCodeSession(roomId: string): Promise<CodeSession | null> {
    const result = await sql`
      SELECT * FROM code_sessions 
      WHERE room_id = ${roomId}
      ORDER BY version DESC, created_at DESC
      LIMIT 1
    `;
    return result[0] as CodeSession || null;
  }

  static async getCodeHistory(roomId: string): Promise<CodeSession[]> {
    const result = await sql`
      SELECT * FROM code_sessions 
      WHERE room_id = ${roomId}
      ORDER BY version ASC, created_at ASC
    `;
    return result as unknown as CodeSession[];
  }

  // 聊天消息管理
  static async saveChatMessage(message: Omit<ChatMessage, 'id' | 'created_at'>): Promise<ChatMessage> {
    const result = await sql`
      INSERT INTO chat_messages (room_id, user_id, message, type)
      VALUES (${message.room_id}, ${message.user_id}, ${message.message}, ${message.type})
      RETURNING *
    `;
    return result[0] as ChatMessage;
  }

  static async getChatHistory(roomId: string): Promise<ChatMessage[]> {
    const result = await sql`
      SELECT cm.*, iu.name as user_name, iu.avatar as user_avatar
      FROM chat_messages cm
      JOIN interview_users iu ON cm.user_id = iu.id
      WHERE cm.room_id = ${roomId}
      ORDER BY cm.created_at ASC
    `;
    return result as unknown as (ChatMessage & { user_name: string; user_avatar?: string })[];
  }

  // 面试评价管理
  static async saveEvaluation(evaluation: Omit<InterviewEvaluation, 'id' | 'created_at'>): Promise<InterviewEvaluation> {
    const result = await sql`
      INSERT INTO interview_evaluations (
        room_id, interviewer_id, candidate_id, 
        technical_score, communication_score, overall_rating, notes
      )
      VALUES (
        ${evaluation.room_id}, ${evaluation.interviewer_id}, ${evaluation.candidate_id},
        ${evaluation.technical_score}, ${evaluation.communication_score}, 
        ${evaluation.overall_rating}, ${evaluation.notes || null}
      )
      RETURNING *
    `;
    return result[0] as InterviewEvaluation;
  }

  static async getEvaluation(roomId: string): Promise<InterviewEvaluation | null> {
    const result = await sql`
      SELECT * FROM interview_evaluations WHERE room_id = ${roomId}
    `;
    return result[0] as InterviewEvaluation || null;
  }
}

// 初始化数据库表
export async function initializeInterviewTables() {
  try {
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

    // 创建索引
    await sql`CREATE INDEX IF NOT EXISTS idx_interview_users_email ON interview_users(email)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_interview_rooms_interviewer ON interview_rooms(interviewer_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_interview_rooms_candidate ON interview_rooms(candidate_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_interview_rooms_status ON interview_rooms(status)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_code_sessions_room ON code_sessions(room_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_chat_messages_room ON chat_messages(room_id)`;
    
    console.log('Interview database tables initialized successfully');
  } catch (error) {
    console.error('Error initializing interview tables:', error);
    throw error;
  }
}