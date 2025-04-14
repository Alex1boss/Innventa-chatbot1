import React from 'react';
import { ChatInterface } from '@/components/chat/ChatInterface';
import { ChatProvider } from '@/contexts/ChatContext';

export default function Home() {
  return (
    <ChatProvider>
      <ChatInterface />
    </ChatProvider>
  );
}
