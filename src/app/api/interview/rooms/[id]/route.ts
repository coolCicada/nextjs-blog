import { NextRequest, NextResponse } from 'next/server';
import { InterviewDB } from '@/app/db/interview';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// GET /api/interview/rooms/[id] - 获取指定房间详情
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const room = await InterviewDB.getRoomById(id);
    
    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    // 获取面试官信息
    const interviewer = await InterviewDB.getUserById(room.interviewer_id);
    const roomWithInterviewer = {
      ...room,
      interviewer: interviewer ? {
        name: interviewer.name,
        email: interviewer.email
      } : null
    };

    return NextResponse.json({ room: roomWithInterviewer });
  } catch (error) {
    console.error('Error fetching room:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/interview/rooms/[id] - 更新房间状态或加入房间
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { action, candidateId, status } = body;

    if (action === 'join' && candidateId) {
      // 候选人加入房间
      const room = await InterviewDB.joinRoom(id, candidateId);
      return NextResponse.json({ room });
    } else if (action === 'updateStatus' && status) {
      // 更新房间状态
      const room = await InterviewDB.updateRoomStatus(id, status);
      return NextResponse.json({ room });
    } else {
      return NextResponse.json({ error: 'Invalid action or missing parameters' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error updating room:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}