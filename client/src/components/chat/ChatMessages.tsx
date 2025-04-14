import React, { useRef, useEffect } from 'react';
import { MessageBubble } from './MessageBubble';
import { TypingIndicator } from './TypingIndicator';
import { QuickReplies } from './QuickReplies';
import { useChat } from '@/contexts/ChatContext';
import { ResponseTemplate } from '@shared/types';

interface ChatMessagesProps {
  lastResponse: ResponseTemplate | null;
}

export function ChatMessages({ lastResponse }: ChatMessagesProps) {
  const { messages, isTyping, sendMessage } = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping]);
  
  const handleQuickReply = (reply: string) => {
    sendMessage(reply);
  };
  
  return (
    <div className="flex-1 overflow-y-auto p-4 pb-16" id="chat-messages">
      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} />
      ))}
      
      {isTyping && <TypingIndicator />}
      
      {!isTyping && lastResponse?.quickReplies && (
        <QuickReplies replies={lastResponse.quickReplies} onReplyClick={handleQuickReply} />
      )}
      
      {!isTyping && lastResponse?.includeAppRedirect && (
        <div className="mb-4 flex">
          <div className="max-w-[75%] rounded-t-lg rounded-br-lg bg-white px-4 py-2 shadow dark:bg-gray-700">
            <div className="mt-3 rounded-lg bg-gray-100 p-3 dark:bg-gray-600">
              <div className="flex items-center">
                <div className="mr-3 h-10 w-10 flex-shrink-0 rounded-full bg-primary text-white">
                  <div className="flex h-full w-full items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium">Get personalized recommendations</p>
                  <a href="#" className="mt-1 text-xs font-medium text-primary dark:text-indigo-300">
                    Open Innventa AI App →
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div ref={messagesEndRef} />
    </div>
  );
}
