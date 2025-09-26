import { NextResponse } from 'next/server';
import { initializeInterviewTables } from '@/app/db/interview';

// POST /api/interview/init - 初始化数据库表
export async function POST() {
  try {
    await initializeInterviewTables();
    return NextResponse.json({ message: 'Database tables initialized successfully' });
  } catch (error) {
    console.error('Error initializing database tables:', error);
    return NextResponse.json(
      { error: 'Failed to initialize database tables' },
      { status: 500 }
    );
  }
}