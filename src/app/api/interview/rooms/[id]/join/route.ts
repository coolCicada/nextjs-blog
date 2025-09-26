import { NextRequest, NextResponse } from 'next/server';
import { InterviewDB } from '@/app/db/interview';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// POST /api/interview/rooms/[id]/join - 面试者加入房间
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { candidateId } = body;

    if (!candidateId) {
      return NextResponse.json({ 
        error: '面试者ID不能为空',
        details: 'candidateId is required'
      }, { status: 400 });
    }

    // 验证房间是否存在
    const room = await InterviewDB.getRoomById(id);
    if (!room) {
      return NextResponse.json({ 
        error: '房间不存在',
        details: 'Room not found'
      }, { status: 404 });
    }

    // 检查房间状态
    if (room.status === 'completed' || room.status === 'cancelled') {
      return NextResponse.json({ 
        error: '房间已结束，无法加入',
        details: 'Room is completed or cancelled'
      }, { status: 400 });
    }

    // 检查是否已有面试者
    if (room.candidate_id && room.candidate_id !== candidateId) {
      return NextResponse.json({ 
        error: '房间已有面试者',
        details: 'Room already has a candidate'
      }, { status: 400 });
    }

    // 验证面试者是否存在
    const candidate = await InterviewDB.getUserById(candidateId);
    if (!candidate) {
      return NextResponse.json({ 
        error: '面试者用户不存在',
        details: 'Candidate not found'
      }, { status: 400 });
    }

    if (candidate.role !== 'candidate') {
      return NextResponse.json({ 
        error: '只有面试者可以加入房间',
        details: 'Only candidates can join rooms'
      }, { status: 400 });
    }

    // 加入房间
    const updatedRoom = await InterviewDB.joinRoom(id, candidateId);
    console.log('Candidate joined room successfully:', updatedRoom);

    return NextResponse.json({ 
      success: true,
      room: updatedRoom 
    });
  } catch (error: any) {
    console.error('Error joining room:', error);
    
    // 处理数据库约束错误
    if (error.code === '23503') {
      return NextResponse.json({ 
        error: '用户不存在',
        details: 'User not found in database'
      }, { status: 400 });
    }

    return NextResponse.json({ 
      error: '加入房间失败',
      details: error.message || 'Internal server error'
    }, { status: 500 });
  }
}