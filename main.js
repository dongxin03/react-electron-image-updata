const { app, BrowserWindow } = require('electron');
const path = require('path');
let mainWindow = null;
//判断命令行脚本的第二参数是否含--debug
const debug = /--debug/.test(process.argv[2]);
function makeSingleInstance () {
    if (process.mas) return;
    app.requestSingleInstanceLock();
    app.on('second-instance', () => {
        if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore()
            mainWindow.focus()
        }
    })
}
function createWindow () {
    mainWindow = new BrowserWindow({
        width: 300,
        height: 500,
        webPreferences: {
            javascript: true,
            plugins: true,
            nodeIntegration: true, // 是否集成 Nodejs
            webSecurity: false,
            preload: path.join(__dirname, './renderer.js') // 但预加载的 js 文件内仍可以使用 Nodejs 的 API
        }
    })
    mainWindow.loadURL("http://localhost:8403/"); //测试本地
    // mainWindow.loadURL(path.join('file://',__dirname,'/build/index.html')); //打包
    //接收渲染进程的信息
    const ipc = require('electron').ipcMain;
    ipc.on('min', function () {
        mainWindow.minimize();
    });
    ipc.on('max', function () {
        mainWindow.maximize();
    });
    ipc.on("login",function () {
        mainWindow.maximize();
    });
    mainWindow.on('closed', () => {
        mainWindow = null
    })
}
makeSingleInstance();
//app主进程的事件和方法
app.on('ready', () => {
    createWindow();
});
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
});
app.on('activate', () => {
    if (mainWindow === null) {
        createWindow();
    }
});
module.exports = mainWindow;