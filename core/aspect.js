var fs = require('fs');

/**
 * Load all wolfpack modules into memory. We will then extract aspects
 * from them on demand using the load method below.
 */
var files = fs.readdirSync(__dirname + '/../wolfpack');
var modules = [];
for (file in files) {
  if (files[file].match(/\.js$/)) {
    modules[files[file]] = require('../wolfpack/' + files[file]);
  }
}

exports = module.exports = {
  /**
   * Load wolfpack aspects..
   * All custom modules in /wolfpack will be processed here and
   * stored in memory. These objects can emit things like routes,
   * aspect overrides, etc.
   */
  load: function(aspects) {
    var overrides = {};

    for (aspect in aspects) {
      overrides[aspects[aspect]] = [];
      for (module in modules) {
        if (typeof modules[module][aspects[aspect]] != 'undefined') {
          overrides[aspects[aspect]][module] = modules[module][aspects[aspect]]
        } 
      } 
    }
    return overrides;
  },
  /**
   * Execute a number of callbacks which take the same arguments in a synchronous manner.
   * This is recursive, creating a nested chain of events, each one calling the next in
   * the chain with the same arguments. Eventually, when the chain is done, it will call
   * the next function from the original implementor.
   *
   * e.g. Wolfpack({arg1: 'value'}, [callback1, callback2], function(args) {
   *   // Each of callbacks will be executed in a chain with args being passed
   *   // along to each one. Finally, args will be returned to you.
   * });
   *
   * @param Object args
   *  The arguments to be passed along the chain.
   * @param Array callbacks
   *  The list of callback functions in the chain.
   * @param Function next
   *  Function to execute at the end of the chain.
   */
  // @todo how does this behave when there is high concurrency?
  chain:  function (args, callbacks, next) {
    if (typeof callbacks != 'undefined' && callbacks.length > 1) {
      var callback = callbacks.pop();
      exports.chain(args, callbacks, function(args) {callback(args, next);});
    }
    else if (typeof callbacks == 'undefined' || callbacks.length == 0) {
      next(args); 
  }
    else {
      var callback = callbacks.pop();
      callback(args, next);
    }
  }
}


