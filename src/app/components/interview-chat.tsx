'use client';

import { useEffect, useRef, useState } from 'react';
import { Socket } from 'socket.io-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send } from 'lucide-react';

interface InterviewChatProps {
  roomId: string;
  userId: string;
  userName: string;
  socket: Socket;
  className?: string;
}

interface DisplayMessage {
  id: string;
  roomId: string;
  userId: string;
  user_name: string;
  message: string;
  type: 'text' | 'system';
  timestamp: Date;
  user_avatar?: string;
}

export default function InterviewChat({ 
  roomId, 
  userId, 
  userName, 
  socket, 
  className = 'w-full h-full' 
}: InterviewChatProps) {
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // 发送消息
  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    const messageText = newMessage.trim();
    setNewMessage('');

    try {
      // 通过Socket实时发送
      socket.emit('chat-message', {
        roomId,
        message: messageText,
        userId,
        userName
      });

      // 同时保存到数据库
      const response = await fetch(`/api/interview/rooms/${roomId}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          message: messageText,
          type: 'text'
        }),
      });

      if (!response.ok) {
        console.error('Failed to save message to database');
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  // 处理键盘事件
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // 格式化时间
  const formatTime = (timestamp: Date | number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('zh-CN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // 加载聊天历史
  useEffect(() => {
    const loadChatHistory = async () => {
      try {
        const response = await fetch(`/api/interview/rooms/${roomId}/chat`);
        if (response.ok) {
          const data = await response.json();
          setMessages(data.messages || []);
        }
      } catch (error) {
        console.error('Error loading chat history:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadChatHistory();
  }, [roomId]);

  // Socket事件监听
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (data: {
      id: string;
      message: string;
      userId: string;
      userName: string;
      timestamp: number;
    }) => {
      const newMsg: DisplayMessage = {
        id: data.id,
        roomId: roomId,
        userId: data.userId,
        user_name: data.userName,
        message: data.message,
        type: 'text',
        timestamp: new Date(data.timestamp)
      };
      
      setMessages(prev => [...prev, newMsg]);
    };

    const handleSystemMessage = (data: { message: string; type: string }) => {
      const systemMsg: DisplayMessage = {
        id: Date.now().toString(),
        roomId: roomId,
        userId: 'system',
        user_name: 'System',
        message: data.message,
        type: 'system',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, systemMsg]);
    };

    socket.on('new-message', handleNewMessage);
    socket.on('system-message', handleSystemMessage);

    return () => {
      socket.off('new-message', handleNewMessage);
      socket.off('system-message', handleSystemMessage);
    };
  }, [socket, roomId]);

  // 自动滚动到底部
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 聚焦输入框
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  if (isLoading) {
    return (
      <div className={`${className} flex items-center justify-center`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className={`${className} flex flex-col bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg`}>
      {/* 聊天标题 */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          面试聊天
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {messages.length} 条消息
        </p>
      </div>

      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-400 py-8">
            <p>暂无消息，开始聊天吧！</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.userId === userId ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.type === 'system'
                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-center text-sm italic mx-auto'
                    : message.userId === userId
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                }`}
              >
                {message.type !== 'system' && message.userId !== userId && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                    {message.user_name}
                  </div>
                )}
                <p className="break-words">{message.message}</p>
                <div
                  className={`text-xs mt-1 ${
                    message.type === 'system'
                      ? 'text-gray-500'
                      : message.userId === userId
                      ? 'text-blue-100'
                      : 'text-gray-500 dark:text-gray-400'
                  }`}
                >
                  {formatTime(message.timestamp)}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 输入区域 */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex space-x-2">
          <Input
            ref={inputRef}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="输入消息..."
            className="flex-1"
            maxLength={500}
          />
          <Button 
            onClick={sendMessage} 
            disabled={!newMessage.trim()}
            size="sm"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          按 Enter 发送，Shift+Enter 换行
        </div>
      </div>
    </div>
  );
}