var codeplex = require('./codeplex');
var http = require('http');
var url = require('url');
var querystring = require('querystring');

http.createServer(function(request, response) {

	var parsed = url.parse(request.url);
	var pathname = parsed.pathname;
	if (pathname === '/') {
		response.writeHead(200, { 'Content-Type': 'text/html' });
		response.write('<html><head><title>codeplex api test</title></head>'+
					   '<body><form action="get-repos"><input type="text" name="username" /><input type="submit" /></form></body></html>');
		response.end();
	} else if (pathname === '/get-repos') {
		var username = querystring.parse(parsed.query)["username"];
		
		codeplex.getRepos(username, function(err, data) {		
			if (err) {
				console.error(err);
			
				response.writeHead(500, { 'Content-Type': 'text/plain' });
				response.write(err);
				response.end();
			} else {
				var str = JSON.stringify(data, null, "    ");
				response.writeHead(200, { 'Content-Type': 'text/plain' });
				response.write(str);
				response.end();
			}
		});
	} else {
		response.writeHead(200, { 'Content-Type': 'text/plain' });
				response.write(pathname);
				response.end();
	}
}).listen(999);