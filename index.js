var fs = require('fs');
var glob = require('glob');
var _ = require('lodash');

function globs(patterns, options) {
  if (!Array.isArray(patterns)) {
    patterns = [patterns];
  }
  var result = [];
  _.flatten(patterns).forEach(function(pattern) {
    var exclude = pattern.indexOf('!') === 0;
    if (exclude) { pattern = pattern.slice(1); }

    var matches = glob.sync(pattern, options);

    if (exclude) {
      result = _.difference(result, matches);
    } else {
      result = _.union(result, matches);
    }
  });

  return result;
}

function writeScript(path) {
  return 'document.write(\'<script type="text/javascript" src="' + path +
    '"></script>\');';
}

var defaults = {
  cwd: process.cwd()
};

exports.register = function(plugin, options, next) {
  var scripts = options.scripts,
      globOpts = _.defaults(options.options, defaults);

  if (scripts) {
    Object.keys(scripts).forEach(function(path) {

      var files = scripts[path],
          res = globs(files, globOpts).map(writeScript).join('\n');

      plugin.route({
        method: 'GET',
        path: path,
        handler: function(request, reply) {
          reply(res).type('text/javascript');
        }
      });

    });
  }

  next();
};
