var http    = require('http');
var gcal = require('google-calendar');
var config = require('./config')


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

exports.googleCallback = function(req, res) {  
    req.session.access_token = req.user.accessToken; 
    res.redirect('/calendar'); 
}; 

function get_current_date(){
    var d = new Date();
    month = d.getMonth() + 1; // Months start at 0
    month = month > 9 ? month : '0' + month;
    date = d.getDate() > 9 ? d.getDate() : '0' + d.getDate();
    return d.getFullYear() + '-' + month + '-' + date + 'T00:00:00.000-07:00';
}

function get_tomorrow_date(){
    var d = +new Date(); // timestamp
    var ts = d + 86400000; // In miliseconds
    console.log(ts);
    d = new Date(ts);
    console.log(d);
    month = d.getMonth() + 1; // Months start at 0
    month = month > 9 ? month : '0' + month;
    date = d.getDate() > 9 ? d.getDate() : '0' + d.getDate();
    return d.getFullYear() + '-' + month + '-' + date + 'T00:00:00.000-07:00';
}



var get_events = function(req, res){
    //Create an instance from accessToken
    var accessToken = req.session.access_token;
    var calendar_params = {
        maxResults: 10,
        timeMin: get_current_date(),
        timeMax: get_tomorrow_date(),
        // pageToken: null,
    }


    console.log("2 RES" + res);
    var events = [];
    gcal(accessToken).events.list(calendar_id, calendar_params, function(err, data) {
        // console.log(calendar_params);
        if(err) {
            console.log(err);
            return res.send(500,err);
        }
        if(data.items && data.items.length > 0) {
            for(i in data.items){
                // console.log(data.items[i]);
                // console.log('==============================');
                var new_event = {}
                new_event['calendar'] = calendar_id;
                new_event['title'] = data.items[i].summary;
                var start = data.items[i].start.dateTime;
                new_event['start'] = start.substring(0,10) + ' ' + start.substring(11,16);
                var end = data.items[i].end.dateTime;
                new_event['end'] = end.substring(0,10) + ' ' + end.substring(11,16);

                // console.log(new_event);
                events.push(new_event);
            }
        }

        res.send(events);
    });

}

exports.getCalendars = function(req, res){
    if(!req.session.access_token) {
        return res.redirect('/auth');
    }

    calendar_id = config.calendars[1];
    console.log(calendar_id);
    get_events(req, res);

}
