var https = require('https')
  , TokenProvider = require('refresh-token');

module.exports = {
	getRepos: function(account, appConfig, callback) {
		getCodeplex(account, appConfig, '/api/user/projects', callback);
	},
	getAvailableHooks: function(account, appConfig, projectName, callback) {
		getCodeplex(account, appConfig, '/api/projects/' + projectName + '/hooks', callback);
	}
}

function getCodeplex(account, appConfig, resourcePath, callback) {

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
			if (fin.Message) {
				if (appConfig.clientId && appConfig.clientSecret && fin.Message === 'Authentication required.') {
					var tokenProvider = new TokenProvider('https://www.codeplex.com/oauth/token', {
					  refresh_token: account.refreshToken, 
					  client_id:     appConfig.clientId, 
					  client_secret: appConfig.clientSecret
					});
					
					tokenProvider.getToken(function (err, token) {
						if (err) { callback(err, null); }
						else {
							account.accessToken = token;
							getCodeplex(account, appConfig, resourcePath, callback);
						}
					});
				}
				else {
					callback(fin.Message, null); 
				}
			}
			else { callback(null, fin); }
		});
	});
	
	req.on('error', function(err) {
		callback(err, null);
	});
	req.end();
}