const { app, BrowserWindow, shell } = require('electron')
const path = require('path')

function createWindow () {
  const win = new BrowserWindow({
    width: 1200,
    height: 860,
    minWidth: 360,
    minHeight: 600,
    backgroundColor: '#F4F2EB',
    autoHideMenuBar: true,
    icon: path.join(__dirname, 'build', 'icon.ico'),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      // pozwala stronie lokalnej wolac API OpenAI (https) bez blokady CORS
      webSecurity: false
    }
  })

  win.loadFile(path.join(__dirname, 'app', 'index.html'))

  // oznacz srodowisko desktop -> w Pracowni AI zostaje samo wgrywanie (bez "Zrob zdjecie")
  win.webContents.on('did-finish-load', () => {
    win.webContents.executeJavaScript("document.documentElement.classList.add('is-desktop')")
  })

  // zewnetrzne linki (http/https) otwieraj w domyslnej przegladarce, nie w oknie aplikacji
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http')) {
      shell.openExternal(url)
      return { action: 'deny' }
    }
    return { action: 'allow' }
  })
}

app.whenReady().then(() => {
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
