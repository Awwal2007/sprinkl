import React, { useState } from 'react';
import { Copy, Check, Share2, ExternalLink } from 'lucide-react';
import { toast } from '../store/useNotificationStore';

export const SPRINKL_SOCIAL_LINKS = [
  {
    name: 'X (Twitter)',
    handle: '@sprinklbiz',
    url: 'https://x.com/sprinklbiz',
    color: 'hover:text-slate-900 dark:hover:text-white hover:border-slate-400 dark:hover:border-slate-500',
    bgColor: 'hover:bg-slate-100 dark:hover:bg-slate-800',
    icon: (props) => (
      <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  {
    name: 'Telegram',
    handle: 'Sprinkl Community',
    url: 'https://t.me/+JbLphS_Zy3hmOGNk',
    color: 'hover:text-sky-500 dark:hover:text-sky-400 hover:border-sky-500/30',
    bgColor: 'hover:bg-sky-500/10',
    icon: (props) => (
      <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .37z" />
      </svg>
    ),
  },
  {
    name: 'Instagram',
    handle: '@sprinklbiz',
    url: 'https://instagram.com/sprinklbiz',
    color: 'hover:text-pink-500 dark:hover:text-pink-400 hover:border-pink-500/30',
    bgColor: 'hover:bg-pink-500/10',
    icon: (props) => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
        <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
      </svg>
    ),
  },
  {
    name: 'WhatsApp Channel',
    handle: 'Sprinkl Updates',
    url: 'https://whatsapp.com/channel/0029Vb7SprinklBiz',
    color: 'hover:text-emerald-500 dark:hover:text-emerald-400 hover:border-emerald-500/30',
    bgColor: 'hover:bg-emerald-500/10',
    icon: (props) => (
      <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0012.04 2zm0 17.65c-1.49 0-2.94-.4-4.22-1.16l-.3-.18-3.13.82.83-3.04-.2-.31c-.83-1.33-1.27-2.87-1.27-4.46 0-4.55 3.7-8.25 8.29-8.25 2.21 0 4.29.86 5.86 2.42a8.216 8.216 0 012.43 5.84c0 4.56-3.71 8.31-8.29 8.31zm4.54-6.21c-.25-.12-1.47-.72-1.7-.81-.23-.08-.39-.12-.56.12-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-2-1.23-.74-.66-1.24-1.47-1.39-1.72-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.12-.15.17-.25.25-.42.08-.17.04-.31-.02-.44-.06-.12-.56-1.34-.76-1.84-.2-.48-.4-.42-.56-.43h-.48c-.17 0-.44.06-.66.3-.23.25-.88.86-.88 2.09s.9 2.43 1.03 2.6c.12.17 1.77 2.7 4.28 3.79.6.26 1.07.41 1.43.53.6.19 1.15.16 1.58.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.15-1.18-.07-.1-.23-.16-.48-.28z" />
      </svg>
    ),
  },
  {
    name: 'TikTok',
    handle: '@sprinklbiz',
    url: 'https://tiktok.com/@sprinklbiz',
    color: 'hover:text-slate-900 dark:hover:text-white hover:border-slate-400 dark:hover:border-slate-500',
    bgColor: 'hover:bg-slate-100 dark:hover:bg-slate-800',
    icon: (props) => (
      <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.298-.002.595.042.88.13V9.4a6.33 6.33 0 0 0-1-.08A6.34 6.34 0 0 0 3 15.66a6.34 6.34 0 0 0 10.82 4.46V11.8a8.19 8.19 0 0 0 5.77 2.31V10.66a4.86 4.86 0 0 1-3.77-3.97h3.77V6.69z" />
      </svg>
    ),
  },
];

/**
 * Official Sprinkl Social Media Community Links row
 */
export function SprinklSocialBar({ className = '', showLabels = false }) {
  return (
    <div className={`flex items-center flex-wrap gap-2 ${className}`}>
      {SPRINKL_SOCIAL_LINKS.map((item) => {
        const IconComponent = item.icon;
        return (
          <a
            key={item.name}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            title={`${item.name} (${item.handle})`}
            className={`flex items-center gap-2 p-2 sm:px-2.5 sm:py-1.5 rounded-xl border border-slate-200 dark:border-dark-border/80 bg-slate-100/80 dark:bg-white/[0.04] text-slate-600 dark:text-slate-400 transition-all ${item.color} ${item.bgColor} group`}
            aria-label={`Follow Sprinkl on ${item.name}`}
          >
            <IconComponent className="w-4 h-4 transition-transform group-hover:scale-110" />
            {showLabels && (
              <span className="text-xs font-semibold hidden sm:inline-block">
                {item.name}
              </span>
            )}
          </a>
        );
      })}
    </div>
  );
}

/**
 * Share buttons for giving away links across WhatsApp, X, Telegram, and Facebook
 */
export function SocialShareButtons({
  url,
  title,
  amountText = '',
  className = '',
  buttonSize = 'md', // 'sm' | 'md'
}) {
  const [copied, setCopied] = useState(false);

  const fullUrl = url?.startsWith('http')
    ? url
    : typeof window !== 'undefined'
    ? `${window.location.origin}${url?.startsWith('/') ? url : `/${url}`}`
    : url;

  const shareText = `🎁 ${title || 'Instant Giveaway on Sprinkl'}${
    amountText ? ` (${amountText})` : ''
  }! Claim your prize directly to your Nigerian bank account or crypto wallet. First come, first served:`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      toast.success('Giveaway link copied to clipboard!', 'Link Copied');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.info(fullUrl, 'Giveaway Link');
    }
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: title || 'Sprinkl Giveaway',
          text: shareText,
          url: fullUrl,
        });
      } catch (err) {
        // user cancelled or share failed, silently ignore
      }
    } else {
      handleCopy();
    }
  };

  const shareChannels = [
    {
      name: 'WhatsApp',
      href: `https://api.whatsapp.com/send?text=${encodeURIComponent(`${shareText} ${fullUrl}`)}`,
      color: 'bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366] hover:text-white border-[#25D366]/20',
      icon: (props) => (
        <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
          <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0012.04 2zm0 17.65c-1.49 0-2.94-.4-4.22-1.16l-.3-.18-3.13.82.83-3.04-.2-.31c-.83-1.33-1.27-2.87-1.27-4.46 0-4.55 3.7-8.25 8.29-8.25 2.21 0 4.29.86 5.86 2.42a8.216 8.216 0 012.43 5.84c0 4.56-3.71 8.31-8.29 8.31zm4.54-6.21c-.25-.12-1.47-.72-1.7-.81-.23-.08-.39-.12-.56.12-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-2-1.23-.74-.66-1.24-1.47-1.39-1.72-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.12-.15.17-.25.25-.42.08-.17.04-.31-.02-.44-.06-.12-.56-1.34-.76-1.84-.2-.48-.4-.42-.56-.43h-.48c-.17 0-.44.06-.66.3-.23.25-.88.86-.88 2.09s.9 2.43 1.03 2.6c.12.17 1.77 2.7 4.28 3.79.6.26 1.07.41 1.43.53.6.19 1.15.16 1.58.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.15-1.18-.07-.1-.23-.16-.48-.28z" />
        </svg>
      ),
    },
    {
      name: 'X',
      href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(fullUrl)}&hashtags=Sprinkl,Giveaway`,
      color: 'bg-slate-900/10 text-slate-900 dark:bg-white/10 dark:text-white hover:bg-slate-900 hover:text-white dark:hover:bg-white dark:hover:text-slate-950 border-slate-300 dark:border-white/20',
      icon: (props) => (
        <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
    },
    {
      name: 'Telegram',
      href: `https://t.me/share/url?url=${encodeURIComponent(fullUrl)}&text=${encodeURIComponent(shareText)}`,
      color: 'bg-[#229ED9]/10 text-[#229ED9] hover:bg-[#229ED9] hover:text-white border-[#229ED9]/20',
      icon: (props) => (
        <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .37z" />
        </svg>
      ),
    },
    {
      name: 'Facebook',
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(fullUrl)}`,
      color: 'bg-[#1877F2]/10 text-[#1877F2] hover:bg-[#1877F2] hover:text-white border-[#1877F2]/20',
      icon: (props) => (
        <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      ),
    },
  ];

  const padClass = buttonSize === 'sm' ? 'p-2 text-xs' : 'p-2.5 text-xs';
  const iconSize = buttonSize === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4';

  return (
    <div className={`space-y-2.5 ${className}`}>
      <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-dark-muted px-0.5">
        <span>Share via Socials</span>
        <button
          type="button"
          onClick={handleNativeShare}
          className="hover:text-brand-500 transition-colors flex items-center gap-1 cursor-pointer"
        >
          <Share2 className="w-3 h-3" />
          <span>More options</span>
        </button>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {shareChannels.map((channel) => {
          const Icon = channel.icon;
          return (
            <a
              key={channel.name}
              href={channel.href}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex flex-col items-center justify-center gap-1.5 ${padClass} rounded-xl border font-bold transition-all hover:scale-105 active:scale-95 shadow-sm ${channel.color}`}
              title={`Share on ${channel.name}`}
            >
              <Icon className={iconSize} />
              <span className="text-[10px] tracking-tight">{channel.name}</span>
            </a>
          );
        })}
      </div>
    </div>
  );
}
