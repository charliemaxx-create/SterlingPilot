import React, { useState, useRef, useEffect } from 'react';
import { Transaction, Account, AppSettings, Category } from '../types';
import { getFinancialAdvice } from '../services/geminiService';
import ReactMarkdown from 'https://esm.sh/react-markdown@9';

interface AdvisorProps {
  transactions: Transaction[];
  accounts: Account[];
  categories: Category[];
  settings: AppSettings;
}

interface Message {
  sender: 'user' | 'ai';
  text: string;
}

const Advisor: React.FC<AdvisorProps> = ({ transactions, accounts, categories, settings }) => {
  const [messages, setMessages] = useState<Message[]>([
    { sender: 'ai', text: "Hello! I'm FinBot, your personal AI financial advisor. How can I help you analyze your finances today? Try asking 'Where did I spend the most last week?' or 'Suggest ways I can save money'." }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSendMessage = async () => {
    if (input.trim() === '' || isLoading) return;

    const userMessage: Message = { sender: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const aiResponse = await getFinancialAdvice(transactions, accounts, categories, settings, input);
      const aiMessage: Message = { sender: 'ai', text: aiResponse };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      const errorMessage: Message = { sender: 'ai', text: "Sorry, I encountered an error. Please try again." };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 sm:p-6 flex flex-col h-[calc(100vh-12rem)] max-h-[700px]">
      <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-4 border-b pb-4 dark:border-gray-700">AI Financial Advisor</h1>
      <div className="flex-grow overflow-y-auto pr-4 space-y-4">
        {messages.map((msg, index) => (
          <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-xs md:max-w-md lg:max-w-2xl rounded-lg px-4 py-3 ${
              msg.sender === 'user' 
                ? 'bg-primary-600 text-white' 
                : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
            }`}>
              <div className="prose prose-sm dark:prose-invert max-w-none">
                 <ReactMarkdown>{msg.text}</ReactMarkdown>
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
            <div className="flex justify-start">
                <div className="bg-gray-200 dark:bg-gray-700 rounded-lg px-4 py-3">
                    <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                    </div>
                </div>
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="mt-6 flex border-t pt-4 dark:border-gray-700">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ask a financial question..."
          disabled={isLoading}
          className="flex-grow bg-gray-100 dark:bg-gray-700 border-2 border-transparent focus:border-primary-500 focus:ring-0 rounded-l-lg p-3 outline-none transition"
        />
        <button
          onClick={handleSendMessage}
          disabled={isLoading}
          className="bg-primary-600 text-white px-6 py-3 rounded-r-lg font-semibold hover:bg-primary-700 disabled:bg-primary-400 disabled:cursor-not-allowed transition"
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default Advisor;