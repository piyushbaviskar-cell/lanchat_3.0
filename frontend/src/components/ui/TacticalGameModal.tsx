import React from 'react';
import { Button } from './button';
import { TacticalRadarStrike } from '../../game/TacticalRadarStrike';
import { identityService } from '../../services/IdentityService';
import { X, Gamepad2 } from 'lucide-react';

interface TacticalGameModalProps {
  isOpen: boolean;
  onClose: () => void;
  stompClient: any;
  localId: string;
  users?: any[];
}

export const TacticalGameModal: React.FC<TacticalGameModalProps> = ({ isOpen, onClose, stompClient, localId, users = [] }) => {
  const activeGame = 'RADAR_STRIKE';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-lg p-4 md:p-6 flex flex-col items-center justify-center">
      <div className="w-full max-w-4xl flex justify-between items-center mb-4 border-b border-cyan-500/12 pb-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/15 flex items-center justify-center">
            <Gamepad2 className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <span className="text-sm font-bold tracking-[0.12em] text-neutral-200 uppercase block font-tactical">
              APEX Tactical Mini-Games
            </span>
            <span className="text-[9px] text-cyan-400/60 font-tactical">
              OPERATOR: {identityService.getDisplayName()}
            </span>
          </div>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onClose} 
          className="p-1.5 text-neutral-500 hover:text-white rounded-md hover:bg-white/5 transition-all duration-150"
          aria-label="Close Games"
        >
          <X className="w-4.5 h-4.5" />
        </Button>
      </div>

      <div className="w-full max-w-4xl flex-1 flex flex-col items-center justify-center overflow-y-auto">
        {activeGame === 'RADAR_STRIKE' && (
          <TacticalRadarStrike stompClient={stompClient} localId={localId} users={users} />
        )}
      </div>
    </div>
  );
};
