'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Trash2, MessageSquare, Plus } from 'lucide-react';
import api from '@/lib/api';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Message {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

interface ChatSession {
  id: number;
  title: string;
  created_at: string;
  updated_at: string;
  messages: Message[];
}

interface ChatResponse {
  message: string;
  session_id: number;
  session_title?: string;
}

export default function Chat() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    loadChatHistory();
  }, []);

  const loadChatHistory = async () => {
    try {
      setIsLoadingSessions(true);
      const response = await api.get('/chat/history');
      setSessions(response.data.sessions);
      
      // Load the most recent session if available
      if (response.data.sessions.length > 0) {
        const mostRecentSession = response.data.sessions[0];
        setActiveSessionId(mostRecentSession.id);
        loadSessionMessages(mostRecentSession.id);
      }
    } catch (error: any) {
      console.error('Failed to load chat history:', error);
      
      // Handle authentication error
      if (error.response?.status === 401) {
        console.log('Authentication required, redirecting to login...');
        setTimeout(() => {
          window.location.href = '/';
        }, 1000);
      }
    } finally {
      setIsLoadingSessions(false);
    }
  };

  const loadSessionMessages = async (sessionId: number) => {
    try {
      const response = await api.get(`/chat/session/${sessionId}/messages`, { timeout: 30000 });
      setMessages(response.data.messages);
    } catch (error) {
      console.error('Failed to load session messages:', error);
    }
  };

  async function postWithRetry<T = any>(
    url: string,
    data: any,
    options: { attempts?: number; timeoutMs?: number } = {}
  ) {
    const attempts = options.attempts ?? 3;
    const timeoutMs = options.timeoutMs ?? 30000;

    let lastError: any = null;
    for (let attempt = 1; attempt <= attempts; attempt++) {
      try {
        const res = await api.post<T>(url, data, { timeout: timeoutMs });
        return res;
      } catch (err: any) {
        lastError = err;
        const isTimeout = err?.code === 'ECONNABORTED' || err?.message?.includes('timeout');
        if (!isTimeout || attempt === attempts) {
          break;
        }
        // exponential backoff: 1s, 2s
        const backoff = 1000 * Math.pow(2, attempt - 1);
        await new Promise((r) => setTimeout(r, backoff));
      }
    }
    throw lastError;
  }

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = inputMessage;
    setInputMessage('');
    setIsLoading(true);

    // Add user message to UI immediately
    const tempUserMessage: Message = {
      id: Date.now(),
      role: 'user',
      content: userMessage,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, tempUserMessage]);

    try {
      const response = await postWithRetry<ChatResponse>(
        '/chat/send',
        { message: userMessage, session_id: activeSessionId },
        { attempts: 3, timeoutMs: 30000 }
      );

      // If it's a new session, update the active session and sessions list
      if (!activeSessionId || response.data.session_title) {
        setActiveSessionId(response.data.session_id);
        await loadChatHistory(); // Refresh sessions list
      }

      // Add assistant message
      const assistantMessage: Message = {
        id: Date.now() + 1,
        role: 'assistant',
        content: response.data.message,
        created_at: new Date().toISOString(),
      };

      setMessages(prev => [...prev.slice(0, -1), tempUserMessage, assistantMessage]);
    } catch (error: any) {
      console.error('Failed to send message:', error);
      
      // Handle specific error cases
      let errorMessage = 'Sorry, I encountered an error. Please try again.';
      
      if (error.response?.status === 401) {
        errorMessage = '🔒 Authentication required. Please log in again to continue chatting.';
        // Redirect to login after a short delay
        setTimeout(() => {
          window.location.href = '/';
        }, 2000);
      } else if (error.response?.status === 503) {
        errorMessage = '🔧 Chat service is currently unavailable. The OpenAI API key needs to be configured. Please contact support.';
      } else if (error.code === 'ECONNABORTED') {
        errorMessage = '⏱️ The server is taking longer than expected. Please try again.';
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      }
      
      // Add error message
      const errorAssistantMessage: Message = {
        id: Date.now() + 1,
        role: 'assistant',
        content: errorMessage,
        created_at: new Date().toISOString(),
      };

      setMessages(prev => [...prev.slice(0, -1), tempUserMessage, errorAssistantMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const createNewChat = () => {
    setActiveSessionId(null);
    setMessages([]);
  };

  const deleteSession = async (sessionId: number) => {
    try {
      await api.delete(`/chat/session/${sessionId}`);
      setSessions(prev => prev.filter(s => s.id !== sessionId));
      
      if (activeSessionId === sessionId) {
        setActiveSessionId(null);
        setMessages([]);
      }
    } catch (error) {
      console.error('Failed to delete session:', error);
    }
  };

  const selectSession = (session: ChatSession) => {
    setActiveSessionId(session.id);
    loadSessionMessages(session.id);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const MarkdownMessage = ({ content, isUser }: { content: string; isUser: boolean }) => {
    return (
      <div className={`prose prose-sm max-w-none ${isUser ? 'prose-invert' : 'text-slate-900'} prose-headings:mt-2 prose-headings:mb-2 prose-p:my-2 prose-ul:my-2 prose-ol:my-2 prose-table:my-3`}>
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            table: ({ node, ...props }) => (
              <table className="w-full border border-slate-300 border-collapse my-3" {...props} />
            ),
            thead: ({ node, ...props }) => (
              <thead className="bg-slate-50" {...props} />
            ),
            tr: ({ node, ...props }) => (
              <tr className="even:bg-slate-50/50" {...props} />
            ),
            th: ({ node, style, align, ...props }) => (
              <th
                className="border border-slate-300 px-3 py-2 text-left font-semibold text-slate-700"
                style={style}
                {...props}
              />
            ),
            td: ({ node, style, align, ...props }) => (
              <td
                className="border border-slate-300 px-3 py-2 align-top"
                style={style}
                {...props}
              />
            ),
            code: ({ inline, className, children, ...props }) => {
              if (inline) {
                return (
                  <code className="bg-slate-100 text-slate-800 px-1 py-0.5 rounded" {...props}>
                    {children}
                  </code>
                );
              }
              return (
                <pre className="bg-slate-900 text-slate-100 rounded-md p-3 overflow-x-auto">
                  <code className={className} {...props}>{children}</code>
                </pre>
              );
            },
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    );
  };

  // Removed naive formatter in favor of ReactMarkdown

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Sidebar */}
      <div className="w-80 bg-white/80 backdrop-blur-sm border-r border-slate-200 flex flex-col shadow-lg">
        {/* Header */}
        <div className="p-4 border-b border-slate-200">
          <div className="flex items-center space-x-3 mb-4">
            <div className="h-10 w-10 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center">
              <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <div>
              <h3 className="font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Study Assistant</h3>
              <p className="text-xs text-slate-500">Chat Sessions</p>
            </div>
          </div>
          <button
            onClick={createNewChat}
            className="w-full flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
          >
            <Plus size={20} />
            New Chat
          </button>
        </div>

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoadingSessions ? (
            <div className="text-slate-500 text-center py-8 flex flex-col items-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-3"></div>
              Loading AI sessions...
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-slate-500 text-center py-8">
              <div className="h-12 w-12 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <MessageSquare size={24} className="text-indigo-600" />
              </div>
              <p className="font-semibold text-slate-700">No AI sessions yet</p>
              <p className="text-sm">Start your first conversation!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className={`group flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200 ${
                    activeSessionId === session.id
                      ? 'bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 shadow-sm'
                      : 'hover:bg-slate-50 border border-transparent hover:border-slate-200'
                  }`}
                  onClick={() => selectSession(session)}
                >
                  <div className="h-8 w-8 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <MessageSquare size={16} className="text-indigo-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-slate-900 truncate">
                      {session.title || 'AI Conversation'}
                    </div>
                    <div className="text-xs text-slate-500">
                      {new Date(session.updated_at).toLocaleDateString()}
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteSession(session.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="bg-white/80 backdrop-blur-sm border-b border-slate-200 p-6 shadow-sm">
          <div className="flex items-center space-x-4">
            <div className="h-12 w-12 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center">
              <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">
                Study Assistant
              </h1>
              <p className="text-sm text-slate-600 mt-1">
                Your intelligent guide for UK university admissions and study planning
              </p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.length === 0 && !isLoading ? (
            <div className="text-center py-16 max-w-4xl mx-auto">
              <div className="h-20 w-20 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <svg className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-4">
                Welcome to Your Study Assistant!
              </h3>
              <p className="text-slate-600 max-w-xl mx-auto leading-relaxed">
                I'm here to help with university selection, application strategies, and visa requirements for your UK study journey.
              </p>
              <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto">
                <button
                  onClick={() => setInputMessage("What are the top universities in the UK for Computer Science?")}
                  className="group p-4 text-left bg-white border border-slate-200 rounded-xl hover:border-indigo-300 hover:shadow-lg transition-all duration-200"
                >
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="h-8 w-8 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-lg flex items-center justify-center">
                      <svg className="h-4 w-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                      </svg>
                    </div>
                    <div className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">University Rankings</div>
                  </div>
                  <div className="text-sm text-slate-600">Discover top UK universities for your field of study</div>
                </button>
                <button
                  onClick={() => setInputMessage("What are the IELTS requirements for UK universities?")}
                  className="group p-4 text-left bg-white border border-slate-200 rounded-xl hover:border-indigo-300 hover:shadow-lg transition-all duration-200"
                >
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="h-8 w-8 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-lg flex items-center justify-center">
                      <svg className="h-4 w-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                      </svg>
                    </div>
                    <div className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">Language Requirements</div>
                  </div>
                  <div className="text-sm text-slate-600">IELTS, TOEFL, and English proficiency requirements</div>
                </button>
                <button
                  onClick={() => setInputMessage("How do I apply through UCAS?")}
                  className="group p-4 text-left bg-white border border-slate-200 rounded-xl hover:border-indigo-300 hover:shadow-lg transition-all duration-200"
                >
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="h-8 w-8 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-lg flex items-center justify-center">
                      <svg className="h-4 w-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">Application Process</div>
                  </div>
                  <div className="text-sm text-slate-600">UCAS applications and direct university applications</div>
                </button>
                <button
                  onClick={() => setInputMessage("What are the student visa requirements for the UK?")}
                  className="group p-4 text-left bg-white border border-slate-200 rounded-xl hover:border-indigo-300 hover:shadow-lg transition-all duration-200"
                >
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="h-8 w-8 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-lg flex items-center justify-center">
                      <svg className="h-4 w-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                    <div className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">Visa Guidance</div>
                  </div>
                  <div className="text-sm text-slate-600">Student visa requirements and application process</div>
                </button>
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {message.role === 'assistant' && (
                  <div className="w-10 h-10 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
                    <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                )}
                
                <div
                  className={`max-w-3xl px-5 py-4 rounded-2xl shadow-sm ${
                    message.role === 'user'
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white ml-16'
                      : 'bg-white border border-slate-200 mr-16'
                  }`}
                >
                  <MarkdownMessage content={message.content} isUser={message.role === 'user'} />
                </div>

                {message.role === 'user' && (
                  <div className="w-10 h-10 bg-slate-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
                    <User size={18} className="text-white" />
                  </div>
                )}
              </div>
            ))
          )}
          
          {isLoading && (
            <div className="flex gap-3 justify-start">
              <div className="w-10 h-10 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
                <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl px-5 py-4 shadow-sm">
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <span className="text-sm text-slate-500 ml-2">AI is thinking...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="bg-white/80 backdrop-blur-sm border-t border-slate-200 p-6 shadow-lg">
          <div className="max-w-4xl mx-auto">
            <div className="flex gap-4 items-end">
              <div className="flex-1 relative">
                <textarea
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me anything about UK university admissions..."
                  className="w-full px-6 py-4 pr-16 border border-slate-300 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none max-h-32 bg-slate-50 focus:bg-white transition-colors text-slate-900 placeholder-slate-500 shadow-sm"
                  rows={1}
                  disabled={isLoading}
                />
                <button
                  onClick={sendMessage}
                  disabled={!inputMessage.trim() || isLoading}
                  className="absolute right-3 bottom-3 p-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <Send size={20} />
                </button>
              </div>
            </div>
            <div className="text-xs text-slate-500 mt-3 text-center flex items-center justify-center space-x-4">
              <span>Press Enter to send, Shift + Enter for new line</span>
              <span>•</span>
              <span className="flex items-center space-x-1">
                <svg className="h-3 w-3 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <span>StudyCopilot</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
