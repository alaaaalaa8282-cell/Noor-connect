import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      "/api": {
        target: "http://localhost:54321/functions/v1",
        changeOrigin: true,
      },
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js',
      manifestFilename: 'manifest.json',
      registerType: "autoUpdate",
      injectRegister: 'auto', // Let Vite register the SW so PWABuilder sees it
      includeAssets: [
        "favicon.png",
        "icon-192x192.png",
        "icon-512x512.png",
        "apple-touch-icon.png",
        "icon-72x72.png",
        "icon-96x96.png",
        "icon-128x128.png",
        "icon-144x144.png",
        "icon-152x152.png",
        "icon-384x384.png"
      ],
      workbox: {
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.aladhan\.com\/v1\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'prayer-times-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/www\.googleapis\.com\/youtube\/v3\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'youtube-api-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 // 1 day
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      },
      manifest: {
        id: "com.noorconnect.app.v1",
        name: "Noor Connect - Islamic Companion",
        short_name: "Noor Connect",
        description: "Prayer times, Qur'an, Qibla, Tasbeeh, and Daily Hadith. Your complete Islamic companion app.",
        theme_color: "#000000",
        background_color: "#000000",
        display: "standalone",
        orientation: "portrait",
        start_url: "/",
        scope: "/",
        categories: ["books", "education", "productivity"],
        lang: "en",
        dir: "ltr",
        shortcuts: [
          {
            name: "Radio",
            short_name: "Radio",
            description: "Listen to Quran Radio",
            url: "/quran-radio",
            icons: [{ src: "/icon-192x192.png", sizes: "192x192" }]
          },
          {
            name: "Prayer Times",
            short_name: "Prayers",
            description: "Check Prayer Times",
            url: "/dashboard",
            icons: [{ src: "/icon-192x192.png", sizes: "192x192" }]
          }
        ],
        icons: [
          {
            src: "/icon-72x72.png",
            sizes: "72x72",
            type: "image/png",
            purpose: "any"
          },
          {
            src: "/icon-96x96.png",
            sizes: "96x96",
            type: "image/png",
            purpose: "any"
          },
          {
            src: "/icon-128x128.png",
            sizes: "128x128",
            type: "image/png",
            purpose: "any"
          },
          {
            src: "/icon-144x144.png",
            sizes: "144x144",
            type: "image/png",
            purpose: "any"
          },
          {
            src: "/icon-152x152.png",
            sizes: "152x152",
            type: "image/png",
            purpose: "any"
          },
          {
            src: "/icon-192x192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any maskable"
          },
          {
            src: "/icon-384x384.png",
            sizes: "384x384",
            type: "image/png",
            purpose: "any"
          },
          {
            src: "/icon-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable"
          }
        ]
      },
      injectManifest: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff,woff2}"],
        maximumFileSizeToCacheInBytes: 5000000, // Increased for larger assets
      },
      devOptions: {
        enabled: false // Disable SW in dev to prevent caching of Vite internal files
      }
    })
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
