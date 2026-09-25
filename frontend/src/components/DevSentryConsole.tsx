import React, { useState, useEffect } from 'react';
import { Terminal, Activity, Radio, EyeOff, Eye, Cpu, UserX, X, Smartphone, Laptop } from 'lucide-react';
import { stalRouter, TransportTier, TransportStatus } from '../services/transports/STALRouter';

interface DevSentryConsoleProps {
  isOpen: boolean;
  onClose: () => void;
  users: any[];
  isGhostMode: boolean;
  onToggleGhostMode: () => void;
  stompClient?: any;
}

interface SniffedPacket {
  id: string;
  time: string;
  tier: TransportTier;
  direction: 'INBOUND' | 'OUTBOUND';
  bytes: number;
  info: string;
}

export const DevSentryConsole: React.FC<DevSentryConsoleProps> = ({
  isOpen,
  onClose,
  users,
  isGhostMode,
  onToggleGhostMode,
  stompClient
}) => {
  const [transportStatus, setTransportStatus] = useState<TransportStatus>(stalRouter.getTransportStatus());
  const [selectedTierOverride, setSelectedTierOverride] = useState<TransportTier | 'AUTO'>('AUTO');
  const [sniffedPackets, setSniffedPackets] = useState<SniffedPacket[]>([]);

  useEffect(() => {
    return stalRouter.onStatusChange(setTransportStatus);
  }, []);

  // Simulated live traffic sniffer
  useEffect(() => {
    const interval = setInterval(() => {
      const activeTier = stalRouter.getActiveTier();
      const packet: SniffedPacket = {
        id: `PKT-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
        time: new Date().toLocaleTimeString(),
        tier: activeTier,
        direction: Math.random() > 0.4 ? 'INBOUND' : 'OUTBOUND',
        bytes: Math.floor(Math.random() * 256) + 32,
        info: activeTier === 'TIER_0_LAN' ? 'AES-GCM STOMP Vector/Chat Frame' :
              activeTier === 'TIER_1_RAIL' ? 'L2 Ethernet Frame CSMT-KSRA Optical Pipe' :
              activeTier === 'TIER_2_NFS' ? 'TSEC/SAG ASCON Phase IV Encapsulation' :
              activeTier === 'TIER_3_BEL_HF' ? 'STANAG 5066 CRC-32 1200 Baud AFSK Audio' :
              'ISRO NavIC 256B Binary Telemetry Burst Frame'
      };

      setSniffedPackets(prev => [packet, ...prev.slice(0, 19)]);
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  const handleTierChange = (tier: TransportTier | 'AUTO') => {
    setSelectedTierOverride(tier);
    const targetTier = tier === 'AUTO' ? null : tier;
    stalRouter.setTierOverride(targetTier);

    // Broadcast transport switch to all mesh nodes
    if (stompClient?.connected) {
      stompClient.publish({
        destination: '/app/admin.transport',
        body: JSON.stringify({
          tier: targetTier || 'TIER_0_LAN',
          badge: stalRouter.getTransportStatus().badge
        })
      });
    }
  };

  const handleKickPeer = (clientId: string) => {
    if (!clientId) return;
    if (stompClient?.connected) {
      stompClient.publish({
        destination: '/app/admin.kick',
        body: JSON.stringify({ targetClientId: clientId })
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-xl glass-surface-modal border-l border-amber-500/15 flex flex-col font-tactical">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-amber-500/12 bg-gradient-to-b from-amber-500/[0.03] to-transparent">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/15 flex items-center justify-center">
            <Terminal className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <span className="text-sm font-bold tracking-[0.12em] text-neutral-200 uppercase block">
              DEV SENTRY
            </span>
            <div className="text-[9px] text-amber-400/70">AUTHORITATIVE RBAC • MASTER NODE</div>
          </div>
        </div>
        <button 
          onClick={onClose} 
          className="p-1.5 text-neutral-500 hover:text-white rounded-md hover:bg-white/5 transition-all duration-150"
          aria-label="Close Dev Sentry"
        >
          <X className="w-4.5 h-4.5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Controls & Ghost Mode */}
        <div className="bg-white/[0.02] border border-amber-500/10 rounded-xl p-4">
          <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Cpu className="w-3.5 h-3.5 text-indigo-400/80" /> Host Controls & Ghost Mode
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={onToggleGhostMode}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all duration-200 ${
                isGhostMode 
                  ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' 
                  : 'bg-white/[0.04] text-neutral-400 hover:text-white border border-white/[0.06] hover:border-amber-500/30 hover:bg-amber-500/[0.06]'
              }`}
              aria-label={isGhostMode ? "Disable Ghost Mode" : "Enable Ghost Mode"}
            >
              {isGhostMode ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              {isGhostMode ? 'GHOST MODE ACTIVE' : 'ENABLE GHOST MODE'}
            </button>

            <div className="flex items-center gap-1.5 bg-white/[0.03] px-2.5 py-1.5 rounded-lg text-xs border border-white/[0.05]">
              <span className="text-neutral-600">LINK:</span>
              <span className="text-emerald-400/80 font-bold">{transportStatus.badge}</span>
            </div>
          </div>

          {/* Transport Routing Failover Selector */}
          <div className="mt-4 pt-3 border-t border-amber-500/8">
            <div className="text-[10px] text-neutral-500 mb-2">AUTHORITATIVE TRANSPORT OVERRIDE:</div>
            <div className="grid grid-cols-3 gap-1.5 text-[9px]">
              {[
                { id: 'AUTO', label: 'AUTO (Failover)' },
                { id: 'TIER_0_LAN', label: 'T0: LAN Mesh' },
                { id: 'TIER_1_RAIL', label: 'T1: RailTel OFC' },
                { id: 'TIER_2_NFS', label: 'T2: Defense NFS' },
                { id: 'TIER_3_BEL_HF', label: 'T3: BEL-HF Radio' },
                { id: 'TIER_4_NAVIC', label: 'T4: ISRO NavIC' }
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => handleTierChange(t.id as any)}
                  className={`p-2 rounded-lg border transition-all duration-150 truncate text-left ${
                    selectedTierOverride === t.id 
                      ? 'bg-indigo-500/15 border-indigo-500/30 text-indigo-300 font-bold' 
                      : 'bg-white/[0.02] border-white/[0.05] text-neutral-500 hover:text-neutral-300 hover:bg-white/[0.04]'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Peer Moderation & Mesh Topology */}
        <div className="bg-white/[0.02] border border-emerald-500/10 rounded-xl p-4">
          <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-3 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-emerald-400/80" /> Mesh Nodes ({users.length})
            </span>
            <span className="text-[9px] text-neutral-600 normal-case">Peer Moderation</span>
          </div>

          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {users.map((u, i) => (
              <div key={u.clientId || i} className="bg-white/[0.02] border border-white/[0.04] rounded-lg p-2.5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  {u.deviceType === 'MOBILE' 
                    ? <Smartphone className="w-3.5 h-3.5 text-cyan-400/60" />
                    : <Laptop className="w-3.5 h-3.5 text-emerald-400/60" />
                  }
                  <div>
                    <div className="font-semibold text-neutral-300">{u.displayName || u.clientId}</div>
                    <div className="text-[9px] text-neutral-600 mt-0.5">ID: {u.clientId} • {u.deviceType || 'DESKTOP'}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] text-emerald-400/70 bg-emerald-500/[0.06] border border-emerald-500/15 px-2 py-0.5 rounded">
                    ONLINE
                  </span>
                  <button
                    onClick={() => handleKickPeer(u.clientId)}
                    className="p-1.5 bg-red-500/[0.06] hover:bg-red-500/15 border border-red-500/15 hover:border-red-500/25 text-red-400/70 hover:text-red-300 rounded-lg text-[9px] flex items-center gap-1 transition-all duration-150"
                    title="Kick Peer from Mesh"
                    aria-label={`Kick ${u.displayName || u.clientId}`}
                  >
                    <UserX className="w-3 h-3" /> Kick
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Raw Packet Sniffer */}
        <div className="bg-white/[0.02] border border-cyan-500/10 rounded-xl p-4">
          <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Radio className="w-3.5 h-3.5 text-cyan-400/80" /> Live Packet Sniffer
          </div>

          <div className="space-y-1 max-h-56 overflow-y-auto text-[10px]">
            {sniffedPackets.map(pkt => (
              <div key={pkt.id} className="bg-black/20 border border-white/[0.03] rounded-lg p-2 flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-neutral-600">{pkt.time}</span>
                    <span className={`font-bold ${pkt.direction === 'INBOUND' ? 'text-emerald-400/70' : 'text-indigo-400/70'}`}>
                      [{pkt.direction}]
                    </span>
                    <span className="text-cyan-400/60 font-bold">{pkt.tier}</span>
                  </div>
                  <div className="text-neutral-500 text-[9px] mt-0.5">{pkt.info}</div>
                </div>
                <span className="text-neutral-600 text-[9px] font-bold shrink-0 ml-2">{pkt.bytes}B</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
