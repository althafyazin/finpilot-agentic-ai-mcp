import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  X,
  Send,
  Sparkles,
  Loader2,
  Bot,
  User,
  Wrench,
  ChevronDown,
} from 'lucide-react';
import aiApi from '../api/aiApi';

/**
 * AI Chat Panel — Floating chat assistant for FinanceFlow.
 *
 * Features:
 * - Collapsible floating panel anchored to bottom-right
 * - Message history within the session
 * - Shows which tools the AI used (transparency)
 * - Loading states and error handling
 * - Auto-scroll to latest message
 * - Consistent with existing dark/light theme
 */

// Suggested prompts for new users
const SUGGESTED_PROMPTS = [
  'How much did I spend this month?',
  'Compare this month to last month',
  'What are my top expense categories?',
  'What if I cut dining out by 15%?',
];

const AIChat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content:
        "Hi! I'm your FinanceFlow AI assistant. Ask me anything about your finances — spending patterns, budget status, income trends, and more.",
      toolsUsed: [],
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const sendMessage = async (messageText) => {
    const trimmed = (messageText || input).trim();
    if (!trimmed || isLoading) return;

    // Add user message to chat
    const userMessage = { role: 'user', content: trimmed };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await aiApi.chat(trimmed);
      const aiResponse = {
        role: 'assistant',
        content: response.data?.response || response.response || 'I could not generate a response.',
        toolsUsed: response.data?.toolsUsed || response.toolsUsed || [],
      };
      setMessages((prev) => [...prev, aiResponse]);
    } catch (error) {
      const errorMessage = {
        role: 'assistant',
        content: `Sorry, I encountered an error: ${error.message || 'Something went wrong'}. Please try again.`,
        toolsUsed: [],
        isError: true,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const toolDisplayNames = {
    get_expenses: 'Expense Records',
    get_income: 'Income Records',
    get_financial_summary: 'Financial Summary',
    get_budget_status: 'Budget Status',
    get_category_breakdown: 'Category Breakdown',
    compare_periods: 'Period Comparison',
    simulate_budget_change: 'Budget Simulation',
  };

  return (
    <>
      {/* ─── Floating Toggle Button ────────────────────────────────── */}
      {!isOpen && (
        <button
          id="ai-chat-toggle"
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 p-4 bg-gradient-to-br from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-2xl shadow-lg shadow-indigo-500/30 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-indigo-500/40 group"
          title="Open AI Assistant"
        >
          <Sparkles className="w-6 h-6 group-hover:rotate-12 transition-transform" />
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full animate-pulse" />
        </button>
      )}

      {/* ─── Chat Panel ────────────────────────────────────────────── */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[400px] max-w-[calc(100vw-2rem)] h-[600px] max-h-[calc(100vh-6rem)] bg-white dark:bg-slate-800 rounded-2xl shadow-2xl shadow-slate-900/20 dark:shadow-black/40 border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden animate-fade-in">
          {/* ─── Header ─────────────────────────────────────────── */}
          <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-indigo-600 to-violet-600 text-white shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur-sm">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">FinanceFlow AI</h3>
                <p className="text-xs text-indigo-200">Ask about your finances</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* ─── Messages Area ──────────────────────────────────── */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scroll-smooth">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                {/* Avatar */}
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                    msg.role === 'user'
                      ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400'
                      : 'bg-violet-100 dark:bg-violet-900/50 text-violet-600 dark:text-violet-400'
                  }`}
                >
                  {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                {/* Message Bubble */}
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-indigo-600 text-white rounded-tr-md'
                      : msg.isError
                      ? 'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-tl-md'
                      : 'bg-slate-100 dark:bg-slate-700/60 text-slate-800 dark:text-slate-200 rounded-tl-md'
                  }`}
                >
                  {/* Message Content — render with basic markdown-like formatting */}
                  <div className="whitespace-pre-wrap break-words">{msg.content}</div>

                  {/* Tools Used Badge */}
                  {msg.toolsUsed && msg.toolsUsed.length > 0 && (
                    <div className="mt-2.5 pt-2.5 border-t border-slate-200/60 dark:border-slate-600/60">
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 mb-1.5">
                        <Wrench className="w-3 h-3" />
                        <span className="font-medium">Data sources used:</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {msg.toolsUsed.map((tool, tIdx) => (
                          <span
                            key={tIdx}
                            className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-md text-[10px] font-medium border border-indigo-100 dark:border-indigo-800/50"
                          >
                            {toolDisplayNames[tool] || tool}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Loading Indicator */}
            {isLoading && (
              <div className="flex gap-2.5">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 bg-violet-100 dark:bg-violet-900/50 text-violet-600 dark:text-violet-400">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-slate-100 dark:bg-slate-700/60 rounded-2xl rounded-tl-md px-4 py-3">
                  <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Analyzing your data...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* ─── Suggested Prompts (shown when few messages) ──── */}
          {messages.length <= 1 && !isLoading && (
            <div className="px-4 pb-3 shrink-0">
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mb-2 font-medium uppercase tracking-wider">
                Try asking
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                {SUGGESTED_PROMPTS.map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => sendMessage(prompt)}
                    className="text-left px-3 py-2 text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-700/40 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ─── Input Area ─────────────────────────────────────── */}
          <div className="px-4 pb-4 pt-2 border-t border-slate-200 dark:border-slate-700 shrink-0">
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about your finances..."
                rows={1}
                disabled={isLoading}
                className="flex-1 resize-none rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50 text-slate-800 dark:text-slate-200 text-sm px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 placeholder:text-slate-400 dark:placeholder:text-slate-500 disabled:opacity-50 transition-colors"
                style={{ maxHeight: '100px' }}
              />
              <button
                onClick={() => sendMessage()}
                disabled={!input.trim() || isLoading}
                className="p-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-300 dark:disabled:bg-slate-600 text-white rounded-xl transition-all duration-200 disabled:cursor-not-allowed shrink-0"
                title="Send message"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-2 text-center">
              AI responses are based on your actual financial data. Always verify important figures.
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default AIChat;
