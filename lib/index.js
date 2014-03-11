var https = require('https');
var http = require('http');


http.createServer(function(request, response) {
    console.log("Request handler 'codeplex' was called.");
    
    var options = {
      hostname: 'www.codeplex.com',
      path: '/api/users/aheidebrecht/projects',
      method: 'GET'
    };
    
    var req = https.request(options, function(res) {
        var json = '';
        res.on('data', function(d) {
            json += d;
        });
        
        res.on('end', function() {
            var str = JSON.stringify(JSON.parse(json), null, "    ");
            response.writeHead(200, { 'Content-Type': 'text/plain' });
            response.write(str);
            response.end();
        });
    });
    
    req.end();
    
    req.on('error', function(err) {
        console.error(err);
        
        response.writeHead(500, { 'Content-Type': 'text/plain' });
        response.write(err);
        response.end();
    });
}).listen(999);