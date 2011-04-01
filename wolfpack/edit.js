exports.create = function(val) {
  return val + ' edited';
}

exports.routes = {
  '/home': {
    'callback': function(res, req) {
      return 'home';
    }
  }
}
