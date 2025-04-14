import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { insertMessageSchema } from "@shared/schema";
import { matchResponse } from "@shared/responses";
import { nanoid } from "nanoid";

export async function registerRoutes(app: Express): Promise<Server> {
  // Get welcome message
  app.get("/api/chat/welcome", async (req: Request, res: Response) => {
    try {
      // Import response templates
      const { responseTemplates } = await import("@shared/responses");
      
      // Get the welcome message template
      const welcome = responseTemplates.welcome;
      
      // Check if we have a valid welcome message
      if (!welcome) {
        console.error("Welcome message not found in response templates");
        return res.status(500).json({ message: "Welcome message configuration missing" });
      }
      
      // Return the welcome message
      res.json({ message: welcome });
    } catch (error) {
      console.error("Error loading welcome message:", error);
      res.status(500).json({ message: "Failed to load welcome message" });
    }
  });

  // Send a message and get a response
  app.post("/api/chat/message", async (req: Request, res: Response) => {
    try {
      console.log('Received message request:', req.body);
      
      // Parse and validate the input
      const messageData = insertMessageSchema.parse(req.body);
      console.log('Message data validated:', messageData);
      
      // Store the user message
      const savedMessage = await storage.createMessage(messageData);
      console.log('User message stored:', savedMessage);
      
      // Try to match with predefined templates first
      let botResponse = matchResponse(messageData.content);
      let responseContent: string;
      let quickReplies: string[] | undefined;
      let includeAppRedirect: boolean | undefined;
      
      // If no template matches, use AI for a dynamic response
      if (botResponse === null) {
        console.log('No template match found, using AI for response');
        
        // Import our AI service with fallback capability
        const { generateAIResponse } = await import('./aiService');
        
        // Generate AI response using the service that tries both OpenAI and Gemini
        const aiResponse = await generateAIResponse(messageData.content);
        console.log('Generated AI response:', aiResponse);
        
        // Use AI-generated content
        responseContent = aiResponse.content;
        
        // Set appropriate quick replies based on API success
        if (aiResponse.success) {
          // Default quick replies for AI responses
          quickReplies = [
            "What is Innventa AI?",
            "How do I use the app?",
            "Product recommendations"
          ];
          
          // Check if the response should include an app redirect
          // We'll include it if the response mentions products or recommendations
          const aiContent = responseContent.toLowerCase();
          const shouldRedirect = aiContent.includes('product') || 
                                aiContent.includes('recommend') ||
                                aiContent.includes('app');
          includeAppRedirect = shouldRedirect;
        } else {
          // For API errors, always use these quick replies to guide users
          quickReplies = [
            "What is Innventa AI?",
            "How do I use the app?",
            "Product recommendations"
          ];
          
          // Always include app redirect for API errors to help guide users to the app
          includeAppRedirect = true;
        }
      } else {
        console.log('Template match found:', botResponse);
        // Use the template response content and quick replies
        responseContent = botResponse.content;
        quickReplies = botResponse.quickReplies;
        includeAppRedirect = botResponse.includeAppRedirect;
      }
      
      // Create the final response object
      const finalResponse = {
        content: responseContent,
        quickReplies,
        includeAppRedirect
      };
      
      // Store the bot response in our storage
      await storage.createMessage({
        sessionId: messageData.sessionId,
        content: responseContent,
        fromUser: false
      });
      
      // Return the bot response to the client
      res.json({ message: finalResponse });
    } catch (error) {
      console.error('Error processing message:', error);
      
      if (error instanceof z.ZodError) {
        console.error('Validation error:', error.errors);
        res.status(400).json({ 
          message: "Invalid message format", 
          errors: error.errors 
        });
      } else {
        let errorMessage = "Failed to process message";
        if (error instanceof Error) {
          errorMessage += `: ${error.message}`;
        }
        res.status(500).json({ message: errorMessage });
      }
    }
  });

  // Get message history for a session
  app.get("/api/chat/history/:sessionId", async (req: Request, res: Response) => {
    try {
      const { sessionId } = req.params;
      const messages = await storage.getMessages(sessionId);
      res.json({ messages });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch message history" });
    }
  });

  // Generate a new session ID
  app.get("/api/chat/session", (_req: Request, res: Response) => {
    try {
      const sessionId = nanoid();
      console.log('Generated new session ID:', sessionId);
      res.json({ sessionId });
    } catch (error) {
      console.error('Error generating session ID:', error);
      res.status(500).json({ message: "Failed to generate session ID" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
