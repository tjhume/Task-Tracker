const { remote } = require('electron');
const currentWindow = remote.getCurrentWindow();
const Store = require('electron-store');
const store = new Store();

var firstTime = false;
var counting = false;
var date = getDate();
var yesterday = getYesterday();
if(store.get('used') == undefined){
    firstTime = true;
    store.set('window.maximized', false);
    store.set('window.size', [800, 600]);
    store.set('used', true);
}

if(store.get('days') == undefined){
    store.set('days', []);
}

// Document loaded
currentWindow.webContents.once('dom-ready', () => {

    $('.tabs .current').data('day', date);

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
    // If there is data for this date
    if(store.get(date) != undefined){
        var tasks = store.get(date);
        for(var i = 0; i < tasks.length; i++){
            var task = tasks[i][0];
            var remaining = tasks[i][2];
            var completeStr = '';
            if(remaining == 0){
                completeStr = ' complete';
            }
            $('.main-content .content.active ul').append('<li class="adding-task'+completeStr+'">'+task+'<div class="time-wrap"><i class="fas fa-play"></i><span class="fas fa-check"></span><span class="time"></span><span class="fas fa-times"></span></div></li>');
            $('.adding-task .time-wrap .time').data('index', i);
            $('.adding-task .time-wrap .time').countdown({layout : '{hnn}:{mnn}:{snn}', until : '+'+remaining, tickInterval: 10, onTick: function(){
                var index = $(this).data('index');
                var updateTasks = store.get(date);
                var periods;
                var periods = $(this).countdown('getTimes');
                updateTasks[index][2] = $.countdown.periodsToSeconds(periods);
                store.set(date, updateTasks);
                if(updateTasks[index][2] == 0){
                    $(this).closest('li').addClass('complete');
                    $(this).countdown('pause');
                    $(this).siblings('i').removeClass('fa-pause');
                    $(this).siblings('i').addClass('fa-play');
                    $(this).closest('li').removeClass('current');
                    $('.main-content li').removeClass('disabled');
                    counting = false;
                }
            }});
            $('.adding-task .time-wrap .time').countdown('pause');
            $('.adding-task').removeClass('adding-task');
        }
    }else{
        store.set(date, []);
        var days = store.get('days');
        days.push(date);
        store.set('days', days);
    }

    // Load History
    var days = store.get('days');
    for(var i = 0; i < days.length; i++){
        var loadedDay = store.get(days[i]);
        if(days[i] != date && loadedDay != undefined && loadedDay.length != 0){
            $('.history').append('<li>' + days[i] + '</li>')
        }
    }
    // On clicking a history item
    $('.history li').click(function(){
        var dayToLoad = $(this).html();
        var alreadyOpen = false;
        $('.main-content .tabs .tab').each(function(i, el){
            if($(el).data('day') == dayToLoad){
                alreadyOpen = true;
                $('.main-content .tabs .tab').removeClass('current');
                $(el).addClass('current');
                loadTasks(dayToLoad);
            }
        });
        if(alreadyOpen) return;
        $('.main-content .tabs .current').removeClass('current');
        $('.main-content .tabs').append('<div class="current tab"><span>'+dayToLoad+'</span><span class="close"><i class="fas fa-times"></i></span></div>');
        $('.main-content .tabs .current').data('day', dayToLoad)
        rebindTabs();
        loadTasks(dayToLoad);
    });

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
    var output = 'Today: ' + date;
    $('.tabs .current').html('<span>' + output + '</span><span class="close">');
    $('.main-content .content h2').html(output);
    rebindTabs();

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
        var hasTime = false;
        $('.add-modal input').each(function(){
            if($(this).val() == '' && $(this).hasClass('task-name')){
                empty = 'Please enter a task name';
            }else if($(this).val() != '' && !$(this).hasClass('task-name')){
                hasTime = true;
            }
        });
        if(!hasTime && empty == ''){
            empty = 'Please enter at least one time value';
        }
        if(empty != ''){
            $('.add-modal .error').html(empty);
            $('.add-modal .error').css('display', 'block');
            return;
        }else{
            $('.add-modal .error').html('');
            $('.add-modal .error').css('display', 'none');
        }

        // Modal submission is valid
        var taskName = $('.add-modal .task-name').val();
        var seconds = 0;
        var hours, minutes, inpseconds;
        if($('.add-modal .hours').val() == ''){
            hours = 0;
        }else{
            hours = $('.add-modal .hours').val();
        }
        if($('.add-modal .minutes').val() == ''){
            minutes = 0;
        }else{
            minutes = $('.add-modal .hours').val();
        }
        if($('.add-modal .seconds').val() == ''){
            inpseconds = 0;
        }else{
            inpseconds = $('.add-modal .seconds').val();
        }
        
        seconds += hours * 3600;
        seconds += minutes * 60;
        seconds += inpseconds;

        addTask(taskName, seconds);

        $('.add-modal').css('display', 'none');
        $('.add-modal input').val('');
    });

    // Start/stop task timer on click
    $('.main-content .time-wrap i').click(function(){
        if($(this).hasClass('fa-play')){
            if(counting){
                return;
            }
            if($(this).closest('li').hasClass('complete')){
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

    // Delete task
    $('.main-content .time-wrap .fa-times').click(function(){
        var index = $(this).siblings('.time').data('index');
        var tasks = store.get(date);
        tasks.splice(index, 1);
        store.set(date, tasks);
        $(this).siblings('.time').countdown('destroy');
        $(this).closest('li').remove();
        reindex();
        $('.main-content li').removeClass('disabled');
        counting = false;
    });

    // Import from yesterday
    $('.main-content .load-previous').click(function(){
        var toImport = store.get(yesterday);
        if(toImport == undefined || toImport.length == 0){
            $('.content-error span').html('No tasks were found from yesterday!');
            $('.content-error').css('display', 'inline-block');
        }else{
            $('.import-modal').css('display', 'block');
        }
    });
    $('.import-modal .fa-times, .import-modal .cancel').click(function(){
        $('.import-modal').css('display', 'none');
    });
    $('.import-modal .continue').click(function(){
        var toImport = store.get(yesterday);
        if(toImport == undefined || toImport.length == 0){
            $('.import-modal').css('display', 'none');
            return;
        }
        $('.main-content .content.active ul').html('');
        store.set(date, []);
        for(var i = 0; i < toImport.length; i++){
            var task = toImport[i][0];
            var remaining = toImport[i][1];
            addTask(task, remaining);
        }
        $('.import-modal').css('display', 'none');
    });

    // Closing error
    $('.content-error .fa-times').click(function(){
        $('.content-error span').html('');
        $('.content-error').css('display', 'none');
    });

});

function getDate(){
    var d = new Date();
    var month = d.getMonth()+1;
    var day = d.getDate();
    var output = (month<10 ? '0' : '') + month + '/' + (day<10 ? '0' : '') + day + '/' + d.getFullYear();
    return output;
}

function getYesterday(){
    var d = new Date();
    d.setDate(d.getDate() - 1);
    var month = d.getMonth()+1;
    var day = d.getDate();
    var output = (month<10 ? '0' : '') + month + '/' + (day<10 ? '0' : '') + day + '/' + d.getFullYear();
    return output;
}

function addTask(task, seconds){
    var tasks = store.get(date);
    tasks.push([task, seconds, seconds]);
    store.set(date, tasks);
    $('.main-content .content.active ul').append('<li class="adding-task">'+task+'<div class="time-wrap"><i class="fas fa-play"></i><span class="fas fa-check"></span><span class="time"></span><span class="fas fa-times"></span></div></li>');
    $('.adding-task .time-wrap .time').data('index', tasks.length-1);
    $('.adding-task .time-wrap .time').countdown({layout : '{hnn}:{mnn}:{snn}', until : '+'+seconds, tickInterval: 10, onTick: function(){
        var index = $(this).data('index');
        var updateTasks = store.get(date);
        var periods = $(this).countdown('getTimes');
        updateTasks[index][2] = $.countdown.periodsToSeconds(periods);
        store.set(date, updateTasks);
        if(updateTasks[index][2] == 0){
            $(this).closest('li').addClass('complete');
            $(this).countdown('pause');
            $(this).siblings('i').removeClass('fa-pause');
            $(this).siblings('i').addClass('fa-play');
            $(this).closest('li').removeClass('current');
            $('.main-content li').removeClass('disabled');
            counting = false;
        }
    }});
    $('.adding-task .time-wrap .time').countdown('pause');
    $('.adding-task i').click(function(){
        if($(this).hasClass('fa-play')){
            if(counting){
                return;
            }
            if($(this).closest('li').hasClass('complete')){
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
    $('.adding-task .time-wrap .fa-times').click(function(){
        var index = $(this).siblings('.time').data('index');
        var tasks = store.get(date);
        tasks.splice(index, 1);
        store.set(date, tasks);
        $(this).siblings('.time').countdown('destroy');
        $(this).closest('li').remove();
        reindex();
        $('.main-content li').removeClass('disabled');
        counting = false;
    });
    $('.adding-task').removeClass('adding-task');
}

function reindex(){
    $('.main-content .content.active li .time-wrap .time').each(function(i){
        $(this).data('index', i);
    });
}

function loadTasks(day){
    var tasks = store.get(day);
    $('.main-content .content.active ul').html('');
    $('.main-content .content.active h2').html(day);
    for(var i = 0; i < tasks.length; i++){
        var task = tasks[i][0];
        var remaining = tasks[i][2];
        var completeStr = '';
        if(day != date){
            if(remaining == 0){
                completeStr = ' complete';
            }else{
                completeStr = ' incomplete'
            }
            $('.main-content .content.active ul').append('<li class="adding-task'+completeStr+'">'+task+'<div class="time-wrap"<span class="far fa-times-circle"></span><span class="fas fa-check"></span><span class="time"></span></div></li>');
            $('.adding-task .time-wrap .time').data('index', i);
            $('.adding-task .time-wrap .time').countdown({layout : '{hnn}:{mnn}:{snn}', until : '+'+remaining, tickInterval: 10,});
            $('.adding-task .time-wrap .time').countdown('pause');
            $('.adding-task').removeClass('adding-task');
        }else{
            if(remaining == 0){
                completeStr = ' complete';
            }
            $('.main-content .content.active ul').append('<li class="adding-task'+completeStr+'">'+task+'<div class="time-wrap"><i class="fas fa-play"></i><span class="fas fa-check"></span><span class="time"></span><span class="fas fa-times"></span></div></li>');
            $('.adding-task .time-wrap .time').data('index', i);
            $('.adding-task .time-wrap .time').countdown({layout : '{hnn}:{mnn}:{snn}', until : '+'+remaining, tickInterval: 10, onTick: function(){
                var index = $(this).data('index');
                var updateTasks = store.get(date);
                var periods;
                var periods = $(this).countdown('getTimes');
                updateTasks[index][2] = $.countdown.periodsToSeconds(periods);
                store.set(date, updateTasks);
                if(updateTasks[index][2] == 0){
                    $(this).closest('li').addClass('complete');
                    $(this).countdown('pause');
                    $(this).siblings('i').removeClass('fa-pause');
                    $(this).siblings('i').addClass('fa-play');
                    $(this).closest('li').removeClass('current');
                    $('.main-content li').removeClass('disabled');
                    counting = false;
                }
            }});
            $('.adding-task i').click(function(){
                if($(this).hasClass('fa-play')){
                    if(counting){
                        return;
                    }
                    if($(this).closest('li').hasClass('complete')){
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
            $('.adding-task .time-wrap .fa-times').click(function(){
                var index = $(this).siblings('.time').data('index');
                var tasks = store.get(date);
                tasks.splice(index, 1);
                store.set(date, tasks);
                $(this).siblings('.time').countdown('destroy');
                $(this).closest('li').remove();
                reindex();
                $('.main-content li').removeClass('disabled');
                counting = false;
            });
            $('.adding-task .time-wrap .time').countdown('pause');
            $('.adding-task').removeClass('adding-task');
        }
    }
}

function rebindTabs(){

    jQuery('.tabs .tab').off('click');
    jQuery('.tabs .tab i').off('click');
    jQuery('.tabs .tab').off('hover');

    // Switching tabs
    $('.tabs .tab').on('click', function(){
        $(this).siblings('.current').find('i').css('opacity', '0');
        $(this).siblings('.current').removeClass('current');
        $(this).addClass('current');
        $(this).find('i').css('opacity', '1');
        
        var toLoad = $(this).data('day');
        loadTasks(toLoad);
    });

    // Closing tab
    $('.tabs .tab i').on('click', function(){
        $(this).closest('.tabs').find('.tab:last-child').find('i').css('opacity', '1');
        var isCurrent = false;
        if($(this).closest('.tab').hasClass('current')){
            isCurrent = true;
        }
        $(this).closest('.tab').remove();
        if(isCurrent){
            $('.tabs .tab:last-child').addClass('current');
            var toLoad = $('.tabs .current').data('day');
            loadTasks(toLoad);
        }
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
}