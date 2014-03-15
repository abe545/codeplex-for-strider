var codeplex = require('./lib/codeplex')
  , CodeplexStrategy = require('./lib/passport-codeplex');
  
module.exports = {
  appConfig: {
    hostname: 'http://localhost:3000',
    clientId: 'feecb876f9044bca8a86ab9089fba8b0',
    clientSecret: 'efc1e8c120c24b59b12ad0f4f7d32d02'
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

  listRepos: function (account, next) {
	codeplex.getRepos(account, function(err, data) {
		if (err) return next(err)
		next(null, data.map(function(repo) { return codeplex.parseRepo(account, repo); }).filter(function (repo) {
			return repo.config.scm === 'Git' ||
				repo.config.scm === 'Mercurial';
	    }))
	});
  },
  
  // register the passport auth strategy
  auth: function (passport, context) {
    var config = this.appConfig
    passport.use(new CodeplexStrategy({
      clientID: this.appConfig.clientId,
      clientSecret: this.appConfig.clientSecret,
      callbackURL: this.appConfig.hostname + '/ext/codeplex/oauth/callback',
      passReqToCallback: true
    }, validateAuth));
  }
}

function validateAuth(req, token, tokenSecret, profile, done) {
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
  
  req.user.accounts.push(makeAccount(token, tokenSecret, profile))
  req.user.save(function (err) {
    done(err, req.user);
  })
}

function makeAccount(token, tokenSecret, profile) {
  var username = profile.UserName;
  return {
    provider: 'codeplex',
    id: username,
    display_url: 'https://www.codeplex.com/site/users/view/' + username,
    title: username,
    config: {
      accessToken: token,
      tokenSecret: tokenSecret,
      login: username,
      name: username,
      avatar: profile.Avatar,
    }
  }
}