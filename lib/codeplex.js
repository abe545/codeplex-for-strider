var https = require('https');

module.exports = {
	getRepos: getRepos
}

function getRepos(user, callback) {

    var options = {
      hostname: 'www.codeplex.com',
      path: '/api/users/' + user + '/projects',
      method: 'GET',
	  headers: {'x-ms-version': '2012-09-01'}
    };
    
	console.log("Fetching repos from codeplex for user: %s", user);
    var req = https.request(options, function(res) {
        var json = '';
        res.on('data', function(d) {
            json += d;
        });
		res.on('error', function(err) {
			callback(err, null);
		});
		res.on('end', function() {
			var repos = JSON.parse(json);
			callback(null, repos);
		});
	});
	
	req.on('error', function(err) {
		callback(err, null);
	});
	req.end();
}