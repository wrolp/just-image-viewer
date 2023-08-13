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
import { PageInfo, ImgItem } from '@/types/common'
import { readConfigFile, writeConfigFile, Path, OpenType } from '@/config'

let mainWindow: BrowserWindow | null
const appConfig = readConfigFile()

let currentOpenType: OpenType = 'archive'

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

interface ImageItem {
  filename: string
  createTime: number
}

ipcMain.handle('close-window', () => mainWindow && mainWindow.close())
ipcMain.handle('minimize-window', () => mainWindow && mainWindow.minimize())
ipcMain.handle('maximize-window', () => mainWindow && mainWindow.maximize())
ipcMain.handle('restore-window', () => mainWindow && mainWindow.restore())

let files: JSZip.JSZipObject[] | ImageItem[] = []
let totalFiles: ImageItem[] = []

let currentPage = 0
const pageSize = 50
let maxPageIndex = 0
let dir = appConfig.history.currentDir
let searchTerm = ''
let desc = true
let sort = 'bytime'

const sendImageData = (sender: WebContents) => {
  const start = currentPage * pageSize
  const end = (currentPage + 1) * pageSize
  if (currentOpenType === 'archive' && files.length > 0) {
    for (let i = start; i < end; i++) {
      if (i > files.length - 1) {
        break
      }
      const file = files[i] as JSZip.JSZipObject
      file.async('base64').then((content: string) => {
        sender.send('image-content', {
          filename: file.name,
          image: 'data:image/png;base64,' + content
        } as ImgItem)
      })
    }
  } else if (currentOpenType === 'folder' && files.length > 0) {
    const page = files.slice(start, end) as ImageItem[]
    const imageItems = page.map((imageItem: ImageItem) => {
      return {
        filename: imageItem.filename,
        image: dir + '/' + imageItem.filename
      } as ImgItem
    })
    sender.send('image-list', imageItems)
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
        (files as JSZip.JSZipObject[]).push(file)
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
  sender.send('update-history', history.paths)
  debounce(() => writeConfigFile(appConfig), 500)()
}

const openArchiveFile = (sender: WebContents, filePath: string) => {
  console.log(`open file: ${filePath}`)
  const lastIndexOfSep = filePath.lastIndexOf(sep)
  dir = filePath.substring(0, lastIndexOfSep)

  const index = filePath.lastIndexOf('.')
  const filename = filePath.substring(lastIndexOfSep + 1, index)
  sender.send('shortname', filename)
  readZipFile(sender, filePath)

  currentOpenType = 'archive'

  updateHistory(sender, dir, {
    shortname: filename,
    fullpath: filePath,
    type: 'archive'
  })
}

const openFolder = (sender: WebContents, dirPath: string) => {
  console.log(`open folder: ${dirPath}`)

  dir = dirPath
  const lastIndexOfSep = dirPath.lastIndexOf(sep)
  const shortname = dirPath.substring(lastIndexOfSep + 1)
  sender.send('shortname', shortname)

  fs.readdir(dir, async (err: NodeJS.ErrnoException | null, fileItems: string[]) => {
    if (err) {
      console.error(err)
      return
    }

    const images = fileItems.filter((v: string) => {
      return (
        v.endsWith('jpg') ||
        v.endsWith('JPG') ||
        v.endsWith('png') ||
        v.endsWith('PNG') ||
        v.endsWith('jpeg') ||
        v.endsWith('JPEG') ||
        v.endsWith('webp') ||
        v.endsWith('WEBP')
      )
    })

    const imageItems: ImageItem[] = []
    for (let i = 0; i < images.length; i++) {
      const stats = fs.statSync(dir + '/' + images[i])
      imageItems.push({
        filename: images[i],
        createTime: stats.birthtime.getTime()
      })
    }
    totalFiles = JSON.parse(JSON.stringify(imageItems))
    resort()
    search()

    maxPageIndex = Math.floor(files.length / pageSize)
    logPageInfo(sender)
    sendImageData(sender)
  })

  currentOpenType = 'folder'

  updateHistory(sender, dir, {
    shortname,
    fullpath: dirPath,
    type: 'folder'
  })
}

ipcMain.handle('window-ready', (event: IpcMainInvokeEvent) => {
  event.sender.send('update-history', appConfig.history.paths)
})

ipcMain.handle('open-archive', (event: IpcMainInvokeEvent) => {
  mainWindow && dialog.showOpenDialog(mainWindow, {
    title: 'Select a Archive File',
    defaultPath: dir,
    filters: [{ name: 'zip', extensions: ['zip'] }]
  }).then((value: OpenDialogReturnValue) => {
    if (value.filePaths.length > 0) {
      openArchiveFile(event.sender, value.filePaths[0])
    }
  })
})

ipcMain.handle('open-folder', (event: IpcMainInvokeEvent) => {
  mainWindow && dialog.showOpenDialog(mainWindow, {
    title: 'Select a Folder',
    defaultPath: dir,
    properties: ['openDirectory']
  }).then((value: OpenDialogReturnValue) => {
    if (value.filePaths.length > 0) {
      openFolder(event.sender, value.filePaths[0])
    }
  })
})

ipcMain.handle('open-history', (event: IpcMainInvokeEvent, type: OpenType, path: string) => {
  if (type === 'archive') {
    openArchiveFile(event.sender, path)
  } else {
    openFolder(event.sender, path)
  }
})

ipcMain.handle('search', (event: IpcMainInvokeEvent, term: string) => {
  console.log(term)

  searchTerm = term.trim()

  search()

  currentPage = 0
  maxPageIndex = Math.floor(files.length / pageSize)

  logPageInfo(event.sender)
  sendImageData(event.sender)
})

ipcMain.handle('sort', (event: IpcMainInvokeEvent, type: string) => {
  console.log(type)
  sort = type
  resort()
  search()
  logPageInfo(event.sender)
  sendImageData(event.sender)
})

ipcMain.handle('direction', (event: IpcMainInvokeEvent, direction: string) => {
  console.log(direction)
  desc = direction === 'desc'
  resort()
  search()
  logPageInfo(event.sender)
  sendImageData(event.sender)
})

const search = () => {
  if (searchTerm) {
    files = (totalFiles as ImageItem[]).filter((item: ImageItem) => {
      return item.filename.toLocaleLowerCase().indexOf(searchTerm.toLocaleLowerCase()) > -1
    })
  } else {
    files = JSON.parse(JSON.stringify(totalFiles))
  }
}

const resort = () => {
  totalFiles = totalFiles.sort((a, b) => {
    if (sort === 'bytime') {
      if (a.createTime > b.createTime) {
        return desc ? -1 : 1
      } else {
        return desc ? 1 : -1
      }
    } else if (sort === 'byname') {
      if (a.filename.localeCompare(b.filename) > 0) {
        return desc ? -1 : 1
      } else {
        return desc ? 1 : -1
      }
    }
    return 0
  })
}

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
