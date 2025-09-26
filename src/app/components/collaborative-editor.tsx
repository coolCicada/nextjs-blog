'use client';

import { useEffect, useRef, useState } from 'react';
import Editor from '@monaco-editor/react';
import { Socket } from 'socket.io-client';
import { CursorPosition } from '@/lib/types';

interface CollaborativeEditorProps {
  roomId: string;
  userId: string;
  initialCode?: string;
  language: string;
  socket: Socket;
  onCodeChange?: (code: string) => void;
  className?: string;
}

interface RemoteCursor {
  userId: string;
  position: CursorPosition;
  color: string;
}

// 用户颜色映射
const userColors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#f0932b', '#eb4d4b'];
const getUserColor = (uid: string) => {
  const hash = uid.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  return userColors[Math.abs(hash) % userColors.length];
};

export default function CollaborativeEditor({
  roomId,
  userId,
  initialCode = '',
  language,
  socket,
  onCodeChange,
  className = 'w-full h-full'
}: CollaborativeEditorProps) {
  const editorRef = useRef<any>(null);
  const [code, setCode] = useState(initialCode);
  const [remoteCursors, setRemoteCursors] = useState<RemoteCursor[]>([]);
  const [isRemoteChange, setIsRemoteChange] = useState(false);

  function handleEditorDidMount(editor: any, monaco: any) {
    editorRef.current = editor;

    // 监听代码变化
    editor.onDidChangeModelContent(() => {
      if (!isRemoteChange) {
        const currentCode = editor.getValue();
        setCode(currentCode);
        
        // 发送代码变化到其他用户
        socket.emit('code-change', {
          roomId,
          content: currentCode,
          userId,
          language
        });

        onCodeChange?.(currentCode);
      }
      setIsRemoteChange(false);
    });

    // 监听光标位置变化
    editor.onDidChangeCursorPosition((e: any) => {
      const position = {
        line: e.position.lineNumber,
        column: e.position.column
      };
      
      socket.emit('cursor-change', {
        roomId,
        position,
        userId
      });
    });

    // 设置编辑器选项
    monaco.editor.defineTheme('interview-theme', {
      base: 'vs-dark',
      inherit: true,
      rules: [],
      colors: {
        'editor.background': '#1e1e1e',
        'editor.foreground': '#d4d4d4',
        'editorCursor.foreground': '#569cd6',
        'editor.selectionBackground': '#264f78',
        'editor.lineHighlightBackground': '#2a2d2e'
      }
    });
    
    monaco.editor.setTheme('interview-theme');
  }

  // 监听Socket事件
  useEffect(() => {
    if (!socket) return;

    // 接收代码更新
    const handleCodeUpdate = (data: { content: string; userId: string; language: string }) => {
      if (data.userId !== userId && editorRef.current) {
        setIsRemoteChange(true);
        const editor = editorRef.current;
        const currentPosition = editor.getPosition();
        
        // 更新代码但保持当前光标位置
        editor.setValue(data.content);
        setCode(data.content);
        
        if (currentPosition) {
          editor.setPosition(currentPosition);
        }
      }
    };

    // 接收光标位置更新
    const handleCursorUpdate = (data: { position: CursorPosition; userId: string; socketId: string }) => {
      if (data.userId !== userId) {
        setRemoteCursors(prev => {
          const filtered = prev.filter(cursor => cursor.userId !== data.userId);
          return [...filtered, {
            userId: data.userId,
            position: data.position,
            color: getUserColor(data.userId)
          }];
        });
      }
    };

    // 用户离开房间时清理光标
    const handleUserLeft = (data: { userId: string }) => {
      setRemoteCursors(prev => prev.filter(cursor => cursor.userId !== data.userId));
    };

    socket.on('code-update', handleCodeUpdate);
    socket.on('cursor-update', handleCursorUpdate);
    socket.on('user-left', handleUserLeft);

    return () => {
      socket.off('code-update', handleCodeUpdate);
      socket.off('cursor-update', handleCursorUpdate);
      socket.off('user-left', handleUserLeft);
    };
  }, [socket, userId, roomId]);

  // 渲染远程光标
  useEffect(() => {
    if (!editorRef.current) return;

    const editor = editorRef.current;
    const decorations: any[] = [];

    remoteCursors.forEach(cursor => {
      decorations.push({
        range: {
          startLineNumber: cursor.position.line,
          startColumn: cursor.position.column,
          endLineNumber: cursor.position.line,
          endColumn: cursor.position.column + 1
        },
        options: {
          className: 'remote-cursor',
          stickiness: 1,
          beforeContentClassName: 'remote-cursor-line',
          glyphMarginClassName: 'remote-cursor-glyph',
          afterContentClassName: 'remote-cursor-label',
        }
      });
    });

    editor.deltaDecorations([], decorations);
  }, [remoteCursors]);

  return (
    <div className={className}>
      <style jsx global>{`
        .remote-cursor-line {
          position: relative;
        }
        .remote-cursor-line::before {
          content: '';
          position: absolute;
          top: 0;
          left: -1px;
          width: 2px;
          height: 20px;
          background-color: var(--cursor-color, #ff6b6b);
          z-index: 1000;
        }
        .remote-cursor-label::after {
          content: attr(data-user);
          position: absolute;
          top: -20px;
          left: -1px;
          padding: 2px 6px;
          background-color: var(--cursor-color, #ff6b6b);
          color: white;
          font-size: 11px;
          border-radius: 3px;
          white-space: nowrap;
          z-index: 1001;
        }
      `}</style>
      
      <Editor
        height="100%"
        language={language}
        value={code}
        onMount={handleEditorDidMount}
        options={{
          theme: 'interview-theme',
          fontSize: 14,
          fontFamily: 'Menlo, Monaco, "Courier New", monospace',
          minimap: { enabled: true },
          scrollBeyondLastLine: false,
          automaticLayout: true,
          wordWrap: 'on',
          lineNumbers: 'on',
          folding: true,
          selectOnLineNumbers: true,
          matchBrackets: 'always',
          autoClosingBrackets: 'always',
          autoClosingQuotes: 'always',
          suggestOnTriggerCharacters: true,
          acceptSuggestionOnEnter: 'on',
          tabSize: 2,
          insertSpaces: true,
        }}
      />
    </div>
  );
}