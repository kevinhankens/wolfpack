exports.create = function(val) {
  return val + ' test';
}

exports.routes = {
  '/about': {
    'callback': function(res, req) {
      return 'about';
    }
  }
}
