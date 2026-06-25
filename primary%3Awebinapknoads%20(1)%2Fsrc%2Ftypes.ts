export interface AppOptions {
  lockToDomain: boolean;
  enableAdBlocker: boolean;
  fullscreen: boolean;
  pullToRefresh: boolean;
  zoomControls: boolean;
  keepScreenOn: boolean;
  customUserAgent: string;
}

export interface AppConfig {
  id?: string;
  name: string;
  url: string;
  icon: string; // Base64 or SVG string
  options: AppOptions;
  packageName?: string;
  createdAt?: string;
}

export interface BlockedAdLog {
  id: string;
  timestamp: string;
  url: string;
  type: "tracker" | "popunder" | "banner" | "video";
}
