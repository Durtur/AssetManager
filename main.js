// Modules to control application life and create native browser window
const { app, Menu, BrowserWindow } = require('electron')
const { ipcMain } = require('electron')
const { autoUpdater } = require('electron-updater');

var updatePending = false;
autoUpdater.on('update-available', () => {
  mainWindow.webContents.send('update_available');
});
autoUpdater.on('update-downloaded', () => {
  mainWindow.webContents.send('update_downloaded');
  updatePending = true;
});

const template = [
  {
    label: 'Edit',
    submenu: [
      { role: 'undo' },
      { role: 'redo' },
      { type: 'separator' },
      { role: 'cut' },
      { role: 'copy' },
      { role: 'paste' },
      { role: 'pasteandmatchstyle' },
      { role: 'delete' },
      { role: 'selectall' }
    ]
  },
  {
    label: 'View',
    submenu: [
      { role: 'reload' },
      { role: 'forcereload' },
      { role: 'toggledevtools' },
      { type: 'separator' },
      { role: 'resetzoom' },
      { role: 'zoomin' },
      { role: 'zoomout' },
      { type: 'separator' },
      { role: 'togglefullscreen' }
    ]
  },
  {
    role: 'window',
    submenu: [
      { role: 'minimize' },
      { role: 'close' }
    ]
  },
  {
    role: 'help',
    submenu: [
      {
        label: 'Learn More',
        click() { require('electron').shell.openExternal('https://electronjs.org') }
      }
    ]
  }
]


// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow
var usersWindow;
var loggedAsAdmin;

function createWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1200, height: 800, fullscreen: false, frame: false, webPreferences: {
      nodeIntegration: true,
    },
  })


  if (process.platform === 'darwin') {
    template.unshift({
      label: app.getName(),
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideothers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    })

    // Edit menu
    template[1].submenu.push(
      { type: 'separator' },
      {
        label: 'Speech',
        submenu: [
          { role: 'startspeaking' },
          { role: 'stopspeaking' }
        ]
      }
    )

    // Window menu
    template[3].submenu = [
      { role: 'close' },
      { role: 'minimize' },
      { role: 'zoom' },
      { type: 'separator' },
      { role: 'front' }
    ]
  }
  process.on('uncaughtException', function (error) {
    console.log(error)
  });
  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
  // Emitted when the window is closed.
  console.log("Starting")
  // and load the index.html of the app.
  mainWindow.loadFile('index.html')
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null
    if (updatePending)
      autoUpdater.quitAndInstall();
  })
}


app.on('ready', () => {
  createWindow();
  autoUpdater.checkForUpdatesAndNotify();

});

ipcMain.on('request-admin-info', function () {
  sendUsersWindowAdminInfo();
});
ipcMain.on('open-users-window', function (event, adminAccess) {
  if (!adminAccess) return;
  if (usersWindow) {
    usersWindow.focus();
    usersWindow.webContents.send("admin-access-sent", loggedAsAdmin);
    return;
  }
  loggedAsAdmin = adminAccess;

  usersWindow = new BrowserWindow({
    height: 600,
    resizable: true,
    width: 1200,
    webPreferences: {
      nodeIntegration: true,
    },
  });

  usersWindow.loadFile('users.html');
  usersWindow.webContents.send("admin-access-sent", loggedAsAdmin);
  usersWindow.on('closed', function () {
    usersWindow = null;
  });
});

function sendUsersWindowAdminInfo() {
  usersWindow.webContents.send("admin-access-sent", loggedAsAdmin);
}

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', function () {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
