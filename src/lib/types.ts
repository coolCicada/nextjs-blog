import { NextApiResponse } from 'next';
import { Server as NetServer, Socket } from 'net';
import { Server as SocketIOServer } from 'socket.io';

export interface NextApiResponseServerIO extends NextApiResponse {
  socket: Socket & {
    server: NetServer & {
      io: SocketIOServer;
    };
  };
}

// 面试相关类型
export interface InterviewUser {
  id: string;
  name: string;
  email: string;
  role: 'interviewer' | 'candidate';
  avatar?: string;
}

export interface InterviewRoom {
  id: string;
  title: string;
  description?: string;
  interviewer: InterviewUser;
  candidate?: InterviewUser;
  status: 'waiting' | 'active' | 'completed' | 'cancelled';
  language: string;
  initialCode?: string;
  scheduledAt?: Date;
}

export interface CodeSession {
  id: string;
  roomId: string;
  content: string;
  language: string;
  version: number;
  userId: string;
  timestamp: Date;
}

export interface ChatMessage {
  id: string;
  roomId: string;
  userId: string;
  userName: string;
  message: string;
  type: 'text' | 'system';
  timestamp: Date;
}

export interface WebRTCSignal {
  type: 'offer' | 'answer' | 'ice-candidate';
  data: any;
  fromUserId: string;
  targetUserId: string;
}

// Socket事件类型
export interface SocketEvents {
  'join-room': (roomId: string, userId: string) => void;
  'leave-room': (roomId: string, userId: string) => void;
  'code-change': (data: { roomId: string; content: string; userId: string; language: string }) => void;
  'cursor-change': (data: { roomId: string; position: any; userId: string }) => void;
  'chat-message': (data: { roomId: string; message: string; userId: string; userName: string }) => void;
  'webrtc-offer': (data: { roomId: string; offer: any; targetUserId: string }) => void;
  'webrtc-answer': (data: { roomId: string; answer: any; targetUserId: string }) => void;
  'webrtc-ice-candidate': (data: { roomId: string; candidate: any; targetUserId: string }) => void;
  'interview-status-change': (data: { roomId: string; status: string; userId: string }) => void;
  'language-change': (data: { roomId: string; language: string; userId: string }) => void;
}

// Monaco Editor 相关类型
export interface EditorOptions {
  language: string;
  theme: 'light' | 'dark';
  fontSize: number;
  wordWrap: 'on' | 'off';
  minimap: boolean;
}

export interface CursorPosition {
  line: number;
  column: number;
}

export interface EditorSelection {
  startLine: number;
  startColumn: number;
  endLine: number;
  endColumn: number;
}

// WebRTC 相关类型
export interface MediaConstraints {
  video: boolean;
  audio: boolean;
}

export interface PeerConnection {
  id: string;
  userId: string;
  connection: RTCPeerConnection;
  stream?: MediaStream;
}

// 面试评价类型
export interface InterviewEvaluation {
  technicalScore: number;
  communicationScore: number;
  overallRating: number;
  notes?: string;
}