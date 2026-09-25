import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Route, Switch, useLocation } from 'wouter';
import { Menu, PenTool, CheckCircle, Gamepad2, Terminal, Eye, EyeOff, Shield, Lock } from 'lucide-react';

import { useWebSocket } from './hooks/useWebSocket';
import UserList from './components/UserList';
import InputBar from './components/InputBar';
import LandingPage from './components/LandingPage';
import { Button } from './components/ui/button';
import { Message } from './components/ui/message';

import { pttAudioService } from './services/PTTAudioService';
import { identityService, OperatorIdentity } from './services/IdentityService';
import { AirGapDiode } from './components/ui/AirGapDiode';
import { TacticalGameModal } from './components/ui/TacticalGameModal';
import { TacticalBoardModal } from './components/TacticalBoardModal';
import { IdentityModal } from './components/IdentityModal';
import { DevSentryConsole } from './components/DevSentryConsole';
import { LightboxModal } from './components/ui/LightboxModal';
import { stalRouter, TransportStatus } from './services/transports/STALRouter';
import FavoritesHUD from './components/FavoritesHUD';
import { tacticalSoundFx } from './services/TacticalSoundFx';
import ConfettiBackground from './components/ui/confetti-background';

const messageVariants = {
  initial: { opacity: 0, y: 10, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, scale: 0.96 },
};

function ChatApp() {
  const [password, setPassword] = useState('defense-grid-apex');
  const [hasJoined, setHasJoined] = useState(false);
  const [passwordInput, setPasswordInput] = useState('defense-grid-apex');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Identity & Role Based Access Control (RBAC)
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showIdentityEdit, setShowIdentityEdit] = useState(false);
  const [identity, setIdentity] = useState<OperatorIdentity | null>(null);

  // Authoritative Host Identification
  const isHostNode = typeof window !== 'undefined' && 
    (window.location.hostname === 'localhost' || 
     window.location.hostname === '127.0.0.1' ||
     sessionStorage.getItem('apex_host_token') === 'APEX_MASTER_SEED');

  // Tactical Modals & Overlays
  const [isRecording, setIsRecording] = useState(false);
  const [showBoard, setShowBoard] = useState(false);
  const [showAirGap, setShowAirGap] = useState(false);
  const [showGameModal, setShowGameModal] = useState(false);
  const [showDevSentry, setShowDevSentry] = useState(false);
  const [selectedImageSrc, setSelectedImageSrc] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<any | null>(null);
  const [transportStatus, setTransportStatus] = useState<TransportStatus>(stalRouter.getTransportStatus());

  const {
    messages,
    users,
    connected,
    myClientId,
    sendMessage,
    sendImage,
    stompClient,
    isGhostMode,
    setIsGhostMode
  } = useWebSocket(password);

  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    return stalRouter.onStatusChange(setTransportStatus);
  }, []);

  useEffect(() => {
    identityService.initialize().then(id => {
      if (id && identityService.hasCompletedOnboarding()) {
        setIdentity(id);
      } else {
        setShowOnboarding(true);
      }
    });
  }, []);

  useEffect(() => {
    if (bottomRef.current) {
      const container = bottomRef.current.closest('.overflow-y-auto');
      if (container) {
        container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
      } else {
        bottomRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
    if (messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg.senderClientId !== myClientId && lastMsg.sender !== identity?.fullName) {
        if (typeof lastMsg.content === 'string' && (lastMsg.content.includes('RED ALERT') || lastMsg.content.includes('SOS'))) {
          tacticalSoundFx.playSirenAlert();
        } else {
          tacticalSoundFx.playTacticalChime();
        }
      }
    }
  }, [messages, myClientId, identity?.fullName]);

  // PTT Handlers
  const handlePttStart = async () => {
    const success = await pttAudioService.startRecording();
    if (success) setIsRecording(true);
  };

  const handlePttStop = async () => {
    setIsRecording(false);
    await pttAudioService.stopRecording();
  };

  const handleVerifyLedger = async () => {
    try {
      const res = await fetch('/api/audit/verify');
      const data = await res.json();
      if (res.ok) alert(`Ledger Verified: ${data.message}`);
      else alert(`Verification Failed: ${data.message}`);
    } catch (e) {
      alert("Ledger verify request error.");
    }
  };

  const handleOnboardingComplete = (newIdentity: OperatorIdentity) => {
    setIdentity(newIdentity);
    setShowOnboarding(false);
  };

  if (!hasJoined) {
    return (
      <div className="mercury-wrapper">
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;800&family=Space+Mono&display=swap');

          :root {
            --bg: #050505;
            --mercury: #e0e0e0;
            --mercury-dark: #666666;
            --accent: #ffffff;
            --text-dim: rgba(255, 255, 255, 0.5);
            --filter-goo: url('#gooey');
          }

          .mercury-wrapper {
            background-color: transparent;
            color: var(--accent);
            font-family: 'Inter', sans-serif;
            height: 100dvh;
            width: 100vw;
            overflow: hidden;
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
          }

          .mercury-wrapper * {
            box-sizing: border-box;
            -webkit-font-smoothing: antialiased;
          }

          .stage {
            position: absolute;
            width: 100%;
            height: 100%;
            z-index: 0;
            filter: var(--filter-goo);
            opacity: 0.6;
          }

          .blob {
            position: absolute;
            background: linear-gradient(135deg, var(--mercury), #888);
            border-radius: 50%;
            filter: blur(20px);
            animation: float 20s infinite alternate ease-in-out;
            box-shadow: inset -10px -10px 20px rgba(0,0,0,0.5),
                        10px 10px 30px rgba(255,255,255,0.2);
            transition: margin 0.1s ease-out;
          }

          @keyframes float {
            0% { transform: translate(0, 0) scale(1); }
            33% { transform: translate(10vw, 20vh) scale(1.2); }
            66% { transform: translate(-5vw, 10vh) scale(0.8); }
            100% { transform: translate(5vw, -10vh) scale(1.1); }
          }

          .auth-container {
            position: relative;
            z-index: 10;
            width: 100%;
            max-width: 440px;
            padding: 40px;
          }

          .mercury-header {
            margin-bottom: 60px;
            text-align: left;
          }

          .brand-id {
            font-family: 'Space Mono', monospace;
            font-size: 10px;
            letter-spacing: 4px;
            text-transform: uppercase;
            color: var(--text-dim);
            margin-bottom: 8px;
            display: block;
          }

          .mercury-header h1 {
            font-weight: 800;
            font-size: 3rem;
            line-height: 0.9;
            letter-spacing: -2px;
            margin-left: -4px;
            margin-top: 0;
          }

          .mercury-header p.subtitle {
            font-family: 'Space Mono', monospace;
            font-size: 11px;
            color: var(--text-dim);
            margin-top: 12px;
            letter-spacing: 1px;
          }

          .form-group {
            position: relative;
            margin-bottom: 30px;
            transition: transform 0.4s cubic-bezier(0.2, 1, 0.3, 1);
          }

          .form-group:focus-within {
            transform: translateX(10px);
          }

          .form-group label {
            display: block;
            font-family: 'Space Mono', monospace;
            font-size: 11px;
            color: var(--text-dim);
            margin-bottom: 12px;
            text-transform: uppercase;
          }

          .form-group input {
            width: 100%;
            background: transparent !important;
            border: none !important;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
            border-radius: 0 !important;
            color: var(--accent) !important;
            padding: 12px 0;
            font-size: 18px;
            outline: none !important;
            transition: border-color 0.4s;
            font-family: 'Inter', sans-serif;
          }

          .form-group input:focus {
            border-color: rgba(255, 255, 255, 0.1) !important;
            box-shadow: none !important;
          }

          .input-glow {
            position: absolute;
            bottom: 0;
            left: 0;
            width: 0%;
            height: 2px;
            background: var(--mercury);
            transition: width 0.6s cubic-bezier(0.2, 1, 0.3, 1);
            box-shadow: 0 0 15px var(--mercury);
          }

          .form-group input:focus + .input-glow {
            width: 100%;
          }

          .submit-wrap {
            margin-top: 50px;
            position: relative;
            filter: var(--filter-goo);
          }

          .btn-base {
            background: var(--accent);
            color: #000;
            border: none;
            padding: 20px 40px;
            font-size: 14px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 2px;
            cursor: pointer;
            width: 100%;
            position: relative;
            z-index: 2;
            transition: letter-spacing 0.3s;
            font-family: 'Inter', sans-serif;
          }

          .btn-base:hover {
            letter-spacing: 4px;
          }

          .mercury-drop {
            position: absolute;
            top: 50%;
            left: 50%;
            width: 100%;
            height: 100%;
            background: var(--mercury);
            transform: translate(-50%, -50%);
            z-index: 1;
            border-radius: 50px;
            transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          }

          .submit-wrap:hover .mercury-drop {
            transform: translate(-50%, -50%) scale(1.05, 1.2);
            filter: brightness(1.2);
          }

          .footer-nav {
            margin-top: 40px;
            display: flex;
            justify-content: space-between;
            font-family: 'Space Mono', monospace;
            font-size: 10px;
          }

          .footer-nav a {
            color: var(--text-dim);
            text-decoration: none;
            transition: color 0.3s;
          }

          .footer-nav a:hover {
            color: var(--accent);
          }

          .svg-filter-hidden {
            position: absolute;
            width: 0;
            height: 0;
          }

          @media (max-width: 480px) {
            .auth-container {
              padding: 24px;
            }
            .mercury-header h1 {
              font-size: 2.2rem;
            }
          }
        `}</style>

        <main className="auth-container">
          <div className="mercury-header">
            <span className="brand-id">
              {isHostNode ? 'System Node: 0x992 \u2014 Host' : 'System Node: 0x992 \u2014 Field'}
            </span>
            <h1>
              LANCHAT<br />APEX
            </h1>
            <p className="subtitle">
              {isHostNode ? 'MASTER HOST NODE INITIALIZATION' : 'FIELD MEMBER NODE INITIALIZATION'}
            </p>
          </div>

          <form
            autoComplete="off"
            onSubmit={(e) => {
              e.preventDefault();
              setPassword(passwordInput);
              setHasJoined(true);
            }}
          >
            <div className="form-group">
              <label>Channel Passphrase / Grid Key</label>
              <input
                type="password"
                value={passwordInput}
                onChange={e => setPasswordInput(e.target.value)}
                placeholder="Enter passphrase"
                autoFocus
                required
              />
              <div className="input-glow"></div>
            </div>

            <div className="submit-wrap">
              <div className="mercury-drop"></div>
              <button type="submit" className="btn-base">
                Authenticate Grid Node
              </button>
            </div>
          </form>

          <footer className="footer-nav">
            <a href="#encrypted">ENCRYPTED RECOVERY</a>
            <a href="#archive">NEW ARCHIVE</a>
          </footer>
        </main>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col h-[100dvh] w-full bg-transparent text-[#e5f4ee] overflow-hidden z-10">
      {/* Compulsory Onboarding Modal */}
      <IdentityModal
        isOpen={showOnboarding}
        onComplete={handleOnboardingComplete}
      />

      {/* Callsign / Rename Modal */}
      <IdentityModal
        isOpen={showIdentityEdit}
        allowEditMode={true}
        onComplete={handleOnboardingComplete}
        onClose={() => setShowIdentityEdit(false)}
      />

      {/* Synchronized Tactical Whiteboard */}
      <TacticalBoardModal
        isOpen={showBoard}
        onClose={() => setShowBoard(false)}
        stompClient={stompClient}
        localId={myClientId || 'local'}
      />

      {/* Tactical Mini-Games (Radar Strike) */}
      <TacticalGameModal
        isOpen={showGameModal}
        onClose={() => setShowGameModal(false)}
        stompClient={stompClient}
        localId={myClientId || 'local'}
        users={users}
      />

      {/* Lightbox Modal for Image Previews */}
      <LightboxModal
        isOpen={!!selectedImageSrc}
        imageSrc={selectedImageSrc}
        onClose={() => setSelectedImageSrc(null)}
      />

      {/* Host-Exclusive Dev Sentry Console Drawer (RBAC: Only rendered for HOST) */}
      {isHostNode && (
        <DevSentryConsole
          isOpen={showDevSentry}
          onClose={() => setShowDevSentry(false)}
          users={users}
          isGhostMode={isGhostMode}
          onToggleGhostMode={() => setIsGhostMode(!isGhostMode)}
          stompClient={stompClient}
        />
      )}

      {/* Multi-Transport Favorites HUD */}
      <FavoritesHUD />

      {/* ═══ TOP HEADER BAR ═══ */}
      <header className="flex items-center justify-between px-3 md:px-5 py-2 glass-surface-elevated header-glow shrink-0 z-20 sticky top-0 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          {/* Mobile hamburger */}
          <button
            className="md:hidden p-1.5 text-neutral-400 hover:text-white rounded-md border border-neutral-700/60 hover:border-white/30 hover:bg-white/5 transition-all duration-150"
            onClick={() => setIsSidebarOpen(true)}
            aria-label="Open sidebar"
          >
            <Menu className="w-4.5 h-4.5" />
          </button>

          {/* Brand Identity */}
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex w-7 h-7 rounded-md bg-white/5 border border-white/20 items-center justify-center">
              <Shield className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-extrabold tracking-[0.15em] text-white uppercase font-tactical">
                LANCHAT APEX
              </span>
              <span className={`hidden sm:inline text-[9px] px-2 py-0.5 rounded font-bold tracking-wider font-tactical ${
                isHostNode 
                  ? 'bg-white/10 border border-white/30 text-white' 
                  : 'bg-neutral-800/50 border border-neutral-600/50 text-neutral-300'
              }`}>
                {isHostNode ? 'MASTER HOST' : 'FIELD NODE'}
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            className="group text-neutral-400 hover:text-black text-xs h-8 px-2 rounded-md border border-transparent hover:border-white hover:bg-white transition-all duration-150 font-tactical"
            onClick={() => setShowBoard(true)}
            aria-label="Open Tactical Board"
          >
            <PenTool className="w-3.5 h-3.5 mr-1 group-hover:text-black" /> 
            <span className="hidden lg:inline">Board</span>
          </Button>

          <Button
            size="sm"
            variant="ghost"
            className="group text-neutral-400 hover:text-black text-xs h-8 px-2 rounded-md border border-transparent hover:border-white hover:bg-white transition-all duration-150 font-tactical"
            onClick={() => setShowGameModal(true)}
            aria-label="Open Games"
          >
            <Gamepad2 className="w-3.5 h-3.5 mr-1 group-hover:text-black" /> 
            <span className="hidden lg:inline">Games</span>
          </Button>

          {/* Operational Stealth Toggle Button */}
          <Button
            size="sm"
            variant="ghost"
            className={`group text-xs h-8 px-2 rounded-md transition-all duration-150 font-tactical ${
              identity?.isStealthActive 
                ? 'bg-white text-black shadow-[0_0_8px_rgba(255,255,255,0.4)]' 
                : 'text-neutral-400 hover:text-black border border-transparent hover:border-white hover:bg-white'
            }`}
            onClick={() => {
              identityService.toggleStealthMode();
              setIdentity(identityService.getSafeState());
            }}
            title={identity?.isStealthActive ? "Stealth Active: Real name hidden" : "Toggle Operational Stealth Mode"}
            aria-label={identity?.isStealthActive ? "Disable Stealth Mode" : "Enable Stealth Mode"}
          >
            {identity?.isStealthActive ? <EyeOff className="w-3.5 h-3.5 mr-1 text-black" /> : <Eye className="w-3.5 h-3.5 mr-1 group-hover:text-black" />}
            <span className="hidden lg:inline">{identity?.isStealthActive ? 'STEALTH' : 'Stealth'}</span>
          </Button>

          <Button
            size="sm"
            variant="ghost"
            className="group text-neutral-400 hover:text-black text-xs h-8 px-2 hidden sm:flex rounded-md border border-transparent hover:border-white hover:bg-white transition-all duration-150 font-tactical"
            onClick={handleVerifyLedger}
            aria-label="Verify Audit Ledger"
          >
            <CheckCircle className="w-3.5 h-3.5 mr-1 group-hover:text-black" /> 
            <span className="hidden lg:inline">Audit</span>
          </Button>

          {/* RBAC: Dev Sentry Button Rendered EXCLUSIVELY for Host Node */}
          {isHostNode && (
            <Button
              size="sm"
              variant="ghost"
              className="group bg-transparent text-white hover:bg-white hover:text-black text-xs h-8 px-2 border border-white/20 hover:border-white rounded-md transition-all duration-150 font-tactical"
              onClick={() => setShowDevSentry(true)}
              aria-label="Open Dev Sentry Console"
            >
              <Terminal className="w-3.5 h-3.5 mr-1 group-hover:text-black" /> 
              <span className="hidden lg:inline">Sentry</span>
            </Button>
          )}

          {/* Connection Status Indicator */}
          <div className="flex items-center gap-1.5 ml-1.5 pl-2 border-l border-white/10">
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/5 border border-white/10">
              <span className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-white online-pulse' : 'bg-neutral-500 animate-pulse'}`} />
              <span className="text-[10px] font-bold tracking-wider font-tactical hidden md:inline text-white">
                {connected ? 'ONLINE' : 'RECONNECTING'}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* ═══ MAIN WORKSPACE ═══ */}
      <div className="flex flex-1 overflow-hidden w-full relative">
        <UserList
          users={users}
          myClientId={myClientId || undefined}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          onOpenIdentityModal={() => setShowIdentityEdit(true)}
        />

        {/* Chat Area */}
        <section className="flex flex-col flex-1 overflow-hidden relative bg-transparent">
          {/* AirGap Modal */}
          {showAirGap && (
            <div className="absolute inset-0 z-40 bg-black/90 backdrop-blur-md p-4 flex flex-col items-center justify-center">
              <div className="w-full max-w-md">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-white font-bold tracking-widest text-sm uppercase font-tactical">Air-Gap Data Diode</span>
                  <Button variant="ghost" size="sm" onClick={() => setShowAirGap(false)}>Close</Button>
                </div>
                <AirGapDiode />
              </div>
            </div>
          )}

          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 scroll-smooth w-full">
            {messages.length === 0 && (
              <div className="flex h-full items-center justify-center text-center">
                <div className="flex flex-col items-center gap-4">
                  {/* Secure channel icon */}
                  <div className="relative">
                    <div className="w-16 h-16 rounded-2xl bg-black border border-white/20 flex items-center justify-center shadow-[0_0_15px_rgba(255,255,255,0.05)]">
                      <Lock className="w-7 h-7 text-white" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)] secure-pulse" />
                  </div>
                  <div className="space-y-1.5">
                    <div className="text-xs font-extrabold text-white tracking-[0.2em] uppercase font-tactical">
                      Secure Channel Active
                    </div>
                    <div className="text-[10px] text-neutral-500 tracking-[0.15em] font-tactical scanline-text">
                      READY FOR ENCRYPTED TRANSMISSION
                    </div>
                  </div>
                  {/* Subtle grid lines */}
                  <div className="w-32 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                </div>
              </div>
            )}

            <div className="space-y-2.5 max-w-4xl mx-auto flex flex-col w-full pb-4">
              <AnimatePresence mode="popLayout">
                {messages.map((msg: any, index: number) => {
                  const isUser = msg.senderClientId === myClientId || msg.sender === identity?.fullName;
                  return (
                    <motion.div
                      key={msg.id || index}
                      variants={messageVariants}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                      transition={{ duration: 0.15 }}
                      className="w-full"
                    >
                      <Message
                        id={msg.id}
                        from={isUser ? 'user' : 'assistant'}
                        content={msg.content}
                        senderName={msg.displayName || msg.sender || 'Operator'}
                        senderTag={msg.deviceTag || msg.tag || '#0000'}
                        timestamp={msg.timestamp}
                        type={msg.type}
                        audioData={msg.audioData}
                        durationSec={msg.durationSec}
                        replyTo={msg.replyTo}
                        pending={msg.pending}
                        onReply={() => setReplyingTo(msg)}
                        onOpenImage={(src) => setSelectedImageSrc(src)}
                      />
                    </motion.div>
                  );
                })}
              </AnimatePresence>
              <div ref={bottomRef} />
            </div>
          </div>

          {/* Input Bar & Contextual Reply Preview */}
          <div className="px-3 md:px-4 py-3 glass-surface border-t border-emerald-500/10 z-10 w-full flex flex-col items-center">
            <AnimatePresence>
              {replyingTo && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                  className="w-full max-w-4xl mb-2 flex justify-between items-center bg-indigo-950/30 border border-indigo-800/40 rounded-lg px-3 py-2 text-xs font-tactical"
                >
                  <span className="text-indigo-300 truncate">
                    Replying to [{replyingTo.displayName || replyingTo.sender || 'Operator'}]: '{replyingTo.content?.substring(0, 40)}...'
                  </span>
                  <button 
                    onClick={() => setReplyingTo(null)} 
                    className="text-indigo-400 hover:text-white ml-2 shrink-0 p-1 rounded hover:bg-indigo-500/10 transition-colors"
                    aria-label="Cancel reply"
                  >
                    ✕
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="max-w-4xl mx-auto w-full">
              <InputBar
                onSend={(msg) => {
                  sendMessage(msg, replyingTo);
                  setReplyingTo(null);
                }}
                onSendImage={(base64) => {
                  sendImage(base64, replyingTo);
                  setReplyingTo(null);
                }}
                onPttStart={handlePttStart}
                onPttStop={handlePttStop}
                isRecording={isRecording}
                activeTier={transportStatus.tier}
                disabled={!connected}
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

const HomeRoute = () => {
  const [, setLocation] = useLocation();
  const handleJoin = React.useCallback(() => setLocation('/chat'), [setLocation]);
  return (
    <div className="flex-1 min-h-0 overflow-y-auto w-full">
      <LandingPage onJoin={handleJoin} />
    </div>
  );
};

const MercuryBackground = () => {
  const blobsData = useMemo(() => {
    return Array.from({ length: 6 }).map(() => ({
      size: Math.random() * 200 + 150,
      left: Math.random() * 80 + 10,
      top: Math.random() * 80 + 10,
      animationDelay: Math.random() * -20,
      animationDuration: Math.random() * 15 + 15,
    }));
  }, []);

  const blobRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = e.clientX / window.innerWidth;
      const y = e.clientY / window.innerHeight;
      blobRefs.current.forEach((blob, index) => {
        if (blob) {
          const speed = (index + 1) * 20;
          blob.style.marginLeft = `${x * speed}px`;
          blob.style.marginTop = `${y * speed}px`;
        }
      });
    };
    document.addEventListener('mousemove', handleMouseMove);
    return () => document.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <>
      <svg className="svg-filter-hidden">
        <defs>
          <filter id="gooey">
            <feGaussianBlur in="SourceGraphic" stdDeviation="12" result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -9"
              result="goo"
            />
            <feComposite in="SourceGraphic" in2="goo" operator="atop" />
          </filter>
        </defs>
      </svg>
      <div className="stage" id="stage">
        {blobsData.map((data, index) => (
          <div
            key={index}
            ref={(el) => { blobRefs.current[index] = el; }}
            className="blob"
            style={{
              width: `${data.size}px`,
              height: `${data.size}px`,
              left: `${data.left}%`,
              top: `${data.top}%`,
              animationDelay: `${data.animationDelay}s`,
              animationDuration: `${data.animationDuration}s`,
            }}
          />
        ))}
      </div>
    </>
  );
};

export default function App() {
  return (
    <div className="relative flex flex-col h-[100dvh] w-full bg-black overflow-hidden">
      {/* ═══ UNIFIED MERCURY BUBBLE BACKGROUND ═══ */}
      <MercuryBackground />
      <Switch>
        <Route path="/" component={HomeRoute} />
        <Route path="/chat" component={ChatApp} />
        <Route component={HomeRoute} />
      </Switch>
    </div>
  );
}
