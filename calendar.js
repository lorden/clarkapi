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

exports.getCalendars = function(req, res){
    if(!req.session.access_token) {
        return res.redirect('/auth');
    }

    //Create an instance from accessToken
    var accessToken = req.session.access_token;

    calendar_id = config.calendars[1];
    console.log(calendar_id);
    var result = gcal(accessToken).events.list(calendar_id, {maxResults:1}, function(err, data) {
        var events = [];
        if(err) return res.send(500,err);
        var new_event = {}
        new_event['calendar'] = calendar_id;
        new_event['title'] = data.items[0].summary;
        console.log(new_event);
        events.push(new_event);
        console.log(events);

        res.header("Access-Control-Allow-Origin", "*");
        res.setHeader('Content-Type', 'application/json');
        return res.send(events);

//        if(data.nextPageToken){
//            console.log('NPT: ' + data.nextPageToken);
//            google_calendar.events.list(calendar_id, {maxResults:1, pageToken:data.nextPageToken}, function(err, data) {
//                console.log('=========');
//                console.log('=========');
//            });
//        }
    
    });

}
