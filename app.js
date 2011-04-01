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
            WolfPack.addRoute(route, module.routes[route]);
          }
        }
      }
    }
  }
});

http.createServer(function (req, res) {
//console.log(req);

  // Invoke wolfpack routes
  for (route in WolfPack.routes) {
    if (route.match(req.url)) {
      var value = WolfPack.routes[route].callback(req, res);
    }
  }

  // Invoke wolfpack modules
  for (module in WolfPack.modules) {
    if (typeof WolfPack.modules[module].create != 'undefined') {
      value = WolfPack.modules[module].create(value);
    }
  }

  res.writeHead(200, {'Content-Type': 'text/plain'});
  res.end(value + '\n');
}).listen(4000);

console.log('Server running at http://127.0.0.1:4000/');
