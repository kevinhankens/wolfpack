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
exports.parse = function(url, route) {
  var args = new Array();

  // Only parse if there is a % in the route or a ? in the url.
  if (url.match(/\?/) || route.match(/\%/)) {
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
  }

  return args;
}

