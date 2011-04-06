exports.routes = {
  'GET:/create/%type': {
    callback: function(req, res) {
      // Look up a content type form definition. Should be part of a
      // wolfpack module export. e.g. exports.content_types.form.
      if (typeof req.wolfpack.content_types[req.wolfpack.args.type] != 'undefined') {
        var def = req.wolfpack.content_types[req.wolfpack.args.type].form;
        def.method = 'POST';
        def.action = '/create/' + req.wolfpack.args.type;
        var form_create = new form.engine(def);
        var message = form_create.renderForm();
      }
      else {
        // @todo 404
        var message = 'Content type not found';
      }

      // @todo template file for crud routes.
      return {
        file: 'views/home.jade',
        locals: {
          message: message,
        }
      }
    }
  },
  'POST:/create/%type': {
    callback: function(req, res) {
      // @todo validation should probably re-render the form here.
      return {
        file: 'views/home.jade',
        locals: {
          message: 'RECEIVED: ' + req.form_input.fields['input-single-test-textfield'],
        }
      }
    }
  },
}

