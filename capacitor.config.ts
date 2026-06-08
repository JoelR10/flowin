import type { CapacitorConfig } from "@capacitor/cli";

// Empaque móvil (M5). El build web (dist/) se envuelve en proyectos nativos.
// Pasos para generar las apps (cuando toque M5):
//   npm i -D @capacitor/cli && npm i @capacitor/core @capacitor/android @capacitor/ios
//   npm run build
//   npx cap add android   (requiere Android Studio / SDK)
//   npx cap add ios       (requiere macOS + Xcode)
//   npm run cap:sync
const config: CapacitorConfig = {
  appId: "com.jito.flowin",
  appName: "Flowin",
  webDir: "dist",
  backgroundColor: "#0a0d13",
  android: { backgroundColor: "#0a0d13" },
  ios: { contentInset: "always" }
};

export default config;
