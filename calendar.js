var http    = require('http');
var gcal = require('google-calendar');
var config = require('./config')
console.log(config);

var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
var passport = require('passport');
var gcal     = require('google-calendar');


passport.use(new GoogleStrategy({
    clientID: config.google_client_id,
    clientSecret: config.google_client_secret,
    callbackURL: config.root + '/auth/callback',
    scope: ['openid', 'email', 'https://www.googleapis.com/auth/calendar'] 
  },
  function(accessToken, refreshToken, profile, done) {
    profile.accessToken = accessToken;
    return done(null, profile);
  }
));

exports.googleAuth = passport.authenticate('google', { session: false });

function get_current_date(){
    var d = new Date();
    month = d.getMonth() + 1; // Months start at 0
    month = month > 9 ? month : '0' + month;
    date = d.getDate() > 9 ? d.getDate() : '0' + d.getDate();
    return d.getFullYear() + '-' + month + '-' + date + 'T00:00:00.000-07:00';
}

function get_tomorrow_date(){
    var d = +new Date(); // timestamp
    var ts = d + 86400000 + 86400000; // In miliseconds
    d = new Date(ts);
    month = d.getMonth() + 1; // Months start at 0
    month = month > 9 ? month : '0' + month;
    date = d.getDate() > 9 ? d.getDate() : '0' + d.getDate();
    return d.getFullYear() + '-' + month + '-' + date + 'T00:00:00.000-07:00';
}


var events = [];
var total_calendars = config.calendars.length;

var get_events = function(calendar_id, req, res){
    //Create an instance from accessToken
    var accessToken = req.cookies.clark_token;
    var calendar_params = {
        maxResults: 10,
        timeMin: get_current_date(),
        timeMax: get_tomorrow_date(),
    }


    // Get events
    gcal(accessToken).events.list(calendar_id, calendar_params, function(err, data) {
    
        if(err) {
            console.log(err);
            return res.send(500,err);
        }

        if(data.items && data.items.length > 0) {
            for(i in data.items){
                var new_event = {}
                new_event['calendar'] = calendar_id;
                new_event['calendar_style'] = config.calendar_styles[calendar_id];
                new_event['title'] = data.items[i].summary;
                var start = data.items[i].start.dateTime;
                if (start) {
                    new_event['start'] = start.substring(0,10) + ' ' + start.substring(11,16);
                } else {
                    today = new Date();
                    new_event['start'] = today.getFullYear() + '-' + (today.getMonth()+1) + '-' + today.getDate() + ' 00:00:00';

                }
                var end = data.items[i].end.dateTime;
                if (end) {
                    new_event['end'] = end.substring(0,10) + ' ' + end.substring(11,16);
                } else {
                    today = new Date();
                    new_event['end'] = today.getFullYear() + '-' + (today.getMonth()+1) + '-' + today.getDate() + ' 23:59:59';
                }

                events.push(new_event);
            }
        }

        return_events();

    });

    function return_events(){
        if (total_calendars > 1) {
            console.log(events);
            total_calendars -= 1;
        } else {
            res.send({'events': events.sort(sort_events)});
            events = [];
            total_calendars = config.calendars.length;
        }
    }

    function sort_events(event_1, event_2){
        if (event_1.start < event_2.start) {
            return -1;
        } else if (event_1.start > event_2.start) {
            return 1;
        } else {
            return 0;
        }
    }

}


exports.getCalendars = function(req, res){
    if(!req.cookies.clark_token) {
        return res.redirect('/auth');
    }

    for (var i=0; i < config.calendars.length; i++){
        calendar_id = config.calendars[i];
        get_events(calendar_id, req, res);
    }

}
