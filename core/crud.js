var fs = require('fs');

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

      // Create a pseudo-guid here for the file name.
      var id = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
        return v.toString(16);
      });

      // Open that file to write the form data to.
      var message;
      fs.open(req.wolfpack.config.base_path + 'content/' + id + '.json', 'w+', '0766', function(err, fd) {
        if (err) {
          message = err.message;
          console.log(message);
        }
        else {
          // Save the object as JSON-text data to the file.
          var json_text = JSON.stringify(req.form_input);
          fs.write(fd, json_text, undefined, undefined, function(err, written, buffer) {
            if (err) {
              message = err.message;
              console.log(message);
            }
            else {
              message = 'File: ' + id + '.json written!';
            }

            fs.close(fd);

            req.wolfpack.template = {
              file: 'views/home.jade',
              locals: {
                message: 'RECEIVED: ' + message,
              }
            }
  
            next(req, res);
          });
        }
      });
    }
  },
  'GET:/view/%type/%id': {
    callback: function(req, res, next) {
      // @todo sanitize id
      var id = req.wolfpack.args.id.replace(/[^\-0-9A-Za-z]/g, ''),
          message;

      fs.readFile(req.wolfpack.config.base_path + 'content/' + id + '.json', undefined, function(err, data) {
        if (err) {
          message = err.message;
          console.log(message);
        }
        else {
          var content = JSON.parse(data);

          message = content.fields['input-single-title-textfield'] +
          content.fields['input-single-body-textarea']
          ;
        }

        /** 
         * Load the content type theme callback.
         * We expect that the theme callback will return a template object
         * that we can send around for alteration.
         * 
         * var template = {
         *   file: 'views/template.jade',
         *   locals: {
         *     message: 'My Message',
         *   }
         * }
         */
        def = exports.load_def(req, res, function(req, res) {

          // @todo we should be able to call syncChain from core modules.
          //       should we pass around the full WolfPack obj in req?
          // @todo send error if exists.
          req.wolfpack.content_theme(content, null, function(template) {

            req.wolfpack.template = template;
  
            next(req, res);
          });
        });
      });
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
  // @todo should we sanitize the argument here?
  if (typeof req.wolfpack.content_types[req.wolfpack.args.type] != 'undefined') {
    // Load the form definition.
    req.wolfpack.form_def = req.wolfpack.content_types[req.wolfpack.args.type].form;
    req.wolfpack.form_def.method = 'POST';
    req.wolfpack.form_def.action = '/create/' + req.wolfpack.args.type;
    // Load the theme callback.
    // @todo the theme callback shouldn't be a requirement
    req.wolfpack.content_theme = req.wolfpack.content_types[req.wolfpack.args.type].theme;
  }
  else {
    // @todo 404
    req.wolfpack.form_def = {};
  }

  next(req, res);
}

