// ══════════════════════════════════════════════════════════════
// NEON DELIVERY — PWA Service v3 (Full Install, Notifications, iOS/Android)
// Dynamic PNG icon generation, iOS splash screens,
// beforeinstallprompt + iOS manual install support
// ══════════════════════════════════════════════════════════════

// ═══ SERVICE WORKER REGISTRATION ═══
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) {
    console.log('[PWA] Service Worker not supported');
    return null;
  }

  try {
    const probe = await fetch('/sw.js', { method: 'HEAD' }).catch(() => null);
    const contentType = probe?.headers?.get('content-type') || '';
    if (!probe || !probe.ok || !contentType.includes('javascript')) {
      console.log('[PWA] sw.js not available (status:', probe?.status, ') — skipping');
      return null;
    }

    const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    console.log('[PWA] Service Worker registered:', registration.scope);

    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'activated') {
            console.log('[PWA] New Service Worker activated');
          }
        });
      }
    });

    return registration;
  } catch (error) {
    console.log('[PWA] Service Worker registration skipped:', error);
    return null;
  }
}

// ═══ INSTALL PROMPT ═══
let deferredPrompt: any = null;
let installCallbacks: Array<(canInstall: boolean) => void> = [];

export function setupInstallPrompt(callback: (canInstall: boolean) => void) {
  installCallbacks.push(callback);

  window.addEventListener('beforeinstallprompt', (e: Event) => {
    e.preventDefault();
    deferredPrompt = e;
    console.log('[PWA] Install prompt captured');
    installCallbacks.forEach(cb => cb(true));
  });

  window.addEventListener('appinstalled', () => {
    console.log('[PWA] App installed successfully!');
    deferredPrompt = null;
    installCallbacks.forEach(cb => cb(false));
    localStorage.setItem('pwa-installed', 'true');
    localStorage.setItem('pwa-installed-at', Date.now().toString());
  });
}

export async function promptInstall(): Promise<boolean> {
  if (!deferredPrompt) {
    console.log('[PWA] No install prompt available');
    return false;
  }

  try {
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log('[PWA] Install outcome:', outcome);
    deferredPrompt = null;
    return outcome === 'accepted';
  } catch (error) {
    console.error('[PWA] Install prompt error:', error);
    return false;
  }
}

export function canPromptInstall(): boolean {
  return !!deferredPrompt;
}

export function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true ||
    document.referrer.includes('android-app://')
  );
}

export function isInstalled(): boolean {
  return isStandalone() || localStorage.getItem('pwa-installed') === 'true';
}

// ═══ PLATFORM DETECTION ═══
export function getPlatform(): 'ios' | 'android' | 'desktop' {
  const ua = navigator.userAgent || '';
  if (/iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) {
    return 'ios';
  }
  if (/Android/.test(ua)) {
    return 'android';
  }
  return 'desktop';
}

export function getBrowser(): 'chrome' | 'safari' | 'firefox' | 'edge' | 'samsung' | 'other' {
  const ua = navigator.userAgent || '';
  if (/SamsungBrowser/.test(ua)) return 'samsung';
  if (/Edg\//.test(ua)) return 'edge';
  if (/Chrome/.test(ua) && !/Edg/.test(ua)) return 'chrome';
  if (/Safari/.test(ua) && !/Chrome/.test(ua)) return 'safari';
  if (/Firefox/.test(ua)) return 'firefox';
  return 'other';
}

export function canAutoPrompt(): boolean {
  const browser = getBrowser();
  // These browsers support beforeinstallprompt
  return ['chrome', 'edge', 'samsung'].includes(browser);
}

// ═══ PUSH NOTIFICATIONS ═══
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    console.log('[PWA] Notifications not supported');
    return 'denied';
  }

  if (Notification.permission === 'granted') return 'granted';

  const permission = await Notification.requestPermission();
  console.log('[PWA] Notification permission:', permission);
  return permission;
}

export async function subscribeToPush(registration: ServiceWorkerRegistration): Promise<PushSubscription | null> {
  if (!('PushManager' in window)) {
    console.log('[PWA] Push not supported');
    return null;
  }

  try {
    let subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      console.log('[PWA] Already subscribed to push');
      return subscription;
    }

    const vapidKey = await getServerVapidKey();
    if (!vapidKey) {
      console.log('[PWA] No VAPID key available');
      return null;
    }

    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey),
    });

    console.log('[PWA] Push subscription created');
    return subscription;
  } catch (error) {
    console.log('[PWA] Push subscription failed:', error);
    return null;
  }
}

async function getServerVapidKey(): Promise<string | null> {
  try {
    const { projectId, publicAnonKey } = await import('/utils/supabase/info');
    const res = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-42377006/push/vapid-key`,
      {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
      }
    );
    const data = await res.json();
    if (data.success && data.publicKey) return data.publicKey;
    return null;
  } catch (e) {
    console.error('[PWA] Failed to get VAPID key:', e);
    return null;
  }
}

export async function registerPushSubscription(username: string): Promise<boolean> {
  try {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return false;

    const permission = await requestNotificationPermission();
    if (permission !== 'granted') return false;

    const registration = await navigator.serviceWorker.ready;
    const subscription = await subscribeToPush(registration);
    if (!subscription) return false;

    const { projectId, publicAnonKey } = await import('/utils/supabase/info');
    const res = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-42377006/push/subscribe`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, subscription: subscription.toJSON() }),
      }
    );
    const data = await res.json();

    if (data.success) {
      console.log(`[PWA] Push registered for ${username}`);
      localStorage.setItem('push-registered-user', username);
      return true;
    }
    return false;
  } catch (error) {
    console.error('[PWA] Error registering push:', error);
    return false;
  }
}

export async function unregisterPushSubscription(username: string): Promise<void> {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      const { projectId, publicAnonKey } = await import('/utils/supabase/info');
      await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-42377006/push/unsubscribe`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ username, endpoint: subscription.endpoint }),
        }
      );
    }
    localStorage.removeItem('push-registered-user');
  } catch (e) {
    console.error('[PWA] Error unregistering push:', e);
  }
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// ═══ LOCAL NOTIFICATIONS ═══
export async function showLocalNotification(
  title: string,
  body: string,
  url?: string,
  tag?: string
) {
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'SHOW_NOTIFICATION',
      title,
      body,
      url,
      tag,
    });
    return;
  }

  if (Notification.permission === 'granted') {
    new Notification(title, {
      body,
      icon: '/icons/icon.svg',
      badge: '/icons/icon.svg',
      tag: tag || 'neon-' + Date.now(),
      vibrate: [200, 100, 200],
      silent: false,
    } as any);
  }
}

// ═══ DEVICE PERMISSIONS ═══
export async function requestCameraPermission(): Promise<boolean> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    stream.getTracks().forEach((track) => track.stop());
    return true;
  } catch { return false; }
}

export async function requestMicrophonePermission(): Promise<boolean> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach((track) => track.stop());
    return true;
  } catch { return false; }
}

export async function requestLocationPermission(): Promise<boolean> {
  return new Promise((resolve) => {
    if (!('geolocation' in navigator)) { resolve(false); return; }
    navigator.geolocation.getCurrentPosition(
      () => resolve(true),
      () => resolve(false),
      { timeout: 10000 }
    );
  });
}

export type PermissionStatus = 'granted' | 'denied' | 'prompt' | 'unsupported';

export async function checkPermissions(): Promise<{
  camera: PermissionStatus;
  microphone: PermissionStatus;
  location: PermissionStatus;
  notifications: PermissionStatus;
}> {
  const result = {
    camera: 'prompt' as PermissionStatus,
    microphone: 'prompt' as PermissionStatus,
    location: 'prompt' as PermissionStatus,
    notifications: 'prompt' as PermissionStatus,
  };

  try {
    if ('permissions' in navigator) {
      const [cam, mic, geo] = await Promise.allSettled([
        navigator.permissions.query({ name: 'camera' as PermissionName }),
        navigator.permissions.query({ name: 'microphone' as PermissionName }),
        navigator.permissions.query({ name: 'geolocation' as PermissionName }),
      ]);
      if (cam.status === 'fulfilled') result.camera = cam.value.state as PermissionStatus;
      if (mic.status === 'fulfilled') result.microphone = mic.value.state as PermissionStatus;
      if (geo.status === 'fulfilled') result.location = geo.value.state as PermissionStatus;
    }
  } catch {}

  if ('Notification' in window) {
    result.notifications = Notification.permission as PermissionStatus;
  } else {
    result.notifications = 'unsupported';
  }

  return result;
}

// ═══ BACKGROUND SYNC ═══
export async function registerBackgroundSync(tag: string): Promise<boolean> {
  try {
    const registration = await navigator.serviceWorker.ready;
    if ('sync' in registration) {
      await (registration as any).sync.register(tag);
      return true;
    }
  } catch {}
  return false;
}

export async function registerPeriodicSync(tag: string, minInterval: number): Promise<boolean> {
  try {
    const registration = await navigator.serviceWorker.ready;
    if ('periodicSync' in registration) {
      const status = await navigator.permissions.query({
        name: 'periodic-background-sync' as PermissionName,
      });
      if (status.state === 'granted') {
        await (registration as any).periodicSync.register(tag, { minInterval });
        return true;
      }
    }
  } catch {}
  return false;
}

// ═══ WAKE LOCK ═══
let wakeLock: any = null;

export async function requestWakeLock(): Promise<boolean> {
  try {
    if ('wakeLock' in navigator) {
      wakeLock = await (navigator as any).wakeLock.request('screen');
      wakeLock.addEventListener('release', () => console.log('[PWA] Wake lock released'));
      return true;
    }
  } catch {}
  return false;
}

// ═══ GENERATE PWA ICONS (Canvas-based PNG) ═══
export function generateIcon(size: number): string {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Background gradient
  const bg = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  bg.addColorStop(0, '#1a1a2e');
  bg.addColorStop(1, '#0a0a0f');
  ctx.fillStyle = bg;

  // Rounded rect
  const r = size * 0.15;
  ctx.beginPath();
  ctx.moveTo(r, 0);
  ctx.lineTo(size - r, 0);
  ctx.quadraticCurveTo(size, 0, size, r);
  ctx.lineTo(size, size - r);
  ctx.quadraticCurveTo(size, size, size - r, size);
  ctx.lineTo(r, size);
  ctx.quadraticCurveTo(0, size, 0, size - r);
  ctx.lineTo(0, r);
  ctx.quadraticCurveTo(0, 0, r, 0);
  ctx.closePath();
  ctx.fill();

  // Outer glow circle
  const cx = size / 2;
  const cy = size * 0.40;
  const cr = size * 0.28;

  ctx.beginPath();
  ctx.arc(cx, cy, cr + 4, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(0, 240, 255, 0.15)';
  ctx.lineWidth = size * 0.02;
  ctx.stroke();

  // Main neon circle
  ctx.beginPath();
  ctx.arc(cx, cy, cr, 0, Math.PI * 2);
  ctx.strokeStyle = '#00f0ff';
  ctx.lineWidth = size * 0.025;
  ctx.shadowColor = '#00f0ff';
  ctx.shadowBlur = size * 0.08;
  ctx.stroke();

  // Lightning bolt
  ctx.fillStyle = '#00f0ff';
  ctx.shadowBlur = size * 0.06;
  const s = size * 0.13;
  ctx.beginPath();
  ctx.moveTo(cx - s * 0.1, cy - s * 0.9);
  ctx.lineTo(cx + s * 0.5, cy - s * 0.9);
  ctx.lineTo(cx + s * 0.05, cy - s * 0.05);
  ctx.lineTo(cx + s * 0.55, cy - s * 0.05);
  ctx.lineTo(cx - s * 0.15, cy + s * 1.1);
  ctx.lineTo(cx + s * 0.2, cy + s * 0.15);
  ctx.lineTo(cx - s * 0.35, cy + s * 0.15);
  ctx.closePath();
  ctx.fill();

  // Reset shadow
  ctx.shadowBlur = 0;
  ctx.shadowColor = 'transparent';

  // "NEON" text
  ctx.fillStyle = '#00f0ff';
  ctx.font = `bold ${size * 0.13}px -apple-system, BlinkMacSystemFont, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('NEON', cx, size * 0.76);

  // "DELIVERY" text
  ctx.fillStyle = '#8b5cf6';
  ctx.font = `600 ${size * 0.075}px -apple-system, BlinkMacSystemFont, sans-serif`;
  ctx.fillText('DELIVERY', cx, size * 0.88);

  // Corner accents
  ctx.strokeStyle = '#00f0ff';
  ctx.lineWidth = size * 0.005;
  ctx.globalAlpha = 0.4;
  const m = size * 0.08;
  const al = size * 0.06;

  ctx.beginPath();
  ctx.moveTo(m, m + al); ctx.lineTo(m, m); ctx.lineTo(m + al, m);
  ctx.stroke();
  ctx.strokeStyle = '#8b5cf6';
  ctx.beginPath();
  ctx.moveTo(size - m - al, m); ctx.lineTo(size - m, m); ctx.lineTo(size - m, m + al);
  ctx.stroke();
  ctx.strokeStyle = '#8b5cf6';
  ctx.beginPath();
  ctx.moveTo(m, size - m - al); ctx.lineTo(m, size - m); ctx.lineTo(m + al, size - m);
  ctx.stroke();
  ctx.strokeStyle = '#00f0ff';
  ctx.beginPath();
  ctx.moveTo(size - m, size - m - al); ctx.lineTo(size - m, size - m); ctx.lineTo(size - m - al, size - m);
  ctx.stroke();

  ctx.globalAlpha = 1;

  return canvas.toDataURL('image/png');
}

// Generate splash screen for iOS
export function generateSplashScreen(width: number, height: number): string {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  // Background
  const bg = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, Math.max(width, height) / 2);
  bg.addColorStop(0, '#12121f');
  bg.addColorStop(1, '#0a0a0f');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  // Grid pattern
  ctx.strokeStyle = 'rgba(0, 240, 255, 0.03)';
  ctx.lineWidth = 1;
  for (let x = 0; x < width; x += 40) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
  }
  for (let y = 0; y < height; y += 40) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
  }

  const cx = width / 2;
  const cy = height * 0.4;
  const iconSize = Math.min(width, height) * 0.2;

  // Outer ring glow
  ctx.beginPath();
  ctx.arc(cx, cy, iconSize * 0.7, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(0, 240, 255, 0.2)';
  ctx.lineWidth = 3;
  ctx.stroke();

  // Main neon circle
  ctx.beginPath();
  ctx.arc(cx, cy, iconSize * 0.6, 0, Math.PI * 2);
  ctx.strokeStyle = '#00f0ff';
  ctx.lineWidth = 3;
  ctx.shadowColor = '#00f0ff';
  ctx.shadowBlur = 30;
  ctx.stroke();

  // Lightning bolt
  ctx.fillStyle = '#00f0ff';
  ctx.shadowBlur = 20;
  const s = iconSize * 0.35;
  ctx.beginPath();
  ctx.moveTo(cx - s * 0.1, cy - s * 0.9);
  ctx.lineTo(cx + s * 0.5, cy - s * 0.9);
  ctx.lineTo(cx + s * 0.05, cy - s * 0.05);
  ctx.lineTo(cx + s * 0.55, cy - s * 0.05);
  ctx.lineTo(cx - s * 0.15, cy + s * 1.1);
  ctx.lineTo(cx + s * 0.2, cy + s * 0.15);
  ctx.lineTo(cx - s * 0.35, cy + s * 0.15);
  ctx.closePath();
  ctx.fill();

  ctx.shadowBlur = 0;
  ctx.shadowColor = 'transparent';

  // "NEON" text
  ctx.fillStyle = '#00f0ff';
  ctx.font = `bold ${iconSize * 0.45}px -apple-system, BlinkMacSystemFont, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('NEON', cx, cy + iconSize * 0.95);

  // "DELIVERY" text
  ctx.fillStyle = '#8b5cf6';
  ctx.font = `600 ${iconSize * 0.25}px -apple-system, BlinkMacSystemFont, sans-serif`;
  ctx.fillText('DELIVERY', cx, cy + iconSize * 1.3);

  // Loading bar
  const barW = width * 0.4;
  const barH = 4;
  const barY = cy + iconSize * 1.7;
  ctx.fillStyle = 'rgba(255,255,255,0.05)';
  ctx.beginPath();
  ctx.roundRect(cx - barW / 2, barY, barW, barH, 2);
  ctx.fill();

  const gradient = ctx.createLinearGradient(cx - barW / 2, 0, cx + barW / 2, 0);
  gradient.addColorStop(0, '#00f0ff');
  gradient.addColorStop(1, '#8b5cf6');
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.roundRect(cx - barW / 2, barY, barW * 0.6, barH, 2);
  ctx.fill();

  // "Carregando..." text
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.font = `400 ${iconSize * 0.12}px -apple-system, BlinkMacSystemFont, sans-serif`;
  ctx.fillText('Carregando...', cx, barY + 24);

  return canvas.toDataURL('image/png');
}

// ═══ DYNAMIC MANIFEST WITH PNG ICONS ═══
export function createDynamicManifest() {
  const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
  const icons = sizes.map((size) => ({
    src: generateIcon(size),
    sizes: `${size}x${size}`,
    type: 'image/png',
    purpose: 'any',
  }));

  // Add maskable versions
  icons.push({
    src: generateIcon(512),
    sizes: '512x512',
    type: 'image/png',
    purpose: 'maskable',
  });

  const manifest = {
    id: '/',
    name: 'NeonDelivery - Sistema de Delivery',
    short_name: 'NeonDelivery',
    description: 'Sistema completo de delivery com design dark tech futurista',
    start_url: '/?source=pwa',
    scope: '/',
    display: 'standalone',
    display_override: ['standalone', 'minimal-ui'],
    orientation: 'portrait',
    theme_color: '#00f0ff',
    background_color: '#0a0a0f',
    categories: ['business', 'food', 'shopping'],
    lang: 'pt-BR',
    prefer_related_applications: false,
    icons,
    shortcuts: [
      {
        name: 'Login',
        short_name: 'Login',
        url: '/?source=shortcut',
        icons: [{ src: generateIcon(96), sizes: '96x96', type: 'image/png' }],
      },
    ],
    launch_handler: {
      client_mode: 'navigate-existing',
    },
  };

  // Create blob URL for manifest
  const blob = new Blob([JSON.stringify(manifest)], { type: 'application/manifest+json' });
  const manifestUrl = URL.createObjectURL(blob);

  // Replace or create manifest link
  let manifestLink = document.querySelector<HTMLLinkElement>('link[rel="manifest"]');
  if (manifestLink) {
    manifestLink.href = manifestUrl;
  } else {
    manifestLink = document.createElement('link');
    manifestLink.rel = 'manifest';
    manifestLink.href = manifestUrl;
    document.head.appendChild(manifestLink);
  }

  console.log('[PWA] Dynamic manifest with PNG icons created');
  return manifestUrl;
}

// ═══ SETUP ALL PWA META TAGS AND ICONS ═══
export function generateAndCacheIcons() {
  // Generate dynamic manifest with PNG icons
  createDynamicManifest();

  // Favicon
  const faviconUrl = generateIcon(32);
  let favicon = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
  if (favicon) {
    favicon.href = faviconUrl;
  } else {
    favicon = document.createElement('link');
    favicon.rel = 'icon';
    favicon.type = 'image/png';
    favicon.href = faviconUrl;
    document.head.appendChild(favicon);
  }

  // Apple touch icon (180x180 is the recommended size)
  const appleTouchUrl = generateIcon(180);
  let appleIcon = document.querySelector<HTMLLinkElement>('link[rel="apple-touch-icon"]');
  if (appleIcon) {
    appleIcon.href = appleTouchUrl;
  } else {
    appleIcon = document.createElement('link');
    appleIcon.rel = 'apple-touch-icon';
    appleIcon.href = appleTouchUrl;
    document.head.appendChild(appleIcon);
  }

  // Additional Apple touch icon sizes
  [152, 167, 180].forEach((size) => {
    const existing = document.querySelector<HTMLLinkElement>(`link[rel="apple-touch-icon"][sizes="${size}x${size}"]`);
    if (!existing) {
      const link = document.createElement('link');
      link.rel = 'apple-touch-icon';
      link.setAttribute('sizes', `${size}x${size}`);
      link.href = generateIcon(size);
      document.head.appendChild(link);
    }
  });

  // iOS Splash screens
  const splashConfigs = [
    { w: 1170, h: 2532, media: '(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3)' }, // iPhone 12/13/14
    { w: 1284, h: 2778, media: '(device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3)' }, // iPhone 12/13/14 Pro Max
    { w: 1179, h: 2556, media: '(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3)' }, // iPhone 15 Pro
    { w: 1290, h: 2796, media: '(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3)' }, // iPhone 15 Pro Max
    { w: 750, h: 1334, media: '(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)' },  // iPhone 8
    { w: 1125, h: 2436, media: '(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3)' }, // iPhone X/XS
    { w: 828, h: 1792, media: '(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2)' },  // iPhone XR/11
    { w: 1242, h: 2688, media: '(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3)' }, // iPhone XS Max/11 Pro Max
    { w: 1668, h: 2388, media: '(device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2)' }, // iPad Pro 11"
    { w: 2048, h: 2732, media: '(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2)' }, // iPad Pro 12.9"
  ];

  // Generate splash screens lazily (only for iOS)
  if (getPlatform() === 'ios') {
    // Only generate for current device to save memory
    const dpr = window.devicePixelRatio || 1;
    const screenW = Math.round(window.screen.width * dpr);
    const screenH = Math.round(window.screen.height * dpr);

    const matchingConfig = splashConfigs.find(
      (c) => (c.w === screenW && c.h === screenH) || (c.w === screenH && c.h === screenW)
    );

    if (matchingConfig) {
      const splashUrl = generateSplashScreen(matchingConfig.w, matchingConfig.h);
      const link = document.createElement('link');
      link.rel = 'apple-touch-startup-image';
      link.href = splashUrl;
      link.setAttribute('media', matchingConfig.media);
      document.head.appendChild(link);
      console.log('[PWA] iOS splash screen generated for', matchingConfig.w, 'x', matchingConfig.h);
    } else {
      // Fallback: generate a generic splash
      const splashUrl = generateSplashScreen(screenW || 1170, screenH || 2532);
      const link = document.createElement('link');
      link.rel = 'apple-touch-startup-image';
      link.href = splashUrl;
      document.head.appendChild(link);
      console.log('[PWA] iOS fallback splash screen generated');
    }
  }

  console.log('[PWA] All icons and meta tags configured');
}
