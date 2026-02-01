import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { localNotifications } from "@/lib/local-notifications";

// Initialize local notifications
localNotifications.initialize().then(success => {
  if (success) {
    console.log('Local notifications initialized');
  }
});

const rootElement = document.getElementById("root");
if (rootElement) {
  createRoot(rootElement).render(<App />);
} else {
  console.error("Root element not found");
}

// Service worker is handled automatically by vite-plugin-pwa (injectRegister: 'auto')
// which ensures correct registration for production and store tools like PWABuilder.
