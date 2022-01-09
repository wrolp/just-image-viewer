
module.exports = {
    devServer: {
        port: 7823
    },
    // pages: {
    //     index: {
    //         title: 'vane',
    //         entry: 'src/main.ts',
    //         template: 'public/index.html',
    //         filename: 'index.html',
    //         chunks: ['chunk-vendors', 'chunk-common', 'index'],
    //         platform: process.platform
    //     }
    // },
    configureWebpack: {
        devtool: 'source-map'
    },
    css: {
        loaderOptions: {
            scss: {
                prependData: `@import "@/assets/scss/theme.scss";`
            }
        }
    },
    pluginOptions: {
        electronBuilder: {
            // List native deps here if they don't work
            // externals: [],

            // If you are using Yarn Workspaces, you may have multiple node_modules folders
            // List them all here so that VCP Electron Builder can find them
            // nodeModulesPath: ['./node_modules'],

            // preload: { preload: 'src/preload.js', otherPreload: 'src/preload2.js' },
            // builderOptions: {
            //     // options placed here will be merged with default configuration and passed to electron-builder
            //     publish: ['github']
            // }

            // chainWebpackMainProcess: (config) => {
            //     // Chain webpack config for electron main process only
            // },

            // chainWebpackRendererProcess: (config) => {
            //     // Chain webpack config for electron renderer process only (won't be applied to web builds)
            // },

            // // Manually disable typescript plugin for main process. Enable if you want to use regular js for the main process (src/background.js by default).
            // disableMainProcessTypescript: false,

            // // Manually enable type checking during webpack bundling for background file.
            // mainProcessTypeChecking: false,

            // // If you want to use the file:// protocol, add win.loadURL(`file://${__dirname}/index.html`) to your main process file
            // // In place of win.loadURL('app://./index.html'), and set customFileProtocol to './'
            // customFileProtocol: './',

            // removeElectronJunk: false,

            // // Provide a list of arguments that Electron will be launched with during "electron:serve",
            // // which can be accessed from the main process (src/background.js).
            // // Note that it is ignored when --debug flag is used with "electron:serve", as you must launch Electron yourself
            // // Command line args (excluding --debug, --dashboard, and --headless) are passed to Electron as well
            // mainProcessArgs: ['--arg-name', 'arg-value'],

            // outputDir: 'electron-builder-output-dir',

            // // Use this to change the entry point of your app's render process. default src/[main|index].[js|ts]
            // rendererProcessFile: 'src/myMainRenderFile.js',

            // // Provide an array of files that, when changed, will recompile the main process and restart Electron
            // // Your main process file will be added by default
            // mainProcessWatch: ['src/myFile1', 'src/myFile2'],

            // Use this to change the entrypoint of your app's main process
            // mainProcessFile: 'src/main.ts',

            nodeIntegration: true
        }
    }
}
