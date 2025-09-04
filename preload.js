const { contextBridge, ipcRenderer } = require("electron");

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld("electronAPI", {
  // App info
  getAppVersion: () => ipcRenderer.invoke("get-app-version"),
  getAppName: () => ipcRenderer.invoke("get-app-name"),

  // Menu events
  onMenuNewFile: (callback) => ipcRenderer.on("menu-new-file", callback),
  onMenuOpenFile: (callback) => ipcRenderer.on("menu-open-file", callback),
  onMenuSaveFile: (callback) => ipcRenderer.on("menu-save-file", callback),
  onMenuAbout: (callback) => ipcRenderer.on("menu-about", callback),

  // File operations (you can extend these as needed)
  openFile: () => ipcRenderer.invoke("open-file-dialog"),
  saveFile: (content) => ipcRenderer.invoke("save-file-dialog", content),

  // Remove listeners
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel),
});

// Security: Remove access to Node.js APIs
delete window.require;
delete window.exports;
delete window.module;
