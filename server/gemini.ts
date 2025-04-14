import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

// Initialize the Gemini API client
// We'll initialize this when the function is called to ensure the API key is available
let genAI: GoogleGenerativeAI | null = null;

// Safety settings to avoid harmful content
const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
];

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
    // Use the correct Gemini API version and model name
    // For Gemini API, we need to use "gemini-pro" model with the correct API version
    // The error we're seeing indicates that either the API key is invalid or the API version 
    // in the library doesn't match the expected version
    
    console.log('Checking Gemini API key and configuration...');
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey || apiKey.trim() === '') {
      console.error('GEMINI_API_KEY is missing or empty');
      throw new Error('GEMINI_API_KEY environment variable is missing or empty');
    }
    
    // Initialize the Gemini API client with the API key
    genAI = new GoogleGenerativeAI(apiKey);
    
    // Use gemini-pro model, which should be available for most Gemini API keys
    const modelName = "gemini-pro";
    console.log(`Using Gemini model: ${modelName}`);
    
    // Create the model with safety settings
    const model = genAI.getGenerativeModel({
      model: modelName,
      safetySettings
    });
    
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