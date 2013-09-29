var http    = require('http');
var xm    = require('xml-mapping');
exports.getBuses = function(req, res){
    options = {
        host: 'webservices.nextbus.com'
    }

    lines = { "2": "6124",
              "3": "6124",
              "38": "6425",
              "38L": "5818",
              "47": "6808",
              "49": "6808"
    }

    var result = [];
    var done = 0;
    for( line in lines) {
        done += 1;
        options.path = '/service/publicXMLFeed?command=predictions&a=sf-muni&r=' + line + '&s=' + lines[line];
        console.log(options.path);
        http.get(options, function(response) {
            var xml = '';

            response.on('data', function (chunk) {
                xml += chunk;
            });

            response.on('end', function(){
                var json_bus = xm.load(xml);
                var times = [];
                try {
                    var predictions = json_bus.body.predictions.direction.prediction;
                    for (i in predictions){
                        times.push(predictions[i].minutes);
                    }
                    if (times.length > 3) {
                        times = times.slice(0,3);
                    }
                    while (times.length < 3) {
                        times.push('?');
                    }
                    result.push([json_bus.body.predictions.routeTag, times]);
                } catch(e) {
                    console.log(e);
                }

                done -= 1;
                if (done == 0) {
                    // Send response
                    res.header("Access-Control-Allow-Origin", "*");
                    res.setHeader('Content-Type', 'application/json');
                    res.send(result);
                } else {
                    // Keep waiting
                }
            });
        });
    }

    

}
