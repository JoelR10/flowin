import type { CapacitorConfig } from "@capacitor/cli";

// Empaque móvil (M5). El build web (dist/) se envuelve en proyectos nativos.
// Pasos para generar las apps (cuando toque M5):
//   npm i -D @capacitor/cli && npm i @capacitor/core @capacitor/android @capacitor/ios
//   npm run build
//   npx cap add android   (requiere Android Studio / SDK)
//   npx cap add ios       (requiere macOS + Xcode)
//   npm run cap:sync
const config: CapacitorConfig = {
  appId: "com.flowin.app",
  appName: "Flowin",
  webDir: "dist",
  backgroundColor: "#0a0d13",
  // adjustMarginsForEdgeToEdge: Android 15+ (targetSdk 35) fuerza edge-to-edge
  // y el WebView queda DEBAJO de la status bar (header tapado, textos cortados,
  // visto en testing real). "auto" agrega los márgenes nativos correctos.
  android: { backgroundColor: "#0a0d13", adjustMarginsForEdgeToEdge: "auto" },
  ios: { contentInset: "always" }
};

export default config;
