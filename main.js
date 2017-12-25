const fs = require('fs');
const path = require('path');
const {app, BrowserWindow} = require('electron');

let mainWindow;

app.on('ready', () => {
	mainWindow = new BrowserWindow({
		height: 500,
		width: 300,
	});
	mainWindow.setMenuBarVisibility(false);
	// mainWindow.setResizable(false);
	mainWindow.setFullScreenable(false);
	mainWindow.setMaximizable(false);
	mainWindow.loadURL(path.join('file://', __dirname, 'h', 'index.htm'));

	// mainWindow.webContents.openDevTools({
	// 	detach: true,
	// });
});

app.on('window-all-closed', function () {
	app.quit();
});
