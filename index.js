const { app, BrowserWindow } = require('electron/main')
const path = require('path');
const url = require('url');
var AutoLaunch = require('auto-launch');
const fs = require('fs');
const { exec } = require('child_process');




function createWindow() {
    // Create the browser window
    const mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true
        }
    });

    // Load the index.html file
    mainWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'index.html'),
        protocol: 'file:',
        slashes: true
    }));
}

// Event handler for when Electron has finished initialization
app.on('ready', createWindow);

// Quit when all windows are closed
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// Activate the app on macOS when the dock icon is clicked
app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});


app.setLoginItemSettings({
    openAtLogin: true,
    openAsHidden:false})