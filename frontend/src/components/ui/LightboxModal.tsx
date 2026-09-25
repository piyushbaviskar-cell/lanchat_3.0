import React from 'react';
import { motion } from 'framer-motion';
import { X, Download, ImageIcon } from 'lucide-react';

interface LightboxModalProps {
  isOpen: boolean;
  imageSrc: string | null;
  caption?: string;
  onClose: () => void;
}

export const LightboxModal: React.FC<LightboxModalProps> = ({
  isOpen,
  imageSrc,
  caption,
  onClose
}) => {
  if (!isOpen || !imageSrc) return null;

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = imageSrc;
    link.download = `tactical-recon-${Date.now()}.webp`;
    link.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-lg">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative max-w-4xl max-h-[90vh] glass-surface-modal rounded-xl overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-white/[0.06]">
          <span className="text-[10px] text-emerald-400/70 font-bold tracking-[0.1em] uppercase flex items-center gap-1.5 font-tactical">
            <ImageIcon className="w-3.5 h-3.5" /> TACTICAL RECON IMAGE PREVIEW
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleDownload}
              className="p-1.5 bg-white/[0.03] hover:bg-emerald-500/10 rounded-md text-neutral-500 hover:text-white border border-white/[0.06] hover:border-emerald-500/25 transition-all duration-150"
              title="Download Image"
              aria-label="Download image"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 bg-white/[0.03] hover:bg-white/[0.06] rounded-md text-neutral-500 hover:text-white border border-white/[0.06] transition-all duration-150"
              aria-label="Close lightbox"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Image Display */}
        <div className="flex-1 overflow-auto flex items-center justify-center p-3 bg-black/30">
          <img
            src={imageSrc}
            alt={caption || 'Reconnaissance Asset'}
            className="max-w-full max-h-[75vh] object-contain rounded-lg border border-white/[0.04] shadow-lg"
          />
        </div>

        {caption && (
          <div className="p-3 border-t border-white/[0.06] text-[10px] text-neutral-600 font-tactical">
            {caption}
          </div>
        )}
      </motion.div>
    </div>
  );
};
