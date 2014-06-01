var TokenProvider = require('refresh-token')
  , git = require('git-node')
  , request = require('request');

module.exports = {
	getRepos: function(account, appConfig, callback) {
		getCodeplex(account, appConfig, '/api/user/projects', callback);
	},
	getBranches: function(account, config, callback) {
	  	if (config.type === 'git') {
		  	var remote = git.remote(config.url);
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
		} else if (config.type === 'mercurial') {
			request(config.url + '/branches?style=raw', function(error, response, body) {
				if (error) return callback(error, null);
				var branches = [];
				var rows = body.split(/\r\n|\r|\n/g);

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
	  uri: 'https://www.codeplex.com' + resourcePath,
	  headers: {'x-ms-version': '2012-09-01' },
	  json: true
    };
	
	if (account && account.accessToken) {
		options.headers.Authorization = 'Bearer ' + account.accessToken;
	}
    
    request(options, function(err, response, body) {
	    if (err) {
		    return callback(err);
	    }
			
		// this is an error message
		if (body.Message) {
			if (appConfig.clientId && appConfig.clientSecret && body.Message === 'Authentication required.') {
				var tokenProvider = new TokenProvider('https://www.codeplex.com/oauth/token', {
				  refresh_token: account.refreshToken, 
				  client_id:     appConfig.clientId, 
				  client_secret: appConfig.clientSecret
				});
					
				tokenProvider.getToken(function (er, token) {
					if (err) { callback(er); }
					else {
						account.accessToken = token;
						getCodeplex(account, appConfig, resourcePath, callback);
					}
				});
			}
			else {
				callback(body.Message, null); 
			}
		}
		else { 
			callback(null, body); 
		}
	});
}