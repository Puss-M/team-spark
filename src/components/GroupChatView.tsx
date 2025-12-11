'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useAppStore } from '../store/useAppStore';
import { supabase } from '../lib/supabase';
import { FiSend, FiUsers, FiHash, FiCopy } from 'react-icons/fi';

const GroupChatView: React.FC = () => {
  const { 
    activeSocialGroupId, 
    socialGroups, 
    groupMessages, 
    fetchSocialGroupMessages, 
    sendGroupMessage,
    username 
  } = useAppStore();
  
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const activeGroup = socialGroups.find(g => g.id === activeSocialGroupId);
  const messages = activeSocialGroupId ? (groupMessages[activeSocialGroupId] || []) : [];

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initial fetch and Realtime subscription
  useEffect(() => {
    if (!activeSocialGroupId) return;

    fetchSocialGroupMessages(activeSocialGroupId);

    // Subscribe to new messages
    const channel = supabase
      .channel(`group-chat:${activeSocialGroupId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'social_group_messages',
          filter: `group_id=eq.${activeSocialGroupId}`
        },
        (payload) => {
          console.log('New message received!', payload);
          // Re-fetch to simpler keep sync (or push to state manually if payload is complete)
          fetchSocialGroupMessages(activeSocialGroupId);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeSocialGroupId]);

  const handleSend = async () => {
    if (!input.trim() || !activeSocialGroupId) return;
    
    const content = input;
    setInput(''); // Clear input immediately
    
    await sendGroupMessage(activeSocialGroupId, content);
  };

  const copyInviteCode = () => {
    if (activeGroup?.invite_code) {
      navigator.clipboard.writeText(activeGroup.invite_code);
      alert('邀请码已复制：' + activeGroup.invite_code);
    }
  };

  if (!activeGroup) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        请选择一个小组
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
        <div>
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <FiUsers className="text-blue-500" />
            {activeGroup.name}
          </h2>
          <p className="text-sm text-gray-500 line-clamp-1">{activeGroup.description}</p>
        </div>
        <button 
          onClick={copyInviteCode}
          className="flex items-center gap-1 text-xs bg-blue-50 text-blue-600 px-3 py-1.5 rounded-full hover:bg-blue-100 transition-colors"
          title="点击复制邀请码"
        >
          <FiHash />
          邀请码: {activeGroup.invite_code}
          <FiCopy size={12} className="ml-1" />
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/30">
        {messages.length === 0 ? (
          <div className="text-center text-gray-400 mt-10">
            <p>暂无消息，开始讨论吧！</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.user_name === username;
            return (
              <div 
                key={msg.id} 
                className={`flex gap-3 ${isMe ? 'flex-row-reverse' : ''}`}
              >
                {/* Avatar */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
                  ${isMe ? 'bg-blue-100 text-blue-600' : 'bg-gray-200 text-gray-600'}`}
                >
                  <span className="text-xs font-bold">{msg.user_name.charAt(0)}</span>
                </div>

                {/* Bubble */}
                <div className={`max-w-[70%] rounded-2xl px-4 py-2 text-sm shadow-sm
                  ${isMe 
                    ? 'bg-blue-600 text-white rounded-tr-none' 
                    : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'}`}
                >
                  {!isMe && (
                    <div className="text-xs text-gray-400 mb-1 flex items-center gap-1">
                      <span>{msg.user_name}</span>
                    </div>
                  )}
                  <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-gray-100">
        <div className="flex gap-2">
          <input
            type="text"
            className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
            placeholder="发送消息..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            <FiSend size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default GroupChatView;
