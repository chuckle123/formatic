!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.Formatic=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";

// # index

// Export the Formatic React class at the top level.
module.exports = require("./lib/formatic");

},{"./lib/formatic":51}],2:[function(require,module,exports){
(function (global){
"use strict";

var React = (typeof window !== "undefined" ? window.React : typeof global !== "undefined" ? global.React : null);
var R = React.DOM;
var cx = require("classnames");

module.exports = React.createClass({

  displayName: "Array",

  mixins: [require("../../mixins/field")],

  // getDefaultProps: function () {
  //   return {
  //     className: plugin.config.className
  //   };
  // },

  nextLookupId: 0,

  getInitialState: function getInitialState() {

    // Need to create artificial keys for the array. Indexes are not good keys,
    // since they change. So, map each position to an artificial key
    var lookups = [];

    var items = this.props.field.value;

    items.forEach((function (item, i) {
      lookups[i] = "_" + this.nextLookupId;
      this.nextLookupId++;
    }).bind(this));

    return {
      lookups: lookups
    };
  },

  componentWillReceiveProps: function componentWillReceiveProps(newProps) {

    var lookups = this.state.lookups;

    var items = newProps.field.value;

    // Need to set artificial keys for new array items.
    if (items.length > lookups.length) {
      for (var i = lookups.length; i < items.length; i++) {
        lookups[i] = "_" + this.nextLookupId;
        this.nextLookupId++;
      }
    }

    this.setState({
      lookups: lookups
    });
  },

  onChange: function onChange(i, newValue, info) {
    var newArrayValue = this.props.field.value.slice(0);
    newArrayValue[i] = newValue;
    this.onBubbleValue(newArrayValue, info);
  },

  onAppend: function onAppend(itemChoiceIndex) {
    var config = this.props.config;
    var field = this.props.field;

    var newValue = config.createNewChildFieldValue(field, itemChoiceIndex);

    var items = field.value;

    items = items.concat(newValue);

    this.onChangeValue(items);
  },

  onRemove: function onRemove(i) {
    var lookups = this.state.lookups;
    lookups.splice(i, 1);
    this.setState({
      lookups: lookups
    });
    var newItems = this.props.field.value.slice(0);
    newItems.splice(i, 1);
    this.onChangeValue(newItems);
  },

  onMove: function onMove(fromIndex, toIndex) {
    var lookups = this.state.lookups;
    var fromId = lookups[fromIndex];
    var toId = lookups[toIndex];
    lookups[fromIndex] = toId;
    lookups[toIndex] = fromId;
    this.setState({
      lookups: lookups
    });

    var newItems = this.props.field.value.slice(0);
    if (fromIndex !== toIndex && fromIndex >= 0 && fromIndex < newItems.length && toIndex >= 0 && toIndex < newItems.length) {
      newItems.splice(toIndex, 0, newItems.splice(fromIndex, 1)[0]);
    }
    this.onChangeValue(newItems);
  },

  render: function render() {
    return this.renderWithConfig();
  },

  renderDefault: function renderDefault() {

    var config = this.props.config;
    var field = this.props.field;

    var fields = config.createChildFields(field);

    var arrayControl = undefined;
    if (!config.fieldIsReadOnly(field)) {
      arrayControl = config.createElement("array-control", { field: field, onAppend: this.onAppend });
    }

    var numItems = field.value.length;
    return config.createElement("field", {
      field: field, plain: this.props.plain
    }, R.div({ className: cx(this.props.classes) },
    // css transitions know to cause event problems
    config.cssTransitionWrapper(fields.map((function (childField, i) {
      return config.createElement("array-item", {
        key: this.state.lookups[i],
        field: childField,
        index: i,
        numItems: numItems,
        onMove: this.onMove,
        onRemove: this.onRemove,
        onChange: this.onChange,
        onAction: this.onBubbleAction
      });
    }).bind(this))), arrayControl));
  }
});
// # array component

/*
Render a field to edit array values.
*/

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"../../mixins/field":53,"classnames":64}],3:[function(require,module,exports){
(function (global){
"use strict";

var React = (typeof window !== "undefined" ? window.React : typeof global !== "undefined" ? global.React : null);

module.exports = React.createClass({

  displayName: "Boolean",

  mixins: [require("../../mixins/field")],

  onChange: function onChange(newValue) {
    this.onChangeValue(newValue);
  },

  render: function render() {
    return this.renderWithConfig();
  },

  renderDefault: function renderDefault() {

    var config = this.props.config;
    var field = this.props.field;

    var choices = config.fieldBooleanChoices(field);

    return config.createElement("field", {
      field: field, plain: this.props.plain
    }, config.createElement("select-value", {
      choices: choices, field: field, onChange: this.onChange, onAction: this.onBubbleAction
    }));
  }
});
// # boolean component

/*
Render a dropdown to handle yes/no boolean values.
*/

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"../../mixins/field":53}],4:[function(require,module,exports){
(function (global){
"use strict";

var React = (typeof window !== "undefined" ? window.React : typeof global !== "undefined" ? global.React : null);
var R = React.DOM;
var _ = require("../../undash");
var cx = require("classnames");

module.exports = React.createClass({

  displayName: "CheckboxArray",

  mixins: [require("../../mixins/field")],

  getInitialState: function getInitialState() {
    return {
      choices: this.props.config.fieldChoices(this.props.field)
    };
  },

  componentWillReceiveProps: function componentWillReceiveProps(newProps) {
    this.setState({
      choices: newProps.config.fieldChoices(newProps.field)
    });
  },

  onChange: function onChange() {
    // Get all the checked checkboxes and convert to an array of values.
    var choiceNodes = this.refs.choices.getDOMNode().getElementsByTagName("input");
    choiceNodes = Array.prototype.slice.call(choiceNodes, 0);
    var values = choiceNodes.map(function (node) {
      return node.checked ? node.value : null;
    }).filter(function (value) {
      return value;
    });
    this.onChangeValue(values);
  },

  render: function render() {
    return this.renderWithConfig();
  },

  renderDefault: function renderDefault() {

    var config = this.props.config;
    var field = this.props.field;

    var choices = this.state.choices || [];

    var isInline = !_.find(choices, function (choice) {
      return choice.sample;
    });

    return config.createElement("field", {
      field: field
    }, R.div({ className: cx(this.props.classes), ref: "choices" }, choices.map((function (choice, i) {

      var inputField = R.span({ style: { whiteSpace: "nowrap" } }, R.input({
        name: field.key,
        type: "checkbox",
        value: choice.value,
        checked: field.value.indexOf(choice.value) >= 0 ? true : false,
        onChange: this.onChange,
        onFocus: this.onFocusAction,
        onBlur: this.onBlurAction,
        disabled: this.isReadOnly()
      }), " ", R.span({ className: "field-choice-label" }, choice.label));

      if (isInline) {
        return R.span({ key: i, className: "field-choice" }, inputField, " ");
      } else {
        return R.div({ key: i, className: "field-choice" }, inputField, " ", config.createElement("sample", { field: field, choice: choice }));
      }
    }).bind(this))));
  }
});
// # checkbox-array component

/*
Used with array values to supply multiple checkboxes for adding multiple
enumerated values to an array.
*/

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"../../mixins/field":53,"../../undash":62,"classnames":64}],5:[function(require,module,exports){
(function (global){
"use strict";

var React = (typeof window !== "undefined" ? window.React : typeof global !== "undefined" ? global.React : null);
var R = React.DOM;
var cx = require("classnames");

module.exports = React.createClass({

  displayName: "CheckboxBoolean",

  mixins: [require("../../mixins/field")],

  onChange: function onChange(event) {
    this.onChangeValue(event.target.checked);
  },

  render: function render() {
    return this.renderWithConfig();
  },

  renderDefault: function renderDefault() {

    var config = this.props.config;
    var field = this.props.field;

    return config.createElement("field", {
      config: config, field: field, plain: true
    }, R.span({ style: { whiteSpace: "nowrap" } }, R.input({
      type: "checkbox",
      checked: field.value,
      className: cx(this.props.classes),
      onChange: this.onChange,
      onFocus: this.onFocusAction,
      onBlur: this.onBlurAction,
      disabled: this.isReadOnly()
    }), R.span({}, " "), R.span({}, config.fieldHelpText(field) || config.fieldLabel(field))));
  }
});
// # checkbox-boolean component

/*
Render a field that can edit a boolean with a checkbox.
*/

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"../../mixins/field":53,"classnames":64}],6:[function(require,module,exports){
(function (global){
"use strict";

/* global CodeMirror */
/*eslint no-script-url:0 */

var React = (typeof window !== "undefined" ? window.React : typeof global !== "undefined" ? global.React : null);
var _ = require("../../undash");
var cx = require("classnames");

/*
  A very trimmed down field that uses CodeMirror for syntax highlighting *only*.
 */
module.exports = React.createClass({
  displayName: "Code",

  mixins: [require("../../mixins/field")],

  componentDidMount: function componentDidMount() {
    this.createCodeMirrorEditor();
  },

  componentWillUnmount: function componentWillUnmount() {
    this.removeCodeMirrorEditor();
  },

  getInitialState: function getInitialState() {
    return {
      value: this.props.field.value
    };
  },

  componentWillReceiveProps: function componentWillReceiveProps(nextProps) {
    this.setState({ value: nextProps.field.value });
  },

  tabIndex: function tabIndex() {
    if (this.isReadOnly()) {
      return null;
    }
    return this.props.field.tabIndex;
  },

  render: function render() {
    return this.renderWithConfig();
  },

  renderDefault: function renderDefault() {
    var config = this.props.config;
    var field = this.props.field;
    var props = { field: field, plain: this.props.plain };

    var textBoxClasses = cx(_.extend({}, this.props.classes, { "pretty-text-box": true }));

    // Render read-only version.
    var element = React.createElement(
      "div",
      { className: "pretty-text-wrapper" },
      React.createElement(
        "div",
        { className: textBoxClasses, tabIndex: this.tabIndex(), onFocus: this.onFocusAction, onBlur: this.onBlurAction },
        React.createElement("div", { ref: "textBox", className: "internal-text-wrapper" })
      )
    );

    return config.createElement("field", props, element);
  },

  createCodeMirrorEditor: function createCodeMirrorEditor() {
    var config = this.props.config;
    var field = this.props.field;
    var readOnly = config.fieldIsReadOnly(field);

    var options = {
      lineWrapping: true,
      tabindex: this.tabIndex(),
      value: String(this.state.value),
      mode: this.props.field.language || null,
      readOnly: readOnly ? "nocursor" : false // 'nocursor' means read only and not focusable
    };

    if (this.props.field.codeMirrorOptions) {
      options = _.extend({}, options, this.props.field.codeMirrorOptions);
    }

    var textBox = this.refs.textBox.getDOMNode();
    this.codeMirror = CodeMirror(textBox, options);
    this.codeMirror.on("change", this.onCodeMirrorChange);
  },

  removeCodeMirrorEditor: function removeCodeMirrorEditor() {
    var textBoxNode = this.refs.textBox.getDOMNode();
    var cmNode = textBoxNode.firstChild;
    textBoxNode.removeChild(cmNode);
    this.codeMirror = null;
  },

  onCodeMirrorChange: function onCodeMirrorChange() {
    if (this.updatingCodeMirror) {
      // avoid recursive update cycle, and mark the code mirror manual update as done
      this.updatingCodeMirror = false;
      return;
    }

    var newValue = this.codeMirror.getValue();
    this.onChangeValue(newValue);
    this.setState({ value: newValue });
  }

});

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"../../mixins/field":53,"../../undash":62,"classnames":64}],7:[function(require,module,exports){
(function (global){
"use strict";

var React = (typeof window !== "undefined" ? window.React : typeof global !== "undefined" ? global.React : null);
var R = React.DOM;
var cx = require("classnames");

module.exports = React.createClass({

  displayName: "Copy",

  mixins: [require("../../mixins/field")],

  render: function render() {
    return this.renderWithConfig();
  },

  renderDefault: function renderDefault() {

    return R.div({ className: cx(this.props.classes), dangerouslySetInnerHTML: {
        __html: this.props.config.fieldHelpText(this.props.field)
      } });
  }
});
// # copy component

/*
Render non-editable html/text (think article copy).
*/

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"../../mixins/field":53,"classnames":64}],8:[function(require,module,exports){
(function (global){
"use strict";

var React = (typeof window !== "undefined" ? window.React : typeof global !== "undefined" ? global.React : null);
var R = React.DOM;
var _ = require("../../undash");
var cx = require("classnames");

module.exports = React.createClass({

  displayName: "Fields",

  mixins: [require("../../mixins/field")],

  onChangeField: function onChangeField(key, newValue, info) {
    if (!key) {
      var parentPath = this.props.config.fieldValuePath(this.props.field);
      var childPath = this.props.config.fieldValuePath(info.field).slice(parentPath.length);
      key = childPath[0];
      if (key) {
        newValue = newValue[key];
      }
    }
    if (key) {
      var newObjectValue = _.extend({}, this.props.field.value);
      newObjectValue[key] = newValue;
      this.onBubbleValue(newObjectValue, info);
    }
  },

  render: function render() {
    return this.renderWithConfig();
  },

  renderDefault: function renderDefault() {
    var config = this.props.config;
    var field = this.props.field;

    var fields = config.createChildFields(field);

    // Want to move to fieldset with legend, but doing a little backward-compatible
    // hacking here, only converting child `fields` without keys.
    var isGroup = !!(field.parent && !field.key);

    var classes = _.extend({}, this.props.classes);

    if (isGroup) {
      classes["child-fields-group"] = true;
    }

    return config.createElement("field", {
      config: config, field: field, plain: isGroup || this.props.plain
    }, R.fieldset({ className: cx(classes) }, isGroup ? React.createElement(
      "legend",
      null,
      config.fieldLabel(field)
    ) : null, fields.map((function (childField, i) {
      var key = childField.key || i;
      return config.createFieldElement({
        key: key || i,
        field: childField,
        onChange: this.onChangeField.bind(this, childField.key), onAction: this.onBubbleAction
      });
    }).bind(this))));
  }

});
// # fields component

/*
Render a field to edit the values of an object with static properties.
*/

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"../../mixins/field":53,"../../undash":62,"classnames":64}],9:[function(require,module,exports){
(function (global){
"use strict";

var React = (typeof window !== "undefined" ? window.React : typeof global !== "undefined" ? global.React : null);
var _ = require("../../undash");
var cx = require("classnames");

var groupFields = function groupFields(fields, humanize) {
  var groupedFields = [];

  fields.forEach(function (field) {
    if (field.groupKey) {
      var group = _.find(groupedFields, function (g) {
        return g.isGroup && field.groupKey === g.key;
      });

      if (!group) {
        group = {
          key: field.groupKey,
          label: field.groupLabel || humanize(field.groupKey),
          children: [],
          isGroup: true
        };
        groupedFields.push(group);
      }

      group.children.push(field);
    } else {
      groupedFields.push(field); // top level field
    }
  });

  return groupedFields;
};

module.exports = React.createClass({

  displayName: "GroupedFields",

  mixins: [require("../../mixins/field")],

  onChangeField: function onChangeField(key, newValue, info) {
    if (key) {
      var newObjectValue = _.extend({}, this.props.field.value);
      newObjectValue[key] = newValue;
      this.onBubbleValue(newObjectValue, info);
    }
  },

  renderFields: function renderFields(fields, groupKey, groupLabel) {
    var config = this.props.config;
    var self = this;

    var childFields = fields.map(function (fieldOrGroup) {
      if (fieldOrGroup.isGroup) {
        return self.renderFields(fieldOrGroup.children, fieldOrGroup.key, fieldOrGroup.label);
      }

      var key = fieldOrGroup.key;
      return config.createFieldElement({
        key: key,
        field: fieldOrGroup,
        onChange: self.onChangeField.bind(self, key),
        onAction: self.onBubbleAction
      });
    });

    var legend;
    var className = cx(this.props.classes);

    if (groupLabel) {
      legend = React.createElement(
        "legend",
        null,
        groupLabel
      );
      className += " child-fields-group";
    }

    return React.createElement(
      "fieldset",
      { key: groupKey, className: className },
      legend,
      childFields
    );
  },

  render: function render() {
    return this.renderWithConfig();
  },

  renderDefault: function renderDefault() {
    var config = this.props.config;
    var field = this.props.field;

    var fields = groupFields(config.createChildFields(field), config.humanize);

    return config.createElement("field", {
      config: config, field: field, plain: this.props.plain
    }, this.renderFields(fields));
  }

});
// # fields component

/*
Render a fields in groups. Grouped by field.groupKey property.
*/

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"../../mixins/field":53,"../../undash":62,"classnames":64}],10:[function(require,module,exports){
(function (global){
"use strict";

var React = (typeof window !== "undefined" ? window.React : typeof global !== "undefined" ? global.React : null);
var R = React.DOM;
var cx = require("classnames");

module.exports = React.createClass({

  displayName: "Json",

  mixins: [require("../../mixins/field")],

  getDefaultProps: function getDefaultProps() {
    return {
      rows: 5
    };
  },

  isValidValue: function isValidValue(value) {

    try {
      JSON.parse(value);
      return true;
    } catch (e) {
      return false;
    }
  },

  getInitialState: function getInitialState() {
    return {
      isValid: true,
      value: JSON.stringify(this.props.field.value, null, 2)
    };
  },

  onChange: function onChange(event) {
    var isValid = this.isValidValue(event.target.value);

    if (isValid) {
      // Need to handle this better. Need to track position.
      this._isChanging = true;
      this.onChangeValue(JSON.parse(event.target.value));
    }

    this.setState({
      isValid: isValid,
      value: event.target.value
    });
  },

  componentWillReceiveProps: function componentWillReceiveProps(nextProps) {
    if (!this._isChanging) {
      this.setState({
        isValid: true,
        value: JSON.stringify(nextProps.field.value, null, 2)
      });
    }
    this._isChanging = false;
  },

  render: function render() {
    return this.renderWithConfig();
  },

  renderDefault: function renderDefault() {
    var config = this.props.config;
    var field = this.props.field;

    return config.createElement("field", {
      field: config.fieldWithValue(field, this.state.value), plain: this.props.plain
    }, R.textarea({
      className: cx(this.props.classes),
      value: this.state.value,
      onChange: this.onChange,
      style: { backgroundColor: this.state.isValid ? "" : "rgb(255,200,200)" },
      rows: config.fieldRows(field) || this.props.rows,
      onFocus: this.onFocusAction,
      onBlur: this.onBlurAction,
      disabled: this.isReadOnly()
    }));
  }
});
// # json component

/*
Textarea editor for JSON. Will validate the JSON before setting the value, so
while the value is invalid, no external state changes will occur.
*/

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"../../mixins/field":53,"classnames":64}],11:[function(require,module,exports){
(function (global){
"use strict";

var React = (typeof window !== "undefined" ? window.React : typeof global !== "undefined" ? global.React : null);
var R = React.DOM;
var _ = require("../../undash");
var cx = require("classnames");

var tempKeyPrefix = "$$__temp__";

var tempKey = function tempKey(id) {
  return tempKeyPrefix + id;
};

var isTempKey = function isTempKey(key) {
  return key.substring(0, tempKeyPrefix.length) === tempKeyPrefix;
};

// TODO: keep invalid keys as state and don't send in onChange; clone context
// and use clone to create child contexts

module.exports = React.createClass({

  displayName: "Object",

  mixins: [require("../../mixins/field")],

  nextLookupId: 0,

  getInitialState: function getInitialState() {

    var keyToId = {};
    var keys = Object.keys(this.props.field.value);
    var keyOrder = [];
    // Temp keys keeps the key to display, which sometimes may be different
    // than the actual key. For example, duplicate keys are not allowed,
    // but we may temporarily show duplicate keys.
    var tempDisplayKeys = {};

    // Keys don't make good react keys, since we're allowing them to be
    // changed here, so we'll have to create fake keys and
    // keep track of the mapping of real keys to fake keys. Yuck.
    keys.forEach((function (key) {
      var id = ++this.nextLookupId;
      // Map the real key to the id.
      keyToId[key] = id;
      // Keep the ordering of the keys so we don't shuffle things around later.
      keyOrder.push(key);
      // If this is a temporary key that was persisted, best we can do is display
      // a blank.
      // TODO: Probably just not send temporary keys back through. This behavior
      // is actually leftover from an earlier incarnation of formatic where
      // values had to go back to the root.
      if (isTempKey(key)) {
        tempDisplayKeys[id] = "";
      }
    }).bind(this));

    return {
      keyToId: keyToId,
      keyOrder: keyOrder,
      // Temp keys keeps the key to display, which sometimes may be different
      // than the actual key. For example, duplicate keys are not allowed,
      // but we may temporarily show duplicate keys.
      tempDisplayKeys: tempDisplayKeys
    };
  },

  componentWillReceiveProps: function componentWillReceiveProps(newProps) {

    var keyToId = this.state.keyToId;
    var newKeyToId = {};
    var tempDisplayKeys = this.state.tempDisplayKeys;
    var newTempDisplayKeys = {};
    var keyOrder = this.state.keyOrder;
    var keys = Object.keys(newProps.field.value);
    var addedKeys = [];

    // Look at the new keys.
    keys.forEach((function (key) {
      // Add new lookup if this key wasn't here last time.
      if (!keyToId[key]) {
        this.nextLookupId++;
        newKeyToId[key] = this.nextLookupId;
        addedKeys.push(key);
      } else {
        newKeyToId[key] = keyToId[key];
      }
      if (isTempKey(key) && newKeyToId[key] in tempDisplayKeys) {
        newTempDisplayKeys[newKeyToId[key]] = tempDisplayKeys[newKeyToId[key]];
      }
    }).bind(this));

    var newKeyOrder = [];

    // Look at the old keys.
    keyOrder.forEach(function (key) {
      // If the key is in the new keys, push it onto the order to retain the
      // same order.
      if (newKeyToId[key]) {
        newKeyOrder.push(key);
      }
    });

    // Put added fields at the end. (So things don't get shuffled.)
    newKeyOrder = newKeyOrder.concat(addedKeys);

    this.setState({
      keyToId: newKeyToId,
      keyOrder: newKeyOrder,
      tempDisplayKeys: newTempDisplayKeys
    });
  },

  onChange: function onChange(key, newValue, info) {
    var newObj = _.extend({}, this.props.field.value);
    newObj[key] = newValue;
    this.onBubbleValue(newObj, info);
  },

  onAppend: function onAppend(itemChoiceIndex) {
    var config = this.props.config;
    var field = this.props.field;
    this.nextLookupId++;

    var keyToId = this.state.keyToId;
    var keyOrder = this.state.keyOrder;
    var tempDisplayKeys = this.state.tempDisplayKeys;

    var id = this.nextLookupId;
    var newKey = tempKey(id);

    keyToId[newKey] = id;
    // Temporarily, we'll show a blank key.
    tempDisplayKeys[id] = "";
    keyOrder.push(newKey);

    this.setState({
      keyToId: keyToId,
      tempDisplayKeys: tempDisplayKeys,
      keyOrder: keyOrder
    });

    var newObj = _.extend(this.props.field.value);

    var newValue = config.createNewChildFieldValue(field, itemChoiceIndex);

    newObj[newKey] = newValue;

    this.onChangeValue(newObj);
  },

  onRemove: function onRemove(key) {
    var newObj = _.extend(this.props.field.value);
    delete newObj[key];
    this.onChangeValue(newObj);
  },

  onMove: function onMove(fromKey, toKey) {
    if (fromKey !== toKey) {
      var keyToId = this.state.keyToId;
      var keyOrder = this.state.keyOrder;
      var tempDisplayKeys = this.state.tempDisplayKeys;

      var newObj = _.extend(this.props.field.value);

      // If we already have the key we're moving to, then we have to change that
      // key to something else.
      if (keyToId[toKey]) {
        // Make a new
        var tempToKey = tempKey(keyToId[toKey]);
        tempDisplayKeys[keyToId[toKey]] = toKey;
        keyToId[tempToKey] = keyToId[toKey];
        keyOrder[keyOrder.indexOf(toKey)] = tempToKey;
        delete keyToId[toKey];
        this.setState({
          keyToId: keyToId,
          tempDisplayKeys: tempDisplayKeys,
          keyOrder: keyOrder
        });

        newObj[tempToKey] = newObj[toKey];
        delete newObj[toKey];
      }

      if (!toKey) {
        toKey = tempKey(keyToId[fromKey]);
        tempDisplayKeys[keyToId[fromKey]] = "";
      }
      keyToId[toKey] = keyToId[fromKey];
      delete keyToId[fromKey];
      keyOrder[keyOrder.indexOf(fromKey)] = toKey;

      this.setState({
        keyToId: keyToId,
        keyOrder: keyOrder,
        tempDisplayKeys: tempDisplayKeys
      });

      newObj[toKey] = newObj[fromKey];
      delete newObj[fromKey];

      this.onChangeValue(newObj);

      // Check if our fromKey has opened up a spot.
      if (fromKey && fromKey !== toKey) {
        if (!(fromKey in newObj)) {
          Object.keys(newObj).forEach((function (key) {
            if (!isTempKey(key)) {
              return;
            }
            var id = keyToId[key];
            var displayKey = tempDisplayKeys[id];
            if (fromKey === displayKey) {
              this.onMove(key, displayKey);
            }
          }).bind(this));
        }
      }
    }
  },

  getFields: function getFields() {
    var config = this.props.config;
    var field = this.props.field;

    var fields = config.createChildFields(field);

    var keyToField = {};

    _.each(fields, function (childField) {
      keyToField[childField.key] = childField;
    });

    return this.state.keyOrder.map(function (key) {
      return keyToField[key];
    });
  },

  render: function render() {
    return this.renderWithConfig();
  },

  renderDefault: function renderDefault() {

    var config = this.props.config;
    var field = this.props.field;

    var fields = this.getFields();

    return config.createElement("field", {
      field: field, plain: this.props.plain
    }, R.div({ className: cx(this.props.classes) }, config.cssTransitionWrapper(fields.map((function (childField) {
      var displayKey = this.state.tempDisplayKeys[this.state.keyToId[childField.key]];
      if (_.isUndefined(displayKey)) {
        displayKey = childField.key;
      }
      return config.createElement("object-item", {
        key: this.state.keyToId[childField.key],
        field: childField,
        onMove: this.onMove,
        onRemove: this.onRemove,
        onChange: this.onChange,
        onAction: this.onBubbleAction,
        displayKey: displayKey,
        itemKey: childField.key
      });
    }).bind(this))), config.createElement("object-control", { field: field, onAppend: this.onAppend })));
  }
});
// # object component

/*
Render a field to edit an object with dynamic child fields.
*/

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"../../mixins/field":53,"../../undash":62,"classnames":64}],12:[function(require,module,exports){
(function (global){
"use strict";

var React = (typeof window !== "undefined" ? window.React : typeof global !== "undefined" ? global.React : null);
var R = React.DOM;
var cx = require("classnames");

module.exports = React.createClass({

  displayName: "Password",

  mixins: [require("../../mixins/field")],

  onChange: function onChange(event) {
    this.onChangeValue(event.target.value);
  },

  render: function render() {
    return this.renderWithConfig();
  },

  renderDefault: function renderDefault() {

    var config = this.props.config;
    var field = this.props.field;

    return config.createElement("field", {
      config: config, field: field, plain: this.props.plain
    }, R.input({
      type: "password",
      value: this.props.field.value,
      className: cx(this.props.classes),
      onChange: this.onChange,
      onFocus: this.onFocusAction,
      onBlur: this.onBlurAction,
      disabled: this.isReadOnly()
    }));
  }
});
// # single-line-string component

/*
Render a single line text input.
*/

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"../../mixins/field":53,"classnames":64}],13:[function(require,module,exports){
(function (global){
"use strict";

var React = (typeof window !== "undefined" ? window.React : typeof global !== "undefined" ? global.React : null);

module.exports = React.createClass({

  displayName: "PrettyBoolean",

  mixins: [require("../../mixins/field")],

  onChange: function onChange(newValue) {
    this.onChangeValue(newValue);
  },

  render: function render() {
    return this.renderWithConfig();
  },

  renderDefault: function renderDefault() {
    var config = this.props.config;
    var field = this.props.field;

    var choices = config.fieldBooleanChoices(field);

    return config.createElement("field", {
      field: field, plain: this.props.plain
    }, config.createElement("pretty-select-value", {
      choices: choices, field: field, onChange: this.onChange, onAction: this.onBubbleAction
    }));
  }
});
// # pretty boolean component

/*
Render pretty boolean component with non-native drop-down
*/

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"../../mixins/field":53}],14:[function(require,module,exports){
(function (global){
"use strict";

var React = (typeof window !== "undefined" ? window.React : typeof global !== "undefined" ? global.React : null);

module.exports = React.createClass({

  displayName: "PrettySelect",

  mixins: [require("../../mixins/field")],

  getInitialState: function getInitialState() {
    return {
      choices: this.props.config.fieldPrettyChoices(this.props.field)
    };
  },

  componentWillReceiveProps: function componentWillReceiveProps(newProps) {
    this.setState({
      choices: newProps.config.fieldPrettyChoices(newProps.field)
    });
  },

  render: function render() {
    return this.renderWithConfig();
  },

  onChange: function onChange(value, info) {
    if (info && info.isCustomValue) {
      this.props.onChange(value, {
        field: this.props.field,
        isCustomValue: true
      });
    } else {
      this.onChangeValue(value);
    }
  },

  renderDefault: function renderDefault() {

    var config = this.props.config;
    var field = this.props.field;

    return config.createElement("field", {
      config: config, field: field, plain: this.props.plain, classes: this.props.classes
    }, config.createElement("pretty-select-value", {
      choices: this.state.choices, field: field, onChange: this.onChange, onAction: this.onBubbleAction
    }));
  }
});
// # select component

/*
Render select element to give a user choices for the value of a field. Renders non-native
select drop down and supports fancier renderings.
*/

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"../../mixins/field":53}],15:[function(require,module,exports){
(function (global){
"use strict";

/*eslint no-script-url:0 */

var React = (typeof window !== "undefined" ? window.React : typeof global !== "undefined" ? global.React : null);
var _ = require("../../undash");
var cx = require("classnames");

/*
   Wraps a PrettyTextInput to be a stand alone field.
 */
module.exports = React.createClass({

  displayName: "PrettyText",

  mixins: [require("../../mixins/field")],

  render: function render() {
    return this.renderWithConfig();
  },

  focus: function focus() {
    this.refs.textBox.focus();
  },

  renderDefault: function renderDefault() {

    var config = this.props.config;
    var field = this.props.field;
    var props = { field: field, plain: this.props.plain };

    var readOnly = config.fieldIsReadOnly(field);

    // The tab index makes this control focusable and editable. If read only, no tabIndex
    var tabIndex = readOnly ? null : field.tabIndex;

    var element = config.createElement("pretty-text-input", {
      classes: this.props.classes,
      tabIndex: tabIndex,
      onChange: this.onChangeValue,
      onFocus: this.onFocusAction,
      onBlur: this.onBlurAction,
      onAction: this.onBubbleAction,
      field: this.props.field,
      value: this.props.field.value,
      isAccordion: this.props.field.isAccordion,
      selectedChoices: this.props.config.fieldSelectedReplaceChoices(this.props.field),
      replaceChoices: this.props.config.fieldReplaceChoices(this.props.field),
      ref: "textBox",
      readOnly: readOnly
    });

    return config.createElement("field", props, element);
  }
});

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"../../mixins/field":53,"../../undash":62,"classnames":64}],16:[function(require,module,exports){
(function (global){
"use strict";

var React = (typeof window !== "undefined" ? window.React : typeof global !== "undefined" ? global.React : null);

module.exports = React.createClass({

  displayName: "Select",

  mixins: [require("../../mixins/field")],

  getInitialState: function getInitialState() {
    return {
      choices: this.props.config.fieldChoices(this.props.field)
    };
  },

  componentWillReceiveProps: function componentWillReceiveProps(newProps) {
    this.setState({
      choices: newProps.config.fieldChoices(newProps.field)
    });
  },

  render: function render() {
    return this.renderWithConfig();
  },

  renderDefault: function renderDefault() {

    var config = this.props.config;
    var field = this.props.field;

    return config.createElement("field", {
      config: config, field: field, plain: this.props.plain
    }, config.createElement("select-value", {
      choices: this.state.choices, field: field, onChange: this.onChangeValue, onAction: this.onBubbleAction
    }));
  }
});
// # select component

/*
Render select element to give a user choices for the value of a field. Note
it should support values other than strings. Currently this is only tested for
boolean values, but it _should_ work for other values.
*/

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"../../mixins/field":53}],17:[function(require,module,exports){
(function (global){
"use strict";

var React = (typeof window !== "undefined" ? window.React : typeof global !== "undefined" ? global.React : null);
var R = React.DOM;
var cx = require("classnames");

module.exports = React.createClass({

  displayName: "SingleLineString",

  mixins: [require("../../mixins/field")],

  onChange: function onChange(event) {
    this.onChangeValue(event.target.value);
  },

  render: function render() {
    return this.renderWithConfig();
  },

  renderDefault: function renderDefault() {

    var config = this.props.config;
    var field = this.props.field;

    return config.createElement("field", {
      config: config, field: field, plain: this.props.plain
    }, R.input({
      type: "text",
      value: this.props.field.value,
      className: cx(this.props.classes),
      onChange: this.onChange,
      onFocus: this.onFocusAction,
      onBlur: this.onBlurAction,
      readOnly: config.fieldIsReadOnly(field)
    }));
  }
});
// # single-line-string component

/*
Render a single line text input.
*/

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"../../mixins/field":53,"classnames":64}],18:[function(require,module,exports){
(function (global){
"use strict";

var React = (typeof window !== "undefined" ? window.React : typeof global !== "undefined" ? global.React : null);
var R = React.DOM;
var cx = require("classnames");

module.exports = React.createClass({

  displayName: "String",

  mixins: [require("../../mixins/field")],

  onChange: function onChange(event) {
    this.onChangeValue(event.target.value);
  },

  render: function render() {
    return this.renderWithConfig();
  },

  renderDefault: function renderDefault() {

    var config = this.props.config;
    var field = this.props.field;

    return config.createElement("field", {
      config: config, field: field, plain: this.props.plain
    }, R.textarea({
      value: field.value,
      className: cx(this.props.classes),
      rows: field.rows || this.props.rows,
      onChange: this.onChange,
      onFocus: this.onFocusAction,
      onBlur: this.onBlurAction,
      disabled: this.isReadOnly()
    }));
  }
});
// # string component

/*
Render a field that can edit a string value.
*/

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"../../mixins/field":53,"classnames":64}],19:[function(require,module,exports){
(function (global){
"use strict";

var React = (typeof window !== "undefined" ? window.React : typeof global !== "undefined" ? global.React : null);
var R = React.DOM;

module.exports = React.createClass({

  displayName: "Unknown",

  mixins: [require("../../mixins/field")],

  render: function render() {
    return this.renderWithConfig();
  },

  renderDefault: function renderDefault() {
    return R.div({}, R.div({}, "Component not found for: "), R.pre({}, JSON.stringify(this.props.field.rawFieldTemplate, null, 2)));
  }

});
// # unknown component

/*
Render a field with an unknown type.
*/

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"../../mixins/field":53}],20:[function(require,module,exports){
(function (global){
"use strict";

var React = (typeof window !== "undefined" ? window.React : typeof global !== "undefined" ? global.React : null);
var R = React.DOM;
var cx = require("classnames");

module.exports = React.createClass({

  displayName: "AddItem",

  mixins: [require("../../mixins/helper")],

  getDefaultProps: function getDefaultProps() {
    return {
      label: "[add]"
    };
  },

  render: function render() {
    return this.renderWithConfig();
  },

  renderDefault: function renderDefault() {
    return R.span({ className: cx(this.props.classes), onClick: this.props.onClick }, this.props.label);
  }
});
// # add-item component

/*
The add button to append an item to a field.
*/

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"../../mixins/helper":54,"classnames":64}],21:[function(require,module,exports){
(function (global){
"use strict";

var React = (typeof window !== "undefined" ? window.React : typeof global !== "undefined" ? global.React : null);
var R = React.DOM;
var cx = require("classnames");

module.exports = React.createClass({

  displayName: "ArrayControl",

  mixins: [require("../../mixins/helper")],

  getInitialState: function getInitialState() {
    return {
      fieldTemplateIndex: 0
    };
  },

  onSelect: function onSelect(index) {
    this.setState({
      fieldTemplateIndex: index
    });
  },

  onAppend: function onAppend() {
    this.props.onAppend(this.state.fieldTemplateIndex);
  },

  render: function render() {
    return this.renderWithConfig();
  },

  renderDefault: function renderDefault() {

    var config = this.props.config;

    var field = this.props.field;
    var fieldTemplates = config.fieldItemFieldTemplates(field);
    var typeChoices = null;

    if (!this.isReadOnly() && fieldTemplates.length > 0) {
      typeChoices = config.createElement("field-template-choices", {
        field: field, fieldTemplateIndex: this.state.fieldTemplateIndex, onSelect: this.onSelect
      });
    }

    var addItem = undefined;
    if (!this.isReadOnly()) {
      addItem = config.createElement("add-item", { field: field, onClick: this.onAppend });
    }

    return R.div({ className: cx(this.props.classes) }, typeChoices, " ", addItem);
  }
});
// # array-control component

/*
Render the item type choices and the add button for an array.
*/

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"../../mixins/helper":54,"classnames":64}],22:[function(require,module,exports){
(function (global){
"use strict";

var React = (typeof window !== "undefined" ? window.React : typeof global !== "undefined" ? global.React : null);
var R = React.DOM;
var cx = require("classnames");

module.exports = React.createClass({

  displayName: "ArrayItemControl",

  mixins: [require("../../mixins/helper")],

  onMoveBack: function onMoveBack() {
    this.props.onMove(this.props.index, this.props.index - 1);
  },

  onMoveForward: function onMoveForward() {
    this.props.onMove(this.props.index, this.props.index + 1);
  },

  onRemove: function onRemove() {
    this.props.onRemove(this.props.index);
  },

  render: function render() {
    return this.renderWithConfig();
  },

  renderDefault: function renderDefault() {
    var config = this.props.config;
    var field = this.props.field;

    return R.div({ className: cx(this.props.classes) }, config.createElement("remove-item", { field: field, onClick: this.onRemove, onMaybeRemove: this.props.onMaybeRemove }), this.props.index > 0 ? config.createElement("move-item-back", { field: field, onClick: this.onMoveBack }) : null, this.props.index < this.props.numItems - 1 ? config.createElement("move-item-forward", { field: field, onClick: this.onMoveForward }) : null);
  }
});
// # array-item-control component

/*
Render the remove and move buttons for an array field.
*/

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"../../mixins/helper":54,"classnames":64}],23:[function(require,module,exports){
(function (global){
"use strict";

var React = (typeof window !== "undefined" ? window.React : typeof global !== "undefined" ? global.React : null);
var R = React.DOM;
var cx = require("classnames");

module.exports = React.createClass({

  displayName: "ArrayItemValue",

  mixins: [require("../../mixins/helper")],

  onChangeField: function onChangeField(newValue, info) {
    this.props.onChange(this.props.index, newValue, info);
  },

  render: function render() {
    return this.renderWithConfig();
  },

  renderDefault: function renderDefault() {
    var config = this.props.config;
    var field = this.props.field;

    return R.div({ className: cx(this.props.classes) }, config.createFieldElement({ field: field, onChange: this.onChangeField, onAction: this.onBubbleAction }));
  }
});
// # array-item-value component

/*
Render the value of an array item.
*/

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"../../mixins/helper":54,"classnames":64}],24:[function(require,module,exports){
(function (global){
"use strict";

var React = (typeof window !== "undefined" ? window.React : typeof global !== "undefined" ? global.React : null);
var R = React.DOM;
var cx = require("classnames");
var _ = require("../../undash");

module.exports = React.createClass({

  displayName: "ArrayItem",

  mixins: [require("../../mixins/helper")],

  getInitialState: function getInitialState() {
    return {
      isMaybeRemoving: false
    };
  },

  render: function render() {
    return this.renderWithConfig();
  },

  onMaybeRemove: function onMaybeRemove(isMaybeRemoving) {
    this.setState({
      isMaybeRemoving: isMaybeRemoving
    });
  },

  renderDefault: function renderDefault() {
    var config = this.props.config;
    var field = this.props.field;

    var classes = _.extend({}, this.props.classes);

    if (this.state.isMaybeRemoving) {
      classes["maybe-removing"] = true;
    }

    var arrayItemControl = undefined;
    if (!config.fieldIsReadOnly(field)) {
      arrayItemControl = config.createElement("array-item-control", { field: field, index: this.props.index, numItems: this.props.numItems,
        onMove: this.props.onMove, onRemove: this.props.onRemove, onMaybeRemove: this.onMaybeRemove });
    }

    return R.div({ className: cx(classes) }, config.createElement("array-item-value", { field: field, index: this.props.index,
      onChange: this.props.onChange, onAction: this.onBubbleAction }), arrayItemControl);
  }
});
// # array-item component

/*
Render an array item.
*/

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"../../mixins/helper":54,"../../undash":62,"classnames":64}],25:[function(require,module,exports){
(function (global){
"use strict";

var React = (typeof window !== "undefined" ? window.React : typeof global !== "undefined" ? global.React : null);
var cx = require("classnames");

module.exports = React.createClass({

  displayName: "ChoiceSectionHeader",

  mixins: [require("../../mixins/helper")],

  render: function render() {
    return this.renderWithConfig();
  },

  renderDefault: function renderDefault() {
    var choice = this.props.choice;
    return React.createElement(
      "span",
      { className: cx(this.props.classes) },
      choice.label
    );
  }
});
// # ChoiceSectionHeader component

/*
Render section header in choices dropdown
*/

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"../../mixins/helper":54,"classnames":64}],26:[function(require,module,exports){
(function (global){
"use strict";

var React = (typeof window !== "undefined" ? window.React : typeof global !== "undefined" ? global.React : null);

module.exports = React.createClass({

  displayName: "ChoicesSearch",

  mixins: [require("../../mixins/helper")],

  render: function render() {
    return this.renderWithConfig();
  },

  renderDefault: function renderDefault() {
    return React.createElement(
      "div",
      { className: "choices-search" },
      React.createElement("input", { type: "text", placeholder: "Search...", onChange: this.props.onChange })
    );
  }

});
// # choices-search component

/*
   Render a search box for choices.
 */

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"../../mixins/helper":54}],27:[function(require,module,exports){
(function (global){
"use strict";

var React = (typeof window !== "undefined" ? window.React : typeof global !== "undefined" ? global.React : null);
var R = React.DOM;
var _ = require("../../undash");
var ScrollLock = require("react-scroll-lock");

var magicChoiceRe = /^\/\/\/[^\/]+\/\/\/$/;

module.exports = React.createClass({

  displayName: "Choices",

  mixins: [require("../../mixins/helper"),
  //plugin.require('mixin.resize'),
  //plugin.require('mixin.scroll'),
  require("../../mixins/click-outside"), ScrollLock],

  getInitialState: function getInitialState() {
    return {
      maxHeight: null,
      open: this.props.open,
      searchString: ""
    };
  },

  getIgnoreCloseNodes: function getIgnoreCloseNodes() {
    if (!this.props.ignoreCloseNodes) {
      return [];
    }
    var nodes = this.props.ignoreCloseNodes();
    if (!_.isArray(nodes)) {
      nodes = [nodes];
    }
    return nodes;
  },

  componentDidMount: function componentDidMount() {
    this.setOnClickOutside("container", (function (event) {

      // Make sure we don't find any nodes to ignore.
      if (!_.find(this.getIgnoreCloseNodes(), (function (node) {
        return this.isNodeInside(event.target, node);
      }).bind(this))) {
        this.onClose();
      }
    }).bind(this));

    this.adjustSize();
    this.updateListeningToWindow();
  },

  componentWillUnmount: function componentWillUnmount() {
    this.stopListeningToWindow();
  },

  onSelect: function onSelect(choice, event) {
    this.setState({
      openSection: null,
      searchString: ""
    });
    this.props.onSelect(choice.value, event);
  },

  onChoiceAction: function onChoiceAction(choice) {
    this.setState({
      openSection: null,
      searchString: ""
    });
    this.props.onChoiceAction(choice);
  },

  onClose: function onClose() {
    this.setState({
      openSection: null,
      searchString: ""
    });
    this.props.onClose();
  },

  // Doing something a little crazy... measuring on every frame. Makes this smoother than using an interval.
  // Can't using scrolling events, because we might be scrolling inside a container instead of the body.
  // Shouldn't be any more costly than animations though, I think. And only one of these is open at a time.
  updateListeningToWindow: function updateListeningToWindow() {
    var _this = this;

    if (this.refs.choices) {
      if (!this.isListening) {
        (function () {
          var listenToFrame = function () {
            requestAnimationFrame(function () {
              _this.adjustSize();
              if (_this.isListening) {
                listenToFrame();
              }
            });
          };
          _this.isListening = true;
          listenToFrame();
        })();
      }
    } else {
      if (this.isListening) {
        this.stopListeningToWindow();
      }
    }
  },

  stopListeningToWindow: function stopListeningToWindow() {
    if (this.isListening) {
      this.isListening = false;
    }
  },

  adjustSize: function adjustSize() {
    if (this.refs.choices) {
      var node = this.refs.container.getDOMNode();
      var rect = node.getBoundingClientRect();
      var top = rect.top;
      var windowHeight = window.innerHeight;
      var height = Math.min(windowHeight - top, windowHeight);
      if (height !== this.state.maxHeight) {
        this.setState({
          maxHeight: height
        });
      }
    }
  },

  componentWillReceiveProps: function componentWillReceiveProps(nextProps) {
    var nextState = {
      open: nextProps.open
    };

    this.setState(nextState, (function () {
      this.adjustSize();
      this.updateListeningToWindow();
    }).bind(this));
  },

  onHeaderClick: function onHeaderClick(choice) {
    if (this.state.openSection === choice.sectionKey) {
      this.setState({ openSection: null });
    } else {
      this.setState({ openSection: choice.sectionKey }, this.adjustSize);
    }
  },

  hasOneSection: function hasOneSection() {
    var sectionHeaders = this.props.choices.filter(function (c) {
      return c.sectionKey;
    });
    return sectionHeaders.length === 1;
  },

  visibleChoices: (function (_visibleChoices) {
    var _visibleChoicesWrapper = function visibleChoices() {
      return _visibleChoices.apply(this, arguments);
    };

    _visibleChoicesWrapper.toString = function () {
      return _visibleChoices.toString();
    };

    return _visibleChoicesWrapper;
  })(function () {
    var _this = this;

    var choices = this.props.choices;
    var config = this.props.config;

    if (choices && choices.length === 0) {
      return [{ value: "///empty///" }];
    }

    if (this.state.searchString) {
      choices = choices.filter(function (choice) {
        if (choice.sectionKey) {
          return true;
        }
        return config.isSearchStringInChoice(_this.state.searchString, choice);
      });
    }

    if (!this.props.isAccordion) {
      return choices;
    }

    var openSection = this.state.openSection;
    var alwaysExanded = this.hasOneSection() || this.state.searchString;
    var visibleChoices = [];
    var inSection;

    choices.forEach(function (choice) {
      if (choice.value && choice.value.match(magicChoiceRe)) {
        visibleChoices.push(choice);
      }
      if (choice.sectionKey) {
        inSection = choice.sectionKey === openSection;
      }
      if (alwaysExanded || choice.sectionKey || inSection) {
        visibleChoices.push(choice);
      }
    });

    return visibleChoices;
  }),

  render: function render() {
    return this.renderWithConfig();
  },

  onClick: function onClick(event) {
    // swallow clicks
    event.stopPropagation();
  },

  onChangeSearch: function onChangeSearch(event) {
    this.setState({
      searchString: event.target.value
    });
  },

  renderDefault: function renderDefault() {
    var config = this.props.config;

    var choices = this.visibleChoices();

    var search = null;

    var hasSearch = !!this.state.searchString;

    if (!hasSearch) {
      if (this.props.choices.length > 2) {
        if (_.find(choices, function (choice) {
          return !choice.action && choice.value !== "///loading///";
        })) {
          hasSearch = true;
        }
      }
    }

    if (hasSearch) {
      search = config.createElement("choices-search", { field: this.props.field, onChange: this.onChangeSearch });
    }

    if (this.props.open) {
      return R.div({ ref: "container", onClick: this.onClick,
        className: "choices-container", style: {
          userSelect: "none", WebkitUserSelect: "none", position: "absolute",
          maxHeight: this.state.maxHeight ? this.state.maxHeight : null
        } }, config.cssTransitionWrapper(search, R.ul({ key: "choices", ref: "choices", className: "choices" }, choices.map((function (choice, i) {

        var choiceElement = null;

        if (choice.value === "///loading///") {
          choiceElement = R.a({ href: "JavaScript" + ":", onClick: this.onClose }, R.span({ className: "choice-label" }, config.createElement("loading-choice", { field: this.props.field })));
        } else if (choice.value === "///empty///") {
          choiceElement = R.a({ href: "JavaScript" + ":", onClick: this.onClose }, R.span({ className: "choice-label" }, "No choices available."));
        } else if (choice.action) {
          var labelClasses = "choice-label " + choice.action;

          choiceElement = R.a({ href: "JavaScript" + ":", onClick: this.onChoiceAction.bind(this, choice) }, R.span({ className: labelClasses }, choice.label || this.props.config.actionChoiceLabel(choice.action)), this.props.config.createElement("choice-action-sample", { action: choice.action, choice: choice }));
        } else if (choice.sectionKey) {
          choiceElement = R.a({ href: "JavaScript" + ":", onClick: this.onHeaderClick.bind(this, choice) }, config.createElement("choice-section-header", { choice: choice }));
        } else {
          choiceElement = R.a({ href: "JavaScript" + ":", onClick: this.onSelect.bind(this, choice) }, R.span({ className: "choice-label" }, choice.label), R.span({ className: "choice-sample" }, choice.sample));
        }

        return R.li({ key: i, className: "choice" }, choiceElement);
      }).bind(this)))));
    }

    // not open
    return null;
  }
});
// # Choices component

/*
Render customized (non-native) dropdown choices.
*/

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"../../mixins/click-outside":52,"../../mixins/helper":54,"../../undash":62,"react-scroll-lock":69}],28:[function(require,module,exports){
(function (global){
"use strict";

var React = (typeof window !== "undefined" ? window.React : typeof global !== "undefined" ? global.React : null);
var R = React.DOM;
var cx = require("classnames");

module.exports = React.createClass({

  displayName: "FieldTemplateChoices",

  mixins: [require("../../mixins/helper")],

  onChange: function onChange(event) {
    this.props.onSelect(parseInt(event.target.value));
  },

  render: function render() {
    return this.renderWithConfig();
  },

  renderDefault: function renderDefault() {

    var config = this.props.config;
    var field = this.props.field;

    var fieldTemplates = config.fieldItemFieldTemplates(field);

    var typeChoices = null;
    if (fieldTemplates.length > 1) {
      typeChoices = R.select({ className: cx(this.props.classes), value: this.fieldTemplateIndex, onChange: this.onChange }, fieldTemplates.map(function (fieldTemplate, i) {
        return R.option({ key: i, value: i }, fieldTemplate.label || i);
      }));
    }

    return typeChoices ? typeChoices : R.span(null);
  }
});
// # field-template-choices component

/*
Give a list of choices of item types to create as children of an field.
*/

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"../../mixins/helper":54,"classnames":64}],29:[function(require,module,exports){
(function (global){
"use strict";

var React = (typeof window !== "undefined" ? window.React : typeof global !== "undefined" ? global.React : null);
var R = React.DOM;
var _ = require("../../undash");
var cx = require("classnames");

module.exports = React.createClass({

  displayName: "Field",

  mixins: [require("../../mixins/helper")],

  getInitialState: function getInitialState() {
    return {
      collapsed: this.props.config.fieldIsCollapsed(this.props.field) ? true : false
    };
  },

  onClickLabel: function onClickLabel() {
    this.setState({
      collapsed: !this.state.collapsed
    });
  },

  render: function render() {
    return this.renderWithConfig();
  },

  renderDefault: function renderDefault() {

    var config = this.props.config;

    if (this.props.plain) {
      return this.props.children;
    }

    var field = this.props.field;

    var index = this.props.index;
    if (!_.isNumber(index)) {
      var key = this.props.field.key;
      index = _.isNumber(key) ? key : undefined;
    }

    var classes = _.extend({}, this.props.classes);

    var errors = config.fieldErrors(field);

    errors.forEach(function (error) {
      classes["validation-error-" + error.type] = true;
    });

    if (config.fieldIsRequired(field)) {
      classes.required = true;
    } else {
      classes.optional = true;
    }

    if (this.isReadOnly()) {
      classes.readonly = true;
    }

    return R.div({ className: cx(classes), style: { display: field.hidden ? "none" : "" } }, config.createElement("label", {
      config: config, field: field,
      index: index, onClick: config.fieldIsCollapsible(field) ? this.onClickLabel : null
    }), config.cssTransitionWrapper(this.state.collapsed ? [] : [config.createElement("help", {
      config: config, field: field,
      key: "help"
    }), this.props.children]));
  }
});
// # field component

/*
Used by any fields to put the label and help text around the field.
*/

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"../../mixins/helper":54,"../../undash":62,"classnames":64}],30:[function(require,module,exports){
(function (global){
"use strict";

var React = (typeof window !== "undefined" ? window.React : typeof global !== "undefined" ? global.React : null);
var R = React.DOM;
var cx = require("classnames");

module.exports = React.createClass({

  displayName: "Help",

  mixins: [require("../../mixins/helper")],

  render: function render() {
    return this.renderWithConfig();
  },

  renderDefault: function renderDefault() {

    var helpText = this.props.config.fieldHelpText(this.props.field);

    return helpText ? R.div({ className: cx(this.props.classes), dangerouslySetInnerHTML: { __html: helpText } }) : R.span(null);
  }
});
// # help component

/*
Just the help text block.
*/

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"../../mixins/helper":54,"classnames":64}],31:[function(require,module,exports){
(function (global){
"use strict";

var React = (typeof window !== "undefined" ? window.React : typeof global !== "undefined" ? global.React : null);

module.exports = React.createClass({

  displayName: "InsertButton",

  propTypes: {
    onClick: React.PropTypes.func.isRequired,
    ref: React.PropTypes.string
  },

  mixins: [require("../../mixins/helper")],

  render: function render() {
    return this.renderWithConfig();
  },

  renderDefault: function renderDefault() {
    return React.createElement(
      "a",
      { ref: this.props.ref, href: "JavaScript" + ":", onClick: this.props.onClick },
      this.props.children
    );
  }

});
// # button component

/*
  Clickable 'button'
*/

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"../../mixins/helper":54}],32:[function(require,module,exports){
(function (global){
"use strict";

var React = (typeof window !== "undefined" ? window.React : typeof global !== "undefined" ? global.React : null);
var R = React.DOM;
var cx = require("classnames");

module.exports = React.createClass({

  displayName: "Label",

  mixins: [require("../../mixins/helper")],

  render: function render() {
    return this.renderWithConfig();
  },

  renderDefault: function renderDefault() {
    var config = this.props.config;
    var field = this.props.field;

    var fieldLabel = config.fieldLabel(field);

    var label = null;
    if (typeof this.props.index === "number") {
      label = "" + (this.props.index + 1) + ".";
      if (fieldLabel) {
        label = label + " " + fieldLabel;
      }
    }

    if (fieldLabel || label) {
      var text = label || fieldLabel;
      if (this.props.onClick) {
        text = R.a({ href: "JavaScript" + ":", onClick: this.props.onClick }, text);
      }
      label = R.label({}, text);
    }

    return R.div({
      className: cx(this.props.classes)
    }, label, " ", R.span({ className: config.fieldIsRequired(field) ? "required-text" : "not-required-text" }));
  }
});
// # label component

/*
Just the label for a field.
*/

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"../../mixins/helper":54,"classnames":64}],33:[function(require,module,exports){
(function (global){
"use strict";

var React = (typeof window !== "undefined" ? window.React : typeof global !== "undefined" ? global.React : null);

module.exports = React.createClass({

  displayName: "LoadingChoice",

  mixins: [require("../../mixins/helper")],

  render: function render() {
    return this.renderWithConfig();
  },

  renderDefault: function renderDefault() {
    return React.createElement(
      "span",
      null,
      "Loading choices..."
    );
  }

});

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"../../mixins/helper":54}],34:[function(require,module,exports){
(function (global){
"use strict";

var React = (typeof window !== "undefined" ? window.React : typeof global !== "undefined" ? global.React : null);

module.exports = React.createClass({

  displayName: "LoadingChoices",

  mixins: [require("../../mixins/helper")],

  render: function render() {
    return this.renderWithConfig();
  },

  renderDefault: function renderDefault() {
    return React.createElement(
      "div",
      null,
      "Loading choices..."
    );
  }

});

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"../../mixins/helper":54}],35:[function(require,module,exports){
(function (global){
"use strict";

var React = (typeof window !== "undefined" ? window.React : typeof global !== "undefined" ? global.React : null);
var R = React.DOM;
var cx = require("classnames");

module.exports = React.createClass({

  displayName: "MoveItemBack",

  mixins: [require("../../mixins/helper")],

  getDefaultProps: function getDefaultProps() {
    return {
      label: "[up]"
    };
  },

  render: function render() {
    return this.renderWithConfig();
  },

  renderDefault: function renderDefault() {
    return R.span({ className: cx(this.props.classes), onClick: this.props.onClick }, this.props.label);
  }
});
// # move-item-back component

/*
Button to move an item backwards in list.
*/

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"../../mixins/helper":54,"classnames":64}],36:[function(require,module,exports){
(function (global){
"use strict";

var React = (typeof window !== "undefined" ? window.React : typeof global !== "undefined" ? global.React : null);
var R = React.DOM;
var cx = require("classnames");

module.exports = React.createClass({

  displayName: "MoveItemForward",

  mixins: [require("../../mixins/helper")],

  getDefaultProps: function getDefaultProps() {
    return {
      label: "[down]"
    };
  },

  render: function render() {
    return this.renderWithConfig();
  },

  renderDefault: function renderDefault() {
    return R.span({ className: cx(this.props.classes), onClick: this.props.onClick }, this.props.label);
  }
});
// # move-item-forward component

/*
Button to move an item forward in a list.
*/

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"../../mixins/helper":54,"classnames":64}],37:[function(require,module,exports){
(function (global){
"use strict";

var React = (typeof window !== "undefined" ? window.React : typeof global !== "undefined" ? global.React : null);
var R = React.DOM;
var cx = require("classnames");

module.exports = React.createClass({

  displayName: "ObjectControl",

  mixins: [require("../../mixins/helper")],

  getInitialState: function getInitialState() {
    return {
      fieldTemplateIndex: 0
    };
  },

  onSelect: function onSelect(index) {
    this.setState({
      fieldTemplateIndex: index
    });
  },

  onAppend: function onAppend() {
    this.props.onAppend(this.state.fieldTemplateIndex);
  },

  render: function render() {
    return this.renderWithConfig();
  },

  renderDefault: function renderDefault() {
    var config = this.props.config;
    var field = this.props.field;
    var fieldTemplates = config.fieldChildFieldTemplates(field);

    var typeChoices = null;

    if (fieldTemplates.length > 0) {
      typeChoices = config.createElement("field-template-choices", {
        field: field,
        fieldTemplateIndex: this.state.fieldTemplateIndex, onSelect: this.onSelect
      });
    }

    return R.div({ className: cx(this.props.classes) }, typeChoices, " ", config.createElement("add-item", { onClick: this.onAppend }));
  }
});
// # object-control component

/*
Render the item type choices and the add button.
*/

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"../../mixins/helper":54,"classnames":64}],38:[function(require,module,exports){
(function (global){
"use strict";

var React = (typeof window !== "undefined" ? window.React : typeof global !== "undefined" ? global.React : null);
var R = React.DOM;
var cx = require("classnames");

module.exports = React.createClass({

  displayName: "ObjectItemControl",

  mixins: [require("../../mixins/helper")],

  onRemove: function onRemove() {
    this.props.onRemove(this.props.itemKey);
  },

  render: function render() {
    return this.renderWithConfig();
  },

  renderDefault: function renderDefault() {
    var config = this.props.config;
    var field = this.props.field;

    return R.div({ className: cx(this.props.classes) }, config.createElement("remove-item", { field: field, onClick: this.onRemove }));
  }
});
// # object-item-control component

/*
Render the remove buttons for an object item.
*/

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"../../mixins/helper":54,"classnames":64}],39:[function(require,module,exports){
(function (global){
"use strict";

var React = (typeof window !== "undefined" ? window.React : typeof global !== "undefined" ? global.React : null);
var R = React.DOM;
var cx = require("classnames");

module.exports = React.createClass({

  displayName: "ObjectItemKey",

  mixins: [require("../../mixins/helper")],

  onChange: function onChange(event) {
    this.props.onChange(event.target.value);
  },

  render: function render() {
    return this.renderWithConfig();
  },

  renderDefault: function renderDefault() {
    return R.input({
      className: cx(this.props.classes),
      type: "text",
      value: this.props.displayKey,
      onChange: this.onChange,
      onFocus: this.onFocusAction,
      onBlur: this.onBlurAction
    });
  }
});
// # object-item-key component

/*
Render an object item key editor.
*/

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"../../mixins/helper":54,"classnames":64}],40:[function(require,module,exports){
(function (global){
"use strict";

var React = (typeof window !== "undefined" ? window.React : typeof global !== "undefined" ? global.React : null);
var R = React.DOM;
var cx = require("classnames");

module.exports = React.createClass({

  displayName: "ObjectItemValue",

  mixins: [require("../../mixins/helper")],

  onChangeField: function onChangeField(newValue, info) {
    this.props.onChange(this.props.itemKey, newValue, info);
  },

  render: function render() {
    return this.renderWithConfig();
  },

  renderDefault: function renderDefault() {
    var config = this.props.config;
    var field = this.props.field;

    return R.div({ className: cx(this.props.classes) }, config.createFieldElement({ field: field, onChange: this.onChangeField, plain: true, onAction: this.onBubbleAction }));
  }
});
// # object-item-value component

/*
Render the value of an object item.
*/

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"../../mixins/helper":54,"classnames":64}],41:[function(require,module,exports){
(function (global){
"use strict";

var React = (typeof window !== "undefined" ? window.React : typeof global !== "undefined" ? global.React : null);
var R = React.DOM;
var cx = require("classnames");

module.exports = React.createClass({

  displayName: "ObjectItem",

  mixins: [require("../../mixins/helper")],

  onChangeKey: function onChangeKey(newKey) {
    this.props.onMove(this.props.itemKey, newKey);
  },

  render: function render() {
    return this.renderWithConfig();
  },

  renderDefault: function renderDefault() {
    var config = this.props.config;
    var field = this.props.field;

    return R.div({ className: cx(this.props.classes) }, config.createElement("object-item-key", { field: field, onChange: this.onChangeKey, onAction: this.onBubbleAction, displayKey: this.props.displayKey, itemKey: this.props.itemKey }), config.createElement("object-item-value", { field: field, onChange: this.props.onChange, onAction: this.onBubbleAction, itemKey: this.props.itemKey }), config.createElement("object-item-control", { field: field, onRemove: this.props.onRemove, itemKey: this.props.itemKey }));
  }
});
// # object-item component

/*
Render an object item.
*/

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"../../mixins/helper":54,"classnames":64}],42:[function(require,module,exports){
(function (global){
"use strict";

var React = (typeof window !== "undefined" ? window.React : typeof global !== "undefined" ? global.React : null);

module.exports = React.createClass({

  displayName: "PrettySelectInput",

  mixins: [require("../../mixins/helper")],

  render: function render() {
    return this.renderWithConfig();
  },

  focus: function focus() {
    this.refs.textBox.focus();
  },

  setChoicesOpen: function setChoicesOpen(isOpenChoices) {
    this.refs.textBox.setChoicesOpen(isOpenChoices);
  },

  renderDefault: function renderDefault() {
    var tabIndex = this.isReadOnly() ? null : this.props.field.tabIndex;

    return this.props.config.createElement("pretty-text-input", {
      classes: this.props.classes,
      tabIndex: tabIndex,
      onChange: this.props.onChange,
      onFocus: this.props.onFocus,
      onBlur: this.props.onBlur,
      onAction: this.onBubbleAction,
      field: this.props.field,
      value: this.props.isEnteringCustomValue ? this.props.field.value : this.props.getDisplayValue(),
      selectedChoices: this.props.config.fieldSelectedReplaceChoices(this.props.field),
      replaceChoices: this.props.config.fieldReplaceChoices(this.props.field),
      onTagClick: this.onTagClick,
      ref: "textBox",
      readOnly: !this.props.isEnteringCustomValue,
      disabled: this.isReadOnly()
    });
  }

});
// # pretty-select-input component

/*
   Render an input to be used as the element for typing a custom value into a pretty select.
 */

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"../../mixins/helper":54}],43:[function(require,module,exports){
(function (global){
"use strict";

var React = (typeof window !== "undefined" ? window.React : typeof global !== "undefined" ? global.React : null);
var _ = require("../../undash");
var cx = require("classnames");

module.exports = React.createClass({

  displayName: "SelectValue",

  mixins: [require("../../mixins/helper")],

  onChange: function onChange(event) {
    var choiceValue = event.target.value;
    var choiceType = choiceValue.substring(0, choiceValue.indexOf(":"));
    if (choiceType === "choice") {
      var choiceIndex = choiceValue.substring(choiceValue.indexOf(":") + 1);
      choiceIndex = parseInt(choiceIndex);
      this.props.onChange(this.props.choices[choiceIndex].value);
    }
  },

  onChangeCustomValue: function onChangeCustomValue(newValue, info) {
    this.props.onChange(newValue, {
      field: info.field,
      isCustomValue: true
    });
  },

  // Intercept custom value field events and pretend like this field sent them.
  onCustomAction: function onCustomAction(info) {
    info = _.extend({}, info, { field: this.props.field, isCustomValue: true });
    this.props.onAction(info);
  },

  getDefaultProps: function getDefaultProps() {
    return {
      choices: []
    };
  },

  getInitialState: function getInitialState() {
    var currentChoice = this.currentChoice(this.props);
    var isDefaultValue = this.props.field.value === this.props.config.fieldTemplateDefaultValue(this.props.field);
    return {
      isChoicesOpen: this.props.isChoicesOpen,
      isEnteringCustomValue: !isDefaultValue && !currentChoice && this.props.field.value,
      // Caching this cause it's kind of expensive.
      currentChoice: this.currentChoice(this.props)
    };
  },

  componentWillReceiveProps: function componentWillReceiveProps(newProps) {
    var currentChoice = this.currentChoice(newProps);
    this.setState({
      currentChoice: currentChoice
    });
  },

  value: function value(props) {
    props = props || this.props;
    return props.field.value !== undefined ? props.field.value : "";
  },

  render: function render() {
    return this.renderWithConfig();
  },

  renderDefault: function renderDefault() {
    var _props = this.props;
    var config = _props.config;
    var field = _props.field;

    var choices = config.normalizePrettyChoices(this.props.choices);
    var choicesOrLoading;

    if (choices.length > 1 && choices[0].value === "///loading///" || config.fieldIsLoading(field)) {
      choices = [{ value: "///loading///" }];
    }

    var choicesElem = undefined;
    if (!this.isReadOnly()) {
      choicesElem = config.createElement("choices", {
        ref: "choices",
        choices: choices,
        open: this.state.isChoicesOpen,
        ignoreCloseNodes: this.getCloseIgnoreNodes,
        onSelect: this.onSelectChoice,
        onClose: this.onCloseChoices,
        onChoiceAction: this.onChoiceAction,
        field: field
      });
    }

    var inputElem = this.getInputElement();

    var customFieldElement = null;
    if (this.state.isEnteringCustomValue && this.hasCustomField()) {
      var customFieldTemplate = config.fieldCustomFieldTemplate(field);
      var customField = _.extend({ type: "PrettyText" }, {
        key: field.key, parent: field, fieldIndex: field.fieldIndex,
        rawFieldTemplate: customFieldTemplate,
        value: field.value
      }, customFieldTemplate);
      config.initField(customField);
      customFieldElement = config.createFieldElement({
        field: customField,
        onChange: this.onChangeCustomValue, onAction: this.onCustomAction,
        ref: "customFieldInput"
      });
    }

    var selectArrow = undefined;
    if (!this.isReadOnly()) {
      selectArrow = React.createElement("span", { className: "select-arrow" });
    }

    choicesOrLoading = React.createElement(
      "div",
      { className: cx(_.extend({}, this.props.classes, { "choices-open": this.state.isChoicesOpen })),
        onChange: this.onChange },
      React.createElement(
        "div",
        { ref: "toggle", onClick: this.isReadOnly() ? null : this.onToggleChoices },
        inputElem,
        selectArrow
      ),
      choicesElem,
      React.createElement(
        "span",
        null,
        customFieldElement
      )
    );

    return choicesOrLoading;
  },

  getInputElement: function getInputElement() {
    return this.props.config.createElement("pretty-select-input", {
      field: this.props.field,
      ref: "customInput",
      isEnteringCustomValue: this.state.isEnteringCustomValue && !this.hasCustomField(),
      onChange: this.onInputChange,
      onFocus: this.onFocusAction,
      onBlur: this.onBlur,
      onAction: this.onBubbleAction,
      getDisplayValue: this.getDisplayValue
    });
  },

  blurLater: function blurLater() {
    var self = this;
    setTimeout(function () {
      self.onBlurAction();
    }, 0);
  },

  onBlur: function onBlur() {
    if (!this.state.isChoicesOpen) {
      this.blurLater();
    }
  },

  getCloseIgnoreNodes: function getCloseIgnoreNodes() {
    return this.refs.toggle.getDOMNode();
  },

  onToggleChoices: function onToggleChoices() {
    this.setChoicesOpen(!this.state.isChoicesOpen);
  },

  setChoicesOpen: function setChoicesOpen(isOpen) {
    var action = isOpen ? "open-choices" : "close-choices";
    this.onStartAction(action);
    this.setState({ isChoicesOpen: isOpen });
  },

  onSelectChoice: function onSelectChoice(value) {
    this.setState({
      isEnteringCustomValue: false,
      isChoicesOpen: false
    });
    this.props.onChange(value);
    this.blurLater();
  },

  onCloseChoices: function onCloseChoices() {
    if (this.state.isChoicesOpen) {
      this.blurLater();
      this.setChoicesOpen(false);
    }
  },

  currentChoice: (function (_currentChoice) {
    var _currentChoiceWrapper = function currentChoice(_x) {
      return _currentChoice.apply(this, arguments);
    };

    _currentChoiceWrapper.toString = function () {
      return _currentChoice.toString();
    };

    return _currentChoiceWrapper;
  })(function (props) {
    props = props || this.props;
    var config = props.config;
    var field = props.field;
    var choices = props.choices;

    var currentValue = this.value(props);
    var currentChoice = config.fieldSelectedChoice(field);
    // Make sure selectedChoice is a match for current value.
    if (currentChoice && currentChoice.value !== currentValue) {
      currentChoice = null;
    }
    if (!currentChoice) {
      currentChoice = _.find(choices, function (choice) {
        return !choice.action && choice.value === currentValue;
      });
    }
    return currentChoice;
  }),

  getDisplayValue: function getDisplayValue() {
    var currentChoice = this.state.currentChoice;

    //var currentChoice = this.currentChoice();
    var currentValue = this.value();
    var isDefaultValue = currentValue === this.props.config.fieldTemplateDefaultValue(this.props.field);

    if (this.state.isEnteringCustomValue || !isDefaultValue && !currentChoice && currentValue) {
      if (this.hasCustomField()) {
        var choices = this.props.choices;

        var customChoice = _.find(choices, function (choice) {
          return choice.action === "enter-custom-value";
        });
        if (customChoice && customChoice.label) {
          return customChoice.label;
        }
      }
      return currentValue;
    }

    if (currentChoice) {
      return currentChoice.label;
    }

    // If this is the default value, and we have no choice to use for the label, just use the value.
    if (isDefaultValue) {
      return currentValue;
    }

    return this.props.config.fieldPlaceholder(this.props.field) || "";
  },

  hasCustomField: function hasCustomField() {
    return !!this.props.config.fieldCustomFieldTemplate(this.props.field);
  },

  onChoiceAction: function onChoiceAction(choice) {
    if (choice.action === "enter-custom-value") {
      this.setState({
        isEnteringCustomValue: true,
        isChoicesOpen: false
      }, function () {
        if (this.hasCustomField()) {
          this.refs.customFieldInput.focus();
        } else {
          this.refs.customInput.focus();
        }
      });
    } else if (choice.action === "insert-field") {
      this.setState({
        isChoicesOpen: false
      }, function () {
        this.refs.customInput.setChoicesOpen(true);
      });
    } else {
      if (choice.action === "clear-current-choice") {
        this.setState({
          isChoicesOpen: false,
          isEnteringCustomValue: false
        });
        this.props.onChange("");
      } else {
        this.setState({
          isChoicesOpen: !!choice.isOpen
        });
      }
    }

    this.onStartAction(choice.action, choice);
  },

  // Is this even used? I don't think so.
  onAction: function onAction(params) {
    if (params.action === "enter-custom-value") {
      this.setState({ isEnteringCustomValue: true }, function () {
        this.refs.customInput.focus();
      });
    }
    this.onBubbleAction(params);
  },

  onInputChange: function onInputChange(value) {
    this.props.onChange(value);
  }
});
// # pretty-select-value component

/*
   Render a select dropdown for a list of choices. Choices values can be of any
   type. Does not use native select dropdown. Choices can optionally include
   'sample' property displayed grayed out.
 */

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"../../mixins/helper":54,"../../undash":62,"classnames":64}],44:[function(require,module,exports){
(function (global){
"use strict";

var React = (typeof window !== "undefined" ? window.React : typeof global !== "undefined" ? global.React : null);
var _ = require("../../undash");
var cx = require("classnames");

module.exports = React.createClass({

  displayName: "PrettyTag",

  propTypes: {
    onClick: React.PropTypes.func,
    classes: React.PropTypes.object
  },

  mixins: [require("../../mixins/helper")],

  render: function render() {
    return this.renderWithConfig();
  },

  renderDefault: function renderDefault() {
    var classes = cx(_.extend({}, this.props.classes, { "pretty-part": true }));

    return React.createElement(
      "span",
      { className: classes, onClick: this.props.onClick },
      this.props.children
    );
  }
});
// # pretty-tag component

/*
   Pretty text tag
 */

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"../../mixins/helper":54,"../../undash":62,"classnames":64}],45:[function(require,module,exports){
(function (global){
"use strict";

/* global CodeMirror */
/*eslint no-script-url:0 */

var React = (typeof window !== "undefined" ? window.React : typeof global !== "undefined" ? global.React : null);
var TagTranslator = require("./tag-translator");
var _ = require("../../undash");
var cx = require("classnames");

var toString = function toString(value) {
  if (_.isUndefined(value) || _.isNull(value)) {
    return "";
  }
  return String(value);
};

/*
   Editor for tagged text. Renders text like "hello {{firstName}}"
   with replacement labels rendered in a pill box. Designed to load
   quickly when many separate instances of it are on the same
   page.

   Uses CodeMirror to edit text. To save memory the CodeMirror node is
   instantiated when the user moves the mouse into the edit area.
   Initially a read-only view using a simple div is shown.
 */
module.exports = React.createClass({

  displayName: "PrettyTextInput",

  mixins: [require("../../mixins/helper")],

  componentDidMount: function componentDidMount() {
    this.createEditor();
  },

  componentDidUpdate: function componentDidUpdate(prevProps, prevState) {
    if (prevState.codeMirrorMode !== this.state.codeMirrorMode) {
      // Changed from code mirror mode to read only mode or vice versa,
      // so setup the other editor.
      this.createEditor();
    }
    this.updateEditor();
  },

  componentWillUnmount: function componentWillUnmount() {
    if (this.state.codeMirrorMode) {
      this.removeCodeMirrorEditor();
    }
  },

  getInitialState: function getInitialState() {
    var selectedChoices = this.props.selectedChoices;
    var replaceChoices = this.props.replaceChoices;
    var translator = TagTranslator(selectedChoices.concat(replaceChoices), this.props.config.humanize);

    return {
      // With number values, onFocus never fires, which means it stays read-only. So convert to string.
      value: toString(this.props.value),
      codeMirrorMode: false,
      isChoicesOpen: false,
      replaceChoices: replaceChoices,
      translator: translator
    };
  },

  componentWillReceiveProps: function componentWillReceiveProps(nextProps) {
    var selectedChoices = nextProps.selectedChoices;
    var replaceChoices = nextProps.replaceChoices;
    var nextState = {
      replaceChoices: replaceChoices,
      translator: TagTranslator(selectedChoices.concat(replaceChoices), this.props.config.humanize)
    };

    // Not sure what the null/undefined checks are here for, but changed from falsey which was breaking.
    if (this.state.value !== nextProps.value && !_.isUndefined(nextProps.value) && nextProps.value !== null) {
      nextState.value = toString(nextProps.value);
    }

    this.setState(nextState);
  },

  handleChoiceSelection: function handleChoiceSelection(key, event) {
    var _this = this;

    var selectChoice = function () {
      var pos = _this.state.selectedTagPos;
      var tag = "{{" + key + "}}";

      if (pos) {
        _this.codeMirror.replaceRange(tag, { line: pos.line, ch: pos.start }, { line: pos.line, ch: pos.stop });
      } else {
        _this.codeMirror.replaceSelection(tag, "end");
      }
      _this.codeMirror.focus();

      _this.setState({ isChoicesOpen: false, selectedTagPos: null });
    };
    if (this.state.codeMirrorMode) {
      selectChoice();
    } else if (this.props.readOnly) {
      // hackety hack to stop dropdown choices from toggling
      event.stopPropagation();
      this.props.onChange("{{" + key + "}}");
      this.setState({ isChoicesOpen: false });
    } else {
      this.switchToCodeMirror(selectChoice);
    }
  },

  focus: function focus() {
    var _this = this;

    this.switchToCodeMirror(function () {
      _this.codeMirror.focus();
      _this.codeMirror.setCursor(_this.codeMirror.lineCount(), 0);
    });
  },

  insertBtn: function insertBtn() {
    if (this.isReadOnly()) {
      return null;
    }

    var onInsertClick = function onInsertClick() {
      this.setState({ selectedTagPos: null });
      this.onToggleChoices();
    };

    return this.props.config.createElement("insert-button", { ref: "toggle", onClick: onInsertClick.bind(this) }, "Insert...");
  },

  choices: function choices() {
    if (this.isReadOnly()) {
      return null;
    }

    return this.props.config.createElement("choices", {
      ref: "choices",
      choices: this.state.replaceChoices,
      open: this.state.isChoicesOpen,
      ignoreCloseNodes: this.getCloseIgnoreNodes,
      onSelect: this.handleChoiceSelection,
      onClose: this.onCloseChoices,
      isAccordion: this.props.isAccordion,
      field: this.props.field
    });
  },

  render: function render() {
    return this.renderWithConfig();
  },

  renderDefault: function renderDefault() {
    var textBoxClasses = cx(_.extend({}, this.props.classes, { "pretty-text-box": true }));

    // Render read-only version.
    return React.createElement(
      "div",
      { className: cx({ "pretty-text-wrapper": true, "choices-open": this.state.isChoicesOpen }), onMouseEnter: this.switchToCodeMirror },
      React.createElement(
        "div",
        { className: textBoxClasses, tabIndex: this.props.tabIndex, onFocus: this.props.onFocus, onBlur: this.props.onBlur },
        React.createElement("div", { ref: "textBox", className: "internal-text-wrapper" })
      ),
      this.insertBtn(),
      this.choices()
    );
  },

  getCloseIgnoreNodes: function getCloseIgnoreNodes() {
    return this.refs.toggle.getDOMNode();
  },

  onToggleChoices: function onToggleChoices() {
    this.setChoicesOpen(!this.state.isChoicesOpen);
  },

  setChoicesOpen: function setChoicesOpen(isOpen) {
    var action = isOpen ? "open-replacements" : "close-replacements";
    this.onStartAction(action);
    this.setState({ isChoicesOpen: isOpen });
  },

  onCloseChoices: function onCloseChoices() {
    if (this.state.isChoicesOpen) {
      this.setChoicesOpen(false);
    }
  },

  createEditor: function createEditor() {
    if (this.state.codeMirrorMode) {
      this.createCodeMirrorEditor();
    } else {
      this.createReadonlyEditor();
    }
  },

  updateEditor: function updateEditor() {
    if (this.state.codeMirrorMode) {
      var codeMirrorValue = this.codeMirror.getValue();
      if (codeMirrorValue !== this.state.value) {
        // switch back to read-only mode to make it easier to render
        this.removeCodeMirrorEditor();
        this.createReadonlyEditor();
        this.setState({
          codeMirrorMode: false
        });
      }
    } else {
      this.createReadonlyEditor();
    }
  },

  createCodeMirrorEditor: function createCodeMirrorEditor() {
    var options = {
      lineWrapping: true,
      tabindex: this.props.tabIndex,
      value: String(this.state.value),
      mode: null,
      extraKeys: {
        Tab: false
      }
    };

    var textBox = this.refs.textBox.getDOMNode();
    textBox.innerHTML = ""; // release any previous read-only content so it can be GC'ed

    this.codeMirror = CodeMirror(textBox, options);
    this.codeMirror.on("change", this.onCodeMirrorChange);

    this.tagCodeMirror();
  },

  tagCodeMirror: function tagCodeMirror() {
    var positions = this.state.translator.getTagPositions(this.codeMirror.getValue());
    var self = this;

    var tagOps = function tagOps() {
      positions.forEach(function (pos) {
        var node = self.createTagNode(pos);
        self.codeMirror.markText({ line: pos.line, ch: pos.start }, { line: pos.line, ch: pos.stop }, { replacedWith: node, handleMouseEvents: true });
      });
    };

    this.codeMirror.operation(tagOps);
  },

  onCodeMirrorChange: function onCodeMirrorChange() {
    if (this.updatingCodeMirror) {
      // avoid recursive update cycle, and mark the code mirror manual update as done
      this.updatingCodeMirror = false;
      return;
    }

    var newValue = this.codeMirror.getValue();
    this.props.onChange(newValue);
    this.setState({ value: newValue });
    this.tagCodeMirror();
  },

  createReadonlyEditor: function createReadonlyEditor() {
    var textBoxNode = this.refs.textBox.getDOMNode();

    var tokens = this.state.translator.tokenize(this.state.value);
    var self = this;
    var nodes = tokens.map(function (part, i) {
      if (part.type === "tag") {
        var label = self.state.translator.getLabel(part.value);
        var props = { key: i, tag: part.value, replaceChoices: self.state.replaceChoices, field: self.props.field };
        return self.props.config.createElement("pretty-tag", props, label);
      }
      return React.createElement(
        "span",
        { key: i },
        part.value
      );
    });

    React.render(React.createElement(
      "span",
      null,
      nodes
    ), textBoxNode);
  },

  removeCodeMirrorEditor: function removeCodeMirrorEditor() {
    var textBoxNode = this.refs.textBox.getDOMNode();
    var cmNode = textBoxNode.firstChild;
    textBoxNode.removeChild(cmNode);
    this.codeMirror = null;
  },

  switchToCodeMirror: function switchToCodeMirror(cb) {
    var _this = this;

    if (this.isReadOnly()) {
      return; // never render in code mirror if read-only
    }

    if (!this.state.codeMirrorMode && !this.props.readOnly) {
      this.setState({ codeMirrorMode: true }, function () {
        if (_this.codeMirror && _.isFunction(cb)) {
          cb();
        }
      });
    }
  },

  onTagClick: function onTagClick() {
    var cursor = this.codeMirror.getCursor();
    var pos = this.state.translator.getTrueTagPosition(this.state.value, cursor);

    this.setState({ selectedTagPos: pos });
    this.onToggleChoices();
  },

  createTagNode: function createTagNode(pos) {
    var node = document.createElement("span");
    var label = this.state.translator.getLabel(pos.tag);
    var config = this.props.config;

    var props = { onClick: this.onTagClick, field: this.props.field, tag: pos.tag };

    React.render(config.createElement("pretty-tag", props, label), node);

    return node;
  }
});

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"../../mixins/helper":54,"../../undash":62,"./tag-translator":49,"classnames":64}],46:[function(require,module,exports){
(function (global){
"use strict";

var React = (typeof window !== "undefined" ? window.React : typeof global !== "undefined" ? global.React : null);
var R = React.DOM;
var cx = require("classnames");

module.exports = React.createClass({

  displayName: "RemoveItem",

  mixins: [require("../../mixins/helper")],

  getDefaultProps: function getDefaultProps() {
    return {
      label: "[remove]"
    };
  },

  render: function render() {
    return this.renderWithConfig();
  },

  onMouseOverRemove: function onMouseOverRemove() {
    if (this.props.onMaybeRemove) {
      this.props.onMaybeRemove(true);
    }
  },

  onMouseOutRemove: function onMouseOutRemove() {
    if (this.props.onMaybeRemove) {
      this.props.onMaybeRemove(false);
    }
  },

  renderDefault: function renderDefault() {
    return R.span({
      className: cx(this.props.classes), onClick: this.props.onClick,
      onMouseOver: this.onMouseOverRemove, onMouseOut: this.onMouseOutRemove
    }, this.props.label);
  }
});
// # remove-item component

/*
Remove an item.
*/

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"../../mixins/helper":54,"classnames":64}],47:[function(require,module,exports){
(function (global){
"use strict";

var React = (typeof window !== "undefined" ? window.React : typeof global !== "undefined" ? global.React : null);
var R = React.DOM;
var cx = require("classnames");

module.exports = React.createClass({

  displayName: "Sample",

  mixins: [require("../../mixins/helper")],

  render: function render() {
    return this.renderWithConfig();
  },

  renderDefault: function renderDefault() {

    var choice = this.props.choice;

    return choice.sample ? R.div({ className: cx(this.props.className) }, choice.sample) : R.span(null);
  }
});
// # help component

/*
Just the help text block.
*/

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"../../mixins/helper":54,"classnames":64}],48:[function(require,module,exports){
(function (global){
"use strict";

var React = (typeof window !== "undefined" ? window.React : typeof global !== "undefined" ? global.React : null);
var R = React.DOM;
var _ = require("../../undash");
var cx = require("classnames");

module.exports = React.createClass({

  displayName: "SelectValue",

  mixins: [require("../../mixins/helper")],

  onChange: function onChange(event) {
    var choiceValue = event.target.value;
    var choiceType = choiceValue.substring(0, choiceValue.indexOf(":"));
    if (choiceType === "choice") {
      var choiceIndex = choiceValue.substring(choiceValue.indexOf(":") + 1);
      choiceIndex = parseInt(choiceIndex);
      this.props.onChange(this.props.choices[choiceIndex].value);
    }
  },

  render: function render() {
    return this.renderWithConfig();
  },

  renderDefault: function renderDefault() {
    var config = this.props.config;
    var choices = this.props.choices || [];

    var choicesOrLoading;

    if (choices.length === 1 && choices[0].value === "///loading///" || config.fieldIsLoading(this.props.field)) {
      choicesOrLoading = config.createElement("loading-choices", {});
    } else {
      var value = this.props.field.value !== undefined ? this.props.field.value : "";

      choices = choices.map(function (choice, i) {
        return {
          choiceValue: "choice:" + i,
          value: choice.value,
          label: choice.label
        };
      });

      var valueChoice = _.find(choices, function (choice) {
        return choice.value === value;
      });

      if (valueChoice === undefined) {

        var label = value;
        if (!_.isString(value)) {
          label = JSON.stringify(value);
        }
        valueChoice = {
          choiceValue: "value:",
          value: value,
          label: label
        };
        choices = [valueChoice].concat(choices);
      }

      choicesOrLoading = R.select({
        className: cx(this.props.classes),
        onChange: this.onChange,
        value: valueChoice.choiceValue,
        onFocus: this.onFocusAction,
        onBlur: this.onBlurAction,
        disabled: this.isReadOnly()
      }, choices.map(function (choice, i) {
        return R.option({
          key: i,
          value: choice.choiceValue
        }, choice.label);
      }));
    }

    return choicesOrLoading;
  }
});
// # select-value component

/*
Render a select dropdown for a list of choices. Choices values can be of any
type.
*/

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"../../mixins/helper":54,"../../undash":62,"classnames":64}],49:[function(require,module,exports){
"use strict";

var _ = require("../../undash");

var buildChoicesMap = function (replaceChoices) {
  var choices = {};
  replaceChoices.forEach(function (choice) {
    var key = choice.value;
    choices[key] = choice.label;
  });
  return choices;
};

var getTagPositions = function (text) {
  var lines = text.split("\n");
  var re = /\{\{.+?\}\}/g;
  var positions = [];
  var m;

  for (var i = 0; i < lines.length; i++) {
    while ((m = re.exec(lines[i])) !== null) {
      var tag = m[0].substring(2, m[0].length - 2);
      positions.push({
        line: i,
        start: m.index,
        stop: m.index + m[0].length,
        tag: tag
      });
    }
  }
  return positions;
};

var tokenize = function (text) {
  text = String(text);

  var regexp = /(\{\{|\}\})/;
  var parts = text.split(regexp);

  var tokens = [];
  var inTag = false;
  parts.forEach(function (part) {
    if (part === "{{") {
      inTag = true;
    } else if (part === "}}") {
      inTag = false;
    } else if (inTag) {
      tokens.push({ type: "tag", value: part });
    } else {
      tokens.push({ type: "string", value: part });
    }
  });
  return tokens;
};

/*
   Given a CodeMirror document position like {line: 0, ch: 10}, return
   the tag position object for that position, for example {line: 0,
   start: 8, stop: 12}

   When clicking on a pretty tag, CodeMirror .getCursor() may return
   either the position of the start or the end of the tag, so we use
   this function to normalize it.

   Clicking on a pretty tag is jumpy - the cursor goes from one end to
   the other each time you click it. We should probably fix that, and
   the need for this function might go away.
*/
var getTrueTagPosition = function (text, cmPos) {
  var positions = getTagPositions(text);
  return _.find(positions, function (p) {
    return cmPos.line === p.line && cmPos.ch >= p.start && cmPos.ch <= p.stop;
  });
};

/*
   Creates helper to translate between tags like {{firstName}} and
   an encoded representation suitable for use in CodeMirror.
 */
var TagTranslator = function (replaceChoices, humanize) {
  // Map of tag to label 'firstName' --> 'First Name'
  var choices = buildChoicesMap(replaceChoices);

  return {
    /*
       Get label for tag.  For example 'firstName' becomes 'First Name'.
       Returns a humanized version of the tag if we don't have a label for the tag.
     */
    getLabel: function (tag) {
      var label = choices[tag];
      if (!label) {
        // If tag not found and we have a humanize function, humanize the tag.
        // Otherwise just return the tag.
        label = humanize && humanize(tag) || tag;
      }
      return label;
    },

    getTagPositions: getTagPositions,
    tokenize: tokenize,
    getTrueTagPosition: getTrueTagPosition
  };
};

module.exports = TagTranslator;

},{"../../undash":62}],50:[function(require,module,exports){
(function (global){
"use strict";

var React = (typeof window !== "undefined" ? window.React : typeof global !== "undefined" ? global.React : null);
var R = React.DOM;
var _ = require("./undash");

var utils = require("./utils");

module.exports = function (config) {

  var delegateTo = utils.delegator(config);

  return {

    // Field element factories. Create field elements.

    createElement_Fields: React.createFactory(require("./components/fields/fields")),

    createElement_GroupedFields: React.createFactory(require("./components/fields/grouped-fields")),

    createElement_String: React.createFactory(require("./components/fields/string")),

    createElement_SingleLineString: React.createFactory(require("./components/fields/single-line-string")),

    createElement_Password: React.createFactory(require("./components/fields/password")),

    createElement_Select: React.createFactory(require("./components/fields/select")),

    createElement_PrettySelect: React.createFactory(require("./components/fields/pretty-select")),

    createElement_Boolean: React.createFactory(require("./components/fields/boolean")),

    createElement_PrettyBoolean: React.createFactory(require("./components/fields/pretty-boolean")),

    createElement_CheckboxBoolean: React.createFactory(require("./components/fields/checkbox-boolean")),

    // createElement_PrettyText: React.createFactory(require('./components/fields/pretty-text')),

    createElement_Code: React.createFactory(require("./components/fields/code")),

    createElement_PrettyText: React.createFactory(require("./components/fields/pretty-text2")),

    createElement_PrettyTag: React.createFactory(require("./components/helpers/pretty-tag")),

    createElement_Array: React.createFactory(require("./components/fields/array")),

    createElement_CheckboxArray: React.createFactory(require("./components/fields/checkbox-array")),

    createElement_Object: React.createFactory(require("./components/fields/object")),

    createElement_Json: React.createFactory(require("./components/fields/json")),

    createElement_UnknownField: React.createFactory(require("./components/fields/unknown")),

    createElement_Copy: React.createFactory(require("./components/fields/copy")),

    // Other element factories. Create helper elements used by field components.

    createElement_Field: React.createFactory(require("./components/helpers/field")),

    createElement_Label: React.createFactory(require("./components/helpers/label")),

    createElement_Help: React.createFactory(require("./components/helpers/help")),

    createElement_Choices: React.createFactory(require("./components/helpers/choices")),

    createElement_ChoicesSearch: React.createFactory(require("./components/helpers/choices-search")),

    createElement_LoadingChoices: React.createFactory(require("./components/helpers/loading-choices")),

    createElement_LoadingChoice: React.createFactory(require("./components/helpers/loading-choice")),

    createElement_ArrayControl: React.createFactory(require("./components/helpers/array-control")),

    createElement_ArrayItemControl: React.createFactory(require("./components/helpers/array-item-control")),

    createElement_ArrayItemValue: React.createFactory(require("./components/helpers/array-item-value")),

    createElement_ArrayItem: React.createFactory(require("./components/helpers/array-item")),

    createElement_FieldTemplateChoices: React.createFactory(require("./components/helpers/field-template-choices")),

    createElement_AddItem: React.createFactory(require("./components/helpers/add-item")),

    createElement_RemoveItem: React.createFactory(require("./components/helpers/remove-item")),

    createElement_MoveItemForward: React.createFactory(require("./components/helpers/move-item-forward")),

    createElement_MoveItemBack: React.createFactory(require("./components/helpers/move-item-back")),

    createElement_ObjectControl: React.createFactory(require("./components/helpers/object-control")),

    createElement_ObjectItemControl: React.createFactory(require("./components/helpers/object-item-control")),

    createElement_ObjectItemValue: React.createFactory(require("./components/helpers/object-item-value")),

    createElement_ObjectItemKey: React.createFactory(require("./components/helpers/object-item-key")),

    createElement_ObjectItem: React.createFactory(require("./components/helpers/object-item")),

    createElement_SelectValue: React.createFactory(require("./components/helpers/select-value")),

    createElement_PrettySelectValue: React.createFactory(require("./components/helpers/pretty-select-value")),

    createElement_PrettySelectInput: React.createFactory(require("./components/helpers/pretty-select-input")),

    createElement_Sample: React.createFactory(require("./components/helpers/sample")),

    createElement_InsertButton: React.createFactory(require("./components/helpers/insert-button")),

    createElement_ChoiceSectionHeader: React.createFactory(require("./components/helpers/choice-section-header")),

    createElement_PrettyTextInput: React.createFactory(require("./components/helpers/pretty-text-input")),

    // Field default value factories. Give a default value for a specific type.

    createDefaultValue_String: function createDefaultValue_String() {
      return "";
    },

    createDefaultValue_Object: function createDefaultValue_Object() {
      return {};
    },

    createDefaultValue_Array: function createDefaultValue_Array() {
      return [];
    },

    createDefaultValue_Boolean: function createDefaultValue_Boolean() {
      return false;
    },

    createDefaultValue_Fields: delegateTo("createDefaultValue_Object"),

    createDefaultValue_SingleLineString: delegateTo("createDefaultValue_String"),

    createDefaultValue_Select: delegateTo("createDefaultValue_String"),

    createDefaultValue_Json: delegateTo("createDefaultValue_Object"),

    createDefaultValue_CheckboxArray: delegateTo("createDefaultValue_Array"),

    createDefaultValue_CheckboxBoolean: delegateTo("createDefaultValue_Boolean"),

    // Field value coercers. Coerce a value into a value appropriate for a specific type.

    coerceValue_String: function coerceValue_String(fieldTemplate, value) {
      if (_.isString(value)) {
        return value;
      }
      if (_.isUndefined(value) || value === null) {
        return "";
      }
      return JSON.stringify(value);
    },

    coerceValue_Object: function coerceValue_Object(fieldTemplate, value) {
      if (!_.isObject(value)) {
        return {};
      }
      return value;
    },

    coerceValue_Array: function coerceValue_Array(fieldTemplate, value) {
      if (!_.isArray(value)) {
        return [value];
      }
      return value;
    },

    coerceValue_Boolean: function coerceValue_Boolean(fieldTemplate, value) {
      return config.coerceValueToBoolean(value);
    },

    coerceValue_Fields: delegateTo("coerceValue_Object"),

    coerceValue_SingleLineString: delegateTo("coerceValue_String"),

    coerceValue_Select: delegateTo("coerceValue_String"),

    coerceValue_Json: delegateTo("coerceValue_Object"),

    coerceValue_CheckboxArray: delegateTo("coerceValue_Array"),

    coerceValue_CheckboxBoolean: delegateTo("coerceValue_Boolean"),

    // Field child fields factories, so some types can have dynamic children.

    createChildFields_Array: function createChildFields_Array(field) {

      return field.value.map(function (arrayItem, i) {
        var childFieldTemplate = config.childFieldTemplateForValue(field, arrayItem);

        var childField = config.createChildField(field, {
          fieldTemplate: childFieldTemplate, key: i, fieldIndex: i, value: arrayItem
        });

        return childField;
      });
    },

    createChildFields_Object: function createChildFields_Object(field) {

      return Object.keys(field.value).map(function (key, i) {
        var childFieldTemplate = config.childFieldTemplateForValue(field, field.value[key]);

        var childField = config.createChildField(field, {
          fieldTemplate: childFieldTemplate, key: key, fieldIndex: i, value: field.value[key]
        });

        return childField;
      });
    },

    // Check if there is a factory for the name.
    hasElementFactory: function hasElementFactory(name) {

      return config["createElement_" + name] ? true : false;
    },

    // Create an element given a name, props, and children.
    createElement: function createElement(name, props, children) {

      if (!props.config) {
        props = _.extend({}, props, { config: config });
      }

      name = config.elementName(name);

      if (config["createElement_" + name]) {
        return config["createElement_" + name](props, children);
      }

      if (name !== "Unknown") {
        if (config.hasElementFactory("Unknown")) {
          return config.createElement("Unknown", props, children);
        }
      }

      throw new Error("Factory not found for: " + name);
    },

    // Create a field element given some props. Use context to determine name.
    createFieldElement: function createFieldElement(props) {

      var name = config.fieldTypeName(props.field);

      if (config.hasElementFactory(name)) {
        return config.createElement(name, props);
      }

      return config.createElement("UnknownField", props);
    },

    // Render the root formatic component
    renderFormaticComponent: function renderFormaticComponent(component) {

      var props = component.props;

      var field = config.createRootField(props);
      return R.div({ className: "formatic" }, config.createFieldElement({ field: field, onChange: component.onChange, onAction: component.onAction }));
    },

    // Render any component.
    renderComponent: function renderComponent(component) {

      var name = component.constructor.displayName;

      if (config["renderComponent_" + name]) {
        return config["renderComponent_" + name](component);
      }

      return component.renderDefault();
    },

    // Render field components.
    renderFieldComponent: function renderFieldComponent(component) {

      return config.renderComponent(component);
    },

    // Normalize an element name.
    elementName: function elementName(name) {
      return utils.dashToPascal(name);
    },

    // Type aliases.

    alias_Dict: "Object",

    alias_Bool: "Boolean",

    alias_PrettyTextarea: "PrettyText",

    alias_SingleLineString: function alias_SingleLineString(fieldTemplate) {
      if (fieldTemplate.replaceChoices) {
        return "PrettyText";
      } else if (fieldTemplate.choices) {
        return "Select";
      }
      return "SingleLineString";
    },

    alias_String: function alias_String(fieldTemplate) {

      if (fieldTemplate.replaceChoices) {
        return "PrettyText";
      } else if (fieldTemplate.choices) {
        return "Select";
      } else if (config.fieldTemplateIsSingleLine(fieldTemplate)) {
        return "SingleLineString";
      }
      return "String";
    },

    alias_Text: delegateTo("alias_String"),

    alias_Unicode: delegateTo("alias_SingleLineString"),

    alias_Str: delegateTo("alias_SingleLineString"),

    alias_List: "Array",

    alias_CheckboxList: "CheckboxArray",

    alias_Fieldset: "Fields",

    alias_Checkbox: "CheckboxBoolean",

    // Field factory

    // Given a field, expand all child fields recursively to get the default
    // values of all fields.
    inflateFieldValue: function inflateFieldValue(field, fieldHandler) {

      if (fieldHandler) {
        var stop = fieldHandler(field);
        if (stop === false) {
          return undefined;
        }
      }

      if (config.fieldHasValueChildren(field)) {
        var value = _.clone(field.value);
        var childFields = config.createChildFields(field);
        childFields.forEach(function (childField) {
          if (config.isKey(childField.key)) {
            value[childField.key] = config.inflateFieldValue(childField, fieldHandler);
          } else {
            // a child with no key might have sub-children with keys
            var obj = config.inflateFieldValue(childField, fieldHandler);
            _.extend(value, obj);
          }
        });
        return value;
      } else {
        return field.value;
      }
    },

    // Initialize the root field.
    initRootField: function initRootField() {},

    // Initialize every field.
    initField: function initField() {},

    // If an array of field templates are passed in, this method is used to
    // wrap the fields inside a single root field template.
    wrapFieldTemplates: function wrapFieldTemplates(fieldTemplates) {
      return {
        type: "fields",
        plain: true,
        fields: fieldTemplates
      };
    },

    // Given the props that are passed in, create the root field.
    createRootField: function createRootField(props) {

      var fieldTemplate = props.fieldTemplate || props.fieldTemplates || props.field || props.fields;
      var value = props.value;

      if (!fieldTemplate) {
        fieldTemplate = config.createFieldTemplateFromValue(value);
      }

      if (_.isArray(fieldTemplate)) {
        fieldTemplate = config.wrapFieldTemplates(fieldTemplate);
      }

      var field = _.extend({}, fieldTemplate, { rawFieldTemplate: fieldTemplate });
      if (config.hasValue(fieldTemplate, value)) {
        field.value = config.coerceValue(fieldTemplate, value);
      } else {
        field.value = config.createDefaultValue(fieldTemplate);
      }

      config.initRootField(field, props);
      config.initField(field);

      if (value === null || config.isEmptyObject(value) || _.isUndefined(value)) {
        field.value = config.inflateFieldValue(field);
      }

      if (props.readOnly) {
        field.readOnly = true;
      }

      return field;
    },

    // Given the props that are passed in, create the value that will be displayed
    // by all the components.
    createRootValue: function createRootValue(props, fieldHandler) {

      var field = config.createRootField(props);

      return config.inflateFieldValue(field, fieldHandler);
    },

    validateRootValue: function validateRootValue(props) {

      var errors = [];

      config.createRootValue(props, function (field) {
        var fieldErrors = config.fieldErrors(field);
        if (fieldErrors.length > 0) {
          errors.push({
            path: config.fieldValuePath(field),
            errors: fieldErrors
          });
        }
      });

      return errors;
    },

    isValidRootValue: function isValidRootValue(props) {

      var isValid = true;

      config.createRootValue(props, function (field) {
        if (config.fieldErrors(field).length > 0) {
          isValid = false;
          return false;
        }
      });

      return isValid;
    },

    validateField: function validateField(field, errors) {

      if (field.value === undefined || field.value === "") {
        if (config.fieldIsRequired(field)) {
          errors.push({
            type: "required"
          });
        }
      }
    },

    cssTransitionWrapper: function cssTransitionWrapper() {
      var CSSTransitionGroup = React.createFactory(React.addons.CSSTransitionGroup);
      var args = [{ transitionName: "reveal" }].concat(Array.prototype.slice.call(arguments));
      return CSSTransitionGroup.apply(null, args);
    },

    // Create dynamic child fields for a field.
    createChildFields: function createChildFields(field) {

      var typeName = config.fieldTypeName(field);

      if (config["createChildFields_" + typeName]) {
        return config["createChildFields_" + typeName](field);
      }

      return config.fieldChildFieldTemplates(field).map(function (childField, i) {
        var childValue = field.value;
        if (config.isKey(childField.key)) {
          childValue = field.value[childField.key];
        }
        return config.createChildField(field, {
          fieldTemplate: childField, key: childField.key, fieldIndex: i, value: childValue
        });
      });
    },

    // Create a single child field for a parent field.
    createChildField: function createChildField(parentField, options) {

      var childValue = options.value;

      var childField = _.extend({}, options.fieldTemplate, {
        key: options.key, parent: parentField, fieldIndex: options.fieldIndex,
        rawFieldTemplate: options.fieldTemplate
      });

      if (config.hasValue(options.fieldTemplate, childValue)) {
        childField.value = config.coerceValue(options.fieldTemplate, childValue);
      } else {
        childField.value = config.createDefaultValue(options.fieldTemplate);
      }

      config.initField(childField);

      return childField;
    },

    // Create a temporary field and extract its value.
    createNewChildFieldValue: function createNewChildFieldValue(parentField, itemFieldIndex) {

      var childFieldTemplate = config.fieldItemFieldTemplates(parentField)[itemFieldIndex];

      var newValue = config.fieldTemplateValue(childFieldTemplate);

      // Just a placeholder key. Should not be important.
      var key = "__unknown_key__";

      if (_.isArray(parentField.value)) {
        // Just a placeholder position for an array.
        key = parentField.value.length;
      }

      // Just a placeholder field index. Should not be important.
      var fieldIndex = 0;
      if (_.isObject(parentField.value)) {
        fieldIndex = Object.keys(parentField.value).length;
      }

      var childField = config.createChildField(parentField, {
        fieldTemplate: childFieldTemplate, key: key, fieldIndex: fieldIndex, value: newValue
      });

      newValue = config.inflateFieldValue(childField);

      return newValue;
    },

    // Given a value, create a field template for that value.
    createFieldTemplateFromValue: function createFieldTemplateFromValue(value) {

      var field = {
        type: "json"
      };
      if (_.isString(value)) {
        field = {
          type: "string"
        };
      } else if (_.isNumber(value)) {
        field = {
          type: "number"
        };
      } else if (_.isBoolean(value)) {
        field = {
          type: "boolean"
        };
      } else if (_.isArray(value)) {
        var arrayItemFields = value.map(function (childValue, i) {
          var childField = config.createFieldTemplateFromValue(childValue);
          childField.key = i;
          return childField;
        });
        field = {
          type: "array",
          fields: arrayItemFields
        };
      } else if (_.isObject(value)) {
        var objectItemFields = Object.keys(value).map(function (key) {
          var childField = config.createFieldTemplateFromValue(value[key]);
          childField.key = key;
          childField.label = config.humanize(key);
          return childField;
        });
        field = {
          type: "object",
          fields: objectItemFields
        };
      } else if (_.isNull(value)) {
        field = {
          type: "json"
        };
      }
      return field;
    },

    // Default value factory

    createDefaultValue: function createDefaultValue(fieldTemplate) {

      var defaultValue = config.fieldTemplateDefaultValue(fieldTemplate);

      if (!_.isUndefined(defaultValue)) {
        return utils.deepCopy(defaultValue);
      }

      var typeName = config.fieldTypeName(fieldTemplate);

      if (config["createDefaultValue_" + typeName]) {
        return config["createDefaultValue_" + typeName](fieldTemplate);
      }

      return "";
    },

    // Field helpers

    // Determine if a value "exists".
    hasValue: function hasValue(fieldTemplate, value) {
      return value !== null && !_.isUndefined(value);
    },

    // Coerce a value to value appropriate for a field.
    coerceValue: function coerceValue(field, value) {

      var typeName = config.fieldTypeName(field);

      if (config["coerceValue_" + typeName]) {
        return config["coerceValue_" + typeName](field, value);
      }

      return value;
    },

    // Given a field and a child value, find the appropriate field template for
    // that child value.
    childFieldTemplateForValue: function childFieldTemplateForValue(field, childValue) {

      var fieldTemplate;

      var fieldTemplates = config.fieldItemFieldTemplates(field);

      fieldTemplate = _.find(fieldTemplates, function (itemFieldTemplate) {
        return config.matchesFieldTemplateToValue(itemFieldTemplate, childValue);
      });

      if (fieldTemplate) {
        return fieldTemplate;
      } else {
        return config.createFieldTemplateFromValue(childValue);
      }
    },

    // Determine if a value is a match for a field template.
    matchesFieldTemplateToValue: function matchesFieldTemplateToValue(fieldTemplate, value) {
      var match = fieldTemplate.match;
      if (!match) {
        return true;
      }
      return _.every(Object.keys(match), function (key) {
        return _.isEqual(match[key], value[key]);
      });
    },

    // Field template helpers

    // Normalized (PascalCase) type name for a field.
    fieldTemplateTypeName: function fieldTemplateTypeName(fieldTemplate) {

      var typeName = utils.dashToPascal(fieldTemplate.type || "undefined");

      var alias = config["alias_" + typeName];

      if (alias) {
        if (_.isFunction(alias)) {
          return alias.call(config, fieldTemplate);
        } else {
          return alias;
        }
      }

      if (fieldTemplate.list) {
        typeName = "Array";
      }

      return typeName;
    },

    // Default value for a field template.
    fieldTemplateDefaultValue: function fieldTemplateDefaultValue(fieldTemplate) {

      return fieldTemplate["default"];
    },

    // Value for a field template. Used to determine the value of a new child
    // field.
    fieldTemplateValue: function fieldTemplateValue(fieldTemplate) {

      // This logic might be brittle.

      var defaultValue = config.fieldTemplateDefaultValue(fieldTemplate);

      var match = config.fieldTemplateMatch(fieldTemplate);

      var value;

      if (_.isUndefined(defaultValue) && !_.isUndefined(match)) {
        return utils.deepCopy(match);
      } else {
        return config.createDefaultValue(fieldTemplate);
      }

      return value;
    },

    // Match rule for a field template.
    fieldTemplateMatch: function fieldTemplateMatch(fieldTemplate) {
      return fieldTemplate.match;
    },

    // Determine if a field template has a single-line value.
    fieldTemplateIsSingleLine: function fieldTemplateIsSingleLine(fieldTemplate) {
      return fieldTemplate.isSingleLine || fieldTemplate.is_single_line || fieldTemplate.type === "single-line-string" || fieldTemplate.type === "SingleLineString";
    },

    // Field helpers

    // Get an array of keys representing the path to a value.
    fieldValuePath: function fieldValuePath(field) {

      var parentPath = [];

      if (field.parent) {
        parentPath = config.fieldValuePath(field.parent);
      }

      return parentPath.concat(field.key).filter(function (key) {
        return !_.isUndefined(key) && key !== "";
      });
    },

    // Clone a field with a different value.
    fieldWithValue: function fieldWithValue(field, value) {
      return _.extend({}, field, { value: value });
    },

    fieldTypeName: delegateTo("fieldTemplateTypeName"),

    // Field is loading choices.
    fieldIsLoading: function fieldIsLoading(field) {
      return field.isLoading;
    },

    // Get the choices for a dropdown field.
    fieldChoices: function fieldChoices(field) {

      return config.normalizeChoices(field.choices);
    },

    // Get the choices for a pretty dropdown field.
    fieldPrettyChoices: function fieldPrettyChoices(field) {

      return config.normalizePrettyChoices(field.choices);
    },

    // Get a set of boolean choices for a field.
    fieldBooleanChoices: function fieldBooleanChoices(field) {

      var choices = config.fieldChoices(field);

      if (choices.length === 0) {
        return [{
          label: "yes",
          value: true
        }, {
          label: "no",
          value: false
        }];
      }

      return choices.map(function (choice) {
        if (_.isBoolean(choice.value)) {
          return choice;
        }
        return _.extend({}, choice, {
          value: config.coerceValueToBoolean(choice.value)
        });
      });
    },

    // Get a set of replacement choices for a field.
    fieldReplaceChoices: function fieldReplaceChoices(field) {

      return config.normalizeChoices(field.replaceChoices);
    },

    // The active selected choice could be unavailable in the current list of
    // choices. This provides the selected choice in that case.
    fieldSelectedChoice: function fieldSelectedChoice(field) {

      return field.selectedChoice || null;
    },

    // The active replace labels could be unavilable in the current list of
    // replace choices. This provides the currently used replace labels in
    // that case.
    fieldSelectedReplaceChoices: function fieldSelectedReplaceChoices(field) {

      return config.normalizeChoices(field.selectedReplaceChoices);
    },

    // Get a label for a field.
    fieldLabel: function fieldLabel(field) {
      return field.label;
    },

    // Get a placeholder (just a default display value, not a default value) for a field.
    fieldPlaceholder: function fieldPlaceholder(field) {
      return field.placeholder;
    },

    // Get the help text for a field.
    fieldHelpText: function fieldHelpText(field) {
      return field.help_text_html || field.help_text || field.helpText || field.helpTextHtml;
    },

    // Get whether or not a field is required.
    fieldIsRequired: function fieldIsRequired(field) {
      return field.required ? true : false;
    },

    // Determine if value for this field is not a leaf value.
    fieldHasValueChildren: function fieldHasValueChildren(field) {

      var defaultValue = config.createDefaultValue(field);

      if (_.isObject(defaultValue) || _.isArray(defaultValue)) {
        return true;
      }

      return false;
    },

    // Get the child field templates for this field.
    fieldChildFieldTemplates: function fieldChildFieldTemplates(field) {
      return field.fields || [];
    },

    // Get the field templates for each item of this field. (For dynamic children,
    // like arrays.)
    fieldItemFieldTemplates: function fieldItemFieldTemplates(field) {
      if (!field.itemFields) {
        return [{ type: "text" }];
      }
      if (!_.isArray(field.itemFields)) {
        return [field.itemFields];
      }
      return field.itemFields;
    },

    // Template for a custom field for a dropdown.
    fieldCustomFieldTemplate: function fieldCustomFieldTemplate(field) {
      return field.customField;
    },

    fieldIsSingleLine: delegateTo("fieldTemplateIsSingleLine"),

    // Get whether or not a field is collapsed.
    fieldIsCollapsed: function fieldIsCollapsed(field) {
      return field.collapsed ? true : false;
    },

    // Get wheter or not a field can be collapsed.
    fieldIsCollapsible: function fieldIsCollapsible(field) {
      return field.collapsible || !_.isUndefined(field.collapsed);
    },

    // Get the number of rows for a field.
    fieldRows: function fieldRows(field) {
      return field.rows;
    },

    fieldErrors: function fieldErrors(field) {

      var errors = [];

      if (config.isKey(field.key)) {
        config.validateField(field, errors);
      }

      return errors;
    },

    fieldMatch: delegateTo("fieldTemplateMatch"),

    // Return true if field is read-only, or is a descendant of a read-only field
    fieldIsReadOnly: function fieldIsReadOnly(field) {
      if (field.readOnly) {
        return true;
      } else if (field.parent) {
        return config.fieldIsReadOnly(field.parent);
      } else {
        return false;
      }
    },

    // Other helpers

    // Convert a key to a nice human-readable version.
    humanize: function humanize(property) {
      property = property.replace(/\{\{/g, "");
      property = property.replace(/\}\}/g, "");
      return property.replace(/_/g, " ").replace(/(\w+)/g, function (match) {
        return match.charAt(0).toUpperCase() + match.slice(1);
      });
    },

    // Normalize some choices for a drop-down.
    normalizeChoices: function normalizeChoices(choices) {

      if (!choices) {
        return [];
      }

      // Convert comma separated string to array of strings.
      if (_.isString(choices)) {
        choices = choices.split(",");
      }

      // Convert object to array of objects with `value` and `label` properties.
      if (!_.isArray(choices) && _.isObject(choices)) {
        choices = Object.keys(choices).map(function (key) {
          return {
            value: key,
            label: choices[key]
          };
        });
      }

      // Copy the array of choices so we can manipulate them.
      choices = choices.slice(0);

      // Array of choice arrays should be flattened.
      choices = _.flatten(choices);

      choices.forEach(function (choice, i) {
        // Convert any string choices to objects with `value` and `label`
        // properties.
        if (_.isString(choice)) {
          choices[i] = {
            value: choice,
            label: config.humanize(choice)
          };
        }
        if (!choices[i].label) {
          choices[i].label = config.humanize(choices[i].value);
        }
      });

      return choices;
    },

    // Normalize choices for a pretty drop down, with 'sample' values
    normalizePrettyChoices: function normalizePrettyChoices(choices) {
      if (!_.isArray(choices) && _.isObject(choices)) {
        choices = Object.keys(choices).map(function (key) {
          return {
            value: key,
            label: choices[key],
            sample: key
          };
        });
      }

      return config.normalizeChoices(choices);
    },

    // Coerce a value to a boolean
    coerceValueToBoolean: function coerceValueToBoolean(value) {
      if (!_.isString(value)) {
        // Just use the default truthiness.
        return value ? true : false;
      }
      value = value.toLowerCase();
      if (value === "" || value === "no" || value === "off" || value === "false") {
        return false;
      }
      return true;
    },

    // Determine if a value is a valid key.
    isKey: function isKey(key) {
      return _.isNumber(key) && key >= 0 || _.isString(key) && key !== "";
    },

    // Fast way to check for empty object.
    isEmptyObject: function isEmptyObject(obj) {
      for (var key in obj) {
        if (obj.hasOwnProperty(key)) {
          return false;
        }
      }
      return true;
    },

    actionChoiceLabel: function actionChoiceLabel(action) {
      return utils.capitalize(action).replace(/[-]/g, " ");
    },

    isSearchStringInChoice: function isSearchStringInChoice(searchString, choice) {
      return choice.label && choice.label.toLowerCase().indexOf(searchString.toLowerCase()) > -1;
    }
  };
};
// # default-config

/*
This is the default configuration plugin for formatic. To change formatic's
behavior, just create your own plugin function that returns an object with
methods you want to add or override.
*/

/* fieldTemplate */ /* fieldTemplate */ /* fieldTemplate */ /* fieldTemplate */ /* field, props */ /* field */

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"./components/fields/array":2,"./components/fields/boolean":3,"./components/fields/checkbox-array":4,"./components/fields/checkbox-boolean":5,"./components/fields/code":6,"./components/fields/copy":7,"./components/fields/fields":8,"./components/fields/grouped-fields":9,"./components/fields/json":10,"./components/fields/object":11,"./components/fields/password":12,"./components/fields/pretty-boolean":13,"./components/fields/pretty-select":14,"./components/fields/pretty-text2":15,"./components/fields/select":16,"./components/fields/single-line-string":17,"./components/fields/string":18,"./components/fields/unknown":19,"./components/helpers/add-item":20,"./components/helpers/array-control":21,"./components/helpers/array-item":24,"./components/helpers/array-item-control":22,"./components/helpers/array-item-value":23,"./components/helpers/choice-section-header":25,"./components/helpers/choices":27,"./components/helpers/choices-search":26,"./components/helpers/field":29,"./components/helpers/field-template-choices":28,"./components/helpers/help":30,"./components/helpers/insert-button":31,"./components/helpers/label":32,"./components/helpers/loading-choice":33,"./components/helpers/loading-choices":34,"./components/helpers/move-item-back":35,"./components/helpers/move-item-forward":36,"./components/helpers/object-control":37,"./components/helpers/object-item":41,"./components/helpers/object-item-control":38,"./components/helpers/object-item-key":39,"./components/helpers/object-item-value":40,"./components/helpers/pretty-select-input":42,"./components/helpers/pretty-select-value":43,"./components/helpers/pretty-tag":44,"./components/helpers/pretty-text-input":45,"./components/helpers/remove-item":46,"./components/helpers/sample":47,"./components/helpers/select-value":48,"./undash":62,"./utils":63}],51:[function(require,module,exports){
(function (global){
"use strict";

var React = (typeof window !== "undefined" ? window.React : typeof global !== "undefined" ? global.React : null);
var _ = require("./undash");

var utils = require("./utils");

var defaultConfigPlugin = require("./default-config");

var createConfig = function createConfig() {
  for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
    args[_key] = arguments[_key];
  }

  var plugins = [defaultConfigPlugin].concat(args);

  return plugins.reduce(function (config, plugin) {
    if (_.isFunction(plugin)) {
      var extensions = plugin(config);
      if (extensions) {
        _.extend(config, extensions);
      }
    } else {
      _.extend(config, plugin);
    }

    return config;
  }, {});
};

var defaultConfig = createConfig();

// The main formatic component that renders the form.
var FormaticControlledClass = React.createClass({

  displayName: "FormaticControlled",

  // Respond to any value changes.
  onChange: function onChange(newValue, info) {
    if (!this.props.onChange) {
      return;
    }
    info = _.extend({}, info);
    info.path = this.props.config.fieldValuePath(info.field);
    this.props.onChange(newValue, info);
  },

  // Respond to any actions other than value changes. (For example, focus and
  // blur.)
  onAction: function onAction(info) {
    if (!this.props.onAction) {
      return;
    }
    info = _.extend({}, info);
    info.path = this.props.config.fieldValuePath(info.field);
    this.props.onAction(info);
  },

  // Render the root component by delegating to the config.
  render: function render() {

    var config = this.props.config;

    return config.renderFormaticComponent(this);
  }
});

var FormaticControlled = React.createFactory(FormaticControlledClass);

// A wrapper component that is actually exported and can allow formatic to be
// used in an "uncontrolled" manner. (See uncontrolled components in the React
// documentation for an explanation of the difference.)
module.exports = React.createClass({

  displayName: "Formatic",

  // Export some stuff as statics.
  statics: {
    createConfig: createConfig,
    availableMixins: {
      clickOutside: require("./mixins/click-outside.js"),
      field: require("./mixins/field.js"),
      helper: require("./mixins/helper.js"),
      resize: require("./mixins/resize.js"),
      scroll: require("./mixins/scroll.js"),
      undoStack: require("./mixins/undo-stack.js")
    },
    plugins: {
      bootstrap: require("./plugins/bootstrap"),
      meta: require("./plugins/meta"),
      reference: require("./plugins/reference"),
      elementClasses: require("./plugins/element-classes")
    },
    utils: utils
  },

  // If we got a value, treat this component as controlled. Either way, retain
  // the value in the state.
  getInitialState: function getInitialState() {
    return {
      isControlled: !_.isUndefined(this.props.value),
      value: _.isUndefined(this.props.value) ? this.props.defaultValue : this.props.value
    };
  },

  // If this is a controlled component, change our state to reflect the new
  // value. For uncontrolled components, ignore any value changes.
  componentWillReceiveProps: function componentWillReceiveProps(newProps) {
    if (this.state.isControlled) {
      if (!_.isUndefined(newProps.value)) {
        this.setState({
          value: newProps.value
        });
      }
    }
  },

  // If this is an uncontrolled component, set our state to reflect the new
  // value. Either way, call the onChange callback.
  onChange: function onChange(newValue, info) {
    if (!this.state.isControlled) {
      this.setState({
        value: newValue
      });
    }
    if (!this.props.onChange) {
      return;
    }
    this.props.onChange(newValue, info);
  },

  // Any actions should be sent to the generic onAction callback but also split
  // into discreet callbacks per action.
  onAction: function onAction(info) {
    if (this.props.onAction) {
      this.props.onAction(info);
    }
    var action = utils.dashToPascal(info.action);
    if (this.props["on" + action]) {
      this.props["on" + action](info);
    }
  },

  // Render the wrapper component (by just delegating to the main component).
  render: function render() {

    var config = this.props.config || defaultConfig;
    var value = this.state.value;

    if (this.state.isControlled) {
      if (!this.props.onChange) {
        console.log("You should supply an onChange handler if you supply a value.");
      }
    }

    var props = {
      config: config,
      // Allow field templates to be passed in as `field` or `fields`. After this, stop
      // calling them fields.
      fieldTemplate: this.props.field,
      fieldTemplates: this.props.fields,
      value: value,
      onChange: this.onChange,
      onAction: this.onAction
    };

    _.each(this.props, function (propValue, key) {
      if (!(key in props)) {
        props[key] = propValue;
      }
    });

    return FormaticControlled(props);
  }

});
// # formatic

/*
The root formatic component.

The root formatic component is actually two components. The main component is
a controlled component where you must pass the value in with each render. This
is actually wrapped in another component which allows you to use formatic as
an uncontrolled component where it retains the state of the value. The wrapper
is what is actually exported.
*/

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"./default-config":50,"./mixins/click-outside.js":52,"./mixins/field.js":53,"./mixins/helper.js":54,"./mixins/resize.js":55,"./mixins/scroll.js":56,"./mixins/undo-stack.js":57,"./plugins/bootstrap":58,"./plugins/element-classes":59,"./plugins/meta":60,"./plugins/reference":61,"./undash":62,"./utils":63}],52:[function(require,module,exports){
"use strict";

var _ = require("../undash");

var hasAncestor = (function (_hasAncestor) {
  var _hasAncestorWrapper = function hasAncestor(_x, _x2) {
    return _hasAncestor.apply(this, arguments);
  };

  _hasAncestorWrapper.toString = function () {
    return _hasAncestor.toString();
  };

  return _hasAncestorWrapper;
})(function (child, parent) {
  if (child.parentNode === parent) {
    return true;
  }
  if (child.parentNode === null) {
    return false;
  }
  return hasAncestor(child.parentNode, parent);
});

module.exports = {

  isNodeOutside: function isNodeOutside(nodeOut, nodeIn) {
    if (nodeOut === nodeIn) {
      return false;
    }
    if (hasAncestor(nodeOut, nodeIn)) {
      return false;
    }
    return true;
  },

  isNodeInside: function isNodeInside(nodeIn, nodeOut) {
    return !this.isNodeOutside(nodeIn, nodeOut);
  },

  _onClickMousedown: function _onClickMousedown() {
    _.each(this.clickOutsideHandlers, (function (funcs, ref) {
      if (this.refs[ref]) {
        this._mousedownRefs[ref] = true;
      }
    }).bind(this));
  },

  _onClickMouseup: function _onClickMouseup(event) {
    _.each(this.clickOutsideHandlers, (function (funcs, ref) {
      if (this.refs[ref] && this._mousedownRefs[ref]) {
        if (this.isNodeOutside(event.target, this.refs[ref].getDOMNode())) {
          funcs.forEach((function (fn) {
            fn.call(this, event);
          }).bind(this));
        }
      }
      this._mousedownRefs[ref] = false;
    }).bind(this));
  },

  setOnClickOutside: function setOnClickOutside(ref, fn) {
    if (!this.clickOutsideHandlers[ref]) {
      this.clickOutsideHandlers[ref] = [];
    }
    this.clickOutsideHandlers[ref].push(fn);
  },

  componentDidMount: function componentDidMount() {
    this.clickOutsideHandlers = {};
    this._didMouseDown = false;
    document.addEventListener("mousedown", this._onClickMousedown);
    document.addEventListener("mouseup", this._onClickMouseup);
    //document.addEventListener('click', this._onClickDocument);
    this._mousedownRefs = {};
  },

  componentWillUnmount: function componentWillUnmount() {
    this.clickOutsideHandlers = {};
    //document.removeEventListener('click', this._onClickDocument);
    document.removeEventListener("mouseup", this._onClickMouseup);
    document.removeEventListener("mousedown", this._onClickMousedown);
  }
};
// # click-outside mixin

/*
There's no native React way to detect clicking outside an element. Sometimes
this is useful, so that's what this mixin does. To use it, mix it in and use it
from your component like this:

```js
module.exports = React.createClass({

  mixins: [require('../..mixins/click-outside')],

  onClickOutside: function () {
    console.log('clicked outside!');
  },

  componentDidMount: function () {
    this.setOnClickOutside('myDiv', this.onClickOutside);
  },

  render: function () {
    return React.DOM.div({ref: 'myDiv'},
      'Hello!'
    )
  }
});
```
*/

},{"../undash":62}],53:[function(require,module,exports){
"use strict";

var _ = require("../undash");

module.exports = {

  // Signal a change in value.
  onChangeValue: function onChangeValue(value) {
    this.props.onChange(value, {
      field: this.props.field
    });
  },

  // Bubble up a value.
  onBubbleValue: function onBubbleValue(value, info) {
    this.props.onChange(value, info);
  },

  // Start an action bubbling up through parent components.
  onStartAction: function onStartAction(action, props) {
    if (this.props.onAction) {
      var info = _.extend({}, props);
      info.action = action;
      info.field = this.props.field;
      this.props.onAction(info);
    }
  },

  onFocusAction: function onFocusAction() {
    this.onStartAction("focus");
  },

  onBlurAction: function onBlurAction() {
    this.onStartAction("blur");
  },

  // Bubble up an action.
  onBubbleAction: function onBubbleAction(info) {
    if (this.props.onAction) {
      this.props.onAction(info);
    }
  },

  // Delegate rendering back to config so it can be wrapped.
  renderWithConfig: function renderWithConfig() {
    return this.props.config.renderFieldComponent(this);
  },

  isReadOnly: function isReadOnly() {
    return this.props.config.fieldIsReadOnly(this.props.field);
  }
};
// # field mixin

/*
This mixin gets mixed into all field components.
*/

},{"../undash":62}],54:[function(require,module,exports){
"use strict";

var _ = require("../undash");

module.exports = {

  // Delegate rendering back to config so it can be wrapped.
  renderWithConfig: function renderWithConfig() {
    return this.props.config.renderComponent(this);
  },

  // Start an action bubbling up through parent components.
  onStartAction: function onStartAction(action, props) {
    if (this.props.onAction) {
      var info = _.extend({}, props);
      info.action = action;
      info.field = this.props.field;
      this.props.onAction(info);
    }
  },

  // Bubble up an action.
  onBubbleAction: function onBubbleAction(info) {
    if (this.props.onAction) {
      this.props.onAction(info);
    }
  },

  onFocusAction: function onFocusAction() {
    this.onStartAction("focus");
  },

  onBlurAction: function onBlurAction() {
    this.onStartAction("blur");
  },

  isReadOnly: function isReadOnly() {
    return this.props.config.fieldIsReadOnly(this.props.field);
  }
};
// # helper mixin

/*
This gets mixed into all helper components.
*/

},{"../undash":62}],55:[function(require,module,exports){
"use strict";

var id = 0;

var resizeIntervalElements = {};
var resizeIntervalElementsCount = 0;
var resizeIntervalTimer = null;

var checkElements = function checkElements() {
  Object.keys(resizeIntervalElements).forEach(function (key) {
    var element = resizeIntervalElements[key];
    if (element.clientWidth !== element.__prevClientWidth || element.clientHeight !== element.__prevClientHeight) {
      element.__prevClientWidth = element.clientWidth;
      element.__prevClientHeight = element.clientHeight;
      var handlers = element.__resizeHandlers;
      handlers.forEach(function (handler) {
        handler();
      });
    }
  }, 100);
};

var addResizeIntervalHandler = function addResizeIntervalHandler(element, fn) {
  if (resizeIntervalTimer === null) {
    resizeIntervalTimer = setInterval(checkElements, 100);
  }
  if (!("__resizeId" in element)) {
    id++;
    element.__prevClientWidth = element.clientWidth;
    element.__prevClientHeight = element.clientHeight;
    element.__resizeId = id;
    resizeIntervalElementsCount++;
    resizeIntervalElements[id] = element;
    element.__resizeHandlers = [];
  }
  element.__resizeHandlers.push(fn);
};

var removeResizeIntervalHandlers = function removeResizeIntervalHandlers(element) {
  if (!("__resizeId" in element)) {
    return;
  }
  var resizeId = element.__resizeId;
  delete element.__resizeId;
  delete element.__resizeHandlers;
  delete resizeIntervalElements[resizeId];
  resizeIntervalElementsCount--;
  if (resizeIntervalElementsCount < 1) {
    clearInterval(resizeIntervalTimer);
    resizeIntervalTimer = null;
  }
};

var onResize = function onResize(ref, fn) {
  fn(ref);
};

module.exports = {

  componentDidMount: function componentDidMount() {
    if (this.onResizeWindow) {
      window.addEventListener("resize", this.onResizeWindow);
    }
    this.resizeElementRefs = {};
  },

  componentWillUnmount: function componentWillUnmount() {
    if (this.onResizeWindow) {
      window.removeEventListener("resize", this.onResizeWindow);
    }
    Object.keys(this.resizeElementRefs).forEach((function (ref) {
      removeResizeIntervalHandlers(this.refs[ref].getDOMNode());
    }).bind(this));
  },

  setOnResize: function setOnResize(ref, fn) {
    if (!this.resizeElementRefs[ref]) {
      this.resizeElementRefs[ref] = true;
    }
    addResizeIntervalHandler(this.refs[ref].getDOMNode(), onResize.bind(this, ref, fn));
  }
};
// # resize mixin

/*
You'd think it would be pretty easy to detect when a DOM element is resized.
And you'd be wrong. There are various tricks, but none of them work very well.
So, using good ol' polling here. To try to be as efficient as possible, there
is only a single setInterval used for all elements. To use:

```js
module.exports = React.createClass({

  mixins: [require('../../mixins/resize')],

  onResize: function () {
    console.log('resized!');
  },

  componentDidMount: function () {
    this.setOnResize('myText', this.onResize);
  },

  onChange: function () {
    ...
  },

  render: function () {
    return React.DOM.textarea({ref: 'myText', value: this.props.value, onChange: ...})
  }
});
```
*/

},{}],56:[function(require,module,exports){
"use strict";

module.exports = function (plugin) {

  plugin.exports = {

    componentDidMount: function componentDidMount() {
      if (this.onScrollWindow) {
        window.addEventListener("scroll", this.onScrollWindow);
      }
    },

    componentWillUnmount: function componentWillUnmount() {
      if (this.onScrollWindow) {
        window.removeEventListener("scroll", this.onScrollWindow);
      }
    }
  };
};
// # scroll mixin

/*
Currently unused.
*/

},{}],57:[function(require,module,exports){
"use strict";

module.exports = {
  getInitialState: function getInitialState() {
    return { undo: [], redo: [] };
  },

  snapshot: function snapshot() {
    var undo = this.state.undo.concat(this.getStateSnapshot());
    if (typeof this.state.undoDepth === "number") {
      if (undo.length > this.state.undoDepth) {
        undo.shift();
      }
    }
    this.setState({ undo: undo, redo: [] });
  },

  hasUndo: function hasUndo() {
    return this.state.undo.length > 0;
  },

  hasRedo: function hasRedo() {
    return this.state.redo.length > 0;
  },

  redo: function redo() {
    this._undoImpl(true);
  },

  undo: function undo() {
    this._undoImpl();
  },

  _undoImpl: function _undoImpl(isRedo) {
    var undo = this.state.undo.slice(0);
    var redo = this.state.redo.slice(0);
    var snapshot;

    if (isRedo) {
      if (redo.length === 0) {
        return;
      }
      snapshot = redo.pop();
      undo.push(this.getStateSnapshot());
    } else {
      if (undo.length === 0) {
        return;
      }
      snapshot = undo.pop();
      redo.push(this.getStateSnapshot());
    }

    this.setStateSnapshot(snapshot);
    this.setState({ undo: undo, redo: redo });
  }
};
// # undo-stack mixin

/*
Gives your component an undo stack.
*/

// http://prometheusresearch.github.io/react-forms/examples/undo.html

},{}],58:[function(require,module,exports){
"use strict";

var _ = require("../undash");

// Declare some classes and labels for each element.
var modifiers = {

  Field: { classes: { "form-group": true } },
  Help: { classes: { "help-block": true } },
  Sample: { classes: { "help-block": true } },
  ArrayControl: { classes: { "form-inline": true } },
  ArrayItem: { classes: { well: true } },
  ObjectItem: { classes: { well: true } },
  FieldTemplateChoices: { classes: { "form-control": true } },
  AddItem: { classes: { "glyphicon glyphicon-plus": true }, label: "" },
  RemoveItem: { classes: { "glyphicon glyphicon-remove": true }, label: "" },
  MoveItemBack: { classes: { "glyphicon glyphicon-arrow-up": true }, label: "" },
  MoveItemForward: { classes: { "glyphicon glyphicon-arrow-down": true }, label: "" },
  ObjectItemKey: { classes: { "form-control": true } },

  SingleLineString: { classes: { "form-control": true } },
  String: { classes: { "form-control": true } },
  PrettyText: { classes: { "form-control": true } },
  Json: { classes: { "form-control": true } },
  SelectValue: { classes: { "form-control": true } }
};

module.exports = function (config) {

  var createElement = config.createElement;

  return {
    createElement: (function (_createElement) {
      var _createElementWrapper = function createElement(_x, _x2, _x3) {
        return _createElement.apply(this, arguments);
      };

      _createElementWrapper.toString = function () {
        return _createElement.toString();
      };

      return _createElementWrapper;
    })(function (name, props, children) {

      name = config.elementName(name);

      var modifier = modifiers[name];

      if (modifier) {
        // If there is a modifier for this element, add the classes and label.
        props = _.extend({}, props);
        props.classes = _.extend({}, props.classes, modifier.classes);
        if ("label" in modifier) {
          props.label = modifier.label;
        }
      }

      return createElement(name, props, children);
    })
  };
};
// # bootstrap plugin

/*
The bootstrap plugin sneaks in some classes to elements so that it plays well
with Twitter Bootstrap.
*/

},{"../undash":62}],59:[function(require,module,exports){
"use strict";

var _ = require("../undash");

module.exports = function (config) {

  var createElement = config.createElement;

  var elementClasses = {};

  return {
    addElementClass: function addElementClass(name, className) {

      name = config.elementName(name);

      if (!elementClasses[name]) {
        elementClasses[name] = {};
      }

      elementClasses[name][className] = true;
    },

    // Wrap the createElement method.
    createElement: (function (_createElement) {
      var _createElementWrapper = function createElement(_x, _x2, _x3) {
        return _createElement.apply(this, arguments);
      };

      _createElementWrapper.toString = function () {
        return _createElement.toString();
      };

      return _createElementWrapper;
    })(function (name, props, children) {

      name = config.elementName(name);

      if (elementClasses[name]) {
        props = _.extend({}, props, { classes: elementClasses[name] });
      }

      return createElement(name, props, children);
    })
  };
};
// # element-classes plugin

/*
This plugins provides a config method addElementClass that lets you add on a
class to an element.
*/

},{"../undash":62}],60:[function(require,module,exports){
"use strict";

module.exports = function (config) {

  var initRootField = config.initRootField;
  var initField = config.initField;

  return {
    initRootField: (function (_initRootField) {
      var _initRootFieldWrapper = function initRootField(_x, _x2) {
        return _initRootField.apply(this, arguments);
      };

      _initRootFieldWrapper.toString = function () {
        return _initRootField.toString();
      };

      return _initRootFieldWrapper;
    })(function (field, props) {

      field.meta = props.meta || {};

      initRootField(field, props);
    }),

    initField: (function (_initField) {
      var _initFieldWrapper = function initField(_x) {
        return _initField.apply(this, arguments);
      };

      _initFieldWrapper.toString = function () {
        return _initField.toString();
      };

      return _initFieldWrapper;
    })(function (field) {

      if (field.parent && field.parent.meta) {
        field.meta = field.parent.meta;
      }

      initField(field);
    })
  };
};
// # meta plugin

/*
The meta plugin lets you pass in a meta prop to formatic. The prop then gets
passed through as a property for every field. You can then wrap `initField` to
get your meta values.
*/

},{}],61:[function(require,module,exports){
"use strict";

var _ = require("../undash");

module.exports = function (config) {

  var initField = config.initField;

  return {
    // Look for a template in this field or any of its parents.
    findFieldTemplate: function findFieldTemplate(field, name) {

      if (field.templates[name]) {
        return field.templates[name];
      }

      if (field.parent) {
        return config.findFieldTemplate(field.parent, name);
      }

      return null;
    },

    // Inherit from any field templates that this field template
    // extends.
    resolveFieldTemplate: function resolveFieldTemplate(field, fieldTemplate) {

      if (!fieldTemplate["extends"]) {
        return fieldTemplate;
      }

      var ext = fieldTemplate["extends"];

      if (!_.isArray(ext)) {
        ext = [ext];
      }

      var bases = ext.map(function (base) {
        var template = config.findFieldTemplate(field, base);
        if (!template) {
          throw new Error("Template " + base + " not found.");
        }
        return template;
      });

      var chain = [{}].concat(bases.reverse().concat([fieldTemplate]));
      fieldTemplate = _.extend.apply(_, chain);

      return fieldTemplate;
    },

    // Wrap the initField method.
    initField: (function (_initField) {
      var _initFieldWrapper = function initField(_x) {
        return _initField.apply(this, arguments);
      };

      _initFieldWrapper.toString = function () {
        return _initField.toString();
      };

      return _initFieldWrapper;
    })(function (field) {

      var templates = field.templates = {};

      var childFieldTemplates = config.fieldChildFieldTemplates(field);

      // Add each of the child field templates to our template map.
      childFieldTemplates.forEach(function (fieldTemplate) {

        if (_.isString(fieldTemplate)) {
          return;
        }

        var key = fieldTemplate.key;
        var id = fieldTemplate.id;

        if (fieldTemplate.template) {
          fieldTemplate = _.extend({}, fieldTemplate, { template: false });
        }

        if (!_.isUndefined(key) && key !== "") {
          templates[key] = fieldTemplate;
        }

        if (!_.isUndefined(id) && id !== "") {
          templates[id] = fieldTemplate;
        }
      });

      // Resolve any references to other field templates.
      if (childFieldTemplates.length > 0) {
        field.fields = childFieldTemplates.map(function (fieldTemplate) {
          if (_.isString(fieldTemplate)) {
            fieldTemplate = config.findFieldTemplate(field, fieldTemplate);
          }

          return config.resolveFieldTemplate(field, fieldTemplate);
        });

        field.fields = field.fields.filter(function (fieldTemplate) {
          return !fieldTemplate.template;
        });
      }

      var itemFieldTemplates = config.fieldItemFieldTemplates(field);

      // Resolve any of our item field templates. (Field templates for dynamic
      // child fields.)
      if (itemFieldTemplates.length > 0) {
        field.itemFields = itemFieldTemplates.map(function (itemFieldTemplate) {
          if (_.isString(itemFieldTemplate)) {
            itemFieldTemplate = config.findFieldTemplate(field, itemFieldTemplate);
          }

          return config.resolveFieldTemplate(field, itemFieldTemplate);
        });
      }

      initField(field);
    })
  };
};
// # reference plugin

/*
This plugin allows fields to be strings and reference other fields by key or
id. It also allows a field to extend another field with
extends: ['foo', 'bar'] where 'foo' and 'bar' refer to other keys or ids.
*/

},{"../undash":62}],62:[function(require,module,exports){
"use strict";

var _ = {};

_.assign = _.extend = require("object-assign");
_.isEqual = require("deep-equal");

// These are not necessarily complete implementations. They're just enough for
// what's used in formatic.

_.flatten = function (arrays) {
  return [].concat.apply([], arrays);
};

_.isString = function (value) {
  return typeof value === "string";
};
_.isUndefined = function (value) {
  return typeof value === "undefined";
};
_.isObject = function (value) {
  return typeof value === "object";
};
_.isArray = function (value) {
  return Object.prototype.toString.call(value) === "[object Array]";
};
_.isNumber = function (value) {
  return typeof value === "number";
};
_.isBoolean = function (value) {
  return typeof value === "boolean";
};
_.isNull = function (value) {
  return value === null;
};
_.isFunction = function (value) {
  return typeof value === "function";
};

_.clone = function (value) {
  if (!_.isObject(value)) {
    return value;
  }
  return _.isArray(value) ? value.slice() : _.assign({}, value);
};

_.find = function (items, testFn) {
  for (var i = 0; i < items.length; i++) {
    if (testFn(items[i])) {
      return items[i];
    }
  }
  return void 0;
};

_.every = function (items, testFn) {
  for (var i = 0; i < items.length; i++) {
    if (!testFn(items[i])) {
      return false;
    }
  }
  return true;
};

_.each = function (obj, iterateFn) {
  Object.keys(obj).forEach(function (key) {
    iterateFn(obj[key], key);
  });
};

module.exports = _;

},{"deep-equal":65,"object-assign":68}],63:[function(require,module,exports){
"use strict";

var _ = require("./undash");

var utils = exports;

// Copy obj recursing deeply.
utils.deepCopy = function (obj) {
  if (_.isArray(obj)) {
    return obj.map(function (item) {
      return utils.deepCopy(item);
    });
  } else if (_.isFunction(obj)) {
    return obj;
  } else if (_.isNull(obj)) {
    return obj;
  } else if (_.isObject(obj)) {
    var copy = {};
    _.each(obj, function (value, key) {
      copy[key] = utils.deepCopy(value);
    });
    return copy;
  } else {
    return obj;
  }
};

// Cache for strings converted to Pascal Case. This should be a finite list, so
// not much fear that we will run out of memory.
var dashToPascalCache = {};

// Convert foo-bar to FooBar.
utils.dashToPascal = function (s) {
  if (s === "") {
    return "";
  }
  if (!dashToPascalCache[s]) {
    dashToPascalCache[s] = s.split("-").map(function (part) {
      return part[0].toUpperCase() + part.substring(1);
    }).join("");
  }
  return dashToPascalCache[s];
};

// Copy all computed styles from one DOM element to another.
utils.copyElementStyle = function (fromElement, toElement) {
  var fromStyle = window.getComputedStyle(fromElement, "");

  if (fromStyle.cssText !== "") {
    toElement.style.cssText = fromStyle.cssText;
    return;
  }

  var cssRules = [];
  for (var i = 0; i < fromStyle.length; i++) {
    cssRules.push(fromStyle[i] + ":" + fromStyle.getPropertyValue(fromStyle[i]) + ";");
  }
  var cssText = cssRules.join("");

  toElement.style.cssText = cssText;
};

// Object to hold browser sniffing info.
var browser = {
  isChrome: false,
  isMozilla: false,
  isOpera: false,
  isIe: false,
  isSafari: false,
  isUnknown: false
};

// Sniff the browser.
var ua = "";

if (typeof navigator !== "undefined") {
  ua = navigator.userAgent;
}

if (ua.indexOf("Chrome") > -1) {
  browser.isChrome = true;
} else if (ua.indexOf("Safari") > -1) {
  browser.isSafari = true;
} else if (ua.indexOf("Opera") > -1) {
  browser.isOpera = true;
} else if (ua.indexOf("Firefox") > -1) {
  browser.isMozilla = true;
} else if (ua.indexOf("MSIE") > -1) {
  browser.isIe = true;
} else {
  browser.isUnknown = true;
}

// Export sniffed browser info.
utils.browser = browser;

// Create a method that delegates to another method on the same object. The
// default configuration uses this function to delegate one method to another.
utils.delegateTo = function (name) {
  return function () {
    return this[name].apply(this, arguments);
  };
};

utils.delegator = function (obj) {
  return function (name) {
    return function () {
      return obj[name].apply(obj, arguments);
    };
  };
};

utils.capitalize = function (s) {
  return s.charAt(0).toUpperCase() + s.substring(1).toLowerCase();
};
// # utils

/*
Just some shared utility functions.
*/

},{"./undash":62}],64:[function(require,module,exports){
/*!
  Copyright (c) 2015 Jed Watson.
  Licensed under the MIT License (MIT), see
  http://jedwatson.github.io/classnames
*/

function classNames () {
	'use strict';

	var classes = '';

	for (var i = 0; i < arguments.length; i++) {
		var arg = arguments[i];
		if (!arg) continue;

		var argType = typeof arg;

		if ('string' === argType || 'number' === argType) {
			classes += ' ' + arg;

		} else if (Array.isArray(arg)) {
			classes += ' ' + classNames.apply(null, arg);

		} else if ('object' === argType) {
			for (var key in arg) {
				if (arg.hasOwnProperty(key) && arg[key]) {
					classes += ' ' + key;
				}
			}
		}
	}

	return classes.substr(1);
}

// safely export classNames for node / browserify
if (typeof module !== 'undefined' && module.exports) {
	module.exports = classNames;
}

/* global define */
// safely export classNames for RequireJS
if (typeof define !== 'undefined' && define.amd) {
	define('classnames', [], function() {
		return classNames;
	});
}

},{}],65:[function(require,module,exports){
var pSlice = Array.prototype.slice;
var objectKeys = require('./lib/keys.js');
var isArguments = require('./lib/is_arguments.js');

var deepEqual = module.exports = function (actual, expected, opts) {
  if (!opts) opts = {};
  // 7.1. All identical values are equivalent, as determined by ===.
  if (actual === expected) {
    return true;

  } else if (actual instanceof Date && expected instanceof Date) {
    return actual.getTime() === expected.getTime();

  // 7.3. Other pairs that do not both pass typeof value == 'object',
  // equivalence is determined by ==.
  } else if (typeof actual != 'object' && typeof expected != 'object') {
    return opts.strict ? actual === expected : actual == expected;

  // 7.4. For all other Object pairs, including Array objects, equivalence is
  // determined by having the same number of owned properties (as verified
  // with Object.prototype.hasOwnProperty.call), the same set of keys
  // (although not necessarily the same order), equivalent values for every
  // corresponding key, and an identical 'prototype' property. Note: this
  // accounts for both named and indexed properties on Arrays.
  } else {
    return objEquiv(actual, expected, opts);
  }
}

function isUndefinedOrNull(value) {
  return value === null || value === undefined;
}

function isBuffer (x) {
  if (!x || typeof x !== 'object' || typeof x.length !== 'number') return false;
  if (typeof x.copy !== 'function' || typeof x.slice !== 'function') {
    return false;
  }
  if (x.length > 0 && typeof x[0] !== 'number') return false;
  return true;
}

function objEquiv(a, b, opts) {
  var i, key;
  if (isUndefinedOrNull(a) || isUndefinedOrNull(b))
    return false;
  // an identical 'prototype' property.
  if (a.prototype !== b.prototype) return false;
  //~~~I've managed to break Object.keys through screwy arguments passing.
  //   Converting to array solves the problem.
  if (isArguments(a)) {
    if (!isArguments(b)) {
      return false;
    }
    a = pSlice.call(a);
    b = pSlice.call(b);
    return deepEqual(a, b, opts);
  }
  if (isBuffer(a)) {
    if (!isBuffer(b)) {
      return false;
    }
    if (a.length !== b.length) return false;
    for (i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) return false;
    }
    return true;
  }
  try {
    var ka = objectKeys(a),
        kb = objectKeys(b);
  } catch (e) {//happens when one is a string literal and the other isn't
    return false;
  }
  // having the same number of owned properties (keys incorporates
  // hasOwnProperty)
  if (ka.length != kb.length)
    return false;
  //the same set of keys (although not necessarily the same order),
  ka.sort();
  kb.sort();
  //~~~cheap key test
  for (i = ka.length - 1; i >= 0; i--) {
    if (ka[i] != kb[i])
      return false;
  }
  //equivalent values for every corresponding key, and
  //~~~possibly expensive deep test
  for (i = ka.length - 1; i >= 0; i--) {
    key = ka[i];
    if (!deepEqual(a[key], b[key], opts)) return false;
  }
  return typeof a === typeof b;
}

},{"./lib/is_arguments.js":66,"./lib/keys.js":67}],66:[function(require,module,exports){
var supportsArgumentsClass = (function(){
  return Object.prototype.toString.call(arguments)
})() == '[object Arguments]';

exports = module.exports = supportsArgumentsClass ? supported : unsupported;

exports.supported = supported;
function supported(object) {
  return Object.prototype.toString.call(object) == '[object Arguments]';
};

exports.unsupported = unsupported;
function unsupported(object){
  return object &&
    typeof object == 'object' &&
    typeof object.length == 'number' &&
    Object.prototype.hasOwnProperty.call(object, 'callee') &&
    !Object.prototype.propertyIsEnumerable.call(object, 'callee') ||
    false;
};

},{}],67:[function(require,module,exports){
exports = module.exports = typeof Object.keys === 'function'
  ? Object.keys : shim;

exports.shim = shim;
function shim (obj) {
  var keys = [];
  for (var key in obj) keys.push(key);
  return keys;
}

},{}],68:[function(require,module,exports){
'use strict';

function ToObject(val) {
	if (val == null) {
		throw new TypeError('Object.assign cannot be called with null or undefined');
	}

	return Object(val);
}

module.exports = Object.assign || function (target, source) {
	var from;
	var keys;
	var to = ToObject(target);

	for (var s = 1; s < arguments.length; s++) {
		from = arguments[s];
		keys = Object.keys(Object(from));

		for (var i = 0; i < keys.length; i++) {
			to[keys[i]] = from[keys[i]];
		}
	}

	return to;
};

},{}],69:[function(require,module,exports){
module.exports = require('./src/ScrollLock');
},{"./src/ScrollLock":70}],70:[function(require,module,exports){
/**
 * Created by laiff on 10.12.14.
 */

/**
 * Prevent default behavior for event
 *
 * @param e
 * @returns {boolean}
 */
var cancelScrollEvent = function (e) {
    e.stopImmediatePropagation();
    e.preventDefault();
    e.returnValue = false;
    return false;
};

var addScrollEventListener = function (elem, handler) {
    elem.addEventListener('wheel', handler, false);
};

var removeScrollEventListener = function (elem, handler) {
    elem.removeEventListener('wheel', handler, false);
};

/**
 * @extends ReactCompositeComponentInterface
 *
 * @mixin ScrollLock
 */
var ScrollLock = {

    componentDidMount: function () {
        this.scrollLock();
    },

    componentDidUpdate: function () {
        this.scrollLock();
    },

    componentWillUnmount: function () {
        this.scrollRelease();
    },

    scrollLock: function () {
        var elem = this.getDOMNode();
        if (elem) {
            addScrollEventListener(elem, this.onScrollHandler);
        }
    },

    scrollRelease: function () {
        var elem = this.getDOMNode();
        if (elem) {
            removeScrollEventListener(elem, this.onScrollHandler);
        }
    },

    onScrollHandler: function (e) {
        var elem = this.getDOMNode();
        var scrollTop = elem.scrollTop;
        var scrollHeight = elem.scrollHeight;
        var height = elem.clientHeight;
        var wheelDelta = e.deltaY;
        var isDeltaPositive = wheelDelta > 0;

        if (isDeltaPositive && wheelDelta > scrollHeight - height - scrollTop) {
            elem.scrollTop = scrollHeight;
            return cancelScrollEvent(e);
        }
        else if (!isDeltaPositive && -wheelDelta > scrollTop) {
            elem.scrollTop = 0;
            return cancelScrollEvent(e);
        }
    }
};

module.exports = ScrollLock;
},{}]},{},[1])(1)
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvanVzdGluL0Ryb3Bib3gvZ2l0L2Zvcm1hdGljL2luZGV4LmpzIiwiL1VzZXJzL2p1c3Rpbi9Ecm9wYm94L2dpdC9mb3JtYXRpYy9saWIvY29tcG9uZW50cy9maWVsZHMvYXJyYXkuanMiLCIvVXNlcnMvanVzdGluL0Ryb3Bib3gvZ2l0L2Zvcm1hdGljL2xpYi9jb21wb25lbnRzL2ZpZWxkcy9ib29sZWFuLmpzIiwiL1VzZXJzL2p1c3Rpbi9Ecm9wYm94L2dpdC9mb3JtYXRpYy9saWIvY29tcG9uZW50cy9maWVsZHMvY2hlY2tib3gtYXJyYXkuanMiLCIvVXNlcnMvanVzdGluL0Ryb3Bib3gvZ2l0L2Zvcm1hdGljL2xpYi9jb21wb25lbnRzL2ZpZWxkcy9jaGVja2JveC1ib29sZWFuLmpzIiwiL1VzZXJzL2p1c3Rpbi9Ecm9wYm94L2dpdC9mb3JtYXRpYy9saWIvY29tcG9uZW50cy9maWVsZHMvY29kZS5qcyIsIi9Vc2Vycy9qdXN0aW4vRHJvcGJveC9naXQvZm9ybWF0aWMvbGliL2NvbXBvbmVudHMvZmllbGRzL2NvcHkuanMiLCIvVXNlcnMvanVzdGluL0Ryb3Bib3gvZ2l0L2Zvcm1hdGljL2xpYi9jb21wb25lbnRzL2ZpZWxkcy9maWVsZHMuanMiLCIvVXNlcnMvanVzdGluL0Ryb3Bib3gvZ2l0L2Zvcm1hdGljL2xpYi9jb21wb25lbnRzL2ZpZWxkcy9ncm91cGVkLWZpZWxkcy5qcyIsIi9Vc2Vycy9qdXN0aW4vRHJvcGJveC9naXQvZm9ybWF0aWMvbGliL2NvbXBvbmVudHMvZmllbGRzL2pzb24uanMiLCIvVXNlcnMvanVzdGluL0Ryb3Bib3gvZ2l0L2Zvcm1hdGljL2xpYi9jb21wb25lbnRzL2ZpZWxkcy9vYmplY3QuanMiLCIvVXNlcnMvanVzdGluL0Ryb3Bib3gvZ2l0L2Zvcm1hdGljL2xpYi9jb21wb25lbnRzL2ZpZWxkcy9wYXNzd29yZC5qcyIsIi9Vc2Vycy9qdXN0aW4vRHJvcGJveC9naXQvZm9ybWF0aWMvbGliL2NvbXBvbmVudHMvZmllbGRzL3ByZXR0eS1ib29sZWFuLmpzIiwiL1VzZXJzL2p1c3Rpbi9Ecm9wYm94L2dpdC9mb3JtYXRpYy9saWIvY29tcG9uZW50cy9maWVsZHMvcHJldHR5LXNlbGVjdC5qcyIsIi9Vc2Vycy9qdXN0aW4vRHJvcGJveC9naXQvZm9ybWF0aWMvbGliL2NvbXBvbmVudHMvZmllbGRzL3ByZXR0eS10ZXh0Mi5qcyIsIi9Vc2Vycy9qdXN0aW4vRHJvcGJveC9naXQvZm9ybWF0aWMvbGliL2NvbXBvbmVudHMvZmllbGRzL3NlbGVjdC5qcyIsIi9Vc2Vycy9qdXN0aW4vRHJvcGJveC9naXQvZm9ybWF0aWMvbGliL2NvbXBvbmVudHMvZmllbGRzL3NpbmdsZS1saW5lLXN0cmluZy5qcyIsIi9Vc2Vycy9qdXN0aW4vRHJvcGJveC9naXQvZm9ybWF0aWMvbGliL2NvbXBvbmVudHMvZmllbGRzL3N0cmluZy5qcyIsIi9Vc2Vycy9qdXN0aW4vRHJvcGJveC9naXQvZm9ybWF0aWMvbGliL2NvbXBvbmVudHMvZmllbGRzL3Vua25vd24uanMiLCIvVXNlcnMvanVzdGluL0Ryb3Bib3gvZ2l0L2Zvcm1hdGljL2xpYi9jb21wb25lbnRzL2hlbHBlcnMvYWRkLWl0ZW0uanMiLCIvVXNlcnMvanVzdGluL0Ryb3Bib3gvZ2l0L2Zvcm1hdGljL2xpYi9jb21wb25lbnRzL2hlbHBlcnMvYXJyYXktY29udHJvbC5qcyIsIi9Vc2Vycy9qdXN0aW4vRHJvcGJveC9naXQvZm9ybWF0aWMvbGliL2NvbXBvbmVudHMvaGVscGVycy9hcnJheS1pdGVtLWNvbnRyb2wuanMiLCIvVXNlcnMvanVzdGluL0Ryb3Bib3gvZ2l0L2Zvcm1hdGljL2xpYi9jb21wb25lbnRzL2hlbHBlcnMvYXJyYXktaXRlbS12YWx1ZS5qcyIsIi9Vc2Vycy9qdXN0aW4vRHJvcGJveC9naXQvZm9ybWF0aWMvbGliL2NvbXBvbmVudHMvaGVscGVycy9hcnJheS1pdGVtLmpzIiwiL1VzZXJzL2p1c3Rpbi9Ecm9wYm94L2dpdC9mb3JtYXRpYy9saWIvY29tcG9uZW50cy9oZWxwZXJzL2Nob2ljZS1zZWN0aW9uLWhlYWRlci5qcyIsIi9Vc2Vycy9qdXN0aW4vRHJvcGJveC9naXQvZm9ybWF0aWMvbGliL2NvbXBvbmVudHMvaGVscGVycy9jaG9pY2VzLXNlYXJjaC5qcyIsIi9Vc2Vycy9qdXN0aW4vRHJvcGJveC9naXQvZm9ybWF0aWMvbGliL2NvbXBvbmVudHMvaGVscGVycy9jaG9pY2VzLmpzIiwiL1VzZXJzL2p1c3Rpbi9Ecm9wYm94L2dpdC9mb3JtYXRpYy9saWIvY29tcG9uZW50cy9oZWxwZXJzL2ZpZWxkLXRlbXBsYXRlLWNob2ljZXMuanMiLCIvVXNlcnMvanVzdGluL0Ryb3Bib3gvZ2l0L2Zvcm1hdGljL2xpYi9jb21wb25lbnRzL2hlbHBlcnMvZmllbGQuanMiLCIvVXNlcnMvanVzdGluL0Ryb3Bib3gvZ2l0L2Zvcm1hdGljL2xpYi9jb21wb25lbnRzL2hlbHBlcnMvaGVscC5qcyIsIi9Vc2Vycy9qdXN0aW4vRHJvcGJveC9naXQvZm9ybWF0aWMvbGliL2NvbXBvbmVudHMvaGVscGVycy9pbnNlcnQtYnV0dG9uLmpzIiwiL1VzZXJzL2p1c3Rpbi9Ecm9wYm94L2dpdC9mb3JtYXRpYy9saWIvY29tcG9uZW50cy9oZWxwZXJzL2xhYmVsLmpzIiwiL1VzZXJzL2p1c3Rpbi9Ecm9wYm94L2dpdC9mb3JtYXRpYy9saWIvY29tcG9uZW50cy9oZWxwZXJzL2xvYWRpbmctY2hvaWNlLmpzIiwiL1VzZXJzL2p1c3Rpbi9Ecm9wYm94L2dpdC9mb3JtYXRpYy9saWIvY29tcG9uZW50cy9oZWxwZXJzL2xvYWRpbmctY2hvaWNlcy5qcyIsIi9Vc2Vycy9qdXN0aW4vRHJvcGJveC9naXQvZm9ybWF0aWMvbGliL2NvbXBvbmVudHMvaGVscGVycy9tb3ZlLWl0ZW0tYmFjay5qcyIsIi9Vc2Vycy9qdXN0aW4vRHJvcGJveC9naXQvZm9ybWF0aWMvbGliL2NvbXBvbmVudHMvaGVscGVycy9tb3ZlLWl0ZW0tZm9yd2FyZC5qcyIsIi9Vc2Vycy9qdXN0aW4vRHJvcGJveC9naXQvZm9ybWF0aWMvbGliL2NvbXBvbmVudHMvaGVscGVycy9vYmplY3QtY29udHJvbC5qcyIsIi9Vc2Vycy9qdXN0aW4vRHJvcGJveC9naXQvZm9ybWF0aWMvbGliL2NvbXBvbmVudHMvaGVscGVycy9vYmplY3QtaXRlbS1jb250cm9sLmpzIiwiL1VzZXJzL2p1c3Rpbi9Ecm9wYm94L2dpdC9mb3JtYXRpYy9saWIvY29tcG9uZW50cy9oZWxwZXJzL29iamVjdC1pdGVtLWtleS5qcyIsIi9Vc2Vycy9qdXN0aW4vRHJvcGJveC9naXQvZm9ybWF0aWMvbGliL2NvbXBvbmVudHMvaGVscGVycy9vYmplY3QtaXRlbS12YWx1ZS5qcyIsIi9Vc2Vycy9qdXN0aW4vRHJvcGJveC9naXQvZm9ybWF0aWMvbGliL2NvbXBvbmVudHMvaGVscGVycy9vYmplY3QtaXRlbS5qcyIsIi9Vc2Vycy9qdXN0aW4vRHJvcGJveC9naXQvZm9ybWF0aWMvbGliL2NvbXBvbmVudHMvaGVscGVycy9wcmV0dHktc2VsZWN0LWlucHV0LmpzIiwiL1VzZXJzL2p1c3Rpbi9Ecm9wYm94L2dpdC9mb3JtYXRpYy9saWIvY29tcG9uZW50cy9oZWxwZXJzL3ByZXR0eS1zZWxlY3QtdmFsdWUuanMiLCIvVXNlcnMvanVzdGluL0Ryb3Bib3gvZ2l0L2Zvcm1hdGljL2xpYi9jb21wb25lbnRzL2hlbHBlcnMvcHJldHR5LXRhZy5qcyIsIi9Vc2Vycy9qdXN0aW4vRHJvcGJveC9naXQvZm9ybWF0aWMvbGliL2NvbXBvbmVudHMvaGVscGVycy9wcmV0dHktdGV4dC1pbnB1dC5qcyIsIi9Vc2Vycy9qdXN0aW4vRHJvcGJveC9naXQvZm9ybWF0aWMvbGliL2NvbXBvbmVudHMvaGVscGVycy9yZW1vdmUtaXRlbS5qcyIsIi9Vc2Vycy9qdXN0aW4vRHJvcGJveC9naXQvZm9ybWF0aWMvbGliL2NvbXBvbmVudHMvaGVscGVycy9zYW1wbGUuanMiLCIvVXNlcnMvanVzdGluL0Ryb3Bib3gvZ2l0L2Zvcm1hdGljL2xpYi9jb21wb25lbnRzL2hlbHBlcnMvc2VsZWN0LXZhbHVlLmpzIiwiL1VzZXJzL2p1c3Rpbi9Ecm9wYm94L2dpdC9mb3JtYXRpYy9saWIvY29tcG9uZW50cy9oZWxwZXJzL3RhZy10cmFuc2xhdG9yLmpzIiwiL1VzZXJzL2p1c3Rpbi9Ecm9wYm94L2dpdC9mb3JtYXRpYy9saWIvZGVmYXVsdC1jb25maWcuanMiLCIvVXNlcnMvanVzdGluL0Ryb3Bib3gvZ2l0L2Zvcm1hdGljL2xpYi9mb3JtYXRpYy5qcyIsIi9Vc2Vycy9qdXN0aW4vRHJvcGJveC9naXQvZm9ybWF0aWMvbGliL21peGlucy9jbGljay1vdXRzaWRlLmpzIiwiL1VzZXJzL2p1c3Rpbi9Ecm9wYm94L2dpdC9mb3JtYXRpYy9saWIvbWl4aW5zL2ZpZWxkLmpzIiwiL1VzZXJzL2p1c3Rpbi9Ecm9wYm94L2dpdC9mb3JtYXRpYy9saWIvbWl4aW5zL2hlbHBlci5qcyIsIi9Vc2Vycy9qdXN0aW4vRHJvcGJveC9naXQvZm9ybWF0aWMvbGliL21peGlucy9yZXNpemUuanMiLCIvVXNlcnMvanVzdGluL0Ryb3Bib3gvZ2l0L2Zvcm1hdGljL2xpYi9taXhpbnMvc2Nyb2xsLmpzIiwiL1VzZXJzL2p1c3Rpbi9Ecm9wYm94L2dpdC9mb3JtYXRpYy9saWIvbWl4aW5zL3VuZG8tc3RhY2suanMiLCIvVXNlcnMvanVzdGluL0Ryb3Bib3gvZ2l0L2Zvcm1hdGljL2xpYi9wbHVnaW5zL2Jvb3RzdHJhcC5qcyIsIi9Vc2Vycy9qdXN0aW4vRHJvcGJveC9naXQvZm9ybWF0aWMvbGliL3BsdWdpbnMvZWxlbWVudC1jbGFzc2VzLmpzIiwiL1VzZXJzL2p1c3Rpbi9Ecm9wYm94L2dpdC9mb3JtYXRpYy9saWIvcGx1Z2lucy9tZXRhLmpzIiwiL1VzZXJzL2p1c3Rpbi9Ecm9wYm94L2dpdC9mb3JtYXRpYy9saWIvcGx1Z2lucy9yZWZlcmVuY2UuanMiLCIvVXNlcnMvanVzdGluL0Ryb3Bib3gvZ2l0L2Zvcm1hdGljL2xpYi91bmRhc2guanMiLCIvVXNlcnMvanVzdGluL0Ryb3Bib3gvZ2l0L2Zvcm1hdGljL2xpYi91dGlscy5qcyIsIm5vZGVfbW9kdWxlcy9jbGFzc25hbWVzL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL2RlZXAtZXF1YWwvaW5kZXguanMiLCJub2RlX21vZHVsZXMvZGVlcC1lcXVhbC9saWIvaXNfYXJndW1lbnRzLmpzIiwibm9kZV9tb2R1bGVzL2RlZXAtZXF1YWwvbGliL2tleXMuanMiLCJub2RlX21vZHVsZXMvb2JqZWN0LWFzc2lnbi9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9yZWFjdC1zY3JvbGwtbG9jay9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9yZWFjdC1zY3JvbGwtbG9jay9zcmMvU2Nyb2xsTG9jay5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0FDR0EsTUFBTSxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUMsZ0JBQWdCLENBQUMsQ0FBQzs7Ozs7O0FDSzNDLElBQUksS0FBSyxHQUFHLE9BQU8sQ0FBQyxjQUFjLENBQUMsQ0FBQztBQUNwQyxJQUFJLENBQUMsR0FBRyxLQUFLLENBQUMsR0FBRyxDQUFDO0FBQ2xCLElBQUksRUFBRSxHQUFHLE9BQU8sQ0FBQyxZQUFZLENBQUMsQ0FBQzs7QUFFL0IsTUFBTSxDQUFDLE9BQU8sR0FBRyxLQUFLLENBQUMsV0FBVyxDQUFDOztBQUVqQyxhQUFXLEVBQUUsT0FBTzs7QUFFcEIsUUFBTSxFQUFFLENBQUMsT0FBTyxDQUFDLG9CQUFvQixDQUFDLENBQUM7Ozs7Ozs7O0FBUXZDLGNBQVksRUFBRSxDQUFDOztBQUVmLGlCQUFlLEVBQUUsMkJBQVk7Ozs7QUFJM0IsUUFBSSxPQUFPLEdBQUcsRUFBRSxDQUFDOztBQUVqQixRQUFJLEtBQUssR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUM7O0FBRW5DLFNBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQSxVQUFVLElBQUksRUFBRSxDQUFDLEVB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QUUsS0FBSyxDQUFDLGFBQWEsQ0FBQyxPQUFPLENBQUMsdUNBQXVDLENBQUMsQ0FBQzs7QUFFbkcsMkJBQXVCLEVBQUUsS0FBSyxDQUFDLGFBQWEsQ0FBQyxPQUFPLENBQUMsaUNBQWlDLENBQUMsQ0FBQzs7QUFFeEYsc0NBQWtDLEVBQUUsS0FBSyxDQUFDLGFBQWEsQ0FBQyxPQUFPLENBQUMsNkNBQTZDLENBQUMsQ0FBQzs7QUFFL0cseUJBQXFCLEVBQUUsS0FBSyxDQUFDLGFBQWEsQ0FBQyxPQUFPLENBQUMsK0JBQStCLENBQUMsQ0FBQzs7QUFFcEYsNEJBQXdCLEVBQUUsS0FBSyxDQUFDLGFBQWEsQ0FBQyxPQUFPLENBQUMsa0NBQWtDLENBQUMsQ0FBQzs7QUFFMUYsaUNBQTZCLEVBQUUsS0FBSyxDQUFDLGFBQWEsQ0FBQyxPQUFPLENBQUMsd0NBQXdDLENBQUMsQ0FBQzs7QUFFckcsOEJBQTBCLEVBQUUsS0FBSyxDQUFDLGFBQWEsQ0FBQyxPQUFPLENBQUMscUNBQXFDLENBQUMsQ0FBQzs7QUFFL0YsK0JBQTJCLEVBQUUsS0FBSyxDQUFDLGFBQWEsQ0FBQyxPQUFPLENBQUMscUNBQXFDLENBQUMsQ0FBQzs7QUFFaEcsbUNBQStCLEVBQUUsS0FBSyxDQUFDLGFBQWEsQ0FBQyxPQUFPLENBQUMsMENBQTBDLENBQUMsQ0FBQzs7QUFFekcsaUNBQTZCLEVBQUUsS0FBSyxDQUFDLGFBQWEsQ0FBQyxPQUFPLENBQUMsd0NBQXdDLENBQUMsQ0FBQzs7QUFFckcsK0JBQTJCLEVBQUUsS0FBSyxDQUFDLGFBQWEsQ0FBQyxPQUFPLENBQUMsc0NBQXNDLENBQUMsQ0FBQzs7QUFFakcsNEJBQXdCLEVBQUUsS0FBSyxDQUFDLGFBQWEsQ0FBQyxPQUFPLENBQUMsa0NBQWtDLENBQUMsQ0FBQzs7QUFFMUYsNkJBQXlCLEVBQUUsS0FBSyxDQUFDLGFBQWEsQ0FBQyxPQUFPLENBQUMsbUNBQW1DLENBQUMsQ0FBQzs7QUFFNUYsbUNBQStCLEVBQUUsS0FBSyxDQUFDLGFBQWEsQ0FBQyxPQUFPLENBQUMsMENBQTBDLENB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LENBQUM7R0FDSCxDQUFDO0NBQ0gsQ0FBQzs7QUFFRixLQUFLLENBQUMsVUFBVSxHQUFHLFVBQVMsQ0FBQyxFQUFFO0FBQzdCLFNBQU8sQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxXQUFXLEVBQUUsR0FBRyxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLFdBQVcsRUFBRSxDQUFDO0NBQ2pFLENBQUM7Ozs7Ozs7O0FDeEhGO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNUQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUJBOztBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvLyAjIGluZGV4XG5cbi8vIEV4cG9ydCB0aGUgRm9ybWF0aWMgUmVhY3QgY2xhc3MgYXQgdGhlIHRvcCBsZXZlbC5cbm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZSgnLi9saWIvZm9ybWF0aWMnKTtcbiIsIi8vICMgYXJyYXkgY29tcG9uZW50XG5cbi8qXG5SZW5kZXIgYSBmaWVsZCB0byBlZGl0IGFycmF5IHZhbHVlcy5cbiovXG5cbid1c2Ugc3RyaWN0JztcblxudmFyIFJlYWN0ID0gcmVxdWlyZSgncmVhY3QvYWRkb25zJyk7XG52YXIgUiA9IFJlYWN0LkRPTTtcbnZhciBjeCA9IHJlcXVpcmUoJ2NsYXNzbmFtZXMnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG5cbiAgZGlzcGxheU5hbWU6ICdBcnJheScsXG5cbiAgbWl4aW5zOiBbcmVxdWlyZSgnLi4vLi4vbWl4aW5zL2ZpZWxkJyldLFxuXG4gIC8vIGdldERlZmF1bHRQcm9wczogZnVuY3Rpb24gKCkge1xuICAvLyAgIHJldHVybiB7XG4gIC8vICAgICBjbGFzc05hbWU6IHBsdWdpbi5jb25maWcuY2xhc3NOYW1lXG4gIC8vICAgfTtcbiAgLy8gfSxcblxuICBuZXh0TG9va3VwSWQ6IDAsXG5cbiAgZ2V0SW5pdGlhbFN0YXRlOiBmdW5jdGlvbiAoKSB7XG5cbiAgICAvLyBOZWVkIHRvIGNyZWF0ZSBhcnRpZmljaWFsIGtleXMgZm9yIHRoZSBhcnJheS4gSW5kZXhlcyBhcmUgbm90IGdvb2Qga2V5cyxcbiAgICAvLyBzaW5jZSB0aGV5IGNoYW5nZS4gU28sIG1hcCBlYWNoIHBvc2l0aW9uIHRvIGFuIGFydGlmaWNpYWwga2V5XG4gICAgdmFyIGxvb2t1cHMgPSBbXTtcblxuICAgIHZhciBpdGVtcyA9IHRoaXMucHJvcHMuZmllbGQudmFsdWU7XG5cbiAgICBpdGVtcy5mb3JFYWNoKGZ1bmN0aW9uIChpdGVtLCBpKSB7XG4gICAgICBsb29rdXBzW2ldID0gJ18nICsgdGhpcy5uZXh0TG9va3VwSWQ7XG4gICAgICB0aGlzLm5leHRMb29rdXBJZCsrO1xuICAgIH0uYmluZCh0aGlzKSk7XG5cbiAgICByZXR1cm4ge1xuICAgICAgbG9va3VwczogbG9va3Vwc1xuICAgIH07XG4gIH0sXG5cbiAgY29tcG9uZW50V2lsbFJlY2VpdmVQcm9wczogZnVuY3Rpb24gKG5ld1Byb3BzKSB7XG5cbiAgICB2YXIgbG9va3VwcyA9IHRoaXMuc3RhdGUubG9va3VwcztcblxuICAgIHZhciBpdGVtcyA9IG5ld1Byb3BzLmZpZWxkLnZhbHVlO1xuXG4gICAgLy8gTmVlZCB0byBzZXQgYXJ0aWZpY2lhbCBrZXlzIGZvciBuZXcgYXJyYXkgaXRlbXMuXG4gICAgaWYgKGl0ZW1zLmxlbmd0aCA+IGxvb2t1cHMubGVuZ3RoKSB7XG4gICAgICBmb3IgKHZhciBpID0gbG9va3Vwcy5sZW5ndGg7IGkgPCBpdGVtcy5sZW5ndGg7IGkrKykge1xuICAgICAgICBsb29rdXBzW2ldID0gJ18nICsgdGhpcy5uZXh0TG9va3VwSWQ7XG4gICAgICAgIHRoaXMubmV4dExvb2t1cElkKys7XG4gICAgICB9XG4gICAgfVxuXG4gICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICBsb29rdXBzOiBsb29rdXBzXG4gICAgfSk7XG4gIH0sXG5cbiAgb25DaGFuZ2U6IGZ1bmN0aW9uIChpLCBuZXdWYWx1ZSwgaW5mbykge1xuICAgIHZhciBuZXdBcnJheVZhbHVlID0gdGhpcy5wcm9wcy5maWVsZC52YWx1ZS5zbGljZSgwKTtcbiAgICBuZXdBcnJheVZhbHVlW2ldID0gbmV3VmFsdWU7XG4gICAgdGhpcy5vbkJ1YmJsZVZhbHVlKG5ld0FycmF5VmFsdWUsIGluZm8pO1xuICB9LFxuXG4gIG9uQXBwZW5kOiBmdW5jdGlvbiAoaXRlbUNob2ljZUluZGV4KSB7XG4gICAgdmFyIGNvbmZpZyA9IHRoaXMucHJvcHMuY29uZmlnO1xuICAgIHZhciBmaWVsZCA9IHRoaXMucHJvcHMuZmllbGQ7XG5cbiAgICB2YXIgbmV3VmFsdWUgPSBjb25maWcuY3JlYXRlTmV3Q2hpbGRGaWVsZFZhbHVlKGZpZWxkLCBpdGVtQ2hvaWNlSW5kZXgpO1xuXG4gICAgdmFyIGl0ZW1zID0gZmllbGQudmFsdWU7XG5cbiAgICBpdGVtcyA9IGl0ZW1zLmNvbmNhdChuZXdWYWx1ZSk7XG5cbiAgICB0aGlzLm9uQ2hhbmdlVmFsdWUoaXRlbXMpO1xuICB9LFxuXG4gIG9uUmVtb3ZlOiBmdW5jdGlvbiAoaSkge1xuICAgIHZhciBsb29rdXBzID0gdGhpcy5zdGF0ZS5sb29rdXBzO1xuICAgIGxvb2t1cHMuc3BsaWNlKGksIDEpO1xuICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgbG9va3VwczogbG9va3Vwc1xuICAgIH0pO1xuICAgIHZhciBuZXdJdGVtcyA9IHRoaXMucHJvcHMuZmllbGQudmFsdWUuc2xpY2UoMCk7XG4gICAgbmV3SXRlbXMuc3BsaWNlKGksIDEpO1xuICAgIHRoaXMub25DaGFuZ2VWYWx1ZShuZXdJdGVtcyk7XG4gIH0sXG5cbiAgb25Nb3ZlOiBmdW5jdGlvbiAoZnJvbUluZGV4LCB0b0luZGV4KSB7XG4gICAgdmFyIGxvb2t1cHMgPSB0aGlzLnN0YXRlLmxvb2t1cHM7XG4gICAgdmFyIGZyb21JZCA9IGxvb2t1cHNbZnJvbUluZGV4XTtcbiAgICB2YXIgdG9JZCA9IGxvb2t1cHNbdG9JbmRleF07XG4gICAgbG9va3Vwc1tmcm9tSW5kZXhdID0gdG9JZDtcbiAgICBsb29rdXBzW3RvSW5kZXhdID0gZnJvbUlkO1xuICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgbG9va3VwczogbG9va3Vwc1xuICAgIH0pO1xuXG4gICAgdmFyIG5ld0l0ZW1zID0gdGhpcy5wcm9wcy5maWVsZC52YWx1ZS5zbGljZSgwKTtcbiAgICBpZiAoZnJvbUluZGV4ICE9PSB0b0luZGV4ICYmXG4gICAgICBmcm9tSW5kZXggPj0gMCAmJiBmcm9tSW5kZXggPCBuZXdJdGVtcy5sZW5ndGggJiZcbiAgICAgIHRvSW5kZXggPj0gMCAmJiB0b0luZGV4IDwgbmV3SXRlbXMubGVuZ3RoXG4gICAgKSB7XG4gICAgICBuZXdJdGVtcy5zcGxpY2UodG9JbmRleCwgMCwgbmV3SXRlbXMuc3BsaWNlKGZyb21JbmRleCwgMSlbMF0pO1xuICAgIH1cbiAgICB0aGlzLm9uQ2hhbmdlVmFsdWUobmV3SXRlbXMpO1xuICB9LFxuXG4gIHJlbmRlcjogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLnJlbmRlcldpdGhDb25maWcoKTtcbiAgfSxcblxuICByZW5kZXJEZWZhdWx0OiBmdW5jdGlvbiAoKSB7XG5cbiAgICB2YXIgY29uZmlnID0gdGhpcy5wcm9wcy5jb25maWc7XG4gICAgdmFyIGZpZWxkID0gdGhpcy5wcm9wcy5maWVsZDtcblxuICAgIHZhciBmaWVsZHMgPSBjb25maWcuY3JlYXRlQ2hpbGRGaWVsZHMoZmllbGQpO1xuXG4gICAgbGV0IGFycmF5Q29udHJvbDtcbiAgICBpZiAoIWNvbmZpZy5maWVsZElzUmVhZE9ubHkoZmllbGQpKSB7XG4gICAgICBhcnJheUNvbnRyb2wgPSBjb25maWcuY3JlYXRlRWxlbWVudCgnYXJyYXktY29udHJvbCcsIHtmaWVsZDogZmllbGQsIG9uQXBwZW5kOiB0aGlzLm9uQXBwZW5kfSk7XG4gICAgfVxuXG4gICAgdmFyIG51bUl0ZW1zID0gZmllbGQudmFsdWUubGVuZ3RoO1xuICAgIHJldHVybiBjb25maWcuY3JlYXRlRWxlbWVudCgnZmllbGQnLCB7XG4gICAgICBmaWVsZDogZmllbGQsIHBsYWluOiB0aGlzLnByb3BzLnBsYWluXG4gICAgfSxcbiAgICAgIFIuZGl2KHtjbGFzc05hbWU6IGN4KHRoaXMucHJvcHMuY2xhc3Nlcyl9LFxuICAgICAgICAvLyBjc3MgdHJhbnNpdGlvbnMga25vdyB0byBjYXVzZSBldmVudCBwcm9ibGVtc1xuICAgICAgICBjb25maWcuY3NzVHJhbnNpdGlvbldyYXBwZXIoXG4gICAgICAgICAgZmllbGRzLm1hcChmdW5jdGlvbiAoY2hpbGRGaWVsZCwgaSkge1xuICAgICAgICAgICAgcmV0dXJuIGNvbmZpZy5jcmVhdGVFbGVtZW50KCdhcnJheS1pdGVtJywge1xuICAgICAgICAgICAgICBrZXk6IHRoaXMuc3RhdGUubG9va3Vwc1tpXSxcbiAgICAgICAgICAgICAgZmllbGQ6IGNoaWxkRmllbGQsXG4gICAgICAgICAgICAgIGluZGV4OiBpLFxuICAgICAgICAgICAgICBudW1JdGVtczogbnVtSXRlbXMsXG4gICAgICAgICAgICAgIG9uTW92ZTogdGhpcy5vbk1vdmUsXG4gICAgICAgICAgICAgIG9uUmVtb3ZlOiB0aGlzLm9uUmVtb3ZlLFxuICAgICAgICAgICAgICBvbkNoYW5nZTogdGhpcy5vbkNoYW5nZSxcbiAgICAgICAgICAgICAgb25BY3Rpb246IHRoaXMub25CdWJibGVBY3Rpb25cbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH0uYmluZCh0aGlzKSlcbiAgICAgICAgKSxcbiAgICAgICAgYXJyYXlDb250cm9sXG4gICAgICApXG4gICAgKTtcbiAgfVxufSk7XG4iLCIvLyAjIGJvb2xlYW4gY29tcG9uZW50XG5cbi8qXG5SZW5kZXIgYSBkcm9wZG93biB0byBoYW5kbGUgeWVzL25vIGJvb2xlYW4gdmFsdWVzLlxuKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgUmVhY3QgPSByZXF1aXJlKCdyZWFjdC9hZGRvbnMnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG5cbiAgZGlzcGxheU5hbWU6ICdCb29sZWFuJyxcblxuICBtaXhpbnM6IFtyZXF1aXJlKCcuLi8uLi9taXhpbnMvZmllbGQnKV0sXG5cbiAgb25DaGFuZ2U6IGZ1bmN0aW9uIChuZXdWYWx1ZSkge1xuICAgIHRoaXMub25DaGFuZ2VWYWx1ZShuZXdWYWx1ZSk7XG4gIH0sXG5cbiAgcmVuZGVyOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMucmVuZGVyV2l0aENvbmZpZygpO1xuICB9LFxuXG4gIHJlbmRlckRlZmF1bHQ6IGZ1bmN0aW9uICgpIHtcblxuICAgIHZhciBjb25maWcgPSB0aGlzLnByb3BzLmNvbmZpZztcbiAgICB2YXIgZmllbGQgPSB0aGlzLnByb3BzLmZpZWxkO1xuXG4gICAgdmFyIGNob2ljZXMgPSBjb25maWcuZmllbGRCb29sZWFuQ2hvaWNlcyhmaWVsZCk7XG5cbiAgICByZXR1cm4gY29uZmlnLmNyZWF0ZUVsZW1lbnQoJ2ZpZWxkJywge1xuICAgICAgZmllbGQ6IGZpZWxkLCBwbGFpbjogdGhpcy5wcm9wcy5wbGFpblxuICAgIH0sIGNvbmZpZy5jcmVhdGVFbGVtZW50KCdzZWxlY3QtdmFsdWUnLCB7XG4gICAgICBjaG9pY2VzOiBjaG9pY2VzLCBmaWVsZDogZmllbGQsIG9uQ2hhbmdlOiB0aGlzLm9uQ2hhbmdlLCBvbkFjdGlvbjogdGhpcy5vbkJ1YmJsZUFjdGlvblxuICAgIH0pKTtcbiAgfVxufSk7XG4iLCIvLyAjIGNoZWNrYm94LWFycmF5IGNvbXBvbmVudFxuXG4vKlxuVXNlZCB3aXRoIGFycmF5IHZhbHVlcyB0byBzdXBwbHkgbXVsdGlwbGUgY2hlY2tib3hlcyBmb3IgYWRkaW5nIG11bHRpcGxlXG5lbnVtZXJhdGVkIHZhbHVlcyB0byBhbiBhcnJheS5cbiovXG5cbid1c2Ugc3RyaWN0JztcblxudmFyIFJlYWN0ID0gcmVxdWlyZSgncmVhY3QnKTtcbnZhciBSID0gUmVhY3QuRE9NO1xudmFyIF8gPSByZXF1aXJlKCcuLi8uLi91bmRhc2gnKTtcbnZhciBjeCA9IHJlcXVpcmUoJ2NsYXNzbmFtZXMnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG5cbiAgZGlzcGxheU5hbWU6ICdDaGVja2JveEFycmF5JyxcblxuICBtaXhpbnM6IFtyZXF1aXJlKCcuLi8uLi9taXhpbnMvZmllbGQnKV0sXG5cbiAgZ2V0SW5pdGlhbFN0YXRlOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGNob2ljZXM6IHRoaXMucHJvcHMuY29uZmlnLmZpZWxkQ2hvaWNlcyh0aGlzLnByb3BzLmZpZWxkKVxuICAgIH07XG4gIH0sXG5cbiAgY29tcG9uZW50V2lsbFJlY2VpdmVQcm9wczogZnVuY3Rpb24gKG5ld1Byb3BzKSB7XG4gICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICBjaG9pY2VzOiBuZXdQcm9wcy5jb25maWcuZmllbGRDaG9pY2VzKG5ld1Byb3BzLmZpZWxkKVxuICAgIH0pO1xuICB9LFxuXG4gIG9uQ2hhbmdlOiBmdW5jdGlvbiAoKSB7XG4gICAgLy8gR2V0IGFsbCB0aGUgY2hlY2tlZCBjaGVja2JveGVzIGFuZCBjb252ZXJ0IHRvIGFuIGFycmF5IG9mIHZhbHVlcy5cbiAgICB2YXIgY2hvaWNlTm9kZXMgPSB0aGlzLnJlZnMuY2hvaWNlcy5nZXRET01Ob2RlKCkuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2lucHV0Jyk7XG4gICAgY2hvaWNlTm9kZXMgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChjaG9pY2VOb2RlcywgMCk7XG4gICAgdmFyIHZhbHVlcyA9IGNob2ljZU5vZGVzLm1hcChmdW5jdGlvbiAobm9kZSkge1xuICAgICAgcmV0dXJuIG5vZGUuY2hlY2tlZCA/IG5vZGUudmFsdWUgOiBudWxsO1xuICAgIH0pLmZpbHRlcihmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgIHJldHVybiB2YWx1ZTtcbiAgICB9KTtcbiAgICB0aGlzLm9uQ2hhbmdlVmFsdWUodmFsdWVzKTtcbiAgfSxcblxuICByZW5kZXI6IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpcy5yZW5kZXJXaXRoQ29uZmlnKCk7XG4gIH0sXG5cbiAgcmVuZGVyRGVmYXVsdDogZnVuY3Rpb24gKCkge1xuXG4gICAgdmFyIGNvbmZpZyA9IHRoaXMucHJvcHMuY29uZmlnO1xuICAgIHZhciBmaWVsZCA9IHRoaXMucHJvcHMuZmllbGQ7XG5cbiAgICB2YXIgY2hvaWNlcyA9IHRoaXMuc3RhdGUuY2hvaWNlcyB8fCBbXTtcblxuICAgIHZhciBpc0lubGluZSA9ICFfLmZpbmQoY2hvaWNlcywgZnVuY3Rpb24gKGNob2ljZSkge1xuICAgICAgcmV0dXJuIGNob2ljZS5zYW1wbGU7XG4gICAgfSk7XG5cbiAgICByZXR1cm4gY29uZmlnLmNyZWF0ZUVsZW1lbnQoJ2ZpZWxkJywge1xuICAgICAgZmllbGQ6IGZpZWxkXG4gICAgfSxcbiAgICAgIFIuZGl2KHtjbGFzc05hbWU6IGN4KHRoaXMucHJvcHMuY2xhc3NlcyksIHJlZjogJ2Nob2ljZXMnfSxcbiAgICAgICAgY2hvaWNlcy5tYXAoZnVuY3Rpb24gKGNob2ljZSwgaSkge1xuXG4gICAgICAgICAgdmFyIGlucHV0RmllbGQgPSBSLnNwYW4oe3N0eWxlOiB7d2hpdGVTcGFjZTogJ25vd3JhcCd9fSxcbiAgICAgICAgICAgIFIuaW5wdXQoe1xuICAgICAgICAgICAgICBuYW1lOiBmaWVsZC5rZXksXG4gICAgICAgICAgICAgIHR5cGU6ICdjaGVja2JveCcsXG4gICAgICAgICAgICAgIHZhbHVlOiBjaG9pY2UudmFsdWUsXG4gICAgICAgICAgICAgIGNoZWNrZWQ6IGZpZWxkLnZhbHVlLmluZGV4T2YoY2hvaWNlLnZhbHVlKSA+PSAwID8gdHJ1ZSA6IGZhbHNlLFxuICAgICAgICAgICAgICBvbkNoYW5nZTogdGhpcy5vbkNoYW5nZSxcbiAgICAgICAgICAgICAgb25Gb2N1czogdGhpcy5vbkZvY3VzQWN0aW9uLFxuICAgICAgICAgICAgICBvbkJsdXI6IHRoaXMub25CbHVyQWN0aW9uLFxuICAgICAgICAgICAgICBkaXNhYmxlZDogdGhpcy5pc1JlYWRPbmx5KClcbiAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgJyAnLFxuICAgICAgICAgICAgUi5zcGFuKHtjbGFzc05hbWU6ICdmaWVsZC1jaG9pY2UtbGFiZWwnfSxcbiAgICAgICAgICAgICAgY2hvaWNlLmxhYmVsXG4gICAgICAgICAgICApXG4gICAgICAgICAgKTtcblxuICAgICAgICAgIGlmIChpc0lubGluZSkge1xuICAgICAgICAgICAgcmV0dXJuIFIuc3Bhbih7a2V5OiBpLCBjbGFzc05hbWU6ICdmaWVsZC1jaG9pY2UnfSxcbiAgICAgICAgICAgICAgaW5wdXRGaWVsZCwgJyAnXG4gICAgICAgICAgICApO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gUi5kaXYoe2tleTogaSwgY2xhc3NOYW1lOiAnZmllbGQtY2hvaWNlJ30sXG4gICAgICAgICAgICAgIGlucHV0RmllbGQsICcgJyxcbiAgICAgICAgICAgICAgY29uZmlnLmNyZWF0ZUVsZW1lbnQoJ3NhbXBsZScsIHtmaWVsZDogZmllbGQsIGNob2ljZTogY2hvaWNlfSlcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgfVxuICAgICAgICB9LmJpbmQodGhpcykpXG4gICAgICApXG4gICAgKTtcbiAgfVxufSk7XG4iLCIvLyAjIGNoZWNrYm94LWJvb2xlYW4gY29tcG9uZW50XG5cbi8qXG5SZW5kZXIgYSBmaWVsZCB0aGF0IGNhbiBlZGl0IGEgYm9vbGVhbiB3aXRoIGEgY2hlY2tib3guXG4qL1xuXG4ndXNlIHN0cmljdCc7XG5cbnZhciBSZWFjdCA9IHJlcXVpcmUoJ3JlYWN0L2FkZG9ucycpO1xudmFyIFIgPSBSZWFjdC5ET007XG52YXIgY3ggPSByZXF1aXJlKCdjbGFzc25hbWVzJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXG4gIGRpc3BsYXlOYW1lOiAnQ2hlY2tib3hCb29sZWFuJyxcblxuICBtaXhpbnM6IFtyZXF1aXJlKCcuLi8uLi9taXhpbnMvZmllbGQnKV0sXG5cbiAgb25DaGFuZ2U6IGZ1bmN0aW9uIChldmVudCkge1xuICAgIHRoaXMub25DaGFuZ2VWYWx1ZShldmVudC50YXJnZXQuY2hlY2tlZCk7XG4gIH0sXG5cbiAgcmVuZGVyOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMucmVuZGVyV2l0aENvbmZpZygpO1xuICB9LFxuXG4gIHJlbmRlckRlZmF1bHQ6IGZ1bmN0aW9uICgpIHtcblxuICAgIHZhciBjb25maWcgPSB0aGlzLnByb3BzLmNvbmZpZztcbiAgICB2YXIgZmllbGQgPSB0aGlzLnByb3BzLmZpZWxkO1xuXG4gICAgcmV0dXJuIGNvbmZpZy5jcmVhdGVFbGVtZW50KCdmaWVsZCcsIHtcbiAgICAgIGNvbmZpZzogY29uZmlnLCBmaWVsZDogZmllbGQsIHBsYWluOiB0cnVlXG4gICAgfSxcbiAgICBSLnNwYW4oe3N0eWxlOiB7d2hpdGVTcGFjZTogJ25vd3JhcCd9fSxcbiAgICAgIFIuaW5wdXQoe1xuICAgICAgICB0eXBlOiAnY2hlY2tib3gnLFxuICAgICAgICBjaGVja2VkOiBmaWVsZC52YWx1ZSxcbiAgICAgICAgY2xhc3NOYW1lOiBjeCh0aGlzLnByb3BzLmNsYXNzZXMpLFxuICAgICAgICBvbkNoYW5nZTogdGhpcy5vbkNoYW5nZSxcbiAgICAgICAgb25Gb2N1czogdGhpcy5vbkZvY3VzQWN0aW9uLFxuICAgICAgICBvbkJsdXI6IHRoaXMub25CbHVyQWN0aW9uLFxuICAgICAgICBkaXNhYmxlZDogdGhpcy5pc1JlYWRPbmx5KClcbiAgICAgIH0pLFxuICAgICAgUi5zcGFuKHt9LCAnICcpLFxuICAgICAgUi5zcGFuKHt9LCBjb25maWcuZmllbGRIZWxwVGV4dChmaWVsZCkgfHwgY29uZmlnLmZpZWxkTGFiZWwoZmllbGQpKVxuICAgICkpO1xuICB9XG59KTtcbiIsIid1c2Ugc3RyaWN0Jztcbi8qIGdsb2JhbCBDb2RlTWlycm9yICovXG4vKmVzbGludCBuby1zY3JpcHQtdXJsOjAgKi9cblxudmFyIFJlYWN0ID0gcmVxdWlyZSgncmVhY3QvYWRkb25zJyk7XG52YXIgXyA9IHJlcXVpcmUoJy4uLy4uL3VuZGFzaCcpO1xudmFyIGN4ID0gcmVxdWlyZSgnY2xhc3NuYW1lcycpO1xuXG4vKlxuICBBIHZlcnkgdHJpbW1lZCBkb3duIGZpZWxkIHRoYXQgdXNlcyBDb2RlTWlycm9yIGZvciBzeW50YXggaGlnaGxpZ2h0aW5nICpvbmx5Ki5cbiAqL1xubW9kdWxlLmV4cG9ydHMgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG4gIGRpc3BsYXlOYW1lOiAnQ29kZScsXG5cbiAgbWl4aW5zOiBbcmVxdWlyZSgnLi4vLi4vbWl4aW5zL2ZpZWxkJyldLFxuXG4gIGNvbXBvbmVudERpZE1vdW50OiBmdW5jdGlvbigpIHtcbiAgICB0aGlzLmNyZWF0ZUNvZGVNaXJyb3JFZGl0b3IoKTtcbiAgfSxcblxuICBjb21wb25lbnRXaWxsVW5tb3VudDogZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5yZW1vdmVDb2RlTWlycm9yRWRpdG9yKCk7XG4gIH0sXG5cbiAgZ2V0SW5pdGlhbFN0YXRlOiBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4ge1xuICAgICAgdmFsdWU6IHRoaXMucHJvcHMuZmllbGQudmFsdWVcbiAgICB9O1xuICB9LFxuXG4gIGNvbXBvbmVudFdpbGxSZWNlaXZlUHJvcHM6IGZ1bmN0aW9uKG5leHRQcm9wcykge1xuICAgIHRoaXMuc2V0U3RhdGUoe3ZhbHVlOiBuZXh0UHJvcHMuZmllbGQudmFsdWV9KTtcbiAgfSxcblxuICB0YWJJbmRleDogZnVuY3Rpb24gKCkge1xuICAgIGlmICh0aGlzLmlzUmVhZE9ubHkoKSkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLnByb3BzLmZpZWxkLnRhYkluZGV4O1xuICB9LFxuXG4gIHJlbmRlcjogZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHRoaXMucmVuZGVyV2l0aENvbmZpZygpO1xuICB9LFxuXG4gIHJlbmRlckRlZmF1bHQ6IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgY29uZmlnID0gdGhpcy5wcm9wcy5jb25maWc7XG4gICAgdmFyIGZpZWxkID0gdGhpcy5wcm9wcy5maWVsZDtcbiAgICB2YXIgcHJvcHMgPSB7IGZpZWxkOiBmaWVsZCwgcGxhaW46IHRoaXMucHJvcHMucGxhaW4gfTtcblxuICAgIHZhciB0ZXh0Qm94Q2xhc3NlcyA9IGN4KF8uZXh0ZW5kKHt9LCB0aGlzLnByb3BzLmNsYXNzZXMsIHsncHJldHR5LXRleHQtYm94JzogdHJ1ZX0pKTtcblxuICAgIC8vIFJlbmRlciByZWFkLW9ubHkgdmVyc2lvbi5cbiAgICB2YXIgZWxlbWVudCA9IChcbiAgICAgIDxkaXYgY2xhc3NOYW1lPSdwcmV0dHktdGV4dC13cmFwcGVyJz5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9e3RleHRCb3hDbGFzc2VzfSB0YWJJbmRleD17dGhpcy50YWJJbmRleCgpfSBvbkZvY3VzPXt0aGlzLm9uRm9jdXNBY3Rpb259IG9uQmx1cj17dGhpcy5vbkJsdXJBY3Rpb259PlxuICAgICAgICAgIDxkaXYgcmVmPSd0ZXh0Qm94JyBjbGFzc05hbWU9J2ludGVybmFsLXRleHQtd3JhcHBlcicgLz5cbiAgICAgICAgPC9kaXY+XG4gICAgICA8L2Rpdj5cbiAgICApO1xuXG4gICAgcmV0dXJuIGNvbmZpZy5jcmVhdGVFbGVtZW50KCdmaWVsZCcsIHByb3BzLCBlbGVtZW50KTtcbiAgfSxcblxuICBjcmVhdGVDb2RlTWlycm9yRWRpdG9yOiBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGNvbmZpZyA9IHRoaXMucHJvcHMuY29uZmlnO1xuICAgIHZhciBmaWVsZCA9IHRoaXMucHJvcHMuZmllbGQ7XG4gICAgdmFyIHJlYWRPbmx5ID0gY29uZmlnLmZpZWxkSXNSZWFkT25seShmaWVsZCk7XG5cbiAgICB2YXIgb3B0aW9ucyA9IHtcbiAgICAgIGxpbmVXcmFwcGluZzogdHJ1ZSxcbiAgICAgIHRhYmluZGV4OiB0aGlzLnRhYkluZGV4KCksXG4gICAgICB2YWx1ZTogU3RyaW5nKHRoaXMuc3RhdGUudmFsdWUpLFxuICAgICAgbW9kZTogdGhpcy5wcm9wcy5maWVsZC5sYW5ndWFnZSB8fCBudWxsLFxuICAgICAgcmVhZE9ubHk6IHJlYWRPbmx5ID8gJ25vY3Vyc29yJyA6IGZhbHNlIC8vICdub2N1cnNvcicgbWVhbnMgcmVhZCBvbmx5IGFuZCBub3QgZm9jdXNhYmxlXG4gICAgfTtcblxuICAgIGlmICh0aGlzLnByb3BzLmZpZWxkLmNvZGVNaXJyb3JPcHRpb25zKSB7XG4gICAgICBvcHRpb25zID0gXy5leHRlbmQoe30sIG9wdGlvbnMsIHRoaXMucHJvcHMuZmllbGQuY29kZU1pcnJvck9wdGlvbnMpO1xuICAgIH1cblxuICAgIHZhciB0ZXh0Qm94ID0gdGhpcy5yZWZzLnRleHRCb3guZ2V0RE9NTm9kZSgpO1xuICAgIHRoaXMuY29kZU1pcnJvciA9IENvZGVNaXJyb3IodGV4dEJveCwgb3B0aW9ucyk7XG4gICAgdGhpcy5jb2RlTWlycm9yLm9uKCdjaGFuZ2UnLCB0aGlzLm9uQ29kZU1pcnJvckNoYW5nZSk7XG4gIH0sXG5cbiAgcmVtb3ZlQ29kZU1pcnJvckVkaXRvcjogZnVuY3Rpb24gKCkge1xuICAgIHZhciB0ZXh0Qm94Tm9kZSA9IHRoaXMucmVmcy50ZXh0Qm94LmdldERPTU5vZGUoKTtcbiAgICB2YXIgY21Ob2RlID0gdGV4dEJveE5vZGUuZmlyc3RDaGlsZDtcbiAgICB0ZXh0Qm94Tm9kZS5yZW1vdmVDaGlsZChjbU5vZGUpO1xuICAgIHRoaXMuY29kZU1pcnJvciA9IG51bGw7XG4gIH0sXG5cbiAgb25Db2RlTWlycm9yQ2hhbmdlOiBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKHRoaXMudXBkYXRpbmdDb2RlTWlycm9yKSB7XG4gICAgICAvLyBhdm9pZCByZWN1cnNpdmUgdXBkYXRlIGN5Y2xlLCBhbmQgbWFyayB0aGUgY29kZSBtaXJyb3IgbWFudWFsIHVwZGF0ZSBhcyBkb25lXG4gICAgICB0aGlzLnVwZGF0aW5nQ29kZU1pcnJvciA9IGZhbHNlO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHZhciBuZXdWYWx1ZSA9IHRoaXMuY29kZU1pcnJvci5nZXRWYWx1ZSgpO1xuICAgIHRoaXMub25DaGFuZ2VWYWx1ZShuZXdWYWx1ZSk7XG4gICAgdGhpcy5zZXRTdGF0ZSh7dmFsdWU6IG5ld1ZhbHVlfSk7XG4gIH1cblxufSk7XG4iLCIvLyAjIGNvcHkgY29tcG9uZW50XG5cbi8qXG5SZW5kZXIgbm9uLWVkaXRhYmxlIGh0bWwvdGV4dCAodGhpbmsgYXJ0aWNsZSBjb3B5KS5cbiovXG5cbid1c2Ugc3RyaWN0JztcblxudmFyIFJlYWN0ID0gcmVxdWlyZSgncmVhY3QvYWRkb25zJyk7XG52YXIgUiA9IFJlYWN0LkRPTTtcbnZhciBjeCA9IHJlcXVpcmUoJ2NsYXNzbmFtZXMnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG5cbiAgZGlzcGxheU5hbWU6ICdDb3B5JyxcblxuICBtaXhpbnM6IFtyZXF1aXJlKCcuLi8uLi9taXhpbnMvZmllbGQnKV0sXG5cbiAgcmVuZGVyOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMucmVuZGVyV2l0aENvbmZpZygpO1xuICB9LFxuXG4gIHJlbmRlckRlZmF1bHQ6IGZ1bmN0aW9uICgpIHtcblxuICAgIHJldHVybiBSLmRpdih7Y2xhc3NOYW1lOiBjeCh0aGlzLnByb3BzLmNsYXNzZXMpLCBkYW5nZXJvdXNseVNldElubmVySFRNTDoge1xuICAgICAgX19odG1sOiB0aGlzLnByb3BzLmNvbmZpZy5maWVsZEhlbHBUZXh0KHRoaXMucHJvcHMuZmllbGQpXG4gICAgfX0pO1xuICB9XG59KTtcbiIsIi8vICMgZmllbGRzIGNvbXBvbmVudFxuXG4vKlxuUmVuZGVyIGEgZmllbGQgdG8gZWRpdCB0aGUgdmFsdWVzIG9mIGFuIG9iamVjdCB3aXRoIHN0YXRpYyBwcm9wZXJ0aWVzLlxuKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgUmVhY3QgPSByZXF1aXJlKCdyZWFjdC9hZGRvbnMnKTtcbnZhciBSID0gUmVhY3QuRE9NO1xudmFyIF8gPSByZXF1aXJlKCcuLi8uLi91bmRhc2gnKTtcbnZhciBjeCA9IHJlcXVpcmUoJ2NsYXNzbmFtZXMnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG5cbiAgZGlzcGxheU5hbWU6ICdGaWVsZHMnLFxuXG4gIG1peGluczogW3JlcXVpcmUoJy4uLy4uL21peGlucy9maWVsZCcpXSxcblxuICBvbkNoYW5nZUZpZWxkOiBmdW5jdGlvbiAoa2V5LCBuZXdWYWx1ZSwgaW5mbykge1xuICAgIGlmICgha2V5KSB7XG4gICAgICBjb25zdCBwYXJlbnRQYXRoID0gdGhpcy5wcm9wcy5jb25maWcuZmllbGRWYWx1ZVBhdGgodGhpcy5wcm9wcy5maWVsZCk7XG4gICAgICBjb25zdCBjaGlsZFBhdGggPSB0aGlzLnByb3BzLmNvbmZpZy5maWVsZFZhbHVlUGF0aChpbmZvLmZpZWxkKS5zbGljZShwYXJlbnRQYXRoLmxlbmd0aCk7XG4gICAgICBrZXkgPSBjaGlsZFBhdGhbMF07XG4gICAgICBpZiAoa2V5KSB7XG4gICAgICAgIG5ld1ZhbHVlID0gbmV3VmFsdWVba2V5XTtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKGtleSkge1xuICAgICAgdmFyIG5ld09iamVjdFZhbHVlID0gXy5leHRlbmQoe30sIHRoaXMucHJvcHMuZmllbGQudmFsdWUpO1xuICAgICAgbmV3T2JqZWN0VmFsdWVba2V5XSA9IG5ld1ZhbHVlO1xuICAgICAgdGhpcy5vbkJ1YmJsZVZhbHVlKG5ld09iamVjdFZhbHVlLCBpbmZvKTtcbiAgICB9XG4gIH0sXG5cbiAgcmVuZGVyOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMucmVuZGVyV2l0aENvbmZpZygpO1xuICB9LFxuXG4gIHJlbmRlckRlZmF1bHQ6IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgY29uZmlnID0gdGhpcy5wcm9wcy5jb25maWc7XG4gICAgdmFyIGZpZWxkID0gdGhpcy5wcm9wcy5maWVsZDtcblxuICAgIHZhciBmaWVsZHMgPSBjb25maWcuY3JlYXRlQ2hpbGRGaWVsZHMoZmllbGQpO1xuXG4gICAgLy8gV2FudCB0byBtb3ZlIHRvIGZpZWxkc2V0IHdpdGggbGVnZW5kLCBidXQgZG9pbmcgYSBsaXR0bGUgYmFja3dhcmQtY29tcGF0aWJsZVxuICAgIC8vIGhhY2tpbmcgaGVyZSwgb25seSBjb252ZXJ0aW5nIGNoaWxkIGBmaWVsZHNgIHdpdGhvdXQga2V5cy5cbiAgICB2YXIgaXNHcm91cCA9ICEhKGZpZWxkLnBhcmVudCAmJiAhZmllbGQua2V5KTtcblxuICAgIHZhciBjbGFzc2VzID0gXy5leHRlbmQoe30sIHRoaXMucHJvcHMuY2xhc3Nlcyk7XG5cbiAgICBpZiAoaXNHcm91cCkge1xuICAgICAgY2xhc3Nlc1snY2hpbGQtZmllbGRzLWdyb3VwJ10gPSB0cnVlO1xuICAgIH1cblxuICAgIHJldHVybiBjb25maWcuY3JlYXRlRWxlbWVudCgnZmllbGQnLCB7XG4gICAgICBjb25maWc6IGNvbmZpZywgZmllbGQ6IGZpZWxkLCBwbGFpbjogaXNHcm91cCB8fCB0aGlzLnByb3BzLnBsYWluXG4gICAgfSxcbiAgICAgIFIuZmllbGRzZXQoe2NsYXNzTmFtZTogY3goY2xhc3Nlcyl9LFxuICAgICAgICBpc0dyb3VwID8gPGxlZ2VuZD57Y29uZmlnLmZpZWxkTGFiZWwoZmllbGQpfTwvbGVnZW5kPiA6IG51bGwsXG4gICAgICAgIGZpZWxkcy5tYXAoZnVuY3Rpb24gKGNoaWxkRmllbGQsIGkpIHtcbiAgICAgICAgICB2YXIga2V5ID0gY2hpbGRGaWVsZC5rZXkgfHwgaTtcbiAgICAgICAgICByZXR1cm4gY29uZmlnLmNyZWF0ZUZpZWxkRWxlbWVudCh7XG4gICAgICAgICAgICBrZXk6IGtleSB8fCBpLFxuICAgICAgICAgICAgZmllbGQ6IGNoaWxkRmllbGQsXG4gICAgICAgICAgICBvbkNoYW5nZTogdGhpcy5vbkNoYW5nZUZpZWxkLmJpbmQodGhpcywgY2hpbGRGaWVsZC5rZXkpLCBvbkFjdGlvbjogdGhpcy5vbkJ1YmJsZUFjdGlvblxuICAgICAgICAgIH0pO1xuICAgICAgICB9LmJpbmQodGhpcykpXG4gICAgICApXG4gICAgKTtcbiAgfVxuXG59KTtcbiIsIi8vICMgZmllbGRzIGNvbXBvbmVudFxuXG4vKlxuUmVuZGVyIGEgZmllbGRzIGluIGdyb3Vwcy4gR3JvdXBlZCBieSBmaWVsZC5ncm91cEtleSBwcm9wZXJ0eS5cbiovXG5cbid1c2Ugc3RyaWN0JztcblxudmFyIFJlYWN0ID0gcmVxdWlyZSgncmVhY3QvYWRkb25zJyk7XG52YXIgXyA9IHJlcXVpcmUoJy4uLy4uL3VuZGFzaCcpO1xudmFyIGN4ID0gcmVxdWlyZSgnY2xhc3NuYW1lcycpO1xuXG52YXIgZ3JvdXBGaWVsZHMgPSBmdW5jdGlvbiAoZmllbGRzLCBodW1hbml6ZSkge1xuICB2YXIgZ3JvdXBlZEZpZWxkcyA9IFtdO1xuXG4gIGZpZWxkcy5mb3JFYWNoKGZ1bmN0aW9uIChmaWVsZCkge1xuICAgIGlmIChmaWVsZC5ncm91cEtleSkge1xuICAgICAgdmFyIGdyb3VwID0gXy5maW5kKGdyb3VwZWRGaWVsZHMsIGZ1bmN0aW9uIChnKSB7XG4gICAgICAgIHJldHVybiBnLmlzR3JvdXAgJiYgZmllbGQuZ3JvdXBLZXkgPT09IGcua2V5O1xuICAgICAgfSk7XG5cbiAgICAgIGlmICghZ3JvdXApIHtcbiAgICAgICAgZ3JvdXAgPSB7XG4gICAgICAgICAga2V5OiBmaWVsZC5ncm91cEtleSxcbiAgICAgICAgICBsYWJlbDogZmllbGQuZ3JvdXBMYWJlbCB8fCBodW1hbml6ZShmaWVsZC5ncm91cEtleSksXG4gICAgICAgICAgY2hpbGRyZW46IFtdLFxuICAgICAgICAgIGlzR3JvdXA6IHRydWVcbiAgICAgICAgfTtcbiAgICAgICAgZ3JvdXBlZEZpZWxkcy5wdXNoKGdyb3VwKTtcbiAgICAgIH1cblxuICAgICAgZ3JvdXAuY2hpbGRyZW4ucHVzaChmaWVsZCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGdyb3VwZWRGaWVsZHMucHVzaChmaWVsZCk7IC8vIHRvcCBsZXZlbCBmaWVsZFxuICAgIH1cbiAgfSk7XG5cbiAgcmV0dXJuIGdyb3VwZWRGaWVsZHM7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcblxuICBkaXNwbGF5TmFtZTogJ0dyb3VwZWRGaWVsZHMnLFxuXG4gIG1peGluczogW3JlcXVpcmUoJy4uLy4uL21peGlucy9maWVsZCcpXSxcblxuICBvbkNoYW5nZUZpZWxkOiBmdW5jdGlvbiAoa2V5LCBuZXdWYWx1ZSwgaW5mbykge1xuICAgIGlmIChrZXkpIHtcbiAgICAgIHZhciBuZXdPYmplY3RWYWx1ZSA9IF8uZXh0ZW5kKHt9LCB0aGlzLnByb3BzLmZpZWxkLnZhbHVlKTtcbiAgICAgIG5ld09iamVjdFZhbHVlW2tleV0gPSBuZXdWYWx1ZTtcbiAgICAgIHRoaXMub25CdWJibGVWYWx1ZShuZXdPYmplY3RWYWx1ZSwgaW5mbyk7XG4gICAgfVxuICB9LFxuXG4gIHJlbmRlckZpZWxkczogZnVuY3Rpb24gKGZpZWxkcywgZ3JvdXBLZXksIGdyb3VwTGFiZWwpIHtcbiAgICB2YXIgY29uZmlnID0gdGhpcy5wcm9wcy5jb25maWc7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgdmFyIGNoaWxkRmllbGRzID0gZmllbGRzLm1hcChmdW5jdGlvbiAoZmllbGRPckdyb3VwKSB7XG4gICAgICBpZiAoZmllbGRPckdyb3VwLmlzR3JvdXApIHtcbiAgICAgICAgcmV0dXJuIHNlbGYucmVuZGVyRmllbGRzKGZpZWxkT3JHcm91cC5jaGlsZHJlbiwgZmllbGRPckdyb3VwLmtleSwgZmllbGRPckdyb3VwLmxhYmVsKTtcbiAgICAgIH1cblxuICAgICAgdmFyIGtleSA9IGZpZWxkT3JHcm91cC5rZXk7XG4gICAgICByZXR1cm4gY29uZmlnLmNyZWF0ZUZpZWxkRWxlbWVudCh7XG4gICAgICAgIGtleToga2V5LFxuICAgICAgICBmaWVsZDogZmllbGRPckdyb3VwLFxuICAgICAgICBvbkNoYW5nZTogc2VsZi5vbkNoYW5nZUZpZWxkLmJpbmQoc2VsZiwga2V5KSxcbiAgICAgICAgb25BY3Rpb246IHNlbGYub25CdWJibGVBY3Rpb25cbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgdmFyIGxlZ2VuZDtcbiAgICB2YXIgY2xhc3NOYW1lID0gY3godGhpcy5wcm9wcy5jbGFzc2VzKTtcblxuICAgIGlmIChncm91cExhYmVsKSB7XG4gICAgICBsZWdlbmQgPSA8bGVnZW5kPntncm91cExhYmVsfTwvbGVnZW5kPjtcbiAgICAgIGNsYXNzTmFtZSArPSAnIGNoaWxkLWZpZWxkcy1ncm91cCc7XG4gICAgfVxuXG4gICAgcmV0dXJuIChcbiAgICAgIDxmaWVsZHNldCBrZXk9e2dyb3VwS2V5fSBjbGFzc05hbWU9e2NsYXNzTmFtZX0+XG4gICAgICAgIHtsZWdlbmR9XG4gICAgICAgIHtjaGlsZEZpZWxkc31cbiAgICAgIDwvZmllbGRzZXQ+XG4gICAgKTtcbiAgfSxcblxuICByZW5kZXI6IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpcy5yZW5kZXJXaXRoQ29uZmlnKCk7XG4gIH0sXG5cbiAgcmVuZGVyRGVmYXVsdDogZnVuY3Rpb24gKCkge1xuICAgIHZhciBjb25maWcgPSB0aGlzLnByb3BzLmNvbmZpZztcbiAgICB2YXIgZmllbGQgPSB0aGlzLnByb3BzLmZpZWxkO1xuXG4gICAgdmFyIGZpZWxkcyA9IGdyb3VwRmllbGRzKGNvbmZpZy5jcmVhdGVDaGlsZEZpZWxkcyhmaWVsZCksIGNvbmZpZy5odW1hbml6ZSk7XG5cbiAgICByZXR1cm4gY29uZmlnLmNyZWF0ZUVsZW1lbnQoJ2ZpZWxkJywge1xuICAgICAgY29uZmlnOiBjb25maWcsIGZpZWxkOiBmaWVsZCwgcGxhaW46IHRoaXMucHJvcHMucGxhaW5cbiAgICB9LCB0aGlzLnJlbmRlckZpZWxkcyhmaWVsZHMpKTtcbiAgfVxuXG59KTtcbiIsIi8vICMganNvbiBjb21wb25lbnRcblxuLypcblRleHRhcmVhIGVkaXRvciBmb3IgSlNPTi4gV2lsbCB2YWxpZGF0ZSB0aGUgSlNPTiBiZWZvcmUgc2V0dGluZyB0aGUgdmFsdWUsIHNvXG53aGlsZSB0aGUgdmFsdWUgaXMgaW52YWxpZCwgbm8gZXh0ZXJuYWwgc3RhdGUgY2hhbmdlcyB3aWxsIG9jY3VyLlxuKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgUmVhY3QgPSByZXF1aXJlKCdyZWFjdCcpO1xudmFyIFIgPSBSZWFjdC5ET007XG52YXIgY3ggPSByZXF1aXJlKCdjbGFzc25hbWVzJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXG4gIGRpc3BsYXlOYW1lOiAnSnNvbicsXG5cbiAgbWl4aW5zOiBbcmVxdWlyZSgnLi4vLi4vbWl4aW5zL2ZpZWxkJyldLFxuXG4gIGdldERlZmF1bHRQcm9wczogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB7XG4gICAgICByb3dzOiA1XG4gICAgfTtcbiAgfSxcblxuICBpc1ZhbGlkVmFsdWU6IGZ1bmN0aW9uICh2YWx1ZSkge1xuXG4gICAgdHJ5IHtcbiAgICAgIEpTT04ucGFyc2UodmFsdWUpO1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfSxcblxuICBnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4ge1xuICAgICAgaXNWYWxpZDogdHJ1ZSxcbiAgICAgIHZhbHVlOiBKU09OLnN0cmluZ2lmeSh0aGlzLnByb3BzLmZpZWxkLnZhbHVlLCBudWxsLCAyKVxuICAgIH07XG4gIH0sXG5cbiAgb25DaGFuZ2U6IGZ1bmN0aW9uIChldmVudCkge1xuICAgIHZhciBpc1ZhbGlkID0gdGhpcy5pc1ZhbGlkVmFsdWUoZXZlbnQudGFyZ2V0LnZhbHVlKTtcblxuICAgIGlmIChpc1ZhbGlkKSB7XG4gICAgICAvLyBOZWVkIHRvIGhhbmRsZSB0aGlzIGJldHRlci4gTmVlZCB0byB0cmFjayBwb3NpdGlvbi5cbiAgICAgIHRoaXMuX2lzQ2hhbmdpbmcgPSB0cnVlO1xuICAgICAgdGhpcy5vbkNoYW5nZVZhbHVlKEpTT04ucGFyc2UoZXZlbnQudGFyZ2V0LnZhbHVlKSk7XG4gICAgfVxuXG4gICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICBpc1ZhbGlkOiBpc1ZhbGlkLFxuICAgICAgdmFsdWU6IGV2ZW50LnRhcmdldC52YWx1ZVxuICAgIH0pO1xuICB9LFxuXG4gIGNvbXBvbmVudFdpbGxSZWNlaXZlUHJvcHM6IGZ1bmN0aW9uIChuZXh0UHJvcHMpIHtcbiAgICBpZiAoIXRoaXMuX2lzQ2hhbmdpbmcpIHtcbiAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICBpc1ZhbGlkOiB0cnVlLFxuICAgICAgICB2YWx1ZTogSlNPTi5zdHJpbmdpZnkobmV4dFByb3BzLmZpZWxkLnZhbHVlLCBudWxsLCAyKVxuICAgICAgfSk7XG4gICAgfVxuICAgIHRoaXMuX2lzQ2hhbmdpbmcgPSBmYWxzZTtcbiAgfSxcblxuICByZW5kZXI6IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpcy5yZW5kZXJXaXRoQ29uZmlnKCk7XG4gIH0sXG5cbiAgcmVuZGVyRGVmYXVsdDogZnVuY3Rpb24gKCkge1xuICAgIHZhciBjb25maWcgPSB0aGlzLnByb3BzLmNvbmZpZztcbiAgICB2YXIgZmllbGQgPSB0aGlzLnByb3BzLmZpZWxkO1xuXG4gICAgcmV0dXJuIGNvbmZpZy5jcmVhdGVFbGVtZW50KCdmaWVsZCcsIHtcbiAgICAgIGZpZWxkOiBjb25maWcuZmllbGRXaXRoVmFsdWUoZmllbGQsIHRoaXMuc3RhdGUudmFsdWUpLCBwbGFpbjogdGhpcy5wcm9wcy5wbGFpblxuICAgIH0sIFIudGV4dGFyZWEoe1xuICAgICAgICBjbGFzc05hbWU6IGN4KHRoaXMucHJvcHMuY2xhc3NlcyksXG4gICAgICAgIHZhbHVlOiB0aGlzLnN0YXRlLnZhbHVlLFxuICAgICAgICBvbkNoYW5nZTogdGhpcy5vbkNoYW5nZSxcbiAgICAgICAgc3R5bGU6IHtiYWNrZ3JvdW5kQ29sb3I6IHRoaXMuc3RhdGUuaXNWYWxpZCA/ICcnIDogJ3JnYigyNTUsMjAwLDIwMCknfSxcbiAgICAgICAgcm93czogY29uZmlnLmZpZWxkUm93cyhmaWVsZCkgfHwgdGhpcy5wcm9wcy5yb3dzLFxuICAgICAgICBvbkZvY3VzOiB0aGlzLm9uRm9jdXNBY3Rpb24sXG4gICAgICAgIG9uQmx1cjogdGhpcy5vbkJsdXJBY3Rpb24sXG4gICAgICAgIGRpc2FibGVkOiB0aGlzLmlzUmVhZE9ubHkoKVxuICAgICAgfSlcbiAgICApO1xuICB9XG59KTtcbiIsIi8vICMgb2JqZWN0IGNvbXBvbmVudFxuXG4vKlxuUmVuZGVyIGEgZmllbGQgdG8gZWRpdCBhbiBvYmplY3Qgd2l0aCBkeW5hbWljIGNoaWxkIGZpZWxkcy5cbiovXG5cbid1c2Ugc3RyaWN0JztcblxudmFyIFJlYWN0ID0gcmVxdWlyZSgncmVhY3QvYWRkb25zJyk7XG52YXIgUiA9IFJlYWN0LkRPTTtcbnZhciBfID0gcmVxdWlyZSgnLi4vLi4vdW5kYXNoJyk7XG52YXIgY3ggPSByZXF1aXJlKCdjbGFzc25hbWVzJyk7XG5cbnZhciB0ZW1wS2V5UHJlZml4ID0gJyQkX190ZW1wX18nO1xuXG52YXIgdGVtcEtleSA9IGZ1bmN0aW9uIChpZCkge1xuICByZXR1cm4gdGVtcEtleVByZWZpeCArIGlkO1xufTtcblxudmFyIGlzVGVtcEtleSA9IGZ1bmN0aW9uIChrZXkpIHtcbiAgcmV0dXJuIGtleS5zdWJzdHJpbmcoMCwgdGVtcEtleVByZWZpeC5sZW5ndGgpID09PSB0ZW1wS2V5UHJlZml4O1xufTtcblxuLy8gVE9ETzoga2VlcCBpbnZhbGlkIGtleXMgYXMgc3RhdGUgYW5kIGRvbid0IHNlbmQgaW4gb25DaGFuZ2U7IGNsb25lIGNvbnRleHRcbi8vIGFuZCB1c2UgY2xvbmUgdG8gY3JlYXRlIGNoaWxkIGNvbnRleHRzXG5cbm1vZHVsZS5leHBvcnRzID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXG4gIGRpc3BsYXlOYW1lOiAnT2JqZWN0JyxcblxuICBtaXhpbnM6IFtyZXF1aXJlKCcuLi8uLi9taXhpbnMvZmllbGQnKV0sXG5cbiAgbmV4dExvb2t1cElkOiAwLFxuXG4gIGdldEluaXRpYWxTdGF0ZTogZnVuY3Rpb24gKCkge1xuXG4gICAgdmFyIGtleVRvSWQgPSB7fTtcbiAgICB2YXIga2V5cyA9IE9iamVjdC5rZXlzKHRoaXMucHJvcHMuZmllbGQudmFsdWUpO1xuICAgIHZhciBrZXlPcmRlciA9IFtdO1xuICAgIC8vIFRlbXAga2V5cyBrZWVwcyB0aGUga2V5IHRvIGRpc3BsYXksIHdoaWNoIHNvbWV0aW1lcyBtYXkgYmUgZGlmZmVyZW50XG4gICAgLy8gdGhhbiB0aGUgYWN0dWFsIGtleS4gRm9yIGV4YW1wbGUsIGR1cGxpY2F0ZSBrZXlzIGFyZSBub3QgYWxsb3dlZCxcbiAgICAvLyBidXQgd2UgbWF5IHRlbXBvcmFyaWx5IHNob3cgZHVwbGljYXRlIGtleXMuXG4gICAgdmFyIHRlbXBEaXNwbGF5S2V5cyA9IHt9O1xuXG4gICAgLy8gS2V5cyBkb24ndCBtYWtlIGdvb2QgcmVhY3Qga2V5cywgc2luY2Ugd2UncmUgYWxsb3dpbmcgdGhlbSB0byBiZVxuICAgIC8vIGNoYW5nZWQgaGVyZSwgc28gd2UnbGwgaGF2ZSB0byBjcmVhdGUgZmFrZSBrZXlzIGFuZFxuICAgIC8vIGtlZXAgdHJhY2sgb2YgdGhlIG1hcHBpbmcgb2YgcmVhbCBrZXlzIHRvIGZha2Uga2V5cy4gWXVjay5cbiAgICBrZXlzLmZvckVhY2goZnVuY3Rpb24gKGtleSkge1xuICAgICAgdmFyIGlkID0gKyt0aGlzLm5leHRMb29rdXBJZDtcbiAgICAgIC8vIE1hcCB0aGUgcmVhbCBrZXkgdG8gdGhlIGlkLlxuICAgICAga2V5VG9JZFtrZXldID0gaWQ7XG4gICAgICAvLyBLZWVwIHRoZSBvcmRlcmluZyBvZiB0aGUga2V5cyBzbyB3ZSBkb24ndCBzaHVmZmxlIHRoaW5ncyBhcm91bmQgbGF0ZXIuXG4gICAgICBrZXlPcmRlci5wdXNoKGtleSk7XG4gICAgICAvLyBJZiB0aGlzIGlzIGEgdGVtcG9yYXJ5IGtleSB0aGF0IHdhcyBwZXJzaXN0ZWQsIGJlc3Qgd2UgY2FuIGRvIGlzIGRpc3BsYXlcbiAgICAgIC8vIGEgYmxhbmsuXG4gICAgICAvLyBUT0RPOiBQcm9iYWJseSBqdXN0IG5vdCBzZW5kIHRlbXBvcmFyeSBrZXlzIGJhY2sgdGhyb3VnaC4gVGhpcyBiZWhhdmlvclxuICAgICAgLy8gaXMgYWN0dWFsbHkgbGVmdG92ZXIgZnJvbSBhbiBlYXJsaWVyIGluY2FybmF0aW9uIG9mIGZvcm1hdGljIHdoZXJlXG4gICAgICAvLyB2YWx1ZXMgaGFkIHRvIGdvIGJhY2sgdG8gdGhlIHJvb3QuXG4gICAgICBpZiAoaXNUZW1wS2V5KGtleSkpIHtcbiAgICAgICAgdGVtcERpc3BsYXlLZXlzW2lkXSA9ICcnO1xuICAgICAgfVxuICAgIH0uYmluZCh0aGlzKSk7XG5cbiAgICByZXR1cm4ge1xuICAgICAga2V5VG9JZDoga2V5VG9JZCxcbiAgICAgIGtleU9yZGVyOiBrZXlPcmRlcixcbiAgICAgIC8vIFRlbXAga2V5cyBrZWVwcyB0aGUga2V5IHRvIGRpc3BsYXksIHdoaWNoIHNvbWV0aW1lcyBtYXkgYmUgZGlmZmVyZW50XG4gICAgICAvLyB0aGFuIHRoZSBhY3R1YWwga2V5LiBGb3IgZXhhbXBsZSwgZHVwbGljYXRlIGtleXMgYXJlIG5vdCBhbGxvd2VkLFxuICAgICAgLy8gYnV0IHdlIG1heSB0ZW1wb3JhcmlseSBzaG93IGR1cGxpY2F0ZSBrZXlzLlxuICAgICAgdGVtcERpc3BsYXlLZXlzOiB0ZW1wRGlzcGxheUtleXNcbiAgICB9O1xuICB9LFxuXG4gIGNvbXBvbmVudFdpbGxSZWNlaXZlUHJvcHM6IGZ1bmN0aW9uIChuZXdQcm9wcykge1xuXG4gICAgdmFyIGtleVRvSWQgPSB0aGlzLnN0YXRlLmtleVRvSWQ7XG4gICAgdmFyIG5ld0tleVRvSWQgPSB7fTtcbiAgICB2YXIgdGVtcERpc3BsYXlLZXlzID0gdGhpcy5zdGF0ZS50ZW1wRGlzcGxheUtleXM7XG4gICAgdmFyIG5ld1RlbXBEaXNwbGF5S2V5cyA9IHt9O1xuICAgIHZhciBrZXlPcmRlciA9IHRoaXMuc3RhdGUua2V5T3JkZXI7XG4gICAgdmFyIGtleXMgPSBPYmplY3Qua2V5cyhuZXdQcm9wcy5maWVsZC52YWx1ZSk7XG4gICAgdmFyIGFkZGVkS2V5cyA9IFtdO1xuXG4gICAgLy8gTG9vayBhdCB0aGUgbmV3IGtleXMuXG4gICAga2V5cy5mb3JFYWNoKGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgIC8vIEFkZCBuZXcgbG9va3VwIGlmIHRoaXMga2V5IHdhc24ndCBoZXJlIGxhc3QgdGltZS5cbiAgICAgIGlmICgha2V5VG9JZFtrZXldKSB7XG4gICAgICAgIHRoaXMubmV4dExvb2t1cElkKys7XG4gICAgICAgIG5ld0tleVRvSWRba2V5XSA9IHRoaXMubmV4dExvb2t1cElkO1xuICAgICAgICBhZGRlZEtleXMucHVzaChrZXkpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbmV3S2V5VG9JZFtrZXldID0ga2V5VG9JZFtrZXldO1xuICAgICAgfVxuICAgICAgaWYgKGlzVGVtcEtleShrZXkpICYmIG5ld0tleVRvSWRba2V5XSBpbiB0ZW1wRGlzcGxheUtleXMpIHtcbiAgICAgICAgbmV3VGVtcERpc3BsYXlLZXlzW25ld0tleVRvSWRba2V5XV0gPSB0ZW1wRGlzcGxheUtleXNbbmV3S2V5VG9JZFtrZXldXTtcbiAgICAgIH1cbiAgICB9LmJpbmQodGhpcykpO1xuXG4gICAgdmFyIG5ld0tleU9yZGVyID0gW107XG5cbiAgICAvLyBMb29rIGF0IHRoZSBvbGQga2V5cy5cbiAgICBrZXlPcmRlci5mb3JFYWNoKGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgIC8vIElmIHRoZSBrZXkgaXMgaW4gdGhlIG5ldyBrZXlzLCBwdXNoIGl0IG9udG8gdGhlIG9yZGVyIHRvIHJldGFpbiB0aGVcbiAgICAgIC8vIHNhbWUgb3JkZXIuXG4gICAgICBpZiAobmV3S2V5VG9JZFtrZXldKSB7XG4gICAgICAgIG5ld0tleU9yZGVyLnB1c2goa2V5KTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIC8vIFB1dCBhZGRlZCBmaWVsZHMgYXQgdGhlIGVuZC4gKFNvIHRoaW5ncyBkb24ndCBnZXQgc2h1ZmZsZWQuKVxuICAgIG5ld0tleU9yZGVyID0gbmV3S2V5T3JkZXIuY29uY2F0KGFkZGVkS2V5cyk7XG5cbiAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgIGtleVRvSWQ6IG5ld0tleVRvSWQsXG4gICAgICBrZXlPcmRlcjogbmV3S2V5T3JkZXIsXG4gICAgICB0ZW1wRGlzcGxheUtleXM6IG5ld1RlbXBEaXNwbGF5S2V5c1xuICAgIH0pO1xuICB9LFxuXG4gIG9uQ2hhbmdlOiBmdW5jdGlvbiAoa2V5LCBuZXdWYWx1ZSwgaW5mbykge1xuICAgIHZhciBuZXdPYmogPSBfLmV4dGVuZCh7fSwgdGhpcy5wcm9wcy5maWVsZC52YWx1ZSk7XG4gICAgbmV3T2JqW2tleV0gPSBuZXdWYWx1ZTtcbiAgICB0aGlzLm9uQnViYmxlVmFsdWUobmV3T2JqLCBpbmZvKTtcbiAgfSxcblxuICBvbkFwcGVuZDogZnVuY3Rpb24gKGl0ZW1DaG9pY2VJbmRleCkge1xuICAgIHZhciBjb25maWcgPSB0aGlzLnByb3BzLmNvbmZpZztcbiAgICB2YXIgZmllbGQgPSB0aGlzLnByb3BzLmZpZWxkO1xuICAgIHRoaXMubmV4dExvb2t1cElkKys7XG5cbiAgICB2YXIga2V5VG9JZCA9IHRoaXMuc3RhdGUua2V5VG9JZDtcbiAgICB2YXIga2V5T3JkZXIgPSB0aGlzLnN0YXRlLmtleU9yZGVyO1xuICAgIHZhciB0ZW1wRGlzcGxheUtleXMgPSB0aGlzLnN0YXRlLnRlbXBEaXNwbGF5S2V5cztcblxuICAgIHZhciBpZCA9IHRoaXMubmV4dExvb2t1cElkO1xuICAgIHZhciBuZXdLZXkgPSB0ZW1wS2V5KGlkKTtcblxuICAgIGtleVRvSWRbbmV3S2V5XSA9IGlkO1xuICAgIC8vIFRlbXBvcmFyaWx5LCB3ZSdsbCBzaG93IGEgYmxhbmsga2V5LlxuICAgIHRlbXBEaXNwbGF5S2V5c1tpZF0gPSAnJztcbiAgICBrZXlPcmRlci5wdXNoKG5ld0tleSk7XG5cbiAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgIGtleVRvSWQ6IGtleVRvSWQsXG4gICAgICB0ZW1wRGlzcGxheUtleXM6IHRlbXBEaXNwbGF5S2V5cyxcbiAgICAgIGtleU9yZGVyOiBrZXlPcmRlclxuICAgIH0pO1xuXG4gICAgdmFyIG5ld09iaiA9IF8uZXh0ZW5kKHRoaXMucHJvcHMuZmllbGQudmFsdWUpO1xuXG4gICAgdmFyIG5ld1ZhbHVlID0gY29uZmlnLmNyZWF0ZU5ld0NoaWxkRmllbGRWYWx1ZShmaWVsZCwgaXRlbUNob2ljZUluZGV4KTtcblxuICAgIG5ld09ialtuZXdLZXldID0gbmV3VmFsdWU7XG5cbiAgICB0aGlzLm9uQ2hhbmdlVmFsdWUobmV3T2JqKTtcbiAgfSxcblxuICBvblJlbW92ZTogZnVuY3Rpb24gKGtleSkge1xuICAgIHZhciBuZXdPYmogPSBfLmV4dGVuZCh0aGlzLnByb3BzLmZpZWxkLnZhbHVlKTtcbiAgICBkZWxldGUgbmV3T2JqW2tleV07XG4gICAgdGhpcy5vbkNoYW5nZVZhbHVlKG5ld09iaik7XG4gIH0sXG5cbiAgb25Nb3ZlOiBmdW5jdGlvbiAoZnJvbUtleSwgdG9LZXkpIHtcbiAgICBpZiAoZnJvbUtleSAhPT0gdG9LZXkpIHtcbiAgICAgIHZhciBrZXlUb0lkID0gdGhpcy5zdGF0ZS5rZXlUb0lkO1xuICAgICAgdmFyIGtleU9yZGVyID0gdGhpcy5zdGF0ZS5rZXlPcmRlcjtcbiAgICAgIHZhciB0ZW1wRGlzcGxheUtleXMgPSB0aGlzLnN0YXRlLnRlbXBEaXNwbGF5S2V5cztcblxuICAgICAgdmFyIG5ld09iaiA9IF8uZXh0ZW5kKHRoaXMucHJvcHMuZmllbGQudmFsdWUpO1xuXG4gICAgICAvLyBJZiB3ZSBhbHJlYWR5IGhhdmUgdGhlIGtleSB3ZSdyZSBtb3ZpbmcgdG8sIHRoZW4gd2UgaGF2ZSB0byBjaGFuZ2UgdGhhdFxuICAgICAgLy8ga2V5IHRvIHNvbWV0aGluZyBlbHNlLlxuICAgICAgaWYgKGtleVRvSWRbdG9LZXldKSB7XG4gICAgICAgIC8vIE1ha2UgYSBuZXdcbiAgICAgICAgdmFyIHRlbXBUb0tleSA9IHRlbXBLZXkoa2V5VG9JZFt0b0tleV0pO1xuICAgICAgICB0ZW1wRGlzcGxheUtleXNba2V5VG9JZFt0b0tleV1dID0gdG9LZXk7XG4gICAgICAgIGtleVRvSWRbdGVtcFRvS2V5XSA9IGtleVRvSWRbdG9LZXldO1xuICAgICAgICBrZXlPcmRlcltrZXlPcmRlci5pbmRleE9mKHRvS2V5KV0gPSB0ZW1wVG9LZXk7XG4gICAgICAgIGRlbGV0ZSBrZXlUb0lkW3RvS2V5XTtcbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICAgICAga2V5VG9JZDoga2V5VG9JZCxcbiAgICAgICAgICB0ZW1wRGlzcGxheUtleXM6IHRlbXBEaXNwbGF5S2V5cyxcbiAgICAgICAgICBrZXlPcmRlcjoga2V5T3JkZXJcbiAgICAgICAgfSk7XG5cbiAgICAgICAgbmV3T2JqW3RlbXBUb0tleV0gPSBuZXdPYmpbdG9LZXldO1xuICAgICAgICBkZWxldGUgbmV3T2JqW3RvS2V5XTtcbiAgICAgIH1cblxuICAgICAgaWYgKCF0b0tleSkge1xuICAgICAgICB0b0tleSA9IHRlbXBLZXkoa2V5VG9JZFtmcm9tS2V5XSk7XG4gICAgICAgIHRlbXBEaXNwbGF5S2V5c1trZXlUb0lkW2Zyb21LZXldXSA9ICcnO1xuICAgICAgfVxuICAgICAga2V5VG9JZFt0b0tleV0gPSBrZXlUb0lkW2Zyb21LZXldO1xuICAgICAgZGVsZXRlIGtleVRvSWRbZnJvbUtleV07XG4gICAgICBrZXlPcmRlcltrZXlPcmRlci5pbmRleE9mKGZyb21LZXkpXSA9IHRvS2V5O1xuXG4gICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAga2V5VG9JZDoga2V5VG9JZCxcbiAgICAgICAga2V5T3JkZXI6IGtleU9yZGVyLFxuICAgICAgICB0ZW1wRGlzcGxheUtleXM6IHRlbXBEaXNwbGF5S2V5c1xuICAgICAgfSk7XG5cbiAgICAgIG5ld09ialt0b0tleV0gPSBuZXdPYmpbZnJvbUtleV07XG4gICAgICBkZWxldGUgbmV3T2JqW2Zyb21LZXldO1xuXG4gICAgICB0aGlzLm9uQ2hhbmdlVmFsdWUobmV3T2JqKTtcblxuICAgICAgLy8gQ2hlY2sgaWYgb3VyIGZyb21LZXkgaGFzIG9wZW5lZCB1cCBhIHNwb3QuXG4gICAgICBpZiAoZnJvbUtleSAmJiBmcm9tS2V5ICE9PSB0b0tleSkge1xuICAgICAgICBpZiAoIShmcm9tS2V5IGluIG5ld09iaikpIHtcbiAgICAgICAgICBPYmplY3Qua2V5cyhuZXdPYmopLmZvckVhY2goZnVuY3Rpb24gKGtleSkge1xuICAgICAgICAgICAgaWYgKCEoaXNUZW1wS2V5KGtleSkpKSB7XG4gICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciBpZCA9IGtleVRvSWRba2V5XTtcbiAgICAgICAgICAgIHZhciBkaXNwbGF5S2V5ID0gdGVtcERpc3BsYXlLZXlzW2lkXTtcbiAgICAgICAgICAgIGlmIChmcm9tS2V5ID09PSBkaXNwbGF5S2V5KSB7XG4gICAgICAgICAgICAgIHRoaXMub25Nb3ZlKGtleSwgZGlzcGxheUtleSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfS5iaW5kKHRoaXMpKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfSxcblxuICBnZXRGaWVsZHM6IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgY29uZmlnID0gdGhpcy5wcm9wcy5jb25maWc7XG4gICAgdmFyIGZpZWxkID0gdGhpcy5wcm9wcy5maWVsZDtcblxuICAgIHZhciBmaWVsZHMgPSBjb25maWcuY3JlYXRlQ2hpbGRGaWVsZHMoZmllbGQpO1xuXG4gICAgdmFyIGtleVRvRmllbGQgPSB7fTtcblxuICAgIF8uZWFjaChmaWVsZHMsIGZ1bmN0aW9uIChjaGlsZEZpZWxkKSB7XG4gICAgICBrZXlUb0ZpZWxkW2NoaWxkRmllbGQua2V5XSA9IGNoaWxkRmllbGQ7XG4gICAgfSk7XG5cbiAgICByZXR1cm4gdGhpcy5zdGF0ZS5rZXlPcmRlci5tYXAoZnVuY3Rpb24gKGtleSkge1xuICAgICAgcmV0dXJuIGtleVRvRmllbGRba2V5XTtcbiAgICB9KTtcbiAgfSxcblxuICByZW5kZXI6IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpcy5yZW5kZXJXaXRoQ29uZmlnKCk7XG4gIH0sXG5cbiAgcmVuZGVyRGVmYXVsdDogZnVuY3Rpb24gKCkge1xuXG4gICAgdmFyIGNvbmZpZyA9IHRoaXMucHJvcHMuY29uZmlnO1xuICAgIHZhciBmaWVsZCA9IHRoaXMucHJvcHMuZmllbGQ7XG5cbiAgICB2YXIgZmllbGRzID0gdGhpcy5nZXRGaWVsZHMoKTtcblxuICAgIHJldHVybiBjb25maWcuY3JlYXRlRWxlbWVudCgnZmllbGQnLCB7XG4gICAgICBmaWVsZDogZmllbGQsIHBsYWluOiB0aGlzLnByb3BzLnBsYWluXG4gICAgfSxcbiAgICAgIFIuZGl2KHtjbGFzc05hbWU6IGN4KHRoaXMucHJvcHMuY2xhc3Nlcyl9LFxuICAgICAgICBjb25maWcuY3NzVHJhbnNpdGlvbldyYXBwZXIoXG4gICAgICAgICAgZmllbGRzLm1hcChmdW5jdGlvbiAoY2hpbGRGaWVsZCkge1xuICAgICAgICAgICAgdmFyIGRpc3BsYXlLZXkgPSB0aGlzLnN0YXRlLnRlbXBEaXNwbGF5S2V5c1t0aGlzLnN0YXRlLmtleVRvSWRbY2hpbGRGaWVsZC5rZXldXTtcbiAgICAgICAgICAgIGlmIChfLmlzVW5kZWZpbmVkKGRpc3BsYXlLZXkpKSB7XG4gICAgICAgICAgICAgIGRpc3BsYXlLZXkgPSBjaGlsZEZpZWxkLmtleTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBjb25maWcuY3JlYXRlRWxlbWVudCgnb2JqZWN0LWl0ZW0nLCB7XG4gICAgICAgICAgICAgIGtleTogdGhpcy5zdGF0ZS5rZXlUb0lkW2NoaWxkRmllbGQua2V5XSxcbiAgICAgICAgICAgICAgZmllbGQ6IGNoaWxkRmllbGQsXG4gICAgICAgICAgICAgIG9uTW92ZTogdGhpcy5vbk1vdmUsXG4gICAgICAgICAgICAgIG9uUmVtb3ZlOiB0aGlzLm9uUmVtb3ZlLFxuICAgICAgICAgICAgICBvbkNoYW5nZTogdGhpcy5vbkNoYW5nZSxcbiAgICAgICAgICAgICAgb25BY3Rpb246IHRoaXMub25CdWJibGVBY3Rpb24sXG4gICAgICAgICAgICAgIGRpc3BsYXlLZXk6IGRpc3BsYXlLZXksXG4gICAgICAgICAgICAgIGl0ZW1LZXk6IGNoaWxkRmllbGQua2V5XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9LmJpbmQodGhpcykpXG4gICAgICAgICksXG4gICAgICAgIGNvbmZpZy5jcmVhdGVFbGVtZW50KCdvYmplY3QtY29udHJvbCcsIHtmaWVsZDogZmllbGQsIG9uQXBwZW5kOiB0aGlzLm9uQXBwZW5kfSlcbiAgICAgIClcbiAgICApO1xuICB9XG59KTtcbiIsIi8vICMgc2luZ2xlLWxpbmUtc3RyaW5nIGNvbXBvbmVudFxuXG4vKlxuUmVuZGVyIGEgc2luZ2xlIGxpbmUgdGV4dCBpbnB1dC5cbiovXG5cbid1c2Ugc3RyaWN0JztcblxudmFyIFJlYWN0ID0gcmVxdWlyZSgncmVhY3QvYWRkb25zJyk7XG52YXIgUiA9IFJlYWN0LkRPTTtcbnZhciBjeCA9IHJlcXVpcmUoJ2NsYXNzbmFtZXMnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG5cbiAgZGlzcGxheU5hbWU6ICdQYXNzd29yZCcsXG5cbiAgbWl4aW5zOiBbcmVxdWlyZSgnLi4vLi4vbWl4aW5zL2ZpZWxkJyldLFxuXG4gIG9uQ2hhbmdlOiBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICB0aGlzLm9uQ2hhbmdlVmFsdWUoZXZlbnQudGFyZ2V0LnZhbHVlKTtcbiAgfSxcblxuICByZW5kZXI6IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpcy5yZW5kZXJXaXRoQ29uZmlnKCk7XG4gIH0sXG5cbiAgcmVuZGVyRGVmYXVsdDogZnVuY3Rpb24gKCkge1xuXG4gICAgdmFyIGNvbmZpZyA9IHRoaXMucHJvcHMuY29uZmlnO1xuICAgIHZhciBmaWVsZCA9IHRoaXMucHJvcHMuZmllbGQ7XG5cbiAgICByZXR1cm4gY29uZmlnLmNyZWF0ZUVsZW1lbnQoJ2ZpZWxkJywge1xuICAgICAgY29uZmlnOiBjb25maWcsIGZpZWxkOiBmaWVsZCwgcGxhaW46IHRoaXMucHJvcHMucGxhaW5cbiAgICB9LCBSLmlucHV0KHtcbiAgICAgIHR5cGU6ICdwYXNzd29yZCcsXG4gICAgICB2YWx1ZTogdGhpcy5wcm9wcy5maWVsZC52YWx1ZSxcbiAgICAgIGNsYXNzTmFtZTogY3godGhpcy5wcm9wcy5jbGFzc2VzKSxcbiAgICAgIG9uQ2hhbmdlOiB0aGlzLm9uQ2hhbmdlLFxuICAgICAgb25Gb2N1czogdGhpcy5vbkZvY3VzQWN0aW9uLFxuICAgICAgb25CbHVyOiB0aGlzLm9uQmx1ckFjdGlvbixcbiAgICAgIGRpc2FibGVkOiB0aGlzLmlzUmVhZE9ubHkoKVxuICAgIH0pKTtcbiAgfVxufSk7XG4iLCIvLyAjIHByZXR0eSBib29sZWFuIGNvbXBvbmVudFxuXG4vKlxuUmVuZGVyIHByZXR0eSBib29sZWFuIGNvbXBvbmVudCB3aXRoIG5vbi1uYXRpdmUgZHJvcC1kb3duXG4qL1xuXG4ndXNlIHN0cmljdCc7XG5cbnZhciBSZWFjdCA9IHJlcXVpcmUoJ3JlYWN0L2FkZG9ucycpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcblxuICBkaXNwbGF5TmFtZTogJ1ByZXR0eUJvb2xlYW4nLFxuXG4gIG1peGluczogW3JlcXVpcmUoJy4uLy4uL21peGlucy9maWVsZCcpXSxcblxuICBvbkNoYW5nZTogZnVuY3Rpb24gKG5ld1ZhbHVlKSB7XG4gICAgdGhpcy5vbkNoYW5nZVZhbHVlKG5ld1ZhbHVlKTtcbiAgfSxcblxuICByZW5kZXI6IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpcy5yZW5kZXJXaXRoQ29uZmlnKCk7XG4gIH0sXG5cbiAgcmVuZGVyRGVmYXVsdDogZnVuY3Rpb24gKCkge1xuICAgIHZhciBjb25maWcgPSB0aGlzLnByb3BzLmNvbmZpZztcbiAgICB2YXIgZmllbGQgPSB0aGlzLnByb3BzLmZpZWxkO1xuXG4gICAgdmFyIGNob2ljZXMgPSBjb25maWcuZmllbGRCb29sZWFuQ2hvaWNlcyhmaWVsZCk7XG5cbiAgICByZXR1cm4gY29uZmlnLmNyZWF0ZUVsZW1lbnQoJ2ZpZWxkJywge1xuICAgICAgZmllbGQ6IGZpZWxkLCBwbGFpbjogdGhpcy5wcm9wcy5wbGFpblxuICAgIH0sIGNvbmZpZy5jcmVhdGVFbGVtZW50KCdwcmV0dHktc2VsZWN0LXZhbHVlJywge1xuICAgICAgY2hvaWNlczogY2hvaWNlcywgZmllbGQ6IGZpZWxkLCBvbkNoYW5nZTogdGhpcy5vbkNoYW5nZSwgb25BY3Rpb246IHRoaXMub25CdWJibGVBY3Rpb25cbiAgICB9KSk7XG4gIH1cbn0pO1xuIiwiLy8gIyBzZWxlY3QgY29tcG9uZW50XG5cbi8qXG5SZW5kZXIgc2VsZWN0IGVsZW1lbnQgdG8gZ2l2ZSBhIHVzZXIgY2hvaWNlcyBmb3IgdGhlIHZhbHVlIG9mIGEgZmllbGQuIFJlbmRlcnMgbm9uLW5hdGl2ZVxuc2VsZWN0IGRyb3AgZG93biBhbmQgc3VwcG9ydHMgZmFuY2llciByZW5kZXJpbmdzLlxuKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgUmVhY3QgPSByZXF1aXJlKCdyZWFjdC9hZGRvbnMnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG5cbiAgZGlzcGxheU5hbWU6ICdQcmV0dHlTZWxlY3QnLFxuXG4gIG1peGluczogW3JlcXVpcmUoJy4uLy4uL21peGlucy9maWVsZCcpXSxcblxuICBnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4ge1xuICAgICAgY2hvaWNlczogdGhpcy5wcm9wcy5jb25maWcuZmllbGRQcmV0dHlDaG9pY2VzKHRoaXMucHJvcHMuZmllbGQpXG4gICAgfTtcbiAgfSxcblxuICBjb21wb25lbnRXaWxsUmVjZWl2ZVByb3BzOiBmdW5jdGlvbiAobmV3UHJvcHMpIHtcbiAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgIGNob2ljZXM6IG5ld1Byb3BzLmNvbmZpZy5maWVsZFByZXR0eUNob2ljZXMobmV3UHJvcHMuZmllbGQpXG4gICAgfSk7XG4gIH0sXG5cbiAgcmVuZGVyOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMucmVuZGVyV2l0aENvbmZpZygpO1xuICB9LFxuXG4gIG9uQ2hhbmdlOiBmdW5jdGlvbiAodmFsdWUsIGluZm8pIHtcbiAgICBpZiAoaW5mbyAmJiBpbmZvLmlzQ3VzdG9tVmFsdWUpIHtcbiAgICAgIHRoaXMucHJvcHMub25DaGFuZ2UodmFsdWUsIHtcbiAgICAgICAgZmllbGQ6IHRoaXMucHJvcHMuZmllbGQsXG4gICAgICAgIGlzQ3VzdG9tVmFsdWU6IHRydWVcbiAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLm9uQ2hhbmdlVmFsdWUodmFsdWUpO1xuICAgIH1cbiAgfSxcblxuICByZW5kZXJEZWZhdWx0OiBmdW5jdGlvbiAoKSB7XG5cbiAgICB2YXIgY29uZmlnID0gdGhpcy5wcm9wcy5jb25maWc7XG4gICAgdmFyIGZpZWxkID0gdGhpcy5wcm9wcy5maWVsZDtcblxuICAgIHJldHVybiBjb25maWcuY3JlYXRlRWxlbWVudCgnZmllbGQnLCB7XG4gICAgICBjb25maWc6IGNvbmZpZywgZmllbGQ6IGZpZWxkLCBwbGFpbjogdGhpcy5wcm9wcy5wbGFpbiwgY2xhc3NlczogdGhpcy5wcm9wcy5jbGFzc2VzXG4gICAgfSwgY29uZmlnLmNyZWF0ZUVsZW1lbnQoJ3ByZXR0eS1zZWxlY3QtdmFsdWUnLCB7XG4gICAgICBjaG9pY2VzOiB0aGlzLnN0YXRlLmNob2ljZXMsIGZpZWxkOiBmaWVsZCwgb25DaGFuZ2U6IHRoaXMub25DaGFuZ2UsIG9uQWN0aW9uOiB0aGlzLm9uQnViYmxlQWN0aW9uXG4gICAgfSkpO1xuICB9XG59KTtcbiIsIid1c2Ugc3RyaWN0Jztcbi8qZXNsaW50IG5vLXNjcmlwdC11cmw6MCAqL1xuXG52YXIgUmVhY3QgPSByZXF1aXJlKCdyZWFjdC9hZGRvbnMnKTtcbnZhciBfID0gcmVxdWlyZSgnLi4vLi4vdW5kYXNoJyk7XG52YXIgY3ggPSByZXF1aXJlKCdjbGFzc25hbWVzJyk7XG5cbi8qXG4gICBXcmFwcyBhIFByZXR0eVRleHRJbnB1dCB0byBiZSBhIHN0YW5kIGFsb25lIGZpZWxkLlxuICovXG5tb2R1bGUuZXhwb3J0cyA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcblxuICBkaXNwbGF5TmFtZTogJ1ByZXR0eVRleHQnLFxuXG4gIG1peGluczogW3JlcXVpcmUoJy4uLy4uL21peGlucy9maWVsZCcpXSxcblxuICByZW5kZXI6IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLnJlbmRlcldpdGhDb25maWcoKTtcbiAgfSxcblxuICBmb2N1czogZnVuY3Rpb24gKCkge1xuICAgIHRoaXMucmVmcy50ZXh0Qm94LmZvY3VzKCk7XG4gIH0sXG5cbiAgcmVuZGVyRGVmYXVsdDogZnVuY3Rpb24gKCkge1xuXG4gICAgdmFyIGNvbmZpZyA9IHRoaXMucHJvcHMuY29uZmlnO1xuICAgIHZhciBmaWVsZCA9IHRoaXMucHJvcHMuZmllbGQ7XG4gICAgdmFyIHByb3BzID0geyBmaWVsZDogZmllbGQsIHBsYWluOiB0aGlzLnByb3BzLnBsYWluIH07XG5cbiAgICBjb25zdCByZWFkT25seSA9IGNvbmZpZy5maWVsZElzUmVhZE9ubHkoZmllbGQpO1xuXG4gICAgLy8gVGhlIHRhYiBpbmRleCBtYWtlcyB0aGlzIGNvbnRyb2wgZm9jdXNhYmxlIGFuZCBlZGl0YWJsZS4gSWYgcmVhZCBvbmx5LCBubyB0YWJJbmRleFxuICAgIHZhciB0YWJJbmRleCA9IHJlYWRPbmx5ID8gbnVsbCA6IGZpZWxkLnRhYkluZGV4O1xuXG4gICAgdmFyIGVsZW1lbnQgPSBjb25maWcuY3JlYXRlRWxlbWVudCgncHJldHR5LXRleHQtaW5wdXQnLCB7XG4gICAgICBjbGFzc2VzOiB0aGlzLnByb3BzLmNsYXNzZXMsXG4gICAgICB0YWJJbmRleDogdGFiSW5kZXgsXG4gICAgICBvbkNoYW5nZTogdGhpcy5vbkNoYW5nZVZhbHVlLFxuICAgICAgb25Gb2N1czogdGhpcy5vbkZvY3VzQWN0aW9uLFxuICAgICAgb25CbHVyOiB0aGlzLm9uQmx1ckFjdGlvbixcbiAgICAgIG9uQWN0aW9uOiB0aGlzLm9uQnViYmxlQWN0aW9uLFxuICAgICAgZmllbGQ6IHRoaXMucHJvcHMuZmllbGQsXG4gICAgICB2YWx1ZTogdGhpcy5wcm9wcy5maWVsZC52YWx1ZSxcbiAgICAgIGlzQWNjb3JkaW9uOiB0aGlzLnByb3BzLmZpZWxkLmlzQWNjb3JkaW9uLFxuICAgICAgc2VsZWN0ZWRDaG9pY2VzOiB0aGlzLnByb3BzLmNvbmZpZy5maWVsZFNlbGVjdGVkUmVwbGFjZUNob2ljZXModGhpcy5wcm9wcy5maWVsZCksXG4gICAgICByZXBsYWNlQ2hvaWNlczogdGhpcy5wcm9wcy5jb25maWcuZmllbGRSZXBsYWNlQ2hvaWNlcyh0aGlzLnByb3BzLmZpZWxkKSxcbiAgICAgIHJlZjogJ3RleHRCb3gnLFxuICAgICAgcmVhZE9ubHk6IHJlYWRPbmx5XG4gICAgfSk7XG5cbiAgICByZXR1cm4gY29uZmlnLmNyZWF0ZUVsZW1lbnQoJ2ZpZWxkJywgcHJvcHMsIGVsZW1lbnQpO1xuICB9XG59KTtcbiIsIi8vICMgc2VsZWN0IGNvbXBvbmVudFxuXG4vKlxuUmVuZGVyIHNlbGVjdCBlbGVtZW50IHRvIGdpdmUgYSB1c2VyIGNob2ljZXMgZm9yIHRoZSB2YWx1ZSBvZiBhIGZpZWxkLiBOb3RlXG5pdCBzaG91bGQgc3VwcG9ydCB2YWx1ZXMgb3RoZXIgdGhhbiBzdHJpbmdzLiBDdXJyZW50bHkgdGhpcyBpcyBvbmx5IHRlc3RlZCBmb3JcbmJvb2xlYW4gdmFsdWVzLCBidXQgaXQgX3Nob3VsZF8gd29yayBmb3Igb3RoZXIgdmFsdWVzLlxuKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgUmVhY3QgPSByZXF1aXJlKCdyZWFjdC9hZGRvbnMnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG5cbiAgZGlzcGxheU5hbWU6ICdTZWxlY3QnLFxuXG4gIG1peGluczogW3JlcXVpcmUoJy4uLy4uL21peGlucy9maWVsZCcpXSxcblxuICBnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4ge1xuICAgICAgY2hvaWNlczogdGhpcy5wcm9wcy5jb25maWcuZmllbGRDaG9pY2VzKHRoaXMucHJvcHMuZmllbGQpXG4gICAgfTtcbiAgfSxcblxuICBjb21wb25lbnRXaWxsUmVjZWl2ZVByb3BzOiBmdW5jdGlvbiAobmV3UHJvcHMpIHtcbiAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgIGNob2ljZXM6IG5ld1Byb3BzLmNvbmZpZy5maWVsZENob2ljZXMobmV3UHJvcHMuZmllbGQpXG4gICAgfSk7XG4gIH0sXG5cbiAgcmVuZGVyOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMucmVuZGVyV2l0aENvbmZpZygpO1xuICB9LFxuXG4gIHJlbmRlckRlZmF1bHQ6IGZ1bmN0aW9uICgpIHtcblxuICAgIHZhciBjb25maWcgPSB0aGlzLnByb3BzLmNvbmZpZztcbiAgICB2YXIgZmllbGQgPSB0aGlzLnByb3BzLmZpZWxkO1xuXG4gICAgcmV0dXJuIGNvbmZpZy5jcmVhdGVFbGVtZW50KCdmaWVsZCcsIHtcbiAgICAgIGNvbmZpZzogY29uZmlnLCBmaWVsZDogZmllbGQsIHBsYWluOiB0aGlzLnByb3BzLnBsYWluXG4gICAgfSwgY29uZmlnLmNyZWF0ZUVsZW1lbnQoJ3NlbGVjdC12YWx1ZScsIHtcbiAgICAgIGNob2ljZXM6IHRoaXMuc3RhdGUuY2hvaWNlcywgZmllbGQ6IGZpZWxkLCBvbkNoYW5nZTogdGhpcy5vbkNoYW5nZVZhbHVlLCBvbkFjdGlvbjogdGhpcy5vbkJ1YmJsZUFjdGlvblxuICAgIH0pKTtcbiAgfVxufSk7XG4iLCIvLyAjIHNpbmdsZS1saW5lLXN0cmluZyBjb21wb25lbnRcblxuLypcblJlbmRlciBhIHNpbmdsZSBsaW5lIHRleHQgaW5wdXQuXG4qL1xuXG4ndXNlIHN0cmljdCc7XG5cbnZhciBSZWFjdCA9IHJlcXVpcmUoJ3JlYWN0L2FkZG9ucycpO1xudmFyIFIgPSBSZWFjdC5ET007XG52YXIgY3ggPSByZXF1aXJlKCdjbGFzc25hbWVzJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXG4gIGRpc3BsYXlOYW1lOiAnU2luZ2xlTGluZVN0cmluZycsXG5cbiAgbWl4aW5zOiBbcmVxdWlyZSgnLi4vLi4vbWl4aW5zL2ZpZWxkJyldLFxuXG4gIG9uQ2hhbmdlOiBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICB0aGlzLm9uQ2hhbmdlVmFsdWUoZXZlbnQudGFyZ2V0LnZhbHVlKTtcbiAgfSxcblxuICByZW5kZXI6IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpcy5yZW5kZXJXaXRoQ29uZmlnKCk7XG4gIH0sXG5cbiAgcmVuZGVyRGVmYXVsdDogZnVuY3Rpb24gKCkge1xuXG4gICAgdmFyIGNvbmZpZyA9IHRoaXMucHJvcHMuY29uZmlnO1xuICAgIHZhciBmaWVsZCA9IHRoaXMucHJvcHMuZmllbGQ7XG5cbiAgICByZXR1cm4gY29uZmlnLmNyZWF0ZUVsZW1lbnQoJ2ZpZWxkJywge1xuICAgICAgY29uZmlnOiBjb25maWcsIGZpZWxkOiBmaWVsZCwgcGxhaW46IHRoaXMucHJvcHMucGxhaW5cbiAgICB9LCBSLmlucHV0KHtcbiAgICAgIHR5cGU6ICd0ZXh0JyxcbiAgICAgIHZhbHVlOiB0aGlzLnByb3BzLmZpZWxkLnZhbHVlLFxuICAgICAgY2xhc3NOYW1lOiBjeCh0aGlzLnByb3BzLmNsYXNzZXMpLFxuICAgICAgb25DaGFuZ2U6IHRoaXMub25DaGFuZ2UsXG4gICAgICBvbkZvY3VzOiB0aGlzLm9uRm9jdXNBY3Rpb24sXG4gICAgICBvbkJsdXI6IHRoaXMub25CbHVyQWN0aW9uLFxuICAgICAgcmVhZE9ubHk6IGNvbmZpZy5maWVsZElzUmVhZE9ubHkoZmllbGQpXG4gICAgfSkpO1xuICB9XG59KTtcbiIsIi8vICMgc3RyaW5nIGNvbXBvbmVudFxuXG4vKlxuUmVuZGVyIGEgZmllbGQgdGhhdCBjYW4gZWRpdCBhIHN0cmluZyB2YWx1ZS5cbiovXG5cbid1c2Ugc3RyaWN0JztcblxudmFyIFJlYWN0ID0gcmVxdWlyZSgncmVhY3QvYWRkb25zJyk7XG52YXIgUiA9IFJlYWN0LkRPTTtcbnZhciBjeCA9IHJlcXVpcmUoJ2NsYXNzbmFtZXMnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG5cbiAgZGlzcGxheU5hbWU6ICdTdHJpbmcnLFxuXG4gIG1peGluczogW3JlcXVpcmUoJy4uLy4uL21peGlucy9maWVsZCcpXSxcblxuICBvbkNoYW5nZTogZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgdGhpcy5vbkNoYW5nZVZhbHVlKGV2ZW50LnRhcmdldC52YWx1ZSk7XG4gIH0sXG5cbiAgcmVuZGVyOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMucmVuZGVyV2l0aENvbmZpZygpO1xuICB9LFxuXG4gIHJlbmRlckRlZmF1bHQ6IGZ1bmN0aW9uICgpIHtcblxuICAgIHZhciBjb25maWcgPSB0aGlzLnByb3BzLmNvbmZpZztcbiAgICB2YXIgZmllbGQgPSB0aGlzLnByb3BzLmZpZWxkO1xuXG4gICAgcmV0dXJuIGNvbmZpZy5jcmVhdGVFbGVtZW50KCdmaWVsZCcsIHtcbiAgICAgIGNvbmZpZzogY29uZmlnLCBmaWVsZDogZmllbGQsIHBsYWluOiB0aGlzLnByb3BzLnBsYWluXG4gICAgfSwgUi50ZXh0YXJlYSh7XG4gICAgICB2YWx1ZTogZmllbGQudmFsdWUsXG4gICAgICBjbGFzc05hbWU6IGN4KHRoaXMucHJvcHMuY2xhc3NlcyksXG4gICAgICByb3dzOiBmaWVsZC5yb3dzIHx8IHRoaXMucHJvcHMucm93cyxcbiAgICAgIG9uQ2hhbmdlOiB0aGlzLm9uQ2hhbmdlLFxuICAgICAgb25Gb2N1czogdGhpcy5vbkZvY3VzQWN0aW9uLFxuICAgICAgb25CbHVyOiB0aGlzLm9uQmx1ckFjdGlvbixcbiAgICAgIGRpc2FibGVkOiB0aGlzLmlzUmVhZE9ubHkoKVxuICAgIH0pKTtcbiAgfVxufSk7XG4iLCIvLyAjIHVua25vd24gY29tcG9uZW50XG5cbi8qXG5SZW5kZXIgYSBmaWVsZCB3aXRoIGFuIHVua25vd24gdHlwZS5cbiovXG5cbid1c2Ugc3RyaWN0JztcblxudmFyIFJlYWN0ID0gcmVxdWlyZSgncmVhY3QvYWRkb25zJyk7XG52YXIgUiA9IFJlYWN0LkRPTTtcblxubW9kdWxlLmV4cG9ydHMgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG5cbiAgZGlzcGxheU5hbWU6ICdVbmtub3duJyxcblxuICBtaXhpbnM6IFtyZXF1aXJlKCcuLi8uLi9taXhpbnMvZmllbGQnKV0sXG5cbiAgcmVuZGVyOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMucmVuZGVyV2l0aENvbmZpZygpO1xuICB9LFxuXG4gIHJlbmRlckRlZmF1bHQ6IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gUi5kaXYoe30sXG4gICAgICBSLmRpdih7fSwgJ0NvbXBvbmVudCBub3QgZm91bmQgZm9yOiAnKSxcbiAgICAgIFIucHJlKHt9LCBKU09OLnN0cmluZ2lmeSh0aGlzLnByb3BzLmZpZWxkLnJhd0ZpZWxkVGVtcGxhdGUsIG51bGwsIDIpKVxuICAgICk7XG4gIH1cblxufSk7XG4iLCIvLyAjIGFkZC1pdGVtIGNvbXBvbmVudFxuXG4vKlxuVGhlIGFkZCBidXR0b24gdG8gYXBwZW5kIGFuIGl0ZW0gdG8gYSBmaWVsZC5cbiovXG5cbid1c2Ugc3RyaWN0JztcblxudmFyIFJlYWN0ID0gcmVxdWlyZSgncmVhY3QvYWRkb25zJyk7XG52YXIgUiA9IFJlYWN0LkRPTTtcbnZhciBjeCA9IHJlcXVpcmUoJ2NsYXNzbmFtZXMnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG5cbiAgZGlzcGxheU5hbWU6ICdBZGRJdGVtJyxcblxuICBtaXhpbnM6IFtyZXF1aXJlKCcuLi8uLi9taXhpbnMvaGVscGVyJyldLFxuXG4gIGdldERlZmF1bHRQcm9wczogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB7XG4gICAgICBsYWJlbDogJ1thZGRdJ1xuICAgIH07XG4gIH0sXG5cbiAgcmVuZGVyOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMucmVuZGVyV2l0aENvbmZpZygpO1xuICB9LFxuXG4gIHJlbmRlckRlZmF1bHQ6IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gUi5zcGFuKHtjbGFzc05hbWU6IGN4KHRoaXMucHJvcHMuY2xhc3NlcyksIG9uQ2xpY2s6IHRoaXMucHJvcHMub25DbGlja30sIHRoaXMucHJvcHMubGFiZWwpO1xuICB9XG59KTtcbiIsIi8vICMgYXJyYXktY29udHJvbCBjb21wb25lbnRcblxuLypcblJlbmRlciB0aGUgaXRlbSB0eXBlIGNob2ljZXMgYW5kIHRoZSBhZGQgYnV0dG9uIGZvciBhbiBhcnJheS5cbiovXG5cbid1c2Ugc3RyaWN0JztcblxudmFyIFJlYWN0ID0gcmVxdWlyZSgncmVhY3QvYWRkb25zJyk7XG52YXIgUiA9IFJlYWN0LkRPTTtcbnZhciBjeCA9IHJlcXVpcmUoJ2NsYXNzbmFtZXMnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG5cbiAgZGlzcGxheU5hbWU6ICdBcnJheUNvbnRyb2wnLFxuXG4gIG1peGluczogW3JlcXVpcmUoJy4uLy4uL21peGlucy9oZWxwZXInKV0sXG5cbiAgZ2V0SW5pdGlhbFN0YXRlOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGZpZWxkVGVtcGxhdGVJbmRleDogMFxuICAgIH07XG4gIH0sXG5cbiAgb25TZWxlY3Q6IGZ1bmN0aW9uIChpbmRleCkge1xuICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgZmllbGRUZW1wbGF0ZUluZGV4OiBpbmRleFxuICAgIH0pO1xuICB9LFxuXG4gIG9uQXBwZW5kOiBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5wcm9wcy5vbkFwcGVuZCh0aGlzLnN0YXRlLmZpZWxkVGVtcGxhdGVJbmRleCk7XG4gIH0sXG5cbiAgcmVuZGVyOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMucmVuZGVyV2l0aENvbmZpZygpO1xuICB9LFxuXG4gIHJlbmRlckRlZmF1bHQ6IGZ1bmN0aW9uICgpIHtcblxuICAgIHZhciBjb25maWcgPSB0aGlzLnByb3BzLmNvbmZpZztcblxuICAgIHZhciBmaWVsZCA9IHRoaXMucHJvcHMuZmllbGQ7XG4gICAgdmFyIGZpZWxkVGVtcGxhdGVzID0gY29uZmlnLmZpZWxkSXRlbUZpZWxkVGVtcGxhdGVzKGZpZWxkKTtcbiAgICB2YXIgdHlwZUNob2ljZXMgPSBudWxsO1xuXG4gICAgaWYgKCF0aGlzLmlzUmVhZE9ubHkoKSAmJiBmaWVsZFRlbXBsYXRlcy5sZW5ndGggPiAwKSB7XG4gICAgICB0eXBlQ2hvaWNlcyA9IGNvbmZpZy5jcmVhdGVFbGVtZW50KCdmaWVsZC10ZW1wbGF0ZS1jaG9pY2VzJywge1xuICAgICAgICBmaWVsZDogZmllbGQsIGZpZWxkVGVtcGxhdGVJbmRleDogdGhpcy5zdGF0ZS5maWVsZFRlbXBsYXRlSW5kZXgsIG9uU2VsZWN0OiB0aGlzLm9uU2VsZWN0XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBsZXQgYWRkSXRlbTtcbiAgICBpZiAoIXRoaXMuaXNSZWFkT25seSgpKSB7XG4gICAgICBhZGRJdGVtID0gY29uZmlnLmNyZWF0ZUVsZW1lbnQoJ2FkZC1pdGVtJywge2ZpZWxkOiBmaWVsZCwgb25DbGljazogdGhpcy5vbkFwcGVuZH0pO1xuICAgIH1cblxuICAgIHJldHVybiBSLmRpdih7Y2xhc3NOYW1lOiBjeCh0aGlzLnByb3BzLmNsYXNzZXMpfSxcbiAgICAgIHR5cGVDaG9pY2VzLCAnICcsXG4gICAgICBhZGRJdGVtXG4gICAgKTtcbiAgfVxufSk7XG4iLCIvLyAjIGFycmF5LWl0ZW0tY29udHJvbCBjb21wb25lbnRcblxuLypcblJlbmRlciB0aGUgcmVtb3ZlIGFuZCBtb3ZlIGJ1dHRvbnMgZm9yIGFuIGFycmF5IGZpZWxkLlxuKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgUmVhY3QgPSByZXF1aXJlKCdyZWFjdCcpO1xudmFyIFIgPSBSZWFjdC5ET007XG52YXIgY3ggPSByZXF1aXJlKCdjbGFzc25hbWVzJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXG4gIGRpc3BsYXlOYW1lOiAnQXJyYXlJdGVtQ29udHJvbCcsXG5cbiAgbWl4aW5zOiBbcmVxdWlyZSgnLi4vLi4vbWl4aW5zL2hlbHBlcicpXSxcblxuICBvbk1vdmVCYWNrOiBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5wcm9wcy5vbk1vdmUodGhpcy5wcm9wcy5pbmRleCwgdGhpcy5wcm9wcy5pbmRleCAtIDEpO1xuICB9LFxuXG4gIG9uTW92ZUZvcndhcmQ6IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLnByb3BzLm9uTW92ZSh0aGlzLnByb3BzLmluZGV4LCB0aGlzLnByb3BzLmluZGV4ICsgMSk7XG4gIH0sXG5cbiAgb25SZW1vdmU6IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLnByb3BzLm9uUmVtb3ZlKHRoaXMucHJvcHMuaW5kZXgpO1xuICB9LFxuXG4gIHJlbmRlcjogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLnJlbmRlcldpdGhDb25maWcoKTtcbiAgfSxcblxuICByZW5kZXJEZWZhdWx0OiBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGNvbmZpZyA9IHRoaXMucHJvcHMuY29uZmlnO1xuICAgIHZhciBmaWVsZCA9IHRoaXMucHJvcHMuZmllbGQ7XG5cbiAgICByZXR1cm4gUi5kaXYoe2NsYXNzTmFtZTogY3godGhpcy5wcm9wcy5jbGFzc2VzKX0sXG4gICAgICBjb25maWcuY3JlYXRlRWxlbWVudCgncmVtb3ZlLWl0ZW0nLCB7ZmllbGQ6IGZpZWxkLCBvbkNsaWNrOiB0aGlzLm9uUmVtb3ZlLCBvbk1heWJlUmVtb3ZlOiB0aGlzLnByb3BzLm9uTWF5YmVSZW1vdmV9KSxcbiAgICAgIHRoaXMucHJvcHMuaW5kZXggPiAwID8gY29uZmlnLmNyZWF0ZUVsZW1lbnQoJ21vdmUtaXRlbS1iYWNrJywge2ZpZWxkOiBmaWVsZCwgb25DbGljazogdGhpcy5vbk1vdmVCYWNrfSkgOiBudWxsLFxuICAgICAgdGhpcy5wcm9wcy5pbmRleCA8ICh0aGlzLnByb3BzLm51bUl0ZW1zIC0gMSkgPyBjb25maWcuY3JlYXRlRWxlbWVudCgnbW92ZS1pdGVtLWZvcndhcmQnLCB7ZmllbGQ6IGZpZWxkLCBvbkNsaWNrOiB0aGlzLm9uTW92ZUZvcndhcmR9KSA6IG51bGxcbiAgICApO1xuICB9XG59KTtcbiIsIi8vICMgYXJyYXktaXRlbS12YWx1ZSBjb21wb25lbnRcblxuLypcblJlbmRlciB0aGUgdmFsdWUgb2YgYW4gYXJyYXkgaXRlbS5cbiovXG5cbid1c2Ugc3RyaWN0JztcblxudmFyIFJlYWN0ID0gcmVxdWlyZSgncmVhY3QnKTtcbnZhciBSID0gUmVhY3QuRE9NO1xudmFyIGN4ID0gcmVxdWlyZSgnY2xhc3NuYW1lcycpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcblxuICBkaXNwbGF5TmFtZTogJ0FycmF5SXRlbVZhbHVlJyxcblxuICBtaXhpbnM6IFtyZXF1aXJlKCcuLi8uLi9taXhpbnMvaGVscGVyJyldLFxuXG4gIG9uQ2hhbmdlRmllbGQ6IGZ1bmN0aW9uIChuZXdWYWx1ZSwgaW5mbykge1xuICAgIHRoaXMucHJvcHMub25DaGFuZ2UodGhpcy5wcm9wcy5pbmRleCwgbmV3VmFsdWUsIGluZm8pO1xuICB9LFxuXG4gIHJlbmRlcjogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLnJlbmRlcldpdGhDb25maWcoKTtcbiAgfSxcblxuICByZW5kZXJEZWZhdWx0OiBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGNvbmZpZyA9IHRoaXMucHJvcHMuY29uZmlnO1xuICAgIHZhciBmaWVsZCA9IHRoaXMucHJvcHMuZmllbGQ7XG5cbiAgICByZXR1cm4gUi5kaXYoe2NsYXNzTmFtZTogY3godGhpcy5wcm9wcy5jbGFzc2VzKX0sXG4gICAgICBjb25maWcuY3JlYXRlRmllbGRFbGVtZW50KHtmaWVsZDogZmllbGQsIG9uQ2hhbmdlOiB0aGlzLm9uQ2hhbmdlRmllbGQsIG9uQWN0aW9uOiB0aGlzLm9uQnViYmxlQWN0aW9ufSlcbiAgICApO1xuICB9XG59KTtcbiIsIi8vICMgYXJyYXktaXRlbSBjb21wb25lbnRcblxuLypcblJlbmRlciBhbiBhcnJheSBpdGVtLlxuKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgUmVhY3QgPSByZXF1aXJlKCdyZWFjdCcpO1xudmFyIFIgPSBSZWFjdC5ET007XG52YXIgY3ggPSByZXF1aXJlKCdjbGFzc25hbWVzJyk7XG52YXIgXyA9IHJlcXVpcmUoJy4uLy4uL3VuZGFzaCcpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcblxuICBkaXNwbGF5TmFtZTogJ0FycmF5SXRlbScsXG5cbiAgbWl4aW5zOiBbcmVxdWlyZSgnLi4vLi4vbWl4aW5zL2hlbHBlcicpXSxcblxuICBnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4ge1xuICAgICAgaXNNYXliZVJlbW92aW5nOiBmYWxzZVxuICAgIH07XG4gIH0sXG5cbiAgcmVuZGVyOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMucmVuZGVyV2l0aENvbmZpZygpO1xuICB9LFxuXG4gIG9uTWF5YmVSZW1vdmU6IGZ1bmN0aW9uIChpc01heWJlUmVtb3ZpbmcpIHtcbiAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgIGlzTWF5YmVSZW1vdmluZzogaXNNYXliZVJlbW92aW5nXG4gICAgfSk7XG4gIH0sXG5cbiAgcmVuZGVyRGVmYXVsdDogZnVuY3Rpb24gKCkge1xuICAgIHZhciBjb25maWcgPSB0aGlzLnByb3BzLmNvbmZpZztcbiAgICB2YXIgZmllbGQgPSB0aGlzLnByb3BzLmZpZWxkO1xuXG4gICAgdmFyIGNsYXNzZXMgPSBfLmV4dGVuZCh7fSwgdGhpcy5wcm9wcy5jbGFzc2VzKTtcblxuICAgIGlmICh0aGlzLnN0YXRlLmlzTWF5YmVSZW1vdmluZykge1xuICAgICAgY2xhc3Nlc1snbWF5YmUtcmVtb3ZpbmcnXSA9IHRydWU7XG4gICAgfVxuXG4gICAgbGV0IGFycmF5SXRlbUNvbnRyb2w7XG4gICAgaWYgKCFjb25maWcuZmllbGRJc1JlYWRPbmx5KGZpZWxkKSkge1xuICAgICAgYXJyYXlJdGVtQ29udHJvbCA9IGNvbmZpZy5jcmVhdGVFbGVtZW50KCdhcnJheS1pdGVtLWNvbnRyb2wnLCB7ZmllbGQ6IGZpZWxkLCBpbmRleDogdGhpcy5wcm9wcy5pbmRleCwgbnVtSXRlbXM6IHRoaXMucHJvcHMubnVtSXRlbXMsXG4gICAgICAgIG9uTW92ZTogdGhpcy5wcm9wcy5vbk1vdmUsIG9uUmVtb3ZlOiB0aGlzLnByb3BzLm9uUmVtb3ZlLCBvbk1heWJlUmVtb3ZlOiB0aGlzLm9uTWF5YmVSZW1vdmV9KTtcbiAgICB9XG5cbiAgICByZXR1cm4gUi5kaXYoe2NsYXNzTmFtZTogY3goY2xhc3Nlcyl9LFxuICAgICAgY29uZmlnLmNyZWF0ZUVsZW1lbnQoJ2FycmF5LWl0ZW0tdmFsdWUnLCB7ZmllbGQ6IGZpZWxkLCBpbmRleDogdGhpcy5wcm9wcy5pbmRleCxcbiAgICAgICAgb25DaGFuZ2U6IHRoaXMucHJvcHMub25DaGFuZ2UsIG9uQWN0aW9uOiB0aGlzLm9uQnViYmxlQWN0aW9ufSksXG4gICAgICBhcnJheUl0ZW1Db250cm9sXG4gICAgKTtcbiAgfVxufSk7XG4iLCIvLyAjIENob2ljZVNlY3Rpb25IZWFkZXIgY29tcG9uZW50XG5cbi8qXG5SZW5kZXIgc2VjdGlvbiBoZWFkZXIgaW4gY2hvaWNlcyBkcm9wZG93blxuKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgUmVhY3QgPSByZXF1aXJlKCdyZWFjdC9hZGRvbnMnKTtcbnZhciBjeCA9IHJlcXVpcmUoJ2NsYXNzbmFtZXMnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG5cbiAgZGlzcGxheU5hbWU6ICdDaG9pY2VTZWN0aW9uSGVhZGVyJyxcblxuICBtaXhpbnM6IFtyZXF1aXJlKCcuLi8uLi9taXhpbnMvaGVscGVyJyldLFxuXG4gIHJlbmRlcjogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLnJlbmRlcldpdGhDb25maWcoKTtcbiAgfSxcblxuICByZW5kZXJEZWZhdWx0OiBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGNob2ljZSA9IHRoaXMucHJvcHMuY2hvaWNlO1xuICAgIHJldHVybiA8c3BhbiBjbGFzc05hbWU9e2N4KHRoaXMucHJvcHMuY2xhc3Nlcyl9PntjaG9pY2UubGFiZWx9PC9zcGFuPjtcbiAgfVxufSk7XG4iLCIvLyAjIGNob2ljZXMtc2VhcmNoIGNvbXBvbmVudFxuXG4vKlxuICAgUmVuZGVyIGEgc2VhcmNoIGJveCBmb3IgY2hvaWNlcy5cbiAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbnZhciBSZWFjdCA9IHJlcXVpcmUoJ3JlYWN0L2FkZG9ucycpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcblxuICBkaXNwbGF5TmFtZTogJ0Nob2ljZXNTZWFyY2gnLFxuXG4gIG1peGluczogW3JlcXVpcmUoJy4uLy4uL21peGlucy9oZWxwZXInKV0sXG5cbiAgcmVuZGVyOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMucmVuZGVyV2l0aENvbmZpZygpO1xuICB9LFxuXG4gIHJlbmRlckRlZmF1bHQ6IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gPGRpdiBjbGFzc05hbWU9XCJjaG9pY2VzLXNlYXJjaFwiPlxuICAgICAgPGlucHV0IHR5cGU9XCJ0ZXh0XCIgcGxhY2Vob2xkZXI9XCJTZWFyY2guLi5cIiBvbkNoYW5nZT17dGhpcy5wcm9wcy5vbkNoYW5nZX0vPlxuICAgIDwvZGl2PjtcbiAgfVxuXG59KTtcbiIsIi8vICMgQ2hvaWNlcyBjb21wb25lbnRcblxuLypcblJlbmRlciBjdXN0b21pemVkIChub24tbmF0aXZlKSBkcm9wZG93biBjaG9pY2VzLlxuKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgUmVhY3QgPSByZXF1aXJlKCdyZWFjdC9hZGRvbnMnKTtcbnZhciBSID0gUmVhY3QuRE9NO1xudmFyIF8gPSByZXF1aXJlKCcuLi8uLi91bmRhc2gnKTtcbnZhciBTY3JvbGxMb2NrID0gcmVxdWlyZSgncmVhY3Qtc2Nyb2xsLWxvY2snKTtcblxudmFyIG1hZ2ljQ2hvaWNlUmUgPSAvXlxcL1xcL1xcL1teXFwvXStcXC9cXC9cXC8kLztcblxubW9kdWxlLmV4cG9ydHMgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG5cbiAgZGlzcGxheU5hbWU6ICdDaG9pY2VzJyxcblxuICBtaXhpbnM6IFtcbiAgICByZXF1aXJlKCcuLi8uLi9taXhpbnMvaGVscGVyJyksXG4gICAgLy9wbHVnaW4ucmVxdWlyZSgnbWl4aW4ucmVzaXplJyksXG4gICAgLy9wbHVnaW4ucmVxdWlyZSgnbWl4aW4uc2Nyb2xsJyksXG4gICAgcmVxdWlyZSgnLi4vLi4vbWl4aW5zL2NsaWNrLW91dHNpZGUnKSxcbiAgICBTY3JvbGxMb2NrXG4gIF0sXG5cbiAgZ2V0SW5pdGlhbFN0YXRlOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIG1heEhlaWdodDogbnVsbCxcbiAgICAgIG9wZW46IHRoaXMucHJvcHMub3BlbixcbiAgICAgIHNlYXJjaFN0cmluZzogJydcbiAgICB9O1xuICB9LFxuXG4gIGdldElnbm9yZUNsb3NlTm9kZXM6IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAoIXRoaXMucHJvcHMuaWdub3JlQ2xvc2VOb2Rlcykge1xuICAgICAgcmV0dXJuIFtdO1xuICAgIH1cbiAgICB2YXIgbm9kZXMgPSB0aGlzLnByb3BzLmlnbm9yZUNsb3NlTm9kZXMoKTtcbiAgICBpZiAoIV8uaXNBcnJheShub2RlcykpIHtcbiAgICAgIG5vZGVzID0gW25vZGVzXTtcbiAgICB9XG4gICAgcmV0dXJuIG5vZGVzO1xuICB9LFxuXG4gIGNvbXBvbmVudERpZE1vdW50OiBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5zZXRPbkNsaWNrT3V0c2lkZSgnY29udGFpbmVyJywgZnVuY3Rpb24gKGV2ZW50KSB7XG5cbiAgICAgIC8vIE1ha2Ugc3VyZSB3ZSBkb24ndCBmaW5kIGFueSBub2RlcyB0byBpZ25vcmUuXG4gICAgICBpZiAoIV8uZmluZCh0aGlzLmdldElnbm9yZUNsb3NlTm9kZXMoKSwgZnVuY3Rpb24gKG5vZGUpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuaXNOb2RlSW5zaWRlKGV2ZW50LnRhcmdldCwgbm9kZSk7XG4gICAgICB9LmJpbmQodGhpcykpKSB7XG4gICAgICAgIHRoaXMub25DbG9zZSgpO1xuICAgICAgfVxuICAgIH0uYmluZCh0aGlzKSk7XG5cbiAgICB0aGlzLmFkanVzdFNpemUoKTtcbiAgICB0aGlzLnVwZGF0ZUxpc3RlbmluZ1RvV2luZG93KCk7XG4gIH0sXG5cbiAgY29tcG9uZW50V2lsbFVubW91bnQ6IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLnN0b3BMaXN0ZW5pbmdUb1dpbmRvdygpO1xuICB9LFxuXG4gIG9uU2VsZWN0OiBmdW5jdGlvbiAoY2hvaWNlLCBldmVudCkge1xuICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgb3BlblNlY3Rpb246IG51bGwsXG4gICAgICBzZWFyY2hTdHJpbmc6ICcnXG4gICAgfSk7XG4gICAgdGhpcy5wcm9wcy5vblNlbGVjdChjaG9pY2UudmFsdWUsIGV2ZW50KTtcbiAgfSxcblxuICBvbkNob2ljZUFjdGlvbjogZnVuY3Rpb24gKGNob2ljZSkge1xuICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgb3BlblNlY3Rpb246IG51bGwsXG4gICAgICBzZWFyY2hTdHJpbmc6ICcnXG4gICAgfSk7XG4gICAgdGhpcy5wcm9wcy5vbkNob2ljZUFjdGlvbihjaG9pY2UpO1xuICB9LFxuXG4gIG9uQ2xvc2U6IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgIG9wZW5TZWN0aW9uOiBudWxsLFxuICAgICAgc2VhcmNoU3RyaW5nOiAnJ1xuICAgIH0pO1xuICAgIHRoaXMucHJvcHMub25DbG9zZSgpO1xuICB9LFxuXG4gIC8vIERvaW5nIHNvbWV0aGluZyBhIGxpdHRsZSBjcmF6eS4uLiBtZWFzdXJpbmcgb24gZXZlcnkgZnJhbWUuIE1ha2VzIHRoaXMgc21vb3RoZXIgdGhhbiB1c2luZyBhbiBpbnRlcnZhbC5cbiAgLy8gQ2FuJ3QgdXNpbmcgc2Nyb2xsaW5nIGV2ZW50cywgYmVjYXVzZSB3ZSBtaWdodCBiZSBzY3JvbGxpbmcgaW5zaWRlIGEgY29udGFpbmVyIGluc3RlYWQgb2YgdGhlIGJvZHkuXG4gIC8vIFNob3VsZG4ndCBiZSBhbnkgbW9yZSBjb3N0bHkgdGhhbiBhbmltYXRpb25zIHRob3VnaCwgSSB0aGluay4gQW5kIG9ubHkgb25lIG9mIHRoZXNlIGlzIG9wZW4gYXQgYSB0aW1lLlxuICB1cGRhdGVMaXN0ZW5pbmdUb1dpbmRvdzogZnVuY3Rpb24gKCkge1xuICAgIGlmICh0aGlzLnJlZnMuY2hvaWNlcykge1xuICAgICAgaWYgKCF0aGlzLmlzTGlzdGVuaW5nKSB7XG4gICAgICAgIGNvbnN0IGxpc3RlblRvRnJhbWUgPSAoKSA9PiB7XG4gICAgICAgICAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKCgpID0+IHtcbiAgICAgICAgICAgIHRoaXMuYWRqdXN0U2l6ZSgpO1xuICAgICAgICAgICAgaWYgKHRoaXMuaXNMaXN0ZW5pbmcpIHtcbiAgICAgICAgICAgICAgbGlzdGVuVG9GcmFtZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuICAgICAgICB0aGlzLmlzTGlzdGVuaW5nID0gdHJ1ZTtcbiAgICAgICAgbGlzdGVuVG9GcmFtZSgpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBpZiAodGhpcy5pc0xpc3RlbmluZykge1xuICAgICAgICB0aGlzLnN0b3BMaXN0ZW5pbmdUb1dpbmRvdygpO1xuICAgICAgfVxuICAgIH1cbiAgfSxcblxuICBzdG9wTGlzdGVuaW5nVG9XaW5kb3c6IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAodGhpcy5pc0xpc3RlbmluZykge1xuICAgICAgdGhpcy5pc0xpc3RlbmluZyA9IGZhbHNlO1xuICAgIH1cbiAgfSxcblxuICBhZGp1c3RTaXplOiBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKHRoaXMucmVmcy5jaG9pY2VzKSB7XG4gICAgICB2YXIgbm9kZSA9IHRoaXMucmVmcy5jb250YWluZXIuZ2V0RE9NTm9kZSgpO1xuICAgICAgdmFyIHJlY3QgPSBub2RlLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgICAgdmFyIHRvcCA9IHJlY3QudG9wO1xuICAgICAgdmFyIHdpbmRvd0hlaWdodCA9IHdpbmRvdy5pbm5lckhlaWdodDtcbiAgICAgIHZhciBoZWlnaHQgPSBNYXRoLm1pbih3aW5kb3dIZWlnaHQgLSB0b3AsIHdpbmRvd0hlaWdodCk7XG4gICAgICBpZiAoaGVpZ2h0ICE9PSB0aGlzLnN0YXRlLm1heEhlaWdodCkge1xuICAgICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgICBtYXhIZWlnaHQ6IGhlaWdodFxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG4gIH0sXG5cbiAgY29tcG9uZW50V2lsbFJlY2VpdmVQcm9wczogZnVuY3Rpb24gKG5leHRQcm9wcykge1xuICAgIHZhciBuZXh0U3RhdGUgPSB7XG4gICAgICBvcGVuOiBuZXh0UHJvcHMub3BlblxuICAgIH07XG5cbiAgICB0aGlzLnNldFN0YXRlKG5leHRTdGF0ZSwgZnVuY3Rpb24gKCkge1xuICAgICAgdGhpcy5hZGp1c3RTaXplKCk7XG4gICAgICB0aGlzLnVwZGF0ZUxpc3RlbmluZ1RvV2luZG93KCk7XG4gICAgfS5iaW5kKHRoaXMpKTtcbiAgfSxcblxuICBvbkhlYWRlckNsaWNrOiBmdW5jdGlvbiAoY2hvaWNlKSB7XG4gICAgaWYgKHRoaXMuc3RhdGUub3BlblNlY3Rpb24gPT09IGNob2ljZS5zZWN0aW9uS2V5KSB7XG4gICAgICB0aGlzLnNldFN0YXRlKHtvcGVuU2VjdGlvbjogbnVsbH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLnNldFN0YXRlKHtvcGVuU2VjdGlvbjogY2hvaWNlLnNlY3Rpb25LZXl9LCB0aGlzLmFkanVzdFNpemUpO1xuICAgIH1cbiAgfSxcblxuICBoYXNPbmVTZWN0aW9uOiBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIHNlY3Rpb25IZWFkZXJzID0gdGhpcy5wcm9wcy5jaG9pY2VzLmZpbHRlcihmdW5jdGlvbiAoYykgeyByZXR1cm4gYy5zZWN0aW9uS2V5OyB9KTtcbiAgICByZXR1cm4gc2VjdGlvbkhlYWRlcnMubGVuZ3RoID09PSAxO1xuICB9LFxuXG4gIHZpc2libGVDaG9pY2VzOiBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGNob2ljZXMgPSB0aGlzLnByb3BzLmNob2ljZXM7XG4gICAgdmFyIGNvbmZpZyA9IHRoaXMucHJvcHMuY29uZmlnO1xuXG4gICAgaWYgKGNob2ljZXMgJiYgY2hvaWNlcy5sZW5ndGggPT09IDApIHtcbiAgICAgIHJldHVybiBbe3ZhbHVlOiAnLy8vZW1wdHkvLy8nfV07XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuc3RhdGUuc2VhcmNoU3RyaW5nKSB7XG4gICAgICBjaG9pY2VzID0gY2hvaWNlcy5maWx0ZXIoKGNob2ljZSkgPT4ge1xuICAgICAgICBpZiAoY2hvaWNlLnNlY3Rpb25LZXkpIHtcbiAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gY29uZmlnLmlzU2VhcmNoU3RyaW5nSW5DaG9pY2UodGhpcy5zdGF0ZS5zZWFyY2hTdHJpbmcsIGNob2ljZSk7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBpZiAoIXRoaXMucHJvcHMuaXNBY2NvcmRpb24pIHtcbiAgICAgIHJldHVybiBjaG9pY2VzO1xuICAgIH1cblxuICAgIHZhciBvcGVuU2VjdGlvbiA9IHRoaXMuc3RhdGUub3BlblNlY3Rpb247XG4gICAgdmFyIGFsd2F5c0V4YW5kZWQgPSB0aGlzLmhhc09uZVNlY3Rpb24oKSB8fCB0aGlzLnN0YXRlLnNlYXJjaFN0cmluZztcbiAgICB2YXIgdmlzaWJsZUNob2ljZXMgPSBbXTtcbiAgICB2YXIgaW5TZWN0aW9uO1xuXG4gICAgY2hvaWNlcy5mb3JFYWNoKGZ1bmN0aW9uIChjaG9pY2UpIHtcbiAgICAgIGlmIChjaG9pY2UudmFsdWUgJiYgY2hvaWNlLnZhbHVlLm1hdGNoKG1hZ2ljQ2hvaWNlUmUpKSB7XG4gICAgICAgIHZpc2libGVDaG9pY2VzLnB1c2goY2hvaWNlKTtcbiAgICAgIH1cbiAgICAgIGlmIChjaG9pY2Uuc2VjdGlvbktleSkge1xuICAgICAgICBpblNlY3Rpb24gPSBjaG9pY2Uuc2VjdGlvbktleSA9PT0gb3BlblNlY3Rpb247XG4gICAgICB9XG4gICAgICBpZiAoYWx3YXlzRXhhbmRlZCB8fCBjaG9pY2Uuc2VjdGlvbktleSB8fCBpblNlY3Rpb24pIHtcbiAgICAgICAgdmlzaWJsZUNob2ljZXMucHVzaChjaG9pY2UpO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgcmV0dXJuIHZpc2libGVDaG9pY2VzO1xuICB9LFxuXG4gIHJlbmRlcjogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLnJlbmRlcldpdGhDb25maWcoKTtcbiAgfSxcblxuICBvbkNsaWNrOiBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAvLyBzd2FsbG93IGNsaWNrc1xuICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuICB9LFxuXG4gIG9uQ2hhbmdlU2VhcmNoOiBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgIHNlYXJjaFN0cmluZzogZXZlbnQudGFyZ2V0LnZhbHVlXG4gICAgfSk7XG4gIH0sXG5cbiAgcmVuZGVyRGVmYXVsdDogZnVuY3Rpb24gKCkge1xuICAgIHZhciBjb25maWcgPSB0aGlzLnByb3BzLmNvbmZpZztcblxuICAgIHZhciBjaG9pY2VzID0gdGhpcy52aXNpYmxlQ2hvaWNlcygpO1xuXG4gICAgdmFyIHNlYXJjaCA9IG51bGw7XG5cbiAgICB2YXIgaGFzU2VhcmNoID0gISF0aGlzLnN0YXRlLnNlYXJjaFN0cmluZztcblxuICAgIGlmICghaGFzU2VhcmNoKSB7XG4gICAgICBpZiAodGhpcy5wcm9wcy5jaG9pY2VzLmxlbmd0aCA+IDIpIHtcbiAgICAgICAgaWYgKF8uZmluZChjaG9pY2VzLCBjaG9pY2UgPT4gIWNob2ljZS5hY3Rpb24gJiYgY2hvaWNlLnZhbHVlICE9PSAnLy8vbG9hZGluZy8vLycpKSB7XG4gICAgICAgICAgaGFzU2VhcmNoID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChoYXNTZWFyY2gpIHtcbiAgICAgIHNlYXJjaCA9IGNvbmZpZy5jcmVhdGVFbGVtZW50KCdjaG9pY2VzLXNlYXJjaCcsIHtmaWVsZDogdGhpcy5wcm9wcy5maWVsZCwgb25DaGFuZ2U6IHRoaXMub25DaGFuZ2VTZWFyY2h9KTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5wcm9wcy5vcGVuKSB7XG4gICAgICByZXR1cm4gUi5kaXYoe3JlZjogJ2NvbnRhaW5lcicsIG9uQ2xpY2s6IHRoaXMub25DbGljayxcbiAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lOiAnY2hvaWNlcy1jb250YWluZXInLCBzdHlsZToge1xuICAgICAgICB1c2VyU2VsZWN0OiAnbm9uZScsIFdlYmtpdFVzZXJTZWxlY3Q6ICdub25lJywgcG9zaXRpb246ICdhYnNvbHV0ZScsXG4gICAgICAgIG1heEhlaWdodDogdGhpcy5zdGF0ZS5tYXhIZWlnaHQgPyB0aGlzLnN0YXRlLm1heEhlaWdodCA6IG51bGxcbiAgICAgIH19LFxuICAgICAgICBjb25maWcuY3NzVHJhbnNpdGlvbldyYXBwZXIoXG5cbiAgICAgICAgICBzZWFyY2gsXG5cbiAgICAgICAgICBSLnVsKHtrZXk6ICdjaG9pY2VzJywgcmVmOiAnY2hvaWNlcycsIGNsYXNzTmFtZTogJ2Nob2ljZXMnfSxcblxuICAgICAgICAgICAgY2hvaWNlcy5tYXAoZnVuY3Rpb24gKGNob2ljZSwgaSkge1xuXG4gICAgICAgICAgICAgIHZhciBjaG9pY2VFbGVtZW50ID0gbnVsbDtcblxuICAgICAgICAgICAgICBpZiAoY2hvaWNlLnZhbHVlID09PSAnLy8vbG9hZGluZy8vLycpIHtcbiAgICAgICAgICAgICAgICBjaG9pY2VFbGVtZW50ID0gUi5hKHtocmVmOiAnSmF2YVNjcmlwdCcgKyAnOicsIG9uQ2xpY2s6IHRoaXMub25DbG9zZX0sXG4gICAgICAgICAgICAgICAgICBSLnNwYW4oe2NsYXNzTmFtZTogJ2Nob2ljZS1sYWJlbCd9LFxuICAgICAgICAgICAgICAgICAgICBjb25maWcuY3JlYXRlRWxlbWVudCgnbG9hZGluZy1jaG9pY2UnLCB7ZmllbGQ6IHRoaXMucHJvcHMuZmllbGR9KVxuICAgICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgIH0gZWxzZSBpZiAoY2hvaWNlLnZhbHVlID09PSAnLy8vZW1wdHkvLy8nKSB7XG4gICAgICAgICAgICAgICAgY2hvaWNlRWxlbWVudCA9IFIuYSh7aHJlZjogJ0phdmFTY3JpcHQnICsgJzonLCBvbkNsaWNrOiB0aGlzLm9uQ2xvc2V9LFxuICAgICAgICAgICAgICAgICAgUi5zcGFuKHtjbGFzc05hbWU6ICdjaG9pY2UtbGFiZWwnfSxcbiAgICAgICAgICAgICAgICAgICAgJ05vIGNob2ljZXMgYXZhaWxhYmxlLidcbiAgICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICB9IGVsc2UgaWYgKGNob2ljZS5hY3Rpb24pIHtcbiAgICAgICAgICAgICAgICB2YXIgbGFiZWxDbGFzc2VzID0gJ2Nob2ljZS1sYWJlbCAnICsgY2hvaWNlLmFjdGlvbjtcblxuICAgICAgICAgICAgICAgIGNob2ljZUVsZW1lbnQgPSBSLmEoe2hyZWY6ICdKYXZhU2NyaXB0JyArICc6Jywgb25DbGljazogdGhpcy5vbkNob2ljZUFjdGlvbi5iaW5kKHRoaXMsIGNob2ljZSl9LFxuICAgICAgICAgICAgICAgICAgUi5zcGFuKHtjbGFzc05hbWU6IGxhYmVsQ2xhc3Nlc30sXG4gICAgICAgICAgICAgICAgICAgIGNob2ljZS5sYWJlbCB8fCB0aGlzLnByb3BzLmNvbmZpZy5hY3Rpb25DaG9pY2VMYWJlbChjaG9pY2UuYWN0aW9uKVxuICAgICAgICAgICAgICAgICAgKSxcbiAgICAgICAgICAgICAgICAgIHRoaXMucHJvcHMuY29uZmlnLmNyZWF0ZUVsZW1lbnQoJ2Nob2ljZS1hY3Rpb24tc2FtcGxlJywge2FjdGlvbjogY2hvaWNlLmFjdGlvbiwgY2hvaWNlOiBjaG9pY2V9KVxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgIH0gZWxzZSBpZiAoY2hvaWNlLnNlY3Rpb25LZXkpIHtcbiAgICAgICAgICAgICAgICBjaG9pY2VFbGVtZW50ID0gUi5hKHtocmVmOiAnSmF2YVNjcmlwdCcgKyAnOicsIG9uQ2xpY2s6IHRoaXMub25IZWFkZXJDbGljay5iaW5kKHRoaXMsIGNob2ljZSl9LFxuICAgICAgICAgICAgICAgICAgY29uZmlnLmNyZWF0ZUVsZW1lbnQoJ2Nob2ljZS1zZWN0aW9uLWhlYWRlcicsIHtjaG9pY2U6IGNob2ljZX0pXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBjaG9pY2VFbGVtZW50ID0gUi5hKHtocmVmOiAnSmF2YVNjcmlwdCcgKyAnOicsIG9uQ2xpY2s6IHRoaXMub25TZWxlY3QuYmluZCh0aGlzLCBjaG9pY2UpfSxcbiAgICAgICAgICAgICAgICAgIFIuc3Bhbih7Y2xhc3NOYW1lOiAnY2hvaWNlLWxhYmVsJ30sXG4gICAgICAgICAgICAgICAgICAgIGNob2ljZS5sYWJlbFxuICAgICAgICAgICAgICAgICAgKSxcbiAgICAgICAgICAgICAgICAgIFIuc3Bhbih7Y2xhc3NOYW1lOiAnY2hvaWNlLXNhbXBsZSd9LFxuICAgICAgICAgICAgICAgICAgICBjaG9pY2Uuc2FtcGxlXG4gICAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgIHJldHVybiBSLmxpKHtrZXk6IGksIGNsYXNzTmFtZTogJ2Nob2ljZSd9LFxuICAgICAgICAgICAgICAgIGNob2ljZUVsZW1lbnRcbiAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH0uYmluZCh0aGlzKSlcbiAgICAgICAgICApXG4gICAgICAgIClcbiAgICAgICk7XG4gICAgfVxuXG4gICAgLy8gbm90IG9wZW5cbiAgICByZXR1cm4gbnVsbDtcbiAgfVxufSk7XG4iLCIvLyAjIGZpZWxkLXRlbXBsYXRlLWNob2ljZXMgY29tcG9uZW50XG5cbi8qXG5HaXZlIGEgbGlzdCBvZiBjaG9pY2VzIG9mIGl0ZW0gdHlwZXMgdG8gY3JlYXRlIGFzIGNoaWxkcmVuIG9mIGFuIGZpZWxkLlxuKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgUmVhY3QgPSByZXF1aXJlKCdyZWFjdC9hZGRvbnMnKTtcbnZhciBSID0gUmVhY3QuRE9NO1xudmFyIGN4ID0gcmVxdWlyZSgnY2xhc3NuYW1lcycpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcblxuICBkaXNwbGF5TmFtZTogJ0ZpZWxkVGVtcGxhdGVDaG9pY2VzJyxcblxuICBtaXhpbnM6IFtyZXF1aXJlKCcuLi8uLi9taXhpbnMvaGVscGVyJyldLFxuXG4gIG9uQ2hhbmdlOiBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICB0aGlzLnByb3BzLm9uU2VsZWN0KHBhcnNlSW50KGV2ZW50LnRhcmdldC52YWx1ZSkpO1xuICB9LFxuXG4gIHJlbmRlcjogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLnJlbmRlcldpdGhDb25maWcoKTtcbiAgfSxcblxuICByZW5kZXJEZWZhdWx0OiBmdW5jdGlvbiAoKSB7XG5cbiAgICB2YXIgY29uZmlnID0gdGhpcy5wcm9wcy5jb25maWc7XG4gICAgdmFyIGZpZWxkID0gdGhpcy5wcm9wcy5maWVsZDtcblxuICAgIHZhciBmaWVsZFRlbXBsYXRlcyA9IGNvbmZpZy5maWVsZEl0ZW1GaWVsZFRlbXBsYXRlcyhmaWVsZCk7XG5cbiAgICB2YXIgdHlwZUNob2ljZXMgPSBudWxsO1xuICAgIGlmIChmaWVsZFRlbXBsYXRlcy5sZW5ndGggPiAxKSB7XG4gICAgICB0eXBlQ2hvaWNlcyA9IFIuc2VsZWN0KHtjbGFzc05hbWU6IGN4KHRoaXMucHJvcHMuY2xhc3NlcyksIHZhbHVlOiB0aGlzLmZpZWxkVGVtcGxhdGVJbmRleCwgb25DaGFuZ2U6IHRoaXMub25DaGFuZ2V9LFxuICAgICAgZmllbGRUZW1wbGF0ZXMubWFwKGZ1bmN0aW9uIChmaWVsZFRlbXBsYXRlLCBpKSB7XG4gICAgICAgIHJldHVybiBSLm9wdGlvbih7a2V5OiBpLCB2YWx1ZTogaX0sIGZpZWxkVGVtcGxhdGUubGFiZWwgfHwgaSk7XG4gICAgICB9KSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHR5cGVDaG9pY2VzID8gdHlwZUNob2ljZXMgOiBSLnNwYW4obnVsbCk7XG4gIH1cbn0pO1xuIiwiLy8gIyBmaWVsZCBjb21wb25lbnRcblxuLypcblVzZWQgYnkgYW55IGZpZWxkcyB0byBwdXQgdGhlIGxhYmVsIGFuZCBoZWxwIHRleHQgYXJvdW5kIHRoZSBmaWVsZC5cbiovXG5cbid1c2Ugc3RyaWN0JztcblxudmFyIFJlYWN0ID0gcmVxdWlyZSgncmVhY3QvYWRkb25zJyk7XG52YXIgUiA9IFJlYWN0LkRPTTtcbnZhciBfID0gcmVxdWlyZSgnLi4vLi4vdW5kYXNoJyk7XG52YXIgY3ggPSByZXF1aXJlKCdjbGFzc25hbWVzJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXG4gIGRpc3BsYXlOYW1lOiAnRmllbGQnLFxuXG4gIG1peGluczogW3JlcXVpcmUoJy4uLy4uL21peGlucy9oZWxwZXInKV0sXG5cbiAgZ2V0SW5pdGlhbFN0YXRlOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGNvbGxhcHNlZDogdGhpcy5wcm9wcy5jb25maWcuZmllbGRJc0NvbGxhcHNlZCh0aGlzLnByb3BzLmZpZWxkKSA/IHRydWUgOiBmYWxzZVxuICAgIH07XG4gIH0sXG5cbiAgb25DbGlja0xhYmVsOiBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICBjb2xsYXBzZWQ6ICF0aGlzLnN0YXRlLmNvbGxhcHNlZFxuICAgIH0pO1xuICB9LFxuXG4gIHJlbmRlcjogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLnJlbmRlcldpdGhDb25maWcoKTtcbiAgfSxcblxuICByZW5kZXJEZWZhdWx0OiBmdW5jdGlvbiAoKSB7XG5cbiAgICB2YXIgY29uZmlnID0gdGhpcy5wcm9wcy5jb25maWc7XG5cbiAgICBpZiAodGhpcy5wcm9wcy5wbGFpbikge1xuICAgICAgcmV0dXJuIHRoaXMucHJvcHMuY2hpbGRyZW47XG4gICAgfVxuXG4gICAgdmFyIGZpZWxkID0gdGhpcy5wcm9wcy5maWVsZDtcblxuICAgIHZhciBpbmRleCA9IHRoaXMucHJvcHMuaW5kZXg7XG4gICAgaWYgKCFfLmlzTnVtYmVyKGluZGV4KSkge1xuICAgICAgdmFyIGtleSA9IHRoaXMucHJvcHMuZmllbGQua2V5O1xuICAgICAgaW5kZXggPSBfLmlzTnVtYmVyKGtleSkgPyBrZXkgOiB1bmRlZmluZWQ7XG4gICAgfVxuXG4gICAgdmFyIGNsYXNzZXMgPSBfLmV4dGVuZCh7fSwgdGhpcy5wcm9wcy5jbGFzc2VzKTtcblxuICAgIHZhciBlcnJvcnMgPSBjb25maWcuZmllbGRFcnJvcnMoZmllbGQpO1xuXG4gICAgZXJyb3JzLmZvckVhY2goZnVuY3Rpb24gKGVycm9yKSB7XG4gICAgICBjbGFzc2VzWyd2YWxpZGF0aW9uLWVycm9yLScgKyBlcnJvci50eXBlXSA9IHRydWU7XG4gICAgfSk7XG5cbiAgICBpZiAoY29uZmlnLmZpZWxkSXNSZXF1aXJlZChmaWVsZCkpIHtcbiAgICAgIGNsYXNzZXMucmVxdWlyZWQgPSB0cnVlO1xuICAgIH0gZWxzZSB7XG4gICAgICBjbGFzc2VzLm9wdGlvbmFsID0gdHJ1ZTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5pc1JlYWRPbmx5KCkpIHtcbiAgICAgIGNsYXNzZXMucmVhZG9ubHkgPSB0cnVlO1xuICAgIH1cblxuICAgIHJldHVybiBSLmRpdih7Y2xhc3NOYW1lOiBjeChjbGFzc2VzKSwgc3R5bGU6IHtkaXNwbGF5OiAoZmllbGQuaGlkZGVuID8gJ25vbmUnIDogJycpfX0sXG4gICAgICBjb25maWcuY3JlYXRlRWxlbWVudCgnbGFiZWwnLCB7XG4gICAgICAgIGNvbmZpZzogY29uZmlnLCBmaWVsZDogZmllbGQsXG4gICAgICAgIGluZGV4OiBpbmRleCwgb25DbGljazogY29uZmlnLmZpZWxkSXNDb2xsYXBzaWJsZShmaWVsZCkgPyB0aGlzLm9uQ2xpY2tMYWJlbCA6IG51bGxcbiAgICAgIH0pLFxuICAgICAgY29uZmlnLmNzc1RyYW5zaXRpb25XcmFwcGVyKFxuICAgICAgICB0aGlzLnN0YXRlLmNvbGxhcHNlZCA/IFtdIDogW1xuICAgICAgICAgIGNvbmZpZy5jcmVhdGVFbGVtZW50KCdoZWxwJywge1xuICAgICAgICAgICAgY29uZmlnOiBjb25maWcsIGZpZWxkOiBmaWVsZCxcbiAgICAgICAgICAgIGtleTogJ2hlbHAnXG4gICAgICAgICAgfSksXG4gICAgICAgICAgdGhpcy5wcm9wcy5jaGlsZHJlblxuICAgICAgICBdXG4gICAgICApXG4gICAgKTtcbiAgfVxufSk7XG4iLCIvLyAjIGhlbHAgY29tcG9uZW50XG5cbi8qXG5KdXN0IHRoZSBoZWxwIHRleHQgYmxvY2suXG4qL1xuXG4ndXNlIHN0cmljdCc7XG5cbnZhciBSZWFjdCA9IHJlcXVpcmUoJ3JlYWN0L2FkZG9ucycpO1xudmFyIFIgPSBSZWFjdC5ET007XG52YXIgY3ggPSByZXF1aXJlKCdjbGFzc25hbWVzJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXG4gIGRpc3BsYXlOYW1lOiAnSGVscCcsXG5cbiAgbWl4aW5zOiBbcmVxdWlyZSgnLi4vLi4vbWl4aW5zL2hlbHBlcicpXSxcblxuICByZW5kZXI6IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpcy5yZW5kZXJXaXRoQ29uZmlnKCk7XG4gIH0sXG5cbiAgcmVuZGVyRGVmYXVsdDogZnVuY3Rpb24gKCkge1xuXG4gICAgdmFyIGhlbHBUZXh0ID0gdGhpcy5wcm9wcy5jb25maWcuZmllbGRIZWxwVGV4dCh0aGlzLnByb3BzLmZpZWxkKTtcblxuICAgIHJldHVybiBoZWxwVGV4dCA/XG4gICAgICBSLmRpdih7Y2xhc3NOYW1lOiBjeCh0aGlzLnByb3BzLmNsYXNzZXMpLCBkYW5nZXJvdXNseVNldElubmVySFRNTDoge19faHRtbDogaGVscFRleHR9fSkgOlxuICAgICAgUi5zcGFuKG51bGwpO1xuICB9XG59KTtcbiIsIi8vICMgYnV0dG9uIGNvbXBvbmVudFxuXG4vKlxuICBDbGlja2FibGUgJ2J1dHRvbidcbiovXG5cbid1c2Ugc3RyaWN0JztcblxudmFyIFJlYWN0ID0gcmVxdWlyZSgncmVhY3QvYWRkb25zJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXG4gIGRpc3BsYXlOYW1lOiAnSW5zZXJ0QnV0dG9uJyxcblxuICBwcm9wVHlwZXM6IHtcbiAgICBvbkNsaWNrOiBSZWFjdC5Qcm9wVHlwZXMuZnVuYy5pc1JlcXVpcmVkLFxuICAgIHJlZjogUmVhY3QuUHJvcFR5cGVzLnN0cmluZ1xuICB9LFxuXG4gIG1peGluczogW3JlcXVpcmUoJy4uLy4uL21peGlucy9oZWxwZXInKV0sXG5cbiAgcmVuZGVyOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMucmVuZGVyV2l0aENvbmZpZygpO1xuICB9LFxuXG4gIHJlbmRlckRlZmF1bHQ6IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gKFxuICAgICAgPGEgcmVmPXt0aGlzLnByb3BzLnJlZn0gaHJlZj17J0phdmFTY3JpcHQnICsgJzonfSBvbkNsaWNrPXt0aGlzLnByb3BzLm9uQ2xpY2t9PlxuICAgICAgICB7dGhpcy5wcm9wcy5jaGlsZHJlbn1cbiAgICAgIDwvYT5cbiAgICApO1xuICB9XG5cbn0pO1xuIiwiLy8gIyBsYWJlbCBjb21wb25lbnRcblxuLypcbkp1c3QgdGhlIGxhYmVsIGZvciBhIGZpZWxkLlxuKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgUmVhY3QgPSByZXF1aXJlKCdyZWFjdC9hZGRvbnMnKTtcbnZhciBSID0gUmVhY3QuRE9NO1xudmFyIGN4ID0gcmVxdWlyZSgnY2xhc3NuYW1lcycpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcblxuICBkaXNwbGF5TmFtZTogJ0xhYmVsJyxcblxuICBtaXhpbnM6IFtyZXF1aXJlKCcuLi8uLi9taXhpbnMvaGVscGVyJyldLFxuXG4gIHJlbmRlcjogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLnJlbmRlcldpdGhDb25maWcoKTtcbiAgfSxcblxuICByZW5kZXJEZWZhdWx0OiBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGNvbmZpZyA9IHRoaXMucHJvcHMuY29uZmlnO1xuICAgIHZhciBmaWVsZCA9IHRoaXMucHJvcHMuZmllbGQ7XG5cbiAgICB2YXIgZmllbGRMYWJlbCA9IGNvbmZpZy5maWVsZExhYmVsKGZpZWxkKTtcblxuICAgIHZhciBsYWJlbCA9IG51bGw7XG4gICAgaWYgKHR5cGVvZiB0aGlzLnByb3BzLmluZGV4ID09PSAnbnVtYmVyJykge1xuICAgICAgbGFiZWwgPSAnJyArICh0aGlzLnByb3BzLmluZGV4ICsgMSkgKyAnLic7XG4gICAgICBpZiAoZmllbGRMYWJlbCkge1xuICAgICAgICBsYWJlbCA9IGxhYmVsICsgJyAnICsgZmllbGRMYWJlbDtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoZmllbGRMYWJlbCB8fCBsYWJlbCkge1xuICAgICAgdmFyIHRleHQgPSBsYWJlbCB8fCBmaWVsZExhYmVsO1xuICAgICAgaWYgKHRoaXMucHJvcHMub25DbGljaykge1xuICAgICAgICB0ZXh0ID0gUi5hKHtocmVmOiAnSmF2YVNjcmlwdCcgKyAnOicsIG9uQ2xpY2s6IHRoaXMucHJvcHMub25DbGlja30sIHRleHQpO1xuICAgICAgfVxuICAgICAgbGFiZWwgPSBSLmxhYmVsKHt9LCB0ZXh0KTtcbiAgICB9XG5cbiAgICByZXR1cm4gUi5kaXYoe1xuICAgICAgY2xhc3NOYW1lOiBjeCh0aGlzLnByb3BzLmNsYXNzZXMpXG4gICAgfSxcbiAgICAgIGxhYmVsLFxuICAgICAgJyAnLFxuICAgICAgUi5zcGFuKHtjbGFzc05hbWU6IGNvbmZpZy5maWVsZElzUmVxdWlyZWQoZmllbGQpID8gJ3JlcXVpcmVkLXRleHQnIDogJ25vdC1yZXF1aXJlZC10ZXh0J30pXG4gICAgKTtcbiAgfVxufSk7XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBSZWFjdCA9IHJlcXVpcmUoJ3JlYWN0L2FkZG9ucycpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcblxuICBkaXNwbGF5TmFtZTogJ0xvYWRpbmdDaG9pY2UnLFxuXG4gIG1peGluczogW3JlcXVpcmUoJy4uLy4uL21peGlucy9oZWxwZXInKV0sXG5cbiAgcmVuZGVyOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMucmVuZGVyV2l0aENvbmZpZygpO1xuICB9LFxuXG4gIHJlbmRlckRlZmF1bHQ6IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gKFxuICAgICAgPHNwYW4+TG9hZGluZyBjaG9pY2VzLi4uPC9zcGFuPlxuICAgICk7XG4gIH1cblxufSk7XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBSZWFjdCA9IHJlcXVpcmUoJ3JlYWN0L2FkZG9ucycpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcblxuICBkaXNwbGF5TmFtZTogJ0xvYWRpbmdDaG9pY2VzJyxcblxuICBtaXhpbnM6IFtyZXF1aXJlKCcuLi8uLi9taXhpbnMvaGVscGVyJyldLFxuXG4gIHJlbmRlcjogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLnJlbmRlcldpdGhDb25maWcoKTtcbiAgfSxcblxuICByZW5kZXJEZWZhdWx0OiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIChcbiAgICAgIDxkaXY+TG9hZGluZyBjaG9pY2VzLi4uPC9kaXY+XG4gICAgKTtcbiAgfVxuXG59KTtcbiIsIi8vICMgbW92ZS1pdGVtLWJhY2sgY29tcG9uZW50XG5cbi8qXG5CdXR0b24gdG8gbW92ZSBhbiBpdGVtIGJhY2t3YXJkcyBpbiBsaXN0LlxuKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgUmVhY3QgPSByZXF1aXJlKCdyZWFjdC9hZGRvbnMnKTtcbnZhciBSID0gUmVhY3QuRE9NO1xudmFyIGN4ID0gcmVxdWlyZSgnY2xhc3NuYW1lcycpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcblxuICBkaXNwbGF5TmFtZTogJ01vdmVJdGVtQmFjaycsXG5cbiAgbWl4aW5zOiBbcmVxdWlyZSgnLi4vLi4vbWl4aW5zL2hlbHBlcicpXSxcblxuICBnZXREZWZhdWx0UHJvcHM6IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4ge1xuICAgICAgbGFiZWw6ICdbdXBdJ1xuICAgIH07XG4gIH0sXG5cbiAgcmVuZGVyOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMucmVuZGVyV2l0aENvbmZpZygpO1xuICB9LFxuXG4gIHJlbmRlckRlZmF1bHQ6IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gUi5zcGFuKHtjbGFzc05hbWU6IGN4KHRoaXMucHJvcHMuY2xhc3NlcyksIG9uQ2xpY2s6IHRoaXMucHJvcHMub25DbGlja30sIHRoaXMucHJvcHMubGFiZWwpO1xuICB9XG59KTtcbiIsIi8vICMgbW92ZS1pdGVtLWZvcndhcmQgY29tcG9uZW50XG5cbi8qXG5CdXR0b24gdG8gbW92ZSBhbiBpdGVtIGZvcndhcmQgaW4gYSBsaXN0LlxuKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgUmVhY3QgPSByZXF1aXJlKCdyZWFjdC9hZGRvbnMnKTtcbnZhciBSID0gUmVhY3QuRE9NO1xudmFyIGN4ID0gcmVxdWlyZSgnY2xhc3NuYW1lcycpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcblxuICBkaXNwbGF5TmFtZTogJ01vdmVJdGVtRm9yd2FyZCcsXG5cbiAgbWl4aW5zOiBbcmVxdWlyZSgnLi4vLi4vbWl4aW5zL2hlbHBlcicpXSxcblxuICBnZXREZWZhdWx0UHJvcHM6IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4ge1xuICAgICAgbGFiZWw6ICdbZG93bl0nXG4gICAgfTtcbiAgfSxcblxuICByZW5kZXI6IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpcy5yZW5kZXJXaXRoQ29uZmlnKCk7XG4gIH0sXG5cbiAgcmVuZGVyRGVmYXVsdDogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiBSLnNwYW4oe2NsYXNzTmFtZTogY3godGhpcy5wcm9wcy5jbGFzc2VzKSwgb25DbGljazogdGhpcy5wcm9wcy5vbkNsaWNrfSwgdGhpcy5wcm9wcy5sYWJlbCk7XG4gIH1cbn0pO1xuIiwiLy8gIyBvYmplY3QtY29udHJvbCBjb21wb25lbnRcblxuLypcblJlbmRlciB0aGUgaXRlbSB0eXBlIGNob2ljZXMgYW5kIHRoZSBhZGQgYnV0dG9uLlxuKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgUmVhY3QgPSByZXF1aXJlKCdyZWFjdC9hZGRvbnMnKTtcbnZhciBSID0gUmVhY3QuRE9NO1xudmFyIGN4ID0gcmVxdWlyZSgnY2xhc3NuYW1lcycpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcblxuICBkaXNwbGF5TmFtZTogJ09iamVjdENvbnRyb2wnLFxuXG4gIG1peGluczogW3JlcXVpcmUoJy4uLy4uL21peGlucy9oZWxwZXInKV0sXG5cbiAgZ2V0SW5pdGlhbFN0YXRlOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGZpZWxkVGVtcGxhdGVJbmRleDogMFxuICAgIH07XG4gIH0sXG5cbiAgb25TZWxlY3Q6IGZ1bmN0aW9uIChpbmRleCkge1xuICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgZmllbGRUZW1wbGF0ZUluZGV4OiBpbmRleFxuICAgIH0pO1xuICB9LFxuXG4gIG9uQXBwZW5kOiBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5wcm9wcy5vbkFwcGVuZCh0aGlzLnN0YXRlLmZpZWxkVGVtcGxhdGVJbmRleCk7XG4gIH0sXG5cbiAgcmVuZGVyOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMucmVuZGVyV2l0aENvbmZpZygpO1xuICB9LFxuXG4gIHJlbmRlckRlZmF1bHQ6IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgY29uZmlnID0gdGhpcy5wcm9wcy5jb25maWc7XG4gICAgdmFyIGZpZWxkID0gdGhpcy5wcm9wcy5maWVsZDtcbiAgICB2YXIgZmllbGRUZW1wbGF0ZXMgPSBjb25maWcuZmllbGRDaGlsZEZpZWxkVGVtcGxhdGVzKGZpZWxkKTtcblxuICAgIHZhciB0eXBlQ2hvaWNlcyA9IG51bGw7XG5cbiAgICBpZiAoZmllbGRUZW1wbGF0ZXMubGVuZ3RoID4gMCkge1xuICAgICAgdHlwZUNob2ljZXMgPSBjb25maWcuY3JlYXRlRWxlbWVudCgnZmllbGQtdGVtcGxhdGUtY2hvaWNlcycsIHtcbiAgICAgICAgZmllbGQ6IGZpZWxkLFxuICAgICAgICBmaWVsZFRlbXBsYXRlSW5kZXg6IHRoaXMuc3RhdGUuZmllbGRUZW1wbGF0ZUluZGV4LCBvblNlbGVjdDogdGhpcy5vblNlbGVjdFxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIFIuZGl2KHtjbGFzc05hbWU6IGN4KHRoaXMucHJvcHMuY2xhc3Nlcyl9LFxuICAgICAgdHlwZUNob2ljZXMsICcgJyxcbiAgICAgIGNvbmZpZy5jcmVhdGVFbGVtZW50KCdhZGQtaXRlbScsIHtvbkNsaWNrOiB0aGlzLm9uQXBwZW5kfSlcbiAgICApO1xuICB9XG59KTtcbiIsIi8vICMgb2JqZWN0LWl0ZW0tY29udHJvbCBjb21wb25lbnRcblxuLypcblJlbmRlciB0aGUgcmVtb3ZlIGJ1dHRvbnMgZm9yIGFuIG9iamVjdCBpdGVtLlxuKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgUmVhY3QgPSByZXF1aXJlKCdyZWFjdCcpO1xudmFyIFIgPSBSZWFjdC5ET007XG52YXIgY3ggPSByZXF1aXJlKCdjbGFzc25hbWVzJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXG4gIGRpc3BsYXlOYW1lOiAnT2JqZWN0SXRlbUNvbnRyb2wnLFxuXG4gIG1peGluczogW3JlcXVpcmUoJy4uLy4uL21peGlucy9oZWxwZXInKV0sXG5cbiAgb25SZW1vdmU6IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLnByb3BzLm9uUmVtb3ZlKHRoaXMucHJvcHMuaXRlbUtleSk7XG4gIH0sXG5cbiAgcmVuZGVyOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMucmVuZGVyV2l0aENvbmZpZygpO1xuICB9LFxuXG4gIHJlbmRlckRlZmF1bHQ6IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgY29uZmlnID0gdGhpcy5wcm9wcy5jb25maWc7XG4gICAgdmFyIGZpZWxkID0gdGhpcy5wcm9wcy5maWVsZDtcblxuICAgIHJldHVybiBSLmRpdih7Y2xhc3NOYW1lOiBjeCh0aGlzLnByb3BzLmNsYXNzZXMpfSxcbiAgICAgIGNvbmZpZy5jcmVhdGVFbGVtZW50KCdyZW1vdmUtaXRlbScsIHtmaWVsZDogZmllbGQsIG9uQ2xpY2s6IHRoaXMub25SZW1vdmV9KVxuICAgICk7XG4gIH1cbn0pO1xuIiwiLy8gIyBvYmplY3QtaXRlbS1rZXkgY29tcG9uZW50XG5cbi8qXG5SZW5kZXIgYW4gb2JqZWN0IGl0ZW0ga2V5IGVkaXRvci5cbiovXG5cbid1c2Ugc3RyaWN0JztcblxudmFyIFJlYWN0ID0gcmVxdWlyZSgncmVhY3QnKTtcbnZhciBSID0gUmVhY3QuRE9NO1xudmFyIGN4ID0gcmVxdWlyZSgnY2xhc3NuYW1lcycpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcblxuICBkaXNwbGF5TmFtZTogJ09iamVjdEl0ZW1LZXknLFxuXG4gIG1peGluczogW3JlcXVpcmUoJy4uLy4uL21peGlucy9oZWxwZXInKV0sXG5cbiAgb25DaGFuZ2U6IGZ1bmN0aW9uIChldmVudCkge1xuICAgIHRoaXMucHJvcHMub25DaGFuZ2UoZXZlbnQudGFyZ2V0LnZhbHVlKTtcbiAgfSxcblxuICByZW5kZXI6IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpcy5yZW5kZXJXaXRoQ29uZmlnKCk7XG4gIH0sXG5cbiAgcmVuZGVyRGVmYXVsdDogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiBSLmlucHV0KHtcbiAgICAgIGNsYXNzTmFtZTogY3godGhpcy5wcm9wcy5jbGFzc2VzKSxcbiAgICAgIHR5cGU6ICd0ZXh0JyxcbiAgICAgIHZhbHVlOiB0aGlzLnByb3BzLmRpc3BsYXlLZXksXG4gICAgICBvbkNoYW5nZTogdGhpcy5vbkNoYW5nZSxcbiAgICAgIG9uRm9jdXM6IHRoaXMub25Gb2N1c0FjdGlvbixcbiAgICAgIG9uQmx1cjogdGhpcy5vbkJsdXJBY3Rpb25cbiAgICB9KTtcbiAgfVxufSk7XG4iLCIvLyAjIG9iamVjdC1pdGVtLXZhbHVlIGNvbXBvbmVudFxuXG4vKlxuUmVuZGVyIHRoZSB2YWx1ZSBvZiBhbiBvYmplY3QgaXRlbS5cbiovXG5cbid1c2Ugc3RyaWN0JztcblxudmFyIFJlYWN0ID0gcmVxdWlyZSgncmVhY3QnKTtcbnZhciBSID0gUmVhY3QuRE9NO1xudmFyIGN4ID0gcmVxdWlyZSgnY2xhc3NuYW1lcycpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcblxuICBkaXNwbGF5TmFtZTogJ09iamVjdEl0ZW1WYWx1ZScsXG5cbiAgbWl4aW5zOiBbcmVxdWlyZSgnLi4vLi4vbWl4aW5zL2hlbHBlcicpXSxcblxuICBvbkNoYW5nZUZpZWxkOiBmdW5jdGlvbiAobmV3VmFsdWUsIGluZm8pIHtcbiAgICB0aGlzLnByb3BzLm9uQ2hhbmdlKHRoaXMucHJvcHMuaXRlbUtleSwgbmV3VmFsdWUsIGluZm8pO1xuICB9LFxuXG4gIHJlbmRlcjogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLnJlbmRlcldpdGhDb25maWcoKTtcbiAgfSxcblxuICByZW5kZXJEZWZhdWx0OiBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGNvbmZpZyA9IHRoaXMucHJvcHMuY29uZmlnO1xuICAgIHZhciBmaWVsZCA9IHRoaXMucHJvcHMuZmllbGQ7XG5cbiAgICByZXR1cm4gUi5kaXYoe2NsYXNzTmFtZTogY3godGhpcy5wcm9wcy5jbGFzc2VzKX0sXG4gICAgICBjb25maWcuY3JlYXRlRmllbGRFbGVtZW50KHtmaWVsZDogZmllbGQsIG9uQ2hhbmdlOiB0aGlzLm9uQ2hhbmdlRmllbGQsIHBsYWluOiB0cnVlLCBvbkFjdGlvbjogdGhpcy5vbkJ1YmJsZUFjdGlvbn0pXG4gICAgKTtcbiAgfVxufSk7XG4iLCIvLyAjIG9iamVjdC1pdGVtIGNvbXBvbmVudFxuXG4vKlxuUmVuZGVyIGFuIG9iamVjdCBpdGVtLlxuKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgUmVhY3QgPSByZXF1aXJlKCdyZWFjdCcpO1xudmFyIFIgPSBSZWFjdC5ET007XG52YXIgY3ggPSByZXF1aXJlKCdjbGFzc25hbWVzJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXG4gIGRpc3BsYXlOYW1lOiAnT2JqZWN0SXRlbScsXG5cbiAgbWl4aW5zOiBbcmVxdWlyZSgnLi4vLi4vbWl4aW5zL2hlbHBlcicpXSxcblxuICBvbkNoYW5nZUtleTogZnVuY3Rpb24gKG5ld0tleSkge1xuICAgIHRoaXMucHJvcHMub25Nb3ZlKHRoaXMucHJvcHMuaXRlbUtleSwgbmV3S2V5KTtcbiAgfSxcblxuICByZW5kZXI6IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpcy5yZW5kZXJXaXRoQ29uZmlnKCk7XG4gIH0sXG5cbiAgcmVuZGVyRGVmYXVsdDogZnVuY3Rpb24gKCkge1xuICAgIHZhciBjb25maWcgPSB0aGlzLnByb3BzLmNvbmZpZztcbiAgICB2YXIgZmllbGQgPSB0aGlzLnByb3BzLmZpZWxkO1xuXG4gICAgcmV0dXJuIFIuZGl2KHtjbGFzc05hbWU6IGN4KHRoaXMucHJvcHMuY2xhc3Nlcyl9LFxuICAgICAgY29uZmlnLmNyZWF0ZUVsZW1lbnQoJ29iamVjdC1pdGVtLWtleScsIHtmaWVsZDogZmllbGQsIG9uQ2hhbmdlOiB0aGlzLm9uQ2hhbmdlS2V5LCBvbkFjdGlvbjogdGhpcy5vbkJ1YmJsZUFjdGlvbiwgZGlzcGxheUtleTogdGhpcy5wcm9wcy5kaXNwbGF5S2V5LCBpdGVtS2V5OiB0aGlzLnByb3BzLml0ZW1LZXl9KSxcbiAgICAgIGNvbmZpZy5jcmVhdGVFbGVtZW50KCdvYmplY3QtaXRlbS12YWx1ZScsIHtmaWVsZDogZmllbGQsIG9uQ2hhbmdlOiB0aGlzLnByb3BzLm9uQ2hhbmdlLCBvbkFjdGlvbjogdGhpcy5vbkJ1YmJsZUFjdGlvbiwgaXRlbUtleTogdGhpcy5wcm9wcy5pdGVtS2V5fSksXG4gICAgICBjb25maWcuY3JlYXRlRWxlbWVudCgnb2JqZWN0LWl0ZW0tY29udHJvbCcsIHtmaWVsZDogZmllbGQsIG9uUmVtb3ZlOiB0aGlzLnByb3BzLm9uUmVtb3ZlLCBpdGVtS2V5OiB0aGlzLnByb3BzLml0ZW1LZXl9KVxuICAgICk7XG4gIH1cbn0pO1xuIiwiLy8gIyBwcmV0dHktc2VsZWN0LWlucHV0IGNvbXBvbmVudFxuXG4vKlxuICAgUmVuZGVyIGFuIGlucHV0IHRvIGJlIHVzZWQgYXMgdGhlIGVsZW1lbnQgZm9yIHR5cGluZyBhIGN1c3RvbSB2YWx1ZSBpbnRvIGEgcHJldHR5IHNlbGVjdC5cbiAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbnZhciBSZWFjdCA9IHJlcXVpcmUoJ3JlYWN0L2FkZG9ucycpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcblxuICBkaXNwbGF5TmFtZTogJ1ByZXR0eVNlbGVjdElucHV0JyxcblxuICBtaXhpbnM6IFtyZXF1aXJlKCcuLi8uLi9taXhpbnMvaGVscGVyJyldLFxuXG4gIHJlbmRlcjogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLnJlbmRlcldpdGhDb25maWcoKTtcbiAgfSxcblxuICBmb2N1czogZnVuY3Rpb24gKCkge1xuICAgIHRoaXMucmVmcy50ZXh0Qm94LmZvY3VzKCk7XG4gIH0sXG5cbiAgc2V0Q2hvaWNlc09wZW46IGZ1bmN0aW9uIChpc09wZW5DaG9pY2VzKSB7XG4gICAgdGhpcy5yZWZzLnRleHRCb3guc2V0Q2hvaWNlc09wZW4oaXNPcGVuQ2hvaWNlcyk7XG4gIH0sXG5cbiAgcmVuZGVyRGVmYXVsdDogZnVuY3Rpb24gKCkge1xuICAgIGNvbnN0IHRhYkluZGV4ID0gdGhpcy5pc1JlYWRPbmx5KCkgPyBudWxsIDogdGhpcy5wcm9wcy5maWVsZC50YWJJbmRleDtcblxuICAgIHJldHVybiB0aGlzLnByb3BzLmNvbmZpZy5jcmVhdGVFbGVtZW50KCdwcmV0dHktdGV4dC1pbnB1dCcsIHtcbiAgICAgIGNsYXNzZXM6IHRoaXMucHJvcHMuY2xhc3NlcyxcbiAgICAgIHRhYkluZGV4OiB0YWJJbmRleCxcbiAgICAgIG9uQ2hhbmdlOiB0aGlzLnByb3BzLm9uQ2hhbmdlLFxuICAgICAgb25Gb2N1czogdGhpcy5wcm9wcy5vbkZvY3VzLFxuICAgICAgb25CbHVyOiB0aGlzLnByb3BzLm9uQmx1cixcbiAgICAgIG9uQWN0aW9uOiB0aGlzLm9uQnViYmxlQWN0aW9uLFxuICAgICAgZmllbGQ6IHRoaXMucHJvcHMuZmllbGQsXG4gICAgICB2YWx1ZTogdGhpcy5wcm9wcy5pc0VudGVyaW5nQ3VzdG9tVmFsdWUgPyB0aGlzLnByb3BzLmZpZWxkLnZhbHVlIDogdGhpcy5wcm9wcy5nZXREaXNwbGF5VmFsdWUoKSxcbiAgICAgIHNlbGVjdGVkQ2hvaWNlczogdGhpcy5wcm9wcy5jb25maWcuZmllbGRTZWxlY3RlZFJlcGxhY2VDaG9pY2VzKHRoaXMucHJvcHMuZmllbGQpLFxuICAgICAgcmVwbGFjZUNob2ljZXM6IHRoaXMucHJvcHMuY29uZmlnLmZpZWxkUmVwbGFjZUNob2ljZXModGhpcy5wcm9wcy5maWVsZCksXG4gICAgICBvblRhZ0NsaWNrOiB0aGlzLm9uVGFnQ2xpY2ssXG4gICAgICByZWY6ICd0ZXh0Qm94JyxcbiAgICAgIHJlYWRPbmx5OiAhdGhpcy5wcm9wcy5pc0VudGVyaW5nQ3VzdG9tVmFsdWUsXG4gICAgICBkaXNhYmxlZDogdGhpcy5pc1JlYWRPbmx5KClcbiAgICB9KTtcbiAgfVxuXG59KTtcbiIsIi8vICMgcHJldHR5LXNlbGVjdC12YWx1ZSBjb21wb25lbnRcblxuLypcbiAgIFJlbmRlciBhIHNlbGVjdCBkcm9wZG93biBmb3IgYSBsaXN0IG9mIGNob2ljZXMuIENob2ljZXMgdmFsdWVzIGNhbiBiZSBvZiBhbnlcbiAgIHR5cGUuIERvZXMgbm90IHVzZSBuYXRpdmUgc2VsZWN0IGRyb3Bkb3duLiBDaG9pY2VzIGNhbiBvcHRpb25hbGx5IGluY2x1ZGVcbiAgICdzYW1wbGUnIHByb3BlcnR5IGRpc3BsYXllZCBncmF5ZWQgb3V0LlxuICovXG5cbid1c2Ugc3RyaWN0JztcblxudmFyIFJlYWN0ID0gcmVxdWlyZSgncmVhY3QvYWRkb25zJyk7XG52YXIgXyA9IHJlcXVpcmUoJy4uLy4uL3VuZGFzaCcpO1xudmFyIGN4ID0gcmVxdWlyZSgnY2xhc3NuYW1lcycpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcblxuICBkaXNwbGF5TmFtZTogJ1NlbGVjdFZhbHVlJyxcblxuICBtaXhpbnM6IFtyZXF1aXJlKCcuLi8uLi9taXhpbnMvaGVscGVyJyldLFxuXG4gIG9uQ2hhbmdlOiBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICB2YXIgY2hvaWNlVmFsdWUgPSBldmVudC50YXJnZXQudmFsdWU7XG4gICAgdmFyIGNob2ljZVR5cGUgPSBjaG9pY2VWYWx1ZS5zdWJzdHJpbmcoMCwgY2hvaWNlVmFsdWUuaW5kZXhPZignOicpKTtcbiAgICBpZiAoY2hvaWNlVHlwZSA9PT0gJ2Nob2ljZScpIHtcbiAgICAgIHZhciBjaG9pY2VJbmRleCA9IGNob2ljZVZhbHVlLnN1YnN0cmluZyhjaG9pY2VWYWx1ZS5pbmRleE9mKCc6JykgKyAxKTtcbiAgICAgIGNob2ljZUluZGV4ID0gcGFyc2VJbnQoY2hvaWNlSW5kZXgpO1xuICAgICAgdGhpcy5wcm9wcy5vbkNoYW5nZSh0aGlzLnByb3BzLmNob2ljZXNbY2hvaWNlSW5kZXhdLnZhbHVlKTtcbiAgICB9XG4gIH0sXG5cbiAgb25DaGFuZ2VDdXN0b21WYWx1ZTogZnVuY3Rpb24gKG5ld1ZhbHVlLCBpbmZvKSB7XG4gICAgdGhpcy5wcm9wcy5vbkNoYW5nZShuZXdWYWx1ZSwge1xuICAgICAgZmllbGQ6IGluZm8uZmllbGQsXG4gICAgICBpc0N1c3RvbVZhbHVlOiB0cnVlXG4gICAgfSk7XG4gIH0sXG5cbiAgLy8gSW50ZXJjZXB0IGN1c3RvbSB2YWx1ZSBmaWVsZCBldmVudHMgYW5kIHByZXRlbmQgbGlrZSB0aGlzIGZpZWxkIHNlbnQgdGhlbS5cbiAgb25DdXN0b21BY3Rpb246IGZ1bmN0aW9uIChpbmZvKSB7XG4gICAgaW5mbyA9IF8uZXh0ZW5kKHt9LCBpbmZvLCB7ZmllbGQ6IHRoaXMucHJvcHMuZmllbGQsIGlzQ3VzdG9tVmFsdWU6IHRydWV9KTtcbiAgICB0aGlzLnByb3BzLm9uQWN0aW9uKGluZm8pO1xuICB9LFxuXG4gIGdldERlZmF1bHRQcm9wczogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB7XG4gICAgICBjaG9pY2VzOiBbXVxuICAgIH07XG4gIH0sXG5cbiAgZ2V0SW5pdGlhbFN0YXRlOiBmdW5jdGlvbigpIHtcbiAgICB2YXIgY3VycmVudENob2ljZSA9IHRoaXMuY3VycmVudENob2ljZSh0aGlzLnByb3BzKTtcbiAgICB2YXIgaXNEZWZhdWx0VmFsdWUgPSB0aGlzLnByb3BzLmZpZWxkLnZhbHVlID09PSB0aGlzLnByb3BzLmNvbmZpZy5maWVsZFRlbXBsYXRlRGVmYXVsdFZhbHVlKHRoaXMucHJvcHMuZmllbGQpO1xuICAgIHJldHVybiB7XG4gICAgICBpc0Nob2ljZXNPcGVuOiB0aGlzLnByb3BzLmlzQ2hvaWNlc09wZW4sXG4gICAgICBpc0VudGVyaW5nQ3VzdG9tVmFsdWU6ICFpc0RlZmF1bHRWYWx1ZSAmJiAhY3VycmVudENob2ljZSAmJiB0aGlzLnByb3BzLmZpZWxkLnZhbHVlLFxuICAgICAgLy8gQ2FjaGluZyB0aGlzIGNhdXNlIGl0J3Mga2luZCBvZiBleHBlbnNpdmUuXG4gICAgICBjdXJyZW50Q2hvaWNlOiB0aGlzLmN1cnJlbnRDaG9pY2UodGhpcy5wcm9wcylcbiAgICB9O1xuICB9LFxuXG4gIGNvbXBvbmVudFdpbGxSZWNlaXZlUHJvcHMobmV3UHJvcHMpIHtcbiAgICB2YXIgY3VycmVudENob2ljZSA9IHRoaXMuY3VycmVudENob2ljZShuZXdQcm9wcyk7XG4gICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICBjdXJyZW50Q2hvaWNlXG4gICAgfSk7XG4gIH0sXG5cbiAgdmFsdWU6IGZ1bmN0aW9uIChwcm9wcykge1xuICAgIHByb3BzID0gcHJvcHMgfHwgdGhpcy5wcm9wcztcbiAgICByZXR1cm4gcHJvcHMuZmllbGQudmFsdWUgIT09IHVuZGVmaW5lZCA/IHByb3BzLmZpZWxkLnZhbHVlIDogJyc7XG4gIH0sXG5cbiAgcmVuZGVyOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMucmVuZGVyV2l0aENvbmZpZygpO1xuICB9LFxuXG4gIHJlbmRlckRlZmF1bHQ6IGZ1bmN0aW9uICgpIHtcbiAgICBjb25zdCB7Y29uZmlnLCBmaWVsZH0gPSB0aGlzLnByb3BzO1xuICAgIHZhciBjaG9pY2VzID0gY29uZmlnLm5vcm1hbGl6ZVByZXR0eUNob2ljZXModGhpcy5wcm9wcy5jaG9pY2VzKTtcbiAgICB2YXIgY2hvaWNlc09yTG9hZGluZztcblxuICAgIGlmICgoY2hvaWNlcy5sZW5ndGggPiAxICYmIGNob2ljZXNbMF0udmFsdWUgPT09ICcvLy9sb2FkaW5nLy8vJykgfHwgY29uZmlnLmZpZWxkSXNMb2FkaW5nKGZpZWxkKSkge1xuICAgICAgY2hvaWNlcyA9IFt7dmFsdWU6ICcvLy9sb2FkaW5nLy8vJ31dO1xuICAgIH1cblxuICAgIGxldCBjaG9pY2VzRWxlbTtcbiAgICBpZiAoIXRoaXMuaXNSZWFkT25seSgpKSB7XG4gICAgICBjaG9pY2VzRWxlbSA9IGNvbmZpZy5jcmVhdGVFbGVtZW50KCdjaG9pY2VzJywge1xuICAgICAgICByZWY6ICdjaG9pY2VzJyxcbiAgICAgICAgY2hvaWNlczogY2hvaWNlcyxcbiAgICAgICAgb3BlbjogdGhpcy5zdGF0ZS5pc0Nob2ljZXNPcGVuLFxuICAgICAgICBpZ25vcmVDbG9zZU5vZGVzOiB0aGlzLmdldENsb3NlSWdub3JlTm9kZXMsXG4gICAgICAgIG9uU2VsZWN0OiB0aGlzLm9uU2VsZWN0Q2hvaWNlLFxuICAgICAgICBvbkNsb3NlOiB0aGlzLm9uQ2xvc2VDaG9pY2VzLFxuICAgICAgICBvbkNob2ljZUFjdGlvbjogdGhpcy5vbkNob2ljZUFjdGlvbixcbiAgICAgICAgZmllbGRcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIHZhciBpbnB1dEVsZW0gPSB0aGlzLmdldElucHV0RWxlbWVudCgpO1xuXG4gICAgbGV0IGN1c3RvbUZpZWxkRWxlbWVudCA9IG51bGw7XG4gICAgaWYgKHRoaXMuc3RhdGUuaXNFbnRlcmluZ0N1c3RvbVZhbHVlICYmIHRoaXMuaGFzQ3VzdG9tRmllbGQoKSkge1xuICAgICAgY29uc3QgY3VzdG9tRmllbGRUZW1wbGF0ZSA9IGNvbmZpZy5maWVsZEN1c3RvbUZpZWxkVGVtcGxhdGUoZmllbGQpO1xuICAgICAgY29uc3QgY3VzdG9tRmllbGQgPSBfLmV4dGVuZCh7dHlwZTogJ1ByZXR0eVRleHQnfSwge1xuICAgICAgICBrZXk6IGZpZWxkLmtleSwgcGFyZW50OiBmaWVsZCwgZmllbGRJbmRleDogZmllbGQuZmllbGRJbmRleCxcbiAgICAgICAgcmF3RmllbGRUZW1wbGF0ZTogY3VzdG9tRmllbGRUZW1wbGF0ZSxcbiAgICAgICAgdmFsdWU6IGZpZWxkLnZhbHVlXG4gICAgICB9LCBjdXN0b21GaWVsZFRlbXBsYXRlKTtcbiAgICAgIGNvbmZpZy5pbml0RmllbGQoY3VzdG9tRmllbGQpO1xuICAgICAgY3VzdG9tRmllbGRFbGVtZW50ID0gY29uZmlnLmNyZWF0ZUZpZWxkRWxlbWVudCh7XG4gICAgICAgIGZpZWxkOiBjdXN0b21GaWVsZCxcbiAgICAgICAgb25DaGFuZ2U6IHRoaXMub25DaGFuZ2VDdXN0b21WYWx1ZSwgb25BY3Rpb246IHRoaXMub25DdXN0b21BY3Rpb24sXG4gICAgICAgIHJlZjogJ2N1c3RvbUZpZWxkSW5wdXQnXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBsZXQgc2VsZWN0QXJyb3c7XG4gICAgaWYgKCF0aGlzLmlzUmVhZE9ubHkoKSkge1xuICAgICAgc2VsZWN0QXJyb3cgPSA8c3BhbiBjbGFzc05hbWU9XCJzZWxlY3QtYXJyb3dcIiAvPjtcbiAgICB9XG5cbiAgICBjaG9pY2VzT3JMb2FkaW5nID0gKFxuICAgICAgPGRpdiBjbGFzc05hbWU9e2N4KF8uZXh0ZW5kKHt9LCB0aGlzLnByb3BzLmNsYXNzZXMsIHsnY2hvaWNlcy1vcGVuJzogdGhpcy5zdGF0ZS5pc0Nob2ljZXNPcGVufSkpfVxuICAgICAgICAgICBvbkNoYW5nZT17dGhpcy5vbkNoYW5nZX0+XG5cbiAgICAgICAgPGRpdiByZWY9XCJ0b2dnbGVcIiBvbkNsaWNrPXt0aGlzLmlzUmVhZE9ubHkoKSA/IG51bGwgOiB0aGlzLm9uVG9nZ2xlQ2hvaWNlc30+XG4gICAgICAgICAge2lucHV0RWxlbX1cbiAgICAgICAgICB7c2VsZWN0QXJyb3d9XG4gICAgICAgIDwvZGl2PlxuICAgICAgICB7Y2hvaWNlc0VsZW19XG4gICAgICAgIDxzcGFuPlxuICAgICAgICB7Y3VzdG9tRmllbGRFbGVtZW50fVxuICAgICAgICA8L3NwYW4+XG4gICAgICA8L2Rpdj5cbiAgICApO1xuXG4gICAgcmV0dXJuIGNob2ljZXNPckxvYWRpbmc7XG4gIH0sXG5cbiAgZ2V0SW5wdXRFbGVtZW50OiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMucHJvcHMuY29uZmlnLmNyZWF0ZUVsZW1lbnQoJ3ByZXR0eS1zZWxlY3QtaW5wdXQnLCB7XG4gICAgICBmaWVsZDogdGhpcy5wcm9wcy5maWVsZCxcbiAgICAgIHJlZjogJ2N1c3RvbUlucHV0JyxcbiAgICAgIGlzRW50ZXJpbmdDdXN0b21WYWx1ZTogdGhpcy5zdGF0ZS5pc0VudGVyaW5nQ3VzdG9tVmFsdWUgJiYgIXRoaXMuaGFzQ3VzdG9tRmllbGQoKSxcbiAgICAgIG9uQ2hhbmdlOiB0aGlzLm9uSW5wdXRDaGFuZ2UsXG4gICAgICBvbkZvY3VzOiB0aGlzLm9uRm9jdXNBY3Rpb24sXG4gICAgICBvbkJsdXI6IHRoaXMub25CbHVyLFxuICAgICAgb25BY3Rpb246IHRoaXMub25CdWJibGVBY3Rpb24sXG4gICAgICBnZXREaXNwbGF5VmFsdWU6IHRoaXMuZ2V0RGlzcGxheVZhbHVlXG4gICAgfSk7XG4gIH0sXG5cbiAgYmx1ckxhdGVyOiBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgc2VsZi5vbkJsdXJBY3Rpb24oKTtcbiAgICB9LCAwKTtcbiAgfSxcblxuICBvbkJsdXI6IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAoIXRoaXMuc3RhdGUuaXNDaG9pY2VzT3Blbikge1xuICAgICAgdGhpcy5ibHVyTGF0ZXIoKTtcbiAgICB9XG4gIH0sXG5cbiAgZ2V0Q2xvc2VJZ25vcmVOb2RlczogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLnJlZnMudG9nZ2xlLmdldERPTU5vZGUoKTtcbiAgfSxcblxuICBvblRvZ2dsZUNob2ljZXM6IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLnNldENob2ljZXNPcGVuKCF0aGlzLnN0YXRlLmlzQ2hvaWNlc09wZW4pO1xuICB9LFxuXG4gIHNldENob2ljZXNPcGVuOiBmdW5jdGlvbiAoaXNPcGVuKSB7XG4gICAgdmFyIGFjdGlvbiA9IGlzT3BlbiA/ICdvcGVuLWNob2ljZXMnIDogJ2Nsb3NlLWNob2ljZXMnO1xuICAgIHRoaXMub25TdGFydEFjdGlvbihhY3Rpb24pO1xuICAgIHRoaXMuc2V0U3RhdGUoeyBpc0Nob2ljZXNPcGVuOiBpc09wZW4gfSk7XG4gIH0sXG5cbiAgb25TZWxlY3RDaG9pY2U6IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgaXNFbnRlcmluZ0N1c3RvbVZhbHVlOiBmYWxzZSxcbiAgICAgIGlzQ2hvaWNlc09wZW46IGZhbHNlXG4gICAgfSk7XG4gICAgdGhpcy5wcm9wcy5vbkNoYW5nZSh2YWx1ZSk7XG4gICAgdGhpcy5ibHVyTGF0ZXIoKTtcbiAgfSxcblxuICBvbkNsb3NlQ2hvaWNlczogZnVuY3Rpb24gKCkge1xuICAgIGlmICh0aGlzLnN0YXRlLmlzQ2hvaWNlc09wZW4pIHtcbiAgICAgIHRoaXMuYmx1ckxhdGVyKCk7XG4gICAgICB0aGlzLnNldENob2ljZXNPcGVuKGZhbHNlKTtcbiAgICB9XG4gIH0sXG5cbiAgY3VycmVudENob2ljZTogZnVuY3Rpb24gKHByb3BzKSB7XG4gICAgcHJvcHMgPSBwcm9wcyB8fCB0aGlzLnByb3BzO1xuICAgIHZhciB7Y29uZmlnLCBmaWVsZCwgY2hvaWNlc30gPSBwcm9wcztcbiAgICB2YXIgY3VycmVudFZhbHVlID0gdGhpcy52YWx1ZShwcm9wcyk7XG4gICAgdmFyIGN1cnJlbnRDaG9pY2UgPSBjb25maWcuZmllbGRTZWxlY3RlZENob2ljZShmaWVsZCk7XG4gICAgLy8gTWFrZSBzdXJlIHNlbGVjdGVkQ2hvaWNlIGlzIGEgbWF0Y2ggZm9yIGN1cnJlbnQgdmFsdWUuXG4gICAgaWYgKGN1cnJlbnRDaG9pY2UgJiYgY3VycmVudENob2ljZS52YWx1ZSAhPT0gY3VycmVudFZhbHVlKSB7XG4gICAgICBjdXJyZW50Q2hvaWNlID0gbnVsbDtcbiAgICB9XG4gICAgaWYgKCFjdXJyZW50Q2hvaWNlKSB7XG4gICAgICBjdXJyZW50Q2hvaWNlID0gXy5maW5kKGNob2ljZXMsIGZ1bmN0aW9uIChjaG9pY2UpIHtcbiAgICAgICAgcmV0dXJuICFjaG9pY2UuYWN0aW9uICYmIGNob2ljZS52YWx1ZSA9PT0gY3VycmVudFZhbHVlO1xuICAgICAgfSk7XG4gICAgfVxuICAgIHJldHVybiBjdXJyZW50Q2hvaWNlO1xuICB9LFxuXG4gIGdldERpc3BsYXlWYWx1ZTogZnVuY3Rpb24gKCkge1xuICAgIHZhciB7Y3VycmVudENob2ljZX0gPSB0aGlzLnN0YXRlO1xuICAgIC8vdmFyIGN1cnJlbnRDaG9pY2UgPSB0aGlzLmN1cnJlbnRDaG9pY2UoKTtcbiAgICB2YXIgY3VycmVudFZhbHVlID0gdGhpcy52YWx1ZSgpO1xuICAgIHZhciBpc0RlZmF1bHRWYWx1ZSA9IGN1cnJlbnRWYWx1ZSA9PT0gdGhpcy5wcm9wcy5jb25maWcuZmllbGRUZW1wbGF0ZURlZmF1bHRWYWx1ZSh0aGlzLnByb3BzLmZpZWxkKTtcblxuICAgIGlmICh0aGlzLnN0YXRlLmlzRW50ZXJpbmdDdXN0b21WYWx1ZSB8fCAoIWlzRGVmYXVsdFZhbHVlICYmICFjdXJyZW50Q2hvaWNlICYmIGN1cnJlbnRWYWx1ZSkpIHtcbiAgICAgIGlmICh0aGlzLmhhc0N1c3RvbUZpZWxkKCkpIHtcbiAgICAgICAgY29uc3Qge2Nob2ljZXN9ID0gdGhpcy5wcm9wcztcbiAgICAgICAgY29uc3QgY3VzdG9tQ2hvaWNlID0gXy5maW5kKGNob2ljZXMsIGNob2ljZSA9PiBjaG9pY2UuYWN0aW9uID09PSAnZW50ZXItY3VzdG9tLXZhbHVlJyk7XG4gICAgICAgIGlmIChjdXN0b21DaG9pY2UgJiYgY3VzdG9tQ2hvaWNlLmxhYmVsKSB7XG4gICAgICAgICAgcmV0dXJuIGN1c3RvbUNob2ljZS5sYWJlbDtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIGN1cnJlbnRWYWx1ZTtcbiAgICB9XG5cbiAgICBpZiAoY3VycmVudENob2ljZSkge1xuICAgICAgcmV0dXJuIGN1cnJlbnRDaG9pY2UubGFiZWw7XG4gICAgfVxuXG4gICAgLy8gSWYgdGhpcyBpcyB0aGUgZGVmYXVsdCB2YWx1ZSwgYW5kIHdlIGhhdmUgbm8gY2hvaWNlIHRvIHVzZSBmb3IgdGhlIGxhYmVsLCBqdXN0IHVzZSB0aGUgdmFsdWUuXG4gICAgaWYgKGlzRGVmYXVsdFZhbHVlKSB7XG4gICAgICByZXR1cm4gY3VycmVudFZhbHVlO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzLnByb3BzLmNvbmZpZy5maWVsZFBsYWNlaG9sZGVyKHRoaXMucHJvcHMuZmllbGQpIHx8ICcnO1xuICB9LFxuXG4gIGhhc0N1c3RvbUZpZWxkKCkge1xuICAgIHJldHVybiAhIXRoaXMucHJvcHMuY29uZmlnLmZpZWxkQ3VzdG9tRmllbGRUZW1wbGF0ZSh0aGlzLnByb3BzLmZpZWxkKTtcbiAgfSxcblxuICBvbkNob2ljZUFjdGlvbjogZnVuY3Rpb24gKGNob2ljZSkge1xuICAgIGlmIChjaG9pY2UuYWN0aW9uID09PSAnZW50ZXItY3VzdG9tLXZhbHVlJykge1xuICAgICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICAgIGlzRW50ZXJpbmdDdXN0b21WYWx1ZTogdHJ1ZSxcbiAgICAgICAgaXNDaG9pY2VzT3BlbjogZmFsc2VcbiAgICAgIH0sIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKHRoaXMuaGFzQ3VzdG9tRmllbGQoKSkge1xuICAgICAgICAgIHRoaXMucmVmcy5jdXN0b21GaWVsZElucHV0LmZvY3VzKCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhpcy5yZWZzLmN1c3RvbUlucHV0LmZvY3VzKCk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH0gZWxzZSBpZiAoY2hvaWNlLmFjdGlvbiA9PT0gJ2luc2VydC1maWVsZCcpIHtcbiAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICBpc0Nob2ljZXNPcGVuOiBmYWxzZVxuICAgICAgfSwgZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLnJlZnMuY3VzdG9tSW5wdXQuc2V0Q2hvaWNlc09wZW4odHJ1ZSk7XG4gICAgICB9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKGNob2ljZS5hY3Rpb24gPT09ICdjbGVhci1jdXJyZW50LWNob2ljZScpIHtcbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICAgICAgaXNDaG9pY2VzT3BlbjogZmFsc2UsXG4gICAgICAgICAgaXNFbnRlcmluZ0N1c3RvbVZhbHVlOiBmYWxzZVxuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5wcm9wcy5vbkNoYW5nZSgnJyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgICBpc0Nob2ljZXNPcGVuOiAhIWNob2ljZS5pc09wZW5cbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgdGhpcy5vblN0YXJ0QWN0aW9uKGNob2ljZS5hY3Rpb24sIGNob2ljZSk7XG4gIH0sXG5cbiAgLy8gSXMgdGhpcyBldmVuIHVzZWQ/IEkgZG9uJ3QgdGhpbmsgc28uXG4gIG9uQWN0aW9uOiBmdW5jdGlvbiAocGFyYW1zKSB7XG4gICAgaWYgKHBhcmFtcy5hY3Rpb24gPT09ICdlbnRlci1jdXN0b20tdmFsdWUnKSB7XG4gICAgICB0aGlzLnNldFN0YXRlKHtpc0VudGVyaW5nQ3VzdG9tVmFsdWU6IHRydWV9LCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMucmVmcy5jdXN0b21JbnB1dC5mb2N1cygpO1xuICAgICAgfSk7XG4gICAgfVxuICAgIHRoaXMub25CdWJibGVBY3Rpb24ocGFyYW1zKTtcbiAgfSxcblxuICBvbklucHV0Q2hhbmdlOiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICB0aGlzLnByb3BzLm9uQ2hhbmdlKHZhbHVlKTtcbiAgfVxufSk7XG4iLCIvLyAjIHByZXR0eS10YWcgY29tcG9uZW50XG5cbi8qXG4gICBQcmV0dHkgdGV4dCB0YWdcbiAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbnZhciBSZWFjdCA9IHJlcXVpcmUoJ3JlYWN0L2FkZG9ucycpO1xudmFyIF8gPSByZXF1aXJlKCcuLi8uLi91bmRhc2gnKTtcbnZhciBjeCA9IHJlcXVpcmUoJ2NsYXNzbmFtZXMnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG5cbiAgZGlzcGxheU5hbWU6ICdQcmV0dHlUYWcnLFxuXG4gIHByb3BUeXBlczoge1xuICAgIG9uQ2xpY2s6IFJlYWN0LlByb3BUeXBlcy5mdW5jLFxuICAgIGNsYXNzZXM6IFJlYWN0LlByb3BUeXBlcy5vYmplY3RcbiAgfSxcblxuICBtaXhpbnM6IFtyZXF1aXJlKCcuLi8uLi9taXhpbnMvaGVscGVyJyldLFxuXG4gIHJlbmRlcjogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLnJlbmRlcldpdGhDb25maWcoKTtcbiAgfSxcblxuICByZW5kZXJEZWZhdWx0OiBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGNsYXNzZXMgPSBjeChfLmV4dGVuZCh7fSwgdGhpcy5wcm9wcy5jbGFzc2VzLCB7J3ByZXR0eS1wYXJ0JzogdHJ1ZX0pKTtcblxuICAgIHJldHVybiAoXG4gICAgICA8c3BhbiBjbGFzc05hbWU9e2NsYXNzZXN9IG9uQ2xpY2s9e3RoaXMucHJvcHMub25DbGlja30+XG4gICAgICAgIHt0aGlzLnByb3BzLmNoaWxkcmVufVxuICAgICAgPC9zcGFuPlxuICAgICk7XG4gIH1cbn0pO1xuIiwiJ3VzZSBzdHJpY3QnO1xuLyogZ2xvYmFsIENvZGVNaXJyb3IgKi9cbi8qZXNsaW50IG5vLXNjcmlwdC11cmw6MCAqL1xuXG52YXIgUmVhY3QgPSByZXF1aXJlKCdyZWFjdC9hZGRvbnMnKTtcbnZhciBUYWdUcmFuc2xhdG9yID0gcmVxdWlyZSgnLi90YWctdHJhbnNsYXRvcicpO1xudmFyIF8gPSByZXF1aXJlKCcuLi8uLi91bmRhc2gnKTtcbnZhciBjeCA9IHJlcXVpcmUoJ2NsYXNzbmFtZXMnKTtcblxudmFyIHRvU3RyaW5nID0gZnVuY3Rpb24gKHZhbHVlKSB7XG4gIGlmIChfLmlzVW5kZWZpbmVkKHZhbHVlKSB8fCBfLmlzTnVsbCh2YWx1ZSkpIHtcbiAgICByZXR1cm4gJyc7XG4gIH1cbiAgcmV0dXJuIFN0cmluZyh2YWx1ZSk7XG59O1xuXG4vKlxuICAgRWRpdG9yIGZvciB0YWdnZWQgdGV4dC4gUmVuZGVycyB0ZXh0IGxpa2UgXCJoZWxsbyB7e2ZpcnN0TmFtZX19XCJcbiAgIHdpdGggcmVwbGFjZW1lbnQgbGFiZWxzIHJlbmRlcmVkIGluIGEgcGlsbCBib3guIERlc2lnbmVkIHRvIGxvYWRcbiAgIHF1aWNrbHkgd2hlbiBtYW55IHNlcGFyYXRlIGluc3RhbmNlcyBvZiBpdCBhcmUgb24gdGhlIHNhbWVcbiAgIHBhZ2UuXG5cbiAgIFVzZXMgQ29kZU1pcnJvciB0byBlZGl0IHRleHQuIFRvIHNhdmUgbWVtb3J5IHRoZSBDb2RlTWlycm9yIG5vZGUgaXNcbiAgIGluc3RhbnRpYXRlZCB3aGVuIHRoZSB1c2VyIG1vdmVzIHRoZSBtb3VzZSBpbnRvIHRoZSBlZGl0IGFyZWEuXG4gICBJbml0aWFsbHkgYSByZWFkLW9ubHkgdmlldyB1c2luZyBhIHNpbXBsZSBkaXYgaXMgc2hvd24uXG4gKi9cbm1vZHVsZS5leHBvcnRzID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXG4gIGRpc3BsYXlOYW1lOiAnUHJldHR5VGV4dElucHV0JyxcblxuICBtaXhpbnM6IFtyZXF1aXJlKCcuLi8uLi9taXhpbnMvaGVscGVyJyldLFxuXG4gIGNvbXBvbmVudERpZE1vdW50OiBmdW5jdGlvbigpIHtcbiAgICB0aGlzLmNyZWF0ZUVkaXRvcigpO1xuICB9LFxuXG4gIGNvbXBvbmVudERpZFVwZGF0ZTogZnVuY3Rpb24ocHJldlByb3BzLCBwcmV2U3RhdGUpIHtcbiAgICBpZiAocHJldlN0YXRlLmNvZGVNaXJyb3JNb2RlICE9PSB0aGlzLnN0YXRlLmNvZGVNaXJyb3JNb2RlKSB7XG4gICAgICAvLyBDaGFuZ2VkIGZyb20gY29kZSBtaXJyb3IgbW9kZSB0byByZWFkIG9ubHkgbW9kZSBvciB2aWNlIHZlcnNhLFxuICAgICAgLy8gc28gc2V0dXAgdGhlIG90aGVyIGVkaXRvci5cbiAgICAgIHRoaXMuY3JlYXRlRWRpdG9yKCk7XG4gICAgfVxuICAgIHRoaXMudXBkYXRlRWRpdG9yKCk7XG4gIH0sXG5cbiAgY29tcG9uZW50V2lsbFVubW91bnQ6IGZ1bmN0aW9uKCkge1xuICAgIGlmICh0aGlzLnN0YXRlLmNvZGVNaXJyb3JNb2RlKSB7XG4gICAgICB0aGlzLnJlbW92ZUNvZGVNaXJyb3JFZGl0b3IoKTtcbiAgICB9XG4gIH0sXG5cbiAgZ2V0SW5pdGlhbFN0YXRlOiBmdW5jdGlvbigpIHtcbiAgICB2YXIgc2VsZWN0ZWRDaG9pY2VzID0gdGhpcy5wcm9wcy5zZWxlY3RlZENob2ljZXM7XG4gICAgdmFyIHJlcGxhY2VDaG9pY2VzID0gdGhpcy5wcm9wcy5yZXBsYWNlQ2hvaWNlcztcbiAgICB2YXIgdHJhbnNsYXRvciA9IFRhZ1RyYW5zbGF0b3Ioc2VsZWN0ZWRDaG9pY2VzLmNvbmNhdChyZXBsYWNlQ2hvaWNlcyksIHRoaXMucHJvcHMuY29uZmlnLmh1bWFuaXplKTtcblxuICAgIHJldHVybiB7XG4gICAgICAvLyBXaXRoIG51bWJlciB2YWx1ZXMsIG9uRm9jdXMgbmV2ZXIgZmlyZXMsIHdoaWNoIG1lYW5zIGl0IHN0YXlzIHJlYWQtb25seS4gU28gY29udmVydCB0byBzdHJpbmcuXG4gICAgICB2YWx1ZTogdG9TdHJpbmcodGhpcy5wcm9wcy52YWx1ZSksXG4gICAgICBjb2RlTWlycm9yTW9kZTogZmFsc2UsXG4gICAgICBpc0Nob2ljZXNPcGVuOiBmYWxzZSxcbiAgICAgIHJlcGxhY2VDaG9pY2VzOiByZXBsYWNlQ2hvaWNlcyxcbiAgICAgIHRyYW5zbGF0b3I6IHRyYW5zbGF0b3JcbiAgICB9O1xuICB9LFxuXG4gIGNvbXBvbmVudFdpbGxSZWNlaXZlUHJvcHM6IGZ1bmN0aW9uKG5leHRQcm9wcykge1xuICAgIHZhciBzZWxlY3RlZENob2ljZXMgPSBuZXh0UHJvcHMuc2VsZWN0ZWRDaG9pY2VzO1xuICAgIHZhciByZXBsYWNlQ2hvaWNlcyA9IG5leHRQcm9wcy5yZXBsYWNlQ2hvaWNlcztcbiAgICB2YXIgbmV4dFN0YXRlID0ge1xuICAgICAgcmVwbGFjZUNob2ljZXM6IHJlcGxhY2VDaG9pY2VzLFxuICAgICAgdHJhbnNsYXRvcjogVGFnVHJhbnNsYXRvcihzZWxlY3RlZENob2ljZXMuY29uY2F0KHJlcGxhY2VDaG9pY2VzKSwgdGhpcy5wcm9wcy5jb25maWcuaHVtYW5pemUpXG4gICAgfTtcblxuICAgIC8vIE5vdCBzdXJlIHdoYXQgdGhlIG51bGwvdW5kZWZpbmVkIGNoZWNrcyBhcmUgaGVyZSBmb3IsIGJ1dCBjaGFuZ2VkIGZyb20gZmFsc2V5IHdoaWNoIHdhcyBicmVha2luZy5cbiAgICBpZiAodGhpcy5zdGF0ZS52YWx1ZSAhPT0gbmV4dFByb3BzLnZhbHVlICYmICFfLmlzVW5kZWZpbmVkKG5leHRQcm9wcy52YWx1ZSkgJiYgbmV4dFByb3BzLnZhbHVlICE9PSBudWxsKSB7XG4gICAgICBuZXh0U3RhdGUudmFsdWUgPSB0b1N0cmluZyhuZXh0UHJvcHMudmFsdWUpO1xuICAgIH1cblxuICAgIHRoaXMuc2V0U3RhdGUobmV4dFN0YXRlKTtcbiAgfSxcblxuICBoYW5kbGVDaG9pY2VTZWxlY3Rpb246IGZ1bmN0aW9uIChrZXksIGV2ZW50KSB7XG4gICAgY29uc3Qgc2VsZWN0Q2hvaWNlID0gKCkgPT4ge1xuICAgICAgdmFyIHBvcyA9IHRoaXMuc3RhdGUuc2VsZWN0ZWRUYWdQb3M7XG4gICAgICB2YXIgdGFnID0gJ3t7JyArIGtleSArICd9fSc7XG5cbiAgICAgIGlmIChwb3MpIHtcbiAgICAgICAgdGhpcy5jb2RlTWlycm9yLnJlcGxhY2VSYW5nZSh0YWcsIHtsaW5lOiBwb3MubGluZSwgY2g6IHBvcy5zdGFydH0sIHtsaW5lOiBwb3MubGluZSwgY2g6IHBvcy5zdG9wfSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLmNvZGVNaXJyb3IucmVwbGFjZVNlbGVjdGlvbih0YWcsICdlbmQnKTtcbiAgICAgIH1cbiAgICAgIHRoaXMuY29kZU1pcnJvci5mb2N1cygpO1xuXG4gICAgICB0aGlzLnNldFN0YXRlKHsgaXNDaG9pY2VzT3BlbjogZmFsc2UsIHNlbGVjdGVkVGFnUG9zOiBudWxsIH0pO1xuICAgIH07XG4gICAgaWYgKHRoaXMuc3RhdGUuY29kZU1pcnJvck1vZGUpIHtcbiAgICAgIHNlbGVjdENob2ljZSgpO1xuICAgIH0gZWxzZSBpZiAodGhpcy5wcm9wcy5yZWFkT25seSkge1xuICAgICAgLy8gaGFja2V0eSBoYWNrIHRvIHN0b3AgZHJvcGRvd24gY2hvaWNlcyBmcm9tIHRvZ2dsaW5nXG4gICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgIHRoaXMucHJvcHMub25DaGFuZ2UoJ3t7JyArIGtleSArICd9fScpO1xuICAgICAgdGhpcy5zZXRTdGF0ZSh7IGlzQ2hvaWNlc09wZW46IGZhbHNlIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLnN3aXRjaFRvQ29kZU1pcnJvcihzZWxlY3RDaG9pY2UpO1xuICAgIH1cbiAgfSxcblxuICBmb2N1czogZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuc3dpdGNoVG9Db2RlTWlycm9yKCgpID0+IHtcbiAgICAgIHRoaXMuY29kZU1pcnJvci5mb2N1cygpO1xuICAgICAgdGhpcy5jb2RlTWlycm9yLnNldEN1cnNvcih0aGlzLmNvZGVNaXJyb3IubGluZUNvdW50KCksIDApO1xuICAgIH0pO1xuICB9LFxuXG4gIGluc2VydEJ0bjogZnVuY3Rpb24gKCkge1xuICAgIGlmICh0aGlzLmlzUmVhZE9ubHkoKSkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgdmFyIG9uSW5zZXJ0Q2xpY2sgPSBmdW5jdGlvbiAoKSB7XG4gICAgICB0aGlzLnNldFN0YXRlKHtzZWxlY3RlZFRhZ1BvczogbnVsbH0pO1xuICAgICAgdGhpcy5vblRvZ2dsZUNob2ljZXMoKTtcbiAgICB9O1xuXG4gICAgcmV0dXJuIHRoaXMucHJvcHMuY29uZmlnLmNyZWF0ZUVsZW1lbnQoJ2luc2VydC1idXR0b24nLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtyZWY6ICd0b2dnbGUnLCBvbkNsaWNrOiBvbkluc2VydENsaWNrLmJpbmQodGhpcyl9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICdJbnNlcnQuLi4nKTtcbiAgfSxcblxuICBjaG9pY2VzOiBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKHRoaXMuaXNSZWFkT25seSgpKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5wcm9wcy5jb25maWcuY3JlYXRlRWxlbWVudCgnY2hvaWNlcycsIHtcbiAgICAgIHJlZjogJ2Nob2ljZXMnLFxuICAgICAgY2hvaWNlczogdGhpcy5zdGF0ZS5yZXBsYWNlQ2hvaWNlcyxcbiAgICAgIG9wZW46IHRoaXMuc3RhdGUuaXNDaG9pY2VzT3BlbixcbiAgICAgIGlnbm9yZUNsb3NlTm9kZXM6IHRoaXMuZ2V0Q2xvc2VJZ25vcmVOb2RlcyxcbiAgICAgIG9uU2VsZWN0OiB0aGlzLmhhbmRsZUNob2ljZVNlbGVjdGlvbixcbiAgICAgIG9uQ2xvc2U6IHRoaXMub25DbG9zZUNob2ljZXMsXG4gICAgICBpc0FjY29yZGlvbjogdGhpcy5wcm9wcy5pc0FjY29yZGlvbixcbiAgICAgIGZpZWxkOiB0aGlzLnByb3BzLmZpZWxkXG4gICAgfSk7XG4gIH0sXG5cbiAgcmVuZGVyOiBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcy5yZW5kZXJXaXRoQ29uZmlnKCk7XG4gIH0sXG5cbiAgcmVuZGVyRGVmYXVsdDogZnVuY3Rpb24gKCkge1xuICAgIHZhciB0ZXh0Qm94Q2xhc3NlcyA9IGN4KF8uZXh0ZW5kKHt9LCB0aGlzLnByb3BzLmNsYXNzZXMsIHsncHJldHR5LXRleHQtYm94JzogdHJ1ZX0pKTtcblxuICAgIC8vIFJlbmRlciByZWFkLW9ubHkgdmVyc2lvbi5cbiAgICByZXR1cm4gKFxuICAgICAgPGRpdiBjbGFzc05hbWU9e2N4KHsncHJldHR5LXRleHQtd3JhcHBlcic6IHRydWUsICdjaG9pY2VzLW9wZW4nOiB0aGlzLnN0YXRlLmlzQ2hvaWNlc09wZW59KX0gb25Nb3VzZUVudGVyPXt0aGlzLnN3aXRjaFRvQ29kZU1pcnJvcn0+XG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPXt0ZXh0Qm94Q2xhc3Nlc30gdGFiSW5kZXg9e3RoaXMucHJvcHMudGFiSW5kZXh9IG9uRm9jdXM9e3RoaXMucHJvcHMub25Gb2N1c30gb25CbHVyPXt0aGlzLnByb3BzLm9uQmx1cn0+XG4gICAgICAgICAgPGRpdiByZWY9J3RleHRCb3gnIGNsYXNzTmFtZT0naW50ZXJuYWwtdGV4dC13cmFwcGVyJyAvPlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAge3RoaXMuaW5zZXJ0QnRuKCl9XG4gICAgICAgIHt0aGlzLmNob2ljZXMoKX1cbiAgICAgIDwvZGl2PlxuICAgICk7XG4gIH0sXG5cbiAgZ2V0Q2xvc2VJZ25vcmVOb2RlczogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLnJlZnMudG9nZ2xlLmdldERPTU5vZGUoKTtcbiAgfSxcblxuICBvblRvZ2dsZUNob2ljZXM6IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLnNldENob2ljZXNPcGVuKCF0aGlzLnN0YXRlLmlzQ2hvaWNlc09wZW4pO1xuICB9LFxuXG4gIHNldENob2ljZXNPcGVuOiBmdW5jdGlvbiAoaXNPcGVuKSB7XG4gICAgdmFyIGFjdGlvbiA9IGlzT3BlbiA/ICdvcGVuLXJlcGxhY2VtZW50cycgOiAnY2xvc2UtcmVwbGFjZW1lbnRzJztcbiAgICB0aGlzLm9uU3RhcnRBY3Rpb24oYWN0aW9uKTtcbiAgICB0aGlzLnNldFN0YXRlKHsgaXNDaG9pY2VzT3BlbjogaXNPcGVuIH0pO1xuICB9LFxuXG4gIG9uQ2xvc2VDaG9pY2VzOiBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKHRoaXMuc3RhdGUuaXNDaG9pY2VzT3Blbikge1xuICAgICAgdGhpcy5zZXRDaG9pY2VzT3BlbihmYWxzZSk7XG4gICAgfVxuICB9LFxuXG4gIGNyZWF0ZUVkaXRvcjogZnVuY3Rpb24gKCkge1xuICAgIGlmICh0aGlzLnN0YXRlLmNvZGVNaXJyb3JNb2RlKSB7XG4gICAgICB0aGlzLmNyZWF0ZUNvZGVNaXJyb3JFZGl0b3IoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5jcmVhdGVSZWFkb25seUVkaXRvcigpO1xuICAgIH1cbiAgfSxcblxuICB1cGRhdGVFZGl0b3I6IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAodGhpcy5zdGF0ZS5jb2RlTWlycm9yTW9kZSkge1xuICAgICAgdmFyIGNvZGVNaXJyb3JWYWx1ZSA9IHRoaXMuY29kZU1pcnJvci5nZXRWYWx1ZSgpO1xuICAgICAgaWYgKGNvZGVNaXJyb3JWYWx1ZSAhPT0gdGhpcy5zdGF0ZS52YWx1ZSkge1xuICAgICAgICAvLyBzd2l0Y2ggYmFjayB0byByZWFkLW9ubHkgbW9kZSB0byBtYWtlIGl0IGVhc2llciB0byByZW5kZXJcbiAgICAgICAgdGhpcy5yZW1vdmVDb2RlTWlycm9yRWRpdG9yKCk7XG4gICAgICAgIHRoaXMuY3JlYXRlUmVhZG9ubHlFZGl0b3IoKTtcbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICAgICAgY29kZU1pcnJvck1vZGU6IGZhbHNlXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmNyZWF0ZVJlYWRvbmx5RWRpdG9yKCk7XG4gICAgfVxuICB9LFxuXG4gIGNyZWF0ZUNvZGVNaXJyb3JFZGl0b3I6IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgb3B0aW9ucyA9IHtcbiAgICAgIGxpbmVXcmFwcGluZzogdHJ1ZSxcbiAgICAgIHRhYmluZGV4OiB0aGlzLnByb3BzLnRhYkluZGV4LFxuICAgICAgdmFsdWU6IFN0cmluZyh0aGlzLnN0YXRlLnZhbHVlKSxcbiAgICAgIG1vZGU6IG51bGwsXG4gICAgICBleHRyYUtleXM6IHtcbiAgICAgICAgVGFiOiBmYWxzZVxuICAgICAgfVxuICAgIH07XG5cbiAgICB2YXIgdGV4dEJveCA9IHRoaXMucmVmcy50ZXh0Qm94LmdldERPTU5vZGUoKTtcbiAgICB0ZXh0Qm94LmlubmVySFRNTCA9ICcnOyAvLyByZWxlYXNlIGFueSBwcmV2aW91cyByZWFkLW9ubHkgY29udGVudCBzbyBpdCBjYW4gYmUgR0MnZWRcblxuICAgIHRoaXMuY29kZU1pcnJvciA9IENvZGVNaXJyb3IodGV4dEJveCwgb3B0aW9ucyk7XG4gICAgdGhpcy5jb2RlTWlycm9yLm9uKCdjaGFuZ2UnLCB0aGlzLm9uQ29kZU1pcnJvckNoYW5nZSk7XG5cbiAgICB0aGlzLnRhZ0NvZGVNaXJyb3IoKTtcbiAgfSxcblxuICB0YWdDb2RlTWlycm9yOiBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIHBvc2l0aW9ucyA9IHRoaXMuc3RhdGUudHJhbnNsYXRvci5nZXRUYWdQb3NpdGlvbnModGhpcy5jb2RlTWlycm9yLmdldFZhbHVlKCkpO1xuICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgIHZhciB0YWdPcHMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICBwb3NpdGlvbnMuZm9yRWFjaChmdW5jdGlvbiAocG9zKSB7XG4gICAgICAgIHZhciBub2RlID0gc2VsZi5jcmVhdGVUYWdOb2RlKHBvcyk7XG4gICAgICAgIHNlbGYuY29kZU1pcnJvci5tYXJrVGV4dCh7bGluZTogcG9zLmxpbmUsIGNoOiBwb3Muc3RhcnR9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAge2xpbmU6IHBvcy5saW5lLCBjaDogcG9zLnN0b3B9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAge3JlcGxhY2VkV2l0aDogbm9kZSwgaGFuZGxlTW91c2VFdmVudHM6IHRydWV9KTtcbiAgICAgIH0pO1xuICAgIH07XG5cbiAgICB0aGlzLmNvZGVNaXJyb3Iub3BlcmF0aW9uKHRhZ09wcyk7XG4gIH0sXG5cbiAgb25Db2RlTWlycm9yQ2hhbmdlOiBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKHRoaXMudXBkYXRpbmdDb2RlTWlycm9yKSB7XG4gICAgICAvLyBhdm9pZCByZWN1cnNpdmUgdXBkYXRlIGN5Y2xlLCBhbmQgbWFyayB0aGUgY29kZSBtaXJyb3IgbWFudWFsIHVwZGF0ZSBhcyBkb25lXG4gICAgICB0aGlzLnVwZGF0aW5nQ29kZU1pcnJvciA9IGZhbHNlO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHZhciBuZXdWYWx1ZSA9IHRoaXMuY29kZU1pcnJvci5nZXRWYWx1ZSgpO1xuICAgIHRoaXMucHJvcHMub25DaGFuZ2UobmV3VmFsdWUpO1xuICAgIHRoaXMuc2V0U3RhdGUoe3ZhbHVlOiBuZXdWYWx1ZX0pO1xuICAgIHRoaXMudGFnQ29kZU1pcnJvcigpO1xuICB9LFxuXG4gIGNyZWF0ZVJlYWRvbmx5RWRpdG9yOiBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIHRleHRCb3hOb2RlID0gdGhpcy5yZWZzLnRleHRCb3guZ2V0RE9NTm9kZSgpO1xuXG4gICAgdmFyIHRva2VucyA9IHRoaXMuc3RhdGUudHJhbnNsYXRvci50b2tlbml6ZSh0aGlzLnN0YXRlLnZhbHVlKTtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgdmFyIG5vZGVzID0gdG9rZW5zLm1hcChmdW5jdGlvbiAocGFydCwgaSkge1xuICAgICAgaWYgKHBhcnQudHlwZSA9PT0gJ3RhZycpIHtcbiAgICAgICAgdmFyIGxhYmVsID0gc2VsZi5zdGF0ZS50cmFuc2xhdG9yLmdldExhYmVsKHBhcnQudmFsdWUpO1xuICAgICAgICB2YXIgcHJvcHMgPSB7a2V5OiBpLCB0YWc6IHBhcnQudmFsdWUsIHJlcGxhY2VDaG9pY2VzOiBzZWxmLnN0YXRlLnJlcGxhY2VDaG9pY2VzLCBmaWVsZDogc2VsZi5wcm9wcy5maWVsZH07XG4gICAgICAgIHJldHVybiBzZWxmLnByb3BzLmNvbmZpZy5jcmVhdGVFbGVtZW50KCdwcmV0dHktdGFnJywgcHJvcHMsIGxhYmVsKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiA8c3BhbiBrZXk9e2l9PntwYXJ0LnZhbHVlfTwvc3Bhbj47XG4gICAgfSk7XG5cbiAgICBSZWFjdC5yZW5kZXIoPHNwYW4+e25vZGVzfTwvc3Bhbj4sIHRleHRCb3hOb2RlKTtcbiAgfSxcblxuICByZW1vdmVDb2RlTWlycm9yRWRpdG9yOiBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIHRleHRCb3hOb2RlID0gdGhpcy5yZWZzLnRleHRCb3guZ2V0RE9NTm9kZSgpO1xuICAgIHZhciBjbU5vZGUgPSB0ZXh0Qm94Tm9kZS5maXJzdENoaWxkO1xuICAgIHRleHRCb3hOb2RlLnJlbW92ZUNoaWxkKGNtTm9kZSk7XG4gICAgdGhpcy5jb2RlTWlycm9yID0gbnVsbDtcbiAgfSxcblxuICBzd2l0Y2hUb0NvZGVNaXJyb3I6IGZ1bmN0aW9uIChjYikge1xuICAgIGlmICh0aGlzLmlzUmVhZE9ubHkoKSkge1xuICAgICAgcmV0dXJuOyAvLyBuZXZlciByZW5kZXIgaW4gY29kZSBtaXJyb3IgaWYgcmVhZC1vbmx5XG4gICAgfVxuXG4gICAgaWYgKCF0aGlzLnN0YXRlLmNvZGVNaXJyb3JNb2RlICYmICF0aGlzLnByb3BzLnJlYWRPbmx5KSB7XG4gICAgICB0aGlzLnNldFN0YXRlKHtjb2RlTWlycm9yTW9kZTogdHJ1ZX0sICgpID0+IHtcbiAgICAgICAgaWYgKHRoaXMuY29kZU1pcnJvciAmJiBfLmlzRnVuY3Rpb24oY2IpKSB7XG4gICAgICAgICAgY2IoKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuICB9LFxuXG4gIG9uVGFnQ2xpY2s6IGZ1bmN0aW9uICgpIHtcbiAgICBjb25zdCBjdXJzb3IgPSB0aGlzLmNvZGVNaXJyb3IuZ2V0Q3Vyc29yKCk7XG4gICAgY29uc3QgcG9zID0gdGhpcy5zdGF0ZS50cmFuc2xhdG9yLmdldFRydWVUYWdQb3NpdGlvbih0aGlzLnN0YXRlLnZhbHVlLCBjdXJzb3IpO1xuXG4gICAgdGhpcy5zZXRTdGF0ZSh7c2VsZWN0ZWRUYWdQb3M6IHBvc30pO1xuICAgIHRoaXMub25Ub2dnbGVDaG9pY2VzKCk7XG4gIH0sXG5cbiAgY3JlYXRlVGFnTm9kZTogZnVuY3Rpb24gKHBvcykge1xuICAgIHZhciBub2RlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xuICAgIHZhciBsYWJlbCA9IHRoaXMuc3RhdGUudHJhbnNsYXRvci5nZXRMYWJlbChwb3MudGFnKTtcbiAgICB2YXIgY29uZmlnID0gdGhpcy5wcm9wcy5jb25maWc7XG5cbiAgICB2YXIgcHJvcHMgPSB7b25DbGljazogdGhpcy5vblRhZ0NsaWNrLCBmaWVsZDogdGhpcy5wcm9wcy5maWVsZCwgdGFnOiBwb3MudGFnfTtcblxuICAgIFJlYWN0LnJlbmRlcihcbiAgICAgIGNvbmZpZy5jcmVhdGVFbGVtZW50KCdwcmV0dHktdGFnJywgcHJvcHMsIGxhYmVsKSxcbiAgICAgIG5vZGVcbiAgICApO1xuXG4gICAgcmV0dXJuIG5vZGU7XG4gIH1cbn0pO1xuIiwiLy8gIyByZW1vdmUtaXRlbSBjb21wb25lbnRcblxuLypcblJlbW92ZSBhbiBpdGVtLlxuKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgUmVhY3QgPSByZXF1aXJlKCdyZWFjdC9hZGRvbnMnKTtcbnZhciBSID0gUmVhY3QuRE9NO1xudmFyIGN4ID0gcmVxdWlyZSgnY2xhc3NuYW1lcycpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcblxuICBkaXNwbGF5TmFtZTogJ1JlbW92ZUl0ZW0nLFxuXG4gIG1peGluczogW3JlcXVpcmUoJy4uLy4uL21peGlucy9oZWxwZXInKV0sXG5cbiAgZ2V0RGVmYXVsdFByb3BzOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGxhYmVsOiAnW3JlbW92ZV0nXG4gICAgfTtcbiAgfSxcblxuICByZW5kZXI6IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpcy5yZW5kZXJXaXRoQ29uZmlnKCk7XG4gIH0sXG5cbiAgb25Nb3VzZU92ZXJSZW1vdmU6IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAodGhpcy5wcm9wcy5vbk1heWJlUmVtb3ZlKSB7XG4gICAgICB0aGlzLnByb3BzLm9uTWF5YmVSZW1vdmUodHJ1ZSk7XG4gICAgfVxuICB9LFxuXG4gIG9uTW91c2VPdXRSZW1vdmU6IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAodGhpcy5wcm9wcy5vbk1heWJlUmVtb3ZlKSB7XG4gICAgICB0aGlzLnByb3BzLm9uTWF5YmVSZW1vdmUoZmFsc2UpO1xuICAgIH1cbiAgfSxcblxuICByZW5kZXJEZWZhdWx0OiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIFIuc3Bhbih7XG4gICAgICBjbGFzc05hbWU6IGN4KHRoaXMucHJvcHMuY2xhc3NlcyksIG9uQ2xpY2s6IHRoaXMucHJvcHMub25DbGljayxcbiAgICAgIG9uTW91c2VPdmVyOiB0aGlzLm9uTW91c2VPdmVyUmVtb3ZlLCBvbk1vdXNlT3V0OiB0aGlzLm9uTW91c2VPdXRSZW1vdmVcbiAgICB9LCB0aGlzLnByb3BzLmxhYmVsKTtcbiAgfVxufSk7XG4iLCIvLyAjIGhlbHAgY29tcG9uZW50XG5cbi8qXG5KdXN0IHRoZSBoZWxwIHRleHQgYmxvY2suXG4qL1xuXG4ndXNlIHN0cmljdCc7XG5cbnZhciBSZWFjdCA9IHJlcXVpcmUoJ3JlYWN0L2FkZG9ucycpO1xudmFyIFIgPSBSZWFjdC5ET007XG52YXIgY3ggPSByZXF1aXJlKCdjbGFzc25hbWVzJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXG4gIGRpc3BsYXlOYW1lOiAnU2FtcGxlJyxcblxuICBtaXhpbnM6IFtyZXF1aXJlKCcuLi8uLi9taXhpbnMvaGVscGVyJyldLFxuXG4gIHJlbmRlcjogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLnJlbmRlcldpdGhDb25maWcoKTtcbiAgfSxcblxuICByZW5kZXJEZWZhdWx0OiBmdW5jdGlvbiAoKSB7XG5cbiAgICB2YXIgY2hvaWNlID0gdGhpcy5wcm9wcy5jaG9pY2U7XG5cbiAgICByZXR1cm4gY2hvaWNlLnNhbXBsZSA/XG4gICAgICBSLmRpdih7Y2xhc3NOYW1lOiBjeCh0aGlzLnByb3BzLmNsYXNzTmFtZSl9LFxuICAgICAgICBjaG9pY2Uuc2FtcGxlXG4gICAgICApIDpcbiAgICAgIFIuc3BhbihudWxsKTtcbiAgfVxufSk7XG4iLCIvLyAjIHNlbGVjdC12YWx1ZSBjb21wb25lbnRcblxuLypcblJlbmRlciBhIHNlbGVjdCBkcm9wZG93biBmb3IgYSBsaXN0IG9mIGNob2ljZXMuIENob2ljZXMgdmFsdWVzIGNhbiBiZSBvZiBhbnlcbnR5cGUuXG4qL1xuXG4ndXNlIHN0cmljdCc7XG5cbnZhciBSZWFjdCA9IHJlcXVpcmUoJ3JlYWN0L2FkZG9ucycpO1xudmFyIFIgPSBSZWFjdC5ET007XG52YXIgXyA9IHJlcXVpcmUoJy4uLy4uL3VuZGFzaCcpO1xudmFyIGN4ID0gcmVxdWlyZSgnY2xhc3NuYW1lcycpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcblxuICBkaXNwbGF5TmFtZTogJ1NlbGVjdFZhbHVlJyxcblxuICBtaXhpbnM6IFtyZXF1aXJlKCcuLi8uLi9taXhpbnMvaGVscGVyJyldLFxuXG4gIG9uQ2hhbmdlOiBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICB2YXIgY2hvaWNlVmFsdWUgPSBldmVudC50YXJnZXQudmFsdWU7XG4gICAgdmFyIGNob2ljZVR5cGUgPSBjaG9pY2VWYWx1ZS5zdWJzdHJpbmcoMCwgY2hvaWNlVmFsdWUuaW5kZXhPZignOicpKTtcbiAgICBpZiAoY2hvaWNlVHlwZSA9PT0gJ2Nob2ljZScpIHtcbiAgICAgIHZhciBjaG9pY2VJbmRleCA9IGNob2ljZVZhbHVlLnN1YnN0cmluZyhjaG9pY2VWYWx1ZS5pbmRleE9mKCc6JykgKyAxKTtcbiAgICAgIGNob2ljZUluZGV4ID0gcGFyc2VJbnQoY2hvaWNlSW5kZXgpO1xuICAgICAgdGhpcy5wcm9wcy5vbkNoYW5nZSh0aGlzLnByb3BzLmNob2ljZXNbY2hvaWNlSW5kZXhdLnZhbHVlKTtcbiAgICB9XG4gIH0sXG5cbiAgcmVuZGVyOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMucmVuZGVyV2l0aENvbmZpZygpO1xuICB9LFxuXG4gIHJlbmRlckRlZmF1bHQ6IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgY29uZmlnID0gdGhpcy5wcm9wcy5jb25maWc7XG4gICAgdmFyIGNob2ljZXMgPSB0aGlzLnByb3BzLmNob2ljZXMgfHwgW107XG5cbiAgICB2YXIgY2hvaWNlc09yTG9hZGluZztcblxuICAgIGlmICgoY2hvaWNlcy5sZW5ndGggPT09IDEgJiYgY2hvaWNlc1swXS52YWx1ZSA9PT0gJy8vL2xvYWRpbmcvLy8nKSB8fCBjb25maWcuZmllbGRJc0xvYWRpbmcodGhpcy5wcm9wcy5maWVsZCkpIHtcbiAgICAgIGNob2ljZXNPckxvYWRpbmcgPSBjb25maWcuY3JlYXRlRWxlbWVudCgnbG9hZGluZy1jaG9pY2VzJywge30pO1xuICAgIH0gZWxzZSB7XG4gICAgICB2YXIgdmFsdWUgPSB0aGlzLnByb3BzLmZpZWxkLnZhbHVlICE9PSB1bmRlZmluZWQgPyB0aGlzLnByb3BzLmZpZWxkLnZhbHVlIDogJyc7XG5cbiAgICAgIGNob2ljZXMgPSBjaG9pY2VzLm1hcChmdW5jdGlvbiAoY2hvaWNlLCBpKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgY2hvaWNlVmFsdWU6ICdjaG9pY2U6JyArIGksXG4gICAgICAgICAgdmFsdWU6IGNob2ljZS52YWx1ZSxcbiAgICAgICAgICBsYWJlbDogY2hvaWNlLmxhYmVsXG4gICAgICAgIH07XG4gICAgICB9KTtcblxuICAgICAgdmFyIHZhbHVlQ2hvaWNlID0gXy5maW5kKGNob2ljZXMsIGZ1bmN0aW9uIChjaG9pY2UpIHtcbiAgICAgICAgcmV0dXJuIGNob2ljZS52YWx1ZSA9PT0gdmFsdWU7XG4gICAgICB9KTtcblxuICAgICAgaWYgKHZhbHVlQ2hvaWNlID09PSB1bmRlZmluZWQpIHtcblxuICAgICAgICB2YXIgbGFiZWwgPSB2YWx1ZTtcbiAgICAgICAgaWYgKCFfLmlzU3RyaW5nKHZhbHVlKSkge1xuICAgICAgICAgIGxhYmVsID0gSlNPTi5zdHJpbmdpZnkodmFsdWUpO1xuICAgICAgICB9XG4gICAgICAgIHZhbHVlQ2hvaWNlID0ge1xuICAgICAgICAgIGNob2ljZVZhbHVlOiAndmFsdWU6JyxcbiAgICAgICAgICB2YWx1ZTogdmFsdWUsXG4gICAgICAgICAgbGFiZWw6IGxhYmVsXG4gICAgICAgIH07XG4gICAgICAgIGNob2ljZXMgPSBbdmFsdWVDaG9pY2VdLmNvbmNhdChjaG9pY2VzKTtcbiAgICAgIH1cblxuICAgICAgY2hvaWNlc09yTG9hZGluZyA9IFIuc2VsZWN0KHtcbiAgICAgICAgY2xhc3NOYW1lOiBjeCh0aGlzLnByb3BzLmNsYXNzZXMpLFxuICAgICAgICBvbkNoYW5nZTogdGhpcy5vbkNoYW5nZSxcbiAgICAgICAgdmFsdWU6IHZhbHVlQ2hvaWNlLmNob2ljZVZhbHVlLFxuICAgICAgICBvbkZvY3VzOiB0aGlzLm9uRm9jdXNBY3Rpb24sXG4gICAgICAgIG9uQmx1cjogdGhpcy5vbkJsdXJBY3Rpb24sXG4gICAgICAgIGRpc2FibGVkOiB0aGlzLmlzUmVhZE9ubHkoKVxuICAgICAgfSxcbiAgICAgIGNob2ljZXMubWFwKGZ1bmN0aW9uIChjaG9pY2UsIGkpIHtcbiAgICAgICAgcmV0dXJuIFIub3B0aW9uKHtcbiAgICAgICAgICBrZXk6IGksXG4gICAgICAgICAgdmFsdWU6IGNob2ljZS5jaG9pY2VWYWx1ZVxuICAgICAgICB9LCBjaG9pY2UubGFiZWwpO1xuICAgICAgfSlcbiAgICApO1xuICB9XG5cbiAgcmV0dXJuIGNob2ljZXNPckxvYWRpbmc7XG59XG59KTtcbiIsIid1c2Ugc3RyaWN0JztcbnZhciBfID0gcmVxdWlyZSgnLi4vLi4vdW5kYXNoJyk7XG5cbmNvbnN0IGJ1aWxkQ2hvaWNlc01hcCA9IChyZXBsYWNlQ2hvaWNlcykgPT4ge1xuICB2YXIgY2hvaWNlcyA9IHt9O1xuICByZXBsYWNlQ2hvaWNlcy5mb3JFYWNoKGZ1bmN0aW9uIChjaG9pY2UpIHtcbiAgICB2YXIga2V5ID0gY2hvaWNlLnZhbHVlO1xuICAgIGNob2ljZXNba2V5XSA9IGNob2ljZS5sYWJlbDtcbiAgfSk7XG4gIHJldHVybiBjaG9pY2VzO1xufTtcblxuY29uc3QgZ2V0VGFnUG9zaXRpb25zID0gKHRleHQpID0+IHtcbiAgdmFyIGxpbmVzID0gdGV4dC5zcGxpdCgnXFxuJyk7XG4gIHZhciByZSA9IC9cXHtcXHsuKz9cXH1cXH0vZztcbiAgdmFyIHBvc2l0aW9ucyA9IFtdO1xuICB2YXIgbTtcblxuICBmb3IodmFyIGkgPSAwOyBpIDwgbGluZXMubGVuZ3RoOyBpKyspIHtcbiAgICB3aGlsZSAoKG0gPSByZS5leGVjKGxpbmVzW2ldKSkgIT09IG51bGwpIHtcbiAgICAgIHZhciB0YWcgPSBtWzBdLnN1YnN0cmluZygyLCBtWzBdLmxlbmd0aC0yKTtcbiAgICAgIHBvc2l0aW9ucy5wdXNoKHtcbiAgICAgICAgbGluZTogaSxcbiAgICAgICAgc3RhcnQ6IG0uaW5kZXgsXG4gICAgICAgIHN0b3A6IG0uaW5kZXggKyBtWzBdLmxlbmd0aCxcbiAgICAgICAgdGFnOiB0YWdcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuICByZXR1cm4gcG9zaXRpb25zO1xufTtcblxuY29uc3QgdG9rZW5pemUgPSAodGV4dCkgPT4ge1xuICB0ZXh0ID0gU3RyaW5nKHRleHQpO1xuXG4gIHZhciByZWdleHAgPSAvKFxce1xce3xcXH1cXH0pLztcbiAgdmFyIHBhcnRzID0gdGV4dC5zcGxpdChyZWdleHApO1xuXG4gIHZhciB0b2tlbnMgPSBbXTtcbiAgdmFyIGluVGFnID0gZmFsc2U7XG4gIHBhcnRzLmZvckVhY2goZnVuY3Rpb24gKHBhcnQpIHtcbiAgICBpZiAocGFydCA9PT0gJ3t7Jykge1xuICAgICAgaW5UYWcgPSB0cnVlO1xuICAgIH0gZWxzZSBpZiAocGFydCA9PT0gJ319Jykge1xuICAgICAgaW5UYWcgPSBmYWxzZTtcbiAgICB9IGVsc2UgaWYgKGluVGFnKSB7XG4gICAgICB0b2tlbnMucHVzaCh7dHlwZTogJ3RhZycsIHZhbHVlOiBwYXJ0fSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRva2Vucy5wdXNoKHt0eXBlOiAnc3RyaW5nJywgdmFsdWU6IHBhcnR9KTtcbiAgICB9XG4gIH0pO1xuICByZXR1cm4gdG9rZW5zO1xufTtcblxuLypcbiAgIEdpdmVuIGEgQ29kZU1pcnJvciBkb2N1bWVudCBwb3NpdGlvbiBsaWtlIHtsaW5lOiAwLCBjaDogMTB9LCByZXR1cm5cbiAgIHRoZSB0YWcgcG9zaXRpb24gb2JqZWN0IGZvciB0aGF0IHBvc2l0aW9uLCBmb3IgZXhhbXBsZSB7bGluZTogMCxcbiAgIHN0YXJ0OiA4LCBzdG9wOiAxMn1cblxuICAgV2hlbiBjbGlja2luZyBvbiBhIHByZXR0eSB0YWcsIENvZGVNaXJyb3IgLmdldEN1cnNvcigpIG1heSByZXR1cm5cbiAgIGVpdGhlciB0aGUgcG9zaXRpb24gb2YgdGhlIHN0YXJ0IG9yIHRoZSBlbmQgb2YgdGhlIHRhZywgc28gd2UgdXNlXG4gICB0aGlzIGZ1bmN0aW9uIHRvIG5vcm1hbGl6ZSBpdC5cblxuICAgQ2xpY2tpbmcgb24gYSBwcmV0dHkgdGFnIGlzIGp1bXB5IC0gdGhlIGN1cnNvciBnb2VzIGZyb20gb25lIGVuZCB0b1xuICAgdGhlIG90aGVyIGVhY2ggdGltZSB5b3UgY2xpY2sgaXQuIFdlIHNob3VsZCBwcm9iYWJseSBmaXggdGhhdCwgYW5kXG4gICB0aGUgbmVlZCBmb3IgdGhpcyBmdW5jdGlvbiBtaWdodCBnbyBhd2F5LlxuKi9cbmNvbnN0IGdldFRydWVUYWdQb3NpdGlvbiA9ICh0ZXh0LCBjbVBvcykgPT4ge1xuICBjb25zdCBwb3NpdGlvbnMgPSBnZXRUYWdQb3NpdGlvbnModGV4dCk7XG4gIHJldHVybiBfLmZpbmQocG9zaXRpb25zLCBwID0+IGNtUG9zLmxpbmUgPT09IHAubGluZSAmJiBjbVBvcy5jaCA+PSBwLnN0YXJ0ICYmIGNtUG9zLmNoIDw9IHAuc3RvcCk7XG59O1xuXG4vKlxuICAgQ3JlYXRlcyBoZWxwZXIgdG8gdHJhbnNsYXRlIGJldHdlZW4gdGFncyBsaWtlIHt7Zmlyc3ROYW1lfX0gYW5kXG4gICBhbiBlbmNvZGVkIHJlcHJlc2VudGF0aW9uIHN1aXRhYmxlIGZvciB1c2UgaW4gQ29kZU1pcnJvci5cbiAqL1xuY29uc3QgVGFnVHJhbnNsYXRvciA9IChyZXBsYWNlQ2hvaWNlcywgaHVtYW5pemUpID0+IHtcbiAgLy8gTWFwIG9mIHRhZyB0byBsYWJlbCAnZmlyc3ROYW1lJyAtLT4gJ0ZpcnN0IE5hbWUnXG4gIHZhciBjaG9pY2VzID0gYnVpbGRDaG9pY2VzTWFwKHJlcGxhY2VDaG9pY2VzKTtcblxuICByZXR1cm4ge1xuICAgIC8qXG4gICAgICAgR2V0IGxhYmVsIGZvciB0YWcuICBGb3IgZXhhbXBsZSAnZmlyc3ROYW1lJyBiZWNvbWVzICdGaXJzdCBOYW1lJy5cbiAgICAgICBSZXR1cm5zIGEgaHVtYW5pemVkIHZlcnNpb24gb2YgdGhlIHRhZyBpZiB3ZSBkb24ndCBoYXZlIGEgbGFiZWwgZm9yIHRoZSB0YWcuXG4gICAgICovXG4gICAgZ2V0TGFiZWw6ICh0YWcpID0+IHtcbiAgICAgIHZhciBsYWJlbCA9IGNob2ljZXNbdGFnXTtcbiAgICAgIGlmICghbGFiZWwpIHtcbiAgICAgICAgLy8gSWYgdGFnIG5vdCBmb3VuZCBhbmQgd2UgaGF2ZSBhIGh1bWFuaXplIGZ1bmN0aW9uLCBodW1hbml6ZSB0aGUgdGFnLlxuICAgICAgICAvLyBPdGhlcndpc2UganVzdCByZXR1cm4gdGhlIHRhZy5cbiAgICAgICAgbGFiZWwgPSBodW1hbml6ZSAmJiBodW1hbml6ZSh0YWcpIHx8IHRhZztcbiAgICAgIH1cbiAgICAgIHJldHVybiBsYWJlbDtcbiAgICB9LFxuXG4gICAgZ2V0VGFnUG9zaXRpb25zLFxuICAgIHRva2VuaXplLFxuICAgIGdldFRydWVUYWdQb3NpdGlvblxuICB9O1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBUYWdUcmFuc2xhdG9yO1xuIiwiLy8gIyBkZWZhdWx0LWNvbmZpZ1xuXG4vKlxuVGhpcyBpcyB0aGUgZGVmYXVsdCBjb25maWd1cmF0aW9uIHBsdWdpbiBmb3IgZm9ybWF0aWMuIFRvIGNoYW5nZSBmb3JtYXRpYydzXG5iZWhhdmlvciwganVzdCBjcmVhdGUgeW91ciBvd24gcGx1Z2luIGZ1bmN0aW9uIHRoYXQgcmV0dXJucyBhbiBvYmplY3Qgd2l0aFxubWV0aG9kcyB5b3Ugd2FudCB0byBhZGQgb3Igb3ZlcnJpZGUuXG4qL1xuXG4ndXNlIHN0cmljdCc7XG5cbnZhciBSZWFjdCA9IHJlcXVpcmUoJ3JlYWN0L2FkZG9ucycpO1xudmFyIFIgPSBSZWFjdC5ET007XG52YXIgXyA9IHJlcXVpcmUoJy4vdW5kYXNoJyk7XG5cbnZhciB1dGlscyA9IHJlcXVpcmUoJy4vdXRpbHMnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoY29uZmlnKSB7XG5cbiAgdmFyIGRlbGVnYXRlVG8gPSB1dGlscy5kZWxlZ2F0b3IoY29uZmlnKTtcblxuICByZXR1cm4ge1xuXG4gICAgLy8gRmllbGQgZWxlbWVudCBmYWN0b3JpZXMuIENyZWF0ZSBmaWVsZCBlbGVtZW50cy5cblxuICAgIGNyZWF0ZUVsZW1lbnRfRmllbGRzOiBSZWFjdC5jcmVhdGVGYWN0b3J5KHJlcXVpcmUoJy4vY29tcG9uZW50cy9maWVsZHMvZmllbGRzJykpLFxuXG4gICAgY3JlYXRlRWxlbWVudF9Hcm91cGVkRmllbGRzOiBSZWFjdC5jcmVhdGVGYWN0b3J5KHJlcXVpcmUoJy4vY29tcG9uZW50cy9maWVsZHMvZ3JvdXBlZC1maWVsZHMnKSksXG5cbiAgICBjcmVhdGVFbGVtZW50X1N0cmluZzogUmVhY3QuY3JlYXRlRmFjdG9yeShyZXF1aXJlKCcuL2NvbXBvbmVudHMvZmllbGRzL3N0cmluZycpKSxcblxuICAgIGNyZWF0ZUVsZW1lbnRfU2luZ2xlTGluZVN0cmluZzogUmVhY3QuY3JlYXRlRmFjdG9yeShyZXF1aXJlKCcuL2NvbXBvbmVudHMvZmllbGRzL3NpbmdsZS1saW5lLXN0cmluZycpKSxcblxuICAgIGNyZWF0ZUVsZW1lbnRfUGFzc3dvcmQ6IFJlYWN0LmNyZWF0ZUZhY3RvcnkocmVxdWlyZSgnLi9jb21wb25lbnRzL2ZpZWxkcy9wYXNzd29yZCcpKSxcblxuICAgIGNyZWF0ZUVsZW1lbnRfU2VsZWN0OiBSZWFjdC5jcmVhdGVGYWN0b3J5KHJlcXVpcmUoJy4vY29tcG9uZW50cy9maWVsZHMvc2VsZWN0JykpLFxuXG4gICAgY3JlYXRlRWxlbWVudF9QcmV0dHlTZWxlY3Q6IFJlYWN0LmNyZWF0ZUZhY3RvcnkocmVxdWlyZSgnLi9jb21wb25lbnRzL2ZpZWxkcy9wcmV0dHktc2VsZWN0JykpLFxuXG4gICAgY3JlYXRlRWxlbWVudF9Cb29sZWFuOiBSZWFjdC5jcmVhdGVGYWN0b3J5KHJlcXVpcmUoJy4vY29tcG9uZW50cy9maWVsZHMvYm9vbGVhbicpKSxcblxuICAgIGNyZWF0ZUVsZW1lbnRfUHJldHR5Qm9vbGVhbjogUmVhY3QuY3JlYXRlRmFjdG9yeShyZXF1aXJlKCcuL2NvbXBvbmVudHMvZmllbGRzL3ByZXR0eS1ib29sZWFuJykpLFxuXG4gICAgY3JlYXRlRWxlbWVudF9DaGVja2JveEJvb2xlYW46IFJlYWN0LmNyZWF0ZUZhY3RvcnkocmVxdWlyZSgnLi9jb21wb25lbnRzL2ZpZWxkcy9jaGVja2JveC1ib29sZWFuJykpLFxuXG4gICAgLy8gY3JlYXRlRWxlbWVudF9QcmV0dHlUZXh0OiBSZWFjdC5jcmVhdGVGYWN0b3J5KHJlcXVpcmUoJy4vY29tcG9uZW50cy9maWVsZHMvcHJldHR5LXRleHQnKSksXG5cbiAgICBjcmVhdGVFbGVtZW50X0NvZGU6IFJlYWN0LmNyZWF0ZUZhY3RvcnkocmVxdWlyZSgnLi9jb21wb25lbnRzL2ZpZWxkcy9jb2RlJykpLFxuXG4gICAgY3JlYXRlRWxlbWVudF9QcmV0dHlUZXh0OiBSZWFjdC5jcmVhdGVGYWN0b3J5KHJlcXVpcmUoJy4vY29tcG9uZW50cy9maWVsZHMvcHJldHR5LXRleHQyJykpLFxuXG4gICAgY3JlYXRlRWxlbWVudF9QcmV0dHlUYWc6IFJlYWN0LmNyZWF0ZUZhY3RvcnkocmVxdWlyZSgnLi9jb21wb25lbnRzL2hlbHBlcnMvcHJldHR5LXRhZycpKSxcblxuICAgIGNyZWF0ZUVsZW1lbnRfQXJyYXk6IFJlYWN0LmNyZWF0ZUZhY3RvcnkocmVxdWlyZSgnLi9jb21wb25lbnRzL2ZpZWxkcy9hcnJheScpKSxcblxuICAgIGNyZWF0ZUVsZW1lbnRfQ2hlY2tib3hBcnJheTogUmVhY3QuY3JlYXRlRmFjdG9yeShyZXF1aXJlKCcuL2NvbXBvbmVudHMvZmllbGRzL2NoZWNrYm94LWFycmF5JykpLFxuXG4gICAgY3JlYXRlRWxlbWVudF9PYmplY3Q6IFJlYWN0LmNyZWF0ZUZhY3RvcnkocmVxdWlyZSgnLi9jb21wb25lbnRzL2ZpZWxkcy9vYmplY3QnKSksXG5cbiAgICBjcmVhdGVFbGVtZW50X0pzb246IFJlYWN0LmNyZWF0ZUZhY3RvcnkocmVxdWlyZSgnLi9jb21wb25lbnRzL2ZpZWxkcy9qc29uJykpLFxuXG4gICAgY3JlYXRlRWxlbWVudF9Vbmtub3duRmllbGQ6IFJlYWN0LmNyZWF0ZUZhY3RvcnkocmVxdWlyZSgnLi9jb21wb25lbnRzL2ZpZWxkcy91bmtub3duJykpLFxuXG4gICAgY3JlYXRlRWxlbWVudF9Db3B5OiBSZWFjdC5jcmVhdGVGYWN0b3J5KHJlcXVpcmUoJy4vY29tcG9uZW50cy9maWVsZHMvY29weScpKSxcblxuXG4gICAgLy8gT3RoZXIgZWxlbWVudCBmYWN0b3JpZXMuIENyZWF0ZSBoZWxwZXIgZWxlbWVudHMgdXNlZCBieSBmaWVsZCBjb21wb25lbnRzLlxuXG4gICAgY3JlYXRlRWxlbWVudF9GaWVsZDogUmVhY3QuY3JlYXRlRmFjdG9yeShyZXF1aXJlKCcuL2NvbXBvbmVudHMvaGVscGVycy9maWVsZCcpKSxcblxuICAgIGNyZWF0ZUVsZW1lbnRfTGFiZWw6IFJlYWN0LmNyZWF0ZUZhY3RvcnkocmVxdWlyZSgnLi9jb21wb25lbnRzL2hlbHBlcnMvbGFiZWwnKSksXG5cbiAgICBjcmVhdGVFbGVtZW50X0hlbHA6IFJlYWN0LmNyZWF0ZUZhY3RvcnkocmVxdWlyZSgnLi9jb21wb25lbnRzL2hlbHBlcnMvaGVscCcpKSxcblxuICAgIGNyZWF0ZUVsZW1lbnRfQ2hvaWNlczogUmVhY3QuY3JlYXRlRmFjdG9yeShyZXF1aXJlKCcuL2NvbXBvbmVudHMvaGVscGVycy9jaG9pY2VzJykpLFxuXG4gICAgY3JlYXRlRWxlbWVudF9DaG9pY2VzU2VhcmNoOiBSZWFjdC5jcmVhdGVGYWN0b3J5KHJlcXVpcmUoJy4vY29tcG9uZW50cy9oZWxwZXJzL2Nob2ljZXMtc2VhcmNoJykpLFxuXG4gICAgY3JlYXRlRWxlbWVudF9Mb2FkaW5nQ2hvaWNlczogUmVhY3QuY3JlYXRlRmFjdG9yeShyZXF1aXJlKCcuL2NvbXBvbmVudHMvaGVscGVycy9sb2FkaW5nLWNob2ljZXMnKSksXG5cbiAgICBjcmVhdGVFbGVtZW50X0xvYWRpbmdDaG9pY2U6IFJlYWN0LmNyZWF0ZUZhY3RvcnkocmVxdWlyZSgnLi9jb21wb25lbnRzL2hlbHBlcnMvbG9hZGluZy1jaG9pY2UnKSksXG5cbiAgICBjcmVhdGVFbGVtZW50X0FycmF5Q29udHJvbDogUmVhY3QuY3JlYXRlRmFjdG9yeShyZXF1aXJlKCcuL2NvbXBvbmVudHMvaGVscGVycy9hcnJheS1jb250cm9sJykpLFxuXG4gICAgY3JlYXRlRWxlbWVudF9BcnJheUl0ZW1Db250cm9sOiBSZWFjdC5jcmVhdGVGYWN0b3J5KHJlcXVpcmUoJy4vY29tcG9uZW50cy9oZWxwZXJzL2FycmF5LWl0ZW0tY29udHJvbCcpKSxcblxuICAgIGNyZWF0ZUVsZW1lbnRfQXJyYXlJdGVtVmFsdWU6IFJlYWN0LmNyZWF0ZUZhY3RvcnkocmVxdWlyZSgnLi9jb21wb25lbnRzL2hlbHBlcnMvYXJyYXktaXRlbS12YWx1ZScpKSxcblxuICAgIGNyZWF0ZUVsZW1lbnRfQXJyYXlJdGVtOiBSZWFjdC5jcmVhdGVGYWN0b3J5KHJlcXVpcmUoJy4vY29tcG9uZW50cy9oZWxwZXJzL2FycmF5LWl0ZW0nKSksXG5cbiAgICBjcmVhdGVFbGVtZW50X0ZpZWxkVGVtcGxhdGVDaG9pY2VzOiBSZWFjdC5jcmVhdGVGYWN0b3J5KHJlcXVpcmUoJy4vY29tcG9uZW50cy9oZWxwZXJzL2ZpZWxkLXRlbXBsYXRlLWNob2ljZXMnKSksXG5cbiAgICBjcmVhdGVFbGVtZW50X0FkZEl0ZW06IFJlYWN0LmNyZWF0ZUZhY3RvcnkocmVxdWlyZSgnLi9jb21wb25lbnRzL2hlbHBlcnMvYWRkLWl0ZW0nKSksXG5cbiAgICBjcmVhdGVFbGVtZW50X1JlbW92ZUl0ZW06IFJlYWN0LmNyZWF0ZUZhY3RvcnkocmVxdWlyZSgnLi9jb21wb25lbnRzL2hlbHBlcnMvcmVtb3ZlLWl0ZW0nKSksXG5cbiAgICBjcmVhdGVFbGVtZW50X01vdmVJdGVtRm9yd2FyZDogUmVhY3QuY3JlYXRlRmFjdG9yeShyZXF1aXJlKCcuL2NvbXBvbmVudHMvaGVscGVycy9tb3ZlLWl0ZW0tZm9yd2FyZCcpKSxcblxuICAgIGNyZWF0ZUVsZW1lbnRfTW92ZUl0ZW1CYWNrOiBSZWFjdC5jcmVhdGVGYWN0b3J5KHJlcXVpcmUoJy4vY29tcG9uZW50cy9oZWxwZXJzL21vdmUtaXRlbS1iYWNrJykpLFxuXG4gICAgY3JlYXRlRWxlbWVudF9PYmplY3RDb250cm9sOiBSZWFjdC5jcmVhdGVGYWN0b3J5KHJlcXVpcmUoJy4vY29tcG9uZW50cy9oZWxwZXJzL29iamVjdC1jb250cm9sJykpLFxuXG4gICAgY3JlYXRlRWxlbWVudF9PYmplY3RJdGVtQ29udHJvbDogUmVhY3QuY3JlYXRlRmFjdG9yeShyZXF1aXJlKCcuL2NvbXBvbmVudHMvaGVscGVycy9vYmplY3QtaXRlbS1jb250cm9sJykpLFxuXG4gICAgY3JlYXRlRWxlbWVudF9PYmplY3RJdGVtVmFsdWU6IFJlYWN0LmNyZWF0ZUZhY3RvcnkocmVxdWlyZSgnLi9jb21wb25lbnRzL2hlbHBlcnMvb2JqZWN0LWl0ZW0tdmFsdWUnKSksXG5cbiAgICBjcmVhdGVFbGVtZW50X09iamVjdEl0ZW1LZXk6IFJlYWN0LmNyZWF0ZUZhY3RvcnkocmVxdWlyZSgnLi9jb21wb25lbnRzL2hlbHBlcnMvb2JqZWN0LWl0ZW0ta2V5JykpLFxuXG4gICAgY3JlYXRlRWxlbWVudF9PYmplY3RJdGVtOiBSZWFjdC5jcmVhdGVGYWN0b3J5KHJlcXVpcmUoJy4vY29tcG9uZW50cy9oZWxwZXJzL29iamVjdC1pdGVtJykpLFxuXG4gICAgY3JlYXRlRWxlbWVudF9TZWxlY3RWYWx1ZTogUmVhY3QuY3JlYXRlRmFjdG9yeShyZXF1aXJlKCcuL2NvbXBvbmVudHMvaGVscGVycy9zZWxlY3QtdmFsdWUnKSksXG5cbiAgICBjcmVhdGVFbGVtZW50X1ByZXR0eVNlbGVjdFZhbHVlOiBSZWFjdC5jcmVhdGVGYWN0b3J5KHJlcXVpcmUoJy4vY29tcG9uZW50cy9oZWxwZXJzL3ByZXR0eS1zZWxlY3QtdmFsdWUnKSksXG5cbiAgICBjcmVhdGVFbGVtZW50X1ByZXR0eVNlbGVjdElucHV0OiBSZWFjdC5jcmVhdGVGYWN0b3J5KHJlcXVpcmUoJy4vY29tcG9uZW50cy9oZWxwZXJzL3ByZXR0eS1zZWxlY3QtaW5wdXQnKSksXG5cbiAgICBjcmVhdGVFbGVtZW50X1NhbXBsZTogUmVhY3QuY3JlYXRlRmFjdG9yeShyZXF1aXJlKCcuL2NvbXBvbmVudHMvaGVscGVycy9zYW1wbGUnKSksXG5cbiAgICBjcmVhdGVFbGVtZW50X0luc2VydEJ1dHRvbjogUmVhY3QuY3JlYXRlRmFjdG9yeShyZXF1aXJlKCcuL2NvbXBvbmVudHMvaGVscGVycy9pbnNlcnQtYnV0dG9uJykpLFxuXG4gICAgY3JlYXRlRWxlbWVudF9DaG9pY2VTZWN0aW9uSGVhZGVyOiBSZWFjdC5jcmVhdGVGYWN0b3J5KHJlcXVpcmUoJy4vY29tcG9uZW50cy9oZWxwZXJzL2Nob2ljZS1zZWN0aW9uLWhlYWRlcicpKSxcblxuICAgIGNyZWF0ZUVsZW1lbnRfUHJldHR5VGV4dElucHV0OiBSZWFjdC5jcmVhdGVGYWN0b3J5KHJlcXVpcmUoJy4vY29tcG9uZW50cy9oZWxwZXJzL3ByZXR0eS10ZXh0LWlucHV0JykpLFxuXG4gICAgLy8gRmllbGQgZGVmYXVsdCB2YWx1ZSBmYWN0b3JpZXMuIEdpdmUgYSBkZWZhdWx0IHZhbHVlIGZvciBhIHNwZWNpZmljIHR5cGUuXG5cbiAgICBjcmVhdGVEZWZhdWx0VmFsdWVfU3RyaW5nOiBmdW5jdGlvbiAoLyogZmllbGRUZW1wbGF0ZSAqLykge1xuICAgICAgcmV0dXJuICcnO1xuICAgIH0sXG5cbiAgICBjcmVhdGVEZWZhdWx0VmFsdWVfT2JqZWN0OiBmdW5jdGlvbiAoLyogZmllbGRUZW1wbGF0ZSAqLykge1xuICAgICAgcmV0dXJuIHt9O1xuICAgIH0sXG5cbiAgICBjcmVhdGVEZWZhdWx0VmFsdWVfQXJyYXk6IGZ1bmN0aW9uICgvKiBmaWVsZFRlbXBsYXRlICovKSB7XG4gICAgICByZXR1cm4gW107XG4gICAgfSxcblxuICAgIGNyZWF0ZURlZmF1bHRWYWx1ZV9Cb29sZWFuOiBmdW5jdGlvbiAoLyogZmllbGRUZW1wbGF0ZSAqLykge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH0sXG5cbiAgICBjcmVhdGVEZWZhdWx0VmFsdWVfRmllbGRzOiBkZWxlZ2F0ZVRvKCdjcmVhdGVEZWZhdWx0VmFsdWVfT2JqZWN0JyksXG5cbiAgICBjcmVhdGVEZWZhdWx0VmFsdWVfU2luZ2xlTGluZVN0cmluZzogZGVsZWdhdGVUbygnY3JlYXRlRGVmYXVsdFZhbHVlX1N0cmluZycpLFxuXG4gICAgY3JlYXRlRGVmYXVsdFZhbHVlX1NlbGVjdDogZGVsZWdhdGVUbygnY3JlYXRlRGVmYXVsdFZhbHVlX1N0cmluZycpLFxuXG4gICAgY3JlYXRlRGVmYXVsdFZhbHVlX0pzb246IGRlbGVnYXRlVG8oJ2NyZWF0ZURlZmF1bHRWYWx1ZV9PYmplY3QnKSxcblxuICAgIGNyZWF0ZURlZmF1bHRWYWx1ZV9DaGVja2JveEFycmF5OiBkZWxlZ2F0ZVRvKCdjcmVhdGVEZWZhdWx0VmFsdWVfQXJyYXknKSxcblxuICAgIGNyZWF0ZURlZmF1bHRWYWx1ZV9DaGVja2JveEJvb2xlYW46IGRlbGVnYXRlVG8oJ2NyZWF0ZURlZmF1bHRWYWx1ZV9Cb29sZWFuJyksXG5cblxuICAgIC8vIEZpZWxkIHZhbHVlIGNvZXJjZXJzLiBDb2VyY2UgYSB2YWx1ZSBpbnRvIGEgdmFsdWUgYXBwcm9wcmlhdGUgZm9yIGEgc3BlY2lmaWMgdHlwZS5cblxuICAgIGNvZXJjZVZhbHVlX1N0cmluZzogZnVuY3Rpb24gKGZpZWxkVGVtcGxhdGUsIHZhbHVlKSB7XG4gICAgICBpZiAoXy5pc1N0cmluZyh2YWx1ZSkpIHtcbiAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgICAgfVxuICAgICAgaWYgKF8uaXNVbmRlZmluZWQodmFsdWUpIHx8IHZhbHVlID09PSBudWxsKSB7XG4gICAgICAgIHJldHVybiAnJztcbiAgICAgIH1cbiAgICAgIHJldHVybiBKU09OLnN0cmluZ2lmeSh2YWx1ZSk7XG4gICAgfSxcblxuICAgIGNvZXJjZVZhbHVlX09iamVjdDogZnVuY3Rpb24gKGZpZWxkVGVtcGxhdGUsIHZhbHVlKSB7XG4gICAgICBpZiAoIV8uaXNPYmplY3QodmFsdWUpKSB7XG4gICAgICAgIHJldHVybiB7fTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB2YWx1ZTtcbiAgICB9LFxuXG4gICAgY29lcmNlVmFsdWVfQXJyYXk6IGZ1bmN0aW9uIChmaWVsZFRlbXBsYXRlLCB2YWx1ZSkge1xuICAgICAgaWYgKCFfLmlzQXJyYXkodmFsdWUpKSB7XG4gICAgICAgIHJldHVybiBbdmFsdWVdO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHZhbHVlO1xuICAgIH0sXG5cbiAgICBjb2VyY2VWYWx1ZV9Cb29sZWFuOiBmdW5jdGlvbiAoZmllbGRUZW1wbGF0ZSwgdmFsdWUpIHtcbiAgICAgIHJldHVybiBjb25maWcuY29lcmNlVmFsdWVUb0Jvb2xlYW4odmFsdWUpO1xuICAgIH0sXG5cbiAgICBjb2VyY2VWYWx1ZV9GaWVsZHM6IGRlbGVnYXRlVG8oJ2NvZXJjZVZhbHVlX09iamVjdCcpLFxuXG4gICAgY29lcmNlVmFsdWVfU2luZ2xlTGluZVN0cmluZzogZGVsZWdhdGVUbygnY29lcmNlVmFsdWVfU3RyaW5nJyksXG5cbiAgICBjb2VyY2VWYWx1ZV9TZWxlY3Q6IGRlbGVnYXRlVG8oJ2NvZXJjZVZhbHVlX1N0cmluZycpLFxuXG4gICAgY29lcmNlVmFsdWVfSnNvbjogZGVsZWdhdGVUbygnY29lcmNlVmFsdWVfT2JqZWN0JyksXG5cbiAgICBjb2VyY2VWYWx1ZV9DaGVja2JveEFycmF5OiBkZWxlZ2F0ZVRvKCdjb2VyY2VWYWx1ZV9BcnJheScpLFxuXG4gICAgY29lcmNlVmFsdWVfQ2hlY2tib3hCb29sZWFuOiBkZWxlZ2F0ZVRvKCdjb2VyY2VWYWx1ZV9Cb29sZWFuJyksXG5cblxuICAgIC8vIEZpZWxkIGNoaWxkIGZpZWxkcyBmYWN0b3JpZXMsIHNvIHNvbWUgdHlwZXMgY2FuIGhhdmUgZHluYW1pYyBjaGlsZHJlbi5cblxuICAgIGNyZWF0ZUNoaWxkRmllbGRzX0FycmF5OiBmdW5jdGlvbiAoZmllbGQpIHtcblxuICAgICAgcmV0dXJuIGZpZWxkLnZhbHVlLm1hcChmdW5jdGlvbiAoYXJyYXlJdGVtLCBpKSB7XG4gICAgICAgIHZhciBjaGlsZEZpZWxkVGVtcGxhdGUgPSBjb25maWcuY2hpbGRGaWVsZFRlbXBsYXRlRm9yVmFsdWUoZmllbGQsIGFycmF5SXRlbSk7XG5cbiAgICAgICAgdmFyIGNoaWxkRmllbGQgPSBjb25maWcuY3JlYXRlQ2hpbGRGaWVsZChmaWVsZCwge1xuICAgICAgICAgIGZpZWxkVGVtcGxhdGU6IGNoaWxkRmllbGRUZW1wbGF0ZSwga2V5OiBpLCBmaWVsZEluZGV4OiBpLCB2YWx1ZTogYXJyYXlJdGVtXG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiBjaGlsZEZpZWxkO1xuICAgICAgfSk7XG4gICAgfSxcblxuICAgIGNyZWF0ZUNoaWxkRmllbGRzX09iamVjdDogZnVuY3Rpb24gKGZpZWxkKSB7XG5cbiAgICAgIHJldHVybiBPYmplY3Qua2V5cyhmaWVsZC52YWx1ZSkubWFwKGZ1bmN0aW9uIChrZXksIGkpIHtcbiAgICAgICAgdmFyIGNoaWxkRmllbGRUZW1wbGF0ZSA9IGNvbmZpZy5jaGlsZEZpZWxkVGVtcGxhdGVGb3JWYWx1ZShmaWVsZCwgZmllbGQudmFsdWVba2V5XSk7XG5cbiAgICAgICAgdmFyIGNoaWxkRmllbGQgPSBjb25maWcuY3JlYXRlQ2hpbGRGaWVsZChmaWVsZCwge1xuICAgICAgICAgIGZpZWxkVGVtcGxhdGU6IGNoaWxkRmllbGRUZW1wbGF0ZSwga2V5OiBrZXksIGZpZWxkSW5kZXg6IGksIHZhbHVlOiBmaWVsZC52YWx1ZVtrZXldXG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiBjaGlsZEZpZWxkO1xuICAgICAgfSk7XG4gICAgfSxcblxuICAgIC8vIENoZWNrIGlmIHRoZXJlIGlzIGEgZmFjdG9yeSBmb3IgdGhlIG5hbWUuXG4gICAgaGFzRWxlbWVudEZhY3Rvcnk6IGZ1bmN0aW9uIChuYW1lKSB7XG5cbiAgICAgIHJldHVybiBjb25maWdbJ2NyZWF0ZUVsZW1lbnRfJyArIG5hbWVdID8gdHJ1ZSA6IGZhbHNlO1xuICAgIH0sXG5cbiAgICAvLyBDcmVhdGUgYW4gZWxlbWVudCBnaXZlbiBhIG5hbWUsIHByb3BzLCBhbmQgY2hpbGRyZW4uXG4gICAgY3JlYXRlRWxlbWVudDogZnVuY3Rpb24gKG5hbWUsIHByb3BzLCBjaGlsZHJlbikge1xuXG4gICAgICBpZiAoIXByb3BzLmNvbmZpZykge1xuICAgICAgICBwcm9wcyA9IF8uZXh0ZW5kKHt9LCBwcm9wcywge2NvbmZpZzogY29uZmlnfSk7XG4gICAgICB9XG5cbiAgICAgIG5hbWUgPSBjb25maWcuZWxlbWVudE5hbWUobmFtZSk7XG5cbiAgICAgIGlmIChjb25maWdbJ2NyZWF0ZUVsZW1lbnRfJyArIG5hbWVdKSB7XG4gICAgICAgIHJldHVybiBjb25maWdbJ2NyZWF0ZUVsZW1lbnRfJyArIG5hbWVdKHByb3BzLCBjaGlsZHJlbik7XG4gICAgICB9XG5cbiAgICAgIGlmIChuYW1lICE9PSAnVW5rbm93bicpIHtcbiAgICAgICAgaWYgKGNvbmZpZy5oYXNFbGVtZW50RmFjdG9yeSgnVW5rbm93bicpKSB7XG4gICAgICAgICAgcmV0dXJuIGNvbmZpZy5jcmVhdGVFbGVtZW50KCdVbmtub3duJywgcHJvcHMsIGNoaWxkcmVuKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0ZhY3Rvcnkgbm90IGZvdW5kIGZvcjogJyArIG5hbWUpO1xuICAgIH0sXG5cbiAgICAvLyBDcmVhdGUgYSBmaWVsZCBlbGVtZW50IGdpdmVuIHNvbWUgcHJvcHMuIFVzZSBjb250ZXh0IHRvIGRldGVybWluZSBuYW1lLlxuICAgIGNyZWF0ZUZpZWxkRWxlbWVudDogZnVuY3Rpb24gKHByb3BzKSB7XG5cbiAgICAgIHZhciBuYW1lID0gY29uZmlnLmZpZWxkVHlwZU5hbWUocHJvcHMuZmllbGQpO1xuXG4gICAgICBpZiAoY29uZmlnLmhhc0VsZW1lbnRGYWN0b3J5KG5hbWUpKSB7XG4gICAgICAgIHJldHVybiBjb25maWcuY3JlYXRlRWxlbWVudChuYW1lLCBwcm9wcyk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBjb25maWcuY3JlYXRlRWxlbWVudCgnVW5rbm93bkZpZWxkJywgcHJvcHMpO1xuICAgIH0sXG5cbiAgICAvLyBSZW5kZXIgdGhlIHJvb3QgZm9ybWF0aWMgY29tcG9uZW50XG4gICAgcmVuZGVyRm9ybWF0aWNDb21wb25lbnQ6IGZ1bmN0aW9uIChjb21wb25lbnQpIHtcblxuICAgICAgdmFyIHByb3BzID0gY29tcG9uZW50LnByb3BzO1xuXG4gICAgICB2YXIgZmllbGQgPSBjb25maWcuY3JlYXRlUm9vdEZpZWxkKHByb3BzKTtcbiAgICAgIHJldHVybiBSLmRpdih7Y2xhc3NOYW1lOiAnZm9ybWF0aWMnfSxcbiAgICAgICAgY29uZmlnLmNyZWF0ZUZpZWxkRWxlbWVudCh7ZmllbGQ6IGZpZWxkLCBvbkNoYW5nZTogY29tcG9uZW50Lm9uQ2hhbmdlLCBvbkFjdGlvbjogY29tcG9uZW50Lm9uQWN0aW9ufSlcbiAgICAgICk7XG4gICAgfSxcblxuICAgIC8vIFJlbmRlciBhbnkgY29tcG9uZW50LlxuICAgIHJlbmRlckNvbXBvbmVudDogZnVuY3Rpb24gKGNvbXBvbmVudCkge1xuXG4gICAgICB2YXIgbmFtZSA9IGNvbXBvbmVudC5jb25zdHJ1Y3Rvci5kaXNwbGF5TmFtZTtcblxuICAgICAgaWYgKGNvbmZpZ1sncmVuZGVyQ29tcG9uZW50XycgKyBuYW1lXSkge1xuICAgICAgICByZXR1cm4gY29uZmlnWydyZW5kZXJDb21wb25lbnRfJyArIG5hbWVdKGNvbXBvbmVudCk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBjb21wb25lbnQucmVuZGVyRGVmYXVsdCgpO1xuICAgIH0sXG5cbiAgICAvLyBSZW5kZXIgZmllbGQgY29tcG9uZW50cy5cbiAgICByZW5kZXJGaWVsZENvbXBvbmVudDogZnVuY3Rpb24gKGNvbXBvbmVudCkge1xuXG4gICAgICByZXR1cm4gY29uZmlnLnJlbmRlckNvbXBvbmVudChjb21wb25lbnQpO1xuICAgIH0sXG5cbiAgICAvLyBOb3JtYWxpemUgYW4gZWxlbWVudCBuYW1lLlxuICAgIGVsZW1lbnROYW1lOiBmdW5jdGlvbiAobmFtZSkge1xuICAgICAgcmV0dXJuIHV0aWxzLmRhc2hUb1Bhc2NhbChuYW1lKTtcbiAgICB9LFxuXG4gICAgLy8gVHlwZSBhbGlhc2VzLlxuXG4gICAgYWxpYXNfRGljdDogJ09iamVjdCcsXG5cbiAgICBhbGlhc19Cb29sOiAnQm9vbGVhbicsXG5cbiAgICBhbGlhc19QcmV0dHlUZXh0YXJlYTogJ1ByZXR0eVRleHQnLFxuXG4gICAgYWxpYXNfU2luZ2xlTGluZVN0cmluZzogZnVuY3Rpb24gKGZpZWxkVGVtcGxhdGUpIHtcbiAgICAgIGlmIChmaWVsZFRlbXBsYXRlLnJlcGxhY2VDaG9pY2VzKSB7XG4gICAgICAgIHJldHVybiAnUHJldHR5VGV4dCc7XG4gICAgICB9IGVsc2UgaWYgKGZpZWxkVGVtcGxhdGUuY2hvaWNlcykge1xuICAgICAgICByZXR1cm4gJ1NlbGVjdCc7XG4gICAgICB9XG4gICAgICByZXR1cm4gJ1NpbmdsZUxpbmVTdHJpbmcnO1xuICAgIH0sXG5cbiAgICBhbGlhc19TdHJpbmc6IGZ1bmN0aW9uIChmaWVsZFRlbXBsYXRlKSB7XG5cbiAgICAgIGlmIChmaWVsZFRlbXBsYXRlLnJlcGxhY2VDaG9pY2VzKSB7XG4gICAgICAgIHJldHVybiAnUHJldHR5VGV4dCc7XG4gICAgICB9IGVsc2UgaWYgKGZpZWxkVGVtcGxhdGUuY2hvaWNlcykge1xuICAgICAgICByZXR1cm4gJ1NlbGVjdCc7XG4gICAgICB9IGVsc2UgaWYgKGNvbmZpZy5maWVsZFRlbXBsYXRlSXNTaW5nbGVMaW5lKGZpZWxkVGVtcGxhdGUpKSB7XG4gICAgICAgIHJldHVybiAnU2luZ2xlTGluZVN0cmluZyc7XG4gICAgICB9XG4gICAgICByZXR1cm4gJ1N0cmluZyc7XG4gICAgfSxcblxuICAgIGFsaWFzX1RleHQ6IGRlbGVnYXRlVG8oJ2FsaWFzX1N0cmluZycpLFxuXG4gICAgYWxpYXNfVW5pY29kZTogZGVsZWdhdGVUbygnYWxpYXNfU2luZ2xlTGluZVN0cmluZycpLFxuXG4gICAgYWxpYXNfU3RyOiBkZWxlZ2F0ZVRvKCdhbGlhc19TaW5nbGVMaW5lU3RyaW5nJyksXG5cbiAgICBhbGlhc19MaXN0OiAnQXJyYXknLFxuXG4gICAgYWxpYXNfQ2hlY2tib3hMaXN0OiAnQ2hlY2tib3hBcnJheScsXG5cbiAgICBhbGlhc19GaWVsZHNldDogJ0ZpZWxkcycsXG5cbiAgICBhbGlhc19DaGVja2JveDogJ0NoZWNrYm94Qm9vbGVhbicsXG5cbiAgICAvLyBGaWVsZCBmYWN0b3J5XG5cbiAgICAvLyBHaXZlbiBhIGZpZWxkLCBleHBhbmQgYWxsIGNoaWxkIGZpZWxkcyByZWN1cnNpdmVseSB0byBnZXQgdGhlIGRlZmF1bHRcbiAgICAvLyB2YWx1ZXMgb2YgYWxsIGZpZWxkcy5cbiAgICBpbmZsYXRlRmllbGRWYWx1ZTogZnVuY3Rpb24gKGZpZWxkLCBmaWVsZEhhbmRsZXIpIHtcblxuICAgICAgaWYgKGZpZWxkSGFuZGxlcikge1xuICAgICAgICB2YXIgc3RvcCA9IGZpZWxkSGFuZGxlcihmaWVsZCk7XG4gICAgICAgIGlmIChzdG9wID09PSBmYWxzZSkge1xuICAgICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKGNvbmZpZy5maWVsZEhhc1ZhbHVlQ2hpbGRyZW4oZmllbGQpKSB7XG4gICAgICAgIHZhciB2YWx1ZSA9IF8uY2xvbmUoZmllbGQudmFsdWUpO1xuICAgICAgICB2YXIgY2hpbGRGaWVsZHMgPSBjb25maWcuY3JlYXRlQ2hpbGRGaWVsZHMoZmllbGQpO1xuICAgICAgICBjaGlsZEZpZWxkcy5mb3JFYWNoKGZ1bmN0aW9uIChjaGlsZEZpZWxkKSB7XG4gICAgICAgICAgaWYgKGNvbmZpZy5pc0tleShjaGlsZEZpZWxkLmtleSkpIHtcbiAgICAgICAgICAgIHZhbHVlW2NoaWxkRmllbGQua2V5XSA9IGNvbmZpZy5pbmZsYXRlRmllbGRWYWx1ZShjaGlsZEZpZWxkLCBmaWVsZEhhbmRsZXIpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBhIGNoaWxkIHdpdGggbm8ga2V5IG1pZ2h0IGhhdmUgc3ViLWNoaWxkcmVuIHdpdGgga2V5c1xuICAgICAgICAgICAgdmFyIG9iaiA9IGNvbmZpZy5pbmZsYXRlRmllbGRWYWx1ZShjaGlsZEZpZWxkLCBmaWVsZEhhbmRsZXIpO1xuICAgICAgICAgICAgXy5leHRlbmQodmFsdWUsIG9iaik7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIGZpZWxkLnZhbHVlO1xuICAgICAgfVxuICAgIH0sXG5cbiAgICAvLyBJbml0aWFsaXplIHRoZSByb290IGZpZWxkLlxuICAgIGluaXRSb290RmllbGQ6IGZ1bmN0aW9uICgvKiBmaWVsZCwgcHJvcHMgKi8pIHtcbiAgICB9LFxuXG4gICAgLy8gSW5pdGlhbGl6ZSBldmVyeSBmaWVsZC5cbiAgICBpbml0RmllbGQ6IGZ1bmN0aW9uICgvKiBmaWVsZCAqLykge1xuICAgIH0sXG5cbiAgICAvLyBJZiBhbiBhcnJheSBvZiBmaWVsZCB0ZW1wbGF0ZXMgYXJlIHBhc3NlZCBpbiwgdGhpcyBtZXRob2QgaXMgdXNlZCB0b1xuICAgIC8vIHdyYXAgdGhlIGZpZWxkcyBpbnNpZGUgYSBzaW5nbGUgcm9vdCBmaWVsZCB0ZW1wbGF0ZS5cbiAgICB3cmFwRmllbGRUZW1wbGF0ZXM6IGZ1bmN0aW9uIChmaWVsZFRlbXBsYXRlcykge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgdHlwZTogJ2ZpZWxkcycsXG4gICAgICAgIHBsYWluOiB0cnVlLFxuICAgICAgICBmaWVsZHM6IGZpZWxkVGVtcGxhdGVzXG4gICAgICB9O1xuICAgIH0sXG5cbiAgICAvLyBHaXZlbiB0aGUgcHJvcHMgdGhhdCBhcmUgcGFzc2VkIGluLCBjcmVhdGUgdGhlIHJvb3QgZmllbGQuXG4gICAgY3JlYXRlUm9vdEZpZWxkOiBmdW5jdGlvbiAocHJvcHMpIHtcblxuICAgICAgdmFyIGZpZWxkVGVtcGxhdGUgPSBwcm9wcy5maWVsZFRlbXBsYXRlIHx8IHByb3BzLmZpZWxkVGVtcGxhdGVzIHx8IHByb3BzLmZpZWxkIHx8IHByb3BzLmZpZWxkcztcbiAgICAgIHZhciB2YWx1ZSA9IHByb3BzLnZhbHVlO1xuXG4gICAgICBpZiAoIWZpZWxkVGVtcGxhdGUpIHtcbiAgICAgICAgZmllbGRUZW1wbGF0ZSA9IGNvbmZpZy5jcmVhdGVGaWVsZFRlbXBsYXRlRnJvbVZhbHVlKHZhbHVlKTtcbiAgICAgIH1cblxuICAgICAgaWYgKF8uaXNBcnJheShmaWVsZFRlbXBsYXRlKSkge1xuICAgICAgICBmaWVsZFRlbXBsYXRlID0gY29uZmlnLndyYXBGaWVsZFRlbXBsYXRlcyhmaWVsZFRlbXBsYXRlKTtcbiAgICAgIH1cblxuICAgICAgdmFyIGZpZWxkID0gXy5leHRlbmQoe30sIGZpZWxkVGVtcGxhdGUsIHtyYXdGaWVsZFRlbXBsYXRlOiBmaWVsZFRlbXBsYXRlfSk7XG4gICAgICBpZiAoY29uZmlnLmhhc1ZhbHVlKGZpZWxkVGVtcGxhdGUsIHZhbHVlKSkge1xuICAgICAgICBmaWVsZC52YWx1ZSA9IGNvbmZpZy5jb2VyY2VWYWx1ZShmaWVsZFRlbXBsYXRlLCB2YWx1ZSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBmaWVsZC52YWx1ZSA9IGNvbmZpZy5jcmVhdGVEZWZhdWx0VmFsdWUoZmllbGRUZW1wbGF0ZSk7XG4gICAgICB9XG5cbiAgICAgIGNvbmZpZy5pbml0Um9vdEZpZWxkKGZpZWxkLCBwcm9wcyk7XG4gICAgICBjb25maWcuaW5pdEZpZWxkKGZpZWxkKTtcblxuICAgICAgaWYgKHZhbHVlID09PSBudWxsIHx8IGNvbmZpZy5pc0VtcHR5T2JqZWN0KHZhbHVlKSB8fCBfLmlzVW5kZWZpbmVkKHZhbHVlKSkge1xuICAgICAgICBmaWVsZC52YWx1ZSA9IGNvbmZpZy5pbmZsYXRlRmllbGRWYWx1ZShmaWVsZCk7XG4gICAgICB9XG5cbiAgICAgIGlmIChwcm9wcy5yZWFkT25seSkge1xuICAgICAgICBmaWVsZC5yZWFkT25seSA9IHRydWU7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBmaWVsZDtcbiAgICB9LFxuXG4gICAgLy8gR2l2ZW4gdGhlIHByb3BzIHRoYXQgYXJlIHBhc3NlZCBpbiwgY3JlYXRlIHRoZSB2YWx1ZSB0aGF0IHdpbGwgYmUgZGlzcGxheWVkXG4gICAgLy8gYnkgYWxsIHRoZSBjb21wb25lbnRzLlxuICAgIGNyZWF0ZVJvb3RWYWx1ZTogZnVuY3Rpb24gKHByb3BzLCBmaWVsZEhhbmRsZXIpIHtcblxuICAgICAgdmFyIGZpZWxkID0gY29uZmlnLmNyZWF0ZVJvb3RGaWVsZChwcm9wcyk7XG5cbiAgICAgIHJldHVybiBjb25maWcuaW5mbGF0ZUZpZWxkVmFsdWUoZmllbGQsIGZpZWxkSGFuZGxlcik7XG4gICAgfSxcblxuICAgIHZhbGlkYXRlUm9vdFZhbHVlOiBmdW5jdGlvbiAocHJvcHMpIHtcblxuICAgICAgdmFyIGVycm9ycyA9IFtdO1xuXG4gICAgICBjb25maWcuY3JlYXRlUm9vdFZhbHVlKHByb3BzLCBmdW5jdGlvbiAoZmllbGQpIHtcbiAgICAgICAgdmFyIGZpZWxkRXJyb3JzID0gY29uZmlnLmZpZWxkRXJyb3JzKGZpZWxkKTtcbiAgICAgICAgaWYgKGZpZWxkRXJyb3JzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICBlcnJvcnMucHVzaCh7XG4gICAgICAgICAgICBwYXRoOiBjb25maWcuZmllbGRWYWx1ZVBhdGgoZmllbGQpLFxuICAgICAgICAgICAgZXJyb3JzOiBmaWVsZEVycm9yc1xuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9KTtcblxuICAgICAgcmV0dXJuIGVycm9ycztcbiAgICB9LFxuXG4gICAgaXNWYWxpZFJvb3RWYWx1ZTogZnVuY3Rpb24gKHByb3BzKSB7XG5cbiAgICAgIHZhciBpc1ZhbGlkID0gdHJ1ZTtcblxuICAgICAgY29uZmlnLmNyZWF0ZVJvb3RWYWx1ZShwcm9wcywgZnVuY3Rpb24gKGZpZWxkKSB7XG4gICAgICAgIGlmIChjb25maWcuZmllbGRFcnJvcnMoZmllbGQpLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICBpc1ZhbGlkID0gZmFsc2U7XG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICB9KTtcblxuICAgICAgcmV0dXJuIGlzVmFsaWQ7XG4gICAgfSxcblxuICAgIHZhbGlkYXRlRmllbGQ6IGZ1bmN0aW9uIChmaWVsZCwgZXJyb3JzKSB7XG5cbiAgICAgIGlmIChmaWVsZC52YWx1ZSA9PT0gdW5kZWZpbmVkIHx8IGZpZWxkLnZhbHVlID09PSAnJykge1xuICAgICAgICBpZiAoY29uZmlnLmZpZWxkSXNSZXF1aXJlZChmaWVsZCkpIHtcbiAgICAgICAgICBlcnJvcnMucHVzaCh7XG4gICAgICAgICAgICB0eXBlOiAncmVxdWlyZWQnXG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9LFxuXG4gICAgY3NzVHJhbnNpdGlvbldyYXBwZXI6IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIENTU1RyYW5zaXRpb25Hcm91cCA9IFJlYWN0LmNyZWF0ZUZhY3RvcnkoUmVhY3QuYWRkb25zLkNTU1RyYW5zaXRpb25Hcm91cCk7XG4gICAgICB2YXIgYXJncyA9IFt7dHJhbnNpdGlvbk5hbWU6ICdyZXZlYWwnfV0uY29uY2F0KEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cykpO1xuICAgICAgcmV0dXJuIENTU1RyYW5zaXRpb25Hcm91cC5hcHBseShudWxsLCBhcmdzKTtcbiAgICB9LFxuXG4gICAgLy8gQ3JlYXRlIGR5bmFtaWMgY2hpbGQgZmllbGRzIGZvciBhIGZpZWxkLlxuICAgIGNyZWF0ZUNoaWxkRmllbGRzOiBmdW5jdGlvbiAoZmllbGQpIHtcblxuICAgICAgdmFyIHR5cGVOYW1lID0gY29uZmlnLmZpZWxkVHlwZU5hbWUoZmllbGQpO1xuXG4gICAgICBpZiAoY29uZmlnWydjcmVhdGVDaGlsZEZpZWxkc18nICsgdHlwZU5hbWVdKSB7XG4gICAgICAgIHJldHVybiBjb25maWdbJ2NyZWF0ZUNoaWxkRmllbGRzXycgKyB0eXBlTmFtZV0oZmllbGQpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gY29uZmlnLmZpZWxkQ2hpbGRGaWVsZFRlbXBsYXRlcyhmaWVsZCkubWFwKGZ1bmN0aW9uIChjaGlsZEZpZWxkLCBpKSB7XG4gICAgICAgIHZhciBjaGlsZFZhbHVlID0gZmllbGQudmFsdWU7XG4gICAgICAgIGlmIChjb25maWcuaXNLZXkoY2hpbGRGaWVsZC5rZXkpKSB7XG4gICAgICAgICAgY2hpbGRWYWx1ZSA9IGZpZWxkLnZhbHVlW2NoaWxkRmllbGQua2V5XTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gY29uZmlnLmNyZWF0ZUNoaWxkRmllbGQoZmllbGQsIHtcbiAgICAgICAgICBmaWVsZFRlbXBsYXRlOiBjaGlsZEZpZWxkLCBrZXk6IGNoaWxkRmllbGQua2V5LCBmaWVsZEluZGV4OiBpLCB2YWx1ZTogY2hpbGRWYWx1ZVxuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0sXG5cbiAgICAvLyBDcmVhdGUgYSBzaW5nbGUgY2hpbGQgZmllbGQgZm9yIGEgcGFyZW50IGZpZWxkLlxuICAgIGNyZWF0ZUNoaWxkRmllbGQ6IGZ1bmN0aW9uIChwYXJlbnRGaWVsZCwgb3B0aW9ucykge1xuXG4gICAgICB2YXIgY2hpbGRWYWx1ZSA9IG9wdGlvbnMudmFsdWU7XG5cbiAgICAgIHZhciBjaGlsZEZpZWxkID0gXy5leHRlbmQoe30sIG9wdGlvbnMuZmllbGRUZW1wbGF0ZSwge1xuICAgICAgICBrZXk6IG9wdGlvbnMua2V5LCBwYXJlbnQ6IHBhcmVudEZpZWxkLCBmaWVsZEluZGV4OiBvcHRpb25zLmZpZWxkSW5kZXgsXG4gICAgICAgIHJhd0ZpZWxkVGVtcGxhdGU6IG9wdGlvbnMuZmllbGRUZW1wbGF0ZVxuICAgICAgfSk7XG5cbiAgICAgIGlmIChjb25maWcuaGFzVmFsdWUob3B0aW9ucy5maWVsZFRlbXBsYXRlLCBjaGlsZFZhbHVlKSkge1xuICAgICAgICBjaGlsZEZpZWxkLnZhbHVlID0gY29uZmlnLmNvZXJjZVZhbHVlKG9wdGlvbnMuZmllbGRUZW1wbGF0ZSwgY2hpbGRWYWx1ZSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjaGlsZEZpZWxkLnZhbHVlID0gY29uZmlnLmNyZWF0ZURlZmF1bHRWYWx1ZShvcHRpb25zLmZpZWxkVGVtcGxhdGUpO1xuICAgICAgfVxuXG4gICAgICBjb25maWcuaW5pdEZpZWxkKGNoaWxkRmllbGQpO1xuXG4gICAgICByZXR1cm4gY2hpbGRGaWVsZDtcbiAgICB9LFxuXG4gICAgLy8gQ3JlYXRlIGEgdGVtcG9yYXJ5IGZpZWxkIGFuZCBleHRyYWN0IGl0cyB2YWx1ZS5cbiAgICBjcmVhdGVOZXdDaGlsZEZpZWxkVmFsdWU6IGZ1bmN0aW9uIChwYXJlbnRGaWVsZCwgaXRlbUZpZWxkSW5kZXgpIHtcblxuICAgICAgdmFyIGNoaWxkRmllbGRUZW1wbGF0ZSA9IGNvbmZpZy5maWVsZEl0ZW1GaWVsZFRlbXBsYXRlcyhwYXJlbnRGaWVsZClbaXRlbUZpZWxkSW5kZXhdO1xuXG4gICAgICB2YXIgbmV3VmFsdWUgPSBjb25maWcuZmllbGRUZW1wbGF0ZVZhbHVlKGNoaWxkRmllbGRUZW1wbGF0ZSk7XG5cbiAgICAgIC8vIEp1c3QgYSBwbGFjZWhvbGRlciBrZXkuIFNob3VsZCBub3QgYmUgaW1wb3J0YW50LlxuICAgICAgdmFyIGtleSA9ICdfX3Vua25vd25fa2V5X18nO1xuXG4gICAgICBpZiAoXy5pc0FycmF5KHBhcmVudEZpZWxkLnZhbHVlKSkge1xuICAgICAgICAvLyBKdXN0IGEgcGxhY2Vob2xkZXIgcG9zaXRpb24gZm9yIGFuIGFycmF5LlxuICAgICAgICBrZXkgPSBwYXJlbnRGaWVsZC52YWx1ZS5sZW5ndGg7XG4gICAgICB9XG5cbiAgICAgIC8vIEp1c3QgYSBwbGFjZWhvbGRlciBmaWVsZCBpbmRleC4gU2hvdWxkIG5vdCBiZSBpbXBvcnRhbnQuXG4gICAgICB2YXIgZmllbGRJbmRleCA9IDA7XG4gICAgICBpZiAoXy5pc09iamVjdChwYXJlbnRGaWVsZC52YWx1ZSkpIHtcbiAgICAgICAgZmllbGRJbmRleCA9IE9iamVjdC5rZXlzKHBhcmVudEZpZWxkLnZhbHVlKS5sZW5ndGg7XG4gICAgICB9XG5cbiAgICAgIHZhciBjaGlsZEZpZWxkID0gY29uZmlnLmNyZWF0ZUNoaWxkRmllbGQocGFyZW50RmllbGQsIHtcbiAgICAgICAgZmllbGRUZW1wbGF0ZTogY2hpbGRGaWVsZFRlbXBsYXRlLCBrZXk6IGtleSwgZmllbGRJbmRleDogZmllbGRJbmRleCwgdmFsdWU6IG5ld1ZhbHVlXG4gICAgICB9KTtcblxuICAgICAgbmV3VmFsdWUgPSBjb25maWcuaW5mbGF0ZUZpZWxkVmFsdWUoY2hpbGRGaWVsZCk7XG5cbiAgICAgIHJldHVybiBuZXdWYWx1ZTtcbiAgICB9LFxuXG4gICAgLy8gR2l2ZW4gYSB2YWx1ZSwgY3JlYXRlIGEgZmllbGQgdGVtcGxhdGUgZm9yIHRoYXQgdmFsdWUuXG4gICAgY3JlYXRlRmllbGRUZW1wbGF0ZUZyb21WYWx1ZTogZnVuY3Rpb24gKHZhbHVlKSB7XG5cbiAgICAgIHZhciBmaWVsZCA9IHtcbiAgICAgICAgdHlwZTogJ2pzb24nXG4gICAgICB9O1xuICAgICAgaWYgKF8uaXNTdHJpbmcodmFsdWUpKSB7XG4gICAgICAgIGZpZWxkID0ge1xuICAgICAgICAgIHR5cGU6ICdzdHJpbmcnXG4gICAgICAgIH07XG4gICAgICB9IGVsc2UgaWYgKF8uaXNOdW1iZXIodmFsdWUpKSB7XG4gICAgICAgIGZpZWxkID0ge1xuICAgICAgICAgIHR5cGU6ICdudW1iZXInXG4gICAgICAgIH07XG4gICAgICB9IGVsc2UgaWYgKF8uaXNCb29sZWFuKHZhbHVlKSkge1xuICAgICAgICBmaWVsZCA9IHtcbiAgICAgICAgICB0eXBlOiAnYm9vbGVhbidcbiAgICAgICAgfTtcbiAgICAgIH0gZWxzZSBpZiAoXy5pc0FycmF5KHZhbHVlKSkge1xuICAgICAgICB2YXIgYXJyYXlJdGVtRmllbGRzID0gdmFsdWUubWFwKGZ1bmN0aW9uIChjaGlsZFZhbHVlLCBpKSB7XG4gICAgICAgICAgdmFyIGNoaWxkRmllbGQgPSBjb25maWcuY3JlYXRlRmllbGRUZW1wbGF0ZUZyb21WYWx1ZShjaGlsZFZhbHVlKTtcbiAgICAgICAgICBjaGlsZEZpZWxkLmtleSA9IGk7XG4gICAgICAgICAgcmV0dXJuIGNoaWxkRmllbGQ7XG4gICAgICAgIH0pO1xuICAgICAgICBmaWVsZCA9IHtcbiAgICAgICAgICB0eXBlOiAnYXJyYXknLFxuICAgICAgICAgIGZpZWxkczogYXJyYXlJdGVtRmllbGRzXG4gICAgICAgIH07XG4gICAgICB9IGVsc2UgaWYgKF8uaXNPYmplY3QodmFsdWUpKSB7XG4gICAgICAgIHZhciBvYmplY3RJdGVtRmllbGRzID0gT2JqZWN0LmtleXModmFsdWUpLm1hcChmdW5jdGlvbiAoa2V5KSB7XG4gICAgICAgICAgdmFyIGNoaWxkRmllbGQgPSBjb25maWcuY3JlYXRlRmllbGRUZW1wbGF0ZUZyb21WYWx1ZSh2YWx1ZVtrZXldKTtcbiAgICAgICAgICBjaGlsZEZpZWxkLmtleSA9IGtleTtcbiAgICAgICAgICBjaGlsZEZpZWxkLmxhYmVsID0gY29uZmlnLmh1bWFuaXplKGtleSk7XG4gICAgICAgICAgcmV0dXJuIGNoaWxkRmllbGQ7XG4gICAgICAgIH0pO1xuICAgICAgICBmaWVsZCA9IHtcbiAgICAgICAgICB0eXBlOiAnb2JqZWN0JyxcbiAgICAgICAgICBmaWVsZHM6IG9iamVjdEl0ZW1GaWVsZHNcbiAgICAgICAgfTtcbiAgICAgIH0gZWxzZSBpZiAoXy5pc051bGwodmFsdWUpKSB7XG4gICAgICAgIGZpZWxkID0ge1xuICAgICAgICAgIHR5cGU6ICdqc29uJ1xuICAgICAgICB9O1xuICAgICAgfVxuICAgICAgcmV0dXJuIGZpZWxkO1xuICAgIH0sXG5cbiAgICAvLyBEZWZhdWx0IHZhbHVlIGZhY3RvcnlcblxuICAgIGNyZWF0ZURlZmF1bHRWYWx1ZTogZnVuY3Rpb24gKGZpZWxkVGVtcGxhdGUpIHtcblxuICAgICAgdmFyIGRlZmF1bHRWYWx1ZSA9IGNvbmZpZy5maWVsZFRlbXBsYXRlRGVmYXVsdFZhbHVlKGZpZWxkVGVtcGxhdGUpO1xuXG4gICAgICBpZiAoIV8uaXNVbmRlZmluZWQoZGVmYXVsdFZhbHVlKSkge1xuICAgICAgICByZXR1cm4gdXRpbHMuZGVlcENvcHkoZGVmYXVsdFZhbHVlKTtcbiAgICAgIH1cblxuICAgICAgdmFyIHR5cGVOYW1lID0gY29uZmlnLmZpZWxkVHlwZU5hbWUoZmllbGRUZW1wbGF0ZSk7XG5cbiAgICAgIGlmIChjb25maWdbJ2NyZWF0ZURlZmF1bHRWYWx1ZV8nICsgdHlwZU5hbWVdKSB7XG4gICAgICAgIHJldHVybiBjb25maWdbJ2NyZWF0ZURlZmF1bHRWYWx1ZV8nICsgdHlwZU5hbWVdKGZpZWxkVGVtcGxhdGUpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gJyc7XG4gICAgfSxcblxuICAgIC8vIEZpZWxkIGhlbHBlcnNcblxuICAgIC8vIERldGVybWluZSBpZiBhIHZhbHVlIFwiZXhpc3RzXCIuXG4gICAgaGFzVmFsdWU6IGZ1bmN0aW9uIChmaWVsZFRlbXBsYXRlLCB2YWx1ZSkge1xuICAgICAgcmV0dXJuIHZhbHVlICE9PSBudWxsICYmICFfLmlzVW5kZWZpbmVkKHZhbHVlKTtcbiAgICB9LFxuXG4gICAgLy8gQ29lcmNlIGEgdmFsdWUgdG8gdmFsdWUgYXBwcm9wcmlhdGUgZm9yIGEgZmllbGQuXG4gICAgY29lcmNlVmFsdWU6IGZ1bmN0aW9uIChmaWVsZCwgdmFsdWUpIHtcblxuICAgICAgdmFyIHR5cGVOYW1lID0gY29uZmlnLmZpZWxkVHlwZU5hbWUoZmllbGQpO1xuXG4gICAgICBpZiAoY29uZmlnWydjb2VyY2VWYWx1ZV8nICsgdHlwZU5hbWVdKSB7XG4gICAgICAgIHJldHVybiBjb25maWdbJ2NvZXJjZVZhbHVlXycgKyB0eXBlTmFtZV0oZmllbGQsIHZhbHVlKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHZhbHVlO1xuICAgIH0sXG5cbiAgICAvLyBHaXZlbiBhIGZpZWxkIGFuZCBhIGNoaWxkIHZhbHVlLCBmaW5kIHRoZSBhcHByb3ByaWF0ZSBmaWVsZCB0ZW1wbGF0ZSBmb3JcbiAgICAvLyB0aGF0IGNoaWxkIHZhbHVlLlxuICAgIGNoaWxkRmllbGRUZW1wbGF0ZUZvclZhbHVlOiBmdW5jdGlvbiAoZmllbGQsIGNoaWxkVmFsdWUpIHtcblxuICAgICAgdmFyIGZpZWxkVGVtcGxhdGU7XG5cbiAgICAgIHZhciBmaWVsZFRlbXBsYXRlcyA9IGNvbmZpZy5maWVsZEl0ZW1GaWVsZFRlbXBsYXRlcyhmaWVsZCk7XG5cbiAgICAgIGZpZWxkVGVtcGxhdGUgPSBfLmZpbmQoZmllbGRUZW1wbGF0ZXMsIGZ1bmN0aW9uIChpdGVtRmllbGRUZW1wbGF0ZSkge1xuICAgICAgICByZXR1cm4gY29uZmlnLm1hdGNoZXNGaWVsZFRlbXBsYXRlVG9WYWx1ZShpdGVtRmllbGRUZW1wbGF0ZSwgY2hpbGRWYWx1ZSk7XG4gICAgICB9KTtcblxuICAgICAgaWYgKGZpZWxkVGVtcGxhdGUpIHtcbiAgICAgICAgcmV0dXJuIGZpZWxkVGVtcGxhdGU7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gY29uZmlnLmNyZWF0ZUZpZWxkVGVtcGxhdGVGcm9tVmFsdWUoY2hpbGRWYWx1ZSk7XG4gICAgICB9XG4gICAgfSxcblxuICAgIC8vIERldGVybWluZSBpZiBhIHZhbHVlIGlzIGEgbWF0Y2ggZm9yIGEgZmllbGQgdGVtcGxhdGUuXG4gICAgbWF0Y2hlc0ZpZWxkVGVtcGxhdGVUb1ZhbHVlOiBmdW5jdGlvbiAoZmllbGRUZW1wbGF0ZSwgdmFsdWUpIHtcbiAgICAgIHZhciBtYXRjaCA9IGZpZWxkVGVtcGxhdGUubWF0Y2g7XG4gICAgICBpZiAoIW1hdGNoKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuICAgICAgcmV0dXJuIF8uZXZlcnkoT2JqZWN0LmtleXMobWF0Y2gpLCBmdW5jdGlvbiAoa2V5KSB7XG4gICAgICAgIHJldHVybiBfLmlzRXF1YWwobWF0Y2hba2V5XSwgdmFsdWVba2V5XSk7XG4gICAgICB9KTtcbiAgICB9LFxuXG4gICAgLy8gRmllbGQgdGVtcGxhdGUgaGVscGVyc1xuXG4gICAgLy8gTm9ybWFsaXplZCAoUGFzY2FsQ2FzZSkgdHlwZSBuYW1lIGZvciBhIGZpZWxkLlxuICAgIGZpZWxkVGVtcGxhdGVUeXBlTmFtZTogZnVuY3Rpb24gKGZpZWxkVGVtcGxhdGUpIHtcblxuICAgICAgdmFyIHR5cGVOYW1lID0gdXRpbHMuZGFzaFRvUGFzY2FsKGZpZWxkVGVtcGxhdGUudHlwZSB8fCAndW5kZWZpbmVkJyk7XG5cbiAgICAgIHZhciBhbGlhcyA9IGNvbmZpZ1snYWxpYXNfJyArIHR5cGVOYW1lXTtcblxuICAgICAgaWYgKGFsaWFzKSB7XG4gICAgICAgIGlmIChfLmlzRnVuY3Rpb24oYWxpYXMpKSB7XG4gICAgICAgICAgcmV0dXJuIGFsaWFzLmNhbGwoY29uZmlnLCBmaWVsZFRlbXBsYXRlKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gYWxpYXM7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKGZpZWxkVGVtcGxhdGUubGlzdCkge1xuICAgICAgICB0eXBlTmFtZSA9ICdBcnJheSc7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB0eXBlTmFtZTtcbiAgICB9LFxuXG4gICAgLy8gRGVmYXVsdCB2YWx1ZSBmb3IgYSBmaWVsZCB0ZW1wbGF0ZS5cbiAgICBmaWVsZFRlbXBsYXRlRGVmYXVsdFZhbHVlOiBmdW5jdGlvbiAoZmllbGRUZW1wbGF0ZSkge1xuXG4gICAgICByZXR1cm4gZmllbGRUZW1wbGF0ZS5kZWZhdWx0O1xuICAgIH0sXG5cbiAgICAvLyBWYWx1ZSBmb3IgYSBmaWVsZCB0ZW1wbGF0ZS4gVXNlZCB0byBkZXRlcm1pbmUgdGhlIHZhbHVlIG9mIGEgbmV3IGNoaWxkXG4gICAgLy8gZmllbGQuXG4gICAgZmllbGRUZW1wbGF0ZVZhbHVlOiBmdW5jdGlvbiAoZmllbGRUZW1wbGF0ZSkge1xuXG4gICAgICAvLyBUaGlzIGxvZ2ljIG1pZ2h0IGJlIGJyaXR0bGUuXG5cbiAgICAgIHZhciBkZWZhdWx0VmFsdWUgPSBjb25maWcuZmllbGRUZW1wbGF0ZURlZmF1bHRWYWx1ZShmaWVsZFRlbXBsYXRlKTtcblxuICAgICAgdmFyIG1hdGNoID0gY29uZmlnLmZpZWxkVGVtcGxhdGVNYXRjaChmaWVsZFRlbXBsYXRlKTtcblxuICAgICAgdmFyIHZhbHVlO1xuXG4gICAgICBpZiAoXy5pc1VuZGVmaW5lZChkZWZhdWx0VmFsdWUpICYmICFfLmlzVW5kZWZpbmVkKG1hdGNoKSkge1xuICAgICAgICByZXR1cm4gdXRpbHMuZGVlcENvcHkobWF0Y2gpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIGNvbmZpZy5jcmVhdGVEZWZhdWx0VmFsdWUoZmllbGRUZW1wbGF0ZSk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB2YWx1ZTtcbiAgICB9LFxuXG4gICAgLy8gTWF0Y2ggcnVsZSBmb3IgYSBmaWVsZCB0ZW1wbGF0ZS5cbiAgICBmaWVsZFRlbXBsYXRlTWF0Y2g6IGZ1bmN0aW9uIChmaWVsZFRlbXBsYXRlKSB7XG4gICAgICByZXR1cm4gZmllbGRUZW1wbGF0ZS5tYXRjaDtcbiAgICB9LFxuXG4gICAgLy8gRGV0ZXJtaW5lIGlmIGEgZmllbGQgdGVtcGxhdGUgaGFzIGEgc2luZ2xlLWxpbmUgdmFsdWUuXG4gICAgZmllbGRUZW1wbGF0ZUlzU2luZ2xlTGluZTogZnVuY3Rpb24gKGZpZWxkVGVtcGxhdGUpIHtcbiAgICAgIHJldHVybiBmaWVsZFRlbXBsYXRlLmlzU2luZ2xlTGluZSB8fCBmaWVsZFRlbXBsYXRlLmlzX3NpbmdsZV9saW5lIHx8XG4gICAgICAgICAgICAgIGZpZWxkVGVtcGxhdGUudHlwZSA9PT0gJ3NpbmdsZS1saW5lLXN0cmluZycgfHwgZmllbGRUZW1wbGF0ZS50eXBlID09PSAnU2luZ2xlTGluZVN0cmluZyc7XG4gICAgfSxcblxuICAgIC8vIEZpZWxkIGhlbHBlcnNcblxuICAgIC8vIEdldCBhbiBhcnJheSBvZiBrZXlzIHJlcHJlc2VudGluZyB0aGUgcGF0aCB0byBhIHZhbHVlLlxuICAgIGZpZWxkVmFsdWVQYXRoOiBmdW5jdGlvbiAoZmllbGQpIHtcblxuICAgICAgdmFyIHBhcmVudFBhdGggPSBbXTtcblxuICAgICAgaWYgKGZpZWxkLnBhcmVudCkge1xuICAgICAgICBwYXJlbnRQYXRoID0gY29uZmlnLmZpZWxkVmFsdWVQYXRoKGZpZWxkLnBhcmVudCk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBwYXJlbnRQYXRoLmNvbmNhdChmaWVsZC5rZXkpLmZpbHRlcihmdW5jdGlvbiAoa2V5KSB7XG4gICAgICAgIHJldHVybiAhXy5pc1VuZGVmaW5lZChrZXkpICYmIGtleSAhPT0gJyc7XG4gICAgICB9KTtcbiAgICB9LFxuXG4gICAgLy8gQ2xvbmUgYSBmaWVsZCB3aXRoIGEgZGlmZmVyZW50IHZhbHVlLlxuICAgIGZpZWxkV2l0aFZhbHVlOiBmdW5jdGlvbiAoZmllbGQsIHZhbHVlKSB7XG4gICAgICByZXR1cm4gXy5leHRlbmQoe30sIGZpZWxkLCB7dmFsdWU6IHZhbHVlfSk7XG4gICAgfSxcblxuICAgIGZpZWxkVHlwZU5hbWU6IGRlbGVnYXRlVG8oJ2ZpZWxkVGVtcGxhdGVUeXBlTmFtZScpLFxuXG4gICAgLy8gRmllbGQgaXMgbG9hZGluZyBjaG9pY2VzLlxuICAgIGZpZWxkSXNMb2FkaW5nOiBmdW5jdGlvbiAoZmllbGQpIHtcbiAgICAgIHJldHVybiBmaWVsZC5pc0xvYWRpbmc7XG4gICAgfSxcblxuICAgIC8vIEdldCB0aGUgY2hvaWNlcyBmb3IgYSBkcm9wZG93biBmaWVsZC5cbiAgICBmaWVsZENob2ljZXM6IGZ1bmN0aW9uIChmaWVsZCkge1xuXG4gICAgICByZXR1cm4gY29uZmlnLm5vcm1hbGl6ZUNob2ljZXMoZmllbGQuY2hvaWNlcyk7XG4gICAgfSxcblxuICAgIC8vIEdldCB0aGUgY2hvaWNlcyBmb3IgYSBwcmV0dHkgZHJvcGRvd24gZmllbGQuXG4gICAgZmllbGRQcmV0dHlDaG9pY2VzOiBmdW5jdGlvbiAoZmllbGQpIHtcblxuICAgICAgcmV0dXJuIGNvbmZpZy5ub3JtYWxpemVQcmV0dHlDaG9pY2VzKGZpZWxkLmNob2ljZXMpO1xuICAgIH0sXG5cbiAgICAvLyBHZXQgYSBzZXQgb2YgYm9vbGVhbiBjaG9pY2VzIGZvciBhIGZpZWxkLlxuICAgIGZpZWxkQm9vbGVhbkNob2ljZXM6IGZ1bmN0aW9uIChmaWVsZCkge1xuXG4gICAgICB2YXIgY2hvaWNlcyA9IGNvbmZpZy5maWVsZENob2ljZXMoZmllbGQpO1xuXG4gICAgICBpZiAoY2hvaWNlcy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgcmV0dXJuIFt7XG4gICAgICAgICAgbGFiZWw6ICd5ZXMnLFxuICAgICAgICAgIHZhbHVlOiB0cnVlXG4gICAgICAgIH0sIHtcbiAgICAgICAgICBsYWJlbDogJ25vJyxcbiAgICAgICAgICB2YWx1ZTogZmFsc2VcbiAgICAgICAgfV07XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBjaG9pY2VzLm1hcChmdW5jdGlvbiAoY2hvaWNlKSB7XG4gICAgICAgIGlmIChfLmlzQm9vbGVhbihjaG9pY2UudmFsdWUpKSB7XG4gICAgICAgICAgcmV0dXJuIGNob2ljZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gXy5leHRlbmQoe30sIGNob2ljZSwge1xuICAgICAgICAgIHZhbHVlOiBjb25maWcuY29lcmNlVmFsdWVUb0Jvb2xlYW4oY2hvaWNlLnZhbHVlKVxuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0sXG5cbiAgICAvLyBHZXQgYSBzZXQgb2YgcmVwbGFjZW1lbnQgY2hvaWNlcyBmb3IgYSBmaWVsZC5cbiAgICBmaWVsZFJlcGxhY2VDaG9pY2VzOiBmdW5jdGlvbiAoZmllbGQpIHtcblxuICAgICAgcmV0dXJuIGNvbmZpZy5ub3JtYWxpemVDaG9pY2VzKGZpZWxkLnJlcGxhY2VDaG9pY2VzKTtcbiAgICB9LFxuXG4gICAgLy8gVGhlIGFjdGl2ZSBzZWxlY3RlZCBjaG9pY2UgY291bGQgYmUgdW5hdmFpbGFibGUgaW4gdGhlIGN1cnJlbnQgbGlzdCBvZlxuICAgIC8vIGNob2ljZXMuIFRoaXMgcHJvdmlkZXMgdGhlIHNlbGVjdGVkIGNob2ljZSBpbiB0aGF0IGNhc2UuXG4gICAgZmllbGRTZWxlY3RlZENob2ljZTogZnVuY3Rpb24gKGZpZWxkKSB7XG5cbiAgICAgIHJldHVybiBmaWVsZC5zZWxlY3RlZENob2ljZSB8fCBudWxsO1xuICAgIH0sXG5cbiAgICAvLyBUaGUgYWN0aXZlIHJlcGxhY2UgbGFiZWxzIGNvdWxkIGJlIHVuYXZpbGFibGUgaW4gdGhlIGN1cnJlbnQgbGlzdCBvZlxuICAgIC8vIHJlcGxhY2UgY2hvaWNlcy4gVGhpcyBwcm92aWRlcyB0aGUgY3VycmVudGx5IHVzZWQgcmVwbGFjZSBsYWJlbHMgaW5cbiAgICAvLyB0aGF0IGNhc2UuXG4gICAgZmllbGRTZWxlY3RlZFJlcGxhY2VDaG9pY2VzOiBmdW5jdGlvbiAoZmllbGQpIHtcblxuICAgICAgcmV0dXJuIGNvbmZpZy5ub3JtYWxpemVDaG9pY2VzKGZpZWxkLnNlbGVjdGVkUmVwbGFjZUNob2ljZXMpO1xuICAgIH0sXG5cbiAgICAvLyBHZXQgYSBsYWJlbCBmb3IgYSBmaWVsZC5cbiAgICBmaWVsZExhYmVsOiBmdW5jdGlvbiAoZmllbGQpIHtcbiAgICAgIHJldHVybiBmaWVsZC5sYWJlbDtcbiAgICB9LFxuXG4gICAgLy8gR2V0IGEgcGxhY2Vob2xkZXIgKGp1c3QgYSBkZWZhdWx0IGRpc3BsYXkgdmFsdWUsIG5vdCBhIGRlZmF1bHQgdmFsdWUpIGZvciBhIGZpZWxkLlxuICAgIGZpZWxkUGxhY2Vob2xkZXI6IGZ1bmN0aW9uIChmaWVsZCkge1xuICAgICAgcmV0dXJuIGZpZWxkLnBsYWNlaG9sZGVyO1xuICAgIH0sXG5cbiAgICAvLyBHZXQgdGhlIGhlbHAgdGV4dCBmb3IgYSBmaWVsZC5cbiAgICBmaWVsZEhlbHBUZXh0OiBmdW5jdGlvbiAoZmllbGQpIHtcbiAgICAgIHJldHVybiBmaWVsZC5oZWxwX3RleHRfaHRtbCB8fCBmaWVsZC5oZWxwX3RleHQgfHwgZmllbGQuaGVscFRleHQgfHwgZmllbGQuaGVscFRleHRIdG1sO1xuICAgIH0sXG5cbiAgICAvLyBHZXQgd2hldGhlciBvciBub3QgYSBmaWVsZCBpcyByZXF1aXJlZC5cbiAgICBmaWVsZElzUmVxdWlyZWQ6IGZ1bmN0aW9uIChmaWVsZCkge1xuICAgICAgcmV0dXJuIGZpZWxkLnJlcXVpcmVkID8gdHJ1ZSA6IGZhbHNlO1xuICAgIH0sXG5cbiAgICAvLyBEZXRlcm1pbmUgaWYgdmFsdWUgZm9yIHRoaXMgZmllbGQgaXMgbm90IGEgbGVhZiB2YWx1ZS5cbiAgICBmaWVsZEhhc1ZhbHVlQ2hpbGRyZW46IGZ1bmN0aW9uIChmaWVsZCkge1xuXG4gICAgICB2YXIgZGVmYXVsdFZhbHVlID0gY29uZmlnLmNyZWF0ZURlZmF1bHRWYWx1ZShmaWVsZCk7XG5cbiAgICAgIGlmIChfLmlzT2JqZWN0KGRlZmF1bHRWYWx1ZSkgfHwgXy5pc0FycmF5KGRlZmF1bHRWYWx1ZSkpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9LFxuXG4gICAgLy8gR2V0IHRoZSBjaGlsZCBmaWVsZCB0ZW1wbGF0ZXMgZm9yIHRoaXMgZmllbGQuXG4gICAgZmllbGRDaGlsZEZpZWxkVGVtcGxhdGVzOiBmdW5jdGlvbiAoZmllbGQpIHtcbiAgICAgIHJldHVybiBmaWVsZC5maWVsZHMgfHwgW107XG4gICAgfSxcblxuICAgIC8vIEdldCB0aGUgZmllbGQgdGVtcGxhdGVzIGZvciBlYWNoIGl0ZW0gb2YgdGhpcyBmaWVsZC4gKEZvciBkeW5hbWljIGNoaWxkcmVuLFxuICAgIC8vIGxpa2UgYXJyYXlzLilcbiAgICBmaWVsZEl0ZW1GaWVsZFRlbXBsYXRlczogZnVuY3Rpb24gKGZpZWxkKSB7XG4gICAgICBpZiAoIWZpZWxkLml0ZW1GaWVsZHMpIHtcbiAgICAgICAgcmV0dXJuIFt7dHlwZTogJ3RleHQnfV07XG4gICAgICB9XG4gICAgICBpZiAoIV8uaXNBcnJheShmaWVsZC5pdGVtRmllbGRzKSkge1xuICAgICAgICByZXR1cm4gW2ZpZWxkLml0ZW1GaWVsZHNdO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGZpZWxkLml0ZW1GaWVsZHM7XG4gICAgfSxcblxuICAgIC8vIFRlbXBsYXRlIGZvciBhIGN1c3RvbSBmaWVsZCBmb3IgYSBkcm9wZG93bi5cbiAgICBmaWVsZEN1c3RvbUZpZWxkVGVtcGxhdGU6IGZ1bmN0aW9uIChmaWVsZCkge1xuICAgICAgcmV0dXJuIGZpZWxkLmN1c3RvbUZpZWxkO1xuICAgIH0sXG5cbiAgICBmaWVsZElzU2luZ2xlTGluZTogZGVsZWdhdGVUbygnZmllbGRUZW1wbGF0ZUlzU2luZ2xlTGluZScpLFxuXG4gICAgLy8gR2V0IHdoZXRoZXIgb3Igbm90IGEgZmllbGQgaXMgY29sbGFwc2VkLlxuICAgIGZpZWxkSXNDb2xsYXBzZWQ6IGZ1bmN0aW9uIChmaWVsZCkge1xuICAgICAgcmV0dXJuIGZpZWxkLmNvbGxhcHNlZCA/IHRydWUgOiBmYWxzZTtcbiAgICB9LFxuXG4gICAgLy8gR2V0IHdoZXRlciBvciBub3QgYSBmaWVsZCBjYW4gYmUgY29sbGFwc2VkLlxuICAgIGZpZWxkSXNDb2xsYXBzaWJsZTogZnVuY3Rpb24gKGZpZWxkKSB7XG4gICAgICByZXR1cm4gZmllbGQuY29sbGFwc2libGUgfHwgIV8uaXNVbmRlZmluZWQoZmllbGQuY29sbGFwc2VkKTtcbiAgICB9LFxuXG4gICAgLy8gR2V0IHRoZSBudW1iZXIgb2Ygcm93cyBmb3IgYSBmaWVsZC5cbiAgICBmaWVsZFJvd3M6IGZ1bmN0aW9uIChmaWVsZCkge1xuICAgICAgcmV0dXJuIGZpZWxkLnJvd3M7XG4gICAgfSxcblxuICAgIGZpZWxkRXJyb3JzOiBmdW5jdGlvbiAoZmllbGQpIHtcblxuICAgICAgdmFyIGVycm9ycyA9IFtdO1xuXG4gICAgICBpZiAoY29uZmlnLmlzS2V5KGZpZWxkLmtleSkpIHtcbiAgICAgICAgY29uZmlnLnZhbGlkYXRlRmllbGQoZmllbGQsIGVycm9ycyk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBlcnJvcnM7XG4gICAgfSxcblxuICAgIGZpZWxkTWF0Y2g6IGRlbGVnYXRlVG8oJ2ZpZWxkVGVtcGxhdGVNYXRjaCcpLFxuXG4gICAgLy8gUmV0dXJuIHRydWUgaWYgZmllbGQgaXMgcmVhZC1vbmx5LCBvciBpcyBhIGRlc2NlbmRhbnQgb2YgYSByZWFkLW9ubHkgZmllbGRcbiAgICBmaWVsZElzUmVhZE9ubHk6IGZ1bmN0aW9uIChmaWVsZCkge1xuICAgICAgaWYgKGZpZWxkLnJlYWRPbmx5KSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfSBlbHNlIGlmIChmaWVsZC5wYXJlbnQpIHtcbiAgICAgICAgcmV0dXJuIGNvbmZpZy5maWVsZElzUmVhZE9ubHkoZmllbGQucGFyZW50KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICB9LFxuXG4gICAgLy8gT3RoZXIgaGVscGVyc1xuXG4gICAgLy8gQ29udmVydCBhIGtleSB0byBhIG5pY2UgaHVtYW4tcmVhZGFibGUgdmVyc2lvbi5cbiAgICBodW1hbml6ZTogZnVuY3Rpb24ocHJvcGVydHkpIHtcbiAgICAgIHByb3BlcnR5ID0gcHJvcGVydHkucmVwbGFjZSgvXFx7XFx7L2csICcnKTtcbiAgICAgIHByb3BlcnR5ID0gcHJvcGVydHkucmVwbGFjZSgvXFx9XFx9L2csICcnKTtcbiAgICAgIHJldHVybiBwcm9wZXJ0eS5yZXBsYWNlKC9fL2csICcgJylcbiAgICAgIC5yZXBsYWNlKC8oXFx3KykvZywgZnVuY3Rpb24obWF0Y2gpIHtcbiAgICAgICAgcmV0dXJuIG1hdGNoLmNoYXJBdCgwKS50b1VwcGVyQ2FzZSgpICsgbWF0Y2guc2xpY2UoMSk7XG4gICAgICB9KTtcbiAgICB9LFxuXG4gICAgLy8gTm9ybWFsaXplIHNvbWUgY2hvaWNlcyBmb3IgYSBkcm9wLWRvd24uXG4gICAgbm9ybWFsaXplQ2hvaWNlczogZnVuY3Rpb24gKGNob2ljZXMpIHtcblxuICAgICAgaWYgKCFjaG9pY2VzKSB7XG4gICAgICAgIHJldHVybiBbXTtcbiAgICAgIH1cblxuICAgICAgLy8gQ29udmVydCBjb21tYSBzZXBhcmF0ZWQgc3RyaW5nIHRvIGFycmF5IG9mIHN0cmluZ3MuXG4gICAgICBpZiAoXy5pc1N0cmluZyhjaG9pY2VzKSkge1xuICAgICAgICBjaG9pY2VzID0gY2hvaWNlcy5zcGxpdCgnLCcpO1xuICAgICAgfVxuXG4gICAgICAvLyBDb252ZXJ0IG9iamVjdCB0byBhcnJheSBvZiBvYmplY3RzIHdpdGggYHZhbHVlYCBhbmQgYGxhYmVsYCBwcm9wZXJ0aWVzLlxuICAgICAgaWYgKCFfLmlzQXJyYXkoY2hvaWNlcykgJiYgXy5pc09iamVjdChjaG9pY2VzKSkge1xuICAgICAgICBjaG9pY2VzID0gT2JqZWN0LmtleXMoY2hvaWNlcykubWFwKGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgdmFsdWU6IGtleSxcbiAgICAgICAgICAgIGxhYmVsOiBjaG9pY2VzW2tleV1cbiAgICAgICAgICB9O1xuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgLy8gQ29weSB0aGUgYXJyYXkgb2YgY2hvaWNlcyBzbyB3ZSBjYW4gbWFuaXB1bGF0ZSB0aGVtLlxuICAgICAgY2hvaWNlcyA9IGNob2ljZXMuc2xpY2UoMCk7XG5cbiAgICAgIC8vIEFycmF5IG9mIGNob2ljZSBhcnJheXMgc2hvdWxkIGJlIGZsYXR0ZW5lZC5cbiAgICAgIGNob2ljZXMgPSBfLmZsYXR0ZW4oY2hvaWNlcyk7XG5cbiAgICAgIGNob2ljZXMuZm9yRWFjaChmdW5jdGlvbiAoY2hvaWNlLCBpKSB7XG4gICAgICAgIC8vIENvbnZlcnQgYW55IHN0cmluZyBjaG9pY2VzIHRvIG9iamVjdHMgd2l0aCBgdmFsdWVgIGFuZCBgbGFiZWxgXG4gICAgICAgIC8vIHByb3BlcnRpZXMuXG4gICAgICAgIGlmIChfLmlzU3RyaW5nKGNob2ljZSkpIHtcbiAgICAgICAgICBjaG9pY2VzW2ldID0ge1xuICAgICAgICAgICAgdmFsdWU6IGNob2ljZSxcbiAgICAgICAgICAgIGxhYmVsOiBjb25maWcuaHVtYW5pemUoY2hvaWNlKVxuICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFjaG9pY2VzW2ldLmxhYmVsKSB7XG4gICAgICAgICAgY2hvaWNlc1tpXS5sYWJlbCA9IGNvbmZpZy5odW1hbml6ZShjaG9pY2VzW2ldLnZhbHVlKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG5cbiAgICAgIHJldHVybiBjaG9pY2VzO1xuICAgIH0sXG5cbiAgICAvLyBOb3JtYWxpemUgY2hvaWNlcyBmb3IgYSBwcmV0dHkgZHJvcCBkb3duLCB3aXRoICdzYW1wbGUnIHZhbHVlc1xuICAgIG5vcm1hbGl6ZVByZXR0eUNob2ljZXM6IGZ1bmN0aW9uIChjaG9pY2VzKSB7XG4gICAgICBpZiAoIV8uaXNBcnJheShjaG9pY2VzKSAmJiBfLmlzT2JqZWN0KGNob2ljZXMpKSB7XG4gICAgICAgIGNob2ljZXMgPSBPYmplY3Qua2V5cyhjaG9pY2VzKS5tYXAoZnVuY3Rpb24gKGtleSkge1xuICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB2YWx1ZToga2V5LFxuICAgICAgICAgICAgbGFiZWw6IGNob2ljZXNba2V5XSxcbiAgICAgICAgICAgIHNhbXBsZToga2V5XG4gICAgICAgICAgfTtcbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBjb25maWcubm9ybWFsaXplQ2hvaWNlcyhjaG9pY2VzKTtcbiAgICB9LFxuXG4gICAgLy8gQ29lcmNlIGEgdmFsdWUgdG8gYSBib29sZWFuXG4gICAgY29lcmNlVmFsdWVUb0Jvb2xlYW46IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgaWYgKCFfLmlzU3RyaW5nKHZhbHVlKSkge1xuICAgICAgICAvLyBKdXN0IHVzZSB0aGUgZGVmYXVsdCB0cnV0aGluZXNzLlxuICAgICAgICByZXR1cm4gdmFsdWUgPyB0cnVlIDogZmFsc2U7XG4gICAgICB9XG4gICAgICB2YWx1ZSA9IHZhbHVlLnRvTG93ZXJDYXNlKCk7XG4gICAgICBpZiAodmFsdWUgPT09ICcnIHx8IHZhbHVlID09PSAnbm8nIHx8IHZhbHVlID09PSAnb2ZmJyB8fCB2YWx1ZSA9PT0gJ2ZhbHNlJykge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9LFxuXG4gICAgLy8gRGV0ZXJtaW5lIGlmIGEgdmFsdWUgaXMgYSB2YWxpZCBrZXkuXG4gICAgaXNLZXk6IGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgIHJldHVybiAoXy5pc051bWJlcihrZXkpICYmIGtleSA+PSAwKSB8fCAoXy5pc1N0cmluZyhrZXkpICYmIGtleSAhPT0gJycpO1xuICAgIH0sXG5cbiAgICAvLyBGYXN0IHdheSB0byBjaGVjayBmb3IgZW1wdHkgb2JqZWN0LlxuICAgIGlzRW1wdHlPYmplY3Q6IGZ1bmN0aW9uIChvYmopIHtcbiAgICAgIGZvcih2YXIga2V5IGluIG9iaikge1xuICAgICAgICBpZiAob2JqLmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH0sXG5cbiAgICBhY3Rpb25DaG9pY2VMYWJlbDogZnVuY3Rpb24gKGFjdGlvbikge1xuICAgICAgcmV0dXJuIHV0aWxzLmNhcGl0YWxpemUoYWN0aW9uKS5yZXBsYWNlKC9bLV0vZywgJyAnKTtcbiAgICB9LFxuXG4gICAgaXNTZWFyY2hTdHJpbmdJbkNob2ljZTogZnVuY3Rpb24gKHNlYXJjaFN0cmluZywgY2hvaWNlKSB7XG4gICAgICByZXR1cm4gY2hvaWNlLmxhYmVsICYmIGNob2ljZS5sYWJlbC50b0xvd2VyQ2FzZSgpLmluZGV4T2Yoc2VhcmNoU3RyaW5nLnRvTG93ZXJDYXNlKCkpID4gLTE7XG4gICAgfVxuICB9O1xufTtcbiIsIi8vICMgZm9ybWF0aWNcblxuLypcblRoZSByb290IGZvcm1hdGljIGNvbXBvbmVudC5cblxuVGhlIHJvb3QgZm9ybWF0aWMgY29tcG9uZW50IGlzIGFjdHVhbGx5IHR3byBjb21wb25lbnRzLiBUaGUgbWFpbiBjb21wb25lbnQgaXNcbmEgY29udHJvbGxlZCBjb21wb25lbnQgd2hlcmUgeW91IG11c3QgcGFzcyB0aGUgdmFsdWUgaW4gd2l0aCBlYWNoIHJlbmRlci4gVGhpc1xuaXMgYWN0dWFsbHkgd3JhcHBlZCBpbiBhbm90aGVyIGNvbXBvbmVudCB3aGljaCBhbGxvd3MgeW91IHRvIHVzZSBmb3JtYXRpYyBhc1xuYW4gdW5jb250cm9sbGVkIGNvbXBvbmVudCB3aGVyZSBpdCByZXRhaW5zIHRoZSBzdGF0ZSBvZiB0aGUgdmFsdWUuIFRoZSB3cmFwcGVyXG5pcyB3aGF0IGlzIGFjdHVhbGx5IGV4cG9ydGVkLlxuKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgUmVhY3QgPSByZXF1aXJlKCdyZWFjdC9hZGRvbnMnKTtcbnZhciBfID0gcmVxdWlyZSgnLi91bmRhc2gnKTtcblxudmFyIHV0aWxzID0gcmVxdWlyZSgnLi91dGlscycpO1xuXG52YXIgZGVmYXVsdENvbmZpZ1BsdWdpbiA9IHJlcXVpcmUoJy4vZGVmYXVsdC1jb25maWcnKTtcblxudmFyIGNyZWF0ZUNvbmZpZyA9IGZ1bmN0aW9uICguLi5hcmdzKSB7XG4gIHZhciBwbHVnaW5zID0gW2RlZmF1bHRDb25maWdQbHVnaW5dLmNvbmNhdChhcmdzKTtcblxuICByZXR1cm4gcGx1Z2lucy5yZWR1Y2UoZnVuY3Rpb24gKGNvbmZpZywgcGx1Z2luKSB7XG4gICAgaWYgKF8uaXNGdW5jdGlvbihwbHVnaW4pKSB7XG4gICAgICB2YXIgZXh0ZW5zaW9ucyA9IHBsdWdpbihjb25maWcpO1xuICAgICAgaWYgKGV4dGVuc2lvbnMpIHtcbiAgICAgICAgXy5leHRlbmQoY29uZmlnLCBleHRlbnNpb25zKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgXy5leHRlbmQoY29uZmlnLCBwbHVnaW4pO1xuICAgIH1cblxuICAgIHJldHVybiBjb25maWc7XG4gIH0sIHt9KTtcbn07XG5cbnZhciBkZWZhdWx0Q29uZmlnID0gY3JlYXRlQ29uZmlnKCk7XG5cbi8vIFRoZSBtYWluIGZvcm1hdGljIGNvbXBvbmVudCB0aGF0IHJlbmRlcnMgdGhlIGZvcm0uXG52YXIgRm9ybWF0aWNDb250cm9sbGVkQ2xhc3MgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG5cbiAgZGlzcGxheU5hbWU6ICdGb3JtYXRpY0NvbnRyb2xsZWQnLFxuXG4gIC8vIFJlc3BvbmQgdG8gYW55IHZhbHVlIGNoYW5nZXMuXG4gIG9uQ2hhbmdlOiBmdW5jdGlvbiAobmV3VmFsdWUsIGluZm8pIHtcbiAgICBpZiAoIXRoaXMucHJvcHMub25DaGFuZ2UpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaW5mbyA9IF8uZXh0ZW5kKHt9LCBpbmZvKTtcbiAgICBpbmZvLnBhdGggPSB0aGlzLnByb3BzLmNvbmZpZy5maWVsZFZhbHVlUGF0aChpbmZvLmZpZWxkKTtcbiAgICB0aGlzLnByb3BzLm9uQ2hhbmdlKG5ld1ZhbHVlLCBpbmZvKTtcbiAgfSxcblxuICAvLyBSZXNwb25kIHRvIGFueSBhY3Rpb25zIG90aGVyIHRoYW4gdmFsdWUgY2hhbmdlcy4gKEZvciBleGFtcGxlLCBmb2N1cyBhbmRcbiAgLy8gYmx1ci4pXG4gIG9uQWN0aW9uOiBmdW5jdGlvbiAoaW5mbykge1xuICAgIGlmICghdGhpcy5wcm9wcy5vbkFjdGlvbikge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpbmZvID0gXy5leHRlbmQoe30sIGluZm8pO1xuICAgIGluZm8ucGF0aCA9IHRoaXMucHJvcHMuY29uZmlnLmZpZWxkVmFsdWVQYXRoKGluZm8uZmllbGQpO1xuICAgIHRoaXMucHJvcHMub25BY3Rpb24oaW5mbyk7XG4gIH0sXG5cbiAgLy8gUmVuZGVyIHRoZSByb290IGNvbXBvbmVudCBieSBkZWxlZ2F0aW5nIHRvIHRoZSBjb25maWcuXG4gIHJlbmRlcjogZnVuY3Rpb24gKCkge1xuXG4gICAgdmFyIGNvbmZpZyA9IHRoaXMucHJvcHMuY29uZmlnO1xuXG4gICAgcmV0dXJuIGNvbmZpZy5yZW5kZXJGb3JtYXRpY0NvbXBvbmVudCh0aGlzKTtcbiAgfVxufSk7XG5cbnZhciBGb3JtYXRpY0NvbnRyb2xsZWQgPSBSZWFjdC5jcmVhdGVGYWN0b3J5KEZvcm1hdGljQ29udHJvbGxlZENsYXNzKTtcblxuLy8gQSB3cmFwcGVyIGNvbXBvbmVudCB0aGF0IGlzIGFjdHVhbGx5IGV4cG9ydGVkIGFuZCBjYW4gYWxsb3cgZm9ybWF0aWMgdG8gYmVcbi8vIHVzZWQgaW4gYW4gXCJ1bmNvbnRyb2xsZWRcIiBtYW5uZXIuIChTZWUgdW5jb250cm9sbGVkIGNvbXBvbmVudHMgaW4gdGhlIFJlYWN0XG4vLyBkb2N1bWVudGF0aW9uIGZvciBhbiBleHBsYW5hdGlvbiBvZiB0aGUgZGlmZmVyZW5jZS4pXG5tb2R1bGUuZXhwb3J0cyA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcblxuICBkaXNwbGF5TmFtZTogJ0Zvcm1hdGljJyxcblxuICAvLyBFeHBvcnQgc29tZSBzdHVmZiBhcyBzdGF0aWNzLlxuICBzdGF0aWNzOiB7XG4gICAgY3JlYXRlQ29uZmlnOiBjcmVhdGVDb25maWcsXG4gICAgYXZhaWxhYmxlTWl4aW5zOiB7XG4gICAgICBjbGlja091dHNpZGU6IHJlcXVpcmUoJy4vbWl4aW5zL2NsaWNrLW91dHNpZGUuanMnKSxcbiAgICAgIGZpZWxkOiByZXF1aXJlKCcuL21peGlucy9maWVsZC5qcycpLFxuICAgICAgaGVscGVyOiByZXF1aXJlKCcuL21peGlucy9oZWxwZXIuanMnKSxcbiAgICAgIHJlc2l6ZTogcmVxdWlyZSgnLi9taXhpbnMvcmVzaXplLmpzJyksXG4gICAgICBzY3JvbGw6IHJlcXVpcmUoJy4vbWl4aW5zL3Njcm9sbC5qcycpLFxuICAgICAgdW5kb1N0YWNrOiByZXF1aXJlKCcuL21peGlucy91bmRvLXN0YWNrLmpzJylcbiAgICB9LFxuICAgIHBsdWdpbnM6IHtcbiAgICAgIGJvb3RzdHJhcDogcmVxdWlyZSgnLi9wbHVnaW5zL2Jvb3RzdHJhcCcpLFxuICAgICAgbWV0YTogcmVxdWlyZSgnLi9wbHVnaW5zL21ldGEnKSxcbiAgICAgIHJlZmVyZW5jZTogcmVxdWlyZSgnLi9wbHVnaW5zL3JlZmVyZW5jZScpLFxuICAgICAgZWxlbWVudENsYXNzZXM6IHJlcXVpcmUoJy4vcGx1Z2lucy9lbGVtZW50LWNsYXNzZXMnKVxuICAgIH0sXG4gICAgdXRpbHM6IHV0aWxzXG4gIH0sXG5cbiAgLy8gSWYgd2UgZ290IGEgdmFsdWUsIHRyZWF0IHRoaXMgY29tcG9uZW50IGFzIGNvbnRyb2xsZWQuIEVpdGhlciB3YXksIHJldGFpblxuICAvLyB0aGUgdmFsdWUgaW4gdGhlIHN0YXRlLlxuICBnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4ge1xuICAgICAgaXNDb250cm9sbGVkOiAhXy5pc1VuZGVmaW5lZCh0aGlzLnByb3BzLnZhbHVlKSxcbiAgICAgIHZhbHVlOiBfLmlzVW5kZWZpbmVkKHRoaXMucHJvcHMudmFsdWUpID8gdGhpcy5wcm9wcy5kZWZhdWx0VmFsdWUgOiB0aGlzLnByb3BzLnZhbHVlXG4gICAgfTtcbiAgfSxcblxuICAvLyBJZiB0aGlzIGlzIGEgY29udHJvbGxlZCBjb21wb25lbnQsIGNoYW5nZSBvdXIgc3RhdGUgdG8gcmVmbGVjdCB0aGUgbmV3XG4gIC8vIHZhbHVlLiBGb3IgdW5jb250cm9sbGVkIGNvbXBvbmVudHMsIGlnbm9yZSBhbnkgdmFsdWUgY2hhbmdlcy5cbiAgY29tcG9uZW50V2lsbFJlY2VpdmVQcm9wczogZnVuY3Rpb24gKG5ld1Byb3BzKSB7XG4gICAgaWYgKHRoaXMuc3RhdGUuaXNDb250cm9sbGVkKSB7XG4gICAgICBpZiAoIV8uaXNVbmRlZmluZWQobmV3UHJvcHMudmFsdWUpKSB7XG4gICAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICAgIHZhbHVlOiBuZXdQcm9wcy52YWx1ZVxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG4gIH0sXG5cbiAgLy8gSWYgdGhpcyBpcyBhbiB1bmNvbnRyb2xsZWQgY29tcG9uZW50LCBzZXQgb3VyIHN0YXRlIHRvIHJlZmxlY3QgdGhlIG5ld1xuICAvLyB2YWx1ZS4gRWl0aGVyIHdheSwgY2FsbCB0aGUgb25DaGFuZ2UgY2FsbGJhY2suXG4gIG9uQ2hhbmdlOiBmdW5jdGlvbiAobmV3VmFsdWUsIGluZm8pIHtcbiAgICBpZiAoIXRoaXMuc3RhdGUuaXNDb250cm9sbGVkKSB7XG4gICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgdmFsdWU6IG5ld1ZhbHVlXG4gICAgICB9KTtcbiAgICB9XG4gICAgaWYgKCF0aGlzLnByb3BzLm9uQ2hhbmdlKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHRoaXMucHJvcHMub25DaGFuZ2UobmV3VmFsdWUsIGluZm8pO1xuICB9LFxuXG4gIC8vIEFueSBhY3Rpb25zIHNob3VsZCBiZSBzZW50IHRvIHRoZSBnZW5lcmljIG9uQWN0aW9uIGNhbGxiYWNrIGJ1dCBhbHNvIHNwbGl0XG4gIC8vIGludG8gZGlzY3JlZXQgY2FsbGJhY2tzIHBlciBhY3Rpb24uXG4gIG9uQWN0aW9uOiBmdW5jdGlvbiAoaW5mbykge1xuICAgIGlmICh0aGlzLnByb3BzLm9uQWN0aW9uKSB7XG4gICAgICB0aGlzLnByb3BzLm9uQWN0aW9uKGluZm8pO1xuICAgIH1cbiAgICB2YXIgYWN0aW9uID0gdXRpbHMuZGFzaFRvUGFzY2FsKGluZm8uYWN0aW9uKTtcbiAgICBpZiAodGhpcy5wcm9wc1snb24nICsgYWN0aW9uXSkge1xuICAgICAgdGhpcy5wcm9wc1snb24nICsgYWN0aW9uXShpbmZvKTtcbiAgICB9XG4gIH0sXG5cbiAgLy8gUmVuZGVyIHRoZSB3cmFwcGVyIGNvbXBvbmVudCAoYnkganVzdCBkZWxlZ2F0aW5nIHRvIHRoZSBtYWluIGNvbXBvbmVudCkuXG4gIHJlbmRlcjogZnVuY3Rpb24gKCkge1xuXG4gICAgdmFyIGNvbmZpZyA9IHRoaXMucHJvcHMuY29uZmlnIHx8IGRlZmF1bHRDb25maWc7XG4gICAgdmFyIHZhbHVlID0gdGhpcy5zdGF0ZS52YWx1ZTtcblxuICAgIGlmICh0aGlzLnN0YXRlLmlzQ29udHJvbGxlZCkge1xuICAgICAgaWYgKCF0aGlzLnByb3BzLm9uQ2hhbmdlKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCdZb3Ugc2hvdWxkIHN1cHBseSBhbiBvbkNoYW5nZSBoYW5kbGVyIGlmIHlvdSBzdXBwbHkgYSB2YWx1ZS4nKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB2YXIgcHJvcHMgPSB7XG4gICAgICBjb25maWc6IGNvbmZpZyxcbiAgICAgIC8vIEFsbG93IGZpZWxkIHRlbXBsYXRlcyB0byBiZSBwYXNzZWQgaW4gYXMgYGZpZWxkYCBvciBgZmllbGRzYC4gQWZ0ZXIgdGhpcywgc3RvcFxuICAgICAgLy8gY2FsbGluZyB0aGVtIGZpZWxkcy5cbiAgICAgIGZpZWxkVGVtcGxhdGU6IHRoaXMucHJvcHMuZmllbGQsXG4gICAgICBmaWVsZFRlbXBsYXRlczogdGhpcy5wcm9wcy5maWVsZHMsXG4gICAgICB2YWx1ZTogdmFsdWUsXG4gICAgICBvbkNoYW5nZTogdGhpcy5vbkNoYW5nZSxcbiAgICAgIG9uQWN0aW9uOiB0aGlzLm9uQWN0aW9uXG4gICAgfTtcblxuICAgIF8uZWFjaCh0aGlzLnByb3BzLCBmdW5jdGlvbiAocHJvcFZhbHVlLCBrZXkpIHtcbiAgICAgIGlmICghKGtleSBpbiBwcm9wcykpIHtcbiAgICAgICAgcHJvcHNba2V5XSA9IHByb3BWYWx1ZTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIHJldHVybiBGb3JtYXRpY0NvbnRyb2xsZWQocHJvcHMpO1xuICB9XG5cbn0pO1xuIiwiLy8gIyBjbGljay1vdXRzaWRlIG1peGluXG5cbi8qXG5UaGVyZSdzIG5vIG5hdGl2ZSBSZWFjdCB3YXkgdG8gZGV0ZWN0IGNsaWNraW5nIG91dHNpZGUgYW4gZWxlbWVudC4gU29tZXRpbWVzXG50aGlzIGlzIHVzZWZ1bCwgc28gdGhhdCdzIHdoYXQgdGhpcyBtaXhpbiBkb2VzLiBUbyB1c2UgaXQsIG1peCBpdCBpbiBhbmQgdXNlIGl0XG5mcm9tIHlvdXIgY29tcG9uZW50IGxpa2UgdGhpczpcblxuYGBganNcbm1vZHVsZS5leHBvcnRzID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXG4gIG1peGluczogW3JlcXVpcmUoJy4uLy4ubWl4aW5zL2NsaWNrLW91dHNpZGUnKV0sXG5cbiAgb25DbGlja091dHNpZGU6IGZ1bmN0aW9uICgpIHtcbiAgICBjb25zb2xlLmxvZygnY2xpY2tlZCBvdXRzaWRlIScpO1xuICB9LFxuXG4gIGNvbXBvbmVudERpZE1vdW50OiBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5zZXRPbkNsaWNrT3V0c2lkZSgnbXlEaXYnLCB0aGlzLm9uQ2xpY2tPdXRzaWRlKTtcbiAgfSxcblxuICByZW5kZXI6IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gUmVhY3QuRE9NLmRpdih7cmVmOiAnbXlEaXYnfSxcbiAgICAgICdIZWxsbyEnXG4gICAgKVxuICB9XG59KTtcbmBgYFxuKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgXyA9IHJlcXVpcmUoJy4uL3VuZGFzaCcpO1xuXG52YXIgaGFzQW5jZXN0b3IgPSBmdW5jdGlvbiAoY2hpbGQsIHBhcmVudCkge1xuICBpZiAoY2hpbGQucGFyZW50Tm9kZSA9PT0gcGFyZW50KSB7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbiAgaWYgKGNoaWxkLnBhcmVudE5vZGUgPT09IG51bGwpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgcmV0dXJuIGhhc0FuY2VzdG9yKGNoaWxkLnBhcmVudE5vZGUsIHBhcmVudCk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcblxuICBpc05vZGVPdXRzaWRlOiBmdW5jdGlvbiAobm9kZU91dCwgbm9kZUluKSB7XG4gICAgaWYgKG5vZGVPdXQgPT09IG5vZGVJbikge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBpZiAoaGFzQW5jZXN0b3Iobm9kZU91dCwgbm9kZUluKSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfSxcblxuICBpc05vZGVJbnNpZGU6IGZ1bmN0aW9uIChub2RlSW4sIG5vZGVPdXQpIHtcbiAgICByZXR1cm4gIXRoaXMuaXNOb2RlT3V0c2lkZShub2RlSW4sIG5vZGVPdXQpO1xuICB9LFxuXG4gIF9vbkNsaWNrTW91c2Vkb3duOiBmdW5jdGlvbigpIHtcbiAgICBfLmVhY2godGhpcy5jbGlja091dHNpZGVIYW5kbGVycywgZnVuY3Rpb24gKGZ1bmNzLCByZWYpIHtcbiAgICAgIGlmICh0aGlzLnJlZnNbcmVmXSkge1xuICAgICAgICB0aGlzLl9tb3VzZWRvd25SZWZzW3JlZl0gPSB0cnVlO1xuICAgICAgfVxuICAgIH0uYmluZCh0aGlzKSk7XG4gIH0sXG5cbiAgX29uQ2xpY2tNb3VzZXVwOiBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICBfLmVhY2godGhpcy5jbGlja091dHNpZGVIYW5kbGVycywgZnVuY3Rpb24gKGZ1bmNzLCByZWYpIHtcbiAgICAgIGlmICh0aGlzLnJlZnNbcmVmXSAmJiB0aGlzLl9tb3VzZWRvd25SZWZzW3JlZl0pIHtcbiAgICAgICAgaWYgKHRoaXMuaXNOb2RlT3V0c2lkZShldmVudC50YXJnZXQsIHRoaXMucmVmc1tyZWZdLmdldERPTU5vZGUoKSkpIHtcbiAgICAgICAgICBmdW5jcy5mb3JFYWNoKGZ1bmN0aW9uIChmbikge1xuICAgICAgICAgICAgZm4uY2FsbCh0aGlzLCBldmVudCk7XG4gICAgICAgICAgfS5iaW5kKHRoaXMpKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgdGhpcy5fbW91c2Vkb3duUmVmc1tyZWZdID0gZmFsc2U7XG4gICAgfS5iaW5kKHRoaXMpKTtcbiAgfSxcblxuICBzZXRPbkNsaWNrT3V0c2lkZTogZnVuY3Rpb24gKHJlZiwgZm4pIHtcbiAgICBpZiAoIXRoaXMuY2xpY2tPdXRzaWRlSGFuZGxlcnNbcmVmXSkge1xuICAgICAgdGhpcy5jbGlja091dHNpZGVIYW5kbGVyc1tyZWZdID0gW107XG4gICAgfVxuICAgIHRoaXMuY2xpY2tPdXRzaWRlSGFuZGxlcnNbcmVmXS5wdXNoKGZuKTtcbiAgfSxcblxuICBjb21wb25lbnREaWRNb3VudDogZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuY2xpY2tPdXRzaWRlSGFuZGxlcnMgPSB7fTtcbiAgICB0aGlzLl9kaWRNb3VzZURvd24gPSBmYWxzZTtcbiAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCB0aGlzLl9vbkNsaWNrTW91c2Vkb3duKTtcbiAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdtb3VzZXVwJywgdGhpcy5fb25DbGlja01vdXNldXApO1xuICAgIC8vZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCB0aGlzLl9vbkNsaWNrRG9jdW1lbnQpO1xuICAgIHRoaXMuX21vdXNlZG93blJlZnMgPSB7fTtcbiAgfSxcblxuICBjb21wb25lbnRXaWxsVW5tb3VudDogZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuY2xpY2tPdXRzaWRlSGFuZGxlcnMgPSB7fTtcbiAgICAvL2RvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgdGhpcy5fb25DbGlja0RvY3VtZW50KTtcbiAgICBkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCdtb3VzZXVwJywgdGhpcy5fb25DbGlja01vdXNldXApO1xuICAgIGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsIHRoaXMuX29uQ2xpY2tNb3VzZWRvd24pO1xuICB9XG59O1xuIiwiLy8gIyBmaWVsZCBtaXhpblxuXG4vKlxuVGhpcyBtaXhpbiBnZXRzIG1peGVkIGludG8gYWxsIGZpZWxkIGNvbXBvbmVudHMuXG4qL1xuXG4ndXNlIHN0cmljdCc7XG5cbnZhciBfID0gcmVxdWlyZSgnLi4vdW5kYXNoJyk7XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuXG4gIC8vIFNpZ25hbCBhIGNoYW5nZSBpbiB2YWx1ZS5cbiAgb25DaGFuZ2VWYWx1ZTogZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgdGhpcy5wcm9wcy5vbkNoYW5nZSh2YWx1ZSwge1xuICAgICAgZmllbGQ6IHRoaXMucHJvcHMuZmllbGRcbiAgICB9KTtcbiAgfSxcblxuICAvLyBCdWJibGUgdXAgYSB2YWx1ZS5cbiAgb25CdWJibGVWYWx1ZTogZnVuY3Rpb24gKHZhbHVlLCBpbmZvKSB7XG4gICAgdGhpcy5wcm9wcy5vbkNoYW5nZSh2YWx1ZSwgaW5mbyk7XG4gIH0sXG5cbiAgLy8gU3RhcnQgYW4gYWN0aW9uIGJ1YmJsaW5nIHVwIHRocm91Z2ggcGFyZW50IGNvbXBvbmVudHMuXG4gIG9uU3RhcnRBY3Rpb246IGZ1bmN0aW9uIChhY3Rpb24sIHByb3BzKSB7XG4gICAgaWYgKHRoaXMucHJvcHMub25BY3Rpb24pIHtcbiAgICAgIHZhciBpbmZvID0gXy5leHRlbmQoe30sIHByb3BzKTtcbiAgICAgIGluZm8uYWN0aW9uID0gYWN0aW9uO1xuICAgICAgaW5mby5maWVsZCA9IHRoaXMucHJvcHMuZmllbGQ7XG4gICAgICB0aGlzLnByb3BzLm9uQWN0aW9uKGluZm8pO1xuICAgIH1cbiAgfSxcblxuICBvbkZvY3VzQWN0aW9uOiBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5vblN0YXJ0QWN0aW9uKCdmb2N1cycpO1xuICB9LFxuXG4gIG9uQmx1ckFjdGlvbjogZnVuY3Rpb24gKCkge1xuICAgIHRoaXMub25TdGFydEFjdGlvbignYmx1cicpO1xuICB9LFxuXG4gIC8vIEJ1YmJsZSB1cCBhbiBhY3Rpb24uXG4gIG9uQnViYmxlQWN0aW9uOiBmdW5jdGlvbiAoaW5mbykge1xuICAgIGlmICh0aGlzLnByb3BzLm9uQWN0aW9uKSB7XG4gICAgICB0aGlzLnByb3BzLm9uQWN0aW9uKGluZm8pO1xuICAgIH1cbiAgfSxcblxuICAvLyBEZWxlZ2F0ZSByZW5kZXJpbmcgYmFjayB0byBjb25maWcgc28gaXQgY2FuIGJlIHdyYXBwZWQuXG4gIHJlbmRlcldpdGhDb25maWc6IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpcy5wcm9wcy5jb25maWcucmVuZGVyRmllbGRDb21wb25lbnQodGhpcyk7XG4gIH0sXG5cbiAgaXNSZWFkT25seTogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLnByb3BzLmNvbmZpZy5maWVsZElzUmVhZE9ubHkodGhpcy5wcm9wcy5maWVsZCk7XG4gIH1cbn07XG4iLCIvLyAjIGhlbHBlciBtaXhpblxuXG4vKlxuVGhpcyBnZXRzIG1peGVkIGludG8gYWxsIGhlbHBlciBjb21wb25lbnRzLlxuKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgXyA9IHJlcXVpcmUoJy4uL3VuZGFzaCcpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcblxuICAvLyBEZWxlZ2F0ZSByZW5kZXJpbmcgYmFjayB0byBjb25maWcgc28gaXQgY2FuIGJlIHdyYXBwZWQuXG4gIHJlbmRlcldpdGhDb25maWc6IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpcy5wcm9wcy5jb25maWcucmVuZGVyQ29tcG9uZW50KHRoaXMpO1xuICB9LFxuXG4gIC8vIFN0YXJ0IGFuIGFjdGlvbiBidWJibGluZyB1cCB0aHJvdWdoIHBhcmVudCBjb21wb25lbnRzLlxuICBvblN0YXJ0QWN0aW9uOiBmdW5jdGlvbiAoYWN0aW9uLCBwcm9wcykge1xuICAgIGlmICh0aGlzLnByb3BzLm9uQWN0aW9uKSB7XG4gICAgICB2YXIgaW5mbyA9IF8uZXh0ZW5kKHt9LCBwcm9wcyk7XG4gICAgICBpbmZvLmFjdGlvbiA9IGFjdGlvbjtcbiAgICAgIGluZm8uZmllbGQgPSB0aGlzLnByb3BzLmZpZWxkO1xuICAgICAgdGhpcy5wcm9wcy5vbkFjdGlvbihpbmZvKTtcbiAgICB9XG4gIH0sXG5cbiAgLy8gQnViYmxlIHVwIGFuIGFjdGlvbi5cbiAgb25CdWJibGVBY3Rpb246IGZ1bmN0aW9uIChpbmZvKSB7XG4gICAgaWYgKHRoaXMucHJvcHMub25BY3Rpb24pIHtcbiAgICAgIHRoaXMucHJvcHMub25BY3Rpb24oaW5mbyk7XG4gICAgfVxuICB9LFxuXG4gIG9uRm9jdXNBY3Rpb246IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLm9uU3RhcnRBY3Rpb24oJ2ZvY3VzJyk7XG4gIH0sXG5cbiAgb25CbHVyQWN0aW9uOiBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5vblN0YXJ0QWN0aW9uKCdibHVyJyk7XG4gIH0sXG5cbiAgaXNSZWFkT25seTogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLnByb3BzLmNvbmZpZy5maWVsZElzUmVhZE9ubHkodGhpcy5wcm9wcy5maWVsZCk7XG4gIH1cbn07XG4iLCIvLyAjIHJlc2l6ZSBtaXhpblxuXG4vKlxuWW91J2QgdGhpbmsgaXQgd291bGQgYmUgcHJldHR5IGVhc3kgdG8gZGV0ZWN0IHdoZW4gYSBET00gZWxlbWVudCBpcyByZXNpemVkLlxuQW5kIHlvdSdkIGJlIHdyb25nLiBUaGVyZSBhcmUgdmFyaW91cyB0cmlja3MsIGJ1dCBub25lIG9mIHRoZW0gd29yayB2ZXJ5IHdlbGwuXG5TbywgdXNpbmcgZ29vZCBvbCcgcG9sbGluZyBoZXJlLiBUbyB0cnkgdG8gYmUgYXMgZWZmaWNpZW50IGFzIHBvc3NpYmxlLCB0aGVyZVxuaXMgb25seSBhIHNpbmdsZSBzZXRJbnRlcnZhbCB1c2VkIGZvciBhbGwgZWxlbWVudHMuIFRvIHVzZTpcblxuYGBganNcbm1vZHVsZS5leHBvcnRzID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXG4gIG1peGluczogW3JlcXVpcmUoJy4uLy4uL21peGlucy9yZXNpemUnKV0sXG5cbiAgb25SZXNpemU6IGZ1bmN0aW9uICgpIHtcbiAgICBjb25zb2xlLmxvZygncmVzaXplZCEnKTtcbiAgfSxcblxuICBjb21wb25lbnREaWRNb3VudDogZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuc2V0T25SZXNpemUoJ215VGV4dCcsIHRoaXMub25SZXNpemUpO1xuICB9LFxuXG4gIG9uQ2hhbmdlOiBmdW5jdGlvbiAoKSB7XG4gICAgLi4uXG4gIH0sXG5cbiAgcmVuZGVyOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIFJlYWN0LkRPTS50ZXh0YXJlYSh7cmVmOiAnbXlUZXh0JywgdmFsdWU6IHRoaXMucHJvcHMudmFsdWUsIG9uQ2hhbmdlOiAuLi59KVxuICB9XG59KTtcbmBgYFxuKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgaWQgPSAwO1xuXG52YXIgcmVzaXplSW50ZXJ2YWxFbGVtZW50cyA9IHt9O1xudmFyIHJlc2l6ZUludGVydmFsRWxlbWVudHNDb3VudCA9IDA7XG52YXIgcmVzaXplSW50ZXJ2YWxUaW1lciA9IG51bGw7XG5cbnZhciBjaGVja0VsZW1lbnRzID0gZnVuY3Rpb24gKCkge1xuICBPYmplY3Qua2V5cyhyZXNpemVJbnRlcnZhbEVsZW1lbnRzKS5mb3JFYWNoKGZ1bmN0aW9uIChrZXkpIHtcbiAgICB2YXIgZWxlbWVudCA9IHJlc2l6ZUludGVydmFsRWxlbWVudHNba2V5XTtcbiAgICBpZiAoZWxlbWVudC5jbGllbnRXaWR0aCAhPT0gZWxlbWVudC5fX3ByZXZDbGllbnRXaWR0aCB8fCBlbGVtZW50LmNsaWVudEhlaWdodCAhPT0gZWxlbWVudC5fX3ByZXZDbGllbnRIZWlnaHQpIHtcbiAgICAgIGVsZW1lbnQuX19wcmV2Q2xpZW50V2lkdGggPSBlbGVtZW50LmNsaWVudFdpZHRoO1xuICAgICAgZWxlbWVudC5fX3ByZXZDbGllbnRIZWlnaHQgPSBlbGVtZW50LmNsaWVudEhlaWdodDtcbiAgICAgIHZhciBoYW5kbGVycyA9IGVsZW1lbnQuX19yZXNpemVIYW5kbGVycztcbiAgICAgIGhhbmRsZXJzLmZvckVhY2goZnVuY3Rpb24gKGhhbmRsZXIpIHtcbiAgICAgICAgaGFuZGxlcigpO1xuICAgICAgfSk7XG4gICAgfVxuICB9LCAxMDApO1xufTtcblxudmFyIGFkZFJlc2l6ZUludGVydmFsSGFuZGxlciA9IGZ1bmN0aW9uIChlbGVtZW50LCBmbikge1xuICBpZiAocmVzaXplSW50ZXJ2YWxUaW1lciA9PT0gbnVsbCkge1xuICAgIHJlc2l6ZUludGVydmFsVGltZXIgPSBzZXRJbnRlcnZhbChjaGVja0VsZW1lbnRzLCAxMDApO1xuICB9XG4gIGlmICghKCdfX3Jlc2l6ZUlkJyBpbiBlbGVtZW50KSkge1xuICAgIGlkKys7XG4gICAgZWxlbWVudC5fX3ByZXZDbGllbnRXaWR0aCA9IGVsZW1lbnQuY2xpZW50V2lkdGg7XG4gICAgZWxlbWVudC5fX3ByZXZDbGllbnRIZWlnaHQgPSBlbGVtZW50LmNsaWVudEhlaWdodDtcbiAgICBlbGVtZW50Ll9fcmVzaXplSWQgPSBpZDtcbiAgICByZXNpemVJbnRlcnZhbEVsZW1lbnRzQ291bnQrKztcbiAgICByZXNpemVJbnRlcnZhbEVsZW1lbnRzW2lkXSA9IGVsZW1lbnQ7XG4gICAgZWxlbWVudC5fX3Jlc2l6ZUhhbmRsZXJzID0gW107XG4gIH1cbiAgZWxlbWVudC5fX3Jlc2l6ZUhhbmRsZXJzLnB1c2goZm4pO1xufTtcblxudmFyIHJlbW92ZVJlc2l6ZUludGVydmFsSGFuZGxlcnMgPSBmdW5jdGlvbiAoZWxlbWVudCkge1xuICBpZiAoISgnX19yZXNpemVJZCcgaW4gZWxlbWVudCkpIHtcbiAgICByZXR1cm47XG4gIH1cbiAgdmFyIHJlc2l6ZUlkID0gZWxlbWVudC5fX3Jlc2l6ZUlkO1xuICBkZWxldGUgZWxlbWVudC5fX3Jlc2l6ZUlkO1xuICBkZWxldGUgZWxlbWVudC5fX3Jlc2l6ZUhhbmRsZXJzO1xuICBkZWxldGUgcmVzaXplSW50ZXJ2YWxFbGVtZW50c1tyZXNpemVJZF07XG4gIHJlc2l6ZUludGVydmFsRWxlbWVudHNDb3VudC0tO1xuICBpZiAocmVzaXplSW50ZXJ2YWxFbGVtZW50c0NvdW50IDwgMSkge1xuICAgIGNsZWFySW50ZXJ2YWwocmVzaXplSW50ZXJ2YWxUaW1lcik7XG4gICAgcmVzaXplSW50ZXJ2YWxUaW1lciA9IG51bGw7XG4gIH1cbn07XG5cbnZhciBvblJlc2l6ZSA9IGZ1bmN0aW9uIChyZWYsIGZuKSB7XG4gIGZuKHJlZik7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcblxuICBjb21wb25lbnREaWRNb3VudDogZnVuY3Rpb24gKCkge1xuICAgIGlmICh0aGlzLm9uUmVzaXplV2luZG93KSB7XG4gICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigncmVzaXplJywgdGhpcy5vblJlc2l6ZVdpbmRvdyk7XG4gICAgfVxuICAgIHRoaXMucmVzaXplRWxlbWVudFJlZnMgPSB7fTtcbiAgfSxcblxuICBjb21wb25lbnRXaWxsVW5tb3VudDogZnVuY3Rpb24gKCkge1xuICAgIGlmICh0aGlzLm9uUmVzaXplV2luZG93KSB7XG4gICAgICB3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lcigncmVzaXplJywgdGhpcy5vblJlc2l6ZVdpbmRvdyk7XG4gICAgfVxuICAgIE9iamVjdC5rZXlzKHRoaXMucmVzaXplRWxlbWVudFJlZnMpLmZvckVhY2goZnVuY3Rpb24gKHJlZikge1xuICAgICAgcmVtb3ZlUmVzaXplSW50ZXJ2YWxIYW5kbGVycyh0aGlzLnJlZnNbcmVmXS5nZXRET01Ob2RlKCkpO1xuICAgIH0uYmluZCh0aGlzKSk7XG4gIH0sXG5cbiAgc2V0T25SZXNpemU6IGZ1bmN0aW9uIChyZWYsIGZuKSB7XG4gICAgaWYgKCF0aGlzLnJlc2l6ZUVsZW1lbnRSZWZzW3JlZl0pIHtcbiAgICAgIHRoaXMucmVzaXplRWxlbWVudFJlZnNbcmVmXSA9IHRydWU7XG4gICAgfVxuICAgIGFkZFJlc2l6ZUludGVydmFsSGFuZGxlcih0aGlzLnJlZnNbcmVmXS5nZXRET01Ob2RlKCksIG9uUmVzaXplLmJpbmQodGhpcywgcmVmLCBmbikpO1xuICB9XG59O1xuIiwiLy8gIyBzY3JvbGwgbWl4aW5cblxuLypcbkN1cnJlbnRseSB1bnVzZWQuXG4qL1xuXG4ndXNlIHN0cmljdCc7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKHBsdWdpbikge1xuXG4gIHBsdWdpbi5leHBvcnRzID0ge1xuXG4gICAgY29tcG9uZW50RGlkTW91bnQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgIGlmICh0aGlzLm9uU2Nyb2xsV2luZG93KSB7XG4gICAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdzY3JvbGwnLCB0aGlzLm9uU2Nyb2xsV2luZG93KTtcbiAgICAgIH1cbiAgICB9LFxuXG4gICAgY29tcG9uZW50V2lsbFVubW91bnQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgIGlmICh0aGlzLm9uU2Nyb2xsV2luZG93KSB7XG4gICAgICAgIHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKCdzY3JvbGwnLCB0aGlzLm9uU2Nyb2xsV2luZG93KTtcbiAgICAgIH1cbiAgICB9XG4gIH07XG59O1xuIiwiLy8gIyB1bmRvLXN0YWNrIG1peGluXG5cbi8qXG5HaXZlcyB5b3VyIGNvbXBvbmVudCBhbiB1bmRvIHN0YWNrLlxuKi9cblxuLy8gaHR0cDovL3Byb21ldGhldXNyZXNlYXJjaC5naXRodWIuaW8vcmVhY3QtZm9ybXMvZXhhbXBsZXMvdW5kby5odG1sXG5cbid1c2Ugc3RyaWN0JztcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIGdldEluaXRpYWxTdGF0ZTogZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHt1bmRvOiBbXSwgcmVkbzogW119O1xuICB9LFxuXG4gIHNuYXBzaG90OiBmdW5jdGlvbigpIHtcbiAgICB2YXIgdW5kbyA9IHRoaXMuc3RhdGUudW5kby5jb25jYXQodGhpcy5nZXRTdGF0ZVNuYXBzaG90KCkpO1xuICAgIGlmICh0eXBlb2YgdGhpcy5zdGF0ZS51bmRvRGVwdGggPT09ICdudW1iZXInKSB7XG4gICAgICBpZiAodW5kby5sZW5ndGggPiB0aGlzLnN0YXRlLnVuZG9EZXB0aCkge1xuICAgICAgICB1bmRvLnNoaWZ0KCk7XG4gICAgICB9XG4gICAgfVxuICAgIHRoaXMuc2V0U3RhdGUoe3VuZG86IHVuZG8sIHJlZG86IFtdfSk7XG4gIH0sXG5cbiAgaGFzVW5kbzogZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHRoaXMuc3RhdGUudW5kby5sZW5ndGggPiAwO1xuICB9LFxuXG4gIGhhc1JlZG86IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLnN0YXRlLnJlZG8ubGVuZ3RoID4gMDtcbiAgfSxcblxuICByZWRvOiBmdW5jdGlvbigpIHtcbiAgICB0aGlzLl91bmRvSW1wbCh0cnVlKTtcbiAgfSxcblxuICB1bmRvOiBmdW5jdGlvbigpIHtcbiAgICB0aGlzLl91bmRvSW1wbCgpO1xuICB9LFxuXG4gIF91bmRvSW1wbDogZnVuY3Rpb24oaXNSZWRvKSB7XG4gICAgdmFyIHVuZG8gPSB0aGlzLnN0YXRlLnVuZG8uc2xpY2UoMCk7XG4gICAgdmFyIHJlZG8gPSB0aGlzLnN0YXRlLnJlZG8uc2xpY2UoMCk7XG4gICAgdmFyIHNuYXBzaG90O1xuXG4gICAgaWYgKGlzUmVkbykge1xuICAgICAgaWYgKHJlZG8ubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIHNuYXBzaG90ID0gcmVkby5wb3AoKTtcbiAgICAgIHVuZG8ucHVzaCh0aGlzLmdldFN0YXRlU25hcHNob3QoKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmICh1bmRvLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBzbmFwc2hvdCA9IHVuZG8ucG9wKCk7XG4gICAgICByZWRvLnB1c2godGhpcy5nZXRTdGF0ZVNuYXBzaG90KCkpO1xuICAgIH1cblxuICAgIHRoaXMuc2V0U3RhdGVTbmFwc2hvdChzbmFwc2hvdCk7XG4gICAgdGhpcy5zZXRTdGF0ZSh7dW5kbzogdW5kbywgcmVkbzogcmVkb30pO1xuICB9XG59O1xuIiwiLy8gIyBib290c3RyYXAgcGx1Z2luXG5cbi8qXG5UaGUgYm9vdHN0cmFwIHBsdWdpbiBzbmVha3MgaW4gc29tZSBjbGFzc2VzIHRvIGVsZW1lbnRzIHNvIHRoYXQgaXQgcGxheXMgd2VsbFxud2l0aCBUd2l0dGVyIEJvb3RzdHJhcC5cbiovXG5cbid1c2Ugc3RyaWN0JztcblxudmFyIF8gPSByZXF1aXJlKCcuLi91bmRhc2gnKTtcblxuLy8gRGVjbGFyZSBzb21lIGNsYXNzZXMgYW5kIGxhYmVscyBmb3IgZWFjaCBlbGVtZW50LlxudmFyIG1vZGlmaWVycyA9IHtcblxuICAnRmllbGQnOiB7Y2xhc3Nlczogeydmb3JtLWdyb3VwJzogdHJ1ZX19LFxuICAnSGVscCc6IHtjbGFzc2VzOiB7J2hlbHAtYmxvY2snOiB0cnVlfX0sXG4gICdTYW1wbGUnOiB7Y2xhc3NlczogeydoZWxwLWJsb2NrJzogdHJ1ZX19LFxuICAnQXJyYXlDb250cm9sJzoge2NsYXNzZXM6IHsnZm9ybS1pbmxpbmUnOiB0cnVlfX0sXG4gICdBcnJheUl0ZW0nOiB7Y2xhc3Nlczogeyd3ZWxsJzogdHJ1ZX19LFxuICAnT2JqZWN0SXRlbSc6IHtjbGFzc2VzOiB7J3dlbGwnOiB0cnVlfX0sXG4gICdGaWVsZFRlbXBsYXRlQ2hvaWNlcyc6IHtjbGFzc2VzOiB7J2Zvcm0tY29udHJvbCc6IHRydWV9fSxcbiAgJ0FkZEl0ZW0nOiB7Y2xhc3NlczogeydnbHlwaGljb24gZ2x5cGhpY29uLXBsdXMnOiB0cnVlfSwgbGFiZWw6ICcnfSxcbiAgJ1JlbW92ZUl0ZW0nOiB7Y2xhc3NlczogeydnbHlwaGljb24gZ2x5cGhpY29uLXJlbW92ZSc6IHRydWV9LCBsYWJlbDogJyd9LFxuICAnTW92ZUl0ZW1CYWNrJzoge2NsYXNzZXM6IHsnZ2x5cGhpY29uIGdseXBoaWNvbi1hcnJvdy11cCc6IHRydWV9LCBsYWJlbDogJyd9LFxuICAnTW92ZUl0ZW1Gb3J3YXJkJzoge2NsYXNzZXM6IHsnZ2x5cGhpY29uIGdseXBoaWNvbi1hcnJvdy1kb3duJzogdHJ1ZX0sIGxhYmVsOiAnJ30sXG4gICdPYmplY3RJdGVtS2V5Jzoge2NsYXNzZXM6IHsnZm9ybS1jb250cm9sJzogdHJ1ZX19LFxuXG4gICdTaW5nbGVMaW5lU3RyaW5nJzoge2NsYXNzZXM6IHsnZm9ybS1jb250cm9sJzogdHJ1ZX19LFxuICAnU3RyaW5nJzoge2NsYXNzZXM6IHsnZm9ybS1jb250cm9sJzogdHJ1ZX19LFxuICAnUHJldHR5VGV4dCc6IHtjbGFzc2VzOiB7J2Zvcm0tY29udHJvbCc6IHRydWV9fSxcbiAgJ0pzb24nOiB7Y2xhc3Nlczogeydmb3JtLWNvbnRyb2wnOiB0cnVlfX0sXG4gICdTZWxlY3RWYWx1ZSc6IHtjbGFzc2VzOiB7J2Zvcm0tY29udHJvbCc6IHRydWV9fVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoY29uZmlnKSB7XG5cbiAgdmFyIGNyZWF0ZUVsZW1lbnQgPSBjb25maWcuY3JlYXRlRWxlbWVudDtcblxuICByZXR1cm4ge1xuICAgIGNyZWF0ZUVsZW1lbnQ6IGZ1bmN0aW9uIChuYW1lLCBwcm9wcywgY2hpbGRyZW4pIHtcblxuICAgICAgbmFtZSA9IGNvbmZpZy5lbGVtZW50TmFtZShuYW1lKTtcblxuICAgICAgdmFyIG1vZGlmaWVyID0gbW9kaWZpZXJzW25hbWVdO1xuXG4gICAgICBpZiAobW9kaWZpZXIpIHtcbiAgICAgICAgLy8gSWYgdGhlcmUgaXMgYSBtb2RpZmllciBmb3IgdGhpcyBlbGVtZW50LCBhZGQgdGhlIGNsYXNzZXMgYW5kIGxhYmVsLlxuICAgICAgICBwcm9wcyA9IF8uZXh0ZW5kKHt9LCBwcm9wcyk7XG4gICAgICAgIHByb3BzLmNsYXNzZXMgPSBfLmV4dGVuZCh7fSwgcHJvcHMuY2xhc3NlcywgbW9kaWZpZXIuY2xhc3Nlcyk7XG4gICAgICAgIGlmICgnbGFiZWwnIGluIG1vZGlmaWVyKSB7XG4gICAgICAgICAgcHJvcHMubGFiZWwgPSBtb2RpZmllci5sYWJlbDtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICByZXR1cm4gY3JlYXRlRWxlbWVudChuYW1lLCBwcm9wcywgY2hpbGRyZW4pO1xuICAgIH1cbiAgfTtcbn07XG4iLCIvLyAjIGVsZW1lbnQtY2xhc3NlcyBwbHVnaW5cblxuLypcblRoaXMgcGx1Z2lucyBwcm92aWRlcyBhIGNvbmZpZyBtZXRob2QgYWRkRWxlbWVudENsYXNzIHRoYXQgbGV0cyB5b3UgYWRkIG9uIGFcbmNsYXNzIHRvIGFuIGVsZW1lbnQuXG4qL1xuXG4ndXNlIHN0cmljdCc7XG5cbnZhciBfID0gcmVxdWlyZSgnLi4vdW5kYXNoJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKGNvbmZpZykge1xuXG4gIHZhciBjcmVhdGVFbGVtZW50ID0gY29uZmlnLmNyZWF0ZUVsZW1lbnQ7XG5cbiAgdmFyIGVsZW1lbnRDbGFzc2VzID0ge307XG5cbiAgcmV0dXJuIHtcbiAgICBhZGRFbGVtZW50Q2xhc3M6IGZ1bmN0aW9uIChuYW1lLCBjbGFzc05hbWUpIHtcblxuICAgICAgbmFtZSA9IGNvbmZpZy5lbGVtZW50TmFtZShuYW1lKTtcblxuICAgICAgaWYgKCFlbGVtZW50Q2xhc3Nlc1tuYW1lXSkge1xuICAgICAgICBlbGVtZW50Q2xhc3Nlc1tuYW1lXSA9IHt9O1xuICAgICAgfVxuXG4gICAgICBlbGVtZW50Q2xhc3Nlc1tuYW1lXVtjbGFzc05hbWVdID0gdHJ1ZTtcbiAgICB9LFxuXG4gICAgLy8gV3JhcCB0aGUgY3JlYXRlRWxlbWVudCBtZXRob2QuXG4gICAgY3JlYXRlRWxlbWVudDogZnVuY3Rpb24gKG5hbWUsIHByb3BzLCBjaGlsZHJlbikge1xuXG4gICAgICBuYW1lID0gY29uZmlnLmVsZW1lbnROYW1lKG5hbWUpO1xuXG4gICAgICBpZiAoZWxlbWVudENsYXNzZXNbbmFtZV0pIHtcbiAgICAgICAgcHJvcHMgPSBfLmV4dGVuZCh7fSwgcHJvcHMsIHtjbGFzc2VzOiBlbGVtZW50Q2xhc3Nlc1tuYW1lXX0pO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gY3JlYXRlRWxlbWVudChuYW1lLCBwcm9wcywgY2hpbGRyZW4pO1xuICAgIH1cbiAgfTtcbn07XG4iLCIvLyAjIG1ldGEgcGx1Z2luXG5cbi8qXG5UaGUgbWV0YSBwbHVnaW4gbGV0cyB5b3UgcGFzcyBpbiBhIG1ldGEgcHJvcCB0byBmb3JtYXRpYy4gVGhlIHByb3AgdGhlbiBnZXRzXG5wYXNzZWQgdGhyb3VnaCBhcyBhIHByb3BlcnR5IGZvciBldmVyeSBmaWVsZC4gWW91IGNhbiB0aGVuIHdyYXAgYGluaXRGaWVsZGAgdG9cbmdldCB5b3VyIG1ldGEgdmFsdWVzLlxuKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChjb25maWcpIHtcblxuICB2YXIgaW5pdFJvb3RGaWVsZCA9IGNvbmZpZy5pbml0Um9vdEZpZWxkO1xuICB2YXIgaW5pdEZpZWxkID0gY29uZmlnLmluaXRGaWVsZDtcblxuICByZXR1cm4ge1xuICAgIGluaXRSb290RmllbGQ6IGZ1bmN0aW9uIChmaWVsZCwgcHJvcHMpIHtcblxuICAgICAgZmllbGQubWV0YSA9IHByb3BzLm1ldGEgfHwge307XG5cbiAgICAgIGluaXRSb290RmllbGQoZmllbGQsIHByb3BzKTtcbiAgICB9LFxuXG4gICAgaW5pdEZpZWxkOiBmdW5jdGlvbiAoZmllbGQpIHtcblxuICAgICAgaWYgKGZpZWxkLnBhcmVudCAmJiBmaWVsZC5wYXJlbnQubWV0YSkge1xuICAgICAgICBmaWVsZC5tZXRhID0gZmllbGQucGFyZW50Lm1ldGE7XG4gICAgICB9XG5cbiAgICAgIGluaXRGaWVsZChmaWVsZCk7XG4gICAgfVxuICB9O1xufTtcbiIsIi8vICMgcmVmZXJlbmNlIHBsdWdpblxuXG4vKlxuVGhpcyBwbHVnaW4gYWxsb3dzIGZpZWxkcyB0byBiZSBzdHJpbmdzIGFuZCByZWZlcmVuY2Ugb3RoZXIgZmllbGRzIGJ5IGtleSBvclxuaWQuIEl0IGFsc28gYWxsb3dzIGEgZmllbGQgdG8gZXh0ZW5kIGFub3RoZXIgZmllbGQgd2l0aFxuZXh0ZW5kczogWydmb28nLCAnYmFyJ10gd2hlcmUgJ2ZvbycgYW5kICdiYXInIHJlZmVyIHRvIG90aGVyIGtleXMgb3IgaWRzLlxuKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgXyA9IHJlcXVpcmUoJy4uL3VuZGFzaCcpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChjb25maWcpIHtcblxuICB2YXIgaW5pdEZpZWxkID0gY29uZmlnLmluaXRGaWVsZDtcblxuICByZXR1cm4ge1xuICAgIC8vIExvb2sgZm9yIGEgdGVtcGxhdGUgaW4gdGhpcyBmaWVsZCBvciBhbnkgb2YgaXRzIHBhcmVudHMuXG4gICAgZmluZEZpZWxkVGVtcGxhdGU6IGZ1bmN0aW9uIChmaWVsZCwgbmFtZSkge1xuXG4gICAgICBpZiAoZmllbGQudGVtcGxhdGVzW25hbWVdKSB7XG4gICAgICAgIHJldHVybiBmaWVsZC50ZW1wbGF0ZXNbbmFtZV07XG4gICAgICB9XG5cbiAgICAgIGlmIChmaWVsZC5wYXJlbnQpIHtcbiAgICAgICAgcmV0dXJuIGNvbmZpZy5maW5kRmllbGRUZW1wbGF0ZShmaWVsZC5wYXJlbnQsIG5hbWUpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9LFxuXG4gICAgLy8gSW5oZXJpdCBmcm9tIGFueSBmaWVsZCB0ZW1wbGF0ZXMgdGhhdCB0aGlzIGZpZWxkIHRlbXBsYXRlXG4gICAgLy8gZXh0ZW5kcy5cbiAgICByZXNvbHZlRmllbGRUZW1wbGF0ZTogZnVuY3Rpb24gKGZpZWxkLCBmaWVsZFRlbXBsYXRlKSB7XG5cbiAgICAgIGlmICghZmllbGRUZW1wbGF0ZS5leHRlbmRzKSB7XG4gICAgICAgIHJldHVybiBmaWVsZFRlbXBsYXRlO1xuICAgICAgfVxuXG4gICAgICB2YXIgZXh0ID0gZmllbGRUZW1wbGF0ZS5leHRlbmRzO1xuXG4gICAgICBpZiAoIV8uaXNBcnJheShleHQpKSB7XG4gICAgICAgIGV4dCA9IFtleHRdO1xuICAgICAgfVxuXG4gICAgICB2YXIgYmFzZXMgPSBleHQubWFwKGZ1bmN0aW9uIChiYXNlKSB7XG4gICAgICAgIHZhciB0ZW1wbGF0ZSA9IGNvbmZpZy5maW5kRmllbGRUZW1wbGF0ZShmaWVsZCwgYmFzZSk7XG4gICAgICAgIGlmICghdGVtcGxhdGUpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1RlbXBsYXRlICcgKyBiYXNlICsgJyBub3QgZm91bmQuJyk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRlbXBsYXRlO1xuICAgICAgfSk7XG5cbiAgICAgIHZhciBjaGFpbiA9IFt7fV0uY29uY2F0KGJhc2VzLnJldmVyc2UoKS5jb25jYXQoW2ZpZWxkVGVtcGxhdGVdKSk7XG4gICAgICBmaWVsZFRlbXBsYXRlID0gXy5leHRlbmQuYXBwbHkoXywgY2hhaW4pO1xuXG4gICAgICByZXR1cm4gZmllbGRUZW1wbGF0ZTtcbiAgICB9LFxuXG4gICAgLy8gV3JhcCB0aGUgaW5pdEZpZWxkIG1ldGhvZC5cbiAgICBpbml0RmllbGQ6IGZ1bmN0aW9uIChmaWVsZCkge1xuXG4gICAgICB2YXIgdGVtcGxhdGVzID0gZmllbGQudGVtcGxhdGVzID0ge307XG5cbiAgICAgIHZhciBjaGlsZEZpZWxkVGVtcGxhdGVzID0gY29uZmlnLmZpZWxkQ2hpbGRGaWVsZFRlbXBsYXRlcyhmaWVsZCk7XG5cbiAgICAgIC8vIEFkZCBlYWNoIG9mIHRoZSBjaGlsZCBmaWVsZCB0ZW1wbGF0ZXMgdG8gb3VyIHRlbXBsYXRlIG1hcC5cbiAgICAgIGNoaWxkRmllbGRUZW1wbGF0ZXMuZm9yRWFjaChmdW5jdGlvbiAoZmllbGRUZW1wbGF0ZSkge1xuXG4gICAgICAgIGlmIChfLmlzU3RyaW5nKGZpZWxkVGVtcGxhdGUpKSB7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGtleSA9IGZpZWxkVGVtcGxhdGUua2V5O1xuICAgICAgICB2YXIgaWQgPSBmaWVsZFRlbXBsYXRlLmlkO1xuXG4gICAgICAgIGlmIChmaWVsZFRlbXBsYXRlLnRlbXBsYXRlKSB7XG4gICAgICAgICAgZmllbGRUZW1wbGF0ZSA9IF8uZXh0ZW5kKHt9LCBmaWVsZFRlbXBsYXRlLCB7dGVtcGxhdGU6IGZhbHNlfSk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIV8uaXNVbmRlZmluZWQoa2V5KSAmJiBrZXkgIT09ICcnKSB7XG4gICAgICAgICAgdGVtcGxhdGVzW2tleV0gPSBmaWVsZFRlbXBsYXRlO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCFfLmlzVW5kZWZpbmVkKGlkKSAmJiBpZCAhPT0gJycpIHtcbiAgICAgICAgICB0ZW1wbGF0ZXNbaWRdID0gZmllbGRUZW1wbGF0ZTtcbiAgICAgICAgfVxuICAgICAgfSk7XG5cbiAgICAgIC8vIFJlc29sdmUgYW55IHJlZmVyZW5jZXMgdG8gb3RoZXIgZmllbGQgdGVtcGxhdGVzLlxuICAgICAgaWYgKGNoaWxkRmllbGRUZW1wbGF0ZXMubGVuZ3RoID4gMCkge1xuICAgICAgICBmaWVsZC5maWVsZHMgPSBjaGlsZEZpZWxkVGVtcGxhdGVzLm1hcChmdW5jdGlvbiAoZmllbGRUZW1wbGF0ZSkge1xuICAgICAgICAgIGlmIChfLmlzU3RyaW5nKGZpZWxkVGVtcGxhdGUpKSB7XG4gICAgICAgICAgICBmaWVsZFRlbXBsYXRlID0gY29uZmlnLmZpbmRGaWVsZFRlbXBsYXRlKGZpZWxkLCBmaWVsZFRlbXBsYXRlKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICByZXR1cm4gY29uZmlnLnJlc29sdmVGaWVsZFRlbXBsYXRlKGZpZWxkLCBmaWVsZFRlbXBsYXRlKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgZmllbGQuZmllbGRzID0gZmllbGQuZmllbGRzLmZpbHRlcihmdW5jdGlvbiAoZmllbGRUZW1wbGF0ZSkge1xuICAgICAgICAgIHJldHVybiAhZmllbGRUZW1wbGF0ZS50ZW1wbGF0ZTtcbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIHZhciBpdGVtRmllbGRUZW1wbGF0ZXMgPSBjb25maWcuZmllbGRJdGVtRmllbGRUZW1wbGF0ZXMoZmllbGQpO1xuXG4gICAgICAvLyBSZXNvbHZlIGFueSBvZiBvdXIgaXRlbSBmaWVsZCB0ZW1wbGF0ZXMuIChGaWVsZCB0ZW1wbGF0ZXMgZm9yIGR5bmFtaWNcbiAgICAgIC8vIGNoaWxkIGZpZWxkcy4pXG4gICAgICBpZiAoaXRlbUZpZWxkVGVtcGxhdGVzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgZmllbGQuaXRlbUZpZWxkcyA9IGl0ZW1GaWVsZFRlbXBsYXRlcy5tYXAoZnVuY3Rpb24gKGl0ZW1GaWVsZFRlbXBsYXRlKSB7XG4gICAgICAgICAgaWYgKF8uaXNTdHJpbmcoaXRlbUZpZWxkVGVtcGxhdGUpKSB7XG4gICAgICAgICAgICBpdGVtRmllbGRUZW1wbGF0ZSA9IGNvbmZpZy5maW5kRmllbGRUZW1wbGF0ZShmaWVsZCwgaXRlbUZpZWxkVGVtcGxhdGUpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHJldHVybiBjb25maWcucmVzb2x2ZUZpZWxkVGVtcGxhdGUoZmllbGQsIGl0ZW1GaWVsZFRlbXBsYXRlKTtcbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIGluaXRGaWVsZChmaWVsZCk7XG4gICAgfVxuICB9O1xuXG59O1xuIiwidmFyIF8gPSB7fTtcblxuXy5hc3NpZ24gPSBfLmV4dGVuZCA9IHJlcXVpcmUoJ29iamVjdC1hc3NpZ24nKTtcbl8uaXNFcXVhbCA9IHJlcXVpcmUoJ2RlZXAtZXF1YWwnKTtcblxuLy8gVGhlc2UgYXJlIG5vdCBuZWNlc3NhcmlseSBjb21wbGV0ZSBpbXBsZW1lbnRhdGlvbnMuIFRoZXkncmUganVzdCBlbm91Z2ggZm9yXG4vLyB3aGF0J3MgdXNlZCBpbiBmb3JtYXRpYy5cblxuXy5mbGF0dGVuID0gKGFycmF5cykgPT4gW10uY29uY2F0LmFwcGx5KFtdLCBhcnJheXMpO1xuXG5fLmlzU3RyaW5nID0gdmFsdWUgPT4gdHlwZW9mIHZhbHVlID09PSAnc3RyaW5nJztcbl8uaXNVbmRlZmluZWQgPSB2YWx1ZSA9PiB0eXBlb2YgdmFsdWUgPT09ICd1bmRlZmluZWQnO1xuXy5pc09iamVjdCA9IHZhbHVlID0+IHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCc7XG5fLmlzQXJyYXkgPSB2YWx1ZSA9PiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFsdWUpID09PSAnW29iamVjdCBBcnJheV0nO1xuXy5pc051bWJlciA9IHZhbHVlID0+IHR5cGVvZiB2YWx1ZSA9PT0gJ251bWJlcic7XG5fLmlzQm9vbGVhbiA9IHZhbHVlID0+IHR5cGVvZiB2YWx1ZSA9PT0gJ2Jvb2xlYW4nO1xuXy5pc051bGwgPSB2YWx1ZSA9PiB2YWx1ZSA9PT0gbnVsbDtcbl8uaXNGdW5jdGlvbiA9IHZhbHVlID0+IHR5cGVvZiB2YWx1ZSA9PT0gJ2Z1bmN0aW9uJztcblxuXy5jbG9uZSA9IHZhbHVlID0+IHtcbiAgaWYgKCFfLmlzT2JqZWN0KHZhbHVlKSkge1xuICAgIHJldHVybiB2YWx1ZTtcbiAgfVxuICByZXR1cm4gXy5pc0FycmF5KHZhbHVlKSA/IHZhbHVlLnNsaWNlKCkgOiBfLmFzc2lnbih7fSwgdmFsdWUpO1xufTtcblxuXy5maW5kID0gKGl0ZW1zLCB0ZXN0Rm4pID0+IHtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBpdGVtcy5sZW5ndGg7IGkrKykge1xuICAgIGlmICh0ZXN0Rm4oaXRlbXNbaV0pKSB7XG4gICAgICByZXR1cm4gaXRlbXNbaV07XG4gICAgfVxuICB9XG4gIHJldHVybiB2b2lkIDA7XG59O1xuXG5fLmV2ZXJ5ID0gKGl0ZW1zLCB0ZXN0Rm4pID0+IHtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBpdGVtcy5sZW5ndGg7IGkrKykge1xuICAgIGlmICghdGVzdEZuKGl0ZW1zW2ldKSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfVxuICByZXR1cm4gdHJ1ZTtcbn07XG5cbl8uZWFjaCA9IChvYmosIGl0ZXJhdGVGbikgPT4ge1xuICBPYmplY3Qua2V5cyhvYmopLmZvckVhY2goa2V5ID0+IHtcbiAgICBpdGVyYXRlRm4ob2JqW2tleV0sIGtleSk7XG4gIH0pO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBfO1xuIiwiLy8gIyB1dGlsc1xuXG4vKlxuSnVzdCBzb21lIHNoYXJlZCB1dGlsaXR5IGZ1bmN0aW9ucy5cbiovXG5cbid1c2Ugc3RyaWN0JztcblxudmFyIF8gPSByZXF1aXJlKCcuL3VuZGFzaCcpO1xuXG52YXIgdXRpbHMgPSBleHBvcnRzO1xuXG4vLyBDb3B5IG9iaiByZWN1cnNpbmcgZGVlcGx5LlxudXRpbHMuZGVlcENvcHkgPSBmdW5jdGlvbiAob2JqKSB7XG4gIGlmIChfLmlzQXJyYXkob2JqKSkge1xuICAgIHJldHVybiBvYmoubWFwKGZ1bmN0aW9uIChpdGVtKSB7XG4gICAgICByZXR1cm4gdXRpbHMuZGVlcENvcHkoaXRlbSk7XG4gICAgfSk7XG4gIH0gZWxzZSBpZiAoXy5pc0Z1bmN0aW9uKG9iaikpIHtcbiAgICByZXR1cm4gb2JqO1xuICB9IGVsc2UgaWYgKF8uaXNOdWxsKG9iaikpIHtcbiAgICByZXR1cm4gb2JqO1xuICB9IGVsc2UgaWYgKF8uaXNPYmplY3Qob2JqKSkge1xuICAgIHZhciBjb3B5ID0ge307XG4gICAgXy5lYWNoKG9iaiwgZnVuY3Rpb24gKHZhbHVlLCBrZXkpIHtcbiAgICAgIGNvcHlba2V5XSA9IHV0aWxzLmRlZXBDb3B5KHZhbHVlKTtcbiAgICB9KTtcbiAgICByZXR1cm4gY29weTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gb2JqO1xuICB9XG59O1xuXG4vLyBDYWNoZSBmb3Igc3RyaW5ncyBjb252ZXJ0ZWQgdG8gUGFzY2FsIENhc2UuIFRoaXMgc2hvdWxkIGJlIGEgZmluaXRlIGxpc3QsIHNvXG4vLyBub3QgbXVjaCBmZWFyIHRoYXQgd2Ugd2lsbCBydW4gb3V0IG9mIG1lbW9yeS5cbnZhciBkYXNoVG9QYXNjYWxDYWNoZSA9IHt9O1xuXG4vLyBDb252ZXJ0IGZvby1iYXIgdG8gRm9vQmFyLlxudXRpbHMuZGFzaFRvUGFzY2FsID0gZnVuY3Rpb24gKHMpIHtcbiAgaWYgKHMgPT09ICcnKSB7XG4gICAgcmV0dXJuICcnO1xuICB9XG4gIGlmICghZGFzaFRvUGFzY2FsQ2FjaGVbc10pIHtcbiAgICBkYXNoVG9QYXNjYWxDYWNoZVtzXSA9IHMuc3BsaXQoJy0nKS5tYXAoZnVuY3Rpb24gKHBhcnQpIHtcbiAgICAgIHJldHVybiBwYXJ0WzBdLnRvVXBwZXJDYXNlKCkgKyBwYXJ0LnN1YnN0cmluZygxKTtcbiAgICB9KS5qb2luKCcnKTtcbiAgfVxuICByZXR1cm4gZGFzaFRvUGFzY2FsQ2FjaGVbc107XG59O1xuXG4vLyBDb3B5IGFsbCBjb21wdXRlZCBzdHlsZXMgZnJvbSBvbmUgRE9NIGVsZW1lbnQgdG8gYW5vdGhlci5cbnV0aWxzLmNvcHlFbGVtZW50U3R5bGUgPSBmdW5jdGlvbiAoZnJvbUVsZW1lbnQsIHRvRWxlbWVudCkge1xuICB2YXIgZnJvbVN0eWxlID0gd2luZG93LmdldENvbXB1dGVkU3R5bGUoZnJvbUVsZW1lbnQsICcnKTtcblxuICBpZiAoZnJvbVN0eWxlLmNzc1RleHQgIT09ICcnKSB7XG4gICAgdG9FbGVtZW50LnN0eWxlLmNzc1RleHQgPSBmcm9tU3R5bGUuY3NzVGV4dDtcbiAgICByZXR1cm47XG4gIH1cblxuICB2YXIgY3NzUnVsZXMgPSBbXTtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBmcm9tU3R5bGUubGVuZ3RoOyBpKyspIHtcbiAgICBjc3NSdWxlcy5wdXNoKGZyb21TdHlsZVtpXSArICc6JyArIGZyb21TdHlsZS5nZXRQcm9wZXJ0eVZhbHVlKGZyb21TdHlsZVtpXSkgKyAnOycpO1xuICB9XG4gIHZhciBjc3NUZXh0ID0gY3NzUnVsZXMuam9pbignJyk7XG5cbiAgdG9FbGVtZW50LnN0eWxlLmNzc1RleHQgPSBjc3NUZXh0O1xufTtcblxuLy8gT2JqZWN0IHRvIGhvbGQgYnJvd3NlciBzbmlmZmluZyBpbmZvLlxudmFyIGJyb3dzZXIgPSB7XG4gIGlzQ2hyb21lOiBmYWxzZSxcbiAgaXNNb3ppbGxhOiBmYWxzZSxcbiAgaXNPcGVyYTogZmFsc2UsXG4gIGlzSWU6IGZhbHNlLFxuICBpc1NhZmFyaTogZmFsc2UsXG4gIGlzVW5rbm93bjogZmFsc2Vcbn07XG5cbi8vIFNuaWZmIHRoZSBicm93c2VyLlxudmFyIHVhID0gJyc7XG5cbmlmICh0eXBlb2YgbmF2aWdhdG9yICE9PSAndW5kZWZpbmVkJykge1xuICB1YSA9IG5hdmlnYXRvci51c2VyQWdlbnQ7XG59XG5cbmlmKHVhLmluZGV4T2YoJ0Nocm9tZScpID4gLTEpIHtcbiAgYnJvd3Nlci5pc0Nocm9tZSA9IHRydWU7XG59IGVsc2UgaWYgKHVhLmluZGV4T2YoJ1NhZmFyaScpID4gLTEpIHtcbiAgYnJvd3Nlci5pc1NhZmFyaSA9IHRydWU7XG59IGVsc2UgaWYgKHVhLmluZGV4T2YoJ09wZXJhJykgPiAtMSkge1xuICBicm93c2VyLmlzT3BlcmEgPSB0cnVlO1xufSBlbHNlIGlmICh1YS5pbmRleE9mKCdGaXJlZm94JykgPiAtMSkge1xuICBicm93c2VyLmlzTW96aWxsYSA9IHRydWU7XG59IGVsc2UgaWYgKHVhLmluZGV4T2YoJ01TSUUnKSA+IC0xKSB7XG4gIGJyb3dzZXIuaXNJZSA9IHRydWU7XG59IGVsc2Uge1xuICBicm93c2VyLmlzVW5rbm93biA9IHRydWU7XG59XG5cbi8vIEV4cG9ydCBzbmlmZmVkIGJyb3dzZXIgaW5mby5cbnV0aWxzLmJyb3dzZXIgPSBicm93c2VyO1xuXG4vLyBDcmVhdGUgYSBtZXRob2QgdGhhdCBkZWxlZ2F0ZXMgdG8gYW5vdGhlciBtZXRob2Qgb24gdGhlIHNhbWUgb2JqZWN0LiBUaGVcbi8vIGRlZmF1bHQgY29uZmlndXJhdGlvbiB1c2VzIHRoaXMgZnVuY3Rpb24gdG8gZGVsZWdhdGUgb25lIG1ldGhvZCB0byBhbm90aGVyLlxudXRpbHMuZGVsZWdhdGVUbyA9IGZ1bmN0aW9uIChuYW1lKSB7XG4gIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXNbbmFtZV0uYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgfTtcbn07XG5cbnV0aWxzLmRlbGVnYXRvciA9IGZ1bmN0aW9uIChvYmopIHtcbiAgcmV0dXJuIGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICAgIHJldHVybiBvYmpbbmFtZV0uYXBwbHkob2JqLCBhcmd1bWVudHMpO1xuICAgIH07XG4gIH07XG59O1xuXG51dGlscy5jYXBpdGFsaXplID0gZnVuY3Rpb24ocykge1xuICByZXR1cm4gcy5jaGFyQXQoMCkudG9VcHBlckNhc2UoKSArIHMuc3Vic3RyaW5nKDEpLnRvTG93ZXJDYXNlKCk7XG59O1xuIiwiLyohXG4gIENvcHlyaWdodCAoYykgMjAxNSBKZWQgV2F0c29uLlxuICBMaWNlbnNlZCB1bmRlciB0aGUgTUlUIExpY2Vuc2UgKE1JVCksIHNlZVxuICBodHRwOi8vamVkd2F0c29uLmdpdGh1Yi5pby9jbGFzc25hbWVzXG4qL1xuXG5mdW5jdGlvbiBjbGFzc05hbWVzICgpIHtcblx0J3VzZSBzdHJpY3QnO1xuXG5cdHZhciBjbGFzc2VzID0gJyc7XG5cblx0Zm9yICh2YXIgaSA9IDA7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcblx0XHR2YXIgYXJnID0gYXJndW1lbnRzW2ldO1xuXHRcdGlmICghYXJnKSBjb250aW51ZTtcblxuXHRcdHZhciBhcmdUeXBlID0gdHlwZW9mIGFyZztcblxuXHRcdGlmICgnc3RyaW5nJyA9PT0gYXJnVHlwZSB8fCAnbnVtYmVyJyA9PT0gYXJnVHlwZSkge1xuXHRcdFx0Y2xhc3NlcyArPSAnICcgKyBhcmc7XG5cblx0XHR9IGVsc2UgaWYgKEFycmF5LmlzQXJyYXkoYXJnKSkge1xuXHRcdFx0Y2xhc3NlcyArPSAnICcgKyBjbGFzc05hbWVzLmFwcGx5KG51bGwsIGFyZyk7XG5cblx0XHR9IGVsc2UgaWYgKCdvYmplY3QnID09PSBhcmdUeXBlKSB7XG5cdFx0XHRmb3IgKHZhciBrZXkgaW4gYXJnKSB7XG5cdFx0XHRcdGlmIChhcmcuaGFzT3duUHJvcGVydHkoa2V5KSAmJiBhcmdba2V5XSkge1xuXHRcdFx0XHRcdGNsYXNzZXMgKz0gJyAnICsga2V5O1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cblx0cmV0dXJuIGNsYXNzZXMuc3Vic3RyKDEpO1xufVxuXG4vLyBzYWZlbHkgZXhwb3J0IGNsYXNzTmFtZXMgZm9yIG5vZGUgLyBicm93c2VyaWZ5XG5pZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpIHtcblx0bW9kdWxlLmV4cG9ydHMgPSBjbGFzc05hbWVzO1xufVxuXG4vKiBnbG9iYWwgZGVmaW5lICovXG4vLyBzYWZlbHkgZXhwb3J0IGNsYXNzTmFtZXMgZm9yIFJlcXVpcmVKU1xuaWYgKHR5cGVvZiBkZWZpbmUgIT09ICd1bmRlZmluZWQnICYmIGRlZmluZS5hbWQpIHtcblx0ZGVmaW5lKCdjbGFzc25hbWVzJywgW10sIGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiBjbGFzc05hbWVzO1xuXHR9KTtcbn1cbiIsInZhciBwU2xpY2UgPSBBcnJheS5wcm90b3R5cGUuc2xpY2U7XG52YXIgb2JqZWN0S2V5cyA9IHJlcXVpcmUoJy4vbGliL2tleXMuanMnKTtcbnZhciBpc0FyZ3VtZW50cyA9IHJlcXVpcmUoJy4vbGliL2lzX2FyZ3VtZW50cy5qcycpO1xuXG52YXIgZGVlcEVxdWFsID0gbW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoYWN0dWFsLCBleHBlY3RlZCwgb3B0cykge1xuICBpZiAoIW9wdHMpIG9wdHMgPSB7fTtcbiAgLy8gNy4xLiBBbGwgaWRlbnRpY2FsIHZhbHVlcyBhcmUgZXF1aXZhbGVudCwgYXMgZGV0ZXJtaW5lZCBieSA9PT0uXG4gIGlmIChhY3R1YWwgPT09IGV4cGVjdGVkKSB7XG4gICAgcmV0dXJuIHRydWU7XG5cbiAgfSBlbHNlIGlmIChhY3R1YWwgaW5zdGFuY2VvZiBEYXRlICYmIGV4cGVjdGVkIGluc3RhbmNlb2YgRGF0ZSkge1xuICAgIHJldHVybiBhY3R1YWwuZ2V0VGltZSgpID09PSBleHBlY3RlZC5nZXRUaW1lKCk7XG5cbiAgLy8gNy4zLiBPdGhlciBwYWlycyB0aGF0IGRvIG5vdCBib3RoIHBhc3MgdHlwZW9mIHZhbHVlID09ICdvYmplY3QnLFxuICAvLyBlcXVpdmFsZW5jZSBpcyBkZXRlcm1pbmVkIGJ5ID09LlxuICB9IGVsc2UgaWYgKHR5cGVvZiBhY3R1YWwgIT0gJ29iamVjdCcgJiYgdHlwZW9mIGV4cGVjdGVkICE9ICdvYmplY3QnKSB7XG4gICAgcmV0dXJuIG9wdHMuc3RyaWN0ID8gYWN0dWFsID09PSBleHBlY3RlZCA6IGFjdHVhbCA9PSBleHBlY3RlZDtcblxuICAvLyA3LjQuIEZvciBhbGwgb3RoZXIgT2JqZWN0IHBhaXJzLCBpbmNsdWRpbmcgQXJyYXkgb2JqZWN0cywgZXF1aXZhbGVuY2UgaXNcbiAgLy8gZGV0ZXJtaW5lZCBieSBoYXZpbmcgdGhlIHNhbWUgbnVtYmVyIG9mIG93bmVkIHByb3BlcnRpZXMgKGFzIHZlcmlmaWVkXG4gIC8vIHdpdGggT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKSwgdGhlIHNhbWUgc2V0IG9mIGtleXNcbiAgLy8gKGFsdGhvdWdoIG5vdCBuZWNlc3NhcmlseSB0aGUgc2FtZSBvcmRlciksIGVxdWl2YWxlbnQgdmFsdWVzIGZvciBldmVyeVxuICAvLyBjb3JyZXNwb25kaW5nIGtleSwgYW5kIGFuIGlkZW50aWNhbCAncHJvdG90eXBlJyBwcm9wZXJ0eS4gTm90ZTogdGhpc1xuICAvLyBhY2NvdW50cyBmb3IgYm90aCBuYW1lZCBhbmQgaW5kZXhlZCBwcm9wZXJ0aWVzIG9uIEFycmF5cy5cbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gb2JqRXF1aXYoYWN0dWFsLCBleHBlY3RlZCwgb3B0cyk7XG4gIH1cbn1cblxuZnVuY3Rpb24gaXNVbmRlZmluZWRPck51bGwodmFsdWUpIHtcbiAgcmV0dXJuIHZhbHVlID09PSBudWxsIHx8IHZhbHVlID09PSB1bmRlZmluZWQ7XG59XG5cbmZ1bmN0aW9uIGlzQnVmZmVyICh4KSB7XG4gIGlmICgheCB8fCB0eXBlb2YgeCAhPT0gJ29iamVjdCcgfHwgdHlwZW9mIHgubGVuZ3RoICE9PSAnbnVtYmVyJykgcmV0dXJuIGZhbHNlO1xuICBpZiAodHlwZW9mIHguY29weSAhPT0gJ2Z1bmN0aW9uJyB8fCB0eXBlb2YgeC5zbGljZSAhPT0gJ2Z1bmN0aW9uJykge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICBpZiAoeC5sZW5ndGggPiAwICYmIHR5cGVvZiB4WzBdICE9PSAnbnVtYmVyJykgcmV0dXJuIGZhbHNlO1xuICByZXR1cm4gdHJ1ZTtcbn1cblxuZnVuY3Rpb24gb2JqRXF1aXYoYSwgYiwgb3B0cykge1xuICB2YXIgaSwga2V5O1xuICBpZiAoaXNVbmRlZmluZWRPck51bGwoYSkgfHwgaXNVbmRlZmluZWRPck51bGwoYikpXG4gICAgcmV0dXJuIGZhbHNlO1xuICAvLyBhbiBpZGVudGljYWwgJ3Byb3RvdHlwZScgcHJvcGVydHkuXG4gIGlmIChhLnByb3RvdHlwZSAhPT0gYi5wcm90b3R5cGUpIHJldHVybiBmYWxzZTtcbiAgLy9+fn5JJ3ZlIG1hbmFnZWQgdG8gYnJlYWsgT2JqZWN0LmtleXMgdGhyb3VnaCBzY3Jld3kgYXJndW1lbnRzIHBhc3NpbmcuXG4gIC8vICAgQ29udmVydGluZyB0byBhcnJheSBzb2x2ZXMgdGhlIHByb2JsZW0uXG4gIGlmIChpc0FyZ3VtZW50cyhhKSkge1xuICAgIGlmICghaXNBcmd1bWVudHMoYikpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgYSA9IHBTbGljZS5jYWxsKGEpO1xuICAgIGIgPSBwU2xpY2UuY2FsbChiKTtcbiAgICByZXR1cm4gZGVlcEVxdWFsKGEsIGIsIG9wdHMpO1xuICB9XG4gIGlmIChpc0J1ZmZlcihhKSkge1xuICAgIGlmICghaXNCdWZmZXIoYikpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgaWYgKGEubGVuZ3RoICE9PSBiLmxlbmd0aCkgcmV0dXJuIGZhbHNlO1xuICAgIGZvciAoaSA9IDA7IGkgPCBhLmxlbmd0aDsgaSsrKSB7XG4gICAgICBpZiAoYVtpXSAhPT0gYltpXSkgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuICB0cnkge1xuICAgIHZhciBrYSA9IG9iamVjdEtleXMoYSksXG4gICAgICAgIGtiID0gb2JqZWN0S2V5cyhiKTtcbiAgfSBjYXRjaCAoZSkgey8vaGFwcGVucyB3aGVuIG9uZSBpcyBhIHN0cmluZyBsaXRlcmFsIGFuZCB0aGUgb3RoZXIgaXNuJ3RcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgLy8gaGF2aW5nIHRoZSBzYW1lIG51bWJlciBvZiBvd25lZCBwcm9wZXJ0aWVzIChrZXlzIGluY29ycG9yYXRlc1xuICAvLyBoYXNPd25Qcm9wZXJ0eSlcbiAgaWYgKGthLmxlbmd0aCAhPSBrYi5sZW5ndGgpXG4gICAgcmV0dXJuIGZhbHNlO1xuICAvL3RoZSBzYW1lIHNldCBvZiBrZXlzIChhbHRob3VnaCBub3QgbmVjZXNzYXJpbHkgdGhlIHNhbWUgb3JkZXIpLFxuICBrYS5zb3J0KCk7XG4gIGtiLnNvcnQoKTtcbiAgLy9+fn5jaGVhcCBrZXkgdGVzdFxuICBmb3IgKGkgPSBrYS5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgIGlmIChrYVtpXSAhPSBrYltpXSlcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICAvL2VxdWl2YWxlbnQgdmFsdWVzIGZvciBldmVyeSBjb3JyZXNwb25kaW5nIGtleSwgYW5kXG4gIC8vfn5+cG9zc2libHkgZXhwZW5zaXZlIGRlZXAgdGVzdFxuICBmb3IgKGkgPSBrYS5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgIGtleSA9IGthW2ldO1xuICAgIGlmICghZGVlcEVxdWFsKGFba2V5XSwgYltrZXldLCBvcHRzKSkgcmV0dXJuIGZhbHNlO1xuICB9XG4gIHJldHVybiB0eXBlb2YgYSA9PT0gdHlwZW9mIGI7XG59XG4iLCJ2YXIgc3VwcG9ydHNBcmd1bWVudHNDbGFzcyA9IChmdW5jdGlvbigpe1xuICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKGFyZ3VtZW50cylcbn0pKCkgPT0gJ1tvYmplY3QgQXJndW1lbnRzXSc7XG5cbmV4cG9ydHMgPSBtb2R1bGUuZXhwb3J0cyA9IHN1cHBvcnRzQXJndW1lbnRzQ2xhc3MgPyBzdXBwb3J0ZWQgOiB1bnN1cHBvcnRlZDtcblxuZXhwb3J0cy5zdXBwb3J0ZWQgPSBzdXBwb3J0ZWQ7XG5mdW5jdGlvbiBzdXBwb3J0ZWQob2JqZWN0KSB7XG4gIHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwob2JqZWN0KSA9PSAnW29iamVjdCBBcmd1bWVudHNdJztcbn07XG5cbmV4cG9ydHMudW5zdXBwb3J0ZWQgPSB1bnN1cHBvcnRlZDtcbmZ1bmN0aW9uIHVuc3VwcG9ydGVkKG9iamVjdCl7XG4gIHJldHVybiBvYmplY3QgJiZcbiAgICB0eXBlb2Ygb2JqZWN0ID09ICdvYmplY3QnICYmXG4gICAgdHlwZW9mIG9iamVjdC5sZW5ndGggPT0gJ251bWJlcicgJiZcbiAgICBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqZWN0LCAnY2FsbGVlJykgJiZcbiAgICAhT2JqZWN0LnByb3RvdHlwZS5wcm9wZXJ0eUlzRW51bWVyYWJsZS5jYWxsKG9iamVjdCwgJ2NhbGxlZScpIHx8XG4gICAgZmFsc2U7XG59O1xuIiwiZXhwb3J0cyA9IG1vZHVsZS5leHBvcnRzID0gdHlwZW9mIE9iamVjdC5rZXlzID09PSAnZnVuY3Rpb24nXG4gID8gT2JqZWN0LmtleXMgOiBzaGltO1xuXG5leHBvcnRzLnNoaW0gPSBzaGltO1xuZnVuY3Rpb24gc2hpbSAob2JqKSB7XG4gIHZhciBrZXlzID0gW107XG4gIGZvciAodmFyIGtleSBpbiBvYmopIGtleXMucHVzaChrZXkpO1xuICByZXR1cm4ga2V5cztcbn1cbiIsIid1c2Ugc3RyaWN0JztcblxuZnVuY3Rpb24gVG9PYmplY3QodmFsKSB7XG5cdGlmICh2YWwgPT0gbnVsbCkge1xuXHRcdHRocm93IG5ldyBUeXBlRXJyb3IoJ09iamVjdC5hc3NpZ24gY2Fubm90IGJlIGNhbGxlZCB3aXRoIG51bGwgb3IgdW5kZWZpbmVkJyk7XG5cdH1cblxuXHRyZXR1cm4gT2JqZWN0KHZhbCk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gT2JqZWN0LmFzc2lnbiB8fCBmdW5jdGlvbiAodGFyZ2V0LCBzb3VyY2UpIHtcblx0dmFyIGZyb207XG5cdHZhciBrZXlzO1xuXHR2YXIgdG8gPSBUb09iamVjdCh0YXJnZXQpO1xuXG5cdGZvciAodmFyIHMgPSAxOyBzIDwgYXJndW1lbnRzLmxlbmd0aDsgcysrKSB7XG5cdFx0ZnJvbSA9IGFyZ3VtZW50c1tzXTtcblx0XHRrZXlzID0gT2JqZWN0LmtleXMoT2JqZWN0KGZyb20pKTtcblxuXHRcdGZvciAodmFyIGkgPSAwOyBpIDwga2V5cy5sZW5ndGg7IGkrKykge1xuXHRcdFx0dG9ba2V5c1tpXV0gPSBmcm9tW2tleXNbaV1dO1xuXHRcdH1cblx0fVxuXG5cdHJldHVybiB0bztcbn07XG4iLCJtb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoJy4vc3JjL1Njcm9sbExvY2snKTsiLCIvKipcbiAqIENyZWF0ZWQgYnkgbGFpZmYgb24gMTAuMTIuMTQuXG4gKi9cblxuLyoqXG4gKiBQcmV2ZW50IGRlZmF1bHQgYmVoYXZpb3IgZm9yIGV2ZW50XG4gKlxuICogQHBhcmFtIGVcbiAqIEByZXR1cm5zIHtib29sZWFufVxuICovXG52YXIgY2FuY2VsU2Nyb2xsRXZlbnQgPSBmdW5jdGlvbiAoZSkge1xuICAgIGUuc3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uKCk7XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIGUucmV0dXJuVmFsdWUgPSBmYWxzZTtcbiAgICByZXR1cm4gZmFsc2U7XG59O1xuXG52YXIgYWRkU2Nyb2xsRXZlbnRMaXN0ZW5lciA9IGZ1bmN0aW9uIChlbGVtLCBoYW5kbGVyKSB7XG4gICAgZWxlbS5hZGRFdmVudExpc3RlbmVyKCd3aGVlbCcsIGhhbmRsZXIsIGZhbHNlKTtcbn07XG5cbnZhciByZW1vdmVTY3JvbGxFdmVudExpc3RlbmVyID0gZnVuY3Rpb24gKGVsZW0sIGhhbmRsZXIpIHtcbiAgICBlbGVtLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3doZWVsJywgaGFuZGxlciwgZmFsc2UpO1xufTtcblxuLyoqXG4gKiBAZXh0ZW5kcyBSZWFjdENvbXBvc2l0ZUNvbXBvbmVudEludGVyZmFjZVxuICpcbiAqIEBtaXhpbiBTY3JvbGxMb2NrXG4gKi9cbnZhciBTY3JvbGxMb2NrID0ge1xuXG4gICAgY29tcG9uZW50RGlkTW91bnQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5zY3JvbGxMb2NrKCk7XG4gICAgfSxcblxuICAgIGNvbXBvbmVudERpZFVwZGF0ZTogZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLnNjcm9sbExvY2soKTtcbiAgICB9LFxuXG4gICAgY29tcG9uZW50V2lsbFVubW91bnQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5zY3JvbGxSZWxlYXNlKCk7XG4gICAgfSxcblxuICAgIHNjcm9sbExvY2s6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIGVsZW0gPSB0aGlzLmdldERPTU5vZGUoKTtcbiAgICAgICAgaWYgKGVsZW0pIHtcbiAgICAgICAgICAgIGFkZFNjcm9sbEV2ZW50TGlzdGVuZXIoZWxlbSwgdGhpcy5vblNjcm9sbEhhbmRsZXIpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIHNjcm9sbFJlbGVhc2U6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIGVsZW0gPSB0aGlzLmdldERPTU5vZGUoKTtcbiAgICAgICAgaWYgKGVsZW0pIHtcbiAgICAgICAgICAgIHJlbW92ZVNjcm9sbEV2ZW50TGlzdGVuZXIoZWxlbSwgdGhpcy5vblNjcm9sbEhhbmRsZXIpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIG9uU2Nyb2xsSGFuZGxlcjogZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgdmFyIGVsZW0gPSB0aGlzLmdldERPTU5vZGUoKTtcbiAgICAgICAgdmFyIHNjcm9sbFRvcCA9IGVsZW0uc2Nyb2xsVG9wO1xuICAgICAgICB2YXIgc2Nyb2xsSGVpZ2h0ID0gZWxlbS5zY3JvbGxIZWlnaHQ7XG4gICAgICAgIHZhciBoZWlnaHQgPSBlbGVtLmNsaWVudEhlaWdodDtcbiAgICAgICAgdmFyIHdoZWVsRGVsdGEgPSBlLmRlbHRhWTtcbiAgICAgICAgdmFyIGlzRGVsdGFQb3NpdGl2ZSA9IHdoZWVsRGVsdGEgPiAwO1xuXG4gICAgICAgIGlmIChpc0RlbHRhUG9zaXRpdmUgJiYgd2hlZWxEZWx0YSA+IHNjcm9sbEhlaWdodCAtIGhlaWdodCAtIHNjcm9sbFRvcCkge1xuICAgICAgICAgICAgZWxlbS5zY3JvbGxUb3AgPSBzY3JvbGxIZWlnaHQ7XG4gICAgICAgICAgICByZXR1cm4gY2FuY2VsU2Nyb2xsRXZlbnQoZSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoIWlzRGVsdGFQb3NpdGl2ZSAmJiAtd2hlZWxEZWx0YSA+IHNjcm9sbFRvcCkge1xuICAgICAgICAgICAgZWxlbS5zY3JvbGxUb3AgPSAwO1xuICAgICAgICAgICAgcmV0dXJuIGNhbmNlbFNjcm9sbEV2ZW50KGUpO1xuICAgICAgICB9XG4gICAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBTY3JvbGxMb2NrOyJdfQ==
