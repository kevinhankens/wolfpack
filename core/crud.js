var fs = require('fs')
    aspect = require('../core/aspect.js');

var aspect_chain = aspect.chain;

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
  /**
   * Update form.
   * Load content from the json file and feather with the edit form.
   */
  'GET:/update/%type/%id': {
    callback: function(req, res, next) {
      // @todo sanitize id
      var id = req.wolfpack.args.id.replace(/[^\-0-9A-Za-z]/g, ''),
          message;

      fs.readFile(req.wolfpack.config.base_path + 'content/' + id + '.json', undefined, function(err, data) {
        if (err) {
          req.wolfpack.content.err = err;
          console.log(message);
        }
        else {
          req.wolfpack.content = JSON.parse(data);
        }

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
      });
    }
  },
  'POST:/save/%type': {
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
          req.wolfpack.content.err = err;
          console.log(message);
        }
        else {
          req.wolfpack.content = JSON.parse(data);
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

          aspect_chain({req: req, res: res}, req.wolfpack.overrides.crud_alter_view, function(args) {
            // @todo send error if exists.
            req.wolfpack.content_theme(args.req.wolfpack.content, null, function(template) {

              req.wolfpack.template = template;
  
              next(req, res);
            });
          });
        });
      });
    }
  },
  'GET:/delete/%type/%id': {
    // @todo load this content for a better message (title)
    // @todo 404 handling for bad file name.
    callback: function(req, res, next) {
      var delete_form = {
        method: 'POST',
        action: '/delete/' + req.wolfpack.args.type + '/' + req.wolfpack.args.id,
        elements: {
          delete: {
            type: 'submit',
            value: 'Yes, Delete',
          }
        }
      }

      var form_create = new form.engine(delete_form);
      var message = '<h2>Are you sure?</h2>' + form_create.renderForm();

      req.wolfpack.template = {
        file: 'views/home.jade',
        locals: {
          message: message,
        }
      }

      next(req, res);
    }
  },
  // @todo why doesn't node recognize a DELETE method?
  'POST:/delete/%type/%id': {
    callback: function(req, res, next) {
      var file = req.wolfpack.args.id;
      var file_sanitized = file.replace(/[^0-9a-zA-Z\-]/g, '') + '.json';
      var path = req.wolfpack.config.base_path + 'content/' + file_sanitized;
      // @todo use fs.unlink so that we can check for errors
      var unlink = fs.unlinkSync(path);

      var message = 'Deleted!';

      req.wolfpack.template = {
        file: 'views/home.jade',
        locals: {
          message: message,
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
  // @todo should we sanitize the argument here?
  if (typeof req.wolfpack.content_types[req.wolfpack.args.type] != 'undefined') {
    // Load the form definition.
    req.wolfpack.form_def = req.wolfpack.content_types[req.wolfpack.args.type].form;
    req.wolfpack.form_def.method = 'POST';
    req.wolfpack.form_def.action = '/save/' + req.wolfpack.args.type;

    // Feather saved content if it exists.
    if (typeof req.wolfpack.content != 'undefined') {
      for (element in req.wolfpack.content.fields) {
        // Look for something with the pattern input-cardinality-fieldname-fieldtype.
        // the fieldname will correspond with one of the elements in our form definition.
        var name = element.match(/^([^\-]+[\-]{1}){2}(.*)[\-]{1}[^\-]*$/);
        if (name[2] && typeof req.wolfpack.form_def.elements[name[2]] != 'undefined') {
          req.wolfpack.form_def.elements[name[2]].value = req.wolfpack.content.fields[element];
        }
      }
    }

    // Load the theme callback.
    // @todo the theme callback shouldn't be a requirement
    req.wolfpack.content_theme = req.wolfpack.content_types[req.wolfpack.args.type].theme;
    req.wolfpack.content_type = req.wolfpack.args.type;
  }
  else {
    // @todo 404
    req.wolfpack.form_def = {};
  }

  next(req, res);
}

