import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  MessageSquare,
  X,
  Send,
  Paperclip,
  Trash2,
  CheckCircle2,
  AlertCircle,
  FileText,
  Image as ImageIcon,
  Bot,
  User,
  Shield,
  Clock,
  Sparkles,
  ExternalLink,
  ChevronDown,
  RefreshCw,
} from 'lucide-react';
import api from '../api/client';
import socket, { joinSession, leaveSession } from '../lib/socket';
import { useSupportStore } from '../store/useSupportStore';
import { useAuthStore } from '../store/useAuthStore';
import { toast } from '../store/useNotificationStore';

export default function SupportChatWidget() {
  const { isOpen, openChat, closeChat, toggleChat, sessionId, setSessionId, clearSession } =
    useSupportStore();
  const { user } = useAuthStore();

  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [closing, setClosing] = useState(false);
  const [initialLoaded, setInitialLoaded] = useState(false);
  const [showEndModal, setShowEndModal] = useState(false);
  const [isClosedSession, setIsClosedSession] = useState(false);
  const [sessionClosedDate, setSessionClosedDate] = useState(null);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Auto-scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  // Load existing session messages if sessionId exists
  const fetchSessionData = async () => {
    if (!sessionId) {
      setInitialLoaded(true);
      return;
    }

    try {
      const res = await api.get(`/support/session/${sessionId}`);
      if (res.data) {
        if (res.data.messages) {
          setMessages(res.data.messages);
        }
        if (res.data.session?.status === 'closed') {
          setIsClosedSession(true);
          setSessionClosedDate(res.data.session.closedAt);
        } else {
          setIsClosedSession(false);
        }
      }
    } catch (err) {
      // If session not found, clear stored ID
      clearSession();
      setIsClosedSession(false);
    } finally {
      setInitialLoaded(true);
    }
  };

  useEffect(() => {
    fetchSessionData();
  }, [sessionId, clearSession]);

  // ── Real-time Socket.IO: join session room and listen for push events ──
  useEffect(() => {
    if (!sessionId) return;

    // Join the session room to receive push events
    joinSession(sessionId);

    // Handle incoming messages (from bot, admin, or other user devices)
    const handleNewMessage = ({ message }) => {
      if (!message) return;
      setMessages((prev) => {
        // Deduplicate: don't add if _id already exists
        if (prev.some((m) => m._id === message._id)) return prev;
        return [...prev, message];
      });
    };

    // Handle session being closed (by admin or user on another device)
    const handleSessionClosed = ({ closedAt }) => {
      setIsClosedSession(true);
      setSessionClosedDate(closedAt || new Date().toISOString());
    };

    socket.on('new_message', handleNewMessage);
    socket.on('session_closed', handleSessionClosed);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('session_closed', handleSessionClosed);
      leaveSession(sessionId);
    };
  }, [sessionId]);


  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length + selectedFiles.length > 5) {
      toast.error('You can upload at most 5 attachments at a time.', 'Attachment Limit');
      return;
    }

    const validFiles = files.filter((f) => {
      if (f.size > 10 * 1024 * 1024) {
        toast.error(`"${f.name}" is larger than 10MB limit.`, 'File Too Large');
        return false;
      }
      return true;
    });

    setSelectedFiles((prev) => [...prev, ...validFiles]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeSelectedFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSendMessage = async (customText = null, options = {}) => {
    const textToSend = (customText !== null ? customText : inputText).trim();

    if (!textToSend && selectedFiles.length === 0) return;

    setLoading(true);

    try {
      const formData = new FormData();
      if (sessionId) formData.append('sessionId', sessionId);
      formData.append('text', textToSend || 'Sent attachment(s)');

      const finalName = options.customName || user?.fullName || 'Guest User';
      const finalEmail = options.customEmail || user?.email || '';

      formData.append('name', finalName);
      formData.append('email', finalEmail);

      if (options.isAgentRequest) {
        formData.append('isAgentRequest', 'true');
      }

      selectedFiles.forEach((file) => {
        formData.append('attachments', file);
      });

      // Optimistic user message
      const tempUserMessage = {
        _id: `temp_${Date.now()}`,
        sender: 'user',
        senderName: finalName || 'You',
        text: textToSend,
        createdAt: new Date().toISOString(),
        attachments: selectedFiles.map((f) => ({
          filename: f.name,
          size: f.size,
          contentType: f.type,
          fileId: 'pending',
        })),
      };

      setMessages((prev) => [...prev, tempUserMessage]);
      setInputText('');
      setSelectedFiles([]);
      setIsClosedSession(false); // resumed seamlessly

      const res = await api.post('/support/message', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data) {
        if (res.data.sessionId && res.data.sessionId !== sessionId) {
          setSessionId(res.data.sessionId);
        }

        // Replace temp message with server version and add bot reply
        setMessages((prev) => {
          const filtered = prev.filter((m) => m._id !== tempUserMessage._id);
          const newBatch = [...filtered, res.data.userMessage];
          if (res.data.botReply) {
            newBatch.push(res.data.botReply);
          }
          return newBatch;
        });
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not deliver message', 'Delivery Failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSession = async () => {
    if (!sessionId) {
      setMessages([]);
      return;
    }
    setShowEndModal(true);
  };

  const confirmEndSession = async () => {
    setShowEndModal(false);
    setClosing(true);
    try {
      const res = await api.post(`/support/close/${sessionId}`);
      toast.success(
        res.data.message || 'Chat closed and attachments permanently deleted from storage.',
        'Session Closed'
      );
      if (res.data.closingMessage) {
        setMessages((prev) => [...prev, res.data.closingMessage]);
      }
      setIsClosedSession(true);
      setSessionClosedDate(res.data.closedAt || new Date().toISOString());
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to close session', 'Error');
    } finally {
      setClosing(false);
    }
  };

  const handleStartNewChat = () => {
    clearSession();
    setMessages([]);
    setIsClosedSession(false);
    setSessionClosedDate(null);
  };

  const quickPrompts = [
    'How do I fund my wallet with NGN?',
    'When will USDT crypto deposits be live?',
    'How do I cancel a giveaway and get a refund?',
    'Why does a claim show as failed?',
    '🙋 Speak with a Human Agent',
  ];

  return (
    <>
      {/* ─── Custom End-Session Confirmation Modal ─── */}
      {showEndModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-dark-card border border-rose-500/30 rounded-2xl shadow-2xl shadow-rose-500/10 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="px-6 pt-6 pb-4 bg-gradient-to-b from-rose-500/10 to-transparent border-b border-rose-500/20 text-center">
              <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-rose-500/15 border border-rose-500/30 flex items-center justify-center">
                <Trash2 className="w-6 h-6 text-rose-400" />
              </div>
              <h3 className="text-base font-extrabold text-white mb-1">End Support Chat?</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                This will close your active chat with the agent and{' '}
                <span className="text-rose-400 font-semibold">
                  permanently erase all uploaded files
                </span>{' '}
                from storage immediately.
              </p>
            </div>

            {/* Privacy Guarantee Warning (No technical storage disclosure) */}
            <div className="mx-4 my-3 px-3.5 py-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 mt-0.5 flex-shrink-0" />
              <p className="text-[11px] text-rose-300 leading-relaxed font-medium">
                All files uploaded during this session will be erased immediately and cannot be recovered.
              </p>
            </div>

            {/* Actions */}
            <div className="px-4 pb-5 flex gap-2.5">
              <button
                onClick={() => setShowEndModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-dark-border text-sm font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              >
                Keep Chatting
              </button>
              <button
                onClick={confirmEndSession}
                disabled={closing}
                className="flex-1 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-sm font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {closing ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                {closing ? 'Closing…' : 'End & Purge Files'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Launcher Button */}
      {!isOpen && (
        <button
          onClick={openChat}
          id="support-chat-launcher"
          className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40 flex items-center gap-2 px-3.5 py-2.5 sm:px-4 sm:py-3 bg-gradient-to-r from-brand-500 to-emerald-500 hover:from-brand-600 hover:to-emerald-600 text-slate-950 font-extrabold text-xs sm:text-sm rounded-full shadow-2xl shadow-brand-500/30 transition-all hover:scale-105 active:scale-95 group"
          aria-label="Open support chat"
        >
          <div className="relative">
            <Bot className="w-4 h-4 sm:w-5 sm:h-5 text-slate-950 stroke-[2.5]" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 sm:w-2.5 sm:h-2.5 bg-white rounded-full border-2 border-slate-950 animate-pulse" />
          </div>
          <span className="text-xs sm:text-sm">Support</span>
        </button>
      )}

      {/* Expandable Chat Window */}
      {isOpen && (
        <div
          id="support-chat-window"
          className="fixed bottom-2 right-2 sm:bottom-6 sm:right-6 z-50 w-[calc(100vw-1rem)] sm:w-[430px] h-[600px] max-h-[90vh] bg-dark-bg/95 backdrop-blur-2xl border border-dark-border rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200"
        >
          {/* Header */}
          <div className="px-4 py-3 bg-slate-900/90 border-b border-dark-border flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-emerald-400 flex items-center justify-center text-slate-950 font-black shadow-md">
                  <Bot className="w-5 h-5 stroke-[2.5]" />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 border-2 border-slate-900 rounded-full" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-extrabold text-sm text-white">Sprinkl Support</h3>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded bg-brand-500/10 text-brand-400 border border-brand-500/20">
                    Live Desk
                  </span>
                </div>
                <p className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  <span>AI Assistant &amp; Live Agents Active</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {sessionId && messages.length > 0 && !isClosedSession && (
                <button
                  onClick={handleCloseSession}
                  disabled={closing}
                  title="Close chat with agent and erase files"
                  className="px-2.5 py-1 text-xs text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors flex items-center gap-1 font-medium"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="hidden xs:inline">Close Chat</span>
                </button>
              )}

              {isClosedSession && (
                <button
                  onClick={handleStartNewChat}
                  title="Start fresh conversation"
                  className="px-2 py-1 text-xs text-brand-400 hover:bg-brand-500/10 rounded-lg transition-colors flex items-center gap-1 font-semibold"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span className="hidden xs:inline">New Chat</span>
                </button>
              )}

              <button
                onClick={closeChat}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                aria-label="Minimize support chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Thread */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
            {/* Welcome Message */}
            <div className="p-3.5 rounded-xl bg-slate-900/70 border border-dark-border/80 text-slate-300 leading-relaxed">
              <div className="flex items-center gap-2 text-brand-400 font-bold mb-1.5">
                <Sparkles className="w-4 h-4" />
                <span>Welcome to Sprinkl Support!</span>
              </div>
              <p>
                Ask about giveaway creation, instant payouts, wallet funding, or fraud prevention.
                Our AI assistant answers immediately, and live human agents can join your chat at any time.
              </p>
            </div>

            {/* Quick Prompts if conversation just started */}
            {messages.length === 0 && (
              <div className="space-y-1.5 pt-1">
                <p className="text-[11px] font-semibold text-dark-muted uppercase tracking-wider">
                  Suggested topics:
                </p>
                <div className="flex flex-col gap-1.5">
                  {quickPrompts.map((prompt, i) => (
                    <button
                      key={i}
                      onClick={() => handleSendMessage(prompt)}
                      className="text-left px-3 py-2 rounded-lg bg-dark-card hover:bg-slate-800 border border-dark-border/70 text-slate-300 hover:text-brand-300 text-xs transition-colors"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Render Messages */}
            {messages.map((msg) => {
              const isUser = msg.sender === 'user';
              const isAdmin = msg.sender === 'admin';
              const isClosingNotice =
                msg.text.includes('Chat with the agent has been closed') ||
                msg.text.includes('Chat session has been successfully closed');

              // Sleek Divider for session-closed notice
              if (isClosingNotice) {
                const closedAt = msg.createdAt
                  ? new Date(msg.createdAt).toLocaleString([], {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : 'Unknown time';
                return (
                  <div
                    key={msg._id}
                    className="flex items-center gap-3 my-4 px-1 animate-in fade-in"
                  >
                    <div className="flex-1 h-px bg-slate-700/60" />
                    <span className="text-[10px] text-slate-500 font-medium whitespace-nowrap select-none">
                      Live chat ended · {closedAt}
                    </span>
                    <div className="flex-1 h-px bg-slate-700/60" />
                  </div>
                );
              }


              return (
                <div
                  key={msg._id}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                >
                  <div className="flex items-center gap-1.5 mb-1 px-1">
                    {isAdmin ? (
                      <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">
                        <Shield className="w-3 h-3" />
                        <span>{msg.senderName || 'Sprinkl Agent'}</span>
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold text-dark-muted">
                        {isUser ? 'You' : msg.senderName || 'Sprinkl Bot'}
                      </span>
                    )}
                    <span className="text-[9px] text-dark-muted font-mono">
                      {msg.createdAt
                        ? new Date(msg.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : ''}
                    </span>
                  </div>

                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 leading-relaxed break-words shadow-md ${
                      isUser
                        ? 'bg-brand-500 text-slate-950 font-medium rounded-tr-none'
                        : isAdmin
                        ? 'bg-gradient-to-br from-slate-900 to-emerald-950/60 border border-emerald-500/40 text-slate-100 rounded-tl-none shadow-emerald-500/5'
                        : 'bg-slate-900 border border-dark-border text-slate-200 rounded-tl-none'
                    }`}
                  >
                    <p className="whitespace-pre-wrap text-[13px]">{msg.text}</p>

                    {/* One-click Request Agent Button when bot prompts */}
                    {!isUser &&
                      !isAdmin &&
                      (msg.text.includes('outside the topics') ||
                        msg.text.includes('request a human agent') ||
                        msg.text.includes('Request Agent')) && (
                        <button
                          type="button"
                          onClick={() =>
                            handleSendMessage('I would like to speak with a human support agent.', {
                              isAgentRequest: true,
                            })
                          }
                          className="mt-3 w-full py-2 px-3 rounded-xl bg-brand-500/20 hover:bg-brand-500/30 border border-brand-500/40 text-brand-300 font-bold text-xs flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99]"
                        >
                          <User className="w-3.5 h-3.5" />
                          <span>🙋 Connect with Human Agent</span>
                        </button>
                      )}

                    {/* Render message attachments */}
                    {msg.attachments && msg.attachments.length > 0 && (
                      <div className="mt-2.5 pt-2 border-t border-black/10 dark:border-white/10 space-y-1.5">
                        {msg.attachments.map((att, idx) => {
                          const isImage =
                            att.contentType?.startsWith('image/') ||
                            att.filename?.match(/\.(jpg|jpeg|png|webp|gif)$/i);
                          const downloadUrl =
                            att.fileId && att.fileId !== 'pending'
                              ? `${api.defaults.baseURL || '/api'}/support/attachment/${att.fileId}`
                              : null;

                          return (
                            <div key={idx} className="rounded-lg overflow-hidden">
                              {isImage && downloadUrl ? (
                                <a
                                  href={downloadUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="block group relative"
                                >
                                  <img
                                    src={downloadUrl}
                                    alt={att.filename}
                                    className="max-h-36 rounded-lg object-cover border border-white/10 group-hover:opacity-90 transition-opacity"
                                  />
                                  <span className="text-[10px] text-brand-300 font-mono mt-0.5 block underline flex items-center gap-1">
                                    <ExternalLink className="w-3 h-3" /> View full image
                                  </span>
                                </a>
                              ) : (
                                <a
                                  href={downloadUrl || '#'}
                                  target={downloadUrl ? '_blank' : '_self'}
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2 p-2 rounded bg-black/20 hover:bg-black/30 text-[11px] font-mono transition-colors"
                                >
                                  <FileText className="w-4 h-4 shrink-0" />
                                  <span className="truncate flex-1">{att.filename}</span>
                                  <span className="text-[9px] text-dark-muted">
                                    {att.size ? `${Math.round(att.size / 1024)}KB` : ''}
                                  </span>
                                </a>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            <div ref={messagesEndRef} />
          </div>

          {/* Attachments Preview Strip */}
          {selectedFiles.length > 0 && (
            <div className="px-4 py-2 bg-slate-900/90 border-t border-dark-border flex flex-wrap gap-2">
              {selectedFiles.map((file, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-dark-card border border-dark-border text-[11px] text-slate-200"
                >
                  <ImageIcon className="w-3 h-3 text-brand-400" />
                  <span className="max-w-[120px] truncate">{file.name}</span>
                  <span className="text-[9px] text-dark-muted font-mono">
                    ({Math.round(file.size / 1024)}KB)
                  </span>
                  <button
                    onClick={() => removeSelectedFile(idx)}
                    className="p-0.5 hover:text-rose-400 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Footer & Input: ALWAYS UNLOCKED for AI prompts and chatting */}
          <div className="p-3 bg-slate-900 border-t border-dark-border shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                multiple
                accept="image/*,application/pdf,text/plain"
                className="hidden"
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                title="Add attachment (images, PDFs, documents)"
                className="p-2.5 rounded-xl bg-dark-card hover:bg-slate-800 border border-dark-border text-slate-400 hover:text-brand-400 transition-colors shrink-0"
              >
                <Paperclip className="w-4 h-4" />
              </button>

              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={
                  isClosedSession
                    ? 'Ask the AI a question or start fresh...'
                    : 'Ask support or type your question...'
                }
                className="flex-1 bg-dark-bg border border-dark-border rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-dark-muted focus:outline-none focus:border-brand-500"
              />

              <button
                type="submit"
                disabled={loading || (!inputText.trim() && selectedFiles.length === 0)}
                className="p-2.5 bg-brand-500 hover:bg-brand-600 disabled:opacity-40 text-slate-950 font-bold rounded-xl transition-all shadow-md shrink-0"
                aria-label="Send message"
              >
                <Send className="w-4 h-4 stroke-[2.5]" />
              </button>
            </form>

            <div className="flex items-center justify-between text-[10px] text-dark-muted mt-2 px-1">
              <span>🔒 Files erased upon ending chat</span>
              {isClosedSession && (
                <button
                  type="button"
                  onClick={handleStartNewChat}
                  className="text-brand-400 hover:underline font-semibold"
                >
                  + Start New Chat
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
