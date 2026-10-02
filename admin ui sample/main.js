const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
    const win = new BrowserWindow({
        width: 1280,
        height: 800,
        frame: true, // This removes the default Windows/Mac title bar
        icon: path.join(__dirname, 'assets', 'logoicon.ico'), // Your custom icon path
        webPreferences: {
            nodeIntegration: true,   // Keep this true for your current code
            contextIsolation: false,  // Keep this false for your current code
            webSecurity: false       // Allows loading local images from the hard drive
        }
    });

    // Load the master list page first
    win.loadURL('http://localhost/SizzlingGrill/masterlist.html');
}

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});