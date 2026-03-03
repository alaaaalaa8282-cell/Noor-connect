import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { localNotifications } from "@/lib/local-notifications";
import './lib/i18n-new'; // Initialize new offline-first i18n

// Initialize local notifications
localNotifications.initialize().then(success => {
  if (success) {
    console.log('Local notifications initialized');
  }
});

import { LanguageProvider } from "@/contexts/LanguageContext-new";

const rootElement = document.getElementById("root");
if (rootElement) {
  createRoot(rootElement).render(
    <LanguageProvider>
      <App />
    </LanguageProvider>
  );
} else {
  console.error("Root element not found");
}

// Service worker is handled automatically by vite-plugin-pwa (injectRegister: 'auto')
// in production. In development, we forcefully unregister to prevent console spam.
if (import.meta.env.DEV && 'serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    for (const registration of registrations) {
      registration.unregister();
      console.log('Service Worker unregistered in development mode to prevent console spam');
    }
  });
}
