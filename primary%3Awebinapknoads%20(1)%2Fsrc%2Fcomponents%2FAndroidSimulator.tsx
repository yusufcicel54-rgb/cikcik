import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Wifi,
  Battery,
  Signal,
  ArrowLeft,
  RotateCw,
  Home,
  Square,
  Play,
  ShieldCheck,
  ShieldAlert,
  Terminal,
  ExternalLink,
  Plus,
  RefreshCw,
  Search
} from "lucide-react";
import { AppConfig, BlockedAdLog } from "../types";

interface AndroidSimulatorProps {
  config: AppConfig;
  onBlockAd?: (log: BlockedAdLog) => void;
  blockedLogs: BlockedAdLog[];
}

export default function AndroidSimulator({
  config,
  blockedLogs,
  onBlockAd
}: AndroidSimulatorProps) {
  const [appState, setAppState] = useState<"launcher" | "splash" | "active">("launcher");
  const [currentTime, setCurrentTime] = useState("12:00");
  const [activeUrl, setActiveUrl] = useState(config.url);
  const [previewMode, setPreviewMode] = useState<"simulated" | "real">("simulated");
  const [iframeError, setIframeError] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isAdBlockerGlowing, setIsAdBlockerGlowing] = useState(false);

  // Sync active URL when config URL changes
  useEffect(() => {
    setActiveUrl(config.url);
    setIframeError(false);
  }, [config.url]);

  // Update clock time in real-time
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      let hours = now.getHours().toString().padStart(2, "0");
      let minutes = now.getMinutes().toString().padStart(2, "0");
      setCurrentTime(`${hours}:${minutes}`);
    };
    updateClock();
    const interval = setInterval(updateClock, 10000);
    return () => clearInterval(interval);
  }, []);

  // Handle mock launch sequence
  const launchApp = () => {
    setAppState("splash");
    setTimeout(() => {
      setAppState("active");
    }, 1800); // 1.8s splash screen
  };

  const closeApp = () => {
    setAppState("launcher");
  };

  // Simulate an ad attempt being blocked dynamically
  const triggerMockAdBlocking = () => {
    if (!config.options.enableAdBlocker) return;

    const mockAdDomains = [
      { url: "https://googleads.g.doubleclick.net/pagead/ads?client=ca-pub-1293...", type: "banner" as const },
      { url: "https://adservice.google.com/adsid/google/ui", type: "tracker" as const },
      { url: "https://www.popads.net/serve/popunder.js?id=38291", type: "popunder" as const },
      { url: "https://static.adnxs.com/adbag/creative/300x250.mp4", type: "video" as const },
      { url: "https://secure.pubmatic.com/ad/server/request", type: "tracker" as const }
    ];

    const randomAd = mockAdDomains[Math.floor(Math.random() * mockAdDomains.length)];
    const newLog: BlockedAdLog = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toLocaleTimeString(),
      url: randomAd.url,
      type: randomAd.type
    };

    if (onBlockAd) {
      onBlockAd(newLog);
    }

    setIsAdBlockerGlowing(true);
    setTimeout(() => setIsAdBlockerGlowing(false), 800);
  };

  // Trigger automatically when web view becomes active
  useEffect(() => {
    if (appState === "active" && config.options.enableAdBlocker) {
      const timer = setTimeout(() => {
        triggerMockAdBlocking();
      }, 1500);
      const timer2 = setTimeout(() => {
        triggerMockAdBlocking();
      }, 4000);
      return () => {
        clearTimeout(timer);
        clearTimeout(timer2);
      };
    }
  }, [appState, config.options.enableAdBlocker]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      triggerMockAdBlocking();
    }, 1000);
  };

  return (
    <div id="android-simulator-container" className="flex flex-col items-center">
      {/* Phone Outer Shell */}
      <div
        id="phone-outer-shell"
        className="relative w-[340px] h-[680px] bg-slate-900 rounded-[50px] border-4 border-slate-800 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7)] p-3 overflow-hidden flex flex-col select-none ring-12 ring-slate-950/20"
      >
        {/* Dynamic Island / Camera Notch */}
        <div
          id="phone-camera-notch"
          className="absolute top-4 left-1/2 -translate-x-1/2 w-28 h-5 bg-black rounded-full z-50 flex items-center justify-center"
        >
          <div className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-slate-800 ml-auto mr-3"></div>
        </div>

        {/* Physical Buttons on Left/Right */}
        <div className="absolute top-24 -right-[4px] w-[3px] h-12 bg-slate-800 rounded-l-md"></div>
        <div className="absolute top-40 -right-[4px] w-[3px] h-20 bg-slate-800 rounded-l-md"></div>

        {/* Screen Area (Glass container) */}
        <div
          id="phone-screen"
          className="relative w-full h-full bg-black rounded-[38px] overflow-hidden flex flex-col"
        >
          {/* Status Bar */}
          {!config.options.fullscreen || appState !== "active" ? (
            <div
              id="phone-status-bar"
              className="h-8 px-5 pt-1.5 flex justify-between items-center bg-black/40 text-white text-xs font-medium z-40 relative select-none"
            >
              <span>{currentTime}</span>
              <div className="flex items-center gap-1.5">
                <Signal size={12} className="opacity-85" />
                <Wifi size={12} className="opacity-85" />
                <div className="flex items-center gap-0.5">
                  <span className="text-[9px] opacity-75">98%</span>
                  <Battery size={14} className="opacity-85" />
                </div>
              </div>
            </div>
          ) : null}

          {/* Core Screen Content Area */}
          <div className="flex-1 w-full relative overflow-hidden bg-slate-950">
            <AnimatePresence mode="wait">
              {/* LAUNCHER STATE */}
              {appState === "launcher" && (
                <motion.div
                  key="launcher"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 flex flex-col justify-between p-6 pb-2"
                  style={{
                    background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #311042 100%)",
                  }}
                >
                  {/* Launcher Time / Date Widget */}
                  <div className="text-center mt-8">
                    <span className="text-4xl font-light text-white tracking-wide">
                      {currentTime}
                    </span>
                    <p className="text-slate-300 text-xs mt-1.5 font-medium uppercase tracking-widest">
                      {new Date().toLocaleDateString("tr-TR", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                      })}
                    </p>
                  </div>

                  {/* Launcher App Icon Grid */}
                  <div className="grid grid-cols-4 gap-y-6 gap-x-2 px-1 mb-16">
                    {/* Native App 1 */}
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-green-500 to-emerald-400 p-2.5 flex items-center justify-center shadow-md">
                        <svg className="w-full h-full text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                      </div>
                      <span className="text-[10px] text-slate-300 mt-1 font-medium text-center truncate w-full">Telefon</span>
                    </div>

                    {/* Native App 2 */}
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-500 to-blue-400 p-2.5 flex items-center justify-center shadow-md">
                        <svg className="w-full h-full text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                      </div>
                      <span className="text-[10px] text-slate-300 mt-1 font-medium text-center truncate w-full">Mesajlar</span>
                    </div>

                    {/* USER'S CUSTOM WEB APP (Highlighted) */}
                    <div className="flex flex-col items-center col-span-2 select-none">
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={launchApp}
                        className="cursor-pointer relative flex flex-col items-center"
                      >
                        {/* Glow indicator */}
                        <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-4 w-4 bg-blue-500 text-[8px] font-bold text-white items-center justify-center">1</span>
                        </span>

                        <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-700 p-1 flex items-center justify-center shadow-lg overflow-hidden ring-2 ring-blue-500/50">
                          {config.icon ? (
                            config.icon.startsWith("<svg") ? (
                              <div
                                className="w-full h-full flex items-center justify-center"
                                dangerouslySetInnerHTML={{ __html: config.icon }}
                              />
                            ) : (
                              <img src={config.icon} alt="App Icon" className="w-full h-full object-cover rounded-xl" referrerPolicy="no-referrer" />
                            )
                          ) : (
                            <div className="w-full h-full bg-blue-600 rounded-xl flex items-center justify-center text-white text-lg font-bold">
                              {config.name ? config.name.charAt(0).toUpperCase() : "W"}
                            </div>
                          )}
                        </div>
                        <span className="text-[11px] text-white font-bold mt-1.5 text-center w-28 truncate drop-shadow-md">
                          {config.name || "Uygulamam"}
                        </span>
                        <span className="text-[8px] text-blue-300 font-semibold tracking-wider uppercase mt-0.5">Yükle/Başlat</span>
                      </motion.div>
                    </div>

                    {/* Native App 3 */}
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-400 p-2.5 flex items-center justify-center shadow-md">
                        <svg className="w-full h-full text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <span className="text-[10px] text-slate-300 mt-1 font-medium text-center truncate w-full">Kamera</span>
                    </div>

                    {/* Native App 4 */}
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-red-500 to-pink-500 p-2.5 flex items-center justify-center shadow-md">
                        <svg className="w-full h-full text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                      </div>
                      <span className="text-[10px] text-slate-300 mt-1 font-medium text-center truncate w-full">Galeri</span>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* SPLASH SCREEN STATE */}
              {appState === "splash" && (
                <motion.div
                  key="splash"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 flex flex-col items-center justify-between py-24 px-6 bg-[#0f172a] text-white z-50"
                >
                  <div className="flex-1 flex flex-col items-center justify-center">
                    <motion.div
                      initial={{ scale: 0.7, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: "spring", stiffness: 100, delay: 0.2 }}
                      className="w-24 h-24 rounded-[28px] bg-slate-900 border border-slate-800 p-2 shadow-2xl mb-6 flex items-center justify-center overflow-hidden"
                    >
                      {config.icon ? (
                        config.icon.startsWith("<svg") ? (
                          <div
                            className="w-full h-full flex items-center justify-center"
                            dangerouslySetInnerHTML={{ __html: config.icon }}
                          />
                        ) : (
                          <img src={config.icon} alt="App Icon" className="w-full h-full object-cover rounded-2xl" referrerPolicy="no-referrer" />
                        )
                      ) : (
                        <div className="w-full h-full bg-blue-600 rounded-2xl flex items-center justify-center text-white text-3xl font-extrabold">
                          {config.name ? config.name.charAt(0).toUpperCase() : "W"}
                        </div>
                      )}
                    </motion.div>

                    <motion.h2
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                      className="text-2xl font-bold tracking-tight text-center text-slate-50"
                    >
                      {config.name || "Uygulamam"}
                    </motion.h2>

                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.8 }}
                      className="text-xs text-slate-400 mt-2 font-mono"
                    >
                      {config.packageName || "com.webinapk.app"}
                    </motion.p>
                  </div>

                  <div className="flex flex-col items-center gap-3">
                    {/* Native loading ring */}
                    <div className="w-6 h-6 border-2 border-slate-600 border-t-blue-500 rounded-full animate-spin"></div>
                    <span className="text-[10px] text-slate-500 font-mono tracking-widest uppercase">
                      Güvenli Tarayıcı Başlatılıyor
                    </span>
                  </div>
                </motion.div>
              )}

              {/* WEBVIEW CONTAINER ACTIVE STATE */}
              {appState === "active" && (
                <motion.div
                  key="active"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-slate-50 flex flex-col text-slate-900 z-30"
                >
                  {/* Web App Top Custom Toolbar (Only if not full fullscreen and configured to show zoom/lock controls) */}
                  {!config.options.fullscreen && (
                    <div className="bg-slate-900 text-slate-200 border-b border-slate-800 px-3 py-1.5 flex items-center justify-between gap-1 select-none">
                      <div className="flex items-center gap-1.5 overflow-hidden flex-1">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                        <span className="text-[10px] font-mono text-slate-300 truncate tracking-tight bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800/80">
                          {activeUrl.replace(/^https?:\/\//i, "")}
                        </span>
                      </div>

                      {/* Header Buttons */}
                      <div className="flex items-center gap-1">
                        {config.options.enableAdBlocker && (
                          <motion.div
                            animate={{ scale: isAdBlockerGlowing ? [1, 1.2, 1] : 1 }}
                            transition={{ duration: 0.4 }}
                            onClick={triggerMockAdBlocking}
                            className={`p-1 rounded cursor-pointer ${
                              config.options.enableAdBlocker ? "text-emerald-400 bg-emerald-950/50 hover:bg-emerald-900/60" : "text-slate-500"
                            }`}
                            title="Ad-Blocker Tetikle"
                          >
                            <ShieldCheck size={11} />
                          </motion.div>
                        )}
                        <button
                          onClick={handleRefresh}
                          className="p-1 hover:bg-slate-800 text-slate-300 rounded transition-colors"
                        >
                          <RefreshCw size={11} className={isRefreshing ? "animate-spin" : ""} />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Android WebView Frame */}
                  <div className="flex-1 w-full bg-slate-100 relative overflow-y-auto">
                    {/* Pull To Refresh simulated spinner overlay */}
                    {isRefreshing && config.options.pullToRefresh && (
                      <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white rounded-full p-1.5 shadow-md border border-slate-200 z-50 animate-bounce">
                        <RefreshCw size={14} className="text-blue-600 animate-spin" />
                      </div>
                    )}

                    {/* Simulation Mock Page Mode */}
                    {previewMode === "simulated" ? (
                      <div className="p-4 flex flex-col gap-3 min-h-full bg-slate-50 text-slate-800">
                        {/* Mock site banner */}
                        <div className="p-3 bg-gradient-to-r from-blue-700 to-indigo-800 text-white rounded-xl shadow-sm text-xs relative overflow-hidden">
                          <span className="absolute top-1 right-1 text-[8px] bg-blue-600/60 px-1 rounded">SİMÜLE</span>
                          <h4 className="font-bold">{config.name || "Uygulama Portalı"}</h4>
                          <p className="text-[10px] opacity-80 mt-1">Uygulamanız bu web sitesine kalıcı olarak kilitlendi:</p>
                          <p className="text-[10px] font-mono mt-0.5 select-all text-blue-200 truncate">{config.url}</p>
                        </div>

                        {/* Lock to Domain Status Warning */}
                        {config.options.lockToDomain && (
                          <div className="p-2.5 bg-indigo-50 border border-indigo-100 rounded-lg text-[10px] text-indigo-800 flex items-start gap-1.5">
                            <span className="font-bold">🔒 Domain Kilidi Aktif:</span>
                            <span>Kullanıcı sadece {activeUrl.replace(/^https?:\/\/(www\.)?/i, "").split("/")[0]} alan adındaki sayfalarda gezinebilir. Dış linkler güvenle harici tarayıcıda açılır!</span>
                          </div>
                        )}

                        {/* Interactive UI card */}
                        <div className="p-3 bg-white rounded-xl border border-slate-200/80 shadow-xs flex flex-col gap-2">
                          <div className="flex justify-between items-center border-b border-slate-100 pb-1.5">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Hızlı Göstergeler</span>
                            <span className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono">AD-FREE ENGINE</span>
                          </div>

                          <div className="grid grid-cols-2 gap-2 mt-1">
                            <div className="bg-slate-50 p-2 rounded-lg text-center">
                              <span className="text-slate-400 text-[9px] block">Durum</span>
                              <span className="text-[11px] font-bold text-emerald-600 flex items-center justify-center gap-1 mt-0.5">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                Reklamsız / Aktif
                              </span>
                            </div>
                            <div className="bg-slate-50 p-2 rounded-lg text-center">
                              <span className="text-slate-400 text-[9px] block">Engellenen Reklam</span>
                              <span className="text-xs font-bold text-indigo-600 block mt-0.5">
                                {blockedLogs.length} Adet
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Interactive trigger and simulated web view blocks */}
                        <div className="p-3 bg-white rounded-xl border border-slate-200/80 shadow-xs flex flex-col gap-2.5">
                          <h5 className="text-[11px] font-bold text-slate-800 flex items-center justify-between">
                            <span>Sitedeki İçerikler (Önizleme)</span>
                            <button
                              onClick={triggerMockAdBlocking}
                              disabled={!config.options.enableAdBlocker}
                              className="text-[9px] bg-blue-50 text-blue-600 hover:bg-blue-100 px-1.5 py-0.5 rounded font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              + Reklam Engelleyiciyi Test Et
                            </button>
                          </h5>

                          <div className="space-y-2">
                            <div className="h-12 bg-slate-100 rounded-lg flex items-center justify-between px-3 relative overflow-hidden">
                              <div className="space-y-1 flex-1">
                                <div className="h-2 w-1/3 bg-slate-300 rounded"></div>
                                <div className="h-1.5 w-2/3 bg-slate-200 rounded"></div>
                              </div>
                              <div className="w-8 h-8 rounded bg-slate-200 flex-shrink-0"></div>
                            </div>

                            {/* Ad Placeholder Banner block, showing ad blocking action in simulator! */}
                            {config.options.enableAdBlocker ? (
                              <div className="p-2 border border-dashed border-emerald-300 bg-emerald-50/50 rounded-lg text-center relative overflow-hidden flex items-center justify-center gap-1.5 py-3">
                                <ShieldCheck size={14} className="text-emerald-500" />
                                <span className="text-[9px] font-medium text-emerald-800">Uygulama İçi Reklam Alanı Temizlendi (Bloke)</span>
                                <span className="text-[7px] bg-emerald-200 text-emerald-700 px-1 rounded uppercase tracking-wider scale-90 font-bold">NoAds</span>
                              </div>
                            ) : (
                              <div className="p-3 border border-dashed border-red-300 bg-red-50/60 rounded-lg text-center relative flex flex-col items-center justify-center gap-1 py-4 animate-pulse">
                                <div className="flex items-center gap-1">
                                  <ShieldAlert size={13} className="text-red-500" />
                                  <span className="text-[9px] font-bold text-red-800">MOCK POP-UP ADS BANNER (Sponsorlu)</span>
                                </div>
                                <span className="text-[8px] text-red-600 italic">Reklam Engelleyiciyi Aktif Ederek Temizleyin!</span>
                              </div>
                            )}

                            <div className="h-16 bg-slate-100 rounded-lg p-3 space-y-2">
                              <div className="h-2 w-2/3 bg-slate-300 rounded"></div>
                              <div className="h-2 w-5/6 bg-slate-200 rounded"></div>
                              <div className="h-1.5 w-1/2 bg-slate-200 rounded"></div>
                            </div>
                          </div>
                        </div>

                        {/* Simulated user log list */}
                        <div className="mt-auto pt-2 border-t border-slate-200/60">
                          <span className="text-[9px] text-slate-400 font-mono block">DEVICE SECURITY STATUS:</span>
                          <span className="text-[9px] text-emerald-600 font-mono font-bold">● APK SECURE WEBBROWSER - ISOLATED ENVIRONMENT</span>
                        </div>
                      </div>
                    ) : (
                      /* Real Mode (loads direct iframe, with security warnings in case of blocks) */
                      <div className="w-full h-full relative bg-white">
                        {iframeError ? (
                          <div className="absolute inset-0 p-4 flex flex-col items-center justify-center text-center bg-slate-50">
                            <ShieldAlert size={32} className="text-amber-500 mb-2" />
                            <h4 className="text-xs font-bold text-slate-800">Gezgin İzin Vermiyor (X-Frame-Options)</h4>
                            <p className="text-[10px] text-slate-500 mt-1 max-w-xs">
                              {activeUrl.split("/")[2] || "Siteniz"} iframe içinde gösterilmeyi güvenlik gerekçesiyle engelliyor.
                            </p>
                            <p className="text-[9px] text-slate-400 mt-0.5">
                              Merak etmeyin! Bu sadece önizleme panelinde geçerlidir, derlediğiniz APK içinde tam performans çalışacaktır.
                            </p>
                            <button
                              onClick={() => setPreviewMode("simulated")}
                              className="mt-3 px-2.5 py-1 text-[10px] bg-slate-900 text-white rounded font-bold hover:bg-slate-800"
                            >
                              Simüle Moda Dön
                            </button>
                          </div>
                        ) : (
                          <iframe
                            src={activeUrl}
                            className="w-full h-full border-0 bg-white"
                            title="Live App Preview"
                            sandbox="allow-scripts allow-same-origin allow-forms"
                            referrerPolicy="no-referrer"
                            onError={() => setIframeError(true)}
                            onLoad={(e) => {
                              // Standard checking fails on browser frames due to security, so we can mock/fallback
                              // we rely on user clicking fallback if site blocks.
                            }}
                          />
                        )}
                      </div>
                    )}
                  </div>

                  {/* Dynamic Real/Simulated Preview Toggles (Absolute placement) */}
                  <div className="absolute bottom-12 left-4 right-4 flex items-center justify-between bg-slate-950/90 text-white border border-slate-800/80 px-2 py-1 rounded-full shadow-lg z-50 text-[10px] backdrop-blur-md">
                    <span className="font-semibold text-[9px] text-slate-400 ml-1.5 uppercase font-mono tracking-widest">Görünüm:</span>
                    <div className="flex gap-1">
                      <button
                        onClick={() => setPreviewMode("simulated")}
                        className={`px-2 py-0.5 rounded-full transition-all font-bold ${
                          previewMode === "simulated" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"
                        }`}
                      >
                        Simüle Sınayıcı
                      </button>
                      <button
                        onClick={() => {
                          setPreviewMode("real");
                          setIframeError(false);
                        }}
                        className={`px-2 py-0.5 rounded-full transition-all font-bold ${
                          previewMode === "real" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"
                        }`}
                      >
                        Canlı Site
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Android Navigation Keys Bar at Bottom */}
          <div
            id="phone-navigation-bar"
            className="h-11 bg-black flex justify-around items-center px-8 text-slate-500 z-50 select-none relative border-t border-slate-950"
          >
            <button
              onClick={closeApp}
              disabled={appState === "launcher"}
              className="p-2.5 hover:text-white active:scale-95 transition-all cursor-pointer disabled:opacity-30 disabled:hover:text-slate-500"
              title="Geri"
            >
              <ArrowLeft size={15} />
            </button>
            <button
              onClick={closeApp}
              className="p-2.5 hover:text-white active:scale-95 transition-all cursor-pointer"
              title="Ana Ekran"
            >
              <Home size={14} />
            </button>
            <button
              className="p-2.5 hover:text-white active:scale-95 transition-all cursor-pointer opacity-50"
              title="Açık Uygulamalar"
            >
              <Square size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* Simulator Actions Status Bar (underneath) */}
      <div className="w-[340px] mt-4 p-3.5 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col gap-2.5">
        <h4 className="text-xs font-bold text-slate-200 flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-blue-400 font-mono tracking-wider uppercase text-[10px]">
            <Terminal size={12} /> Cihaz Log Konsolu
          </span>
          {config.options.enableAdBlocker ? (
            <span className="text-[9px] text-emerald-400 bg-emerald-950/60 border border-emerald-900/50 px-1.5 py-0.5 rounded font-bold font-mono">
              ENGELLEYİCİ: AKTİF
            </span>
          ) : (
            <span className="text-[9px] text-slate-500 bg-slate-950 border border-slate-900/50 px-1.5 py-0.5 rounded font-bold font-mono">
              ENGELLEYİCİ: PASİF
            </span>
          )}
        </h4>

        {/* Console view */}
        <div className="bg-black/80 rounded-xl p-2.5 h-[110px] overflow-y-auto font-mono text-[9px] text-slate-400 space-y-1.5 scrollbar-thin scrollbar-thumb-slate-800 border border-slate-950/50">
          {appState === "launcher" ? (
            <div className="text-slate-500 italic text-center py-6">
              Uygulamayı telefonda başlatıp canlı reklam engelleme verilerini görün...
            </div>
          ) : blockedLogs.length === 0 ? (
            <div className="text-slate-500 italic text-center py-6">
              Sitede geziniliyor, reklam istekleri taranıyor...
            </div>
          ) : (
            blockedLogs.map((log) => (
              <div key={log.id} className="flex flex-col gap-0.5 border-b border-slate-900 pb-1.5 last:border-0">
                <div className="flex justify-between text-[8px] text-slate-500">
                  <span>[{log.timestamp}]</span>
                  <span className="text-emerald-500 font-bold uppercase text-[7px] bg-emerald-950/50 px-1 rounded-sm border border-emerald-900/40">
                    BLOKLANDI ({log.type})
                  </span>
                </div>
                <span className="text-slate-300 truncate font-semibold" title={log.url}>
                  {log.url}
                </span>
              </div>
            ))
          )}
        </div>

        {/* Simulator controls */}
        {appState !== "launcher" && (
          <div className="flex gap-2 justify-between">
            <button
              onClick={triggerMockAdBlocking}
              disabled={!config.options.enableAdBlocker}
              className="flex-1 py-1 px-2 text-[10px] bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold transition-all flex items-center justify-center gap-1 shadow disabled:opacity-40"
            >
              <Plus size={10} /> Reklam İsteği Gönder (Simüle)
            </button>
            <button
              onClick={closeApp}
              className="py-1 px-2 text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-bold transition-all border border-slate-700/80"
            >
              Uygulamayı Kapat
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
