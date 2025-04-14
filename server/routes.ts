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
      
      // Generate bot response based on the user message
      const botResponse = matchResponse(messageData.content);
      console.log('Generated bot response:', botResponse);
      
      // Store the bot response in our storage
      await storage.createMessage({
        sessionId: messageData.sessionId,
        content: botResponse.content,
        fromUser: false
      });
      
      // Return the bot response to the client
      res.json({ message: botResponse });
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
