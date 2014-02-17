$(document).ready(function(){
    $('#settings').css({'top': '100%'}).hide();
    $('#settings_display').children().hide();
    $('#settings_basic_display').show();
    updateClock();
    updateWeather();
    updateBus();
    setInterval('updateClock()', 1 * 1000); 
    setInterval('updateWeather()', 5 * 60 * 1000); 
    setInterval('updateEvents()', 60 * 60 * 1000); 
    setInterval('updateBus()', 60 * 1000);
    updateEvents();
    $('#reload').click(function(){
        window.location.reload();
    });
});

var api_url = '';

function new_updateClock() {
    $.getJSON(api_url, function(data) {
        $('#clock').html(data.time); 
    });
}

function updateEvents() {
    var event_template =
        '<div class="event-day">Today</div>' +
        '{{ #today }}' +
        '<div class="event {{ calendar }}" style="{{ calendar_style }}">' +
        '   {{ #start }}<div class="event-date">{{ start }} / {{ end }}</div>{{ /start }}' +
        '   {{ ^start }}<div class="event-date">All day</div>{{ /start }}' +
        '   <div class="event-title">{{ title }}</div>' +
        '</div>' +
        '{{ /today }}' +
        '{{ ^today }}' +
        '<div class="event">' +
        '  <div class="event-title">Hooray! No events for today.</div>' +
        '</div>' +
        '{{ /today }}' +
        '<div class="event-day">Tomorrow</div>' +
        '{{ #tomorrow }}' +
        '<div class="event {{ calendar }}" style="{{ calendar_style }}">' +
        '   {{ #start }}<div class="event-date">{{ start }} / {{ end }}</div>{{ /start }}' +
        '   {{ ^start }}<div class="event-date">All day</div>{{ /start }}' +
        '   <div class="event-title">{{ title }}</div>' +
        '</div>' +
        '{{ /tomorrow }}' +
        '{{ ^tomorrow }}' +
        '<div class="event">' +
        '  <div class="event-title">Hooray! No events for tomorrow.</div>' +
        '</div>' +
        '{{ /tomorrow }}';
    
    $.getJSON(api_url + '/calendar', function(data) {
        events_data = {
            'today' : [],
            'tomorrow': []
        }

        today = new Date();
        today.setHours(0);
        today.setMinutes(0);
        today.setSeconds(0);
        today.setMilliseconds(0);

        for(i in data.events){
            e = data.events[i];
            event_data = {
                'calendar': e.calendar,
                'calendar_style': e.calendar_style,
                'date': '',
                'start': '',
                'end': '',
                'title': e.title,
                'description': '',
                'day': ''
            }
            // Start Date
            date = e.start.split(' ')[0].split('-');
            if (e.start.split(' ').length > 1) {
                time = e.start.split(' ')[1].split(':');
            } else {
                time = ['00', '00', '00'];
            }
            sdate = new Date(date[0], date[1] - 1, date[2], time[0], time[1]);
            if (sdate.getTime() + 1000 > today.getTime() + 172800000) {
                // This event doesn't belong here, 2 days only
                continue;
            }
            psdate = sdate.getDate() + '/' + sdate.getMonth();
            mins = sdate.getMinutes() > 9 ? sdate.getMinutes() : ('0' + sdate.getMinutes())
            event_data.date = sdate.getFullYear() + '-' + sdate.getMonth() + '-' + sdate.getDate();
            event_data.start = sdate.getHours() + ':' + mins;
            

            // End Date
            date = e.end.split(' ')[0].split('-');
            if (e.end.split(' ').length > 1) {
                time = e.end.split(' ')[1].split(':');
            } else {
                time = ['00', '00', '00'];
            }
            edate = new Date(date[0], date[1] - 1, date[2], time[0], time[1]);
            pedate = edate.getDate() + '/' + edate.getMonth();
            mins = edate.getMinutes() > 9 ? edate.getMinutes() : ('0' + edate.getMinutes())
            event_data.end = edate.getHours() + ':' + mins;
            if (edate - sdate == 86340000){
                event_data.start = '';
                event_data.end = '';
            }

            // Skip finished events
            now = new Date();
            if (edate < now) {
                continue;
            }
    
            // Description
            if (e.description != null) {
                event_data.description = e.description;
            }

            if(sdate.getTime() < (today.getTime() + 86400000)){
                event_data.day = 'today';
                events_data.today.push(event_data);
            } else {
                event_data.day = 'tomorrow';
                events_data.tomorrow.push(event_data);
            }
        }

        $('#events').html(Mustache.render(event_template, events_data));
    })
    .fail(function(){
        $('#events').html(
            '<div class="empty-widget">' +
                    '<a href="/auth">' +
                        '<img src="img/calendar.png" alt="" />' +
                        '<br/>Authenticate' +
                    '</a>' +
            '</div>');
    });
}

function updateWeather(unit) {
    if (typeof unit === 'undefined' || unit == null) {
        var tu = ' &deg;C';
    } else {
        tu = '&deg;' + unit;
    }
    var weather_template = 
        '<div class="small-4 columns" style="padding:0 0.5em 0 0">' +
        '<div class="weather-day widget">' +
        '  <h2> {{ day }} </h2>' +
        '  <div class="weather-image">' +
        '    <img src="{{ image }}"/>' +
        '    <div>{{ high }} ' + tu + '</div>' +
        '    <div>{{ low }} ' + tu + '</div>' +
        '  </div>' +
        '  <div>{{ condition }}</div>' +
        '</div>' +
        '</div>';
    
    $.getJSON(api_url + '/weather?u=' + unit, function(data) {
        $('#current-temperature').html('<span class="large">' + Math.round(data.weather.today.temperature) + '</span><span class="small">' + tu + '</span>'); 
        var currentTime = new Date ( );
        // Today
        var day_data = {
            'day': 'Today',
            'image': data.weather.today.image,
            'condition': data.weather.today.condition,
            'high': data.weather.today.high,
            'low': data.weather.today.low
        }
        $('#weather').html(Mustache.render(weather_template, day_data));
        // Tomorrow
        var day_data = {
            'day': get_day_name(currentTime.getDay() + 1),
            'image': data.weather.tomorrow.image,
            'condition': data.weather.tomorrow.condition,
            'high': data.weather.tomorrow.high,
            'low': data.weather.tomorrow.low
        }
        $('#weather').append(Mustache.render(weather_template, day_data));

        // After tomorrow
        var day_data = {
            'day': get_day_name(currentTime.getDay() + 2),
            'image': data.weather.after_tomorrow.image,
            'condition': data.weather.after_tomorrow.condition,
            'high': data.weather.after_tomorrow.high,
            'low': data.weather.after_tomorrow.low
        }
        $('#weather').append(Mustache.render(weather_template, day_data));

        $('.weather-image img').on('error', function(){
            $(this).attr('src', 'img/not_available.png');
        });

        // Set height of Clock
        var h = $('.weather-day').eq(0).css('height');
        $('#clock').parent().parent().css('height', h);
        $('#clock').parent().parent().css('padding-top', parseInt(h)/4 + 'px');

        // Set width of Clock
        var w = $('#clock').parent().parent().width();
        $('#clock').parent().parent().css('padding-left', ((w - $('#clock').width()) / 2) - 20 + 'px');
    });


    $('.widget .content').on('click', function() {
        $(this).blur();
        $(this).parent().addClass('flipped');
    });
    $('.widget .settings').on('click', function() {
        $(this).blur();
        $(this).parent().removeClass('flipped');
    });

    $('.farenheit').on('click', function(){
        updateWeather('F');
    });

    $('.celsius').on('click', function(){
        updateWeather('C');
    });

}

function updateClock () {
    // Use built-in javascript Date object
    var currentTime = new Date ( );

    var currentHours = currentTime.getHours ( );
    var currentMinutes = currentTime.getMinutes ( );
    // var currentSeconds = currentTime.getSeconds ( );

    // Pad the minutes and seconds with leading zeros, if required
    currentMinutes = ( currentMinutes < 10 ? "0" : "" ) + currentMinutes;
    // currentSeconds = ( currentSeconds < 10 ? "0" : "" ) + currentSeconds;

    // Choose either "AM" or "PM" as appropriate
    var timeOfDay = ( currentHours < 12 ) ? "AM" : "PM";

    // Convert the hours component to 12-hour format if needed
    currentHours = ( currentHours > 12 ) ? currentHours - 12 : currentHours;

    // Convert an hours component of "0" to "12"
    currentHours = ( currentHours == 0 ) ? 12 : currentHours;

    // Compose the string for display
    var current_time = currentHours + ":" + currentMinutes;
    var ampm = timeOfDay;

    // Update the time display
    $('#clock').html('<span class="large">' + current_time + '</span><span class="small">' + ampm + '</span>');
    updateDate(currentTime);
}

function updateDate (currentTime) {
    var dayOfWeek = get_day_name(currentTime.getDay());
    var dayOfMonth = currentTime.getDate();
    var month = get_month_name(currentTime.getMonth());
    // should add customizations to date string order/appearance based on user settings here
    var currentDateString = dayOfWeek + ", " + month + " " + dayOfMonth;
    $('#day').html(currentDateString);
}

function get_day_name(day, delta){
    if (typeof(delta) === 'undefined') delta = 0;
    day = day + delta;
    if (day > 6) day = day - 7;
    var weekday=new Array(7);
    weekday[0]="Sunday";
    weekday[1]="Monday";
    weekday[2]="Tuesday";
    weekday[3]="Wednesday";
    weekday[4]="Thursday";
    weekday[5]="Friday";
    weekday[6]="Saturday";
    return weekday[day];
}

function get_month_name(month){
    var months=new Array(12);
    months[0]="January";
    months[1]="February";
    months[2]="March";
    months[3]="April";
    months[4]="May";
    months[5]="June";
    months[6]="July";
    months[7]="August";
    months[8]="September";
    months[9]="October";
    months[10]="November";
    months[11]="December";
    return months[month];
}

function updateBus(){
    $.getJSON(api_url + '/bus', function(data) {
        for (bus_line in data) {
            $('#bus .bus_row#' + data[bus_line][0] + ' .bus_times').html('')
            $('#bus .bus_row#' + data[bus_line][0] + ' .later_bus').html('&nbsp;')
            for (b in data[bus_line][1]) {
                if (data[bus_line][1][b] < 21) {
                    var indent = ((parseInt($('.bus_row').css('width'))-140)/20)*data[bus_line][1][b]+50;
                    $('#bus .bus_row#' + data[bus_line][0] + ' .bus_times').append(
                        '<div class="timeline_bus" style="left:' + indent +'px">' + data[bus_line][1][b] + '</div>');
                }
                else {
                    $('#bus .bus_row#' + data[bus_line][0] + ' .later_bus').html(data[bus_line][1][b]);
                    break;
                }
            }
        }
    });
}

function showSettings(){
    $('#dashboard').animate({'top': '-100%'}).hide();
    $('#settings').show().animate({'top': '0'});
}

function showDashboard(){
    $('#dashboard').show().animate({'top': '0'});
    $('#settings').animate({'top': '100%'}).hide();
}

function showSettingsDisplay(menu_item){
    var which = $(menu_item).attr("id");
    $('#settings_display').children().hide();
    $('#' + which + '_display').show();
}
