var https = require('https');

module.exports = {
	getRepos: function(account, callback) {
		getCodeplex(account, '/api/user/projects', callback);
	}
}

function getCodeplex(account, resourcePath, callback) {

    var options = {
      hostname: 'www.codeplex.com',
      path: resourcePath,
      method: 'GET',
	  headers: {'x-ms-version': '2012-09-01' }
    };
	
	if (account && account.accessToken) {
		options.headers.Authorization = 'Bearer ' + account.accessToken;
	}
    
    var req = https.request(options, function(res) {
        var json = '';
        res.on('data', function(d) {
            json += d;
        });
		res.on('error', function(err) {
			callback(err, null);
		});
		res.on('end', function() {
			var fin = JSON.parse(json);
			
			// this is an error message
			if (fin.Message) { callback(fin.Message, null); }
			else { callback(null, fin); }
		});
	});
	
	req.on('error', function(err) {
		callback(err, null);
	});
	req.end();
}