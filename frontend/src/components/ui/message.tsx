import React from 'react';
import { motion, useAnimation } from 'framer-motion';
import { Reply, CornerDownRight, Check, Clock, ImageIcon, Eye } from 'lucide-react';
import { VoiceBubble } from './VoiceBubble';

export interface MessageProps {
  id?: string;
  from: 'user' | 'assistant';
  content?: string;
  senderName?: string;
  senderTag?: string;
  timestamp?: number;
  type?: string;
  audioData?: string;
  durationSec?: number;
  replyTo?: {
    id: string;
    sender: string;
    content: string;
  };
  pending?: boolean;
  onReply?: () => void;
  onOpenImage?: (src: string) => void;
}

export function Message({
  from,
  content,
  senderName,
  senderTag,
  timestamp,
  type,
  audioData,
  durationSec,
  replyTo,
  pending = false,
  onReply,
  onOpenImage
}: MessageProps) {
  const isUser = from === 'user';
  const controls = useAnimation();

  const handleDragEnd = (_e: any, info: any) => {
    if (info.offset.x > 50) {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try { (navigator as any).vibrate(10); } catch(err) {}
      }
      onReply?.();
      controls.start({ x: 0, transition: { type: 'spring', stiffness: 350, damping: 25 } });
    } else {
      controls.start({ x: 0 });
    }
  };

  const isVoice = type === 'VOICE' || !!audioData;
  const isImage = type === 'IMAGE' || (content && content.startsWith('data:image/'));

  // Detect SITREP / alert messages for special styling
  const isAlert = typeof content === 'string' && (
    content.includes('RED ALERT') || content.includes('SOS')
  );
  const isCaution = typeof content === 'string' && content.includes('RADIO SILENCE');
  const isAllClear = typeof content === 'string' && content.includes('STATUS GREEN');
  const isGPS = typeof content === 'string' && content.includes('GPS LOCKED');

  // Determine bubble border accent based on content type
  const getBubbleBorderClass = () => {
    if (isAlert) return 'border-destructive/40 shadow-sm shadow-destructive/10';
    if (isCaution) return 'border-amber-500/40 shadow-sm shadow-amber-500/10';
    if (isAllClear) return 'border-accent/40 shadow-sm shadow-accent/10';
    if (isGPS) return 'border-accent/30 shadow-sm shadow-accent/5';
    return isUser ? 'border-surface-outline' : 'border-surface-outline/50';
  };

  return (
    <div className={`flex w-full mb-2 group relative ${isUser ? 'justify-end' : 'justify-start'}`}>
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 80 }}
        dragElastic={0.15}
        onDragEnd={handleDragEnd}
        animate={controls}
        className={`flex max-w-[88%] sm:max-w-[75%] gap-2 items-end relative ${
          isUser ? 'flex-row-reverse' : 'flex-row'
        }`}
      >
        {/* Message Bubble Container */}
        <div className="flex flex-col">
          {/* Sender Header */}
          <div className={`flex items-center gap-1.5 mb-1 text-[10px] ${
            isUser ? 'justify-end' : 'justify-start'
          }`}>
            <span className={`font-bold font-tactical ${isUser ? 'text-white' : 'text-neutral-300'}`}>
              {senderName || 'Operator'}
            </span>
            {senderTag && <span className="text-neutral-600 font-tactical">{senderTag}</span>}
            {timestamp && (
              <span className="text-neutral-700 font-tactical">
                {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>

          {/* Main Bubble */}
          <div className={`p-3 rounded-2xl border text-sm shadow-sm relative ${
            isUser 
              ? `bg-surface text-foreground ${getBubbleBorderClass()} rounded-br-sm` 
              : `bg-surface-muted text-foreground ${getBubbleBorderClass()} rounded-bl-sm`
          }`}>
            {/* Quoted Reference */}
            {replyTo && (
              <div className="mb-2 p-2 bg-black/20 border-l-2 border-emerald-500/40 rounded text-xs text-neutral-400">
                <div className="text-[10px] text-accent/70 font-bold flex items-center gap-1 font-tactical">
                  <CornerDownRight className="w-3 h-3" /> Replying to {replyTo.sender}:
                </div>
                <div className="truncate text-neutral-500 mt-0.5">{replyTo.content}</div>
              </div>
            )}

            {/* Content Rendering: Voice, Image, or Text */}
            {isVoice ? (
              <VoiceBubble
                audioBase64={audioData!}
                durationSec={durationSec || 3}
                senderName={senderName}
                senderTag={senderTag}
                isSelf={isUser}
              />
            ) : isImage ? (
              <div className="flex flex-col gap-1.5">
                <div 
                  onClick={() => onOpenImage?.(content!)}
                  className="relative group/img cursor-pointer overflow-hidden rounded-lg border border-white/[0.06] bg-black/20 max-w-sm"
                >
                  <img
                    src={content}
                    alt="Tactical Asset"
                    className="w-full max-h-72 object-cover transition-transform duration-300 group-hover/img:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/img:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-1.5 text-xs text-white font-tactical">
                    <Eye className="w-4 h-4" /> Expand
                  </div>
                </div>
                <span className="text-[9px] text-neutral-600 flex items-center gap-1 font-tactical">
                  <ImageIcon className="w-3 h-3 text-cyan-500/50" /> TACTICAL RECON IMAGE
                </span>
              </div>
            ) : (
              <div className="leading-relaxed whitespace-pre-wrap break-words" style={{ fontFamily: '"Geist Variable", Inter, system-ui, sans-serif' }}>
                {content}
              </div>
            )}

            {/* Loopback pending / confirmed state */}
            {isUser && (
              <div className="flex justify-end mt-1.5 text-[9px]">
                {pending ? (
                  <span className="flex items-center gap-1 text-amber-500/70 font-tactical">
                    <Clock className="w-2.5 h-2.5 animate-spin" /> Transmitting
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-emerald-500/60 font-tactical">
                    <Check className="w-2.5 h-2.5" /> Confirmed
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Desktop Hover Action [↩ Reply] */}
        <div className={`opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex items-center mb-4 ${
          isUser ? 'order-first mr-0.5' : 'ml-0.5'
        }`}>
          <button
            onClick={onReply}
            className="p-1.5 bg-white/[0.03] hover:bg-emerald-500/10 text-neutral-600 hover:text-emerald-300 rounded-md border border-white/[0.06] hover:border-emerald-500/25 transition-all duration-150"
            title="Reply"
            aria-label="Reply to this message"
          >
            <Reply className="w-3 h-3" />
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export function MessageAvatar({ src: _src, name }: { src?: string; name?: string }) {
  const initial = name ? name.charAt(0).toUpperCase() : 'O';
  return (
    <div className="w-7 h-7 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-[10px] font-bold text-emerald-400/80 shrink-0 font-tactical">
      {initial}
    </div>
  );
}

export function MessageContent({ children }: { children: React.ReactNode }) {
  return <div className="leading-relaxed whitespace-pre-wrap">{children}</div>;
}
