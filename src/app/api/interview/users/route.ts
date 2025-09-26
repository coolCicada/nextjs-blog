import { NextRequest, NextResponse } from 'next/server';
import { InterviewDB } from '@/app/db/interview';

// POST /api/interview/users - 创建或登录用户
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, role, avatar } = body;

    if (!name || !email || !role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 检查用户是否已存在
    let user = await InterviewDB.getUserByEmail(email);
    
    if (!user) {
      // 创建新用户
      user = await InterviewDB.createUser({
        name,
        email,
        role,
        avatar,
      });
    }

    return NextResponse.json({ user }, { status: user ? 200 : 201 });
  } catch (error) {
    console.error('Error creating/finding user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/interview/users?email=xxx - 根据邮箱查找用户
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const id = searchParams.get('id');
    
    if (!email && !id) {
      return NextResponse.json({ error: 'Email or ID is required' }, { status: 400 });
    }

    let user;
    if (email) {
      user = await InterviewDB.getUserByEmail(email);
    } else if (id) {
      user = await InterviewDB.getUserById(id);
    }
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}