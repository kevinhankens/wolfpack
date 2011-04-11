var fs = require('fs')
    url = require(__dirname + '/core/urlparser.js')
    theme = require(__dirname + '/core/theme.js')
    form = require(__dirname + '/core/form.js')
    crud = require(__dirname + '/core/crud.js')
    sync = require(__dirname + '/core/sync.js')
    connect = require('connect')
    connect_form = require('connect-form')
    ;
// @todo use require('url').parse('/status?name=ryan', true) instead of custom query parser?

var Config = require(__dirname + '/config.js');
if (typeof Config.public == 'undefined') { 
  Config.public = {};
}
Config.public.base_path = __dirname + '/';

/**
 * The WolfPack object handles all of the request/response tasks such as routing and
 * invoking/chaining overrides.
 */
var WolfPack = {
  config: Config, 
  modules: {},
  routes: {},
  content_types: {},
  overrides: {},
  addModule: function(name, module) {
    this.modules[name] = module;
  },
  addRoute: function(path, route) {
    var route_regex = path.replace(/\/\%[^\/]+/g, '\/[^\/]+'); 
    route.regex = new RegExp('^' + route_regex + '$');
    this.routes[path] = route;
  },
  addContentType: function (type, def) {
    this.content_types[type] = def;
  },
  addOverride: function(override, func) {
    if (typeof this.overrides[override] == 'undefined') {
      this.overrides[override] = [];
    }
    this.overrides[override].push(func);
  },
  /**
   * Routing happens here. When wolfpack modules are loaded, any routes are
   * converted into Regex objects. These are compared against the req.url here
   * and the appropriate callback is executed.
   * 
   * @param Object req
   *  The http request object.
   * @param Object res
   *  The http response object.
   */
  matchRoute: function(req, res) {
    // Allow us to keep things in the request object, such as URL arguments.
    req.wolfpack = {config: WolfPack.config.public};

    // Invoke wolfpack routes. Each will be a regex matching the beginning
    // of the request URL. Query string parameters are stripped for pattern
    // matching, but they are still sent to the argument parser.
    var req_url = req.method + ':' + req.url.replace(/\?.*$/, '');
    for (route in WolfPack.routes) {

      // @todo is there a quicker way to find a matching route?
      // @todo we should chain these methods
      if (req_url.match(WolfPack.routes[route].regex)) {
        var match = true;
        req.wolfpack.args = url.parse(req.url, route);
        req.wolfpack.content_types = WolfPack.content_types;
        WolfPack.routes[route].callback(req, res, function(req, res) {

          // @todo internal/external redirect support needed.
          // @todo write a better 404 fail-out
          var template = req.wolfpack.template;
          if (typeof template != 'undefined') {

            // Synchronously call all theme overrides, then pass the result
            // into the theme rendering.
            var callbacks = WolfPack.overrides.alter_template.slice(0);
            sync({req: req, res: res}, callbacks, function(args) {
              req = args.req;
              res = args.res;

              theme.def.renderFile(template.file, {locals: template.locals}, function(err, html) {
                theme.def.renderFile(theme.def.views + '/' + theme.def.layout, {locals: {content: html}}, function(err, html) {
                  res.writeHead(200, {'Content-Type': 'text/html'});
                  res.end(html + '\n');
                });
              });
            });
          }
          else {
            WolfPack.pageNotFound(req, res);
          }
        });
        break;
      }
    }
    if (!match) {
      WolfPack.pageNotFound(req, res);
    }
  },
  pageNotFound: function(req, res) {
    console.log('Page not found: ' + req.url);

    res.writeHead(404, {'Content-Type': 'text/html'});
    res.write("&lt;h1&gt;404 Not Found&lt;/h1&gt;");
    res.end("The page you were looking for: "+req.url+" can not be found");
  }
}

/**
 * Set up CRUD routing.
 */
// @todo should this be more generic, like core routing?
// @todo allow module overrides.
for (route in crud.routes) {
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
// @todo this should use fs.readdirSync
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
        // Add content types.
        if (typeof module.content_types != 'undefined') {
          for (type in module.content_types) {
            WolfPack.addContentType(type, module.content_types[type]);
          }
        }
        // Add in overrides.
        var overrides = ['alter_template'];
        for (override in overrides) {
          if (typeof module[overrides[override]]) {
            WolfPack.addOverride(overrides[override], module[overrides[override]]);
          }
        }
      }
    }
  }
});

// @deprecated, move into wolfpack chain
var respond = {
  success: function(req, res) {
    //console.log(req.body);
    // Invoke wolfpack modules
    for (module in WolfPack.modules) {
      if (typeof WolfPack.modules[module].create != 'undefined') {
        //value = WolfPack.modules[module].create(value);
      }
    }

  },
}


/**
 * Start the server. We will also load the bodyParser and connect-form middleware here
 * to handle post requests with varying encoding types. After handling the request body
 * and upload files, we call matchRoute to find a suitable callback.
 */
// @todo https handing?
connect(connect.bodyParser(), connect_form({keepExtensions: true}), function (req, res) {
  if (req.form) {
    req.form.complete(function(err, fields, files){
      // @todo needs error handling.
      req.form_input = {
        fields: fields,
        files: files,
      }
      WolfPack.matchRoute(req, res);
    });
  }
  else if (req.body) {
    req.form_input = {
      fields: req.body,
        files: {},
    }
    WolfPack.matchRoute(req, res);
  }
  else {
    WolfPack.matchRoute(req, res);
  }
}).listen(4000);

console.log('Server running at http://127.0.0.1:4000/');
