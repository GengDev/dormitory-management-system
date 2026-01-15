/**
 * Admin Chat Page
 *
 * หน้าแชทสำหรับ admin ในการตอบกลับผู้ใช้
 *
 * @module app/admin/chat/page
 */

'use client';

import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import ProtectedRoute from '@/components/ProtectedRoute';
import AdminLayout from '@/components/AdminLayout';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api'; // Added import

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  message: string;
  timestamp: Date;
  isAdmin: boolean;
  roomId?: string;
}

interface Conversation {
  roomId: string;
  userName: string;
  lastMessage?: string;
  timestamp: Date;
  unreadCount?: number;
}

export default function AdminChatPage() {
  const { user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentRoomId, setCurrentRoomIdState] = useState<string | null>(null);
  const currentRoomIdRef = useRef<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const setCurrentRoomId = (id: string | null) => {
    currentRoomIdRef.current = id;
    setCurrentRoomIdState(id);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Check authentication
    if (user && user.role !== 'admin') {
      window.location.href = '/admin';
      return;
    }

    if (user?.role === 'admin') {
      // Fetch initial conversations
      const fetchConversations = async () => {
        try {
          const response = await api.get('/api/chat/rooms');
          if (response.data.success) {
            setConversations(response.data.data.map((room: any) => ({
              roomId: room.id,
              userName: room.guestName || room.tenant?.fullName || room.guest?.fullName || room.user?.fullName || 'Unknown User',
              lastMessage: room.lastMessage, // Assuming API returns this or we need to adjust
              timestamp: new Date(room.updatedAt || room.createdAt),
              unreadCount: room.unreadCount || 0
            })));
          }
        } catch (error) {
          console.error('Failed to fetch conversations:', error);
        }
      };

      fetchConversations();

      // Initialize socket connection to public chat namespace
      const newSocket = io(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/public-chat`, {
        transports: ['websocket', 'polling'],
      });

      newSocket.on('connect', () => {
        console.log('Admin connected to chat system');
        setIsConnected(true);
        // Admin joins admin room to receive notifications
        newSocket.emit('join_admin_room', {
          name: user.fullName || 'Admin',
          isAdmin: true
        });
      });

      newSocket.on('disconnect', () => {
        console.log('Admin disconnected from chat');
        setIsConnected(false);
      });

      newSocket.on('message', (message: Message) => {
        const activeRoomId = currentRoomIdRef.current;
        console.log('Received message:', message);
        console.log('Current Room ID (Ref):', activeRoomId);
        console.log('Match?', message.roomId === activeRoomId);

        // Only show messages from current room
        if (message.roomId === activeRoomId) {
          setMessages(prev => [...prev, message]);
        }
        // Update conversation last message
        setConversations(prev => {
          // Move updated conversation to top
          const otherConvs = prev.filter(c => c.roomId !== message.roomId);
          const updatedConv = prev.find(c => c.roomId === message.roomId);

          if (updatedConv) {
            return [{
              ...updatedConv,
              lastMessage: message.message,
              timestamp: new Date(message.timestamp),
              unreadCount: message.roomId === activeRoomId ? 0 : (updatedConv.unreadCount || 0) + 1
            }, ...otherConvs];
          }
          return prev;
        });
      });

      newSocket.on('new_conversation', (data: { roomId: string; userName: string; timestamp: string }) => {
        setConversations(prev => {
          const existing = prev.find(c => c.roomId === data.roomId);
          if (existing) return prev;

          return [{
            roomId: data.roomId,
            userName: data.userName,
            timestamp: new Date(data.timestamp),
            unreadCount: 1,
          }, ...prev];
        });
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
      };
    }
  }, [user]);

  // Fetch messages when selecting a conversation
  useEffect(() => {
    if (currentRoomId && user?.role === 'admin') {
      const fetchMessages = async () => {
        try {
          const response = await api.get(`/api/chat/rooms/${currentRoomId}/messages`);
          if (response.data.success) {
            setMessages(response.data.data.map((msg: any) => ({
              id: msg.id,
              senderId: msg.senderId,
              senderName: msg.sender?.fullName || 'User',
              message: msg.message,
              timestamp: new Date(msg.createdAt),
              isAdmin: msg.isAdmin, // Use the DB flag directly
              roomId: msg.chatRoomId
            })));
          }
        } catch (error) {
          console.error('Failed to fetch messages:', error);
        }
      };

      fetchMessages();

      // Reset unread count locally
      setConversations(prev => prev.map(c =>
        c.roomId === currentRoomId ? { ...c, unreadCount: 0 } : c
      ));
    }
  }, [currentRoomId, user]);

  const selectConversation = (roomId: string) => {
    setCurrentRoomId(roomId);
    // Messages will be fetched by the useEffect above
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!socket || !newMessage.trim() || !currentRoomId) return;

    const msgPayload = {
      message: newMessage.trim(),
      roomId: currentRoomId,
      isAdmin: true,
    };

    socket.emit('send_message', msgPayload);

    // Optimistic update
    /* 
       Note: We don't have the real ID or timestamp yet, but can shim it. 
       However, if we append it here, and then receive it back from socket, we might get duplicates 
       if we don't handle ID deduping. 
       Socket broadcast normally includes the sender. 
       Let's trust the socket broadcast for now to ensure consistency, 
       BUT if the user says "doesn't appear", maybe broadcast isnt working.
       
       Let's trying deduping in the message handler instead?
       Actually, `send_message` does NOT verify receipt unless we use an ack.
       
       Let's stick to relying on the socket event, BUT verify why it might fail.
       If P2003 fixed, it should work.
       
       Wait, if I add optimistic update, I need to know the ID to dedupe.
       I'll skip optimistic update for now to avoid duplicates, 
       but I will add a log to confirm emit.
    */
    console.log('Sent message:', msgPayload);

    setNewMessage('');
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          </div>
          <h2 className="mt-6 text-center text-2xl font-bold text-gray-900">
            กำลังโหลด...
          </h2>
        </div>
      </div>
    );
  }

  return (
    <AdminLayout title="Chat Support">
      <div className="h-[calc(100vh-12rem)] flex">
        {/* Conversations Sidebar */}
        <div className="w-80 bg-white shadow rounded-lg mr-4 overflow-hidden">
          <div className="p-4 border-b">
            <h3 className="text-lg font-medium text-gray-900">Active Conversations</h3>
            <p className="text-sm text-gray-500">เลือกการสนทนาที่ต้องการตอบ</p>
          </div>
          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <div className="text-4xl mb-2">💬</div>
                <p>ยังไม่มีผู้ใช้ติดต่อมา</p>
              </div>
            ) : (
              conversations.map((conversation) => (
                <div
                  key={conversation.roomId}
                  onClick={() => selectConversation(conversation.roomId)}
                  className={`p-4 border-b cursor-pointer hover:bg-gray-50 ${currentRoomId === conversation.roomId ? 'bg-primary-50 border-primary-200' : ''
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{conversation.userName}</p>
                      {conversation.lastMessage && (
                        <p className="text-sm text-gray-500 truncate">{conversation.lastMessage}</p>
                      )}
                    </div>
                    {conversation.unreadCount && conversation.unreadCount > 0 && (
                      <div className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {conversation.unreadCount}
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    {conversation.timestamp.toLocaleString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Chat Header */}
          <div className="bg-white shadow rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-medium text-gray-900">
                  {currentRoomId ? `สนทนากับ ${conversations.find(c => c.roomId === currentRoomId)?.userName || 'User'}` : 'เลือกการสนทนา'}
                </h2>
                <p className="text-sm text-gray-500">
                  ตอบกลับข้อความจากผู้ใช้
                </p>
              </div>
              <div className="flex items-center space-x-4">
                {/* Debug Info */}
                <div className="text-xs text-gray-400 bg-gray-100 p-1 rounded hidden md:block">
                  Room: {currentRoomId?.substring(0, 8)}...
                </div>
                <div className={`flex items-center space-x-2 ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
                  <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-600' : 'bg-red-600'}`}></div>
                  <span className="text-sm">{isConnected ? 'เชื่อมต่อแล้ว' : 'ไม่ได้เชื่อมต่อ'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 bg-white shadow rounded-lg overflow-hidden">
            <div className="h-full flex flex-col">
              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {!currentRoomId ? (
                  <div className="text-center text-gray-500 py-8">
                    <div className="text-4xl mb-4">👈</div>
                    <p>เลือกการสนทนาจากด้านซ้ายเพื่อเริ่มตอบข้อความ</p>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    <div className="text-4xl mb-4">💬</div>
                    <p>ยังไม่มีข้อความในสนทนานี้</p>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.isAdmin ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${message.isAdmin
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-100 text-gray-900'
                          }`}
                      >
                        <div className="flex items-center space-x-2 mb-1">
                          <span className={`text-xs font-medium ${message.isAdmin ? 'text-primary-100' : 'text-gray-600'}`}>
                            {message.senderName}
                            {message.isAdmin && (
                              <span className="ml-1 px-1.5 py-0.5 bg-primary-500 text-xs rounded">Admin</span>
                            )}
                          </span>
                          <span className={`text-xs ${message.isAdmin ? 'text-primary-200' : 'text-gray-500'}`}>
                            {new Date(message.timestamp).toLocaleTimeString('th-TH', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                        <p className="text-sm">{message.message}</p>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="border-t p-4">
                <form onSubmit={handleSendMessage} className="flex space-x-4">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder={currentRoomId ? "พิมพ์ข้อความตอบกลับ..." : "เลือกการสนทนาก่อน"}
                    className="flex-1 border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    disabled={!isConnected || !currentRoomId}
                  />
                  <button
                    type="submit"
                    disabled={!isConnected || !currentRoomId || !newMessage.trim()}
                    className="bg-primary-600 text-white px-6 py-2 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    ส่ง
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
