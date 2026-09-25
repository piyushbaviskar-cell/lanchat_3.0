import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Star, Smartphone, Laptop, X, Users, UserCheck, Signal } from 'lucide-react';
import { tacticalContactsService } from '../services/TacticalContactsService';

export interface User {
  clientId: string;
  displayName?: string;
  deviceType?: 'MOBILE' | 'DESKTOP' | 'TABLET' | string;
}

interface UserListProps {
  users: User[];
  myIp?: string;
  myClientId?: string;
  typingUsers?: string[];
  isOpen: boolean;
  onClose: () => void;
  onOpenIdentityModal?: () => void;
}

export default function UserList({
  users,
  myClientId,
  isOpen,
  onClose,
  onOpenIdentityModal
}: UserListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [favoriteMap, setFavoriteMap] = useState<Record<string, boolean>>({});

  const handleToggleFavorite = async (user: User) => {
    const key = user.clientId;
    const nextState = !favoriteMap[key];
    setFavoriteMap(prev => ({ ...prev, [key]: nextState }));

    await tacticalContactsService.upsertContact({
      publicKeyFingerprint: user.clientId,
      rawPublicKey: user.clientId,
      declaredFullName: user.displayName || user.clientId,
      petname: user.displayName || user.clientId,
      isFavorite: nextState,
      trustStatus: 'VERIFIED_IN_PERSON',
      transportsAvailable: ['LOCAL_MESH'],
      lastKnownVector: {
        timestamp: Date.now(),
        transport: 'LOCAL_MESH'
      }
    });
  };

  const filteredUsers = users.filter(u => {
    const name = (u.displayName || u.clientId || '').toLowerCase();
    const q = searchQuery.toLowerCase();
    return name.includes(q) || u.clientId.toLowerCase().includes(q);
  });

  return (
    <>
      {/* Mobile Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          />
        )}
      </AnimatePresence>

      <aside className={`
        fixed md:static inset-y-0 left-0 z-40
        w-[82vw] max-w-[320px] md:w-[260px] lg:w-[300px] flex-shrink-0 flex flex-col h-full 
        glass-surface-elevated
        transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Sidebar Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-transparent">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-white/5 border border-white/20 flex items-center justify-center">
              <Users className="w-3.5 h-3.5 text-white" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-white tracking-[0.12em] uppercase block font-tactical">
                MESH NODES
              </span>
              <span className="text-[9px] text-neutral-400 font-tactical">{users.length} connected</span>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 md:hidden text-neutral-500 hover:text-white rounded-md hover:bg-white/5 transition-all duration-150"
            aria-label="Close sidebar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Directory Search */}
        <div className="px-3 py-2.5 border-b border-white/10">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-neutral-600" />
            <input
              type="text"
              placeholder="Search callsign or #tag..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-transparent border-b border-white/20 rounded-none pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-white transition-all duration-150 font-tactical"
              aria-label="Search mesh nodes"
            />
          </div>
        </div>

        {/* User Items */}
        <div className="flex-1 overflow-y-auto px-2.5 py-2 space-y-1">
          {filteredUsers.length === 0 ? (
            <div className="p-6 text-center">
              <Signal className="w-5 h-5 text-neutral-700 mx-auto mb-2" />
              <div className="text-[11px] text-neutral-600 font-tactical">
                {searchQuery ? 'No matching nodes' : 'Scanning local mesh...'}
              </div>
            </div>
          ) : (
            filteredUsers.map(user => {
              const isMe = user.clientId === myClientId;
              const isFav = favoriteMap[user.clientId];
              const isMobile = user.deviceType === 'MOBILE' || user.deviceType === 'TABLET';

              return (
                <div
                  key={user.clientId}
                  className={`flex items-center justify-between p-2.5 rounded-lg border transition-all duration-150 group ${
                    isMe
                      ? 'bg-white/10 border-white/20 border-l-2 border-l-white'
                      : 'bg-transparent border-white/5 hover:bg-white/5 hover:border-white/15'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    {/* Device icon with status dot */}
                    <div className="relative shrink-0">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        isMe ? 'bg-white/10 border border-white/20' : 'bg-white/[0.03] border border-white/[0.06]'
                      }`}>
                        {isMobile 
                          ? <Smartphone className="w-3.5 h-3.5 text-white/80" /> 
                          : <Laptop className="w-3.5 h-3.5 text-white/80" />
                        }
                      </div>
                      <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-white border border-black online-pulse" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold truncate flex items-center gap-1.5 text-neutral-200">
                        <span className="truncate">{user.displayName || user.clientId}</span>
                        {isMe && (
                          <span className="text-[8px] bg-white/10 text-white px-1.5 py-px rounded font-bold tracking-wider border border-white/20 font-tactical">
                            YOU
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-neutral-600 flex items-center gap-1 mt-0.5 font-tactical">
                        <span>{isMobile ? 'Mobile' : 'Desktop'} Node</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0 ml-2">
                    {!isMe && (
                      <button
                        onClick={() => handleToggleFavorite(user)}
                        className="p-1.5 text-neutral-600 hover:text-amber-400 transition-colors opacity-0 group-hover:opacity-100"
                        title="Add to Favorites"
                        aria-label={`${isFav ? 'Remove' : 'Add'} ${user.displayName || user.clientId} from favorites`}
                      >
                        <Star className={`w-3.5 h-3.5 ${isFav ? 'text-amber-400 fill-amber-400 opacity-100' : ''}`} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Callsign / Rename Banner */}
        {onOpenIdentityModal && (
          <div className="p-3 border-t border-white/10">
            <button
              onClick={onOpenIdentityModal}
              className="w-full py-2.5 bg-transparent hover:bg-white border border-white/20 hover:border-white rounded-lg text-xs font-bold text-neutral-300 hover:text-black flex items-center justify-center gap-2 transition-all duration-200 font-tactical uppercase"
              aria-label="Open identity settings"
            >
              <UserCheck className="w-3.5 h-3.5" /> Callsign / Rename Ledger
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
