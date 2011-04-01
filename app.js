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
 * Additionally, query string parameters, e.g. ?value=123 will also
 * be processed into the return value like [value: 123]
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

  // Split the query string and parse the arguments.
  var query_string = url.match(/\?.*$/g);
  if (query_string) {
    var qs_param_string = query_string[0].replace(/\?/, '');
    qs_params = qs_param_string.split('&');
    for (param in qs_params) {
      var value = qs_params[param].split('=');
      if (value) {
        args[value[0]] = value[1];
      }
    }
  }

  // Remove the query string and parse route arguments.
  var url = url.replace(/\?.*$/, '');
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
  // Allow us to keep things in the request object, such as URL arguments.
  req.wolfpack = {};

  // Invoke wolfpack routes. Each will be a regex matching the beginning
  // of the request url.
  for (route in WolfPack.routes) {
    // @todo is there a quicker way to find a matching route?
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
