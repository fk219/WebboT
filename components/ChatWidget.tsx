
import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Sparkles, Bot, Flower2, ArrowRight, User, HelpCircle, Star, Phone, Mic, AlertCircle, Headphones, Volume2, MessageSquare, Smile, Image } from 'lucide-react';
import { AgentConfig, Message } from '../types';
import { chatWithAgent, LiveSession } from '../services/geminiService';
import { supabaseService } from '../src/services/supabaseService';

interface ChatWidgetProps {
  config: AgentConfig;
  previewMode?: boolean;
  userId?: string;
  projectId?: string;
}

const ChatWidget: React.FC<ChatWidgetProps> = ({ config, previewMode = false, userId, projectId }) => {
  // In preview mode, we want it to behave like real life (start closed), unless specified otherwise.
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isCallActive, setIsCallActive] = useState(false);
  const [callError, setCallError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const sessionIdRef = useRef<string | null>(null);

  // Sync ref with state
  useEffect(() => {
    sessionIdRef.current = sessionId;
  }, [sessionId]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const liveSessionRef = useRef<LiveSession | null>(null);

  // Widget ID for scoped CSS
  const widgetId = `verdant-widget-${config.id}`;

  // Reset messages when config changes
  useEffect(() => {
    setMessages([
      {
        id: 'init',
        role: 'model',
        text: config.greeting,
        timestamp: new Date(),
      },
    ]);
  }, [config.id, config.greeting]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isTyping, isOpen]);

  // Clean up live session if component unmounts or closes
  useEffect(() => {
    return () => {
      if (liveSessionRef.current) {
        liveSessionRef.current.disconnect();
      }
    };
  }, []);

  const handleSend = async (text: string = inputValue) => {
    if (!text.trim()) return;

    // Initialize session if not exists and we have a projectId
    let currentSessionId = sessionId;
    if (!currentSessionId && projectId) {
      currentSessionId = await supabaseService.createSession(projectId, userId, previewMode);
      setSessionId(currentSessionId);
    }

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      text: text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setIsTyping(true);

    // Save user message
    if (currentSessionId) {
      supabaseService.saveChatMessage(currentSessionId, 'user', text);
    }

    // Call Gemini Service
    const response = await chatWithAgent(config, messages, userMsg.text, userId, projectId, previewMode, currentSessionId || undefined);

    setIsTyping(false);
    setMessages((prev) => [...prev, response]);

    // Save model message
    if (currentSessionId) {
      supabaseService.saveChatMessage(currentSessionId, 'model', response.text);
    }
  };

  const toggleCall = async () => {
    console.log('📞 Toggle Call clicked. Current state:', { isCallActive, hasLiveSession: !!liveSessionRef.current });

    if (isCallActive) {
      // End Call
      console.log('🔴 Ending call...');
      if (liveSessionRef.current) {
        liveSessionRef.current.disconnect();
        liveSessionRef.current = null;
      }
      setIsCallActive(false);
      setCallError(null);
      console.log('✅ Call ended');
    } else {
      // Start Call
      console.log('🟢 Starting call...');
      setCallError(null);
      setIsCallActive(true); // Optimistically set active

      // Ensure session exists
      let currentSessionId = sessionId;
      if (!currentSessionId && projectId) {
        currentSessionId = await supabaseService.createSession(projectId, userId, previewMode);
        setSessionId(currentSessionId);
      }

      liveSessionRef.current = new LiveSession(
        config,
        (errorMsg) => {
          // On Disconnect/Error callback
          setIsCallActive(false);
          liveSessionRef.current = null;
          if (errorMsg) {
            setCallError(errorMsg);
            console.error(errorMsg);
          }
        },
        (role, text) => {
          // On Transcript callback
          const msg: Message = {
            id: crypto.randomUUID(),
            role: role,
            text: text,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, msg]);

          // Save to Supabase using the local currentSessionId or ref
          const activeSessionId = currentSessionId || sessionIdRef.current;
          if (activeSessionId) {
            supabaseService.saveChatMessage(activeSessionId, role, text);
          }
        },
        userId,
        projectId,
        previewMode,
        currentSessionId || undefined
      );

      try {
        await liveSessionRef.current.connect();
      } catch (e: any) {
        console.error(e);
        setIsCallActive(false);
        setCallError(e.message || "Failed to connect to voice service.");
      }
    }
  };

  // --- Theme Helpers ---

  const getRadiusClass = () => {
    switch (config.theme.radius) {
      case 'none': return 'rounded-none';
      case 'sm': return 'rounded-sm';
      case 'md': return 'rounded-md';
      case 'lg': return 'rounded-lg';
      case 'xl': return 'rounded-xl';
      case '2xl': return 'rounded-2xl';
      case 'full': return 'rounded-3xl';
      default: return 'rounded-2xl';
    }
  };

  const getFontFamily = () => {
    switch (config.theme.fontFamily) {
      case 'roboto': return 'font-sans';
      case 'mono': return 'font-mono';
      default: return 'font-sans';
    }
  };

  const getFontWeight = () => {
    if (config.theme.fontWeight) {
      switch (config.theme.fontWeight) {
        case 'normal': return 'font-normal';
        case 'medium': return 'font-medium';
        case 'bold': return 'font-bold';
        default: return 'font-normal';
      }
    }
    // Fallback to old style
    switch (config.theme.fontStyle) {
      case 'thin': return 'font-light';
      case 'medium': return 'font-medium';
      default: return 'font-normal';
    }
  };

  const getTextSizeClass = () => {
    switch (config.theme.textSize) {
      case 'sm': return 'text-xs';
      case 'md': return 'text-sm';
      case 'lg': return 'text-base';
      default: return 'text-sm';
    }
  };

  const getWindowDimensions = () => {
    switch (config.theme.chatWindowSize) {
      case 'sm': return 'w-[320px] h-[500px]';
      case 'md': return 'w-[380px] h-[600px]';
      case 'lg': return 'w-[450px] h-[700px]';
      case 'custom': return 'w-[400px] h-[650px]'; // Placeholder for custom
      default: return 'w-[380px] h-[600px]';
    }
  };

  const getLauncherSize = () => {
    switch (config.theme.launcherBubbleSize) {
      case 'sm': return 'w-12 h-12';
      case 'md': return 'w-14 h-14';
      case 'lg': return 'w-16 h-16';
      default: return 'w-14 h-14';
    }
  };

  const isDark = config.theme.mode === 'dark';

  const AvatarIcon = ({ size = 20, className = "text-white" }) => {
    // Priority: Header Icon (if explicitly set for header context) -> Avatar Image -> Custom Avatar -> Icon
    if (config.theme.headerIcon && (config.theme.headerIcon.startsWith('http') || config.theme.headerIcon.startsWith('data:'))) {
      return <img src={config.theme.headerIcon} alt="Agent" className="w-full h-full object-cover" />;
    }
    if (config.theme.headerIcon) {
      // Check if it's a Lucide icon name
      const iconProps = { size, className };
      switch (config.theme.headerIcon) {
        case 'Bot': return <Bot {...iconProps} />;
        case 'MessageSquare': return <MessageSquare {...iconProps} />;
        case 'Sparkles': return <Sparkles {...iconProps} />;
        case 'Zap': return <div className="font-bold text-xl">⚡</div>; // Keep Zap as emoji for now or import Zap
        case 'Heart': return <div className="font-bold text-xl">❤️</div>;
        case 'Smile': return <Smile {...iconProps} />;
        default: return <span className="text-xl">{config.theme.headerIcon}</span>;
      }
    }

    if (config.theme.avatarImage) {
      return <img src={config.theme.avatarImage} alt="Agent" className="w-full h-full object-cover" />;
    }
    if (config.theme.customAvatar) {
      return <img src={config.theme.customAvatar} alt="Agent" className="w-full h-full object-cover" />;
    }
    const props = { size, className };
    switch (config.theme.avatarIcon) {
      case 'bot': return <Bot {...props} />;
      case 'flower': return <Flower2 {...props} />;
      case 'user': return <User {...props} />;
      case 'help': return <HelpCircle {...props} />;
      case 'star': return <Star {...props} />;
      default: return <Sparkles {...props} />;
    }
  };

  const getLauncherIcon = () => {
    if (config.theme.useLogoAsLauncher && config.theme.avatarImage) {
      return <img src={config.theme.avatarImage} alt="Launcher" className="w-full h-full object-cover" />;
    }
    const icon = config.theme.launcherIcon || 'MessageCircle';
    const size = 24;
    switch (icon) {
      case 'MessageCircle': return <MessageCircle size={size} />;
      case 'Bot': return <Bot size={size} />;
      case 'Sparkles': return <Sparkles size={size} />;
      case 'Zap': return <div className="font-bold text-xl">⚡</div>;
      case 'Heart': return <div className="font-bold text-xl">❤️</div>;
      default: return <MessageCircle size={size} />;
    }
  };

  const getCallButtonIcon = () => {
    const icon = config.voice.callButtonIcon || 'Phone';
    const size = 20;
    switch (icon) {
      case 'Phone': return <Phone size={size} />;
      case 'Mic': return <Mic size={size} />;
      case 'Headphones': return <Headphones size={size} />;
      case 'Volume2': return <Volume2 size={size} />;
      default: return <span className="text-lg leading-none">{icon}</span>;
    }
  };

  const getSizeClasses = () => {
    switch (config.theme.chatWindowSize) {
      case 'sm': return {
        headerPadding: 'p-3',
        avatarSize: 'w-8 h-8',
        inputPadding: 'py-2.5',
        iconSize: 16,
        titleSize: 'text-sm'
      };
      case 'lg': return {
        headerPadding: 'p-5',
        avatarSize: 'w-12 h-12',
        inputPadding: 'py-4',
        iconSize: 22,
        titleSize: 'text-lg'
      };
      default: return { // md
        headerPadding: 'p-4',
        avatarSize: 'w-10 h-10',
        inputPadding: 'py-3.5',
        iconSize: 18,
        titleSize: 'text-base'
      };
    }
  };

  const sizeConfig = getSizeClasses();

  // Dynamic Styles including Gradients
  const headerBackground = config.theme.headerColor || config.theme.primaryColor;
  const userBubbleBackground = config.theme.userBubbleColor || config.theme.primaryColor;

  // Bot bubble defaults to generic styles if no override provided
  const botBubbleStyle = config.theme.botBubbleColor ? { background: config.theme.botBubbleColor } : {};

  // Positioning
  const positionClass = previewMode ? 'absolute bottom-6 right-6' : 'fixed bottom-6 right-6';

  if (!isOpen) {
    return (
      <>
        {config.theme.customCss && (
          <style>{`#${widgetId} { ${config.theme.customCss} }`}</style>
        )}
        {config.theme.scrollbarColor && (
          <style>{`
                #${widgetId} *::-webkit-scrollbar {
                    width: 6px;
                }
                #${widgetId} *::-webkit-scrollbar-thumb {
                    background-color: ${config.theme.scrollbarColor} !important;
                    border-radius: 10px;
                }
                #${widgetId} *::-webkit-scrollbar-track {
                    background-color: transparent;
                }
            `}</style>
        )}
        <button
          id={`${widgetId}-trigger`}
          onClick={() => setIsOpen(true)}
          style={{ background: config.theme.chatWidgetColor || config.theme.primaryColor }}
          className={`${positionClass} ${getLauncherSize()} shadow-lg hover:scale-105 transition-transform flex items-center justify-center text-white ${getRadiusClass()} ${config.theme.radius === 'full' ? 'rounded-full' : ''} z-50 overflow-hidden`}
        >
          {getLauncherIcon()}
        </button>
      </>
    );
  }

  // Main Widget Container
  return (
    <>
      {config.theme.customCss && (
        <style>{`#${widgetId} { ${config.theme.customCss} }`}</style>
      )}
      {config.theme.scrollbarColor && (
        <style>{`
                #${widgetId} *::-webkit-scrollbar {
                    width: 6px;
                }
                #${widgetId} *::-webkit-scrollbar-thumb {
                    background-color: ${config.theme.scrollbarColor} !important;
                    border-radius: 10px;
                }
            `}</style>
      )}
      <div
        id={widgetId}
        className={`
          ${positionClass} ${getWindowDimensions()} z-50 
          flex flex-col 
          ${isDark ? 'bg-slate-900' : 'bg-white border border-slate-100'}
          ${getRadiusClass()} shadow-2xl
          overflow-hidden 
          ${getFontFamily()}
        `}
      >

        {/* Header - Supports Gradients via background shorthand */}
        <div
          className={`${sizeConfig.headerPadding} flex items-center justify-between relative z-10 backdrop-blur-md bg-opacity-90`}
          style={{ background: headerBackground }}
        >
          <div className="flex items-center space-x-3">
            <div className={`${sizeConfig.avatarSize} bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center overflow-hidden shadow-inner border border-white/10`}>
              <AvatarIcon />
            </div>
            <div>
              <h3 className={`text-white tracking-tight ${config.theme.headerTitleWeight ? `font-${config.theme.headerTitleWeight}` : 'font-medium'} ${config.theme.headerTitleSize === 'lg' ? 'text-lg' : config.theme.headerTitleSize === 'sm' ? 'text-sm' : sizeConfig.titleSize}`}>{config.name}</h3>
              <div className="flex items-center space-x-1.5 opacity-90">
                <span className="w-1.5 h-1.5 bg-green-300 rounded-full animate-pulse shadow-[0_0_5px_rgba(134,239,172,0.5)]"></span>
                <span className="text-white text-[10px] font-medium uppercase tracking-wider">Online</span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {config.voice?.enabled !== false && config.voice?.phoneCallEnabled !== false && (
              <button
                onClick={toggleCall}
                className={`w-9 h-9 flex items-center justify-center rounded-full transition-all duration-300 ${isCallActive ? 'bg-white text-red-500 shadow-lg scale-110' : 'bg-white/20 text-white hover:bg-white/30'}`}
                title={isCallActive ? "End Call" : "Start Voice Call"}
              >
                {isCallActive ? <Phone size={18} className="rotate-[135deg]" /> : getCallButtonIcon()}
              </button>
            )}

            <button onClick={() => setIsOpen(false)} className="p-2 rounded-full hover:bg-white/10 text-white/90 hover:text-white transition-colors">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Call Overlay */}
        {isCallActive && (
          <div className={`absolute inset-0 top-[72px] z-20 flex flex-col items-center justify-center p-6 animate-fade-in ${isDark ? 'bg-slate-900/95' : 'bg-white/95'} backdrop-blur-xl`}>
            <div className="relative mb-8">
              {/* Pulsing Circles */}
              <div className="absolute inset-0 bg-emerald-400 rounded-full opacity-20 animate-ping duration-1000"></div>
              <div className="absolute -inset-8 bg-emerald-400 rounded-full opacity-5 animate-pulse duration-2000"></div>
              <div
                className="w-28 h-28 rounded-full flex items-center justify-center shadow-2xl relative z-10 ring-4 ring-white/20"
                style={{ background: config.theme.primaryColor }}
              >
                <div className="w-14 h-14 text-white">
                  <AvatarIcon size={56} />
                </div>
              </div>
            </div>

            <div className="text-center space-y-3">
              <h3 className={`text-2xl font-light ${isDark ? 'text-white' : 'text-slate-800'}`}>
                {config.name}
              </h3>
              <div className="flex flex-col items-center gap-1">
                <span className={`text-sm font-medium uppercase tracking-widest ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>Listening</span>
                <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                  Language: {config.voice.language || 'English'}
                </p>
              </div>
            </div>

            <div className="mt-16 flex items-center gap-8">
              <div className={`p-5 rounded-full transition-colors ${isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-400'}`}>
                <Mic size={28} />
              </div>
              <button
                onClick={toggleCall}
                className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-xl transition-transform hover:scale-105 ring-4 ring-red-100"
              >
                <Phone size={32} className="rotate-[135deg]" />
              </button>
            </div>
          </div>
        )}

        {/* Error Banner */}
        {callError && !isCallActive && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mx-4 mt-4 rounded animate-fade-in flex items-start gap-3 shadow-sm">
            <AlertCircle size={18} className="text-red-500 mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-red-700 font-medium">Connection Failed</p>
              <p className="text-xs text-red-600 mt-1">{callError}</p>
            </div>
            <button onClick={() => setCallError(null)} className="text-red-400 hover:text-red-600">
              <X size={14} />
            </button>
          </div>
        )}

        {/* Messages Area */}
        <div className={`flex-1 overflow-y-auto p-6 space-y-6 ${isDark ? 'bg-slate-950' : 'bg-gradient-to-b from-slate-50/30 to-slate-50/80'}`}>
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
            >
              <div
                className={`max-w-[85%] p-4 ${getFontWeight()} ${getTextSizeClass()} leading-relaxed ${msg.role === 'user'
                  ? `text-white rounded-2xl rounded-tr-sm shadow-lg`
                  : `${isDark ? 'bg-slate-800 text-slate-200' : 'bg-white text-slate-700 border-slate-200 border'} rounded-2xl rounded-tl-sm shadow-md hover:shadow-lg transition-shadow`
                  }`}
                style={msg.role === 'user' ? { background: userBubbleBackground } : botBubbleStyle}
              >
                {msg.text}
                {msg.citations && msg.citations.length > 0 && (
                  <div className={`mt-3 pt-2 border-t border-dashed ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
                    <p className="text-[10px] opacity-60 font-medium uppercase tracking-wide mb-1.5 flex items-center gap-1">
                      <Sparkles size={10} /> Sources
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {msg.citations.map((cite, idx) => (
                        <a
                          key={idx}
                          href={cite.url}
                          className={`text-[10px] px-2 py-1 rounded-md border transition-all truncate max-w-full hover:shadow-sm
                            ${isDark
                              ? 'bg-slate-700 border-slate-600 hover:bg-slate-600'
                              : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                            }`}
                          style={{ color: config.theme.primaryColor }}
                        >
                          {cite.title}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex justify-start">
              <div className={`${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'} border p-4 rounded-2xl rounded-tl-none shadow-sm flex items-center space-x-1.5`}>
                <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Replies - WRAPPED, NO SCROLL */}
        {config.quickReplies && config.quickReplies.length > 0 && !isCallActive && (
          <div className={`px-5 py-4 flex flex-wrap gap-2 ${isDark ? 'bg-slate-900' : 'bg-slate-50/50 border-t border-slate-100'}`}>
            {config.quickReplies.map((reply, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(reply)}
                className={`whitespace-nowrap text-xs font-medium px-4 py-2 rounded-xl transition-all hover:-translate-y-0.5 hover:shadow-md
                     ${isDark
                    ? 'text-slate-300 hover:bg-slate-800 bg-slate-800 hover:text-emerald-400'
                    : 'border-2 border-slate-200 text-slate-600 hover:bg-white bg-white hover:border-emerald-500 hover:text-emerald-600'
                  }`}
              >
                {reply}
              </button>
            ))}
          </div>
        )}

        {/* Input Area */}
        <div className={`p-5 ${isDark ? 'bg-slate-900' : 'bg-white border-t border-slate-100'}`}>
          <div className="relative flex items-center">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Type your message..."
              disabled={isCallActive}
              className={`w-full pl-5 pr-14 ${sizeConfig.inputPadding} rounded-2xl focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-all text-sm ${getFontWeight()}
                ${isDark
                  ? 'bg-slate-800 text-white placeholder-slate-500 disabled:opacity-50 focus:ring-emerald-500/30 focus:bg-slate-700'
                  : 'bg-slate-50 border-2 border-slate-200 text-slate-900 placeholder-slate-400 disabled:opacity-50 focus:bg-white focus:border-emerald-500 focus:shadow-lg'
                }
              `}
            />
            <button
              onClick={() => handleSend()}
              disabled={!inputValue.trim() || isCallActive}
              className={`absolute right-2 p-2.5 rounded-xl transition-all duration-200 flex items-center justify-center hover:brightness-110
                ${inputValue.trim()
                  ? `text-white shadow-lg hover:scale-105 hover:shadow-xl`
                  : isDark ? 'bg-slate-700 text-slate-500' : 'bg-slate-200 text-slate-400'
                }`}
              style={inputValue.trim() ? { background: config.theme.primaryColor } : {}}
            >
              {(() => {
                const iconName = config.theme.sendButtonIcon || 'arrow';
                const size = 18;
                if (inputValue.trim()) {
                  switch (iconName) {
                    case 'send': return <Send size={size} />;
                    case 'plane': return <Send size={size} className="-rotate-45" />;
                    case 'sparkle': return <Sparkles size={size} />;
                    default: return <ArrowRight size={size} strokeWidth={2.5} />;
                  }
                }
                return <Send size={size} />;
              })()}
            </button>
          </div>
          {config.theme.showBranding && (
            <div className="text-center mt-3">
              <span className={`text-xs font-medium tracking-wide ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                Powered by <span className="text-emerald-600 font-semibold">Webbot</span>
              </span>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ChatWidget;
