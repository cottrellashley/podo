import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, Bot, User, Settings, Sparkles, Clock, Trash2, AlertCircle, CheckCircle } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import AISettings from './AISettings';
import type { AIResponse } from '../services/openai';
import { saveAssistantMessages, loadAssistantMessages, saveConversationHistory, loadConversationHistory } from '../utils/storage';
import podoLogo from '../assets/podo_logo.png';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
  actions?: AIResponse['actions'];
  error?: boolean;
}

const MyAssistant: React.FC = () => {
  const { 
    aiApiKey, 
    aiModel, 
    setAISettings, 
    openAIService, 
    processAIResponse 
  } = useAppContext();

  // Load messages and conversation history from localStorage
  const [messages, setMessages] = useState<Message[]>(() => {
    const savedMessages = loadAssistantMessages();
    if (savedMessages.length > 0) {
      return savedMessages;
    }
    
    // Default welcome message
    return [
      {
        id: '1',
        content: aiApiKey 
          ? 'Hello! I\'m your AI-powered personal assistant. I can help you create recipes, workouts, and todo lists, and schedule them in your weekly planner. What would you like to work on today?'
          : 'Hello! I\'m your AI assistant, but I need to be configured first. Please click the settings button to add your OpenAI API key so I can help you create and schedule items.',
        sender: 'assistant',
        timestamp: new Date()
      }
    ];
  });

  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>(() => {
    return loadConversationHistory();
  });
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Persist messages whenever they change
  useEffect(() => {
    saveAssistantMessages(messages);
  }, [messages]);

  // Persist conversation history whenever it changes
  useEffect(() => {
    saveConversationHistory(conversationHistory);
  }, [conversationHistory]);

  // Update welcome message when API key changes
  useEffect(() => {
    if (messages.length === 1 && messages[0].id === '1') {
      setMessages([
        {
          id: '1',
          content: aiApiKey 
            ? 'Hello! I\'m your AI-powered personal assistant. I can help you create recipes, workouts, and todo lists, and schedule them in your weekly planner. What would you like to work on today?'
            : 'Hello! I\'m your AI assistant, but I need to be configured first. Please click the settings button to add your OpenAI API key so I can help you create and schedule items.',
          sender: 'assistant',
          timestamp: new Date()
        }
      ]);
    }
  }, [aiApiKey]);

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;
    
    if (!openAIService) {
      // Show error message if no API key is configured
      const errorMessage: Message = {
        id: generateId(),
        content: 'Please configure your OpenAI API key in settings before I can assist you.',
        sender: 'assistant',
        timestamp: new Date(),
        error: true
      };
      setMessages(prev => [...prev, errorMessage]);
      return;
    }

    const userMessage: Message = {
      id: generateId(),
      content: inputMessage,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    try {
      // Send message to OpenAI
      const response = await openAIService.sendMessage(inputMessage, conversationHistory);
      
      // Update conversation history
      const newHistory = [
        ...conversationHistory,
        { role: 'user' as const, content: inputMessage },
        { role: 'assistant' as const, content: response.message }
      ];
      setConversationHistory(newHistory);

      // Process AI actions (create objects, schedule items)
      if (response.actions) {
        processAIResponse(response.actions.createObjects, response.actions.scheduleItems);
      }

      const assistantMessage: Message = {
        id: generateId(),
        content: response.message,
        sender: 'assistant',
        timestamp: new Date(),
        actions: response.actions
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('AI Assistant Error:', error);
      
      const errorMessage: Message = {
        id: generateId(),
        content: `I apologize, but I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}. Please check your API key and try again.`,
        sender: 'assistant',
        timestamp: new Date(),
        error: true
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const clearChat = () => {
    const welcomeMessage: Message = {
      id: '1',
      content: aiApiKey 
        ? 'Hello! I\'m your AI-powered personal assistant. I can help you create recipes, workouts, and todo lists, and schedule them in your weekly planner. What would you like to work on today?'
        : 'Hello! I\'m your AI assistant, but I need to be configured first. Please click the settings button to add your OpenAI API key so I can help you create and schedule items.',
      sender: 'assistant',
      timestamp: new Date()
    };
    
    setMessages([welcomeMessage]);
    setConversationHistory([]);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleQuickAction = (prompt: string) => {
    setInputMessage(prompt);
  };

  const getActionSummary = (actions?: AIResponse['actions']) => {
    if (!actions) return null;

    const createdCount = actions.createObjects?.length || 0;
    const scheduledCount = actions.scheduleItems?.length || 0;

    if (createdCount === 0 && scheduledCount === 0) return null;

    return (
      <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg dark:bg-green-900/20 dark:border-green-700">
        <div className="flex items-center gap-2 text-green-800 dark:text-green-300">
          <CheckCircle className="w-4 h-4" />
          <span className="text-sm font-medium">Actions Completed:</span>
        </div>
        <div className="mt-1 text-sm text-green-700 dark:text-green-400">
          {createdCount > 0 && `Created ${createdCount} ${createdCount === 1 ? 'item' : 'items'}`}
          {createdCount > 0 && scheduledCount > 0 && ' • '}
          {scheduledCount > 0 && `Scheduled ${scheduledCount} ${scheduledCount === 1 ? 'item' : 'items'}`}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <img 
              src={podoLogo} 
              alt="Podo Logo" 
              className="h-10 w-10 object-cover rounded-full border-2 border-gray-200 dark:border-gray-600 shadow-sm"
            />
            <h2 className="text-heading">My Assistant</h2>
          </div>
          <p className="text-body">
            {aiApiKey 
              ? 'Your AI-powered assistant for recipes, workouts, and tasks'
              : 'Configure your AI assistant to get started'
            }
          </p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setShowSettings(true)}
            className="button-secondary flex items-center gap-3"
          >
            <Settings className="w-5 h-5" />
            <span>Settings</span>
          </button>
          <button 
            onClick={clearChat}
            className="button-secondary flex items-center gap-3"
          >
            <Trash2 className="w-5 h-5" />
            <span>Clear Chat</span>
          </button>
        </div>
      </div>

      {/* API Key Status */}
      {!aiApiKey && (
        <div className="card p-6">
          <div className="flex items-center gap-4">
            <div className="icon-container bg-orange-50 border-orange-100 text-orange-600 dark:bg-orange-900/30 dark:border-orange-700 dark:text-orange-400">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className="text-subheading text-orange-900 dark:text-orange-300">Setup Required</h3>
              <p className="text-body text-orange-700 dark:text-orange-400 mt-1">
                Configure your OpenAI API key to enable AI-powered assistance.
              </p>
            </div>
            <button 
              onClick={() => setShowSettings(true)}
              className="button-primary"
            >
              Configure Now
            </button>
          </div>
        </div>
      )}

      {/* Chat Interface */}
      <div className="card">
        {/* Messages Area */}
        <div className="h-96 overflow-y-auto p-6 space-y-6 bg-gray-50/50 dark:bg-gray-800/50">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-4 ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.sender === 'assistant' && (
                <div className={`icon-container flex-shrink-0 ${
                  message.error 
                    ? 'bg-red-50 border-red-100 text-red-600 dark:bg-red-900/30 dark:border-red-700 dark:text-red-400' 
                    : 'bg-brand-50 border-brand-100 text-brand-600'
                }`}>
                  <Bot className="w-5 h-5" />
                </div>
              )}
              
              <div className={`max-w-xs sm:max-w-md lg:max-w-lg ${message.sender === 'user' ? 'order-first' : ''}`}>
                <div
                  className={`p-4 rounded-2xl shadow-sm ${
                    message.sender === 'user'
                      ? 'bg-brand text-white'
                      : message.error
                      ? 'bg-red-50 text-red-900 border border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-700'
                      : 'bg-white text-gray-900 border border-gray-200 dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600'
                  }`}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-line">{message.content}</p>
                </div>
                
                {/* Action Summary */}
                {message.sender === 'assistant' && !message.error && getActionSummary(message.actions)}
                
                <div className="flex items-center gap-2 mt-2 text-caption">
                  <Clock className="w-3 h-3" />
                  <span>{message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>

              {message.sender === 'user' && (
                <div className="icon-container bg-gray-50 border-gray-100 text-gray-600 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-400 flex-shrink-0">
                  <User className="w-5 h-5" />
                </div>
              )}
            </div>
          ))}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex gap-4 justify-start">
              <div className="icon-container bg-brand-50 border-brand-100 text-brand-600 flex-shrink-0">
                <Bot className="w-5 h-5" />
              </div>
              <div className="bg-white text-gray-900 dark:bg-gray-700 dark:text-gray-100 p-4 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-600">
                <div className="flex items-center gap-3">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-brand rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-brand rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-brand rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <span className="text-caption">AI is thinking...</span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-100 dark:border-gray-700 p-6 bg-white dark:bg-gray-800">
          <div className="flex gap-3">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={aiApiKey 
                ? "Ask me to create recipes, workouts, or todos, or schedule them in your week..."
                : "Configure your API key first to start chatting..."
              }
              className="input-field flex-1 resize-none"
              rows={2}
              disabled={isTyping || !aiApiKey}
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isTyping || !aiApiKey}
              className="button-primary p-3 disabled:bg-gray-300 disabled:cursor-not-allowed dark:disabled:bg-gray-600"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      {aiApiKey && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            {
              title: 'Create Recipe',
              description: 'Ask me to create a new recipe',
              icon: <Sparkles className="w-5 h-5" />,
              prompt: 'Create a healthy dinner recipe for tonight'
            },
            {
              title: 'Plan Workout',
              description: 'Get a custom workout routine',
              icon: <Sparkles className="w-5 h-5" />,
              prompt: 'Create a 30-minute morning workout for tomorrow'
            },
            {
              title: 'Organize Tasks',
              description: 'Create and schedule todo lists',
              icon: <Sparkles className="w-5 h-5" />,
              prompt: 'Create a todo list for my weekly planning tasks'
            },
            {
              title: 'Meal Planning',
              description: 'Plan meals for the week',
              icon: <Sparkles className="w-5 h-5" />,
              prompt: 'Help me plan healthy meals for this week'
            },
            {
              title: 'Fitness Goals',
              description: 'Create workout schedules',
              icon: <Sparkles className="w-5 h-5" />,
              prompt: 'Create a weekly workout schedule for strength training'
            },
            {
              title: 'Daily Planning',
              description: 'Organize your daily tasks',
              icon: <Sparkles className="w-5 h-5" />,
              prompt: 'Help me organize my tasks for today'
            }
          ].map((action, index) => (
            <button
              key={index}
              onClick={() => handleQuickAction(action.prompt)}
              className="card card-interactive p-6 text-left"
              disabled={isTyping}
            >
              <div className="flex items-start gap-4">
                <div className="icon-container bg-purple-50 border-purple-100 text-purple-600">
                  {action.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-subheading mb-2">{action.title}</h3>
                  <p className="text-body">{action.description}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Features Info */}
      <div className="card p-8">
        <div className="text-center">
          <div className="icon-container bg-brand-50 border-brand-100 text-brand-600 mx-auto mb-4">
            <MessageCircle className="w-8 h-8" />
          </div>
          <h3 className="text-subheading mb-3">AI-Powered Personal Assistant</h3>
          <p className="text-body max-w-2xl mx-auto">
            {aiApiKey 
              ? `I'm powered by ${aiModel} and can intelligently create recipes, workouts, and todo lists based on your requests. I can also schedule them in your weekly planner automatically. Just tell me what you need!`
              : 'Once configured with your OpenAI API key, I can intelligently create and schedule items in your weekly planner. I understand natural language and can help you stay organized and productive.'
            }
          </p>
          {aiApiKey && (
            <div className="mt-4 text-caption text-gray-600">
              Currently using: {aiModel}
            </div>
          )}
        </div>
      </div>

      {/* AI Settings Modal */}
      <AISettings
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        onSave={setAISettings}
        currentApiKey={aiApiKey}
        currentModel={aiModel}
      />
    </div>
  );
};

export default MyAssistant; 