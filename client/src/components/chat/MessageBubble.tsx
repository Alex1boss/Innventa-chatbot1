import React from 'react';
import { ChatMessage } from '@shared/types';
import { format } from 'date-fns';

interface MessageBubbleProps {
  message: ChatMessage;
}

function parseMessageContent(content: string): JSX.Element {
  // Split the message content by new lines and map to paragraphs
  return (
    <>
      {content.split('\n').map((paragraph, i) => {
        // Check if the paragraph starts with a numbered list (1., 2., etc.)
        if (/^\d+\./.test(paragraph)) {
          return <li key={i} className="ml-4 text-sm">{paragraph.substring(paragraph.indexOf('.') + 1)}</li>;
        }
        
        // Regular paragraph
        return <p key={i} className={i > 0 ? "mt-1 text-sm" : "text-sm"}>{paragraph}</p>;
      })}
    </>
  );
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const formattedTime = format(new Date(message.timestamp), 'h:mm a');
  
  if (message.fromUser) {
    return (
      <div className="mb-4 flex justify-end">
        <div className="max-w-[75%] rounded-t-lg rounded-bl-lg bg-primary px-4 py-2 text-white shadow">
          {parseMessageContent(message.content)}
          <span className="mt-1 block text-right text-xs text-indigo-100">{formattedTime}</span>
        </div>
      </div>
    );
  }
  
  return (
    <div className="mb-4 flex">
      <div className="max-w-[75%] rounded-t-lg rounded-br-lg bg-white px-4 py-2 shadow dark:bg-gray-700">
        {parseMessageContent(message.content)}
        <span className="mt-1 block text-xs text-gray-500 dark:text-gray-400">{formattedTime}</span>
      </div>
    </div>
  );
}
