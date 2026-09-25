import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Search, Radio, X } from 'lucide-react';
import { tacticalContactsService, TacticalContact } from '../services/TacticalContactsService';
import { stalRouter, TransportStatus } from '../services/transports/STALRouter';

export default function FavoritesHUD() {
  const [favorites, setFavorites] = useState<TacticalContact[]>([]);
  const [allContacts, setAllContacts] = useState<TacticalContact[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [transportStatus, setTransportStatus] = useState<TransportStatus>(stalRouter.getTransportStatus());

  useEffect(() => {
    loadContacts();
    return stalRouter.onStatusChange(setTransportStatus);
  }, []);

  const loadContacts = async () => {
    try {
      const contacts = await tacticalContactsService.getAllContacts();
      setAllContacts(contacts);
      setFavorites(contacts.filter(c => c.isFavorite));
    } catch (e) {
      console.warn('Failed to load contacts from IndexedDB:', e);
    }
  };

  const toggleFavorite = async (fingerprint: string, current: boolean) => {
    await tacticalContactsService.toggleFavorite(fingerprint, !current);
    loadContacts();
  };

  const filteredContacts = allContacts.filter(c => 
    (c.petname || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
    (c.declaredFullName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.publicKeyFingerprint || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full glass-surface border-b border-emerald-500/8 px-3 md:px-4 py-1.5 text-xs text-white flex items-center justify-between pointer-events-auto z-30">
      {/* Left: Active Multi-Transport Status Badge */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 px-2 py-1 bg-white/[0.03] border border-white/[0.05] rounded-lg">
          <Radio className="w-3 h-3 text-emerald-400/70 animate-pulse" />
          <span className="text-[9px] text-neutral-600 font-tactical">TRANSPORT:</span>
          <span className="text-[10px] font-bold text-emerald-400/80 font-tactical">{transportStatus.badge}</span>
        </div>
      </div>

      {/* Center: Pinned Tactical Favorites Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto max-w-xl py-0.5 no-scrollbar">
        {favorites.length === 0 ? (
          <span className="text-[9px] text-neutral-700 hidden sm:inline font-tactical">
            No pinned favorites — star contacts to pin
          </span>
        ) : (
          favorites.map(fav => (
            <div
              key={fav.publicKeyFingerprint}
              className="flex items-center gap-1.5 px-2 py-1 bg-white/[0.02] border border-white/[0.05] hover:border-amber-500/30 rounded-lg shrink-0 transition-colors"
            >
              <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400 shrink-0" />
              <span className="text-[10px] font-semibold text-neutral-300 truncate max-w-[80px]">
                {fav.petname || fav.declaredFullName}
              </span>
              <span className="text-[8px] px-1 bg-emerald-500/[0.06] border border-emerald-500/15 text-emerald-400/60 rounded font-tactical">
                2ms
              </span>
            </div>
          ))
        )}
      </div>

      {/* Right: Quick Directory Modal Toggle */}
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1.5 px-2 py-1 bg-white/[0.03] hover:bg-white/[0.05] border border-white/[0.05] hover:border-indigo-500/25 rounded-lg text-neutral-500 hover:text-neutral-300 transition-all duration-150"
          aria-label="Open contact directory"
        >
          <Search className="w-3 h-3 text-indigo-400/70" />
          <span className="text-[10px] font-tactical">Directory ({allContacts.length})</span>
        </button>

        {/* Directory Dropdown */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 5, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 5, scale: 0.98 }}
              className="absolute right-0 top-full mt-2 w-80 glass-surface-modal rounded-xl p-3 z-50 flex flex-col max-h-80"
            >
              <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-white/[0.06]">
                <span className="text-xs font-bold text-neutral-300 uppercase font-tactical">Tactical Directory</span>
                <button 
                  onClick={() => setIsOpen(false)} 
                  className="p-1 text-neutral-500 hover:text-white rounded hover:bg-white/5 transition-colors"
                  aria-label="Close directory"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <input
                type="text"
                placeholder="Filter by name / #tag..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-white/[0.03] border border-white/[0.06] rounded-lg px-2.5 py-1.5 text-xs text-neutral-300 placeholder:text-neutral-600 mb-2 focus:outline-none focus:border-emerald-400/30 font-tactical"
                aria-label="Filter contacts"
              />

              <div className="flex-1 overflow-y-auto space-y-1">
                {filteredContacts.length === 0 ? (
                  <div className="text-center p-3 text-[10px] text-neutral-600 font-tactical">No matching contacts</div>
                ) : (
                  filteredContacts.map(c => (
                    <div key={c.publicKeyFingerprint} className="flex items-center justify-between p-2 rounded-lg bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] transition-colors">
                      <div>
                        <div className="text-xs font-semibold text-neutral-300">{c.petname || c.declaredFullName}</div>
                        <div className="text-[9px] text-neutral-600 font-tactical">{c.publicKeyFingerprint}</div>
                      </div>
                      <button
                        onClick={() => toggleFavorite(c.publicKeyFingerprint, c.isFavorite)}
                        className="p-1 text-neutral-600 hover:text-amber-400 transition-colors"
                        aria-label={`${c.isFavorite ? 'Unstar' : 'Star'} ${c.petname || c.declaredFullName}`}
                      >
                        <Star className={`w-3.5 h-3.5 ${c.isFavorite ? 'text-amber-400 fill-amber-400' : ''}`} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
