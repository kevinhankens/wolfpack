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
exports = module.exports = function (args, callbacks, next) {
    if (typeof callbacks != 'undefined' && callbacks.length > 1) {
      var callback = callbacks.pop();
      exports(args, callbacks, function(args) {callback(args, next);});
    }
    else if (typeof callbacks == 'undefined' || callbacks.length == 0) {
      next(args); 
    }
    else {
      var callback = callbacks.pop();
      callback(args, next);
    }
  }

