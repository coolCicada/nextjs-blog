import { NextRequest, NextResponse } from 'next/server';
import { InterviewDB } from '@/app/db/interview';

// GET /api/interview/rooms - 获取用户的面试房间列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json({ 
        error: 'User ID is required',
        rooms: []
      }, { status: 400 });
    }

    console.log(`[API] Fetching rooms for user: ${userId}`);
    const rooms = await InterviewDB.getRoomsByUser(userId);
    console.log(`[API] Successfully fetched ${rooms.length} rooms`);
    
    return NextResponse.json({ 
      rooms,
      success: true
    });
  } catch (error: any) {
    console.error('[API] Error fetching rooms:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    
    // 对于超时错误，返回友好的错误信息
    if (error.code === 'ETIMEDOUT' || error.code === 'ECONNRESET') {
      return NextResponse.json({ 
        error: '网络连接超时，请稍后重试',
        rooms: [],
        timeout: true
      }, { status: 503 }); // Service Unavailable
    }
    
    return NextResponse.json({ 
      error: '获取房间列表失败，请刷新重试',
      rooms: []
    }, { status: 500 });
  }
}

// POST /api/interview/rooms - 创建新的面试房间
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Creating room with data:', body);
    const { title, description, interviewerId, language, initialCode, scheduledAt } = body;

    // 详细的字段验证
    if (!title || title.trim() === '') {
      console.log('Title is missing or empty');
      return NextResponse.json({ 
        error: '房间标题不能为空',
        details: 'Title is required and cannot be empty'
      }, { status: 400 });
    }

    if (!interviewerId) {
      console.log('InterviewerId is missing');
      return NextResponse.json({ 
        error: '面试官ID不能为空',
        details: 'InterviewerId is required'
      }, { status: 400 });
    }

    if (!language) {
      console.log('Language is missing');
      return NextResponse.json({ 
        error: '编程语言不能为空',
        details: 'Programming language is required'
      }, { status: 400 });
    }

    // 验证面试官是否存在
    const interviewer = await InterviewDB.getUserById(interviewerId);
    if (!interviewer) {
      console.log('Interviewer not found:', interviewerId);
      return NextResponse.json({ 
        error: '面试官用户不存在',
        details: `Interviewer with ID ${interviewerId} not found`
      }, { status: 400 });
    }

    console.log('About to create room with params:', {
      title: title.trim(),
      description,
      interviewer_id: interviewerId,
      status: 'waiting',
      language,
      initial_code: initialCode,
      scheduled_at: scheduledAt ? new Date(scheduledAt) : undefined,
    });

    const room = await InterviewDB.createRoom({
      title: title.trim(),
      description,
      interviewer_id: interviewerId,
      status: 'waiting',
      language,
      initial_code: initialCode,
      scheduled_at: scheduledAt ? new Date(scheduledAt) : undefined,
    });

    console.log('Room created successfully:', room);
    return NextResponse.json({ 
      success: true,
      room 
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating room:', error);
    
    // 根据错误类型返回具体错误信息
    if (error.code === '23503') {
      return NextResponse.json({ 
        error: '数据关联错误：面试官用户不存在',
        details: '请确保面试官账户已创建'
      }, { status: 400 });
    }
    
    if (error.code === '23505') {
      return NextResponse.json({ 
        error: '数据重复错误',
        details: '房间已存在或存在重复数据'
      }, { status: 400 });
    }

    return NextResponse.json({ 
      error: '创建房间失败',
      details: error.message || 'Internal server error'
    }, { status: 500 });
  }
}