import React, { useState, useEffect } from "react";
import JSZip from "jszip";
import {
  Smartphone,
  Sparkles,
  Download,
  ShieldCheck,
  ShieldAlert,
  Sliders,
  Settings,
  HelpCircle,
  Cpu,
  Globe,
  CheckCircle,
  FileCode,
  QrCode,
  RefreshCw,
  Eye,
  Info,
  ChevronRight,
  ExternalLink,
  ChevronDown,
  Upload,
  Layers,
  History,
  Play
} from "lucide-react";

import AndroidSimulator from "./components/AndroidSimulator";
import { AppConfig, AppOptions, BlockedAdLog } from "./types";
import {
  getAndroidManifest,
  getMainActivityKotlin,
  getAdBlockerKotlin,
  getLayoutXml,
  getStringsXml,
  getThemesXml,
  getBuildGradleApp,
  getBuildGradleProject,
  getSettingsGradle,
  getProjectReadme
} from "./components/SourceCodeTemplate";

export default function App() {
  // Core Configuration State
  const [appName, setAppName] = useState("");
  const [targetUrl, setTargetUrl] = useState("");
  const [packageName, setPackageName] = useState("");
  const [isPkgModified, setIsPkgModified] = useState(false);
  const [activeTab, setActiveTab] = useState<"configure" | "guide" | "history">("configure");

  // Dynamic Options
  const [options, setOptions] = useState<AppOptions>({
    lockToDomain: true,
    enableAdBlocker: true,
    fullscreen: false,
    pullToRefresh: true,
    zoomControls: true,
    keepScreenOn: false,
    customUserAgent: ""
  });

  // Icon Selection/Generation State
  const [selectedIconType, setSelectedIconType] = useState<"preset" | "upload" | "ai">("preset");
  const [isGeminiQuotaLocked, setIsGeminiQuotaLocked] = useState(false);
  const [selectedPresetIcon, setSelectedPresetIcon] = useState("globe");
  const [customIconBase64, setCustomIconBase64] = useState("");
  const [aiIconPrompt, setAiIconPrompt] = useState("");
  const [isGeneratingAiIcon, setIsGeneratingAiIcon] = useState(false);
  const [aiGeneratedSvg, setAiGeneratedSvg] = useState("");
  const [aiStyle, setAiStyle] = useState("gradient");

  // App Build & Compilation simulation states
  const [isBuilding, setIsBuilding] = useState(false);
  const [buildStep, setBuildStep] = useState(0);
  const [buildLogs, setBuildLogs] = useState<string[]>([]);
  const [builtConfig, setBuiltConfig] = useState<AppConfig | null>(null);

  // Dynamic APK Sync Database list
  const [recentConfigs, setRecentConfigs] = useState<AppConfig[]>([]);
  const [isSearchingCode, setIsSearchingCode] = useState(false);
  const [searchCode, setSearchCode] = useState("");
  const [searchedConfig, setSearchedConfig] = useState<AppConfig | null>(null);
  const [searchError, setSearchError] = useState("");

  // Live blocked ads statistics in simulator
  const [blockedLogs, setBlockedLogs] = useState<BlockedAdLog[]>([]);

  // Preset UI Icons SVG templates
  const presetSvgs: { [key: string]: string } = {
    globe: `<svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg"><rect width="512" height="512" rx="100" fill="#2563EB"/><circle cx="256" cy="256" r="140" fill="none" stroke="#FFFFFF" stroke-width="24"/><path d="M116 256h280M256 116a300 300 0 010 280M256 116a300 300 0 000 280" fill="none" stroke="#FFFFFF" stroke-width="24" stroke-linecap="round"/></svg>`,
    cart: `<svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg"><rect width="512" height="512" rx="100" fill="#10B981"/><path d="M120 120h40l45 180h180l40-140H185" fill="none" stroke="#FFFFFF" stroke-width="28" stroke-linecap="round" stroke-linejoin="round"/><circle cx="215" cy="370" r="30" fill="#FFFFFF"/><circle cx="375" cy="370" r="30" fill="#FFFFFF"/></svg>`,
    chat: `<svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg"><rect width="512" height="512" rx="100" fill="#8B5CF6"/><path d="M140 180h232v120c0 10-8 18-18 18H200l-60 40v-40h-18c-10 0-18-8-18-18V198c0-10 8-18 18-18z" fill="none" stroke="#FFFFFF" stroke-width="28" stroke-linecap="round" stroke-linejoin="round"/><circle cx="200" cy="240" r="15" fill="#FFFFFF"/><circle cx="256" cy="240" r="15" fill="#FFFFFF"/><circle cx="312" cy="240" r="15" fill="#FFFFFF"/></svg>`,
    news: `<svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg"><rect width="512" height="512" rx="100" fill="#EF4444"/><path d="M140 140h232v232H140z" fill="none" stroke="#FFFFFF" stroke-width="28" stroke-linejoin="round"/><path d="M180 190h152M180 250h152M180 310h90" stroke="#FFFFFF" stroke-width="24" stroke-linecap="round"/></svg>`,
    play: `<svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg"><rect width="512" height="512" rx="100" fill="#F59E0B"/><path d="M190 150v212l160-106z" fill="#FFFFFF" stroke="#FFFFFF" stroke-width="16" stroke-linejoin="round"/></svg>`,
    game: `<svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg"><rect width="512" height="512" rx="100" fill="#EC4899"/><rect x="140" y="180" width="232" height="152" rx="30" fill="none" stroke="#FFFFFF" stroke-width="28"/><circle cx="190" cy="256" r="15" fill="#FFFFFF"/><path d="M295 256h40M315 236v40" stroke="#FFFFFF" stroke-width="24" stroke-linecap="round"/></svg>`,
    cloud: `<svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg"><rect width="512" height="512" rx="100" fill="#06B6D4"/><path d="M170 310a50 50 0 0110-98 75 75 0 01140-12 60 60 0 0130 110z" fill="#FFFFFF"/></svg>`
  };

  // Compile Active Icon SVG
  const getActiveIcon = (): string => {
    if (selectedIconType === "preset") {
      return presetSvgs[selectedPresetIcon];
    } else if (selectedIconType === "upload" && customIconBase64) {
      return customIconBase64;
    } else if (selectedIconType === "ai" && aiGeneratedSvg) {
      return aiGeneratedSvg;
    }
    // Safe fallback
    return presetSvgs["globe"];
  };

  // Sync Package Name based on App Name
  useEffect(() => {
    if (!isPkgModified && appName) {
      const slugified = appName
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "")
        .substring(0, 20);
      setPackageName(`com.webinapk.${slugified || "app"}`);
    } else if (!appName) {
      setPackageName("");
    }
  }, [appName, isPkgModified]);

  // Load recent builds and Gemini quota status on start
  useEffect(() => {
    fetchRecentBuilds();
    fetchGeminiStatus();
  }, []);

  const fetchRecentBuilds = async () => {
    try {
      const res = await fetch("/api/configs/recent");
      if (res.ok) {
        const data = await res.json();
        setRecentConfigs(data);
      }
    } catch (err) {
      console.error("Error loading recent builds:", err);
    }
  };

  const fetchGeminiStatus = async () => {
    try {
      const res = await fetch("/api/gemini-status");
      if (res.ok) {
        const data = await res.json();
        setIsGeminiQuotaLocked(!!data.locked);
      }
    } catch (err) {
      console.error("Error loading Gemini lock status:", err);
    }
  };

  const resetGeminiLock = async () => {
    try {
      const res = await fetch("/api/gemini-status/reset", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setIsGeminiQuotaLocked(false);
        alert(data.message || "Gemini kilidi kaldırıldı!");
      }
    } catch (err) {
      console.error("Error resetting Gemini lock:", err);
      alert("Kilit sıfırlanırken bir hata oluştu.");
    }
  };

  // Handle URL Schema autocomplete
  const formatUrl = (val: string) => {
    let clean = val.trim();
    if (clean && !/^https?:\/\//i.test(clean)) {
      clean = "https://" + clean;
    }
    setTargetUrl(clean);
  };

  // AI App Icon Generator via Gemini endpoint
  const generateAiIcon = async () => {
    if (!appName) {
      alert("Lütfen önce bir Uygulama Adı girin. Yapay zeka ikonu isminize göre tasarlayacaktır!");
      return;
    }
    setIsGeneratingAiIcon(true);
    setAiGeneratedSvg("");

    try {
      const response = await fetch("/api/generate-icon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appName,
          description: aiIconPrompt || "Genel kullanım web tarayıcı uygulaması",
          stylePrompt: `Doygun modern renk paleti, ${aiStyle} tarzında, çok şık minimal logo sembolü.`
        })
      });

      const data = await response.json();
      if (response.ok && data.svg) {
        setAiGeneratedSvg(data.svg);
        setSelectedIconType("ai");
      } else {
        if (data.locked) {
          setIsGeminiQuotaLocked(true);
        }
        alert("Yapay zeka ikon üretimi başarısız oldu: " + (data.error || "Bilinmeyen hata"));
      }
    } catch (err: any) {
      alert("Sunucuya bağlanırken bir hata oluştu: " + err.message);
    } finally {
      setIsGeneratingAiIcon(false);
    }
  };

  // Handle custom image upload converting to square responsive SVG wrapper
  const handleIconUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Lütfen geçerli bir resim dosyası seçin!");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      // Wrap base64 into a neat responsive SVG squircle
      const wrappedSvg = `<svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <clipPath id="squircle">
            <rect width="512" height="512" rx="100" />
          </clipPath>
        </defs>
        <image width="512" height="512" href="${base64}" clip-path="url(#squircle)" />
      </svg>`;
      setCustomIconBase64(wrappedSvg);
      setSelectedIconType("upload");
    };
    reader.readAsDataURL(file);
  };

  // Simulate Android App Compiling Process
  const handleBuildApp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appName || !targetUrl) {
      alert("Lütfen Uygulama Adı ve Hedef URL alanlarını doldurun!");
      return;
    }

    setIsBuilding(true);
    setBuildStep(0);
    setBuildLogs([]);
    setBuiltConfig(null);

    const steps = [
      { text: "🔧 Sistem parametreleri çözümleniyor...", duration: 800 },
      { text: "🎨 Uygulama simgesi mipmap kaynak klasörlerine ölçeklendiriliyor (hdpi, xhdpi, xxxhdpi)...", duration: 1200 },
      { text: `📝 strings.xml dosyası oluşturuluyor [App Name: "${appName}"]...`, duration: 700 },
      { text: `🔒 AndroidManifest.xml yapılandırılıyor [Permission: INTERNET, Package: "${packageName}"]...`, duration: 1000 },
      { text: "🛡️ AdBlocker.kt filtre sunucuları tanımlandı (doubleclick.net, adservicevb. bloke edildi)...", duration: 1100 },
      { text: "⚙️ MainActivity.kt tarayıcı kontrol mekanizması kilitlendi...", duration: 900 },
      { text: "☕ Kotlin derleyici ve Gradle görevleri optimize ediliyor...", duration: 1400 },
      { text: "📦 Proje modülleri (.ZIP) paketleniyor...", duration: 800 },
      { text: "🔐 Evrensel APK konteyneri imzalandı ve dinamik config hash kodu oluşturuldu...", duration: 1200 },
      { text: "🎉 APK Derleme İşlemi Başarıyla Tamamlandı!", duration: 500 }
    ];

    for (let i = 0; i < steps.length; i++) {
      setBuildStep(i);
      setBuildLogs((prev) => [...prev, steps[i].text]);
      await new Promise((resolve) => setTimeout(resolve, steps[i].duration));
    }

    // Save final config in server database
    try {
      const activeIcon = getActiveIcon();
      const payload: AppConfig = {
        name: appName,
        url: targetUrl,
        packageName,
        icon: activeIcon,
        options
      };

      const res = await fetch("/api/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const savedConfig = await res.json();
        setBuiltConfig(savedConfig);
        fetchRecentBuilds();
      } else {
        throw new Error("Sunucu yapılandırmayı kaydedemedi.");
      }
    } catch (err: any) {
      alert("Dinamik bulut eşitleme yapılandırılamadı: " + err.message + ". Yerel paket indirme yine de aktiftir.");
      // Fallback local mock config
      setBuiltConfig({
        id: "WIA-" + Math.floor(100000 + Math.random() * 900000),
        name: appName,
        url: targetUrl,
        packageName,
        icon: getActiveIcon(),
        options
      });
    } finally {
      setIsBuilding(false);
    }
  };

  // Generate and Trigger Download of Android Studio Kotlin Source ZIP
  const downloadSourceZip = async () => {
    if (!builtConfig) return;

    const zip = new JSZip();

    // App Configuration Settings
    zip.file("README.md", getProjectReadme(builtConfig));
    zip.file("settings.gradle", getSettingsGradle());
    zip.file("build.gradle", getBuildGradleProject());

    // App Submodule Folder structure
    const appFolder = zip.folder("app")!;
    appFolder.file("build.gradle", getBuildGradleApp(builtConfig));

    const srcFolder = appFolder.folder("src")!;
    const mainFolder = srcFolder.folder("main")!;
    mainFolder.file("AndroidManifest.xml", getAndroidManifest(builtConfig));

    // Dynamic config stored inside assets
    const assetsFolder = mainFolder.folder("assets")!;
    assetsFolder.file("config.json", JSON.stringify(builtConfig, null, 2));

    // Kotlin package paths
    const pkgPath = (builtConfig.packageName || "com.webinapk.app").replace(/\./g, "/");
    const javaFolder = mainFolder.folder("java")!;
    const codeFolder = javaFolder.folder(pkgPath)!;
    codeFolder.file("MainActivity.kt", getMainActivityKotlin(builtConfig));
    codeFolder.file("AdBlocker.kt", getAdBlockerKotlin(builtConfig));

    // Resources layout
    const resFolder = mainFolder.folder("res")!;
    const layoutFolder = resFolder.folder("layout")!;
    layoutFolder.file("activity_main.xml", getLayoutXml());

    const valuesFolder = resFolder.folder("values")!;
    valuesFolder.file("strings.xml", getStringsXml(builtConfig));
    valuesFolder.file("themes.xml", getThemesXml());

    // Pack launcher icon as svg
    const mipmapFolder = resFolder.folder("mipmap")!;
    mipmapFolder.file("ic_launcher.svg", builtConfig.icon);

    try {
      const content = await zip.generateAsync({ type: "blob" });
      const url = window.URL.createObjectURL(content);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${builtConfig.name.replace(/\s+/g, "_")}_Android_Source.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert("ZIP dosyası oluşturulurken hata: " + err.message);
    }
  };

  // Download PWA Installer Code Bundle
  const downloadPwaBundle = async () => {
    if (!builtConfig) return;

    const zip = new JSZip();

    // Manifest.json
    const manifest = {
      name: builtConfig.name,
      short_name: builtConfig.name,
      start_url: builtConfig.url,
      display: "standalone",
      background_color: "#0f172a",
      theme_color: "#2563eb",
      icons: [
        {
          src: "icon-192.png",
          sizes: "192x192",
          type: "image/png"
        },
        {
          src: "icon-512.png",
          sizes: "512x512",
          type: "image/png"
        }
      ]
    };

    // Service Worker template
    const swCode = `const CACHE_NAME = "${builtConfig.name.toLowerCase()}-cache-v1";
const urlsToCache = ["/"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});`;

    const htmlGuide = `<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${builtConfig.name} - PWA Kurulumu</title>
    <link rel="manifest" href="manifest.json">
    <style>
        body { font-family: system-ui, sans-serif; text-align: center; padding: 50px; background: #f8fafc; color: #1e293b; }
        .card { max-width: 500px; margin: auto; background: white; padding: 30px; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.05); }
        .btn { background: #2563eb; color: white; border: none; padding: 12px 24px; border-radius: 8px; font-weight: bold; cursor: pointer; }
    </style>
</head>
<body>
    <div class="card">
        <h1>${builtConfig.name} PWA Portal</h1>
        <p>Bu site telefonunuza uygulama olarak yüklenebilir!</p>
        <button class="btn" id="installBtn">Uygulamayı Yükle</button>
    </div>
    <script>
        let deferredPrompt;
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            document.getElementById('installBtn').style.display = 'block';
        });
        document.getElementById('installBtn').addEventListener('click', async () => {
            if (deferredPrompt) {
                deferredPrompt.prompt();
                const { outcome } = await deferredPrompt.userChoice;
                if (outcome === 'accepted') {
                    console.log('User installed the PWA');
                }
                deferredPrompt = null;
            }
        });
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('sw.js');
        }
    </script>
</body>
</html>`;

    zip.file("manifest.json", JSON.stringify(manifest, null, 2));
    zip.file("sw.js", swCode);
    zip.file("index.html", htmlGuide);

    // Provide instructions
    zip.file("README.txt", `PWA Kurulumu:
1. Bu klasördeki dosyaları sitenizin kök dizinine (public_html / www) yükleyin.
2. Sitenizin index.html <head> tagleri arasına şu satırı ekleyin:
   <link rel="manifest" href="manifest.json">
   <script>
       if ('serviceWorker' in navigator) {
           navigator.serviceWorker.register('sw.js');
       }
   </script>
3. Tebrikler! Artık kullanıcılar tarayıcılarından girdiğinde "Uygulamayı Yükle" uyarısı alacak.`);

    try {
      const content = await zip.generateAsync({ type: "blob" });
      const url = window.URL.createObjectURL(content);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${builtConfig.name.replace(/\s+/g, "_")}_PWA_Bundle.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert("PWA dosyası oluşturulurken hata: " + err.message);
    }
  };

  // Dynamic config lookups
  const handleSearchCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchCode || searchCode.trim().length !== 6) {
      setSearchError("Lütfen geçerli 6 haneli bir kod girin!");
      return;
    }

    setIsSearchingCode(true);
    setSearchError("");
    setSearchedConfig(null);

    try {
      const res = await fetch(`/api/config/${searchCode.trim()}`);
      if (res.ok) {
        const data = await res.json();
        setSearchedConfig(data);
      } else {
        setSearchError("Bu koda ait bir uygulama yapılandırması bulunamadı.");
      }
    } catch (err) {
      setSearchError("Sunucu bağlantısı kurulamadı.");
    } finally {
      setIsSearchingCode(false);
    }
  };

  // Mock download of Pre-compiled template companion APK
  const downloadCompanionApk = () => {
    const fakeApkUrl = "/WebInApk_Universal_Launcher.apk";
    // We dynamically generate an alert explaining how the companion app works, and download a placeholder binary or instructions
    const link = document.createElement("a");
    // Generate a beautiful explanatory text file acting as mock download if server doesn't host the real physical compiled file
    const content = `WebInApk Evrensel Launcher Kurulum Dosyası
=========================================

Dinamik Kodu: ${builtConfig?.id || "YOK"}
Uygulama Adı: ${builtConfig?.name || "Uygulamam"}
Hedef URL: ${builtConfig?.url || "YOK"}

KULLANIM TALİMATI:
1. Telefonunuza 'WebInApk_Universal_Launcher.apk' uygulamasını kurun.
2. Uygulama ilk açıldığında sizden '6 Haneli Bağlantı Kodu' isteyecektir.
3. Bu alana şu kodu girin: ${builtConfig?.id || "KOD ALINAMADI"}
4. Giriş yaptığınız anda evrensel tarayıcı sunucudan ayarları çekerek kendini saniyeler içinde "${builtConfig?.name}" uygulamasına dönüştürecek, reklam engelleyiciyi aktif edecek ve bu siteye kilitleyecektir!

Tebrikler! Reklamsız mobil dünyanıza hoş geldiniz.`;

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    link.href = URL.createObjectURL(blob);
    link.download = `WebInApk_${builtConfig?.id || "Launcher"}_Instructions.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-[#E0D8D0] font-sans flex flex-col selection:bg-white/20 selection:text-white">
      {/* Sophisticated Header */}
      <header className="h-20 border-b border-white/10 bg-[#050505] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto h-full px-12 flex items-center justify-between">
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-display font-bold tracking-tighter text-white uppercase">Webinapk</span>
            <span className="font-serif italic text-sm text-[#8E9299] lowercase">noadds</span>
          </div>

          <nav className="flex space-x-8 text-[11px] uppercase tracking-widest font-medium opacity-80">
            <button
              onClick={() => setActiveTab("configure")}
              className={`transition-colors cursor-pointer hover:text-white pb-1 ${
                activeTab === "configure" ? "text-white border-b border-white/40" : "text-[#8E9299]"
              }`}
            >
              Studio
            </button>
            <button
              onClick={() => setActiveTab("guide")}
              className={`transition-colors cursor-pointer hover:text-white pb-1 ${
                activeTab === "guide" ? "text-white border-b border-white/40" : "text-[#8E9299]"
              }`}
            >
              Rehber
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`transition-colors cursor-pointer hover:text-white pb-1 ${
                activeTab === "history" ? "text-white border-b border-white/40" : "text-[#8E9299]"
              }`}
            >
              Geçmiş
            </button>
          </nav>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-12 py-16">
        {activeTab === "configure" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            {/* Left side: Form parameters (Grid 7) */}
            <div className="lg:col-span-7 flex flex-col gap-10">
              {/* Introduction Banner */}
              <header className="mb-4">
                <label className="text-[10px] uppercase tracking-[0.2em] font-semibold text-white/40 block mb-3">Step 00 / Pure WebView Engine</label>
                <h1 className="text-5xl font-serif italic mb-4 leading-tight text-white">Pure Web Experiences.</h1>
                <p className="text-[#8E9299] max-w-xl text-sm leading-relaxed">
                  Herhangi bir web sitesini reklamsız, bağımsız bir kilitli mobil uygulamaya saniyeler içinde dönüştürün.
                </p>
              </header>

              {/* Core Input Form */}
              <div className="bg-slate-950 border border-slate-900 rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col gap-6">
                <div className="border-b border-slate-900 pb-4">
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <Sliders className="text-blue-500" size={18} /> Uygulama Ayarlarını Belirleyin
                  </h2>
                </div>

                <form onSubmit={handleBuildApp} className="space-y-6">
                  {/* Row 1: App Name & Target URL */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-slate-300 flex items-center gap-1">
                        Uygulama Adı <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Örn: Benim Blog Sitem"
                        value={appName}
                        onChange={(e) => setAppName(e.target.value)}
                        className="bg-slate-900/50 border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 transition-all font-medium"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-slate-300 flex items-center gap-1">
                        Hedef Web Sitesi (URL) <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          required
                          placeholder="Örn: yusufsite.com"
                          value={targetUrl}
                          onChange={(e) => setTargetUrl(e.target.value)}
                          onBlur={(e) => formatUrl(e.target.value)}
                          className="w-full bg-slate-900/50 border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-500 transition-all font-medium"
                        />
                        <Globe size={16} className="text-slate-500 absolute left-3.5 top-3.5" />
                      </div>
                    </div>
                  </div>

                  {/* Android Package ID Customizer */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-slate-300">
                        Android Paket Kimliği (Package Name)
                      </label>
                      <span className="text-[10px] text-slate-500 font-mono">Benzersiz android uygulama ID</span>
                    </div>
                    <input
                      type="text"
                      placeholder="Örn: com.benimsitem.app"
                      value={packageName}
                      onChange={(e) => {
                        setPackageName(e.target.value);
                        setIsPkgModified(true);
                      }}
                      className="bg-slate-900/50 border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl px-4 py-3 text-xs text-slate-300 font-mono transition-all"
                    />
                  </div>

                  {/* App Icon Selector Segment */}
                  <div className="p-4 bg-slate-900/30 border border-slate-900 rounded-2xl flex flex-col gap-4">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-bold text-slate-200">Uygulama İkon Tasarımı</span>
                      <p className="text-[10px] text-slate-400">Uygulamanın telefonda görüneceği launcher simgesi.</p>
                    </div>

                    {/* Tabs for icon selector */}
                    <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-900">
                      <button
                        type="button"
                        onClick={() => setSelectedIconType("preset")}
                        className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                          selectedIconType === "preset" ? "bg-slate-900 text-white" : "text-slate-500 hover:text-slate-300"
                        }`}
                      >
                        Hazır Şablonlar
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedIconType("upload")}
                        className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                          selectedIconType === "upload" ? "bg-slate-900 text-white" : "text-slate-500 hover:text-slate-300"
                        }`}
                      >
                        Resim Yükle
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedIconType("ai")}
                        className={`py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 ${
                          selectedIconType === "ai" ? "bg-slate-900 text-white" : "text-slate-500 hover:text-slate-300"
                        }`}
                      >
                        Yapay Zeka (Gemini) {isGeminiQuotaLocked && <span className="text-red-500 text-[10px]">🔒</span>}
                      </button>
                    </div>

                    {/* Preset Icons Selection Grid */}
                    {selectedIconType === "preset" && (
                      <div className="flex flex-wrap gap-3.5 justify-center py-2 bg-slate-950/40 p-4 rounded-xl border border-slate-900/60">
                        {Object.keys(presetSvgs).map((key) => (
                          <div
                            key={key}
                            onClick={() => setSelectedPresetIcon(key)}
                            className={`w-12 h-12 rounded-xl p-1 cursor-pointer transition-all border-2 flex items-center justify-center ${
                              selectedPresetIcon === key && selectedIconType === "preset"
                                ? "border-blue-500 scale-105 bg-slate-900"
                                : "border-transparent hover:border-slate-800 hover:bg-slate-900/30"
                            }`}
                            dangerouslySetInnerHTML={{ __html: presetSvgs[key] }}
                          />
                        ))}
                      </div>
                    )}

                    {/* Image Upload Input */}
                    {selectedIconType === "upload" && (
                      <div className="flex items-center gap-4 py-2">
                        <label className="flex-1 flex flex-col items-center justify-center border border-dashed border-slate-800 hover:border-blue-500 rounded-xl p-4 cursor-pointer hover:bg-slate-900/20 transition-all">
                          <Upload size={18} className="text-slate-400 mb-1.5" />
                          <span className="text-[10px] font-bold text-slate-300">Kare Logo Seçin (PNG/JPG)</span>
                          <span className="text-[8px] text-slate-500 mt-0.5">Otomatik olarak Android Mipmap squircle formatına adapte edilir</span>
                          <input type="file" accept="image/*" onChange={handleIconUpload} className="hidden" />
                        </label>

                        {customIconBase64 && (
                          <div className="w-14 h-14 bg-slate-950 rounded-xl p-1 border border-slate-800 flex items-center justify-center">
                            <div className="w-full h-full" dangerouslySetInnerHTML={{ __html: customIconBase64 }} />
                          </div>
                        )}
                      </div>
                    )}

                    {/* AI Gemini SVG Logo Builder */}
                    {selectedIconType === "ai" && (
                      <div className="flex flex-col gap-3 py-1">
                        {isGeminiQuotaLocked ? (
                          <div className="flex flex-col gap-3 p-4 bg-red-950/20 border border-red-900/40 rounded-xl text-left">
                            <div className="flex items-start gap-2.5">
                              <span className="text-red-500 text-base">⚠️</span>
                              <div>
                                <h4 className="text-xs font-bold text-red-300">Yapay Zeka Servisi Kilitlendi</h4>
                                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                                  Yapay zeka modelimizin API günlük kullanım kotası dolduğu için bu özellik geçici olarak kilitlenmiştir. Lütfen hazır şablon ikonları kullanın veya kendi logonuzu yükleyin.
                                </p>
                              </div>
                            </div>
                            <div className="flex justify-end mt-1">
                              <button
                                type="button"
                                onClick={resetGeminiLock}
                                className="text-[9px] font-mono tracking-wider bg-red-900/30 text-red-300 border border-red-800/50 hover:bg-red-900/50 hover:text-white px-2.5 py-1.5 rounded-lg font-bold transition-all"
                              >
                                [KİLİDİ MANUEL SIFIRLA]
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                placeholder="Tasarım tarifi yazın: Örn: Alışveriş sepeti ve minimalist roket"
                                value={aiIconPrompt}
                                onChange={(e) => setAiIconPrompt(e.target.value)}
                                className="flex-1 bg-slate-950 border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 font-medium"
                              />
                              <button
                                type="button"
                                onClick={generateAiIcon}
                                disabled={isGeneratingAiIcon}
                                className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 px-3.5 py-2.5 rounded-xl text-xs font-bold text-white flex items-center gap-1.5 transition-all shadow-lg"
                              >
                                {isGeneratingAiIcon ? (
                                  <RefreshCw size={12} className="animate-spin" />
                                ) : (
                                  <Sparkles size={12} />
                                )}
                                Tasarla
                              </button>
                            </div>

                            {/* Style selection for AI icon */}
                            <div className="flex items-center gap-4 text-[10px] font-mono text-slate-400">
                              <span>Tema Paleti:</span>
                              <div className="flex gap-2">
                                {["gradient", "material", "neon", "dark"].map((style) => (
                                  <button
                                    key={style}
                                    type="button"
                                    onClick={() => setAiStyle(style)}
                                    className={`px-2 py-0.5 rounded border capitalize transition-all ${
                                      aiStyle === style
                                        ? "bg-indigo-950 text-indigo-300 border-indigo-700 font-bold"
                                        : "border-slate-900 hover:border-slate-800"
                                    }`}
                                  >
                                    {style}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </>
                        )}

                        {aiGeneratedSvg && (
                          <div className="flex items-center gap-4 bg-slate-950 p-3 rounded-xl border border-slate-900 mt-1">
                            <div className="w-14 h-14 rounded-xl p-1 bg-slate-900 border border-slate-800 flex items-center justify-center">
                              <div className="w-full h-full" dangerouslySetInnerHTML={{ __html: aiGeneratedSvg }} />
                            </div>
                            <div className="flex-1">
                              <span className="text-[10px] text-slate-300 font-bold block flex items-center gap-1 text-emerald-400">
                                <CheckCircle size={11} /> İkon Başarıyla Üretildi!
                              </span>
                              <span className="text-[9px] text-slate-500 font-mono">Gemini SVG vektör şablonu aktif</span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Advanced features checkbox panels */}
                  <div className="bg-slate-900/10 border border-slate-900 rounded-2xl p-4 flex flex-col gap-4">
                    <div className="flex items-center gap-2 border-b border-slate-900/50 pb-2">
                      <Settings className="text-blue-500" size={14} />
                      <span className="text-xs font-bold text-slate-200">Gelişmiş WebView Özellikleri</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Ad Blocker Switch */}
                      <label className="flex items-start gap-3 p-2.5 hover:bg-slate-900/20 rounded-xl border border-transparent hover:border-slate-900 cursor-pointer transition-all">
                        <input
                          type="checkbox"
                          checked={options.enableAdBlocker}
                          onChange={(e) => setOptions({ ...options, enableAdBlocker: e.target.checked })}
                          className="mt-0.5 rounded border-slate-800 text-blue-600 focus:ring-blue-500 bg-slate-900"
                        />
                        <div>
                          <span className="text-xs font-bold text-white block flex items-center gap-1">
                            🛡️ Reklam Engelleyici <span className="text-[8px] bg-blue-500/10 text-blue-400 px-1 rounded">NoAds</span>
                          </span>
                          <span className="text-[10px] text-slate-400 leading-relaxed block mt-0.5">
                            Sitedeki pop-up, video ve banner reklam sunucularını yerel olarak bloke eder.
                          </span>
                        </div>
                      </label>

                      {/* Lock To Domain Switch */}
                      <label className="flex items-start gap-3 p-2.5 hover:bg-slate-900/20 rounded-xl border border-transparent hover:border-slate-900 cursor-pointer transition-all">
                        <input
                          type="checkbox"
                          checked={options.lockToDomain}
                          onChange={(e) => setOptions({ ...options, lockToDomain: e.target.checked })}
                          className="mt-0.5 rounded border-slate-800 text-blue-600 focus:ring-blue-500 bg-slate-900"
                        />
                        <div>
                          <span className="text-xs font-bold text-white block">🔒 Domain Kilidi (Strict)</span>
                          <span className="text-[10px] text-slate-400 leading-relaxed block mt-0.5">
                            Kullanıcıyı sadece belirlenen ana alan adında tutar. Dış bağlantılar harici tarayıcıda açılır.
                          </span>
                        </div>
                      </label>

                      {/* Pull to refresh */}
                      <label className="flex items-start gap-3 p-2.5 hover:bg-slate-900/20 rounded-xl border border-transparent hover:border-slate-900 cursor-pointer transition-all">
                        <input
                          type="checkbox"
                          checked={options.pullToRefresh}
                          onChange={(e) => setOptions({ ...options, pullToRefresh: e.target.checked })}
                          className="mt-0.5 rounded border-slate-800 text-blue-600 focus:ring-blue-500 bg-slate-900"
                        />
                        <div>
                          <span className="text-xs font-bold text-white block">🔄 Çek ve Yenile</span>
                          <span className="text-[10px] text-slate-400 leading-relaxed block mt-0.5">
                            Sayfayı yukarıdan aşağı kaydırarak yeniden yükleme hareketini (SwipeRefreshLayout) aktif eder.
                          </span>
                        </div>
                      </label>

                      {/* Fullscreen view */}
                      <label className="flex items-start gap-3 p-2.5 hover:bg-slate-900/20 rounded-xl border border-transparent hover:border-slate-900 cursor-pointer transition-all">
                        <input
                          type="checkbox"
                          checked={options.fullscreen}
                          onChange={(e) => setOptions({ ...options, fullscreen: e.target.checked })}
                          className="mt-0.5 rounded border-slate-800 text-blue-600 focus:ring-blue-500 bg-slate-900"
                        />
                        <div>
                          <span className="text-xs font-bold text-white block">📺 Tam Ekran (Immersive)</span>
                          <span className="text-[10px] text-slate-400 leading-relaxed block mt-0.5">
                            Android durum çubuğunu gizleyerek uygulamanızın tamamen tam ekran çalışmasını sağlar.
                          </span>
                        </div>
                      </label>
                    </div>

                    {/* Advanced User Agent setup */}
                    <div className="flex flex-col gap-1.5 border-t border-slate-900/50 pt-3">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Tarayıcı Tanımlama Kimliği (User Agent)
                      </label>
                      <select
                        value={options.customUserAgent ? "custom" : "default"}
                        onChange={(e) => {
                          if (e.target.value === "default") {
                            setOptions({ ...options, customUserAgent: "" });
                          } else {
                            setOptions({
                              ...options,
                              customUserAgent: "Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 Chrome/110.0.0.0 Mobile Safari/537.36"
                            });
                          }
                        }}
                        className="bg-slate-950 border border-slate-900 rounded-xl px-3.5 py-2 text-xs text-slate-300 transition-all font-medium"
                      >
                        <option value="default">Varsayılan Android Mobil WebView Client</option>
                        <option value="custom">Özel Kimlik (Mobil Chrome Tanımlaması)</option>
                      </select>

                      {options.customUserAgent && (
                        <input
                          type="text"
                          value={options.customUserAgent}
                          onChange={(e) => setOptions({ ...options, customUserAgent: e.target.value })}
                          className="bg-slate-950 border border-slate-900 rounded-xl px-3.5 py-1.5 text-[10px] text-slate-300 font-mono"
                        />
                      )}
                    </div>
                  </div>

                  {/* Submission builder buttons */}
                  <button
                    type="submit"
                    disabled={isBuilding}
                    className="w-full bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-extrabold text-sm py-4 px-6 rounded-2xl tracking-wide shadow-lg shadow-blue-500/10 cursor-pointer disabled:opacity-40 transition-all flex items-center justify-center gap-2"
                  >
                    {isBuilding ? (
                      <>
                        <RefreshCw size={16} className="animate-spin" />
                        UYGULAMA DERLENİYOR (LÜTFEN BEKLEYİN)...
                      </>
                    ) : (
                      <>
                        <Cpu size={16} />
                        ANDROİD UYGULAMASI (.APK) OLUŞTUR
                      </>
                    )}
                  </button>
                </form>
              </div>

              {/* Dynamic Compilation Progress Logs panel */}
              {isBuilding && (
                <div className="bg-black/90 rounded-3xl border border-slate-800 p-5 font-mono text-[10px] text-slate-400 flex flex-col gap-3.5 shadow-2xl">
                  <div className="flex items-center justify-between border-b border-slate-900 pb-2">
                    <span className="text-white font-bold flex items-center gap-1.5">
                      <Cpu className="text-blue-500 animate-pulse" size={14} /> ANDROID SDK BUILDER v2.4.0
                    </span>
                    <span className="text-blue-400 text-[9px] font-bold">Derleme Aşaması: {buildStep + 1}/10</span>
                  </div>

                  {/* Build progress bar */}
                  <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-900">
                    <div
                      className="h-full bg-blue-500 transition-all duration-300"
                      style={{ width: `${(buildStep + 1) * 10}%` }}
                    ></div>
                  </div>

                  {/* Logs area */}
                  <div className="space-y-1 h-[140px] overflow-y-auto pr-1">
                    {buildLogs.map((log, idx) => (
                      <div
                        key={idx}
                        className={`transition-opacity duration-300 ${
                          idx === buildStep ? "text-white font-bold" : "text-slate-500"
                        }`}
                      >
                        {log}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* successful build dynamic output download cards */}
              {builtConfig && !isBuilding && (
                <div className="p-6 sm:p-8 bg-slate-900/20 border border-blue-900/40 rounded-3xl flex flex-col gap-6 shadow-2xl relative overflow-hidden animate-fadeIn">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 rounded-full blur-2xl"></div>

                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-950 rounded-xl border border-blue-900/30 flex items-center justify-center text-blue-400">
                      <CheckCircle size={22} />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-white">Tebrikler! Uygulamanız Hazır</h3>
                      <p className="text-xs text-slate-400">Aşağıdaki formatlardan dilediğinizi indirip hemen kullanın.</p>
                    </div>
                  </div>

                  {/* Dynamic Build Identifier and dynamic APK loader instruction */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-center p-4 bg-blue-950/25 rounded-2xl border border-blue-900/30">
                    <div className="sm:col-span-8 flex flex-col gap-1.5">
                      <span className="text-[9px] font-mono font-bold text-blue-400 uppercase tracking-widest block">
                        Cihaz Eşleştirme ve Kurulum Kodu
                      </span>
                      <h4 className="text-2xl font-black text-white font-mono tracking-wider flex items-center gap-2">
                        {builtConfig.id}
                        <span className="text-xs text-slate-400 font-sans font-normal bg-slate-950 px-2 py-0.5 rounded border border-slate-900">
                          6 Haneli Kod
                        </span>
                      </h4>
                      <p className="text-[10px] text-slate-300 leading-relaxed mt-0.5">
                        Telefonunuza <strong>WebInApk Evrensel APK</strong> kurduktan sonra bu kodu girerek ayarlarınızı saniyeler içinde anında eşleştirebilirsiniz!
                      </p>
                    </div>

                    <div className="sm:col-span-4 flex justify-center bg-white p-2 rounded-xl border border-blue-900/10">
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(builtConfig.id || "")}`}
                        alt="Eşleştirme QR"
                        className="w-24 h-24"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  </div>

                  {/* 3 Export Formats Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-1">
                    {/* Format 1: Companion Launcher APK */}
                    <div className="p-4 bg-slate-950/80 border border-slate-900 rounded-2xl flex flex-col justify-between h-[180px]">
                      <div>
                        <span className="text-[8px] bg-blue-500/10 text-blue-400 font-mono font-bold px-1.5 py-0.5 rounded">
                          HIZLI YÜKLEME
                        </span>
                        <h5 className="text-xs font-bold text-white mt-1.5">1. Evrensel APK</h5>
                        <p className="text-[10px] text-slate-400 mt-1">
                          Hazır WebView tarayıcı paketimizdir. Kurduktan sonra kodunuzu yazarak sitenize kilitlersiniz.
                        </p>
                      </div>
                      <button
                        onClick={downloadCompanionApk}
                        className="w-full bg-blue-600 hover:bg-blue-500 py-2 rounded-lg text-[10px] font-bold text-white flex items-center justify-center gap-1 transition-all"
                      >
                        <Download size={11} /> İndir ve Kur
                      </button>
                    </div>

                    {/* Format 2: Kotlin Android Studio Project */}
                    <div className="p-4 bg-slate-950/80 border border-slate-900 rounded-2xl flex flex-col justify-between h-[180px]">
                      <div>
                        <span className="text-[8px] bg-violet-500/10 text-violet-400 font-mono font-bold px-1.5 py-0.5 rounded">
                          DEVELOPER KAYNAK
                        </span>
                        <h5 className="text-xs font-bold text-white mt-1.5">2. Kotlin Projesi (ZIP)</h5>
                        <p className="text-[10px] text-slate-400 mt-1">
                          Android Studio için tamamen size özel derlenmiş native kaynak kodu. İkon ve paketleriniz hazır!
                        </p>
                      </div>
                      <button
                        onClick={downloadSourceZip}
                        className="w-full bg-violet-600 hover:bg-violet-500 py-2 rounded-lg text-[10px] font-bold text-white flex items-center justify-center gap-1 transition-all"
                      >
                        <FileCode size={11} /> Projeyi İndir
                      </button>
                    </div>

                    {/* Format 3: PWA Bundle */}
                    <div className="p-4 bg-slate-950/80 border border-slate-900 rounded-2xl flex flex-col justify-between h-[180px]">
                      <div>
                        <span className="text-[8px] bg-cyan-500/10 text-cyan-400 font-mono font-bold px-1.5 py-0.5 rounded">
                          SİTE İÇİN UYGULAMA
                        </span>
                        <h5 className="text-xs font-bold text-white mt-1.5">3. PWA Manifest Paketi</h5>
                        <p className="text-[10px] text-slate-400 mt-1">
                          Sitenizi ziyaret edenlerin Chrome/Safari üzerinden uygulamayı telefonlarına yüklemesini sağlar.
                        </p>
                      </div>
                      <button
                        onClick={downloadPwaBundle}
                        className="w-full bg-cyan-600 hover:bg-cyan-500 py-2 rounded-lg text-[10px] font-bold text-white flex items-center justify-center gap-1 transition-all"
                      >
                        <Layers size={11} /> Manifest İndir
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right side: Phone Simulator Frame & Log dashboard (Grid 5) */}
            <div className="lg:col-span-5 lg:sticky lg:top-24 flex flex-col gap-6">
              <div className="bg-slate-950 border border-slate-900 rounded-3xl p-6 shadow-xl flex flex-col gap-5">
                <div className="flex justify-between items-center border-b border-slate-900 pb-3">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Smartphone className="text-blue-500" size={16} /> Canlı Android Sınayıcı (Preview)
                  </h3>
                  <span className="text-[10px] text-slate-500 font-mono">Android 15 Mock</span>
                </div>

                {/* Simulator component */}
                <AndroidSimulator
                  config={{
                    name: appName || "Benim Uygulamam",
                    url: targetUrl || "https://google.com",
                    icon: getActiveIcon(),
                    options,
                    packageName: packageName || "com.webinapk.app"
                  }}
                  blockedLogs={blockedLogs}
                  onBlockAd={(log) => setBlockedLogs((prev) => [log, ...prev].slice(0, 50))}
                />
              </div>

              {/* Fast Config code lookup panel (Let's check code online) */}
              <div className="bg-slate-950 border border-slate-900 rounded-3xl p-6 shadow-xl flex flex-col gap-4">
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <QrCode size={14} className="text-blue-500" /> Kod Sorgula ve Cihaz Ayarı Getir
                </h4>
                <p className="text-[10px] text-slate-400">
                  Daha önce oluşturduğunuz bir uygulamanın 6 haneli kodunu girerek ayarlarını ve indirme bağlantılarını anında geri yükleyin.
                </p>

                <form onSubmit={handleSearchCode} className="flex gap-2">
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="Örn: 482931"
                    value={searchCode}
                    onChange={(e) => setSearchCode(e.target.value)}
                    className="flex-1 bg-slate-900 border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl px-3.5 py-2 text-xs text-white font-mono tracking-widest text-center"
                  />
                  <button
                    type="submit"
                    disabled={isSearchingCode}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1"
                  >
                    {isSearchingCode ? <RefreshCw size={12} className="animate-spin" /> : <Eye size={12} />} Sorgula
                  </button>
                </form>

                {searchError && (
                  <span className="text-[10px] text-red-500 font-medium">{searchError}</span>
                )}

                {searchedConfig && (
                  <div className="p-3 bg-slate-900/40 border border-slate-800 rounded-xl flex items-center justify-between gap-3 text-xs animate-fadeIn">
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <div className="w-10 h-10 rounded-lg p-0.5 bg-slate-950 border border-slate-800 flex items-center justify-center flex-shrink-0">
                        <div className="w-full h-full" dangerouslySetInnerHTML={{ __html: searchedConfig.icon }} />
                      </div>
                      <div className="overflow-hidden">
                        <span className="font-bold text-white block truncate">{searchedConfig.name}</span>
                        <span className="text-[9px] text-slate-400 font-mono block truncate">{searchedConfig.url}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setAppName(searchedConfig.name);
                        setTargetUrl(searchedConfig.url);
                        if (searchedConfig.packageName) setPackageName(searchedConfig.packageName);
                        setOptions(searchedConfig.options);
                        setBuiltConfig(searchedConfig);
                        if (searchedConfig.icon.startsWith("<svg")) {
                          setAiGeneratedSvg(searchedConfig.icon);
                          setSelectedIconType("ai");
                        }
                        alert("Uygulama yapılandırması başarıyla editöre yüklendi!");
                      }}
                      className="px-2.5 py-1.5 bg-blue-600/10 hover:bg-blue-600 text-blue-400 hover:text-white rounded-lg font-bold text-[10px] transition-all flex-shrink-0 border border-blue-500/20"
                    >
                      Editöre Yükle
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "guide" && (
          <div className="max-w-4xl mx-auto bg-slate-950 border border-slate-900 rounded-3xl p-6 sm:p-8 shadow-xl space-y-8 animate-fadeIn">
            <div className="border-b border-slate-900 pb-4">
              <h2 className="text-xl font-black text-white flex items-center gap-2">
                <HelpCircle className="text-blue-500" /> WebinApkNoAds Kurulum Rehberi
              </h2>
              <p className="text-xs text-slate-400 mt-1">Uygulamanızı telefonunuza kurmak veya geliştirmek için adım adım rehber.</p>
            </div>

            {/* Step 1: Companion Launcher */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-[10px] font-bold flex items-center justify-center text-white">1</span>
                Yol: Evrensel Companion APK ile Kurulum (En Pratik Yol)
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed pl-7">
                Bu yöntemde hiçbir teknik bilgiye gerek duymazsınız. Telefonunuza hazır evrensel tarayıcı (WebInApk Launcher) APK dosyasını kurarsınız. Kurulum bittiğinde uygulama sizden panelden aldığınız 6 haneli kodu ister. Kodu girdikten sonra uygulama anında o kodun ayarlarını indirerek kendini tamamen sizin sitenize özel bir uygulamaya dönüştürür!
              </p>
              <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-4 ml-7 space-y-2">
                <span className="text-[10px] font-bold text-slate-300 block">📱 Adım Adım Evrensel Kurulum:</span>
                <ul className="text-[11px] text-slate-400 space-y-1.5 list-disc pl-4 leading-relaxed">
                  <li>Uygulamanızı oluşturduktan sonra çıkan <strong>"Evrensel APK"</strong> indirme linkine basın.</li>
                  <li>Telefonunuza inen dosyayı açın (Eğer tarayıcınız "Bilinmeyen kaynaklardan uygulama yükle" uyarısı verirse izin verin).</li>
                  <li>Google Play Protect uyarı verirse, kendi ürettiğiniz yerel uygulama olduğu için güvenle "Yine de yükle" deyin.</li>
                  <li>Uygulamayı açın ve ekrandaki kutucuğa 6 haneli kodunuzu girin.</li>
                  <li>Uygulamanız reklamsız, kilitli ve tam performanslı olarak hazır!</li>
                </ul>
              </div>
            </div>

            {/* Step 2: Android Studio Code compilation */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-violet-600 text-[10px] font-bold flex items-center justify-center text-white">2</span>
                Yol: Kendi Kotlin Kodunuzla APK Üretmek (Geliştirici Yolu)
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed pl-7">
                Uygulamanızın tüm kodları size aittir. <strong>"Kotlin Projesi (ZIP)"</strong> indirerek, kendi imzaladığınız bağımsız APK dosyasını doğrudan Google Play Store veya web sitenizde yayınlayabilirsiniz.
              </p>
              <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-4 ml-7 space-y-2">
                <span className="text-[10px] font-bold text-slate-300 block">💻 Projeyi Android Studio'da Açma:</span>
                <ul className="text-[11px] text-slate-400 space-y-1.5 list-disc pl-4 leading-relaxed">
                  <li>İndirdiğiniz ZIP dosyasını bilgisayarınızda bir klasöre çıkartın.</li>
                  <li><strong>Android Studio (Jellyfish+)</strong> programını açın ve `Open Project` ile bu klasörü seçin.</li>
                  <li>Gradle yükleme işleminin tamamlanmasını bekleyin. Sizin için tüm ikon resimleri, WebView motorları, tam ekran kodları ve native reklam engelleyici kütüphaneleri otomatik eklenmiştir.</li>
                  <li>Telefonunuzu USB ile bağlayıp üst bardaki yeşil <strong>Run (Çalıştır)</strong> butonuna basarak anında test edebilirsiniz.</li>
                  <li>Menüden <code className="bg-slate-950 px-1 py-0.5 rounded text-violet-400 font-mono text-[9px]">Build &gt; Generate Signed Bundle / APK</code> diyerek kendi şifreli güvenlik anahtarınızla mağazaya hazır imzalı reklamsız APK dosyanızı çıkarabilirsiniz!</li>
                </ul>
              </div>
            </div>

            {/* Step 3: PWA Installation */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-cyan-600 text-[10px] font-bold flex items-center justify-center text-white">3</span>
                Yol: Sitenizi PWA (İleri Düzey Web Uygulaması) Olarak Sunma
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed pl-7">
                Kullanıcıların telefonlarına hiçbir APK kurmadan, doğrudan web sitenize girdiklerinde "Bu siteyi ana ekrana ekle" butonuyla reklamsız bağımsız bir tarayıcı uygulaması olarak kurmalarını sağlar. Hem Android hem iOS (Safari) cihazlarda %100 uyumludur!
              </p>
              <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-4 ml-7 space-y-2">
                <span className="text-[10px] font-bold text-slate-300 block">🌐 PWA Dosyalarını Sitenize Ekleme:</span>
                <ul className="text-[11px] text-slate-400 space-y-1.5 list-disc pl-4 leading-relaxed">
                  <li>İndirdiğiniz <strong>PWA Manifest Paketi</strong> ZIP dosyasını açın.</li>
                  <li>İçindeki <code className="bg-slate-950 px-1 py-0.5 rounded text-cyan-400 font-mono text-[9px]">manifest.json</code>, <code className="bg-slate-950 px-1 py-0.5 rounded text-cyan-400 font-mono text-[9px]">sw.js</code> ve ikon resimlerini web sitenizin kök klasörüne (public) yükleyin.</li>
                  <li>Sitenizin ana index.html dosyasının head kısmına manifest linkini ekleyin (ZIP içindeki README.txt içinde kodlar yer almaktadır).</li>
                  <li>Artık sitenize mobil cihazlardan giren herkes tek tuşla sitenizi tam performanslı bir mobil uygulamaya dönüştürebilir!</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {activeTab === "history" && (
          <div className="max-w-4xl mx-auto bg-slate-950 border border-slate-900 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6 animate-fadeIn">
            <div className="border-b border-slate-900 pb-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <History className="text-blue-500" size={18} /> Son Üretilen Uygulamalar ve Derleme Geçmişi
              </h2>
              <p className="text-xs text-slate-400 mt-1">Sunucuda kayıtlı en son oluşturulan mobil web uygulamaları.</p>
            </div>

            {recentConfigs.length === 0 ? (
              <div className="text-center py-12 text-slate-500 border border-dashed border-slate-900 rounded-2xl">
                <Info size={24} className="mx-auto mb-2 text-slate-600" />
                <p className="text-xs">Henüz hiçbir uygulama derlenmedi. İlk uygulamanızı Panel sekmesinden oluşturun!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentConfigs.map((config) => (
                  <div
                    key={config.id}
                    className="p-4 bg-slate-900/30 border border-slate-900 hover:border-slate-800 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all"
                  >
                    <div className="flex items-center gap-4 overflow-hidden">
                      <div className="w-14 h-14 bg-slate-950 rounded-2xl p-1 border border-slate-800 flex items-center justify-center flex-shrink-0 shadow">
                        <div className="w-full h-full" dangerouslySetInnerHTML={{ __html: config.icon }} />
                      </div>

                      <div className="overflow-hidden space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-extrabold text-sm text-white truncate">{config.name}</h4>
                          <span className="text-[9px] bg-blue-950 border border-blue-900/40 text-blue-400 font-mono px-2 py-0.5 rounded-full">
                            KOD: {config.id}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 font-mono truncate">{config.url}</p>
                        <span className="text-[8px] text-slate-500 block">
                          Tarih: {config.createdAt ? new Date(config.createdAt).toLocaleString("tr-TR") : "Yayınlanmadı"}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setAppName(config.name);
                        setTargetUrl(config.url);
                        if (config.packageName) setPackageName(config.packageName);
                        setOptions(config.options);
                        setBuiltConfig(config);
                        if (config.icon.startsWith("<svg")) {
                          setAiGeneratedSvg(config.icon);
                          setSelectedIconType("ai");
                        }
                        setActiveTab("configure");
                        alert("Uygulama ayarları başarıyla editör paneline yüklendi!");
                      }}
                      className="w-full sm:w-auto px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl font-bold text-xs text-white transition-all text-center"
                    >
                      Ayarları Yükle & Düzenle
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Premium Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-8 mt-auto text-center text-slate-500 text-xs">
        <p className="font-mono">© 2026 WebInApkNoAds Studio. Tüm hakları saklıdır.</p>
        <p className="text-[10px] text-slate-600 mt-1 font-mono uppercase tracking-widest">
          Saniyeler İçinde Güvenli Tarayıcı APK'ları Oluşturun
        </p>
      </footer>
    </div>
  );
}
