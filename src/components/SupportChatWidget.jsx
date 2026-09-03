import React, { useState, useEffect, useRef } from 'react';
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
  Clock,
  Sparkles,
  ExternalLink,
  ChevronDown,
} from 'lucide-react';
import api from '../api/client';
import { useSupportStore } from '../store/useSupportStore';
import { useAuthStore } from '../store/useAuthStore';
import { toast, confirmDialog } from '../store/useNotificationStore';

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
  useEffect(() => {
    if (!sessionId) {
      setInitialLoaded(true);
      return;
    }

    const fetchSession = async () => {
      try {
        const res = await api.get(`/support/session/${sessionId}`);
        if (res.data && res.data.messages) {
          setMessages(res.data.messages);
        }
      } catch (err) {
        // If session not found or closed, clear stored ID
        clearSession();
      } finally {
        setInitialLoaded(true);
      }
    };

    fetchSession();
  }, [sessionId, clearSession]);

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

  const handleSendMessage = async (customText = null) => {
    const textToSend = (customText !== null ? customText : inputText).trim();

    if (!textToSend && selectedFiles.length === 0) return;

    setLoading(true);

    try {
      const formData = new FormData();
      if (sessionId) formData.append('sessionId', sessionId);
      formData.append('text', textToSend || 'Sent attachment(s)');

      if (user) {
        formData.append('name', user.fullName || 'User');
        formData.append('email', user.email || '');
      }

      selectedFiles.forEach((file) => {
        formData.append('attachments', file);
      });

      // Optimistic user message
      const tempUserMessage = {
        _id: `temp_${Date.now()}`,
        sender: 'user',
        senderName: user?.fullName || 'You',
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

    const confirmed = await confirmDialog({
      title: 'End Support Chat?',
      message:
        'Ending this session will permanently delete all uploaded attachments. Are you sure?',
      confirmText: 'Yes, End & Purge Files',
      confirmVariant: 'danger',
    });

    if (!confirmed) return;

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
      setTimeout(() => {
        clearSession();
      }, 3000);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to close session', 'Error');
    } finally {
      setClosing(false);
    }
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
      {/* Floating Launcher Button */}
      {!isOpen && (
        <button
          onClick={openChat}
          id="support-chat-launcher"
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-brand-500 to-emerald-500 hover:from-brand-600 hover:to-emerald-600 text-slate-950 font-bold text-sm rounded-full shadow-2xl shadow-brand-500/30 transition-all hover:scale-105 active:scale-95 group"
          aria-label="Open support chat"
        >
          <div className="relative">
            <Bot className="w-5 h-5 text-slate-950 stroke-[2.5]" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-white rounded-full border-2 border-slate-950 animate-pulse" />
          </div>
          <span>Support & Help</span>
        </button>
      )}

      {/* Expandable Chat Window */}
      {isOpen && (
        <div
          id="support-chat-window"
          className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-[420px] h-[580px] max-h-[85vh] bg-dark-bg/95 backdrop-blur-2xl border border-dark-border rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200"
        >
          {/* Header */}
          <div className="px-4 py-3.5 bg-slate-900/90 border-b border-dark-border flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-emerald-400 flex items-center justify-center text-slate-950 font-black shadow-md">
                  <Bot className="w-5 h-5 stroke-[2.5]" />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 border-2 border-slate-900 rounded-full" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-extrabold text-sm text-white">Sprinkl Assistant</h3>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-1 py-0.2 rounded bg-brand-500/10 text-brand-400 border border-brand-500/20">
                    Bot
                  </span>
                </div>
                <p className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  <span>Online • Email Alerts Active</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {sessionId && messages.length > 0 && (
                <button
                  onClick={handleCloseSession}
                  disabled={closing}
                  title="End chat and purge all attachments"
                  className="px-2.5 py-1.5 text-xs text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors flex items-center gap-1 font-medium"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="hidden xs:inline">End Chat</span>
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
                Have questions about funding, payouts, or giveaway setup? Type below or attach a
                screenshot. Every message triggers an immediate email notification to our support
                team.
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
              return (
                <div
                  key={msg._id}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                >
                  <div className="flex items-center gap-1.5 mb-1 px-1">
                    <span className="text-[10px] font-semibold text-dark-muted">
                      {isUser ? 'You' : msg.senderName || 'Sprinkl Bot'}
                    </span>
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
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 leading-relaxed break-words ${
                      isUser
                        ? 'bg-brand-500 text-slate-950 font-medium rounded-tr-none'
                        : 'bg-slate-900 border border-dark-border text-slate-200 rounded-tl-none'
                    }`}
                  >
                    <p className="whitespace-pre-wrap text-[13px]">{msg.text}</p>

                    {/* One-click Request Agent Button when bot prompts to request an agent */}
                    {!isUser &&
                      (msg.text.includes('outside the topics') ||
                        msg.text.includes('request a human agent') ||
                        msg.text.includes('Request Agent')) && (
                        <button
                          type="button"
                          onClick={() => handleSendMessage('I would like to speak with a human support agent.')}
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

          {/* Footer & Input */}
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
                placeholder="Ask support or report an issue..."
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

            <p className="text-[10px] text-dark-muted text-center mt-2">
              🔒 Attachments are &bull; deleted upon ending chat
            </p>
          </div>
        </div>
      )}
    </>
  );
}
