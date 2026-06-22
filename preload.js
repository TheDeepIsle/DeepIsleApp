const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    openSteamAuth: (url) => ipcRenderer.invoke('open-steam-auth', url),
    onPTTDown: (cb) => ipcRenderer.on('ptt-down', cb),
    onPTTUp: (cb) => ipcRenderer.on('ptt-up', cb),
    onUpdateAvailable: (cb) => ipcRenderer.on('update-available', cb),
    onUpdateDownloaded: (cb) => ipcRenderer.on('update-downloaded', cb),
});