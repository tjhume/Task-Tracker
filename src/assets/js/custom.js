const { remote } = require('electron');
const currentWindow = remote.getCurrentWindow();
const Store = require('electron-store');
const store = new Store();

var firstTime = false;
var counting = false;
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
        // If there is data for this date
        if(store.get(getDate)){

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

    // Create current tab and page
    var d = new Date();
    var month = d.getMonth()+1;
    var day = d.getDate();
    var output = 'Today: ' + (month<10 ? '0' : '') + month + '/' + (day<10 ? '0' : '') + day + '/' + d.getFullYear();
    $('.tabs .current').html('<span>' + output + '</span><span class="close">');
    $('.main-content .content h2').html(output);
    $('.main-content .time-wrap .time').countdown({layout : '{hnn}:{mnn}:{snn}', until : '+7200'});
    $('.main-content .time-wrap .time').countdown('pause');

    // Switching tabs
    $('.tabs .tab').click(function(){
        $(this).siblings('.current').find('i').css('opacity', '0');
        $(this).siblings('.current').removeClass('current');
        $(this).addClass('current');
        $(this).find('i').css('opacity', '1');
    });

    // Closing tab
    $('.tabs .tab i').click(function(){
        $(this).closest('.tabs').find('.tab:last-child').find('i').css('opacity', '1');
        $(this).closest('.tabs').find('.tab:last-child').addClass('current');
        $(this).closest('.tab').remove();
    });

    // Hovering tab
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

    // Add task
    $('.main-content .add-task').click(function(){
        $('.add-modal').css('display', 'block');
    });
    $('.add-modal .minutes, .add-modal .seconds').on('change', function(){
        if($(this).val() > 59){
            $(this).val('59');
        }
    });
    $('.add-modal .hours').on('change', function(){
        if($(this).val() > 23){
            $(this).val('23');
        }
    });
    $('.add-modal .fa-times').click(function(){
        $('.add-modal').css('display', 'none');
        $('.add-modal input').val('');
    });
    $('.add-modal .add-button').click(function(){
        var empty = '';
        $('.add-modal input').each(function(){
            if($(this).val() == '' && $(this).hasClass('task-name')){
                empty = 'Please enter a task name';
                return;
            }else if($(this).val() != '' && !$(this).hasClass('task-name')){
                empty = 'Please enter at least one time value';
            }
        });
        if(empty != ''){
            $('.add-modal .error').html(empty);
            $('.add-modal .error').css('display', 'block');
            return;
        }

    });

    // Start/stop task timer on click
    $('.main-content .time-wrap i').click(function(){
        if($(this).hasClass('fa-play')){
            if(counting){
                return;
            }
            $(this).removeClass('fa-play');
            $(this).addClass('fa-pause');
            $(this).closest('li').addClass('current');
            $('.main-content li').not('.current').addClass('disabled');
            $(this).siblings('.time').countdown('resume');
            counting = true;
        }else{
            $(this).removeClass('fa-pause');
            $(this).addClass('fa-play');
            $(this).closest('li').removeClass('current');
            $('.main-content li').removeClass('disabled');
            $(this).siblings('.time').countdown('pause');
            counting = false;
        }
    });

});

function getDate(){
    var d = new Date();
    var month = d.getMonth()+1;
    var day = d.getDate();
    var output = (month<10 ? '0' : '') + month + '/' + (day<10 ? '0' : '') + day + '/' + d.getFullYear();
    return output;
}
