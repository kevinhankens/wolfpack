/**
 * Default routing definitions for CRUD functions.
 */
exports.routes = {
  'GET:/create/%type': {
    callback: function(req, res, next) {
      def = exports.load_def(req, res, function(req, res) {
        var form_create = new form.engine(req.wolfpack.form_def);
        var message = form_create.renderForm();

        // @todo template file for crud routes.
        req.wolfpack.template = {
          file: 'views/home.jade',
          locals: {
            message: message,
          }
        };

        next(req, res);
      });
    }
  },
  'POST:/create/%type': {
    callback: function(req, res, next) {
      // @todo validation should probably re-render the form here.

      var id = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
        return v.toString(16);
      });

console.log(id);
  
      req.wolfpack.template = {
        file: 'views/home.jade',
        locals: {
          message: 'RECEIVED: ' + req.form_input.fields['input-single-test-textfield'],
        }
      }

      next(req, res);
    }
  },
}

/**
 * Load the content type definition, provided by a wolfpack module.
 * Content type definition objects may be provided by custom modules by exporting
 * an object of the form:

 * exports.content_types = {
 *   'blog': {
 *     form: {
 *       method: 'POST',
 *       elements: {
 *         test: {
 *           type: 'textfield',
 *           title: 'TEST',
 *           value: 'TEST',
 *           attrs: {},
 *         },
 *         submit: {
 *           type: 'submit',
 *           value: 'Submit',
 *           attrs: {},
 *         }
 *       }
 *     }
 *   }
 * }
 *
 * The key of the content type object ('blog' above) will determine the URL
 * for crud functions, e.g. /create/blog.
 * 
 * @param Object req
 * @param Object res
 * @param Object next
 */
exports.load_def = function(req, res, next) {
  // Look up a content type form definition. Should be part of a
  // wolfpack module export. e.g. exports.content_types.form.
  if (typeof req.wolfpack.content_types[req.wolfpack.args.type] != 'undefined') {
    req.wolfpack.form_def = req.wolfpack.content_types[req.wolfpack.args.type].form;
    req.wolfpack.form_def.method = 'POST';
    req.wolfpack.form_def.action = '/create/' + req.wolfpack.args.type;
  }
  else {
    // @todo 404
    req.wolfpack.form_def = {};
  }

  next(req, res);
}
