/**
 * Public Chat Page
 *
 * หน้าแชทสำหรับผู้ที่สนใจเช่าหอพัก
 *
 * @module app/chat/page
 */

'use client';

import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  message: string;
  timestamp: Date;
  isAdmin: boolean;
}

export default function ChatPage() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [userName, setUserName] = useState('');
  const [showNameModal, setShowNameModal] = useState(true);
  const [roomId, setRoomId] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Check for existing session
    const storedName = localStorage.getItem('chatUserName');
    const storedSessionId = localStorage.getItem('chatSessionId');

    if (storedName && storedSessionId) {
      setUserName(storedName);
      setRoomId(storedSessionId);
      setShowNameModal(false);
    }
  }, []);

  useEffect(() => {
    if (!showNameModal && userName) {
      // Initialize socket connection to public chat namespace
      const newSocket = io(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/public-chat`, {
        transports: ['websocket', 'polling'],
      });

      newSocket.on('connect', () => {
        console.log('Connected to chat server');
        setIsConnected(true);

        // Use existing or create new session ID
        let currentRoomId = roomId;
        if (!currentRoomId) {
          currentRoomId = localStorage.getItem('chatSessionId') || `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          setRoomId(currentRoomId);
          localStorage.setItem('chatSessionId', currentRoomId);
          localStorage.setItem('chatUserName', userName);
        }

        newSocket.emit('join_private_chat', {
          name: userName,
          roomId: currentRoomId
        });

        // Store socket ID map if needed, but primarily use isAdmin flag for UI
        (newSocket as any).data = { roomId: currentRoomId };
      });

      newSocket.on('disconnect', () => {
        console.log('Disconnected from chat server');
        setIsConnected(false);
      });

      newSocket.on('message', (message: Message) => {
        setMessages(prev => [...prev, message]);
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
      };
    }
  }, [showNameModal, userName]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();

    if (!socket || !newMessage.trim()) return;

    socket.emit('send_message', {
      message: newMessage.trim(),
    });

    setNewMessage('');
  };

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (userName.trim()) {
      setShowNameModal(false);
    }
  };

  if (showNameModal) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center py-12">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-primary-100">
                <span className="text-2xl">💬</span>
              </div>
              <h2 className="mt-6 text-2xl font-bold text-gray-900">
                แชทกับทีมงานหอพัก
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                กรุณาป้อนชื่อของคุณเพื่อเริ่มการสนทนา
              </p>
            </div>
            <form onSubmit={handleNameSubmit} className="mt-8 space-y-6">
              <div>
                <label htmlFor="name" className="sr-only">
                  ชื่อของคุณ
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                  placeholder="กรุณาป้อนชื่อของคุณ"
                />
              </div>
              <div>
                <button
                  type="submit"
                  className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  เริ่มแชท
                </button>
              </div>
            </form>
            <div className="mt-6 text-center">
              <p className="text-xs text-gray-500">
                การสนทนาจะถูกบันทึกเพื่อให้บริการที่ดีที่สุด
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex flex-col h-[calc(100vh-200px)]">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center">
                    <span className="text-white font-medium">🏢</span>
                  </div>
                </div>
                <div className="ml-3">
                  <h1 className="text-lg font-medium text-gray-900">
                    แชทกับทีมงานหอพัก
                  </h1>
                  <p className="text-sm text-gray-500">
                    สวัสดี {userName} • {isConnected ? '🟢 ออนไลน์' : '🔴 ออฟไลน์'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  socket?.disconnect();
                  // Clear session storage so user can start fresh
                  localStorage.removeItem('chatUserName');
                  localStorage.removeItem('chatSessionId');
                  setShowNameModal(true);
                  setUserName('');
                  setRoomId(''); // Clear the ID from memory too!
                  setMessages([]);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
          <div className="bg-white rounded-lg shadow h-full flex flex-col">
            {/* Messages */}
            <div className="flex-1 p-4 overflow-y-auto">
              {messages.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-gray-400 mb-4">
                    <span className="text-4xl">💬</span>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    ยินดีต้อนรับสู่การแชท
                  </h3>
                  <p className="text-gray-500">
                    ส่งข้อความเพื่อเริ่มสนทนากับทีมงานหอพัก
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${!message.isAdmin ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${!message.isAdmin
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-100 text-gray-900'
                          }`}
                      >
                        <div className="flex items-center mb-1">
                          <span className="text-xs font-medium">
                            {message.senderName}
                            {message.isAdmin && (
                              <span className="ml-1 text-xs">👑</span>
                            )}
                          </span>
                        </div>
                        <p className="text-sm">{message.message}</p>
                        <p className={`text-xs mt-1 ${message.senderId === socket?.id
                          ? 'text-primary-100'
                          : 'text-gray-500'
                          }`}>
                          {new Date(message.timestamp).toLocaleTimeString('th-TH', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Message Input */}
            <div className="border-t p-4">
              {!isConnected && (
                <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <p className="text-sm text-yellow-800">
                    🔴 กำลังพยายามเชื่อมต่อ... กรุณารอสักครู่
                  </p>
                </div>
              )}
              <form onSubmit={handleSendMessage} className="flex space-x-3">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="พิมพ์ข้อความของคุณ..."
                  disabled={!isConnected}
                  className="flex-1 border border-gray-300 rounded-md shadow-sm px-4 py-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
                <button
                  type="submit"
                  disabled={!isConnected || !newMessage.trim()}
                  className="bg-primary-600 text-white px-6 py-2 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  ส่ง
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Footer Info */}
        <div className="bg-white border-t">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="text-center text-sm text-gray-500">
              <p>
                💡 สอบถามข้อมูลหอพัก, ราคาเช่า, ห้องว่าง หรือข้อมูลอื่นๆ ได้ที่นี่
              </p>
              <p className="mt-1">
                ทีมงานจะตอบกลับโดยเร็วที่สุดในเวลาทำการ (08:00-18:00 น.)
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
