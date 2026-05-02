import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, Send, X, Bot, User, Sparkles, Loader2 } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export const HealthuChat: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Hi! I\'m Healthu, your AI health companion. How can I help you today?' }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      
      const systemPrompt = `You are Healthu, a knowledgeable, empathetic, and professional AI health assistant for MedVault. 
Your tone is technical yet supportive. You are a "Digital Health Oracle".

IMPORTANT CONSTRAINTS:
1. DISCLAIMER: You MUST start every response with a brief (minimized) professional medical disclaimer if providing health-related info.
2. ACCURACY: Use data-driven language. Mention metrics like heart rate, sleep cycles, and hydration if the user asks about them.
3. LIMITS: You are NOT a doctor. You do NOT prescribe meds.
4. EMERGENCIES: If any red-flag symptoms are mentioned (chest pain, numbness in one side, severe shortness of breath), immediately urge them to call emergency services.
5. FORMATTING: Use Markdown for clarity (bullet points, bold highlights).
6. MedVault Context: You are integrated into MedVault, a high-security biometric health vault.`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          { role: 'user', parts: [{ text: userMessage }] }
        ],
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.6,
        }
      });

      const aiText = response.text || 'I apologize, but my core processors are recalibrating. Please retry.';
      setMessages(prev => [...prev, { role: 'assistant', content: aiText }]);
    } catch (error) {
      console.error('Chat Error:', error);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Connection to Healthu Core lost. Please try again.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100]">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.9, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: 40, scale: 0.9, filter: 'blur(10px)' }}
            className="absolute bottom-24 right-0 w-[90vw] sm:w-[440px] h-[600px] bg-white rounded-[40px] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.14)] border border-slate-100 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-8 bg-slate-900 text-white flex items-center justify-between relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl -mr-16 -mt-16" />
              <div className="flex items-center gap-4 relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center border border-white/10 backdrop-blur-md">
                  <Bot className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <h3 className="font-black text-base tracking-tight italic">HEALTHU_OS</h3>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Core Active</p>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)} 
                className="hover:bg-white/10 p-2.5 rounded-2xl transition-all relative z-10"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-6 scroll-smooth bg-slate-50/50">
              {messages.map((msg, idx) => (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={idx} 
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[85%] flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={`w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center ${
                      msg.role === 'user' ? 'bg-slate-900 text-white shadow-lg shadow-slate-200' : 'bg-white text-blue-600 shadow-sm border border-slate-100'
                    }`}>
                      {msg.role === 'user' ? <User className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                    </div>
                    <div className={`p-5 rounded-3xl text-sm leading-relaxed font-medium shadow-sm border ${
                      msg.role === 'user' 
                        ? 'bg-slate-900 text-white border-slate-900 rounded-tr-none' 
                        : 'bg-white text-slate-700 border-slate-100 rounded-tl-none'
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                </motion.div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white p-4 rounded-3xl border border-slate-100 flex items-center gap-4 shadow-sm">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                    <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest italic">Analyzing Biometrics...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-8 border-t border-slate-100 bg-white">
              <form 
                onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                className="flex items-center gap-3"
              >
                <div className="flex-1 relative group">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="SYMPTOMS / QUERIES..."
                    className="w-full bg-slate-50 border-2 border-transparent rounded-[24px] px-6 py-4 text-sm font-bold tracking-tight focus:outline-none focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 focus:bg-white transition-all uppercase placeholder:italic placeholder:font-black placeholder:text-slate-200"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  className="bg-blue-600 text-white p-4 rounded-2xl hover:bg-blue-700 disabled:opacity-50 disabled:grayscale transition-all active:scale-95 shadow-xl shadow-blue-100"
                >
                  <Send className="w-6 h-6" />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-16 h-16 rounded-[24px] shadow-2xl flex items-center justify-center transition-all border-4 border-white relative ${isOpen ? 'bg-slate-900 text-white rotate-90' : 'bg-blue-600 text-white'}`}
      >
        <div className="absolute inset-0 bg-white/10 rounded-inherit opacity-0 hover:opacity-100 transition-opacity" />
        {isOpen ? <X className="w-7 h-7" /> : <MessageSquare className="w-7 h-7" />}
      </motion.button>
    </div>
  );
};
