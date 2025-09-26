import { NextRequest, NextResponse } from 'next/server';
import { InterviewDB } from '@/app/db/interview';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// GET /api/interview/rooms/[id]/code - 获取房间的最新代码
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: roomId } = await params;
    const session = await InterviewDB.getLatestCodeSession(roomId);
    
    return NextResponse.json({ session });
  } catch (error) {
    console.error('Error fetching code session:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/interview/rooms/[id]/code - 保存代码会话
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: roomId } = await params;
    const body = await request.json();
    const { content, language, version, userId } = body;

    if (!content || !language || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const session = await InterviewDB.saveCodeSession({
      room_id: roomId,
      content,
      language,
      version: version || 1,
      user_id: userId,
    });

    return NextResponse.json({ session }, { status: 201 });
  } catch (error) {
    console.error('Error saving code session:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}