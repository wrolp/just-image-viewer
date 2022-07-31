import {
  app, BrowserWindow, ipcMain,
  BrowserWindowConstructorOptions, IpcMainInvokeEvent,
  nativeTheme, dialog, OpenDialogReturnValue, WebContents
} from 'electron'
import JSZip from 'jszip'
import fs from 'fs'
import { sep } from 'path'

let mainWindow: BrowserWindow | null
const windowOptions: BrowserWindowConstructorOptions  = {
  height: 600,
  width: 800,
  webPreferences: {
    // preload: path.join(__dirname, "preload.js"),
    webSecurity: false,
    nodeIntegration: true,
    contextIsolation: false
  },
  show: false,
  frame: false,
  backgroundColor: '#000'
}

function createWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow(windowOptions)

  if (process.env.WEBPACK_DEV_SERVER_URL) {
    console.log('webpack dev server url: ', process.env.WEBPACK_DEV_SERVER_URL)
    mainWindow.loadURL(process.env.WEBPACK_DEV_SERVER_URL)
    if (!process.env.IS_TEST) {
      // Open the DevTools
      nativeTheme.themeSource = 'dark'
      mainWindow.webContents.openDevTools()
    }
  } else {
    mainWindow.loadURL('app://./index.html')
  }

  mainWindow.once('ready-to-show', () => {
        mainWindow!.show()
  })

  mainWindow.on('closed', () => { mainWindow = null })
  mainWindow.on('maximize', () => mainWindow!.webContents.send('maximized', true))
  mainWindow.on('unmaximize', () => mainWindow!.webContents.send('maximized', false))

  console.log(__dirname)
}

// ipcMain.handle('list-image-files', (event: IpcMainInvokeEvent) => {
//     event.sender.send('image-files', fileNames.slice(0, pageSize))
// })

ipcMain.handle('close-window', () => mainWindow!.close())
ipcMain.handle('minimize-window', () => mainWindow!.minimize())
ipcMain.handle('maximize-window', () => mainWindow!.maximize())
ipcMain.handle('restore-window', () => mainWindow!.restore())

// ipcMain.handle('next-page', (event: IpcMainInvokeEvent) => {
//     console.log('handle next-page')
//     if (currentPage >= Math.floor(fileNames.length / pageSize)) {
//         currentPage = 0
//     } else {
//         currentPage++
//     }
//     console.log('current page: ' + currentPage)
//     let files: string[] = fileNames.slice(currentPage * pageSize, (currentPage + 1) * pageSize)
//     event.sender.send('image-files', files)
// })

// ipcMain.handle('prev-page', (event: IpcMainInvokeEvent) => {
//     if (currentPage > 0) {
//         currentPage--;
//     } else {
//         currentPage = Math.floor(fileNames.length / pageSize)
//     }
//     let files: string[] = fileNames.slice(currentPage * pageSize, (currentPage + 1) * pageSize)
//     event.sender.send('image-files', files)
// })

let files: JSZip.JSZipObject[] = []
// let currentIndex: number = 0

let currentPage: number = 0
let pageSize: number = 10
let maxPageIndex: number = 0
let dir: string = 'C:\\'
// let zipname: string = ''

function sendImageData(sender: WebContents) {
  if (files.length > 0) {
    let start = currentPage * pageSize
    let end =  (currentPage + 1) * pageSize
    for (let i = start; i < end; i++) {
      if (i > files.length - 1) {
        break;
      }
      files[i].async('base64').then((content: string) => {
        sender.send('image-content', {
          filename: files[i].name,
          image: 'data:image/png;base64,' + content
        })
      })
    }
  }
}

function readZipFile(sender: WebContents, filePath: string): void {
  fs.readFile(filePath, (err, data: Buffer) => {
    if (err) throw err

    JSZip.loadAsync(data).then((zip: JSZip) => {
      // console.log(zip.files)
      files = []
      // currentIndex = 0
      currentPage = 0
      zip.forEach((relativePath: string, file: JSZip.JSZipObject) => {
        // console.log(relativePath)
        files.push(file)
      })
      maxPageIndex = Math.floor(files.length / pageSize)
      if (files.length % pageSize == 0) {
        maxPageIndex--
      }
      logPageInfo()
      sendImageData(sender)
    })
  })
}

function logPageInfo() {
  console.log('current page: ' + (currentPage + 1), 'page number: ' + (maxPageIndex + 1), 'size: ' + files.length)
}

ipcMain.handle('open-zip', (event: IpcMainInvokeEvent) => {
  dialog.showOpenDialog(mainWindow!, {
    title: 'Select a Zip File',
    defaultPath: dir,
    filters: [{
      name: 'zip',
      extensions: ['zip']
    }]
  }).then((value: OpenDialogReturnValue) => {
    // console.log(value)
    const filePath = value.filePaths[0]
    if (filePath) {
      console.log(filePath)
      const lastIndexOfSep = filePath.lastIndexOf(sep);
      dir = filePath.substring(0, lastIndexOfSep);

      const index = filePath.lastIndexOf(sep)
      const filename = filePath.substring(index + 1)
      const sender = event.sender
      sender.send('zip-filename', filename)
      readZipFile(sender, filePath)
    }
  })
})

ipcMain.handle('show-prev', (event: IpcMainInvokeEvent) => {
  if (currentPage > 0) {
    currentPage--;
  } else {
    currentPage = maxPageIndex
  }
  logPageInfo()
  sendImageData(event.sender)
})

ipcMain.handle('show-next', (event: IpcMainInvokeEvent) => {
  if (currentPage >= maxPageIndex) {
    currentPage = 0
  } else {
    currentPage++
  }
  logPageInfo()
  sendImageData(event.sender)
})

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {
  createWindow()

  console.log('App is ready')

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    BrowserWindow.getAllWindows().length === 0 && createWindow()

    // fs.readdir(dir, (err: any, files: string[]) => {
    //     if (err) {
    //         return console.error(err)
    //     }
    //     files.forEach((file: string) => {
    //         console.log(file)
    //     })
    // })
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.
