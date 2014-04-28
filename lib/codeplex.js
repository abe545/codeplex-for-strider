var https = require('https')
  , TokenProvider = require('refresh-token')
  , git = require('git-node');

module.exports = {
	getRepos: function(account, appConfig, callback) {
		getCodeplex(account, appConfig, '/api/user/projects', callback);
	},
	getBranches: function(account, config, callback) {
	  	var sourceType = config.sourceType;
	  	if (sourceType === 'git') {
		  	var remote = git.remote(config.sourceUrl);
		  	remote.discover(function(err, refs) {
		  		if (err) {
					callback(err, null);
		  		} else {
			  		remote.close(function(error) {
			  			if (error) {
							callback(error, null);
						} else if (!refs) {
							callback("No data returned for the repo.", null);
						} else {
							var branches = Object.keys(refs).filter(function (ref) { return ref.indexOf('refs/heads/') == 0; }).map(function (ref) {
								return ref.replace('refs/heads/', '');
							});

							callback(null, branches);
						}
			  		});
				}
		  	});
		} else if (sourceType === 'mercurial') {
			request(config.sourceUrl + '/branches?style=raw', function(error, response, body) {
				if (error) return callback(error, null);
				var branches = [];
				var rows = rawText.split(/\r\n|\r|\n/g);

				// ignore the last row... it is always blank
				for (var i = rows.length - 2; i >= 0; i--) {
					var branchInfo = rows[i].split(/\t/g);
					if (branchInfo[2] !== 'closed') {
						branches.push(branchInfo[0]);
					}
				}

				callback(null, branches);
			});
		} else {
			callback("Only git and mercurial repos are supported at this time", null);
		}
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