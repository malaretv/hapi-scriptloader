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

function writeScript(p) {
  var basePath = this.basePath;
  return 'document.write(\'<script type="text/javascript" src="' +
    basePath + p + '"></script>\');';
}

function globsToUrl(files, options) {
  if (files.options) {
    options = _.defaults(files.options, options);
    files = files.files;
  }

  return _.flatten([].concat(files).map(function(file) {
    if (file.options) { return globToUrl(file.files, file.options); }
    return globs(file, options.globOptions)
              .map(writeScript.bind(options));
  }));
}

var defaults = {
  basePath: '/',
  globOptions: {
    cwd: process.cwd()
  }
};

exports.register = function(plugin, options, next) {
  options.options = _.defaults(options.options || {}, defaults);

  var scripts = options.scripts;
  if (scripts) {
    Object.keys(scripts).forEach(function(path) {
      var res = globsToUrl(scripts[path], options.options).join('\n');

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
