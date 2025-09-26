'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Video, Users, Code, Calendar, AlertCircle } from 'lucide-react';

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
  created_at: string;
  interviewer?: {
    name: string;
    email: string;
  };
}

export default function JoinRoom() {
  const params = useParams();
  const router = useRouter();
  const roomId = params?.id as string;

  const [room, setRoom] = useState<Room | null>(null);
  const [user, setUser] = useState<InterviewUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [loginForm, setLoginForm] = useState({
    name: '',
    email: ''
  });

  // 加载房间信息
  useEffect(() => {
    const loadRoom = async () => {
      try {
        const response = await fetch(`/api/interview/rooms/${roomId}`);
        if (response.ok) {
          const data = await response.json();
          setRoom(data.room);
          
          // 检查用户是否已登录
          const savedUser = localStorage.getItem('interview_user');
          if (savedUser) {
            const userData = JSON.parse(savedUser);
            setUser(userData);
            
            // 如果是面试官，直接跳转到房间
            if (userData.role === 'interviewer') {
              router.push(`/interview/${roomId}`);
              return;
            }
          } else {
            setShowLoginForm(true);
          }
        } else if (response.status === 404) {
          alert('房间不存在或已删除');
          router.push('/interview');
        } else {
          throw new Error('Failed to load room');
        }
      } catch (error) {
        console.error('Error loading room:', error);
        alert('加载房间信息失败');
        router.push('/interview');
      } finally {
        setIsLoading(false);
      }
    };

    if (roomId) {
      loadRoom();
    }
  }, [roomId, router]);

  // 处理面试者登录
  const handleCandidateLogin = async () => {
    if (!loginForm.name.trim() || !loginForm.email.trim()) {
      alert('请填写姓名和邮箱');
      return;
    }

    try {
      const response = await fetch('/api/interview/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...loginForm,
          role: 'candidate'
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        localStorage.setItem('interview_user', JSON.stringify(data.user));
        setShowLoginForm(false);
      } else {
        const errorData = await response.json();
        alert(errorData.error || '登录失败，请重试');
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('登录失败，请检查网络连接');
    }
  };

  // 加入房间
  const joinRoom = async () => {
    if (!user || !room) return;

    setIsJoining(true);
    try {
      const response = await fetch(`/api/interview/rooms/${roomId}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          candidateId: user.id
        }),
      });

      if (response.ok) {
        // 成功加入房间，跳转到面试页面
        router.push(`/interview/${roomId}`);
      } else {
        const errorData = await response.json();
        alert(errorData.error || '加入房间失败，请重试');
      }
    } catch (error) {
      console.error('Error joining room:', error);
      alert('加入房间失败，请检查网络连接');
    } finally {
      setIsJoining(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="w-16 h-16 mx-auto text-red-500 mb-4" />
              <h2 className="text-xl font-semibold mb-2">房间不存在</h2>
              <p className="text-gray-600 mb-4">
                抱歉，您要访问的面试房间不存在或已删除。
              </p>
              <Button onClick={() => router.push('/interview')}>
                返回首页
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 如果需要登录
  if (showLoginForm) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          {/* 房间信息预览 */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Video className="w-6 h-6 mr-2 text-blue-600" />
                您被邀请参加面试
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <h3 className="font-semibold text-lg mb-2">{room.title}</h3>
                {room.description && (
                  <p className="text-gray-600 dark:text-gray-300 mb-3">
                    {room.description}
                  </p>
                )}
                <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center">
                    <Code className="w-4 h-4 mr-1" />
                    {room.language}
                  </div>
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    {new Date(room.created_at).toLocaleDateString('zh-CN')}
                  </div>
                  {room.interviewer && (
                    <div className="flex items-center">
                      <Users className="w-4 h-4 mr-1" />
                      面试官: {room.interviewer.name}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 登录表单 */}
          <Card>
            <CardHeader>
              <CardTitle>请输入您的信息</CardTitle>
              <CardDescription>
                作为面试者加入此面试房间
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">姓名</Label>
                <Input
                  id="name"
                  value={loginForm.name}
                  onChange={(e) => setLoginForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="请输入您的姓名"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">邮箱</Label>
                <Input
                  id="email"
                  type="email"
                  value={loginForm.email}
                  onChange={(e) => setLoginForm(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="请输入您的邮箱地址"
                />
              </div>
              <div className="flex space-x-2">
                <Button 
                  onClick={() => router.push('/interview')}
                  variant="outline"
                  className="flex-1"
                >
                  取消
                </Button>
                <Button 
                  onClick={handleCandidateLogin} 
                  className="flex-1"
                  disabled={!loginForm.name.trim() || !loginForm.email.trim()}
                >
                  加入面试
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // 如果已登录，显示确认加入页面
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Video className="w-6 h-6 mr-2 text-blue-600" />
              确认加入面试房间
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-6">
              <h3 className="font-semibold text-lg mb-2">{room.title}</h3>
              {room.description && (
                <p className="text-gray-600 dark:text-gray-300 mb-3">
                  {room.description}
                </p>
              )}
              <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center">
                  <Code className="w-4 h-4 mr-1" />
                  {room.language}
                </div>
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  {new Date(room.created_at).toLocaleDateString('zh-CN')}
                </div>
                {room.interviewer && (
                  <div className="flex items-center">
                    <Users className="w-4 h-4 mr-1" />
                    面试官: {room.interviewer.name}
                  </div>
                )}
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg mb-6">
              <h4 className="font-medium mb-2">您的信息</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                姓名: {user?.name} | 邮箱: {user?.email}
              </p>
            </div>

            <div className="flex space-x-2">
              <Button 
                onClick={() => router.push('/interview')}
                variant="outline"
                className="flex-1"
              >
                取消
              </Button>
              <Button 
                onClick={joinRoom}
                className="flex-1"
                disabled={isJoining}
              >
                {isJoining ? '加入中...' : '确认加入'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}