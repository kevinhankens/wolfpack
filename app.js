var http = require('http')
    fs = require('fs');

var WolfPack = {
  modules: {},
  routes: {},
  addModule: function(name, module) {
    this.modules[name] = module;
  },
  addRoute: function(name, route) {
    this.routes[name] = route;
  },
}

/**
 * Load wolfpack modules and routes.
 * All custom modules in /wolfpack will be processed here and
 * stored in memory. These objects can emit things like routes,
 * aspect overrides, etc.
 */
fs.readdir(__dirname + '/wolfpack', function (err, files) {
  if (err) {
    console.log(err);
  }
  else {
    for (file in files) {
      if (files[file].match(/\.js$/)) {
        // Add modules.
        var module = require(__dirname + '/wolfpack/' + files[file]);
        WolfPack.addModule(file, module);
        // Add routes.
        if (typeof module.routes != 'undefined') {
          for (route in module.routes) {
            var route_regex = route.replace(/\/\%[^\/]+/g, '\/[^\/]+'); 
            module.routes[route].regex = new RegExp('^' + route_regex);
            WolfPack.addRoute(route, module.routes[route]);
          }
        }
      }
    }
  }
});

/**
 * Parse a URL and it's matching route and extract any arguments.
 * The routes may specify arguments by prepending a % to a variable
 * name, like: /view/%something - this will match the second position
 * in the corresponding URL string, e.g. /view/123. The resulting
 * array will look like [something: 123]
 *
 * @param String url
 *  The request URL string
 * @param String route
 *  The matching route from a wolfpack module
 */
var getUrlArgs = function(url, route) {
  // @todo should we modulize the route matching and argument parsing?
  // @todo bail out if /\%/ is not found in the route
  var args = new Array();
  var arg_names = route.match(/\/([^\/]+)/g);
  var arg_values = url.match(/\/([^\/]+)/g);
 
  for (arg in arg_names) {
    name = arg_names[arg];
    if (name.match(/\/\%/)) {
      args[name.replace(/\/\%/, '')] = arg_values[arg].replace(/\//, '');
    }
  }

  return args;
}

/**
 * Start the server.
 */
http.createServer(function (req, res) {
//console.log(req);
  req.wolfpack = {};

  // Invoke wolfpack routes. Each will be a regex matching the beginning
  // of the request url.
  for (route in WolfPack.routes) {
    // @todo bail out once we've found the matching URL
    // @todo is there a quicker way to find a matching route?
    // @todo the regex_match_route and regex_route should be added at server startup time
    if (req.url.match(WolfPack.routes[route].regex)) {
      req.wolfpack.args = getUrlArgs(req.url, route);
      var value = WolfPack.routes[route].callback(req, res);
      break;
    }
  }

  // Invoke wolfpack modules
  for (module in WolfPack.modules) {
    if (typeof WolfPack.modules[module].create != 'undefined') {
      value = WolfPack.modules[module].create(value);
    }
  }

  // @todo write a 404 fail-out
  res.writeHead(200, {'Content-Type': 'text/plain'});
  res.end(value + '\n');
}).listen(4000);

console.log('Server running at http://127.0.0.1:4000/');
