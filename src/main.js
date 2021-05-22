const {app, BrowserWindow, ipcMain} = require('electron')
const path = require('path')

let windows = [];

function createWindow(workspaceUrl) {
    // Create the browser window.
    let win = new BrowserWindow({
        width: 800, 
        height: 600,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true
        }
    })
    win.setMenu(null)
    
    // Open the DevTools.
    win.webContents.openDevTools() 

    // and load the index.html of the app.
    win.loadURL(getAppWindowUrl(workspaceUrl));  
  
    win.on('close',(e) => {
        const {dialog} = require('electron');
 
        var isDirtyPromise = win.webContents.executeJavaScript("getWorkspaceIsDirty()");
        isDirtyPromise.then( (isDirty) => {
            if(isDirty) {
				console.log("about to show dialog");
                var resultPromise = dialog.showMessageBox({
                    message: "There is unsaved data. Are you sure you want to exit?",
                    buttons: ["Exit","Stay"]
                });
                resultPromise.then( result => {
                    if(result.response == 0) win.destroy();
                })
            }
            else {
                win.destroy();
            }
        }).catch( (msg) => {
            //just detroy
            console.log("Error in close check. Exiting");
            win.destroy();
        })
        
        //we won't close here - we will use promise result above
        e.preventDefault();
    });

    // Emitted when the window is closed.
    win.on('closed', () => {
        let index = windows.indexOf(win);
        windows.splice(index,1);
    })

    windows.push(win);
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => createWindow())

// Quit when all windows are closed.
app.on('window-all-closed', () => {
    // On macOS it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (windows.length == 0) {
        createWindow()
    }
})


ipcMain.on('request-open-workspace', (event,arg) => {
    if((arg)&&(arg.workspaceUrl)) {
        createWindow(arg.workspaceUrl);
    }
})

/** This function gets the URL to open he app window. */
function getAppWindowUrl(workspaceUrl) {
    let url = "file://" + path.join(__dirname, '../web/apogee.html');
    if(workspaceUrl) {
        url += "?url=" + workspaceUrl;
    }
    return url;
}
