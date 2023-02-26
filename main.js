const {app, BrowserWindow, clipboard, globalShortcut, Tray, Menu, nativeImage, ipcMain, dialog} = require('electron')

const path = require("path");
const Store = require('./resources/store')

let prevText = clipboard.readText()

app.setLoginItemSettings({ // Open application at login
    openAtLogin: true,
    enabled: true
});

const store = new Store({
    // We'll call our data file 'user-clipboard'
    configName: 'user-clipboard',
    defaults: {
        windowBounds: {width: 450, height: 305},
        history: []
    }
})

let tray = null


function createTray() {
    const trayIcon = nativeImage.createFromPath(path.join(__dirname, '/resources/16x16.png'));
    tray = new Tray(trayIcon);
    tray.setToolTip('My Tray Application')
    updateHistory()
}

let window = null;
const createWindow = () => {
    window = new BrowserWindow({
        title: "Clipboard Manager",
        width: 305,
        height: 450,
        resizable: false,
        icon: nativeImage.createFromPath(path.join(__dirname, '/resources/icon.png')),
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true,
            nativeWindowOpen: true,
        },
    });
    window.loadFile('./resources/index.html');

    setInterval(() => {

        if (clipboard.readText().trim() && prevText !== clipboard.readText()) {
            console.log(clipboard.readText())
            prevText = clipboard.readText()
            store.set('history', prevText)
            updateHistory()
        }
    }, 500)

    const copyShortcut = 'Control+Shift+C'
    if (!globalShortcut.isRegistered(copyShortcut)) {
        const ret = globalShortcut.register(copyShortcut, () => {
            if (BrowserWindow.getAllWindows().length === 0) createWindow()
            else {
                window.show()
            }

        })
        if (!ret) console.log('registration failed')
    }

    if (!tray) createTray()

}

const updateHistory = () => {
    let history = store.get('history')
    let curCopied = clipboard.readText()
    history = history.map(text => {
        return {
            label: truncateCurrentText(text),
            type: 'radio',
            checked: curCopied === text,
            click: () => {
                clipboard.writeText(text)
            }
        }
    })
    const menuTemplate = [
        {type: 'separator'},
        {role: 'quit'}
    ]
    const menu = Menu.buildFromTemplate([...history.reverse().slice(0, 10), ...menuTemplate]);
    tray.setContextMenu(menu)
    if (window) window.webContents.send('updateHistoryList')
}

function truncateCurrentText(currentText, length = 50, replaceBreakLine = true) {
    if (replaceBreakLine) currentText = currentText.trim().replace(/\n/g, '\\n')

    return (currentText.length > length) ? currentText.substring(0, length) + '...' : currentText
}

app.whenReady().then(() => {
    createWindow()

    app.on('activate', function () { // open window from dock or launchpad in Mac
        if (BrowserWindow.getAllWindows().length === 0) createWindow()
        else app.show()
    })

})

ipcMain.on('removeHistoryItem', (event, item) => {
    store.removeHistoryItem('history', item)
    updateHistory()
})

ipcMain.on('clearHistory', (event, item) => {
    dialog.showMessageBox({
        icon: path.join(__dirname, 'resources/icon.png'),
        title: 'Clear clipboard history',
        type: 'question',
        message: 'Do you really want to clear your clipboard history? This action cannot be reversed!',
        buttons: ['Yes, clear', 'No, thanks']
    }).then(clickedButton => {
        if (clickedButton.response !== 0) return
        store.clearHistory('history')
        updateHistory()
    })
})

app.on('window-all-closed', () => {

})