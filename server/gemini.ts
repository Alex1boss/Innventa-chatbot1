import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize the Gemini API client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// System prompt to guide the AI's behavior
const systemPrompt = `You are a friendly shopping assistant chat bot called Innventa AI.

When users ask about product recommendations or shopping advice, don't provide specific product recommendations directly. Instead, guide them to download and use the Innventa AI app, which is specially designed for personalized shopping recommendations.

For other questions, be helpful, friendly, and conversational. Keep responses relatively brief (1-3 sentences) but informative. Occasionally use emoji for a friendly tone, but don't overdo it.

Key things to know about Innventa AI app:
- It's a mobile app available on iOS and Android
- It provides personalized product recommendations based on user preferences
- It can help find products across multiple online stores
- It has visual search capabilities
- It offers price comparison across retailers

DO NOT make up features that aren't mentioned above.
Make it clear when you're referring users to use the Innventa AI app instead of trying to answer product questions directly.

NEVER invent fake features or capabilities of the Innventa AI app.
`;

/**
 * Generate an AI response using Google's Gemini API
 * @param userMessage The user's message
 * @returns The AI-generated response content and status
 */
export async function generateGeminiResponse(userMessage: string): Promise<{content: string, success: boolean}> {
  try {
    // Use Gemini-pro model
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    
    // Start with system instructions
    const generationConfig = {
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 250,
    };
    
    // Create chat session
    const chat = model.startChat({
      generationConfig,
      history: [
        {
          role: "user",
          parts: [{ text: "Please behave according to these instructions:" + systemPrompt }],
        },
        {
          role: "model", 
          parts: [{ text: "I understand. I'll act as the Innventa AI shopping assistant chatbot with the guidelines you've provided." }]
        }
      ],
    });
    
    // Send the user message and get a response
    const result = await chat.sendMessage(userMessage);
    const response = result.response;
    
    // Extract the text content
    const responseText = response.text();

    return {
      content: responseText || "I'm not sure how to respond to that. Can I help you with something else about Innventa AI?",
      success: true
    };
  } catch (error) {
    console.error('Gemini API error:', error);
    
    // Create a helpful response when the API fails
    const errorMessage = "I'm having a moment connecting to my Gemini response system. Would you like to know more about the Innventa AI app in the meantime?";
    
    // Return error response with success: false flag
    return {
      content: errorMessage,
      success: false
    };
  }
}