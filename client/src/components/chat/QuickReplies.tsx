import React from 'react';

interface QuickRepliesProps {
  replies: string[];
  onReplyClick: (reply: string) => void;
}

export function QuickReplies({ replies, onReplyClick }: QuickRepliesProps) {
  if (!replies || replies.length === 0) {
    return null;
  }
  
  return (
    <div className="mb-4">
      <div className="flex flex-wrap gap-2">
        {replies.map((reply, index) => (
          <button
            key={index}
            className="whitespace-nowrap rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
            onClick={() => onReplyClick(reply)}
          >
            {reply}
          </button>
        ))}
      </div>
    </div>
  );
}
