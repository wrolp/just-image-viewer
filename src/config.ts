import fs from 'fs'
import os from 'os'

export interface Position {
  x: number
  y: number
}

export interface Size {
  w: number
  h: number
}

export interface WindowConfig {
  position: Position
  size: Size
}

export interface Path {
  shortname: string
  fullpath: string
  type: 'folder' | 'archive'
}

export interface History {
  maxCount: number
  currentDir: string
  paths: Path[]
}

export interface AppConfig {
  window: WindowConfig
  history: History
}

const configDirPath = os.homedir() + '/.just-image-viewer'
const configFilePath = configDirPath + '/config.json'

export const readConfigFile = () => {
  let appConfig: AppConfig | null = null
  try {
    const content = fs.readFileSync(configFilePath, 'utf8')
    try {
      appConfig = JSON.parse(content)
      console.log(appConfig)
    } catch (err) {
      console.log(err)
    }
  } catch (err) {
    fs.mkdir(configDirPath, { recursive: true }, err => {
      console.log(err)
    })
    const ws = fs.createWriteStream(configFilePath, 'utf8')
    ws.end()
  }
  return appConfig || {
    window: {
      position: {
        x: 0,
        y: 0
      },
      size: {
        w: 800,
        h: 600
      }
    },
    history: {
      maxCount: 20,
      currentDir: os.homedir(),
      paths: []
    }
  } as AppConfig
}

export const writeConfigFile = (config: AppConfig) => {
  fs.writeFile(configFilePath, JSON.stringify(config), 'utf-8', err => {
    err && console.log(err)
  })
}
