export interface ChatMessage {
  id: string;
  content: string;
  fromUser: boolean;
  timestamp: Date;
}

export interface ResponseTemplate {
  content: string;
  quickReplies?: string[];
  includeAppRedirect?: boolean;
}

export interface InnventaResponse {
  message: ResponseTemplate;
}

export interface ApiErrorResponse {
  message: string;
}
