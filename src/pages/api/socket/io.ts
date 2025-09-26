import { NextApiRequest } from 'next';
import { NextApiResponseServerIO } from '@/lib/types';
import { Server as NetServer } from 'http';
import { Server as ServerIO } from 'socket.io';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default function SocketHandler(req: NextApiRequest, res: NextApiResponseServerIO) {
  if (res.socket.server.io) {
    console.log('Socket is already running');
  } else {
    console.log('Socket is initializing');
    const httpServer: NetServer = res.socket.server as any;
    const io = new ServerIO(httpServer, {
      path: '/api/socket/io',
      addTrailingSlash: false,
      cors: {
        origin: process.env.NODE_ENV === 'production' ? process.env.SITE_URL : '*',
        methods: ['GET', 'POST'],
      },
    });
    
    res.socket.server.io = io;

    io.on('connection', (socket) => {
      console.log('New client connected:', socket.id);

      // 加入面试房间
      socket.on('join-room', (roomId: string, userId: string) => {
        socket.join(roomId);
        socket.to(roomId).emit('user-joined', { userId, socketId: socket.id });
        console.log(`User ${userId} joined room ${roomId}`);
      });

      // 离开面试房间
      socket.on('leave-room', (roomId: string, userId: string) => {
        socket.leave(roomId);
        socket.to(roomId).emit('user-left', { userId, socketId: socket.id });
        console.log(`User ${userId} left room ${roomId}`);
      });

      // 代码实时同步
      socket.on('code-change', (data: { roomId: string; content: string; userId: string; language: string }) => {
        socket.to(data.roomId).emit('code-update', {
          content: data.content,
          userId: data.userId,
          language: data.language,
          timestamp: Date.now(),
        });
      });

      // 光标位置同步
      socket.on('cursor-change', (data: { roomId: string; position: any; userId: string }) => {
        socket.to(data.roomId).emit('cursor-update', {
          position: data.position,
          userId: data.userId,
          socketId: socket.id,
        });
      });

      // 聊天消息
      socket.on('chat-message', (data: { roomId: string; message: string; userId: string; userName: string }) => {
        io.to(data.roomId).emit('new-message', {
          id: Date.now().toString(),
          message: data.message,
          userId: data.userId,
          userName: data.userName,
          timestamp: Date.now(),
        });
      });

      // WebRTC信令
      socket.on('webrtc-offer', (data: { roomId: string; offer: any; targetUserId: string }) => {
        socket.to(data.roomId).emit('webrtc-offer', {
          offer: data.offer,
          fromUserId: socket.id,
          targetUserId: data.targetUserId,
        });
      });

      socket.on('webrtc-answer', (data: { roomId: string; answer: any; targetUserId: string }) => {
        socket.to(data.roomId).emit('webrtc-answer', {
          answer: data.answer,
          fromUserId: socket.id,
          targetUserId: data.targetUserId,
        });
      });

      socket.on('webrtc-ice-candidate', (data: { roomId: string; candidate: any; targetUserId: string }) => {
        socket.to(data.roomId).emit('webrtc-ice-candidate', {
          candidate: data.candidate,
          fromUserId: socket.id,
          targetUserId: data.targetUserId,
        });
      });

      // 面试状态变更
      socket.on('interview-status-change', (data: { roomId: string; status: string; userId: string }) => {
        io.to(data.roomId).emit('status-update', {
          status: data.status,
          userId: data.userId,
          timestamp: Date.now(),
        });
      });

      // 编程语言切换
      socket.on('language-change', (data: { roomId: string; language: string; userId: string }) => {
        socket.to(data.roomId).emit('language-update', {
          language: data.language,
          userId: data.userId,
        });
      });

      // 断开连接
      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
      });
    });
  }
  res.end();
}