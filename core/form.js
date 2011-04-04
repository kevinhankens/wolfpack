module.exports.engine = function(def) {
  this.def = def;
  this.renderedForm = '';
  /**
   * Render an HTML form based on a JSON spec.
   */
  this.renderForm = function() {
    var renderedForm = '<form method="' 
      + this.def.method 
      + '" action="' + this.def.action
      + '" enctype="multipart/form-data">';
    for(element in this.def.elements) {
      var title = typeof this.def.elements[element].title != 'undefined' ? '<h5>' + this.def.elements[element].title + '</h5>'  : '';
      var tag = '';
      if (this.def.elements[element].multi) {

        // For mulitple-value tags, iterate over the value object. This is 
        // either the form defaults or the object loaded from the db.
        // @todo this should regex the prototype class instead of assuming to set it.
        this.def.elements[element].attrs.class = 'prototype';
        for (key in this.def.elements[element].value) {
          var value = this.def.elements[element].value[key]
          tag += this.renderTag(element, value);
          this.def.elements[element].attrs.class = '';
        }

        // Multi-items with no value (new) need at least one form element.
        if (tag == '') {
          tag += this.renderTag(element, '');
        }

        // Additional items will be added via client-side js.
        multi = ' multi';
        add = '<div class="form-add" ord="1">Add another</div>';
      }
      else {

        // Single-value tags.
        tag = this.renderTag(element, this.def.elements[element].value);
        multi = ''
        add = '';
      }

      renderedForm += '<div id="form-' + element + '" class="form-item' + multi + '">' + title + tag + add + '</div>';
    }
    return renderedForm + '</form>';
  }
  /**
   * Render a specific tag.
   * @param string element
   * @param unknown value
   */
  this.renderTag = function(element, value) {

    var type = this.def.elements[element].type
    var attrs = this.renderAttrs(element);
    var tag = '';
    var value = typeof value != 'undefined' ? value : '';
    var id = (this.def.elements[element].multi) ? 'input-multi-' : 'input-single-';
    id += element + '-' + type;

    // Each tag needs separage handling because of attributes, value handling, etc.
    switch(type) {
      case 'textarea':
        tag = '<textarea id="' + id + '" name="' + id + '"' + attrs + '>' + value + '</textarea>';
        break;
      case 'file':
        // File items need a way of preserving their value, so if they are set,
        // we will just send them with a textfield.
        if (value != '') {
          var nstatvalue_attrs = attrs.replace(/prototype/, 'nstatvalue');
          tag = '<input id="' + id + '-nstatvalue" name="' + id + '-nstatvalue" type="textfield" value="' + value + '"' + nstatvalue_attrs + ' />';
        }
        tag += '<input id="' + id + '" name="' + id + '" type="' +type + '"' + attrs + ' />';
        break;
      default:
        tag = '<input id="' + id + '" name="' + id + '" type="' +type + '" value="' + value + '"' + attrs + ' />';
        break;
    }

    return tag
  }
  /**
   * Render attributes for a tag.
   * @param string element
   */
  this.renderAttrs = function(element) {
    // Iterate over the attributes in the form definition and return them
    // to be printed with the tag.
    if (typeof this.def.elements[element].attrs != 'undefined') {
      var attrs = '';
      for (attr in this.def.elements[element].attrs) {
        attrs += ' ' + attr + '="' + this.def.elements[element].attrs[attr] + '"';
      }
    }
    else {
      attrs = '';
    }
    return attrs;
  }
};


