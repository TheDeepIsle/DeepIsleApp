const { app, BrowserWindow, ipcMain } = require('electron');
const { uIOhook } = require('uiohook-napi');
const path = require('path');
const { autoUpdater } = require('electron-updater');

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 775,
        height: 625,
        icon: path.join(__dirname, 'icon.ico'),
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
        },
        title: 'Deep Isle Admin',
        resizable: true,
    });
    mainWindow.loadFile('src/index.html');
    mainWindow.setMenuBarVisibility(false);
    try {
        mainWindow.setIcon(path.join(__dirname, 'icon.ico'));
    } catch {}

    autoUpdater.checkForUpdatesAndNotify();

    autoUpdater.on('update-available', () => {
        mainWindow.webContents.send('update-available');
    });

    autoUpdater.on('update-downloaded', () => {
        mainWindow.webContents.send('update-downloaded');
    });
    uIOhook.on('mousedown', (e) => {
    if (e.button === 3) mainWindow.webContents.send('ptt-down');
});
    uIOhook.on('mouseup', (e) => {
    if (e.button === 3) mainWindow.webContents.send('ptt-up');
});
uIOhook.start();
}

ipcMain.handle('open-steam-auth', async (_event, authUrl) => {
    return new Promise((resolve, reject) => {
        let settled = false;

        const authWindow = new BrowserWindow({
            width: 900,
            height: 720,
            parent: mainWindow,
            modal: true,
            autoHideMenuBar: true,
            backgroundColor: '#0f1117',
            webPreferences: {
                contextIsolation: true,
                nodeIntegration: false,
                webSecurity: true,
            },
        });

        const timer = setTimeout(() => fail(new Error('Steam login timed out')), 300000);

        const finish = value => {
            if (settled) return;
            settled = true;
            clearTimeout(timer);
            if (!authWindow.isDestroyed()) authWindow.close();
            resolve(value);
        };

        const fail = err => {
            if (settled) return;
            settled = true;
            clearTimeout(timer);
            if (!authWindow.isDestroyed()) authWindow.close();
            reject(err);
        };

        const inspectUrl = url => {
            try {
                const parsed = new URL(url);
                const code = parsed.searchParams.get('code');
                if (parsed.pathname.includes('/api/auth/steam/callback') && code) {
                    finish(code);
                    return true;
                }
            } catch {}
            return false;
        };

        const logPath = require('path').join(require('os').homedir(), 'deepisle-auth.log');

authWindow.webContents.on('will-redirect', (event, url) => {
    require('fs').appendFileSync(logPath, `will-redirect: ${url}\n`);
    if (inspectUrl(url)) event.preventDefault();
});
authWindow.webContents.on('will-navigate', (event, url) => {
    require('fs').appendFileSync(logPath, `will-navigate: ${url}\n`);
    if (inspectUrl(url)) event.preventDefault();
});
authWindow.webContents.on('did-navigate', (_event, url) => {
    require('fs').appendFileSync(logPath, `did-navigate: ${url}\n`);
    inspectUrl(url);
});

        authWindow.on('closed', () => {
            if (!settled) {
                settled = true;
                clearTimeout(timer);
                reject(new Error('Steam login cancelled'));
            }
        });

        authWindow.loadURL(authUrl).catch(fail);
    });
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});