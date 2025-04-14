import React from 'react';

export function TypingIndicator() {
  return (
    <div className="mb-4 flex">
      <div className="max-w-[75%] rounded-full bg-white px-4 py-2 shadow dark:bg-gray-700">
        <div className="flex space-x-1">
          <div className="h-2 w-2 animate-pulse rounded-full bg-gray-400 dark:bg-gray-300"></div>
          <div className="h-2 w-2 animate-pulse rounded-full bg-gray-400 dark:bg-gray-300" style={{ animationDelay: '0.2s' }}></div>
          <div className="h-2 w-2 animate-pulse rounded-full bg-gray-400 dark:bg-gray-300" style={{ animationDelay: '0.4s' }}></div>
        </div>
      </div>
    </div>
  );
}
