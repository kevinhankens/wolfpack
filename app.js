var http = require('http')
    fs = require('fs')
    url = require(__dirname + '/core/urlparser.js')
    theme = require(__dirname + '/core/theme.js')
    form = require(__dirname + '/core/form.js')
    crud = require(__dirname + '/core/crud.js');

var Config = require(__dirname + '/config.js');

var WolfPack = {
  modules: {},
  routes: {},
  content_types: {},
  addModule: function(name, module) {
    this.modules[name] = module;
  },
  addRoute: function(name, route) {
    this.routes[name] = route;
  },
  addContentType: function (type, def) {
    this.content_types[type] = def;
  },
}

/**
 * Set up CRUD routing.
 */
// @todo allow module overrides.
// @todo abstract out the regex creation?
for (route in crud.routes) {
  var route_regex = route.replace(/\/\%[^\/]+/g, '\/[^\/]+'); 
  crud.routes[route].regex = new RegExp('^' + route_regex + '$');
  WolfPack.addRoute(route, crud.routes[route]);
}

// Set up theming
// @todo allow modules to override the theme object.

/**
 * Load wolfpack modules and routes.
 * All custom modules in /wolfpack will be processed here and
 * stored in memory. These objects can emit things like routes,
 * aspect overrides, etc.
 */
// @todo how can we make an api out of the known overrides? e.g. content types and routing?
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
        // Add content types.
        if (typeof module.content_types != 'undefined') {
          for (type in module.content_types) {
            WolfPack.addContentType(type, module.content_types[type]);
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
  var req_url = req.method + ':' + req.url.replace(/\?.*$/, '');
  for (route in WolfPack.routes) {
    // @todo is there a quicker way to find a matching route?
    if (req_url.match(WolfPack.routes[route].regex)) {
      req.wolfpack.args = url.parse(req.url, route);
      req.wolfpack.content_types = WolfPack.content_types;;
      var template = WolfPack.routes[route].callback(req, res);
      break;
    }
  }

  // Invoke wolfpack modules
  for (module in WolfPack.modules) {
    if (typeof WolfPack.modules[module].create != 'undefined') {
      //value = WolfPack.modules[module].create(value);
    }
  }

  // @todo internal/external redirect support needed.
  // @todo write a better 404 fail-out
  if (typeof template != 'undefined') {
    theme.def.renderFile(template.file, {locals: template.locals}, function(err, html) {
      theme.def.renderFile(theme.def.views + '/' + theme.def.layout, {locals: {content: html}}, function(err, html) {
        res.writeHead(200, {'Content-Type': 'text/html'});
        res.end(html + '\n');
      });
    });
  }
  else {
    console.log(req.url);
    res.writeHead(404, {'Content-Type': 'text/html'});
    res.end('Page not found: ' + req.url + '\n');
  }
}).listen(4000);

console.log('Server running at http://127.0.0.1:4000/');
