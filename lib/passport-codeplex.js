var util = require('util')
  , OAuth2Strategy = require('passport-oauth2')
  , InternalOAuthError = require('passport-oauth2').InternalOAuthError;

function Strategy(options, verify) {
  options = options || {};
  options.authorizationURL = options.authorizationURL || 'https://www.codeplex.com/oauth/authorize';
  options.tokenURL = options.tokenURL || 'https://www.codeplex.com/oauth/token';
  options.scopeSeparator = options.scopeSeparator || ',';
  options.customHeaders = options.customHeaders || { 'x-ms-version': '2012-09-01' };

  if (!options.customHeaders['User-Agent']) {
    options.customHeaders['User-Agent'] = options.userAgent || 'passport-codeplex';
  }

  OAuth2Strategy.call(this, options, verify);
  this.name = 'codeplex';
  this._userProfileURL = options.userProfileURL || 'https://www.codeplex.com/api/user';
  this._oauth2.useAuthorizationHeaderforGET(true);
}

util.inherits(Strategy, OAuth2Strategy);

Strategy.prototype.userProfile = function(accessToken, done) {
  this._oauth2.get(this._userProfileURL, accessToken, function (err, body, res) {
    var json;
    
    if (err) {
      return done(new InternalOAuthError('Failed to fetch user profile', err));
    }
    
    try {
      json = JSON.parse(body);
    } catch (ex) {
      return done(new Error('Failed to parse user profile'));
    }
        
    done(null, json);
  });
}

module.exports = Strategy;
