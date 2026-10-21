import React, { useRef, useEffect, useState } from 'react';
import { Volume2, Play, Square, MessageSquare, Trash2, Calendar, FileText, Send, Loader2, Sparkles } from 'lucide-react';

export default function ChatHistory({ 
  messages, 
  onPlayAudio, 
  currentlyPlayingUrl, 
  onClearHistory, 
  isGenerating, 
  onSummarizeText,
  isSummarizing
}) {
  const chatEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const [inputText, setInputText] = useState("");

  // Auto scroll to bottom when new messages arrive or loading state changes
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isGenerating]);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Pass file object to summarization handler
    onSummarizeText(file);
    // Clear input
    e.target.value = "";
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  const formatTime = (timeStr) => {
    try {
      const date = new Date(timeStr);
      if (isNaN(date.getTime())) {
        return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/40 rounded-2xl border border-slate-800/80 overflow-hidden backdrop-blur-md shadow-lg">
      
      {/* Header Panel */}
      <div className="flex items-center justify-between p-4 bg-slate-900 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-rose-400" />
          <span className="font-semibold text-slate-200 text-sm md:text-base">உரையாடல் வரலாறு (Chat History)</span>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Text Summarizer Button */}
          <button
            onClick={triggerFileUpload}
            disabled={isSummarizing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 hover:text-white text-xs font-medium transition-all"
            title="உரையைச் சுருக்க கோப்பை பதிவேற்றுக"
          >
            {isSummarizing ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-400" />
            ) : (
              <FileText className="w-3.5 h-3.5 text-rose-400" />
            )}
            <span className="hidden sm:inline">சுருக்கம் (Summarize)</span>
          </button>
          
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept=".txt" 
            className="hidden" 
          />

          {/* Clear History Button */}
          <button 
            onClick={onClearHistory}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
            title="வரலாற்றை அழி"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Chat Messages Log */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 min-h-0">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-slate-600" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-slate-300">இங்கு உரையாடல்கள் எதுவும் இல்லை</p>
              <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
                மைக்கை அழுத்தி தமிழில் பேசத் தொடங்குங்கள் அல்லது உதவி பெற வணக்கம் கூறுங்கள்!
              </p>
            </div>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isUser = msg.role === 'user';
            return (
              <div 
                key={msg.id || index} 
                className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-200`}
              >
                <div className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 shadow-sm relative ${
                  isUser 
                    ? 'bg-rose-600 text-white rounded-tr-none' 
                    : 'bg-slate-800/80 text-slate-100 border border-slate-700/60 rounded-tl-none'
                }`}>
                  
                  {/* Speaker Label */}
                  <div className="flex items-center gap-1.5 mb-1 text-[10px] font-semibold tracking-wider uppercase opacity-60">
                    <span>{isUser ? 'பயனர் (User)' : 'உதவியாளர் (AI)'}</span>
                  </div>

                  {/* Message Content */}
                  <p className="text-sm leading-relaxed whitespace-pre-line text-slate-100 font-normal">
                    {msg.text}
                  </p>

                  {/* Footer (Timestamp + Play Button for AI) */}
                  <div className="flex items-center justify-between gap-6 mt-2 pt-1 border-t border-white/10 text-[10px] opacity-75">
                    <span>{formatTime(msg.timestamp)}</span>
                    
                    {!isUser && msg.audio_url && (
                      <button
                        onClick={() => onPlayAudio(msg.audio_url)}
                        className={`flex items-center gap-1 p-1 -m-1 rounded hover:bg-slate-700 transition-colors ${
                          currentlyPlayingUrl === msg.audio_url ? 'text-rose-400 font-bold' : 'text-slate-300'
                        }`}
                      >
                        {currentlyPlayingUrl === msg.audio_url ? (
                          <>
                            <Square className="w-3 h-3 fill-rose-400 text-rose-400" />
                            <span>நிறுத்து</span>
                          </>
                        ) : (
                          <>
                            <Volume2 className="w-3 h-3" />
                            <span>கேள்</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}

        {/* Gemini Response Typing / Generating State */}
        {isGenerating && (
          <div className="flex w-full justify-start animate-pulse">
            <div className="max-w-[75%] bg-slate-800/50 rounded-2xl rounded-tl-none p-4 border border-slate-700/40">
              <div className="flex items-center gap-2 text-rose-400">
                <Sparkles className="w-4 h-4 animate-spin" />
                <span className="text-xs font-semibold uppercase tracking-wider">AI சிந்திக்கிறது...</span>
              </div>
              <div className="flex items-center gap-1 mt-2.5">
                <span className="w-2 h-2 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-2 h-2 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-2 h-2 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </div>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>
    </div>
  );
}
