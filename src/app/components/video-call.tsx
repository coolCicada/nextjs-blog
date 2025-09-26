'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Socket } from 'socket.io-client';
import SimplePeer from 'simple-peer';
import { Button } from '@/components/ui/button';
import { Video, VideoOff, Mic, MicOff, Phone, PhoneOff } from 'lucide-react';

interface VideoCallProps {
  roomId: string;
  userId: string;
  socket: Socket;
  isInitiator?: boolean;
}



export default function VideoCall({ roomId, userId, socket, isInitiator = false }: VideoCallProps) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [peer, setPeer] = useState<SimplePeer.Instance | null>(null);
  const [isCallActive, setIsCallActive] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  // 获取用户媒体流
  const getUserMedia = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 }
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        }
      });
      
      setLocalStream(stream);
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      
      return stream;
    } catch (error) {
      console.error('Error accessing media devices:', error);
      throw error;
    }
  }, []);

  // 开始通话
  const startCall = async () => {
    try {
      setIsConnecting(true);
      const stream = await getUserMedia();
      
      const peerConnection = new SimplePeer({
        initiator: isInitiator,
        trickle: false,
        stream: stream,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:global.stun.twilio.com:3478' }
          ]
        }
      });

      peerConnection.on('error', (err) => {
        console.error('Peer connection error:', err);
        setIsConnecting(false);
      });

      peerConnection.on('signal', (data) => {
        socket.emit('webrtc-offer', {
          roomId,
          offer: data,
          targetUserId: userId
        });
      });

      peerConnection.on('connect', () => {
        console.log('Peer connected!');
        setIsCallActive(true);
        setIsConnecting(false);
      });

      peerConnection.on('stream', (stream) => {
        console.log('Received remote stream');
        setRemoteStream(stream);
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = stream;
        }
      });

      peerConnection.on('close', () => {
        console.log('Peer connection closed');
        // 直接调用清理逻辑而不是endCall
        if (peer) {
          peer.destroy();
          setPeer(null);
        }
        
        if (localStream) {
          localStream.getTracks().forEach(track => track.stop());
          setLocalStream(null);
        }
        
        if (remoteStream) {
          remoteStream.getTracks().forEach(track => track.stop());
          setRemoteStream(null);
        }
        
        setIsCallActive(false);
        setIsConnecting(false);
      });

      setPeer(peerConnection);
    } catch (error) {
      console.error('Error starting call:', error);
      setIsConnecting(false);
    }
  };

  // 结束通话
  const endCall = useCallback(() => {
    if (peer) {
      peer.destroy();
      setPeer(null);
    }
    
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
    
    if (remoteStream) {
      remoteStream.getTracks().forEach(track => track.stop());
      setRemoteStream(null);
    }
    
    setIsCallActive(false);
    setIsConnecting(false);
    
    // 通知其他用户通话结束
    socket.emit('call-ended', { roomId, userId });
  }, [peer, localStream, remoteStream, socket, roomId, userId]);

  // 切换视频
  const toggleVideo = useCallback(() => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
      }
    }
  }, [localStream]);

  // 切换音频
  const toggleAudio = useCallback(() => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
      }
    }
  }, [localStream]);

  // Socket事件监听
  useEffect(() => {
    if (!socket) return;

    const handleWebRTCOffer = (data: { offer: any; fromUserId: string }) => {
      if (!peer && data.fromUserId !== userId) {
        // 如果是接收方，创建peer并设置远程描述
        getUserMedia().then(stream => {
          const peerConnection = new SimplePeer({
            initiator: false,
            trickle: false,
            stream: stream,
            config: {
              iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:global.stun.twilio.com:3478' }
              ]
            }
          });

          peerConnection.on('signal', (signalData) => {
            socket.emit('webrtc-answer', {
              roomId,
              answer: signalData,
              targetUserId: data.fromUserId
            });
          });

          peerConnection.on('connect', () => {
            setIsCallActive(true);
            setIsConnecting(false);
          });

          peerConnection.on('stream', (remoteStream) => {
            setRemoteStream(remoteStream);
            if (remoteVideoRef.current) {
              remoteVideoRef.current.srcObject = remoteStream;
            }
          });

          peerConnection.signal(data.offer);
          setPeer(peerConnection);
          setIsConnecting(true);
        });
      }
    };

    const handleWebRTCAnswer = (data: { answer: any; fromUserId: string }) => {
      if (peer && data.fromUserId !== userId) {
        peer.signal(data.answer);
      }
    };

    const handleCallEnded = (data: { userId: string }) => {
      if (data.userId !== userId) {
        endCall();
      }
    };

    socket.on('webrtc-offer', handleWebRTCOffer);
    socket.on('webrtc-answer', handleWebRTCAnswer);
    socket.on('call-ended', handleCallEnded);

    return () => {
      socket.off('webrtc-offer', handleWebRTCOffer);
      socket.off('webrtc-answer', handleWebRTCAnswer);
      socket.off('call-ended', handleCallEnded);
    };
  }, [socket, peer, userId, roomId, getUserMedia, endCall]);

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      endCall();
    };
  }, [endCall]);

  return (
    <div className="video-call-container flex flex-col h-full">
      {/* 视频区域 */}
      <div className="flex-1 relative bg-gray-900 rounded-lg overflow-hidden">
        {/* 远程视频 */}
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className={`w-full h-full object-cover ${remoteStream ? 'block' : 'hidden'}`}
        />
        
        {/* 本地视频 */}
        <div className="absolute top-4 right-4 w-32 h-24 bg-gray-800 rounded-lg overflow-hidden border-2 border-white/20">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover ${isVideoEnabled ? 'block' : 'hidden'}`}
          />
          {!isVideoEnabled && (
            <div className="w-full h-full bg-gray-700 flex items-center justify-center">
              <VideoOff className="w-8 h-8 text-gray-400" />
            </div>
          )}
        </div>

        {/* 连接状态 */}
        {isConnecting && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="text-white text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
              <p>连接中...</p>
            </div>
          </div>
        )}

        {/* 无视频时的占位符 */}
        {!remoteStream && !isConnecting && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-gray-400">
              <Video className="w-16 h-16 mx-auto mb-4" />
              <p>等待对方加入...</p>
            </div>
          </div>
        )}
      </div>

      {/* 控制按钮 */}
      <div className="p-4 bg-gray-100 dark:bg-gray-800 flex justify-center space-x-4">
        {!isCallActive && !isConnecting ? (
          <Button onClick={startCall} className="bg-green-500 hover:bg-green-600 text-white">
            <Phone className="w-4 h-4 mr-2" />
            开始通话
          </Button>
        ) : (
          <>
            <Button
              onClick={toggleAudio}
              variant={isAudioEnabled ? "default" : "destructive"}
              size="sm"
            >
              {isAudioEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
            </Button>
            
            <Button
              onClick={toggleVideo}
              variant={isVideoEnabled ? "default" : "destructive"}
              size="sm"
            >
              {isVideoEnabled ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
            </Button>
            
            <Button onClick={endCall} variant="destructive" size="sm">
              <PhoneOff className="w-4 h-4 mr-2" />
              结束通话
            </Button>
          </>
        )}
      </div>
    </div>
  );
}