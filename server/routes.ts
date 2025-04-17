import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { insertMessageSchema } from "@shared/schema";
import { matchResponse } from "@shared/responses";
import { nanoid } from "nanoid";

// Instagram webhook verification token
const VERIFY_TOKEN = process.env.VERIFY_TOKEN || "innventa_secure_token";

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
  
  // Instagram/Meta Webhook Verification Endpoint
  app.get('/webhook', (req: Request, res: Response) => {
    console.log('Received webhook verification request:', req.query);
    
    // Parse query parameters
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    
    // Check if a token and mode were sent
    if (mode && token) {
      // Check the mode and token
      if (mode === 'subscribe' && token === VERIFY_TOKEN) {
        // Respond with the challenge token from the request
        console.log('WEBHOOK_VERIFIED');
        return res.status(200).send(challenge);
      } else {
        // Respond with '403 Forbidden' if verify tokens do not match
        console.error('Verification failed. Token mismatch.');
        return res.sendStatus(403);
      }
    } else {
      // Return a '400 Bad Request' if required parameters are missing
      console.error('Missing required parameters');
      return res.sendStatus(400);
    }
  });
  
  // Instagram/Meta Webhook Event Reception
  app.post('/webhook', (req: Request, res: Response) => {
    const body = req.body;
    
    console.log('Received webhook event:', JSON.stringify(body));
    
    // Check if this is an event from a page subscription
    if (body.object === 'instagram') {
      // Process Instagram events here
      // For now, we'll just acknowledge receipt
      return res.status(200).send('EVENT_RECEIVED');
    } else {
      // Return a '404 Not Found' if event is not from a page subscription
      console.log('Unknown webhook event type');
      return res.sendStatus(404);
    }
  });
  
  // Simple chatbot endpoint for external integrations (ManyChat, etc.)
  app.post("/chatbot", async (req: Request, res: Response) => {
    try {
      console.log('Received external chatbot request:', req.body);
      
      const userMessage = req.body.message;
      
      if (!userMessage || typeof userMessage !== 'string') {
        return res.status(400).json({ 
          reply: "Invalid request. Please provide a message in the format: { \"message\": \"your message here\" }"
        });
      }
      
      // Create a temporary session ID for this request
      const sessionId = nanoid();
      
      // First try to match with predefined templates
      let botResponse = matchResponse(userMessage);
      let responseContent: string;
      
      // If no template matches, use AI for a dynamic response
      if (botResponse === null) {
        console.log('No template match found, using AI for external chatbot response');
        
        // Import our AI service with fallback capability
        const { generateAIResponse } = await import('./aiService');
        
        // Generate AI response using the service that tries both OpenAI and Gemini
        const aiResponse = await generateAIResponse(userMessage);
        console.log('Generated AI response for external chatbot:', aiResponse);
        
        // Use AI-generated content
        responseContent = aiResponse.content;
      } else {
        console.log('Template match found for external chatbot:', botResponse);
        // Use the template response content
        responseContent = botResponse.content;
      }
      
      // Add a suffix with app link if appropriate
      const includeAppLink = responseContent.toLowerCase().includes('product') || 
                            responseContent.toLowerCase().includes('recommend') ||
                            responseContent.toLowerCase().includes('app');
      
      let finalResponse = responseContent;
      
      if (includeAppLink) {
        finalResponse += "\n\nCheck out our app for personalized recommendations: https://innventa.ai/app";
      }
      
      // Return the simple response format
      res.json({ reply: finalResponse });
    } catch (error) {
      console.error('Error processing external chatbot request:', error);
      res.status(500).json({ 
        reply: "Sorry, I'm having trouble processing your request right now. Please try again later or visit our website at https://innventa.ai for assistance."
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
