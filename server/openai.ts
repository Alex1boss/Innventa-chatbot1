import OpenAI from "openai";

// Initialize the OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// System prompt defining the chatbot's personality and rules
const systemPrompt = `
You are a friendly, helpful chatbot for Innventa AI, a shopping assistant application.
Your role is to guide users to the app for product recommendations rather than providing direct recommendations in chat.

Key guidelines:
1. Be conversational, friendly, and emotionally aware - use emojis occasionally
2. Keep responses brief (2-5 sentences max) and easy to read
3. When users ask for product recommendations, encourage them to use the Innventa AI app
4. For app-related questions, provide helpful information
5. For unrelated topics, be conversational but gently guide back to Innventa AI when appropriate
6. Mention the app link for relevant questions
7. For specific product questions, explain that the app provides personalized recommendations

NEVER invent fake features or capabilities of the Innventa AI app.
`;

/**
 * Generate an AI response using OpenAI
 * @param userMessage The user's message
 * @returns The AI-generated response content and status
 */
export async function generateOpenAIResponse(userMessage: string): Promise<{content: string, success: boolean}> {
  try {
    // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage }
      ],
      max_tokens: 250,
      temperature: 0.7,
    });

    return {
      content: response.choices[0].message.content || "I'm not sure how to respond to that. Can I help you with something else about Innventa AI?",
      success: true
    };
  } catch (error) {
    console.error('OpenAI API error:', error);
    
    // Create a more helpful response based on the error type
    let errorMessage: string;
    
    // Safely check error properties
    const errorObject = error as any; // Type assertion for error inspection
    
    if (errorObject && (errorObject.code === 'insufficient_quota' || errorObject.status === 429)) {
      errorMessage = `Hey there! 👋 I'd be happy to chat, but my AI brain needs a quick recharge. In the meantime, I can tell you all about Innventa AI and how it can help you find products you'll love!`;
    } else {
      errorMessage = `I'm having a moment connecting to my response system. While I get that fixed, can I tell you about how Innventa AI can help you discover amazing products?`;
    }
    
    // Return error response with success: false flag
    return {
      content: errorMessage,
      success: false
    };
  }
}