import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Loader2, FileText, X, Volume2, VolumeX, StopCircle, Trash2, Menu, Sparkles, MapPin, Beaker, GraduationCap } from 'lucide-react';
import { Chat } from "@google/genai";
import { createSchoolChat, generateSpeech } from '../services/geminiService';
import { Message, Role } from '../types';

// Helper to read file as base64
const readFileBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// Audio helpers
function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

interface ChatInterfaceProps {
  isDarkMode: boolean;
  externalMessage?: string | null;
  onExternalMessageHandled?: () => void;
  onToggleSidebar?: () => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ isDarkMode, externalMessage, onExternalMessageHandled, onToggleSidebar }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: Role.MODEL,
      text: "Ciao! 👋 Sono qui per aiutarti a scoprire l'ISIS G.D. Romagnosi. Di cosa vuoi parlare?",
      timestamp: Date.now()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [chatInstance, setChatInstance] = useState<Chat | null>(null);
  
  // Context file state
  const [attachedFile, setAttachedFile] = useState<File | null>(null);

  // Audio state
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
  const [loadingAudioId, setLoadingAudioId] = useState<string | null>(null);
  const [isAutoPlay, setIsAutoPlay] = useState(false);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const audioCache = useRef<Map<string, AudioBuffer>>(new Map());
  const isAutoPlayRef = useRef(isAutoPlay);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const AVATAR_URL = "https://20.gdromagnosi.it/img/xtra/logo.png";

  // Quick Action Cards Data
  const quickActions = [
    { icon: <GraduationCap size={18} />, text: "Indirizzi", prompt: "Quali indirizzi di studio ci sono?" },
    { icon: <Beaker size={18} />, text: "Laboratori", prompt: "Come sono i laboratori della scuola?" },
    { icon: <MapPin size={18} />, text: "Dove Siamo", prompt: "Dove si trovano le sedi della scuola?" },
    { icon: <Sparkles size={18} />, text: "Progetti", prompt: "Quali progetti extrascolastici fate?" },
  ];

  // Sync ref
  useEffect(() => {
    isAutoPlayRef.current = isAutoPlay;
  }, [isAutoPlay]);

  // Initialize chat
  useEffect(() => {
    const chat = createSchoolChat();
    setChatInstance(chat);
  }, []);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

  // Handle external messages (FAQ clicks)
  useEffect(() => {
    if (externalMessage && !isThinking && chatInstance) {
        handleSendMessage(undefined, externalMessage);
        if (onExternalMessageHandled) {
            onExternalMessageHandled();
        }
    }
  }, [externalMessage, isThinking, chatInstance]);

  // Cleanup audio context on unmount
  useEffect(() => {
    return () => {
      if (audioSourceRef.current) {
        audioSourceRef.current.stop();
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type === 'application/pdf') {
        setAttachedFile(file);
      } else {
        alert("Per favore seleziona un file PDF.");
      }
    }
  };

  const clearFile = () => {
    setAttachedFile(null);
  };

  const handlePlayAudio = async (messageId: string, text: string) => {
    // If clicking the currently playing message, stop it
    if (playingMessageId === messageId) {
      if (audioSourceRef.current) {
        audioSourceRef.current.stop();
      }
      setPlayingMessageId(null);
      return;
    }

    // Stop any other playing message
    if (audioSourceRef.current) {
      audioSourceRef.current.stop();
      setPlayingMessageId(null);
    }

    try {
      setLoadingAudioId(messageId);

      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }
      const ctx = audioContextRef.current;

      if (ctx.state === 'suspended') {
        await ctx.resume();
      }

      // Check cache first
      let buffer = audioCache.current.get(messageId);

      if (!buffer) {
          const base64Audio = await generateSpeech(text);
          let audioBytes = decode(base64Audio);
          
          // Safety: Int16Array requires even byte length
          if (audioBytes.length % 2 !== 0) {
            audioBytes = audioBytes.subarray(0, audioBytes.length - 1);
          }

          buffer = await decodeAudioData(audioBytes, ctx, 24000, 1);
          audioCache.current.set(messageId, buffer);
      }

      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      
      source.onended = () => {
        setPlayingMessageId(null);
        audioSourceRef.current = null;
      };

      audioSourceRef.current = source;
      source.start();
      setPlayingMessageId(messageId);

    } catch (err) {
      console.error("Error playing audio:", err);
    } finally {
      setLoadingAudioId(null);
    }
  };

  const handleClearChat = () => {
    setMessages([{
      id: 'welcome',
      role: Role.MODEL,
      text: "Chat resettata! 👋 \nCome posso aiutarti ora?",
      timestamp: Date.now()
    }]);
    audioCache.current.clear();
    setChatInstance(createSchoolChat());
  };

  const handleSendMessage = async (e?: React.FormEvent, overrideText?: string) => {
    e?.preventDefault();
    
    const textToSend = overrideText || inputValue.trim();

    if ((!textToSend && !attachedFile) || !chatInstance || isThinking) return;

    const tempFile = attachedFile;
    
    if (!overrideText) {
        setInputValue('');
    }
    setAttachedFile(null);

    const newMessage: Message = {
      id: Date.now().toString(),
      role: Role.USER,
      text: textToSend || (tempFile ? `Inviato file: ${tempFile.name}` : ''),
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, newMessage]);
    setIsThinking(true);

    try {
      let responseText = "";
      
      if (tempFile) {
        const base64 = await readFileBase64(tempFile);
        const result = await chatInstance.sendMessageStream({
          message: [
            { inlineData: { mimeType: 'application/pdf', data: base64 } },
            { text: textToSend || "Ecco un documento aggiuntivo. Usalo per rispondere." }
          ]
        });
        
        for await (const chunk of result) {
            const text = chunk.text;
            if (text) {
                responseText += text;
                setMessages(prev => {
                    const last = prev[prev.length - 1];
                    if (last.role === Role.MODEL && last.id === 'temp-response') {
                         return [...prev.slice(0, -1), { ...last, text: responseText }];
                    } else {
                         return [...prev, { id: 'temp-response', role: Role.MODEL, text: responseText, timestamp: Date.now() }];
                    }
                });
            }
        }
      } else {
         const result = await chatInstance.sendMessageStream({ message: textToSend });
         for await (const chunk of result) {
            const text = chunk.text;
            if (text) {
                responseText += text;
                setMessages(prev => {
                    const last = prev[prev.length - 1];
                    if (last.role === Role.MODEL && last.id === 'temp-response') {
                         return [...prev.slice(0, -1), { ...last, text: responseText }];
                    } else {
                         return [...prev, { id: 'temp-response', role: Role.MODEL, text: responseText, timestamp: Date.now() }];
                    }
                });
            }
         }
      }
      
      const finalId = Date.now().toString();
      setMessages(prev => prev.map(msg => msg.id === 'temp-response' ? { ...msg, id: finalId } : msg));

      if (isAutoPlayRef.current && responseText) {
          setTimeout(() => {
              handlePlayAudio(finalId, responseText);
          }, 100);
      }

    } catch (error) {
       console.error(error);
       setMessages(prev => [...prev, {
           id: Date.now().toString(),
           role: Role.MODEL,
           text: "Scusa, ho avuto un piccolo problema tecnico. Riprova tra un attimo! 😓",
           timestamp: Date.now(),
           isError: true
       }]);
    } finally {
        setIsThinking(false);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-transparent">
      
      {/* Minimal Header */}
      <div className={`flex items-center justify-between px-4 py-3 border-b z-20 relative transition-colors ${
          isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-100'
      }`}>
        <div className="flex items-center gap-3">
           {onToggleSidebar && (
              <button 
                onClick={onToggleSidebar}
                className={`md:hidden p-2 -ml-2 rounded-lg transition-colors ${isDarkMode ? 'text-slate-400 hover:bg-slate-900' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                  <Menu size={20} />
              </button>
           )}
           <div className={`w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden`}>
              <img src={AVATAR_URL} alt="Bot" className="w-full h-full object-contain" />
           </div>
           <div className="hidden xs:block">
              <h2 className={`font-semibold text-sm ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>Chatbot</h2>
           </div>
        </div>
        <div className="flex items-center gap-1">
            <button
                onClick={() => setIsAutoPlay(!isAutoPlay)}
                className={`p-2 rounded-lg transition-colors ${
                    isAutoPlay 
                        ? (isDarkMode ? 'text-indigo-400 bg-indigo-500/10' : 'text-indigo-600 bg-indigo-50')
                        : (isDarkMode ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-700')
                }`}
                title="Lettura automatica"
            >
                {isAutoPlay ? <Volume2 size={18} /> : <VolumeX size={18} />}
            </button>
            <button 
              onClick={handleClearChat}
              className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'text-slate-500 hover:text-red-400' : 'text-slate-400 hover:text-red-600'}`}
              title="Cancella chat"
            >
              <Trash2 size={18} />
            </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6 custom-scrollbar scroll-smooth">
          {messages.length === 1 && (
             <div className="max-w-2xl mx-auto mt-8 grid grid-cols-2 gap-3 animate-pop-in">
                 {quickActions.map((action, idx) => (
                    <button 
                        key={idx}
                        onClick={() => handleSendMessage(undefined, action.prompt)}
                        className={`p-4 rounded-xl text-left transition-all border hover:border-indigo-500/50 group ${
                            isDarkMode 
                            ? 'bg-slate-900 border-slate-800 text-slate-300' 
                            : 'bg-slate-50 border-slate-200 text-slate-700'
                        }`}
                    >
                        <div className={`mb-2 ${isDarkMode ? 'text-slate-500 group-hover:text-indigo-400' : 'text-slate-400 group-hover:text-indigo-600'}`}>
                            {action.icon}
                        </div>
                        <p className="font-medium text-sm">{action.text}</p>
                    </button>
                 ))}
             </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col gap-1 max-w-[90%] md:max-w-[75%] animate-message ${msg.role === Role.USER ? 'ml-auto items-end' : 'mr-auto items-start'}`}
            >
              <div
                className={`rounded-2xl px-5 py-3 text-sm md:text-[15px] leading-relaxed ${
                  msg.role === Role.USER
                    ? (isDarkMode ? 'bg-slate-100 text-slate-900' : 'bg-slate-900 text-white')
                    : (isDarkMode ? 'bg-slate-900 text-slate-100' : 'bg-slate-100 text-slate-800')
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.text}</div>
              </div>
              
              {/* Tools */}
              {msg.role === Role.MODEL && !msg.isError && (
                <button 
                    onClick={() => handlePlayAudio(msg.id, msg.text)}
                    disabled={loadingAudioId === msg.id}
                    className={`px-2 py-1 text-xs font-medium flex items-center gap-1.5 opacity-60 hover:opacity-100 transition-opacity ${
                        playingMessageId === msg.id 
                            ? 'text-indigo-500' 
                            : (isDarkMode ? 'text-slate-500' : 'text-slate-400')
                    }`}
                >
                    {loadingAudioId === msg.id ? (
                        <Loader2 size={12} className="animate-spin" />
                    ) : playingMessageId === msg.id ? (
                        <><StopCircle size={14} /> Stop</>
                    ) : (
                        <><Volume2 size={14} /> Ascolta</>
                    )}
                </button>
               )}
            </div>
          ))}
          
          {isThinking && (
            <div className="flex items-start animate-message">
                <div className={`px-4 py-3 rounded-2xl flex items-center gap-1.5 ${
                    isDarkMode ? 'bg-slate-900' : 'bg-slate-100'
                }`}>
                   <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                   <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                   <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                </div>
            </div>
          )}
          <div ref={messagesEndRef} />
      </div>

      {/* Input Area (Bottom Bar) */}
      <div className={`p-4 border-t ${isDarkMode ? 'border-slate-800 bg-slate-950' : 'border-slate-100 bg-white'}`}>
        <div className="max-w-3xl mx-auto w-full relative">
            {attachedFile && (
            <div className={`absolute bottom-full left-0 mb-2 p-2 rounded-lg flex items-center justify-between text-xs font-medium border animate-message w-full ${
                isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}>
                <div className="flex items-center gap-2">
                    <FileText size={14} />
                    <span className="truncate">{attachedFile.name}</span>
                </div>
                <button onClick={clearFile} className="hover:text-red-500">
                    <X size={14} />
                </button>
            </div>
            )}

            <form onSubmit={handleSendMessage} className={`flex items-center gap-2 rounded-full px-2 py-2 border transition-colors ${
                isDarkMode 
                ? 'border-slate-800 bg-slate-900 focus-within:border-slate-700' 
                : 'border-slate-200 bg-white focus-within:border-slate-300'
            }`}>
                {/* File Button */}
                <div className="relative">
                    <input 
                    type="file" 
                    id="file-upload" 
                    accept=".pdf" 
                    className="hidden" 
                    onChange={handleFileSelect}
                    disabled={isThinking}
                    />
                    <label 
                    htmlFor="file-upload" 
                    className={`w-9 h-9 rounded-full cursor-pointer flex items-center justify-center transition-colors ${
                        isDarkMode 
                            ? 'text-slate-500 hover:text-slate-300 hover:bg-slate-800' 
                            : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                    }`}
                    >
                        <Paperclip size={18} />
                    </label>
                </div>

                {/* Text Input */}
                <input 
                    type="text" 
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Scrivi un messaggio..."
                    disabled={isThinking}
                    className={`flex-1 bg-transparent border-none outline-none text-sm px-2 ${
                        isDarkMode 
                        ? 'text-white placeholder:text-slate-600' 
                        : 'text-slate-900 placeholder:text-slate-400'
                    }`}
                />

                {/* Send Button */}
                <button 
                    type="submit" 
                    disabled={(!inputValue.trim() && !attachedFile) || isThinking}
                    className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                        (!inputValue.trim() && !attachedFile) || isThinking
                        ? (isDarkMode ? 'bg-slate-800 text-slate-600' : 'bg-slate-100 text-slate-300')
                        : (isDarkMode ? 'bg-white text-black hover:bg-slate-200' : 'bg-slate-900 text-white hover:bg-slate-800')
                    }`}
                >
                    {isThinking ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} className="ml-0.5" />}
                </button>
            </form>
            <p className={`text-[10px] text-center mt-2 opacity-40 font-medium ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                ISIS G.D. Romagnosi • AI Assistant
            </p>
        </div>
      </div>
    </div>
  );
};