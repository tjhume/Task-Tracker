const { remote } = require('electron');
const currentWindow = remote.getCurrentWindow();
const Store = require('electron-store');
const store = new Store();

var firstTime = false;
if(store.get('used') == undefined){
    firstTime = true;
    store.set('window.maximized', false);
    store.set('window.size', [800, 600]);
    store.set('used', true);
}

// Document loaded
currentWindow.webContents.once('dom-ready', () => {

    // Initialization
    if(!firstTime){
        if(store.get('window.maximized')){
            currentWindow.maximize();
        }else{
            var sizes = store.get('window.size');
            currentWindow.setSize(sizes[0], sizes[1]);
            currentWindow.center();
        }
    }

    $('#close').click(function(){
        currentWindow.close();
    });
    $('#minimize').click(function(){
        currentWindow.minimize();
    });
    $('#maximize').click(function(){
        if(currentWindow.isMaximized()){
            currentWindow.unmaximize();
            store.set('window.maximized', false);
        }else{
            currentWindow.maximize();
            store.set('window.maximized', true);
        }
    });
    currentWindow.on('resize', function () {
        var size = currentWindow.getSize();
        store.set('window.size', size);
    });
});
