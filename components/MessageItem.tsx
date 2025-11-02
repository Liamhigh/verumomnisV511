/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { marked } from 'marked';
import hljs from 'highlight.js';
import { ChatMessage, MessageSender } from '../types';
import { File, AlertTriangle, Check, User, Bot, Cog } from 'lucide-react';

marked.setOptions({
  highlight: function(code, lang) {
    const language = hljs.getLanguage(lang) ? lang : 'plaintext';
    return hljs.highlight(code, { language }).value;
  },
  langPrefix: 'hljs language-',
} as any);

interface MessageItemProps {
  message: ChatMessage;
}

const SenderAvatar: React.FC<{ sender: MessageSender }> = ({ sender }) => {
  let Icon = User;
  let bgColorClass = 'bg-blue-500/20';
  let iconColorClass = 'text-blue-300';
  
  if (sender === MessageSender.MODEL) {
    Icon = Bot;
    bgColorClass = 'bg-gray-500/20'; 
    iconColorClass = 'text-gray-300';
  } else if (sender === MessageSender.SYSTEM) {
    Icon = Cog;
    bgColorClass = 'bg-gray-600/20';
    iconColorClass = 'text-gray-400';
  }

  return (
    <div className={`w-8 h-8 rounded-full ${bgColorClass} flex items-center justify-center flex-shrink-0`}>
      <Icon size={18} className={iconColorClass} />
    </div>
  );
};

const MessageItem: React.FC<MessageItemProps> = ({ message }) => {
  const isUser = message.sender === MessageSender.USER;
  const isModel = message.sender === MessageSender.MODEL;
  const isSystem = message.sender === MessageSender.SYSTEM;

  const renderMarkdown = (text: string) => {
    const rawMarkup = marked.parse(text) as string;
    return <div className="prose prose-sm prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: rawMarkup }} />;
  };
  
  const renderModelContent = () => {
    if (message.isLoading) {
      return (
        <div className="flex items-center space-x-1.5 text-[#A8ABB4]">
          <div className="w-1.5 h-1.5 bg-current rounded-full animate-bounce [animation-delay:-0.3s]"></div>
          <div className="w-1.5 h-1.5 bg-current rounded-full animate-bounce [animation-delay:-0.15s]"></div>
          <div className="w-1.5 h-1.5 bg-current rounded-full animate-bounce"></div>
        </div>
      );
    }

    if (message.isDivergent) {
      return (
        <div>
          <div className="flex items-center gap-2 p-2 mb-2 text-sm text-yellow-300 bg-yellow-500/10 border border-yellow-500/20 rounded-md">
            <AlertTriangle size={16} />
            <p>Provider responses diverged. Review both answers.</p>
          </div>
          <div className="space-y-3">
            <div className="p-2 border border-gray-600/50 rounded-md">
              <p className="text-xs font-semibold text-gray-400 mb-1">Provider 1</p>
              {renderMarkdown(message.api1Response || "No response.")}
            </div>
            <div className="p-2 border border-gray-600/50 rounded-md">
              <p className="text-xs font-semibold text-gray-400 mb-1">Provider 2</p>
              {renderMarkdown(message.api2Response || "No response.")}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div>
        {message.consensusText ? (
          <>
            <div className="flex items-center gap-2 text-xs text-green-400 mb-2">
              <Check size={14} />
              <span>Consensus Verified</span>
            </div>
            {renderMarkdown(message.consensusText)}
          </>
        ) : (
           renderMarkdown(message.text || "No response received.")
        )}
      </div>
    );
  };
  
  const bubbleClasses = `p-3 rounded-lg shadow-md max-w-full ${isUser ? 'rounded-br-none bg-white/5' : 'rounded-bl-none bg-black/20'}`;

  return (
    <div className={`flex mb-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex items-start gap-2.5 w-full ${isUser ? 'max-w-[85%]' : 'max-w-[95%]'}`}>
        {!isUser && <SenderAvatar sender={message.sender} />}
        <div className={bubbleClasses}>
          {isModel && renderModelContent()}
          {isUser && <div className="text-white text-sm whitespace-pre-wrap">{message.text}</div>}
          {isSystem && <div className="text-[#A8ABB4] text-sm whitespace-pre-wrap">{message.text}</div>}
          
          {isUser && message.attachments && message.attachments.length > 0 && (
            <div className="mt-2.5 pt-2.5 border-t border-[rgba(255,255,255,0.1)]">
              <h4 className="text-xs font-semibold text-[#A8ABB4] mb-1.5">Context from {message.attachments.length} file(s):</h4>
              <div className="space-y-1">
                {message.attachments.map((att, index) => (
                  <div key={index} className="flex items-center gap-1.5 text-[11px] text-gray-400">
                    <File size={12} />
                    <span className="font-mono truncate" title={att.hash}>{att.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        {isUser && <SenderAvatar sender={message.sender} />}
      </div>
    </div>
  );
};

export default MessageItem;
