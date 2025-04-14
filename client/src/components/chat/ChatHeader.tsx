import React from 'react';
import { useDarkMode } from '@/hooks/useDarkMode';

export function ChatHeader() {
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  
  return (
    <header className="bg-white px-4 py-3 shadow dark:bg-gray-900">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 overflow-hidden rounded-full bg-primary flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </div>
          <div>
            <h1 className="font-semibold">Innventa AI</h1>
            <div className="flex items-center text-xs text-green-500">
              <span className="mr-1 h-2 w-2 rounded-full bg-green-500"></span>
              <span>Online</span>
            </div>
          </div>
        </div>
        <div className="flex items-center">
          <button 
            id="darkModeToggle" 
            className="mr-2 rounded-full p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
            onClick={toggleDarkMode}
          >
            {isDarkMode ? (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-6 w-6">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                  d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-6 w-6">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                  d="M12 3v1m0 16v1m-9-9h1m16 0h1m-1.343-7.657l-.707.707M5.343 17.657l-.707.707m14.657-14.657l-.707.707M5.343 5.343l-.707-.707" />
              </svg>
            )}
          </button>
          <a 
            href="https://innventaai.app" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="flex items-center rounded-full bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-indigo-600"
          >
            Open App
            <svg xmlns="http://www.w3.org/2000/svg" className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      </div>
    </header>
  );
}
