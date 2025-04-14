import { useState, useEffect, useCallback } from 'react';
import { nanoid } from 'nanoid';
import { apiRequest } from '@/lib/queryClient';
import { ChatMessage } from '@shared/types';
import { useToast } from '@/hooks/use-toast';

export function useChatMessages() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessionId, setSessionId] = useState<string>('');
  const [isTyping, setIsTyping] = useState(false);
  const { toast } = useToast();

  // Initialize session and get welcome message
  useEffect(() => {
    const initializeChat = async () => {
      try {
        console.log('Initializing chat session...');
        
        // Get a new session ID
        const sessionResponse = await apiRequest('GET', '/api/chat/session');
        const sessionData = await sessionResponse.json();
        console.log('Session created:', sessionData);
        setSessionId(sessionData.sessionId);
        
        // Get welcome message
        console.log('Fetching welcome message...');
        const welcomeResponse = await apiRequest('GET', '/api/chat/welcome');
        const welcomeData = await welcomeResponse.json();
        console.log('Welcome message received:', welcomeData);
        
        // Add welcome message to chat
        const welcomeMessage: ChatMessage = {
          id: nanoid(),
          content: welcomeData.message.content,
          fromUser: false,
          timestamp: new Date()
        };
        
        setMessages([welcomeMessage]);
        console.log('Chat session initialized successfully');
      } catch (error) {
        console.error('Chat initialization error:', error);
        
        // Display a more specific error message
        let errorMessage = "Failed to initialize chat session";
        if (error instanceof Error) {
          errorMessage += `: ${error.message}`;
        }
        
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive"
        });
      }
    };
    
    initializeChat();
  }, [toast]);

  // Send message function
  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || !sessionId) {
      console.warn('Cannot send message: empty content or missing sessionId');
      return;
    }
    
    try {
      console.log('Sending message:', content);
      
      // Create a temporary user message to show immediately
      const userMessage: ChatMessage = {
        id: nanoid(),
        content,
        fromUser: true,
        timestamp: new Date()
      };
      
      // Add user message to the chat
      setMessages(prev => [...prev, userMessage]);
      
      // Show typing indicator
      setIsTyping(true);
      
      // Send the message to API
      console.log('Making API request to /api/chat/message with sessionId:', sessionId);
      const response = await apiRequest('POST', '/api/chat/message', {
        sessionId,
        content,
        fromUser: true
      });
      
      // Add a small delay to simulate typing
      await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));
      
      const data = await response.json();
      console.log('Received API response:', data);
      
      // Create bot response message
      const botMessage: ChatMessage = {
        id: nanoid(),
        content: data.message.content,
        fromUser: false,
        timestamp: new Date()
      };
      
      // Hide typing indicator and add bot response
      setIsTyping(false);
      setMessages(prev => [...prev, botMessage]);
      console.log('Message sent and response received successfully');
      
      return data.message;
    } catch (error) {
      console.error('Error sending message:', error);
      setIsTyping(false);
      
      // Display a more specific error message
      let errorMessage = "Failed to send message. Please try again.";
      if (error instanceof Error) {
        errorMessage += ` (${error.message})`;
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    }
  }, [sessionId, toast]);

  return {
    messages,
    isTyping,
    sendMessage,
    sessionId
  };
}
