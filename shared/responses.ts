import { ResponseTemplate } from './types';

// Response templates for different user messages
export const responseTemplates: Record<string, ResponseTemplate> = {
  // Welcome message
  welcome: {
    content: "Hey! 👋\nI'm here if you want to talk, chill, or just kill some time.\nWhat's on your mind?",
    quickReplies: [
      "What is Innventa AI?",
      "How do I use the app?",
      "I need help with something"
    ]
  },
  
  // Default fallback response
  default: {
    content: "Thanks for your message! For personalized product recommendations, make sure to check out our app. Is there anything specific you'd like to know about Innventa AI?",
    quickReplies: [
      "What is Innventa AI?",
      "How do I use the app?",
      "I need help with something"
    ]
  },
  
  // App information
  "what is innventa ai": {
    content: "Innventa AI is your shopping assistant that helps you discover products you'll love! 🛍️\n\nWe use AI to understand your style and preferences to recommend items that match what you're looking for.\n\nFor the best experience, check out our app where you can browse personalized recommendations!",
    quickReplies: [
      "How do I use the app?",
      "I need help with something",
      "Product recommendations"
    ],
    includeAppRedirect: true
  },
  
  // App usage guidance
  "how do i use the app": {
    content: "Using Innventa AI is super easy! Here's how:\n\n1. Download our app from the App Store or Google Play\n2. Create an account or sign in\n3. Tell us what you're looking for or browse categories\n4. Get personalized product recommendations!\n\nNeed the download link? Just ask! 😊",
    quickReplies: [
      "Download link",
      "What is Innventa AI?",
      "Product recommendations"
    ],
    includeAppRedirect: true
  },
  
  // Product recommendation redirect
  "product recommendations": {
    content: "I'd love to help you find the perfect products for you! 👟\n\nFor the best personalized recommendations, you'll want to use our app where I can show you options based on your style and preferences.",
    quickReplies: [
      "How do I use the app?",
      "What is Innventa AI?",
      "Download link"
    ],
    includeAppRedirect: true
  },
  
  // Bug report response
  "bug report": {
    content: "Oh no! I'm sorry to hear you're having trouble. 😔\n\nCan you tell me a bit more about what's happening? Any specific screen or feature where you're experiencing the issue?\n\nOur support team is always ready to help solve these problems.",
    quickReplies: [
      "Contact support",
      "How do I use the app?",
      "What is Innventa AI?"
    ]
  },
  
  // Support request
  "i need help with something": {
    content: "I'm here to help! What do you need assistance with? You can ask about the app, how it works, or report any issues you're experiencing.",
    quickReplies: [
      "How do I use the app?",
      "What is Innventa AI?",
      "Bug report"
    ]
  },
  
  // Download link
  "download link": {
    content: "You can download the Innventa AI app from:\n\n• App Store for iOS devices\n• Google Play Store for Android devices\n\nJust search for 'Innventa AI' or use the link below!",
    quickReplies: [
      "How do I use the app?",
      "What is Innventa AI?",
      "I need help with something"
    ],
    includeAppRedirect: true
  },
  
  // Contact support
  "contact support": {
    content: "Our support team is available to help you with any issues! You can reach them through:\n\n• Email: support@innventaai.com\n• In-app support chat\n• Support form on our website\n\nFor faster assistance, please include details about the issue you're experiencing.",
    quickReplies: [
      "Bug report",
      "How do I use the app?",
      "What is Innventa AI?"
    ]
  },
  
  // Greeting responses
  "hi": {
    content: "Hey there! How's your day going? Feel free to ask me anything about Innventa AI or how I can help you find products you'll love!",
    quickReplies: [
      "What is Innventa AI?",
      "How do I use the app?",
      "Product recommendations"
    ]
  },
  
  "hello": {
    content: "Hello! What can I help you with today? Ask me about Innventa AI, our app, or how to get personalized product recommendations!",
    quickReplies: [
      "What is Innventa AI?",
      "How do I use the app?",
      "Product recommendations"
    ]
  },
  
  // Goodbye response
  "bye": {
    content: "Take care! Come back anytime you want to chat or need help with finding products! 👋",
    quickReplies: [
      "What is Innventa AI?",
      "How do I use the app?",
      "Product recommendations"
    ]
  },
};

// Function to match user input with relevant response
export function matchResponse(input: string): ResponseTemplate {
  const lowerInput = input.toLowerCase().trim();
  
  // Check exact matches first
  if (responseTemplates[lowerInput]) {
    return responseTemplates[lowerInput];
  }
  
  // Check for partial matches/keywords
  for (const key of Object.keys(responseTemplates)) {
    if (lowerInput.includes(key) && key !== 'welcome' && key !== 'default') {
      return responseTemplates[key];
    }
  }
  
  // Product recommendation keywords
  const productKeywords = ['recommend', 'find', 'product', 'item', 'shopping', 
    'buy', 'purchase', 'look for', 'search', 'shoe', 'clothing', 'dress', 
    'jacket', 'pants', 'shirt', 'hat', 'accessory', 'purse', 'bag', 'watch'];
  
  for (const keyword of productKeywords) {
    if (lowerInput.includes(keyword)) {
      return responseTemplates["product recommendations"];
    }
  }
  
  // Bug/issue related keywords
  const bugKeywords = ['bug', 'issue', 'problem', 'not working', 'error', 'crash', 
    'glitch', 'stuck', 'freeze', 'broken'];
  
  for (const keyword of bugKeywords) {
    if (lowerInput.includes(keyword)) {
      return responseTemplates["bug report"];
    }
  }
  
  // Help related keywords
  const helpKeywords = ['help', 'support', 'assistance', 'assist', 'how to', 'how do'];
  
  for (const keyword of helpKeywords) {
    if (lowerInput.includes(keyword)) {
      return responseTemplates["i need help with something"];
    }
  }
  
  // Return default response if no matches
  return responseTemplates.default;
}
