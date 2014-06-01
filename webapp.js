var codeplex = require('./lib/codeplex')
  , CodeplexStrategy = require('./lib/passport-codeplex');
  
module.exports = {
  appConfig: {
    hostname: 'http://localhost:3000',
    clientId: 'feecb876f9044bca8a86ab9089fba8b0',
    clientSecret: 'efc1e8c120c24b59b12ad0f4f7d32d02'
  },
  
  accountConfig: {
    accessToken: String,
	refreshToken: String,
    name: String,
    avatar: String
  },	
  
  config: {
    type: String,
    url: String,
    repo: String,
    auth: {}
  },

  // oauth global routes
  globalRoutes: function (app, context) {
    app.get('/oauth', context.passport.authenticate('codeplex'));
    app.get(
      '/oauth/callback', 
      context.passport.authenticate('codeplex', { failureRedirect: '/login' }),
      function(req, res) {
        // Successful authentication, redirect home.
        res.redirect('/projects');
      });
  },
  
  // namespaced to /org/repo/api/codeplex/
  routes: function (app, context) {
  },
  
  auth: function (passport, context) {
    passport.use(new CodeplexStrategy({
      clientID: this.appConfig.clientId,
      clientSecret: this.appConfig.clientSecret,
      callbackURL: this.appConfig.hostname + '/ext/codeplex/oauth/callback',
	  scope: 'project_info',
      passReqToCallback: true
    }, validateAuth));
  },

  listRepos: function (account, callback) {
	codeplex.getRepos(account, this.appConfig, function(err, data) {
		if (err) return callback(err)
		callback(null, data.map(function(repo) { return parseRepo(account, repo); }))
	});
  },
  
  isSetup: function (account) {
    return account.accessToken;
  },
  
  setupRepo: function (account, config, project, done) {
    if (!account.accessToken) return done(new Error('Codeplex account not configured'));
    done(null, config);
  },

  teardownRepo: function (account, config, project, done) {
    if (!account.accessToken) return done(new Error('Codeplex account not configured'));
    done(null, config);
  },
  
  getBranches: function (account, config, project, done) {
  	codeplex.getBranches(account, config, done);
  },
 
  // native git, hg, and codeplex all don't have a great way to just get a single file at an arbitrary revision
  fastFile: false, 
  getFile: function (filename, ref, account, config, project, done) {
    done(new Error('not implemented'));
  },
}

function validateAuth(req, accessToken, refreshToken, parms, profile, done) {
  if (!req.user) {
    console.warn('Codeplex OAuth but no logged-in user')
    req.flash('account', "Cannot link a codeplex account if you aren't logged in")
    return done()
  } 
  var account = req.user.account('codeplex', profile.UserName)
  if (account) {
    console.warn("Trying to attach a codeplex account that's already attached...")
    req.flash('account', 'That codeplex account is already linked. <a href="https://codeplex.com/site/signout/" target="_blank">Sign out of codeplex</a> before you click "Add Account".')
    return done(null, req.user)
  }
  
  req.user.accounts.push(makeAccount(accessToken, refreshToken, profile))
  req.user.save(function (err) {
    done(err, req.user);
  })
}

function makeAccount(accessToken, refreshToken, profile) {
  var username = profile.UserName;
  return {
    provider: 'codeplex',
    id: username,
    display_url: 'https://www.codeplex.com/site/users/view/' + username,
    title: username,
    config: {
      accessToken: accessToken,
	  refreshToken: refreshToken,
      name: username,
      avatar: profile.Avatar
    }
  }
}

function parseRepo(account, repo) {
  return {
	id: account.name + '/' + repo.Name,
	name: account.name + '/' + repo.Name,
	display_name: repo.Title,
	display_url: repo.Url,
	group: repo.Role,
	'private': !repo.IsPublished,
	config: {
      type: repo.SourceControl.ServerType.toLowerCase(),
      url: repo.SourceControl.Url,
      repo: repo.Name,
      auth: {
        type: 'https'
      }
	}
  }
}