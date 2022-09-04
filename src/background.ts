import { createProtocol } from 'vue-cli-plugin-electron-builder/lib'
import {
  app,
  BrowserWindow,
  ipcMain,
  BrowserWindowConstructorOptions,
  IpcMainInvokeEvent,
  nativeTheme,
  dialog,
  OpenDialogReturnValue,
  WebContents
} from 'electron'
import JSZip from 'jszip'
import fs from 'fs'
import { sep } from 'path'
import { debounce } from '@/utils/utils'
import { PageInfo } from '@/types/common'
import { readConfigFile, writeConfigFile, Path } from '@/config'

let mainWindow: BrowserWindow | null
const appConfig = readConfigFile()

let currentOpenType: 'folder' | 'archive' = 'archive'

const createWindow = () => {
  console.log(appConfig.window.position.x, appConfig.window.position.y)

  const windowOptions: BrowserWindowConstructorOptions = {
    x: appConfig.window.position.x,
    y: appConfig.window.position.y,
    width: appConfig.window.size.w,
    height: appConfig.window.size.h,
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
    createProtocol('app')
    // nativeTheme.themeSource = 'dark'
    // mainWindow.webContents.openDevTools()
    mainWindow.loadURL('app://./index.html')
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow && mainWindow.show()
  })

  mainWindow.on('closed', () => { mainWindow = null })
  mainWindow.on('maximize', () => mainWindow && mainWindow.webContents.send('maximized', true))
  mainWindow.on('unmaximize', () => mainWindow && mainWindow.webContents.send('maximized', false))
  mainWindow.on('resize', debounce(() => {
    if (mainWindow) {
      const size = mainWindow.getSize()
      appConfig.window.size.w = size[0]
      appConfig.window.size.h = size[1]
      writeConfigFile(appConfig)
    }
  }, 1000))
  mainWindow.on('move', debounce(() => {
    if (mainWindow) {
      const position = mainWindow.getPosition()
      appConfig.window.position.x = position[0]
      appConfig.window.position.y = position[1]
      writeConfigFile(appConfig)
    }
  }, 1000))

  console.log(__dirname)
}

// ipcMain.handle('list-image-files', (event: IpcMainInvokeEvent) => {
//   event.sender.send('image-files', fileNames.slice(0, pageSize))
// })

ipcMain.handle('close-window', () => mainWindow && mainWindow.close())
ipcMain.handle('minimize-window', () => mainWindow && mainWindow.minimize())
ipcMain.handle('maximize-window', () => mainWindow && mainWindow.maximize())
ipcMain.handle('restore-window', () => mainWindow && mainWindow.restore())

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

let currentPage = 0
const pageSize = 10
let maxPageIndex = 0
let dir = appConfig.history.currentDir
// let zipname: string = ''

const sendImageData = (sender: WebContents) => {
  if (files.length > 0) {
    const start = currentPage * pageSize
    const end = (currentPage + 1) * pageSize
    for (let i = start; i < end; i++) {
      if (i > files.length - 1) {
        break
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

const readZipFile = (sender: WebContents, filePath: string) => {
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
      if (files.length % pageSize === 0) {
        maxPageIndex--
      }
      logPageInfo(sender)
      sendImageData(sender)
    })
  })
}

const logPageInfo = (sender: WebContents) => {
  console.log('current page: ' + (currentPage + 1), 'page number: ' + (maxPageIndex + 1), 'size: ' + files.length)
  sender.send('page-info', {
    currentPage: currentPage + 1,
    pageNumber: maxPageIndex + 1,
    totalSize: files.length
  } as PageInfo)
}

const updateHistory = (sender: WebContents, currentDir: string, pathItem: Path) => {
  const history = appConfig.history
  history.currentDir = currentDir
  const newItems = history.paths.filter(item => item.fullpath !== pathItem.fullpath)
  newItems.unshift(pathItem)
  if (newItems.length > history.maxCount) {
    newItems.pop()
  }
  history.paths = newItems
  currentOpenType = pathItem.type
  sender.send('update-history', history.paths)
  debounce(() => writeConfigFile(appConfig), 500)()
}

ipcMain.handle('window-ready', (event: IpcMainInvokeEvent) => {
  console.log('window-ready')
  event.sender.send('update-history', appConfig.history.paths)
})

ipcMain.handle('open-archive', (event: IpcMainInvokeEvent) => {
  mainWindow && dialog.showOpenDialog(mainWindow, {
    title: 'Select a Archive File',
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
      const lastIndexOfSep = filePath.lastIndexOf(sep)
      dir = filePath.substring(0, lastIndexOfSep)

      const index = filePath.lastIndexOf('.')
      const filename = filePath.substring(lastIndexOfSep + 1, index)
      const sender = event.sender
      sender.send('zip-filename', filename)
      readZipFile(sender, filePath)

      updateHistory(sender, dir, {
        shortname: filename,
        fullpath: filePath,
        type: 'archive'
      })
    }
  })
})

ipcMain.handle('open-folder', (event: IpcMainInvokeEvent) => {
  //
})

ipcMain.handle('show-prev', (event: IpcMainInvokeEvent) => {
  if (currentPage > 0) {
    currentPage--
  } else {
    currentPage = maxPageIndex
  }
  logPageInfo(event.sender)
  sendImageData(event.sender)
})

ipcMain.handle('show-next', (event: IpcMainInvokeEvent) => {
  if (currentPage >= maxPageIndex) {
    currentPage = 0
  } else {
    currentPage++
  }
  logPageInfo(event.sender)
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
    //   if (err) {
    //     return console.error(err)
    //   }
    //   files.forEach((file: string) => {
    //     console.log(file)
    //   })
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
