exports.routes = {
  'GET:/create/%type': {
    callback: function(req, res) {
      // Look up a content type form definition. Should be part of a
      // wolfpack module export. e.g. exports.content_types.form.
      if (typeof req.wolfpack.content_types[req.wolfpack.args.type] != 'undefined') {
        var def = req.wolfpack.content_types[req.wolfpack.args.type].form;
        var form_create = new form.engine(def);
        var message = form_create.renderForm();
      }
      else {
        // @todo 404
        var message = 'Content type not found';
      }

      return {
        file: 'views/home.jade',
        locals: {
          message: message,
        }
      }
    }
  }
}

