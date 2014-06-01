var git = require('strider-git/worker'),
    hg = require('hg');

module.exports = {
  init: function (dirs, account, config, job, done) {
    return done(null, {
      config: config,
      account: account,
      fetch: function (context, done) {
        module.exports.fetch(dirs.data, account, config, job, context, done);
      }
    });
  },
  fetch: function (dest, account, config, job, context, done) {
    if (config.type === 'git') {
      if (config.auth.type === 'https' && !config.auth.username) {
        config.auth.username = account.accessToken
        config.auth.password = ''
      }
      git.fetch(dest, config, job, context, done);	  
    } else if (config.type === 'mercurial') {
      var branch = job.ref.branch;
      if (branch === 'master') {
        // hg's default branch is default, not master... Ideally this would be handled in the repo setup, but use this as a workaround
        branch = 'default';
      }
      var start = new Date()
        , cmd = 'hg clone ' + config.url + ' . -b ' + branch;
      context.status('command.start', { command: cmd, time: start, plugin: context.plugin });
      hg.clone(config.url, dest, {"-b": branch}, function(err, output) {
        var end = new Date()
          , elapsed = end.getTime() - start.getTime();
        if (err) {
          context.out('hg error: ' + err.message);
        }
		
        if (output) {
          output.forEach(function(line) {
            context.out(line.body);
          });
        }

        context.status('command.done', {exitCode: 0, time: end, elapsed: elapsed});
        done(err, output);
      });
    }
  }
}