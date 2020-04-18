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

    // Settings initialization
    if(!firstTime){
        if(store.get('window.maximized')){
            currentWindow.maximize();
        }else{
            var sizes = store.get('window.size');
            currentWindow.setSize(sizes[0], sizes[1]);
            currentWindow.center();
        }
    }


    // Window controls
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

    var d = new Date();
    var month = d.getMonth()+1;
    var day = d.getDate();
    var output = (month<10 ? '0' : '') + month + '/' + (day<10 ? '0' : '') + day + '/' + d.getFullYear();
    $('.tabs .current').html('<span>' + output + '</span><span class="close"><i class="fas fa-times"></i></span>');
    $('.tabs .tab').click(function(){
        $(this).siblings('.current').find('i').css('opacity', '0');
        $(this).siblings('.current').removeClass('current');
        $(this).addClass('current');
        $(this).find('i').css('opacity', '1');
    });
    $('.tabs .tab').hover(function(){
        if(!$(this).hasClass('current')){
            $(this).find('i').css('opacity', '1');
        }
    },
    function(){
        if(!$(this).hasClass('current')){
            $(this).find('i').css('opacity', '0');
        }
    });

});
