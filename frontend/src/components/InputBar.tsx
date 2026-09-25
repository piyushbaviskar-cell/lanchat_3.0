import { useState, useRef } from 'react';
import { Send, Mic, Square, ImagePlus, Satellite, MapPin, ShieldCheck, AlertTriangle, TriangleAlert } from 'lucide-react';
import { Button } from './ui/button';
import { compressTacticalImage } from '../utils/ImageCompressor';
import { TransportTier } from '../services/transports/STALRouter';

export interface InputBarProps {
  onSend: (msg: string) => void;
  onSendImage?: (base64: string) => void;
  onPttStart?: () => void;
  onPttStop?: () => void;
  isRecording?: boolean;
  activeTier?: TransportTier;
  onTyping?: () => void;
  disabled?: boolean;
}

export default function InputBar({
  onSend,
  onSendImage,
  onPttStart,
  onPttStop,
  isRecording = false,
  activeTier = 'TIER_0_LAN',
  onTyping,
  disabled
}: InputBarProps) {
  const [value, setValue] = useState('');
  const [isCompressing, setIsCompressing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isNavicActive = activeTier === 'TIER_4_NAVIC';
  const maxChars = isNavicActive ? 230 : 1000;

  function handleSend() {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue('');
    inputRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
      return;
    }
    onTyping?.();
  }

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !onSendImage) return;

    try {
      setIsCompressing(true);
      const result = await compressTacticalImage(file);
      onSendImage(result.base64);
    } catch (err: any) {
      alert(`Image compression error: ${err.message || 'Failed to process image'}`);
    } finally {
      setIsCompressing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  const charsRemaining = maxChars - value.length;

  return (
    <div className="flex flex-col gap-2 w-full">
      {/* Quick SITREP Status Beacons */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
        <span className="text-[9px] text-neutral-600 uppercase tracking-wider shrink-0 hidden sm:inline font-tactical">SITREP:</span>
        
        <button
          type="button"
          onClick={() => onSend('📍 SITREP: [GPS LOCKED: 18.9220° N, 72.8347° E • GRID POSITION SECURE]')}
          disabled={disabled}
          className="px-2 py-1 rounded-md bg-transparent border border-white/20 text-neutral-400 hover:bg-white hover:text-black hover:border-white text-[10px] shrink-0 transition-all duration-150 disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1 font-tactical"
          title="Broadcast GPS Coordinates"
          aria-label="Send GPS Ping"
        >
          <MapPin className="w-3 h-3" /> GPS Ping
        </button>

        <button
          type="button"
          onClick={() => onSend('🛡️ SITREP: [STATUS GREEN • PERIMETER SECURE • 100% OPERATIONAL]')}
          disabled={disabled}
          className="px-2 py-1 rounded-md bg-transparent border border-white/20 text-neutral-400 hover:bg-white hover:text-black hover:border-white text-[10px] shrink-0 transition-all duration-150 disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1 font-tactical"
          title="Broadcast All Clear"
          aria-label="Send All Clear"
        >
          <ShieldCheck className="w-3 h-3" /> All Clear
        </button>

        <button
          type="button"
          onClick={() => onSend('🚨 RED ALERT: [SOS • HOSTILE ELECTRONIC INTERFERENCE DETECTED]')}
          disabled={disabled}
          className="px-2 py-1 rounded-md bg-surface-muted border border-surface-outline text-foreground hover:bg-surface-outline hover:text-destructive text-[10px] shrink-0 transition-all duration-150 disabled:opacity-30 disabled:cursor-not-allowed red-alert-pulse flex items-center gap-1 font-tactical"
          title="Broadcast Emergency Red Alert"
          aria-label="Send Red Alert"
        >
          <TriangleAlert className="w-3 h-3" /> Red Alert
        </button>

        <button
          type="button"
          onClick={() => onSend('⚠️ SITREP: [RADIO SILENCE REQUESTED • SWITCH TO BACKUP TIER]')}
          disabled={disabled}
          className="px-2 py-1 rounded-md bg-transparent border border-white/20 text-neutral-400 hover:bg-white hover:text-black hover:border-white text-[10px] shrink-0 transition-all duration-150 disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1 font-tactical"
          title="Broadcast Caution"
          aria-label="Send Caution"
        >
          <AlertTriangle className="w-3 h-3" /> Caution
        </button>
      </div>

      {/* NavIC Space Telemetry Notice Banner */}
      {isNavicActive && (
        <div className="flex items-center justify-between px-3 py-1.5 bg-cyan-950/40 border border-cyan-800/40 rounded-lg text-[10px] text-cyan-300 font-tactical">
          <span className="flex items-center gap-1.5 font-bold">
            <Satellite className="w-3.5 h-3.5 animate-pulse" /> NAVIC BURST MODE — 256B PACKETS
          </span>
          <span className={charsRemaining < 30 ? 'text-amber-400 font-bold' : 'text-neutral-500'}>
            {charsRemaining} Bytes Remaining
          </span>
        </div>
      )}

      {/* Main Input Row */}
      <div className="flex gap-1.5 items-center w-full">
        {/* Hidden File Input for Tactical Image Capture */}
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          className="hidden"
          onChange={handleFileSelected}
        />

        {/* Image / Camera Attachment Button */}
        {onSendImage && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || isCompressing || isNavicActive}
            className="h-10 w-10 rounded-lg bg-surface-muted border border-surface-outline text-foreground hover:text-accent hover:border-surface hover:bg-surface flex items-center justify-center transition-all duration-150 shrink-0 disabled:opacity-30 disabled:cursor-not-allowed"
            title={isNavicActive ? "Images disabled on 256-byte satellite links" : "Send Compressed Tactical Image (<150KB)"}
            aria-label="Attach image"
          >
            <ImagePlus className={`w-4 h-4 ${isCompressing ? 'animate-spin text-cyan-400' : ''}`} />
          </button>
        )}

        {/* PTT Hold / Speak Button */}
        {onPttStart && (
          <button
            type="button"
            onMouseDown={onPttStart}
            onMouseUp={onPttStop}
            onTouchStart={onPttStart}
            onTouchEnd={onPttStop}
            className={`h-10 w-10 rounded-lg border flex items-center justify-center transition-all duration-150 shrink-0 ${
              isRecording
                ? 'bg-destructive border-destructive text-destructive-foreground animate-pulse shadow-[0_0_12px_rgba(239,68,68,0.4)]'
                : 'bg-surface-muted border-surface-outline text-foreground hover:text-accent hover:border-surface hover:bg-surface'
            }`}
            title="Push-To-Talk: Hold or tap to speak"
            aria-label={isRecording ? "Stop recording" : "Push to talk"}
          >
            {isRecording ? <Square className="w-4 h-4 fill-current" /> : <Mic className="w-4 h-4" />}
          </button>
        )}

        {/* Text Input */}
        <div className="flex-1 relative">
          <input
            ref={inputRef}
            type="text"
            placeholder={
              isRecording 
                ? 'Recording tactical audio burst...' 
                : isNavicActive 
                ? 'Transmit 256-byte NavIC space datagram...' 
                : 'Transmit secure message...'
            }
            value={value}
            maxLength={maxChars}
            disabled={disabled || isRecording}
            onChange={e => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            autoComplete="off"
            spellCheck={false}
            className="w-full h-10 bg-transparent border-b border-white/20 rounded-none px-2 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-white transition-all duration-150 disabled:opacity-40 font-tactical"
            aria-label="Message input"
          />
          {value.length > maxChars * 0.7 && (
            <span className={`absolute right-0 top-1/2 -translate-y-1/2 text-[10px] pointer-events-none font-tactical ${
              charsRemaining < 20 ? 'text-red-400' : 'text-neutral-600'
            }`}>
              {value.length}/{maxChars}
            </span>
          )}
        </div>

        {/* Dispatch Button */}
        <Button
          type="button"
          className="h-10 px-5 rounded-full bg-white text-black font-bold hover:bg-neutral-200 transition-all duration-150 active:scale-95 shrink-0 disabled:opacity-30 font-tactical uppercase text-xs tracking-wider"
          onClick={handleSend}
          disabled={disabled || !value.trim()}
          title="Send"
          aria-label="Send message"
        >
          SEND <Send className="w-3.5 h-3.5 ml-2" />
        </Button>
      </div>
    </div>
  );
}
