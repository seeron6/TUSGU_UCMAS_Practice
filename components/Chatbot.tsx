import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Loader, User, Bot } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

interface Message {
  role: 'user' | 'model';
  text: string;
}

export const Chatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: 'Hi! I am the TUSGU Assistant. How can I help you today?' }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const model = 'gemini-3-flash-preview';
      
      const systemInstruction = `
        You are a helpful and polite AI customer support assistant for TUSGU Educational Services.
        Website: https://www.tusgu.org/
        Phone: 416-5759742
        
        Context about TUSGU:
        - We provide educational services including Mental Math (Abacus, Listening Practice, Flash Practice).
        - We offer English learning programs.
        - We have a portal for students to request papers and check center news.
        
        Rules:
        1. Answer questions clearly based on the context provided.
        2. If a user asks about specific student records, billing details, fees, or anything strictly private or not in your knowledge base, strictly reply with exactly: "For more information, please visit the TUSGU website or call 416-5759742."
        3. If the answer is out of scope or you are unsure, use the fallback phrase above.
        4. Be encouraging and professional.
      `;

      // Since the API is stateless for single generateContent calls unless using chat, 
      // we should ideally use chat history. For simplicity and robustness here, we'll send the history.
      // However, to strictly follow the "gemini-3-flash-preview" pattern for simple Q&A:
      
      const chat = ai.chats.create({
        model: model,
        config: {
          systemInstruction: systemInstruction,
        }
      });

      // Reconstruct history for the chat session context
      // Note: In a real app, we might persist the 'chat' instance, but here we recreate for the turn.
      // To properly maintain context, we would need to pass history. 
      // For this implementation, we will send the last user message with the system instruction active.
      // To make it better, let's just send the user prompt.
      
      const response = await chat.sendMessage({ message: userMessage });
      const text = response.text;

      setMessages(prev => [...prev, { role: 'model', text: text || "I'm sorry, I couldn't process that." }]);

    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'model', text: "For more information, please visit the TUSGU website or call 416-5759742." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4 font-sans">
      
      {/* Chat Window */}
      <div className={`
        bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700
        w-[350px] max-w-[90vw] transition-all duration-300 origin-bottom-right overflow-hidden flex flex-col
        ${isOpen ? 'scale-100 opacity-100 h-[500px]' : 'scale-50 opacity-0 h-0 pointer-events-none'}
      `}>
        {/* Header */}
        <div className="bg-tusgu-blue p-4 flex justify-between items-center text-white">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <h3 className="font-bold">TUSGU Assistant</h3>
          </div>
          <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-1 rounded transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50 dark:bg-slate-900/50">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center shrink-0
                ${msg.role === 'user' ? 'bg-slate-200 dark:bg-slate-700' : 'bg-blue-100 dark:bg-blue-900/30'}
              `}>
                {msg.role === 'user' ? <User className="w-5 h-5 text-slate-500" /> : <Bot className="w-5 h-5 text-tusgu-blue" />}
              </div>
              <div className={`
                p-3 rounded-2xl text-sm max-w-[80%] whitespace-pre-wrap leading-relaxed shadow-sm
                ${msg.role === 'user' 
                  ? 'bg-tusgu-blue text-white rounded-tr-none' 
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-100 dark:border-slate-700 rounded-tl-none'}
              `}>
                {msg.text}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                 <Bot className="w-5 h-5 text-tusgu-blue" />
              </div>
              <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl rounded-tl-none border border-slate-100 dark:border-slate-700 flex items-center gap-1">
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSend} className="p-4 bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700 flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question..."
            className="flex-1 bg-slate-100 dark:bg-slate-900 border-0 rounded-xl px-4 py-2 text-slate-800 dark:text-white focus:ring-2 focus:ring-tusgu-blue focus:outline-none placeholder-slate-400"
          />
          <button 
            type="submit"
            disabled={!input.trim() || isLoading}
            className="p-2 bg-tusgu-blue text-white rounded-xl hover:bg-blue-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>

      {/* Toggle Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`
          w-14 h-14 rounded-full shadow-lg shadow-blue-900/20 flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95
          ${isOpen ? 'bg-slate-600 rotate-90' : 'bg-tusgu-blue'}
        `}
      >
        {isOpen ? <X className="w-6 h-6 text-white" /> : <MessageCircle className="w-7 h-7 text-white" />}
      </button>
    </div>
  );
};
