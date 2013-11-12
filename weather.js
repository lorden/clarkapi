var http    = require('http');
var xm    = require('xml-mapping');
exports.getWeather = function(req, res){
    options = {
        host: 'weather.yahooapis.com',
        path: '/forecastrss?w=12797160&u=c'
    }


    http.get(options, function(response) {
        var xml = '';

        response.on('data', function (chunk) {
            xml += chunk;
        });

        response.on('end', function(){
            var date_obj = new Date();
            var date = date_obj.getFullYear() + '-' + (date_obj.getMonth()+1) + '-' + date_obj.getDate();
            var time = date_obj.getHours() + ':' + date_obj.getMinutes() + ':' + date_obj.getSeconds();
            var result = {
                'date': date,
                'time': time,
                'weather': {
                    'after_tomorrow': {
                        'high': '',
                        'image': '',
                        'low': '',
                        'condition': ''
                    },
                    'tomorrow': {
                        'high': '',
                        'image': '',
                        'low': '',
                        'condition': ''
                    },
                    'today': {
                        'high': '',
                        'image': '',
                        'low': '',
                        'condition': '',
                        'temperature': ''
                    },
                    'temperature_unit': 'C',
                }
            };
            var json_weather = xm.load(xml);

            // Today
            result['weather']['today']['temperature'] = json_weather.rss.channel.item.yweather$condition.temp;
            result['weather']['today']['condition'] = json_weather.rss.channel.item.yweather$condition.text;
            result['weather']['today']['high'] = json_weather.rss.channel.item.yweather$forecast[0].high;
            result['weather']['today']['low'] = json_weather.rss.channel.item.yweather$forecast[0].low;
            result['weather']['today']['image'] = 'img/' + result['weather']['today']['condition'].toLowerCase().replace(' ', '_') + '.png';

            // Tomorrow
            result['weather']['tomorrow']['condition'] = json_weather.rss.channel.item.yweather$forecast[1].text;
            result['weather']['tomorrow']['high'] = json_weather.rss.channel.item.yweather$forecast[1].high;
            result['weather']['tomorrow']['low'] = json_weather.rss.channel.item.yweather$forecast[1].low;
            result['weather']['tomorrow']['image'] = 'img/' + result['weather']['tomorrow']['condition'].toLowerCase().replace(' ', '_') + '.png';

            // After tomorrow
            result['weather']['after_tomorrow']['condition'] = json_weather.rss.channel.item.yweather$forecast[2].text;
            result['weather']['after_tomorrow']['high'] = json_weather.rss.channel.item.yweather$forecast[2].high;
            result['weather']['after_tomorrow']['low'] = json_weather.rss.channel.item.yweather$forecast[2].low;
            result['weather']['after_tomorrow']['image'] = 'img/' + result['weather']['after_tomorrow']['condition'].toLowerCase().replace(' ', '_') + '.png';

            // Send response
            res.header("Access-Control-Allow-Origin", "*");
            res.setHeader('Content-Type', 'application/json');
            res.send(result);

        });
    });

}
