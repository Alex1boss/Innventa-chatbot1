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
    // Try to use a model that we know exists - try different versions
    let modelName = "gemini-pro";
    try {
      // Let's first attempt to list available models
      console.log('Attempting to determine available Gemini models...');
      // Future improvement: we could call the list models API here
    } catch (modelError) {
      console.log('Could not determine available models, using gemini-pro as default');
    }
    
    console.log(`Using Gemini model: ${modelName}`);
    const model = genAI.getGenerativeModel({ model: modelName });
    
    // Start with system instructions
    const generationConfig = {
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 250,
    };
    
    // For direct generation instead of chat to avoid complications
    const prompt = `${systemPrompt}

User message: ${userMessage}

Respond as the Innventa AI shopping assistant chatbot according to the guidelines above.`;

    // Generate a direct response
    const result = await model.generateContent(prompt);
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