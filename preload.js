const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('electronAPI', {
    openSteamAuth: (url) => ipcRenderer.invoke('open-steam-auth', url),
    onPTTDown: (cb) => { ipcRenderer.removeAllListeners('ptt-down'); ipcRenderer.on('ptt-down', cb); },
    onPTTUp: (cb) => { ipcRenderer.removeAllListeners('ptt-up'); ipcRenderer.on('ptt-up', cb); },
    onUpdateAvailable: (cb) => ipcRenderer.on('update-available', cb),
    onUpdateDownloaded: (cb) => ipcRenderer.on('update-downloaded', cb),
    setPTTButton: (config) => ipcRenderer.send('set-ptt-button', config),
    getPTTButton: () => ipcRenderer.sendSync('get-ptt-button'),
    startPTTLearn: () => ipcRenderer.send('start-ptt-learn'),
    onPTTLearned: (callback) => ipcRenderer.on('ptt-learned', (_event, config) => callback(config)),
    getKeyNameMap: () => ipcRenderer.invoke('get-key-name-map'),
        const { UiohookKey } = require('uiohook-napi');
        return Object.fromEntries(Object.entries(UiohookKey).map(([name, code]) => [code, name]));
    },
});