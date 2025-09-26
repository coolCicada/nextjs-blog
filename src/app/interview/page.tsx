'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Users, Calendar, Code, Video, Share2, WifiOff, RefreshCw } from 'lucide-react';

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
}

export default function InterviewDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<InterviewUser | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // 面试者加入房间表单状态
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [joinRoomId, setJoinRoomId] = useState('');
  
  // 网络状态
  const [networkError, setNetworkError] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);

  // 创建房间表单状态
  const [newRoom, setNewRoom] = useState({
    title: '',
    description: '',
    language: 'javascript',
    initialCode: ''
  });

  // 用户登录/注册
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [loginForm, setLoginForm] = useState({
    name: '',
    email: '',
    role: 'interviewer' as 'interviewer' | 'candidate'
  });

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

  // 初始代码模板
  const getInitialCode = (language: string) => {
    const templates = {
      javascript: `// JavaScript 面试代码
function solution() {
  // 在这里编写你的代码
  return null;
}

// 测试
console.log(solution());`,
      python: `# Python 面试代码
def solution():
    # 在这里编写你的代码
    return None

# 测试
print(solution())`,
      java: `// Java 面试代码
public class Solution {
    public static void main(String[] args) {
        Solution sol = new Solution();
        System.out.println(sol.solution());
    }
    
    public String solution() {
        // 在这里编写你的代码
        return null;
    }
}`,
      cpp: `// C++ 面试代码
#include <iostream>
#include <vector>
using namespace std;

class Solution {
public:
    string solution() {
        // 在这里编写你的代码
        return "";
    }
};

int main() {
    Solution sol;
    cout << sol.solution() << endl;
    return 0;
}`,
      go: `// Go 面试代码
package main

import "fmt"

func solution() interface{} {
    // 在这里编写你的代码
    return nil
}

func main() {
    fmt.Println(solution())
}`,
      rust: `// Rust 面试代码
fn main() {
    println!("{:?}", solution());
}

fn solution() -> Option<String> {
    // 在这里编写你的代码
    None
}`,
      typescript: `// TypeScript 面试代码
function solution(): any {
  // 在这里编写你的代码
  return null;
}

// 测试
console.log(solution());`,
      php: `<?php
// PHP 面试代码
function solution() {
    // 在这里编写你的代码
    return null;
}

// 测试
var_dump(solution());
?>`
    };
    return templates[language as keyof typeof templates] || templates.javascript;
  };

  // 处理用户登录
  const handleLogin = async () => {
    try {
      const response = await fetch('/api/interview/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginForm),
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        localStorage.setItem('interview_user', JSON.stringify(data.user));
        setShowLoginForm(false);
        loadRooms(data.user.id);
      } else {
        alert('登录失败，请重试');
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('登录失败，请检查网络连接');
    }
  };

  // 加载房间列表
  const loadRooms = async (userId: string, retries = 3) => {
    setNetworkError(null); // 清除之前的错误
    
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        if (attempt > 1) {
          setIsRetrying(true);
        }
        
        console.log(`Loading rooms for user ${userId}, attempt ${attempt}`);
        const response = await fetch(`/api/interview/rooms?userId=${userId}`);
        
        if (response.ok) {
          const data = await response.json();
          setRooms(data.rooms || []);
          setNetworkError(null); // 清除错误状态
          setIsRetrying(false);
          console.log(`Loaded ${data.rooms?.length || 0} rooms`);
          return; // 成功加载，退出重试循环
        } else if (response.status === 503) {
          // 服务不可用，可以重试
          const data = await response.json();
          console.warn(`Service unavailable (attempt ${attempt}):`, data.error);
          setNetworkError('网络连接不稳定，正在重试...');
          
          if (attempt === retries) {
            // 最后一次尝试失败，显示友好错误信息
            setNetworkError('网络连接不稳定，请检查网络后手动刷新');
            setRooms([]); // 显示空列表而不是错误页面
          } else {
            // 等待后重试
            await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
            continue;
          }
        } else {
          // 其他错误
          const data = await response.json();
          console.error('Error response:', data);
          if (attempt === retries) {
            setNetworkError(data.error || '获取房间列表失败');
            setRooms([]);
          }
        }
      } catch (error: any) {
        console.error(`Network error (attempt ${attempt}):`, error);
        setNetworkError('网络连接出现问题');
        
        if (attempt === retries) {
          // 最后一次尝试仍然失败
          setNetworkError('网络连接出现问题，请检查网络后手动刷新');
          setRooms([]);
        } else {
          // 等待后重试
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
      }
    }
    
    setIsLoading(false);
    setIsRetrying(false);
  };

  // 创建房间
  const createRoom = async () => {
    if (!user || !newRoom.title.trim()) {
      alert('请填写房间标题');
      return;
    }

    setIsCreating(true);
    try {
      const response = await fetch('/api/interview/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: newRoom.title,
          description: newRoom.description,
          interviewerId: user.id,
          language: newRoom.language,
          initialCode: newRoom.initialCode || getInitialCode(newRoom.language),
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setRooms(prev => [data.room, ...prev]);
        setNewRoom({ title: '', description: '', language: 'javascript', initialCode: '' });
        setShowCreateForm(false);
        
        // 直接进入新创建的房间
        router.push(`/interview/${data.room.id}`);
      } else {
        // 显示服务器返回的具体错误信息
        const errorMessage = data.error || '创建房间失败，请重试';
        alert(errorMessage);
        console.error('Server error:', data);
      }
    } catch (error) {
      console.error('Network error creating room:', error);
      alert('创建房间失败，请检查网络连接');
    } finally {
      setIsCreating(false);
    }
  };

  // 加入房间
  const joinRoom = (roomId: string) => {
    router.push(`/interview/${roomId}`);
  };

  // 分享房间
  const shareRoom = (room: Room) => {
    const inviteUrl = `${window.location.origin}/interview/join/${room.id}`;
    navigator.clipboard.writeText(inviteUrl).then(() => {
      alert('邀请链接已复制到剪贴板！\n\n请将以下链接发送给面试者：\n' + inviteUrl);
    }).catch(() => {
      // 如果复制失败，显示链接让用户手动复制
      prompt('请复制以下邀请链接:', inviteUrl);
    });
  };

  // 通过房间ID加入
  const handleJoinByRoomId = () => {
    if (!joinRoomId.trim()) {
      alert('请输入房间ID');
      return;
    }
    router.push(`/interview/join/${joinRoomId.trim()}`);
  };

  // 手动刷新房间列表
  const handleRefresh = () => {
    if (user) {
      setIsLoading(true);
      loadRooms(user.id);
    }
  };

  // 获取房间状态标签
  const getStatusBadge = (status: string) => {
    const badges = {
      waiting: { text: '等待中', color: 'bg-yellow-100 text-yellow-800' },
      active: { text: '进行中', color: 'bg-green-100 text-green-800' },
      completed: { text: '已完成', color: 'bg-gray-100 text-gray-800' },
      cancelled: { text: '已取消', color: 'bg-red-100 text-red-800' }
    };
    const badge = badges[status as keyof typeof badges] || badges.waiting;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        {badge.text}
      </span>
    );
  };

  // 初始化用户状态
  useEffect(() => {
    const savedUser = localStorage.getItem('interview_user');
    if (savedUser) {
      const userData = JSON.parse(savedUser);
      setUser(userData);
      loadRooms(userData.id);
    } else {
      setIsLoading(false);
      setShowLoginForm(true);
    }
  }, []);

  // 如果需要登录
  if (showLoginForm) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">面试平台登录</CardTitle>
            <CardDescription className="text-center">
              请输入您的信息以开始使用面试平台
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
                placeholder="请输入您的邮箱"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">角色</Label>
              <Select value={loginForm.role} onValueChange={(value: 'interviewer' | 'candidate') => setLoginForm(prev => ({ ...prev, role: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="interviewer">面试官</SelectItem>
                  <SelectItem value="candidate">面试者</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button 
              onClick={handleLogin} 
              className="w-full"
              disabled={!loginForm.name || !loginForm.email}
            >
              进入平台
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-6xl mx-auto">
        {/* 头部 */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">面试平台</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              欢迎回来，{user?.name} ({user?.role === 'interviewer' ? '面试官' : '面试者'})
            </p>
            {networkError && (
              <div className="mt-2 flex items-center text-amber-600 dark:text-amber-400">
                <WifiOff className="w-4 h-4 mr-2" />
                <span className="text-sm">{networkError}</span>
                {!isRetrying && (
                  <Button
                    variant="link"
                    size="sm"
                    onClick={handleRefresh}
                    className="ml-2 p-0 h-auto text-amber-600 hover:text-amber-700"
                  >
                    <RefreshCw className="w-4 h-4 mr-1" />
                    重试
                  </Button>
                )}
              </div>
            )}
            {isRetrying && (
              <div className="mt-2 flex items-center text-blue-600 dark:text-blue-400">
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                <span className="text-sm">正在重新连接...</span>
              </div>
            )}
          </div>
          <div className="flex space-x-2">
            {user?.role === 'interviewer' && (
              <Button onClick={() => setShowCreateForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                创建面试房间
              </Button>
            )}
            {user?.role === 'candidate' && (
              <Button onClick={() => setShowJoinForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                加入面试房间
              </Button>
            )}
            <Button 
              variant="outline"
              onClick={handleRefresh}
              disabled={isLoading}
              title="刷新房间列表"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
            <Button 
              variant="outline"
              onClick={() => {
                localStorage.removeItem('interview_user');
                setUser(null);
                setShowLoginForm(true);
              }}
            >
              退出登录
            </Button>
          </div>
        </div>

        {/* 创建房间表单 */}
        {showCreateForm && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>创建新的面试房间</CardTitle>
              <CardDescription>
                设置面试房间的基本信息和编程环境
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">房间标题</Label>
                  <Input
                    id="title"
                    value={newRoom.title}
                    onChange={(e) => setNewRoom(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="例如：前端工程师面试"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="language">编程语言</Label>
                  <Select 
                    value={newRoom.language} 
                    onValueChange={(value) => setNewRoom(prev => ({ 
                      ...prev, 
                      language: value,
                      initialCode: getInitialCode(value)
                    }))}
                  >
                    <SelectTrigger>
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
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">房间描述（可选）</Label>
                <Textarea
                  id="description"
                  value={newRoom.description}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewRoom(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="描述面试的具体要求和内容..."
                  rows={3}
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowCreateForm(false);
                    setNewRoom({ title: '', description: '', language: 'javascript', initialCode: '' });
                  }}
                >
                  取消
                </Button>
                <Button 
                  onClick={createRoom}
                  disabled={!newRoom.title.trim() || isCreating}
                >
                  {isCreating ? '创建中...' : '创建房间'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 面试者加入房间表单 */}
        {showJoinForm && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>加入面试房间</CardTitle>
              <CardDescription>
                输入面试官提供的房间ID或邀请链接
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="roomId">房间ID</Label>
                <Input
                  id="roomId"
                  value={joinRoomId}
                  onChange={(e) => setJoinRoomId(e.target.value)}
                  placeholder="输入房间ID，如：123e4567-e89b-12d3-a456-426614174000"
                />
                <p className="text-sm text-gray-500">
                  面试官会通过邮件或其他方式提供房间ID给您
                </p>
              </div>

              <div className="flex justify-end space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowJoinForm(false);
                    setJoinRoomId('');
                  }}
                >
                  取消
                </Button>
                <Button 
                  onClick={handleJoinByRoomId}
                  disabled={!joinRoomId.trim()}
                >
                  加入房间
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 房间列表 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rooms.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <Code className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
                {user?.role === 'interviewer' ? '暂无面试房间' : '暂无参与的面试'}
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                {user?.role === 'interviewer' 
                  ? '点击"创建面试房间"开始您的第一次面试' 
                  : '等待面试官邀请您参加面试'
                }
              </p>
            </div>
          ) : (
            rooms.map((room) => (
              <Card key={room.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{room.title}</CardTitle>
                    {getStatusBadge(room.status)}
                  </div>
                  <CardDescription className="line-clamp-2">
                    {room.description || '无描述'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                    <div className="flex items-center">
                      <Code className="w-4 h-4 mr-2" />
                      {languages.find(lang => lang.value === room.language)?.label || room.language}
                    </div>
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-2" />
                      {new Date(room.created_at).toLocaleDateString('zh-CN')}
                    </div>
                    <div className="flex items-center">
                      <Users className="w-4 h-4 mr-2" />
                      {room.candidate_id ? '2 人' : '1 人'}
                    </div>
                  </div>
                  <div className="mt-4 flex space-x-2">
                    <Button 
                      onClick={() => joinRoom(room.id)}
                      className="flex-1"
                      size="sm"
                    >
                      <Video className="w-4 h-4 mr-2" />
                      进入房间
                    </Button>
                    {user?.role === 'interviewer' && user?.id === room.interviewer_id && (
                      <Button 
                        onClick={() => shareRoom(room)}
                        variant="outline"
                        size="sm"
                      >
                        <Share2 className="w-4 h-4 mr-2" />
                        分享
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}