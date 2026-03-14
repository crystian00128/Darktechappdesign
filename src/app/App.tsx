import { RouterProvider } from "react-router";
import { router } from "./routes";
import { useEffect, useState, useCallback } from "react";
import { AnimatePresence } from "motion/react";
import * as api from "./services/api";
import {
  registerServiceWorker,
  setupInstallPrompt,
  generateAndCacheIcons,
  requestNotificationPermission,
  registerPeriodicSync,
  isStandalone,
  checkPermissions,
  registerPushSubscription,
  getPlatform,
} from "./services/pwa";
import {
  PWAInstallBanner,
  PWAMiniInstallButton,
  PermissionsModal,
  OnlineStatus,
  PWAUpdateBanner,
  PWASplashScreen,
} from "./components/pwa-install-prompt";

export default function App() {
  const [showPermissions, setShowPermissions] = useState(false);
  const [showSplash, setShowSplash] = useState(() => {
    // Show splash screen only in standalone mode (installed PWA)
    return isStandalone();
  });

  const handleSplashFinish = useCallback(() => {
    setShowSplash(false);
  }, []);

  useEffect(() => {
    // ═══ INIT DATABASE ═══
    const initDB = async () => {
      try {
        console.log("Inicializando banco de dados...");
        const response = await api.initDatabase();
        console.log("Banco inicializado:", response.message);
        console.log("Login Admin: username='admin', PIN='414243'");
      } catch (error) {
        console.error("Erro ao inicializar banco:", error);
        console.log("Use o botao 'Inicializar Banco' na tela de login");
      }
    };
    initDB();

    // ═══ PWA INITIALIZATION ═══
    const initPWA = async () => {
      console.log("[PWA] Inicializando PWA completa...");
      const platform = getPlatform();
      console.log("[PWA] Plataforma:", platform);

      // 1. Generate icons, splash screens, and dynamic manifest with PNG icons
      generateAndCacheIcons();

      // 2. Add all PWA meta tags
      addPWAMetaTags();

      // 3. Register Service Worker
      const registration = await registerServiceWorker();
      if (registration) {
        console.log("[PWA] Service Worker v3 registrado");

        // 4. Request notification permission after a delay
        setTimeout(async () => {
          const perms = await checkPermissions();
          if (perms.notifications === "prompt") {
            await requestNotificationPermission();
          }

          // Auto-register push for logged-in user
          const currentUser = localStorage.getItem("currentUser");
          if (currentUser) {
            try {
              const userData = JSON.parse(currentUser);
              if (userData.username) {
                console.log("[PWA] Auto-registering push for:", userData.username);
                await registerPushSubscription(userData.username);
              }
            } catch (e) {
              console.log("[PWA] Could not auto-register push:", e);
            }
          }
        }, 3000);

        // 5. Register periodic sync
        await registerPeriodicSync("check-notifications", 15 * 60 * 1000);

        // 6. Pre-cache app routes via SW
        if (navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({
            type: 'CACHE_URLS',
            urls: ['/', '/manifest.json', '/icons/icon.svg'],
          });
        }
      }

      // 7. Setup install prompt listener
      setupInstallPrompt((canInstall) => {
        console.log(
          canInstall
            ? "[PWA] App pode ser instalado!"
            : "[PWA] App ja instalado"
        );
      });

      // 8. Show permissions modal on first visit
      const permAsked = localStorage.getItem("pwa-permissions-asked");
      if (!permAsked) {
        setTimeout(() => {
          setShowPermissions(true);
          localStorage.setItem("pwa-permissions-asked", "true");
        }, 5000);
      }

      // 9. Log standalone mode
      if (isStandalone()) {
        console.log("[PWA] Rodando em modo standalone (PWA instalado!)");
        document.documentElement.classList.add("pwa-standalone");
      }
    };

    initPWA();
  }, []);

  return (
    <>
      {/* Splash Screen (only for installed PWA) */}
      <AnimatePresence>
        {showSplash && <PWASplashScreen onFinish={handleSplashFinish} />}
      </AnimatePresence>

      {/* Main App Router */}
      <RouterProvider router={router} />

      {/* PWA Components */}
      <PWAInstallBanner />
      <PWAMiniInstallButton />
      <OnlineStatus />
      <PWAUpdateBanner />
      <PermissionsModal
        open={showPermissions}
        onClose={() => setShowPermissions(false)}
      />
    </>
  );
}

// ═══ ADD PWA META TAGS ═══
function addPWAMetaTags() {
  const head = document.head;

  const setMeta = (name: string, content: string, property?: boolean) => {
    const attr = property ? "property" : "name";
    let tag = head.querySelector(`meta[${attr}="${name}"]`);
    if (!tag) {
      tag = document.createElement("meta");
      tag.setAttribute(attr, name);
      head.appendChild(tag);
    }
    tag.setAttribute("content", content);
  };

  // Viewport — fullscreen, safe area support
  const viewport = head.querySelector('meta[name="viewport"]');
  if (viewport) {
    viewport.setAttribute(
      "content",
      "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover"
    );
  }

  // Core PWA meta tags
  setMeta("theme-color", "#00f0ff");
  setMeta("mobile-web-app-capable", "yes");
  setMeta("application-name", "NeonDelivery");
  setMeta("msapplication-TileColor", "#0a0a0f");
  setMeta("msapplication-navbutton-color", "#00f0ff");
  setMeta("format-detection", "telephone=no");

  // iOS-specific meta tags
  setMeta("apple-mobile-web-app-capable", "yes");
  setMeta("apple-mobile-web-app-status-bar-style", "black-translucent");
  setMeta("apple-mobile-web-app-title", "NeonDelivery");
  setMeta("apple-touch-fullscreen", "yes");

  // Open Graph (for when sharing the URL)
  setMeta("og:title", "NeonDelivery - Delivery Futurista", true);
  setMeta("og:description", "Sistema completo de delivery com design neon", true);
  setMeta("og:type", "website", true);

  // Manifest link (will be replaced by dynamic manifest from pwa.ts)
  let manifest = head.querySelector('link[rel="manifest"]');
  if (!manifest) {
    manifest = document.createElement("link");
    manifest.setAttribute("rel", "manifest");
    manifest.setAttribute("href", "/manifest.json");
    manifest.setAttribute("crossorigin", "use-credentials");
    head.appendChild(manifest);
  }

  // Favicon
  let favicon = head.querySelector('link[rel="icon"]');
  if (!favicon) {
    favicon = document.createElement("link");
    favicon.setAttribute("rel", "icon");
    favicon.setAttribute("type", "image/svg+xml");
    favicon.setAttribute("href", "/icons/icon.svg");
    head.appendChild(favicon);
  }

  // Apple touch icon
  let appleIcon = head.querySelector('link[rel="apple-touch-icon"]');
  if (!appleIcon) {
    appleIcon = document.createElement("link");
    appleIcon.setAttribute("rel", "apple-touch-icon");
    appleIcon.setAttribute("href", "/icons/icon.svg");
    head.appendChild(appleIcon);
  }

  // Theme color for iOS status bar
  let themeColorDark = head.querySelector('meta[name="theme-color"][media]');
  if (!themeColorDark) {
    const meta = document.createElement("meta");
    meta.setAttribute("name", "theme-color");
    meta.setAttribute("media", "(prefers-color-scheme: dark)");
    meta.setAttribute("content", "#0a0a0f");
    head.appendChild(meta);
  }
}
