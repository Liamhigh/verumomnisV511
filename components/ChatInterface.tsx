/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, MessageSender } from '../types'; 
import MessageItem from './MessageItem';
import { Send, Menu, Mic, Paperclip } from 'lucide-react';

interface ChatInterfaceProps {
  messages: ChatMessage[];
  onSendMessage: (query: string, files?: FileList) => void;
  isLoading: boolean;
  placeholderText?: string;
  onToggleSidebar?: () => void;
  onAddFiles: (files: FileList) => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  messages, 
  onSendMessage, 
  isLoading, 
  placeholderText,
  onToggleSidebar,
  onAddFiles,
}) => {
  const [userQuery, setUserQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);
  
  useEffect(() => {
    if (textAreaRef.current) {
      textAreaRef.current.style.height = 'auto';
      textAreaRef.current.style.height = `${textAreaRef.current.scrollHeight}px`;
    }
  }, [userQuery]);


  const handleSend = () => {
    if ((userQuery.trim() || fileInputRef.current?.files?.length) && !isLoading) {
      onSendMessage(userQuery.trim(), fileInputRef.current?.files || undefined);
      setUserQuery('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleFileAttachClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onAddFiles(e.target.files);
      e.target.value = ''; // Reset after handling
    }
  };

  const isChatDisabled = isLoading;

  return (
    <div className="flex flex-col h-full bg-[#1E1E1E] rounded-xl shadow-md border border-[rgba(255,255,255,0.05)]">
      <div className="p-4 border-b border-[rgba(255,255,255,0.05)] flex justify-between items-center">
        <div className="flex items-center gap-3 overflow-hidden">
           {onToggleSidebar && (
            <button 
              onClick={onToggleSidebar}
              className="p-1.5 text-[#A8ABB4] hover:text-white rounded-md hover:bg-white/10 transition-colors md:hidden"
              aria-label="Open Case Workspace"
            >
              <Menu size={20} />
            </button>
          )}
          <div className="overflow-hidden">
            <h2 className="text-xl font-semibold text-[#E2E2E2] truncate">Legal Chat</h2>
          </div>
        </div>
      </div>

      <div className="flex-grow p-4 overflow-y-auto chat-container bg-[#282828]">
        <div className="max-w-4xl mx-auto w-full">
          {messages.map((msg) => (
            <MessageItem key={msg.id} message={msg} />
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="p-4 border-t border-[rgba(255,255,255,0.05)] bg-[#1E1E1E] rounded-b-xl">
        <div className="flex items-end gap-2 bg-[#2C2C2C] border border-[rgba(255,255,255,0.1)] rounded-lg p-2">
          <button
            className="p-1.5 text-gray-400 hover:text-white rounded-md hover:bg-white/10 transition-colors flex-shrink-0"
            aria-label="Voice input"
            onClick={() => alert('Voice input is not yet implemented.')}
          >
            <Mic size={18} />
          </button>
          <button
            className="p-1.5 text-gray-400 hover:text-white rounded-md hover:bg-white/10 transition-colors flex-shrink-0"
            aria-label="Attach file"
            onClick={handleFileAttachClick}
          >
            <Paperclip size={18} />
          </button>
          <input
            type="file"
            ref={fileInputRef}
            multiple
            className="hidden"
            onChange={handleFileChange}
          />
          <textarea
            ref={textAreaRef}
            value={userQuery}
            onChange={(e) => setUserQuery(e.target.value)}
            placeholder={placeholderText || "Ask a question..."}
            className="flex-grow max-h-32 py-1.5 px-1 bg-transparent text-[#E2E2E2] placeholder-[#777777] focus:ring-0 focus:outline-none resize-none text-sm"
            rows={1}
            disabled={isChatDisabled}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <button
            onClick={handleSend}
            disabled={isChatDisabled || !userQuery.trim()}
            className="h-8 w-8 p-1.5 bg-white/[.12] hover:bg-white/20 text-white rounded-lg transition-colors disabled:bg-[#4A4A4A] disabled:text-[#777777] flex items-center justify-center flex-shrink-0"
            aria-label="Send message"
          >
            {isLoading ? 
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> 
              : <Send size={16} />
            }
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;