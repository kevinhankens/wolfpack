var http = require('http')
    fs = require('fs')
    url = require(__dirname + '/core/urlparser.js');

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
            module.routes[route].regex = new RegExp('^' + route_regex + '$');
            WolfPack.addRoute(route, module.routes[route]);
          }
        }
      }
    }
  }
});

/**
 * Start the server.
 */
http.createServer(function (req, res) {
//console.log(req);
  // Allow us to keep things in the request object, such as URL arguments.
  req.wolfpack = {};

  // Invoke wolfpack routes. Each will be a regex matching the beginning
  // of the request URL. Query string parameters are stripped for pattern
  // matching, but they are still sent to the argument parser.
  var req_url = req.url.replace(/\?.*$/, '');
  for (route in WolfPack.routes) {
    // @todo is there a quicker way to find a matching route?
    if (req_url.match(WolfPack.routes[route].regex)) {
      req.wolfpack.args = url.parse(req.url, route);
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
