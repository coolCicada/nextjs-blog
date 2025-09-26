'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import CollaborativeEditor from '@/app/components/collaborative-editor';
import VideoCall from '@/app/components/video-call';
import InterviewChat from '@/app/components/interview-chat';
import { useSocket } from '@/app/hooks/useSocket';
import { Button } from '@/components/ui/button';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable';
import { 
  Code, 
  Video, 
  MessageSquare, 
  Settings, 
  Users,
  LogOut,
  Play,
  Square
} from 'lucide-react';

interface InterviewUser {
  id: string;
  name: string;
  email: string;
  role: 'interviewer' | 'candidate';
}

interface Room {
  id: string;
  title: string;
  description?: string;
  interviewer_id: string;
  candidate_id?: string;
  status: 'waiting' | 'active' | 'completed' | 'cancelled';
  language: string;
  initial_code?: string;
}

export default function InterviewRoom() {
  const params = useParams();
  const router = useRouter();
  const roomId = params?.id as string;
  const { socket, isConnected } = useSocket();

  const [user, setUser] = useState<InterviewUser | null>(null);
  const [room, setRoom] = useState<Room | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentCode, setCurrentCode] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('javascript');
  const [connectedUsers, setConnectedUsers] = useState<string[]>([]);

  // 编程语言选项
  const languages = [
    { value: 'javascript', label: 'JavaScript' },
    { value: 'python', label: 'Python' },
    { value: 'java', label: 'Java' },
    { value: 'cpp', label: 'C++' },
    { value: 'go', label: 'Go' },
    { value: 'rust', label: 'Rust' },
    { value: 'typescript', label: 'TypeScript' },
    { value: 'php', label: 'PHP' }
  ];

  // 加载房间信息
  const loadRoom = useCallback(async () => {
    try {
      const response = await fetch(`/api/interview/rooms/${roomId}`);
      if (response.ok) {
        const data = await response.json();
        setRoom(data.room);
        setSelectedLanguage(data.room.language);
        
        // 加载最新代码
        const codeResponse = await fetch(`/api/interview/rooms/${roomId}/code`);
        if (codeResponse.ok) {
          const codeData = await codeResponse.json();
          if (codeData.session) {
            setCurrentCode(codeData.session.content);
          } else if (data.room.initial_code) {
            setCurrentCode(data.room.initial_code);
          }
        }
      } else {
        alert('房间不存在或已删除');
        router.push('/interview');
      }
    } catch (error) {
      console.error('Error loading room:', error);
      alert('加载房间信息失败');
      router.push('/interview');
    } finally {
      setIsLoading(false);
    }
  }, [roomId, router]);

  // 处理代码变化
  const handleCodeChange = async (newCode: string) => {
    setCurrentCode(newCode);
    
    // 保存到数据库
    try {
      await fetch(`/api/interview/rooms/${roomId}/code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: newCode,
          language: selectedLanguage,
          version: 1,
          userId: user?.id,
        }),
      });
    } catch (error) {
      console.error('Error saving code:', error);
    }
  };

  // 处理语言切换
  const handleLanguageChange = (language: string) => {
    setSelectedLanguage(language);
    if (socket && user) {
      socket.emit('language-change', {
        roomId,
        language,
        userId: user.id
      });
    }
  };

  // 开始/结束面试
  const toggleInterviewStatus = async () => {
    if (!room || !user) return;

    const newStatus = room.status === 'waiting' ? 'active' : 
                     room.status === 'active' ? 'completed' : room.status;

    try {
      const response = await fetch(`/api/interview/rooms/${roomId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'updateStatus',
          status: newStatus,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setRoom(data.room);
        
        if (socket) {
          socket.emit('interview-status-change', {
            roomId,
            status: newStatus,
            userId: user.id
          });
        }
      }
    } catch (error) {
      console.error('Error updating interview status:', error);
    }
  };

  // 离开房间
  const leaveRoom = () => {
    if (socket && user) {
      socket.emit('leave-room', roomId, user.id);
    }
    router.push('/interview');
  };

  // 初始化用户和房间
  useEffect(() => {
    const savedUser = localStorage.getItem('interview_user');
    if (!savedUser) {
      router.push('/interview');
      return;
    }

    const userData = JSON.parse(savedUser);
    setUser(userData);
    loadRoom();
  }, [roomId, router, loadRoom]);

  // Socket连接和房间加入
  useEffect(() => {
    if (socket && user && room && isConnected) {
      // 加入房间
      socket.emit('join-room', roomId, user.id);

      // 监听用户加入/离开
      const handleUserJoined = (data: { userId: string }) => {
        setConnectedUsers(prev => [...prev.filter(id => id !== data.userId), data.userId]);
      };

      const handleUserLeft = (data: { userId: string }) => {
        setConnectedUsers(prev => prev.filter(id => id !== data.userId));
      };

      // 监听语言切换
      const handleLanguageUpdate = (data: { language: string; userId: string }) => {
        if (data.userId !== user.id) {
          setSelectedLanguage(data.language);
        }
      };

      // 监听面试状态更新
      const handleStatusUpdate = (data: { status: string }) => {
        setRoom(prev => prev ? { ...prev, status: data.status as Room['status'] } : null);
      };

      socket.on('user-joined', handleUserJoined);
      socket.on('user-left', handleUserLeft);
      socket.on('language-update', handleLanguageUpdate);
      socket.on('status-update', handleStatusUpdate);

      return () => {
        socket.off('user-joined', handleUserJoined);
        socket.off('user-left', handleUserLeft);
        socket.off('language-update', handleLanguageUpdate);
        socket.off('status-update', handleStatusUpdate);
        socket.emit('leave-room', roomId, user.id);
      };
    }
  }, [socket, user, room, isConnected, roomId]);

  if (isLoading) {
    return (
      <div className="h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">正在加载面试房间...</p>
        </div>
      </div>
    );
  }

  if (!room || !user || !socket) {
    return (
      <div className="h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            无法加载面试房间
          </h2>
          <Button onClick={() => router.push('/interview')}>
            返回首页
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      {/* 顶部工具栏 */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
              {room.title}
            </h1>
            <div className="flex items-center space-x-2">
              <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                room.status === 'waiting' ? 'bg-yellow-100 text-yellow-800' :
                room.status === 'active' ? 'bg-green-100 text-green-800' :
                room.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                'bg-red-100 text-red-800'
              }`}>
                {room.status === 'waiting' ? '等待中' :
                 room.status === 'active' ? '进行中' :
                 room.status === 'completed' ? '已完成' : '已取消'}
              </div>
              <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                <Users className="w-4 h-4 mr-1" />
                {connectedUsers.length + 1} 人在线
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* 语言选择 */}
            <div className="flex items-center space-x-2">
              <Settings className="w-4 h-4 text-gray-500" />
              <Select value={selectedLanguage} onValueChange={handleLanguageChange}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {languages.map(lang => (
                    <SelectItem key={lang.value} value={lang.value}>
                      {lang.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 面试控制 */}
            {user.role === 'interviewer' && (
              <Button
                onClick={toggleInterviewStatus}
                variant={room.status === 'active' ? 'destructive' : 'default'}
                size="sm"
              >
                {room.status === 'waiting' ? (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    开始面试
                  </>
                ) : room.status === 'active' ? (
                  <>
                    <Square className="w-4 h-4 mr-2" />
                    结束面试
                  </>
                ) : (
                  '面试已结束'
                )}
              </Button>
            )}

            {/* 离开房间 */}
            <Button variant="outline" onClick={leaveRoom} size="sm">
              <LogOut className="w-4 h-4 mr-2" />
              离开房间
            </Button>
          </div>
        </div>

        {room.description && (
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            {room.description}
          </p>
        )}
      </div>

      {/* 主要内容区域 */}
      <div className="flex-1 p-6">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          {/* 左侧：代码编辑器 */}
          <ResizablePanel defaultSize={50} minSize={30}>
            <div className="h-full bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center">
                <Code className="w-4 h-4 mr-2 text-gray-500" />
                <span className="font-medium text-gray-900 dark:text-white">代码编辑器</span>
              </div>
              <div className="h-[calc(100%-57px)]">
                <CollaborativeEditor
                  roomId={roomId}
                  userId={user.id}
                  initialCode={currentCode}
                  language={selectedLanguage}
                  socket={socket}
                  onCodeChange={handleCodeChange}
                />
              </div>
            </div>
          </ResizablePanel>

          <ResizableHandle />

          {/* 右侧：视频和聊天 */}
          <ResizablePanel defaultSize={50} minSize={30}>
            <ResizablePanelGroup direction="vertical">
              {/* 视频通话 */}
              <ResizablePanel defaultSize={60} minSize={30}>
                <div className="h-full bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center">
                    <Video className="w-4 h-4 mr-2 text-gray-500" />
                    <span className="font-medium text-gray-900 dark:text-white">视频通话</span>
                  </div>
                  <div className="h-[calc(100%-57px)]">
                    <VideoCall
                      roomId={roomId}
                      userId={user.id}
                      socket={socket}
                      isInitiator={user.role === 'interviewer'}
                    />
                  </div>
                </div>
              </ResizablePanel>

              <ResizableHandle />

              {/* 聊天 */}
              <ResizablePanel defaultSize={40} minSize={20}>
                <div className="h-full bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center">
                    <MessageSquare className="w-4 h-4 mr-2 text-gray-500" />
                    <span className="font-medium text-gray-900 dark:text-white">聊天</span>
                  </div>
                  <div className="h-[calc(100%-57px)]">
                    <InterviewChat
                      roomId={roomId}
                      userId={user.id}
                      userName={user.name}
                      socket={socket}
                    />
                  </div>
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
}