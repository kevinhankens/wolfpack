jade = require('jade');

exports.def = {
  engine: jade,
  views: 'views/',
  layout: 'layout.jade',
  renderHtml: function(html, options) {
    return this.engine.render(html, options);
  },
  renderFile: function(file, options, next) {
    this.engine.renderFile(file, options, function(err, html) {
      next(err, html);
    });
  },
}
