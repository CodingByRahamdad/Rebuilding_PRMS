import React, { useState } from 'react';
import { X, Send, User, MessageSquare, Check, Sparkles, PhoneCall } from 'lucide-react';
import { ChatMessage } from '../types';

interface MessageModalProps {
  recipientName: string;
  recipientRole?: string;
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  onClose: () => void;
}

export const MessageModal: React.FC<MessageModalProps> = ({
  recipientName,
  recipientRole = 'Hospital Staff',
  messages,
  onSendMessage,
  onClose,
}) => {
  const [inputText, setInputText] = useState('');

  const quickPrompts = [
    'Can you please confirm patient status update?',
    'Emergency ward bed allocation required.',
    'Please forward the latest lab results.',
    'Shift handover notes ready.',
  ];

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 cursor-pointer"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg h-[85vh] max-h-[650px] flex flex-col overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-200 cursor-default"
      >
        
        {/* Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-teal-600 flex items-center justify-center font-bold text-white shadow-xs">
              {recipientName.charAt(0)}
            </div>
            <div>
              <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
                {recipientName}
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
              </h3>
              <p className="text-xs text-slate-300">{recipientRole}</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => alert(`Initiating direct internal extension call to ${recipientName}...`)}
              className="p-2 text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 transition"
              title="Internal Voice Call"
            >
              <PhoneCall className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 transition"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Chat History Area */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/70">
          <div className="text-center my-2">
            <span className="px-3 py-1 bg-slate-200/70 text-slate-600 text-[11px] font-medium rounded-full">
              Encrypted Internal Hospital Channel
            </span>
          </div>

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.isSender ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[82%] px-4 py-2.5 rounded-2xl text-xs sm:text-sm shadow-xs ${
                  msg.isSender
                    ? 'bg-teal-700 text-white rounded-tr-none'
                    : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none'
                }`}
              >
                <p>{msg.text}</p>
              </div>
              <span className="text-[10px] text-slate-400 mt-1 px-1">
                {msg.timestamp}
              </span>
            </div>
          ))}
        </div>

        {/* Quick Prompts */}
        <div className="px-3 py-2 bg-white border-t border-slate-100 overflow-x-auto no-scrollbar">
          <div className="flex gap-1.5 min-w-max">
            {quickPrompts.map((prompt, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setInputText(prompt)}
                className="px-2.5 py-1 bg-slate-100 hover:bg-teal-50 hover:text-teal-800 text-slate-600 text-[11px] font-medium rounded-full transition whitespace-nowrap"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSend} className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={`Message ${recipientName}...`}
            className="flex-1 px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="p-2.5 bg-teal-700 hover:bg-teal-800 disabled:opacity-50 text-white rounded-xl transition flex items-center justify-center shadow-xs"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

      </div>
    </div>
  );
};
