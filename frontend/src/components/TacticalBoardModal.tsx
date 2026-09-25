import React from 'react';
import { Button } from './ui/button';
import { TacticalCanvas } from './ui/TacticalCanvas';
import { X, PenTool } from 'lucide-react';

interface TacticalBoardModalProps {
  isOpen: boolean;
  onClose: () => void;
  stompClient: any;
  localId: string;
}

export const TacticalBoardModal: React.FC<TacticalBoardModalProps> = ({ isOpen, onClose, stompClient, localId }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-lg p-4 md:p-6 flex flex-col items-center justify-center">
      <div className="w-full max-w-5xl flex justify-between items-center mb-3 border-b border-emerald-500/12 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/15 flex items-center justify-center">
            <PenTool className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <span className="text-sm font-bold tracking-[0.12em] text-neutral-200 uppercase block font-tactical">
              Synchronized Tactical Whiteboard
            </span>
            <span className="text-[9px] text-emerald-400/60 font-tactical">
              Vector Sync Active (&lt;10ms)
            </span>
          </div>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onClose} 
          className="p-1.5 text-neutral-500 hover:text-white rounded-md hover:bg-white/5 transition-all duration-150"
          aria-label="Close Tactical Board"
        >
          <X className="w-4.5 h-4.5" />
        </Button>
      </div>

      <div className="w-full max-w-5xl flex-1 h-[75vh] rounded-xl overflow-hidden border border-white/[0.06]">
        <TacticalCanvas stompClient={stompClient} localId={localId} />
      </div>
    </div>
  );
};
