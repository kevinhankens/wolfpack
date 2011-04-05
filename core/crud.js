exports.routes = {
  'GET:/create/%type': {
    callback: function(req, res) {
      var def = req.wolfpack.content_types[req.wolfpack.args.type].form;
      var form_create = new form.engine(def);

      return {
        file: 'views/home.jade',
        locals: {
          message: form_create.renderForm(),
        }
      }
    }
  }
}

