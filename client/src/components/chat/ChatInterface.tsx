import React, { useState } from 'react';
import { ChatHeader } from './ChatHeader';
import { ChatMessages } from './ChatMessages';
import { ChatInput } from './ChatInput';
import { useChat } from '@/contexts/ChatContext';
import { ResponseTemplate } from '@shared/types';

export function ChatInterface() {
  const { sendMessage, isTyping } = useChat();
  const [lastResponse, setLastResponse] = useState<ResponseTemplate | null>(null);

  const handleSendMessage = async (message: string) => {
    try {
      const response = await sendMessage(message);
      if (response) {
        setLastResponse(response);
      }
    } catch (error) {
      console.error('Error handling message send:', error);
      // Don't update lastResponse on error
    }
  };

  return (
    <div className="flex h-screen flex-col">
      <ChatHeader />
      <ChatMessages lastResponse={lastResponse} />
      <ChatInput onSendMessage={handleSendMessage} isTyping={isTyping} />
    </div>
  );
}
