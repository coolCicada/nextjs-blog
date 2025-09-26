import { NextRequest, NextResponse } from 'next/server';
import { InterviewDB } from '@/app/db/interview';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// GET /api/interview/rooms/[id]/chat - 获取聊天历史
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: roomId } = await params;
    const messages = await InterviewDB.getChatHistory(roomId);
    
    return NextResponse.json({ messages });
  } catch (error) {
    console.error('Error fetching chat history:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/interview/rooms/[id]/chat - 发送聊天消息
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: roomId } = await params;
    const body = await request.json();
    const { userId, message, type = 'text' } = body;

    if (!userId || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const chatMessage = await InterviewDB.saveChatMessage({
      room_id: roomId,
      user_id: userId,
      message,
      type,
    });

    return NextResponse.json({ message: chatMessage }, { status: 201 });
  } catch (error) {
    console.error('Error saving chat message:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}