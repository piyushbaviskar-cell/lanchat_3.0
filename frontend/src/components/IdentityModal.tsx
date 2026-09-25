import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, Lock, Laptop, Smartphone, KeyRound, AlertCircle, X } from 'lucide-react';
import { identityService, OperatorIdentity } from '../services/IdentityService';
import { Button } from './ui/button';

interface IdentityModalProps {
  isOpen: boolean;
  onComplete: (identity: OperatorIdentity) => void;
  allowEditMode?: boolean;
  onClose?: () => void;
}

export const IdentityModal: React.FC<IdentityModalProps> = ({
  isOpen,
  onComplete,
  allowEditMode = false,
  onClose
}) => {
  const [fullName, setFullName] = useState('');
  const [tagPreview, setTagPreview] = useState('#....');
  const [deviceType, setDeviceType] = useState<'MOBILE' | 'DESKTOP'>('DESKTOP');
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [existingIdentity, setExistingIdentity] = useState<OperatorIdentity | null>(null);

  useEffect(() => {
    const existing = identityService.getSafeState();
    if (existing) {
      setExistingIdentity(existing);
      setFullName(existing.fullName);
      setTagPreview(existing.deviceTag);
      setDeviceType(existing.deviceType);
    } else {
      setDeviceType(identityService.getDeviceType());
      identityService.deriveDeviceTag().then(tag => setTagPreview(`#${tag}`));
    }
  }, [isOpen]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!fullName || fullName.trim().length < 3) {
      setError('Operator Call Sign / Full Name must be at least 3 characters.');
      return;
    }

    setIsProcessing(true);
    try {
      if (existingIdentity && allowEditMode) {
        // Execute rename
        const res = await identityService.rename(fullName);
        if (!res.success) {
          setError(res.error || 'Failed to update callsign.');
          setIsProcessing(false);
          return;
        }
        onComplete(identityService.getState());
        onClose?.();
      } else {
        const id = await identityService.createProfile(fullName);
        onComplete(id);
      }
    } catch (err: any) {
      setError(err.message || 'Cryptographic identity generation failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  const isLocked = existingIdentity && allowEditMode && existingIdentity.renameQuotaRemaining <= 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-lg">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md glass-surface-modal rounded-xl overflow-hidden"
      >
        {/* Tactical Accent Top Strip */}
        <div className="h-px bg-gradient-to-r from-emerald-500/60 via-cyan-500/40 to-emerald-400/20" />

        {/* Header */}
        <div className="flex items-center justify-between p-5 pb-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/15 flex items-center justify-center text-emerald-400">
              <Shield className="w-4.5 h-4.5" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-[0.1em] text-neutral-200 uppercase font-tactical">
                {allowEditMode ? 'Tactical Callsign Ledger' : 'Operator Onboarding'}
              </h2>
              <p className="text-[10px] text-neutral-600 font-tactical mt-0.5">ECDSA P-256 Sovereign Node Identity</p>
            </div>
          </div>
          {allowEditMode && onClose && (
            <button 
              onClick={onClose} 
              className="p-1.5 text-neutral-500 hover:text-white rounded-md hover:bg-white/5 transition-all duration-150"
              aria-label="Close modal"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="p-5 space-y-4">
          {/* Device & Hardware Profile Card */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="bg-white/[0.02] border border-white/[0.05] rounded-lg p-3 flex items-center gap-3">
              <div className="text-indigo-400/80">
                {deviceType === 'MOBILE' ? <Smartphone className="w-4.5 h-4.5" /> : <Laptop className="w-4.5 h-4.5" />}
              </div>
              <div>
                <div className="text-[9px] uppercase tracking-wider text-neutral-600 font-tactical">Hardware Type</div>
                <div className="text-xs font-semibold text-neutral-300 mt-0.5">
                  {deviceType === 'MOBILE' ? 'Mobile Hotspot' : 'Desktop Node'}
                </div>
              </div>
            </div>

            <div className="bg-white/[0.02] border border-white/[0.05] rounded-lg p-3 flex items-center gap-3">
              <div className="text-emerald-400/80">
                <KeyRound className="w-4.5 h-4.5" />
              </div>
              <div>
                <div className="text-[9px] uppercase tracking-wider text-neutral-600 font-tactical">Device Tag</div>
                <div className="text-xs font-semibold text-emerald-400/80 mt-0.5 font-tactical">{tagPreview}</div>
              </div>
            </div>
          </div>

          {/* Quota Status Banner */}
          {allowEditMode && (
            <div className={`p-2.5 rounded-lg border text-xs flex items-center gap-2 font-tactical ${
              isLocked 
                ? 'bg-red-500/[0.06] border-red-500/15 text-red-400/80'
                : 'bg-indigo-500/[0.06] border-indigo-500/15 text-indigo-400/80'
            }`}>
              <Lock className="w-3.5 h-3.5 shrink-0" />
              <span>
                {isLocked 
                  ? 'Callsign Locked (1/1 Rename Quota Used)'
                  : '1 Lifetime Rename Quota Available (1/1)'}
              </span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-neutral-500 mb-1.5 font-tactical">
                Full Legal / Operational Callsign
              </label>
              <input
                type="text"
                placeholder="e.g., Kshitij Khilari"
                value={fullName}
                disabled={isLocked || isProcessing}
                onChange={e => setFullName(e.target.value)}
                autoFocus
                className="w-full bg-white/[0.03] border border-white/[0.06] rounded-lg px-4 py-3 text-sm text-neutral-200 placeholder:text-neutral-600 focus:outline-none focus:border-emerald-400/40 focus:ring-1 focus:ring-emerald-400/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150 font-tactical"
                aria-label="Operator callsign"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-xs text-red-400/80 bg-red-500/[0.06] border border-red-500/15 p-2.5 rounded-lg font-tactical">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Button
              type="submit"
              disabled={isLocked || isProcessing || fullName.trim().length < 3}
              className="w-full h-11 bg-emerald-600 hover:bg-emerald-500 text-black font-bold tracking-wide rounded-lg transition-all duration-150 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {isProcessing ? 'Generating Keypair...' : allowEditMode ? 'Commit Callsign Transition' : 'Initialize Defense Node'}
            </Button>
          </form>

          <div className="text-center pt-1">
            <span className="text-[9px] text-neutral-700 tracking-wider font-tactical">
              AIR-GAPPED COMPLIANT • ZERO EXTERNAL CLOUD TELEMETRY
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
