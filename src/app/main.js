var app = require('app') // Module to control application life.
var BrowserWindow = require('browser-window') // Module to create native browser window.

// Report crashes to our server.
//require('crash-reporter').start()

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the javascript object is GCed.
var mainWindow = null

// Quit when all windows are closed.
app.on('window-all-closed', function() {
    if (process.platform != 'darwin')
        app.quit()
})

// This method will be called when Electron has done everything
// initialization and ready for creating browser windows.
app.on('ready', function() {
    // Create the browser window.
    mainWindow = new BrowserWindow({width: 800, height: 600})

    // and load the index.html of the app.
    mainWindow.loadUrl('file://' + __dirname + '/index.html')

    // Emitted when the window is closed.
    mainWindow.on('closed', function() {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        mainWindow = null
    })
})


//Add mk file to recent docs
//app.addRecentDocument(...);

//Set mk file as represented file
//var window = new BrowserWindow({...});
//window.setRepresentedFilename(...));
//window.setDocumentEdited(true);

//Keep track of online status so we know if we can fetch remote URLs
//var alertOnlineStatus = function() {
//window.alert(navigator.onLine ? 'online' : 'offline');
//};
//window.addEventListener('online',  alertOnlineStatus);
//window.addEventListener('offline',  alertOnlineStatus);