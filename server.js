var port = process.env.OPENSHIFT_NODEJS_PORT || 8080
, ip = process.env.OPENSHIFT_NODEJS_IP || "127.0.0.1";
var http = require('http');
http.createServer(function (req, res) {
res.writeHead(200, {'Content-Type': 'text/plain'});
res.end('Hello World\n');
}).listen(port, ip);
console.log('Clark API running...');
