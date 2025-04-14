import React, { createContext, useContext, ReactNode } from 'react';
import { ChatMessage, ResponseTemplate } from '@shared/types';
import { useChatMessages } from '@/hooks/useChatMessages';

interface ChatContextType {
  messages: ChatMessage[];
  isTyping: boolean;
  sendMessage: (content: string) => Promise<ResponseTemplate | undefined>;
  sessionId: string;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const { messages, isTyping, sendMessage, sessionId } = useChatMessages();

  return (
    <ChatContext.Provider value={{ messages, isTyping, sendMessage, sessionId }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}
