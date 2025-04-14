import { generateOpenAIResponse } from './openai';
import { generateGeminiResponse } from './gemini';

/**
 * Interface for AI responses with content and success status
 */
export interface AIResponse {
  content: string;
  success: boolean;
}

/**
 * Generates AI responses with automatic fallback between providers
 * 
 * @param userMessage The user's message to respond to
 * @returns A response with content and success flag
 */
export async function generateAIResponse(userMessage: string): Promise<AIResponse> {
  console.log(`Generating AI response for message: ${userMessage}`);
  
  // First try OpenAI
  try {
    console.log('Attempting to use OpenAI...');
    const openAIResponse = await generateOpenAIResponse(userMessage);
    
    // If OpenAI succeeds, return its response
    if (openAIResponse.success) {
      console.log('OpenAI response generated successfully');
      return openAIResponse;
    }
    
    // If OpenAI fails, try Gemini
    console.log('OpenAI failed, falling back to Gemini...');
    const geminiResponse = await generateGeminiResponse(userMessage);
    return geminiResponse;
    
  } catch (error) {
    console.error('Error in primary AI service (OpenAI):', error);
    
    // Try Gemini as fallback
    try {
      console.log('Attempting fallback to Gemini...');
      const geminiResponse = await generateGeminiResponse(userMessage);
      return geminiResponse;
    } catch (fallbackError) {
      console.error('Error in fallback AI service (Gemini):', fallbackError);
      
      // If both services fail, return a generic error response
      return {
        content: "I'm having trouble connecting to my AI services right now. Can I help you learn more about the Innventa AI app instead?",
        success: false
      };
    }
  }
}