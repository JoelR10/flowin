// Electron: app de escritorio que envuelve el build web (dist/).
// Sirve dist por un http interno (127.0.0.1) → origen real http → asset paths
// absolutos, CSP y service worker funcionan igual que en el navegador.
const { app, BrowserWindow, shell } = require("electron");
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.join(__dirname, "..", "dist");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".mjs": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".webmanifest": "application/manifest+json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".map": "application/json",
  ".txt": "text/plain"
};

function startServer() {
  return new Promise((resolve) => {
    const srv = http.createServer((req, res) => {
      let p = decodeURIComponent((req.url || "/").split("?")[0]);
      if (p === "/") p = "/index.html";
      const file = path.normalize(path.join(ROOT, p));
      if (!file.startsWith(ROOT)) {
        res.writeHead(403);
        return res.end();
      }
      fs.readFile(file, (err, data) => {
        if (err) {
          // SPA fallback (HashRouter): rutas no-archivo → index.html
          fs.readFile(path.join(ROOT, "index.html"), (e2, html) => {
            if (e2) {
              res.writeHead(404);
              return res.end("not found");
            }
            res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
            res.end(html);
          });
          return;
        }
        res.writeHead(200, {
          "Content-Type": MIME[path.extname(file)] || "application/octet-stream"
        });
        res.end(data);
      });
    });
    // Puerto FIJO para que el origen (http://127.0.0.1:35790) sea registrable
    // como "allowed origin" en Clerk y el redirect de Google OAuth vuelva bien.
    // Si está ocupado, cae a un puerto libre (login por correo igual funciona).
    const FIXED = 35790;
    srv.once("error", () => {
      if (!srv.listening) srv.listen(0, "127.0.0.1", () => resolve(srv.address().port));
    });
    srv.listen(FIXED, "127.0.0.1", () => resolve(srv.address().port));
  });
}

async function createWindow() {
  const port = await startServer();
  const win = new BrowserWindow({
    width: 1100,
    height: 780,
    minWidth: 360,
    backgroundColor: "#0a0d13",
    title: "Flowin",
    autoHideMenuBar: true,
    webPreferences: { contextIsolation: true, nodeIntegration: false }
  });
  win.removeMenu();
  // Links externos (target=_blank) → navegador del sistema, no ventana Electron.
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:/.test(url)) shell.openExternal(url);
    return { action: "deny" };
  });
  win.loadURL(`http://127.0.0.1:${port}/`);
}

// Google OAuth rechaza webviews embebidos ("disallowed_useragent"): sin el
// token Electron/x.y.z en el UA, el login con Google funciona en la ventana.
app.userAgentFallback = app.userAgentFallback
  .replace(/\sElectron\/\S+/, "")
  .replace(/\sflowin\/\S+/, "");

app.whenReady().then(createWindow);
app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
