!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.Formatic=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function (global){
// # compiler.choices

/*
Normalizes the choices for a field. Supports the following formats.

```js
'red, blue'

['red', 'blue']

{red: 'Red', blue: 'Blue'}

[{value: 'red', label: 'Red'}, {value: 'blue', label: 'Blue'}]
```

All of those formats are normalized to:

```js
[{value: 'red', label: 'Red'}, {value: 'blue', label: 'Blue'}]
```
*/

'use strict';

var _ = (typeof window !== "undefined" ? window._ : typeof global !== "undefined" ? global._ : null);

module.exports = function (plugin) {

  var util = plugin.require('util');

  var compileChoices = function (choices) {

    // Convert comma separated string to array of strings.
    if (_.isString(choices)) {
      choices = choices.split(',');
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
          label: util.humanize(choice)
        };
      }
      if (!choices[i].label) {
        choices[i].label = util.humanize(choices[i].value);
      }
    });

    return choices;
  };

  plugin.exports.compile = function (def) {
    if (def.choices === '') {
      def.choices = [];
    } else if (def.choices) {

      def.choices = compileChoices(def.choices);
    }

    if (def.replaceChoices === '') {
      def.replaceChoices = [];
    } else if (def.replaceChoices) {

      def.replaceChoices = compileChoices(def.replaceChoices);

      def.replaceChoicesLabels = {};

      def.replaceChoices.forEach(function (choice) {
        def.replaceChoicesLabels[choice.value] = choice.label;
      });
    }
  };
};

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],2:[function(require,module,exports){
// # compiler.lookup

/*
Convert a lookup declaration to an evaluation. A lookup property is used like:

```js
{
  type: 'string',
  key: 'states',
  lookup: {source: 'locations', keys: ['country']}
}
```

Logically, the above will use the `country` key of the value to ask the
`locations` source for states choices. This works by converting the lookup to
the following evaluation.

```js
{
  type: 'string',
  key: 'states',
  choices: [],
  eval: {
    needsMeta: [
      ['@if', ['@getMeta', 'locations', {country: ['@get', 'country']}], null, ['locations', {country: ['@get', 'country']}]]
    ],
    choices: ['@getMeta', 'locations', {country: ['@get', 'country']}]
  }
}
```

The above says to add a `needsMeta` property if necessary and add a `choices`
array if it's available. Otherwise, choices will default to an empty array.
*/

'use strict';

module.exports = function (plugin) {

  var addLookup = function (def, lookupPropName, choicesPropName) {
    var lookup = def[lookupPropName];

    if (lookup) {
      if (!def[choicesPropName]) {
        def[choicesPropName] = [];
      }
      if (!def.eval) {
        def.eval = {};
      }
      if (!def.eval.needsMeta) {
        def.eval.needsMeta = [];
      }
      var keys = lookup.keys || [];
      var params = {};
      var metaArgs, metaGet, hiddenTest;

      if (lookup.group) {

        keys.forEach(function (key) {
          params[key] = ['@get', 'item', key];
        });
        metaArgs = [lookup.source].concat(params);
        metaGet = ['@getMeta'].concat(metaArgs);
        var metaForEach = ['@forEach', 'item', ['@getGroupValues', lookup.group]];
        def.eval.needsMeta.push(metaForEach.concat([
          metaArgs,
          ['@not', metaGet]
        ]));
        hiddenTest = ['@and'].concat(keys.map(function (key) {
          return ['@get', 'item', key];
        }));
        def.eval[choicesPropName] = metaForEach.concat([
          ['@or', metaGet, ['@if', hiddenTest, ['///loading///'], []]],
          ['@or', hiddenTest, metaGet]
        ]);
      } else {
        keys.forEach(function (key) {
          params[key] = ['@get', key];
        });
        metaArgs = [lookup.source].concat(params);
        metaGet = ['@getMeta'].concat(metaArgs);
        var metaGetOrLoading = ['@or', metaGet, ['///loading///']];
        def.eval.needsMeta.push(['@if', metaGet, null, metaArgs]);
        def.eval[choicesPropName] = metaGetOrLoading;
        if (keys.length > 0) {
          // Test that we have all needed keys.
          hiddenTest = ['@and'].concat(keys.map(function (key) {
            return ['@get', key];
          }));
          // Reverse test so we hide if don't have all keys.
          hiddenTest = ['@not', hiddenTest];
          if (!def.eval.hidden) {
            def.eval.hidden = hiddenTest;
          }
        }
      }

      delete def[lookupPropName];
    }
  };

  plugin.exports.compile = function (def) {

    addLookup(def, 'lookup', 'choices');
    addLookup(def, 'lookupReplacements', 'replaceChoices');
  };
};

},{}],3:[function(require,module,exports){
// # compilers.prop-aliases

/*
Alias some properties to other properties.
*/

'use strict';

module.exports = function (plugin) {

  var propAliases = {
    help_text: 'helpText'
  };

  plugin.exports.compile = function (def) {
    Object.keys(propAliases).forEach(function (alias) {
      var propName = propAliases[alias];
      if (typeof def[propName] === 'undefined' && typeof def[alias] !== 'undefined') {
        def[propName] = def[alias];
      }
    });
  };
};

},{}],4:[function(require,module,exports){
(function (global){
// # compilers.types

/*
Convert some high-level types to low-level types and properties.
*/

'use strict';

var _ = (typeof window !== "undefined" ? window._ : typeof global !== "undefined" ? global._ : null);

module.exports = function (plugin) {

  // Map high-level type to low-level type. If a function is supplied, can
  // modify the field definition.
  var typeCoerce = {
    unicode: function (def) {
      def.type = 'string';
      def.maxRows = 1;
    },
    text: 'string',
    select: function (def) {
      def.choices = def.choices || [];
    },
    bool: 'boolean',
    dict: 'object',
    decimal: 'number',
    int: 'number'
  };

  typeCoerce.str = typeCoerce.unicode;


  plugin.exports.compile = function (def) {

    var coerceType = typeCoerce[def.type];
    if (coerceType) {
      if (_.isString(coerceType)) {
        def.type = coerceType;
      } else if (_.isFunction(coerceType)) {
        def = coerceType(def);
      }
    }
  };
};

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],5:[function(require,module,exports){
(function (global){
// # component.add-item

/*
The add button to append an item to a field.
*/

'use strict';

var React = (typeof window !== "undefined" ? window.React : typeof global !== "undefined" ? global.React : null);
var R = React.DOM;

module.exports = function (plugin) {

  plugin.exports = React.createClass({

    displayName: plugin.name,

    getDefaultProps: function () {
      return {
        className: plugin.config.className,
        label: plugin.configValue('label', '[add]')
      };
    },

    render: function () {
      return R.span({className: this.props.className, onClick: this.props.onClick}, this.props.label);
    }
  });
};

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],6:[function(require,module,exports){
(function (global){
// # component.checkbox-list

/*
Used with array values to supply multiple checkboxes for adding multiple
enumerated values to an array.
*/

'use strict';

var React = (typeof window !== "undefined" ? window.React : typeof global !== "undefined" ? global.React : null);
var R = React.DOM;
var _ = (typeof window !== "undefined" ? window._ : typeof global !== "undefined" ? global._ : null);

module.exports = function (plugin) {

  plugin.exports = React.createClass({

    displayName: plugin.name,

    mixins: [plugin.require('mixin.field')],

    getDefaultProps: function () {
      return {
        className: plugin.config.className
      };
    },

    onChange: function () {
      // Get all the checked checkboxes and convert to an array of values.
      var choiceNodes = this.refs.choices.getDOMNode().getElementsByTagName('input');
      choiceNodes = Array.prototype.slice.call(choiceNodes, 0);
      var values = choiceNodes.map(function (node) {
        return node.checked ? node.value : null;
      }).filter(function (value) {
        return value;
      });
      this.props.field.val(values);
    },

    render: function () {

      var field = this.props.field;

      var choices = field.def.choices || [];

      var isInline = !_.find(choices, function (choice) {
        return choice.sample;
      });

      var value = field.value || [];

      return plugin.component('field')({
        field: field
      },
        R.div({className: this.props.className, ref: 'choices'},
          choices.map(function (choice, i) {

            var inputField = R.span({style: {whiteSpace: 'nowrap'}},
              R.input({
                name: field.def.key,
                type: 'checkbox',
                value: choice.value,
                checked: value.indexOf(choice.value) >= 0 ? true : false,
                onChange: this.onChange
                //onFocus: this.props.actions.focus
              }),
              ' ',
              R.span({className: 'field-choice-label'},
                choice.label
              )
            );

            if (isInline) {
              return R.span({key: i, className: 'field-choice'},
                inputField, ' '
              );
            } else {
              return R.div({key: i, className: 'field-choice'},
                inputField, ' ',
                plugin.component('sample')({field: field, choice: choice})
              );
            }
          }.bind(this))
        )
      );
    }
  });
};

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],7:[function(require,module,exports){
(function (global){
'use strict';

var React = (typeof window !== "undefined" ? window.React : typeof global !== "undefined" ? global.React : null);
var R = React.DOM;
var _ = (typeof window !== "undefined" ? window._ : typeof global !== "undefined" ? global._ : null);

var CSSTransitionGroup = React.createFactory(React.addons.CSSTransitionGroup);

module.exports = function (plugin) {

  plugin.exports = React.createClass({

    mixins: [
      //plugin.require('mixin.resize'),
      //plugin.require('mixin.scroll'),
      plugin.require('mixin.click-outside')
    ],

    getInitialState: function () {
      return {
        maxHeight: null,
        open: this.props.open
      };
    },
    //
    // onToggle: function () {
    //   this.setState({open: !this.state.open});
    // },
    //
    // onClose: function () {
    //   this.setState({open: false});
    // },
    //
    // fixChoicesWidth: function () {
    //   this.setState({
    //     choicesWidth: this.refs.active.getDOMNode().offsetWidth
    //   });
    // },
    //
    // onResizeWindow: function () {
    //   this.fixChoicesWidth();
    // },

    // componentDidMount: function () {
    //   this.fixChoicesWidth();
    //   this.setOnClickOutside('select', this.onClose);
    // },

    getIgnoreCloseNodes: function () {
      if (!this.props.ignoreCloseNodes) {
        return [];
      }
      var nodes = this.props.ignoreCloseNodes();
      if (!_.isArray(nodes)) {
        nodes = [nodes];
      }
      return nodes;
    },

    componentDidMount: function () {
      this.setOnClickOutside('choices', function (event) {

        // Make sure we don't find any nodes to ignore.
        if (!_.find(this.getIgnoreCloseNodes(), function (node) {
          return this.isNodeInside(event.target, node);
        }.bind(this))) {
          this.props.onClose();
        }
      }.bind(this));

      this.adjustSize();
    },

    onSelect: function (choice) {
      this.props.onSelect(choice.value);
    },

    onResizeWindow: function () {
      this.adjustSize();
    },

    onScrollWindow: function () {
      this.adjustSize();
    },

    adjustSize: function () {
      if (this.refs.choices) {
        var node = this.refs.choices.getDOMNode();
        var rect = node.getBoundingClientRect();
        var top = rect.top;
        var windowHeight = window.innerHeight;
        var height = windowHeight - top;
        this.setState({
          maxHeight: height
        });
      }
    },

    componentWillReceiveProps: function (nextProps) {
      this.setState({open: nextProps.open}, function () {
        this.adjustSize();
      }.bind(this));
    },

    onScroll: function () {
      // console.log('stop that!')
      // event.preventDefault();
      // event.stopPropagation();
    },

    onWheel: function () {
      // event.preventDefault();
      // event.stopPropagation();
    },

    render: function () {

      var choices = this.props.choices;

      if (choices && choices.length === 0) {
        choices = [{value: '///empty///'}];
      }

      return R.div({ref: 'container', onWheel: this.onWheel, onScroll: this.onScroll, className: 'choices-container', style: {
        userSelect: 'none', WebkitUserSelect: 'none', position: 'absolute',
        maxHeight: this.state.maxHeight ? this.state.maxHeight : null
      }},
        CSSTransitionGroup({transitionName: 'reveal'},
          this.props.open ? R.ul({ref: 'choices', className: 'choices'},
            choices.map(function (choice, i) {

              var choiceElement = null;

              if (choice.value === '///loading///') {
                choiceElement = R.a({href: 'JavaScript' + ':', onClick: this.props.onClose},
                  R.span({className: 'choice-label'},
                    'Loading...'
                  )
                );
              } else if (choice.value === '///empty///') {
                choiceElement = R.a({href: 'JavaScript' + ':', onClick: this.props.onClose},
                  R.span({className: 'choice-label'},
                    'No choices available.'
                  )
                );
              } else {
                choiceElement = R.a({href: 'JavaScript' + ':', onClick: this.onSelect.bind(this, choice)},
                  R.span({className: 'choice-label'},
                    choice.label
                  ),
                  R.span({className: 'choice-sample'},
                    choice.sample
                  )
                );
              }

              return R.li({key: i, className: 'choice'},
                choiceElement
              );
            }.bind(this))
          ) : null
        )
      );


      // var className = formatic.className('dropdown-field', plugin.config.className, this.props.field.className);
      //
      // var selectedLabel = '';
      // var matchingLabels = this.props.field.choices.filter(function (choice) {
      //   return choice.value === this.props.field.value;
      // }.bind(this));
      // if (matchingLabels.length > 0) {
      //   selectedLabel = matchingLabels[0].label;
      // }
      // selectedLabel = selectedLabel || '\u00a0';
      //
      // return R.div(_.extend({className: className, ref: 'select'}, plugin.config.attributes),
      //   R.div({className: 'field-value', ref: 'active', onClick: this.onToggle}, selectedLabel),
      //   R.div({className: 'field-toggle ' + (this.state.open ? 'field-open' : 'field-closed'), onClick: this.onToggle}),
      //   React.addons.CSSTransitionGroup({transitionName: 'reveal'},
      //     R.div({className: 'field-choices-container'},
      //       this.state.open ? R.ul({ref: 'choices', className: 'field-choices', style: {width: this.state.choicesWidth}},
      //         this.props.field.choices.map(function (choice) {
      //           return R.li({
      //             className: 'field-choice',
      //             onClick: function () {
      //               this.setState({open: false});
      //               this.props.form.actions.change(this.props.field, choice.value);
      //             }.bind(this)
      //           }, choice.label);
      //         }.bind(this))
      //       ) : []
      //     )
      //   )
      // );
    }
  });
};


// componentDidMount: function () {
//   this.setOnClickOutside('choices', function (event) {
//
//     // Make sure we don't find any nodes to ignore.
//     if (!_.find(this.getIgnoreCloseNodes(), function (node) {
//       console.log(node, event.target)
//       return !this.isNodeOutside(node, event.target);
//     }.bind(this))) {
//       console.log("how???")
//       this.props.onClose();
//     }
//   }.bind(this));
// },
//
// onSelect: function (choice) {
//   this.props.onSelect(choice.value);
// },
//
// render: function () {
//
//   return R.div({ref: 'container', className: 'choices-container', style: {userSelect: 'none', WebkitUserSelect: 'none', position: 'absolute'}},
//     this.props.open ?
//       CSSTransitionGroup({transitionName: 'reveal'},
//         R.ul({ref: 'choices', className: 'choices'},
//           this.props.choices.map(function (choice, i) {
//             return R.li({key: i, className: 'choice'},
//               R.a({href: 'JavaScript:' + '', onClick: this.onSelect.bind(this, choice)},
//                 R.span({className: 'choice-label'},
//                   choice.label
//                 ),
//                 R.span({className: 'choice-sample'},
//                   choice.sample
//                 )
//               )
//             );
//           }.bind(this))
//         )
//       )
//       : null
//   );

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],8:[function(require,module,exports){
(function (global){
// # component.field

/*
Used by any fields to put the label and help text around the field.
*/

'use strict';

var React = (typeof window !== "undefined" ? window.React : typeof global !== "undefined" ? global.React : null);
var R = React.DOM;
var _ = (typeof window !== "undefined" ? window._ : typeof global !== "undefined" ? global._ : null);

var CSSTransitionGroup = React.createFactory(React.addons.CSSTransitionGroup);

module.exports = function (plugin) {

  plugin.exports = React.createClass({

    displayName: plugin.name,

    getDefaultProps: function () {
      return {
        className: plugin.config.className
      };
    },

    getInitialState: function () {
      return {
        collapsed: this.props.field.def.collapsed ? true : false
      };
    },

    isCollapsible: function () {
      var field = this.props.field;

      return !_.isUndefined(field.def.collapsed) || !_.isUndefined(field.def.collapsible);
    },

    onClickLabel: function () {
      this.setState({
        collapsed: !this.state.collapsed
      });
    },

    render: function () {

      var field = this.props.field;

      var index = this.props.index;
      if (!_.isNumber(index)) {
        index = _.isNumber(field.def.key) ? field.def.key : undefined;
      }

      return R.div({className: this.props.className, style: {display: (field.hidden() ? 'none' : '')}},
        plugin.component('label')({field: field, index: index, onClick: this.isCollapsible() ? this.onClickLabel : null}),
        CSSTransitionGroup({transitionName: 'reveal'},
          this.state.collapsed ? [] : [
            plugin.component('help')({key: 'help', field: field}),
            this.props.children
          ]
        )
      );
    }
  });
};

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],9:[function(require,module,exports){
(function (global){
// # component.fieldset

/*
Render multiple child fields for a field.
*/

'use strict';

var React = (typeof window !== "undefined" ? window.React : typeof global !== "undefined" ? global.React : null);
var R = React.DOM;

module.exports = function (plugin) {

  plugin.exports = React.createClass({

    displayName: plugin.name,

    mixins: [plugin.require('mixin.field')],

    getDefaultProps: function () {
      return {
        className: plugin.config.className
      };
    },

    render: function () {
      var field = this.props.field;

      return plugin.component('field')({
        field: field
      },
        R.fieldset({className: this.props.className},
          field.fields().map(function (field, i) {
            return field.component({key: field.def.key || i});
          }.bind(this))
        )
      );
    }
  });
};

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],10:[function(require,module,exports){
(function (global){
// # component.help

/*
Just the help text block.
*/

'use strict';

var React = (typeof window !== "undefined" ? window.React : typeof global !== "undefined" ? global.React : null);
var R = React.DOM;

module.exports = function (plugin) {

  plugin.exports = React.createClass({

    displayName: plugin.name,

    getDefaultProps: function () {
      return {
        className: plugin.config.className
      };
    },

    render: function () {

      var field = this.props.field;

      return field.def.helpText ?
        R.div({className: this.props.className},
          field.def.helpText
        ) :
        R.span(null);
    }
  });
};

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],11:[function(require,module,exports){
(function (global){
// # component.item-choices

/*
Give a list of choices of item types to create as children of an field.
*/

'use strict';

var React = (typeof window !== "undefined" ? window.React : typeof global !== "undefined" ? global.React : null);
var R = React.DOM;

module.exports = function (plugin) {

  plugin.exports = React.createClass({

    displayName: plugin.name,

    getDefaultProps: function () {
      return {
        className: plugin.config.className
      };
    },

    onChange: function (event) {
      this.props.onSelect(parseInt(event.target.value));
    },

    render: function () {

      var field = this.props.field;

      var typeChoices = null;
      if (field.items().length > 0) {
        typeChoices = R.select({className: this.props.className, value: this.value, onChange: this.onChange},
          field.items().map(function (item, i) {
            return R.option({key: i, value: i}, item.label || i);
          })
        );
      }

      return typeChoices ? typeChoices : R.span(null);
    }
  });
};

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],12:[function(require,module,exports){
(function (global){
// # component.json

/*
Textarea editor for JSON. Will validate the JSON before setting the value, so
while the value is invalid, no external state changes will occur.
*/

'use strict';

var React = (typeof window !== "undefined" ? window.React : typeof global !== "undefined" ? global.React : null);
var R = React.DOM;

module.exports = function (plugin) {

  plugin.exports = React.createClass({

    displayName: plugin.name,

    mixins: [plugin.require('mixin.field')],

    getDefaultProps: function () {
      return {
        className: plugin.config.className,
        rows: plugin.config.rows || 5
      };
    },

    isValidValue: function (value) {

      try {
        JSON.parse(value);
        return true;
      } catch (e) {
        return false;
      }
    },

    getInitialState: function () {
      return {
        isValid: true,
        value: JSON.stringify(this.props.field.value, null, 2)
      };
    },

    onChange: function (event) {
      var isValid = this.isValidValue(event.target.value);

      if (isValid) {
        // Need to handle this better. Need to track position.
        this._isChanging = true;
        this.props.field.val(JSON.parse(event.target.value));
      }

      this.setState({
        isValid: isValid,
        value: event.target.value
      });
    },

    componentWillReceiveProps: function (nextProps) {
      if (!this._isChanging) {
        this.setState({
          isValid: true,
          value: JSON.stringify(nextProps.field.value, null, 2)
        });
      }
      this._isChanging = false;
    },

    render: function () {

      var field = this.props.field;

      return plugin.component('field')({
        field: field
      }, R.textarea({
          className: this.props.className,
          value: this.state.value,
          onChange: this.onChange,
          style: {backgroundColor: this.state.isValid ? '' : 'rgb(255,200,200)'},
          rows: field.def.rows || this.props.rows
        })
      );
    }
  });
};

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],13:[function(require,module,exports){
(function (global){
// # component.label

/*
Just the label for a field.
*/

'use strict';

var React = (typeof window !== "undefined" ? window.React : typeof global !== "undefined" ? global.React : null);
var R = React.DOM;

module.exports = function (plugin) {

  plugin.exports = React.createClass({

    displayName: plugin.name,

    getDefaultProps: function () {
      return {
        className: plugin.config.className
      };
    },

    render: function () {

      var field = this.props.field;

      var label = null;
      if (typeof this.props.index === 'number') {
        label = '' + (this.props.index + 1) + '.';
        if (field.def.label) {
          label = label + ' ' + field.def.label;
        }
      }

      if (field.def.label || label) {
        var text = label || field.def.label;
        if (this.props.onClick) {
          text = R.a({href: 'JavaScript' + ':', onClick: this.props.onClick}, text);
        }
        label = R.label({}, text);
      }

      var required = R.span({className: 'required-text'});

      return R.div({
        className: this.props.className
      },
        label,
        ' ',
        required
      );
    }
  });
};

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],14:[function(require,module,exports){
(function (global){
// # component.list-control

/*
Render the item type choices and the add button.
*/

'use strict';

var React = (typeof window !== "undefined" ? window.React : typeof global !== "undefined" ? global.React : null);
var R = React.DOM;

module.exports = function (plugin) {

  plugin.exports = React.createClass({

    displayName: plugin.name,

    getDefaultProps: function () {
      return {
        className: plugin.config.className
      };
    },

    getInitialState: function () {
      return {
        itemIndex: 0
      };
    },

    onSelect: function (index) {
      this.setState({
        itemIndex: index
      });
    },

    onAppend: function () {
      this.props.onAppend(this.state.itemIndex);
    },

    render: function () {

      var field = this.props.field;

      var typeChoices = null;

      if (field.items().length > 0) {
        typeChoices = plugin.component('item-choices')({field: field, value: this.state.itemIndex, onSelect: this.onSelect});
      }

      return R.div({className: this.props.className},
        typeChoices, ' ',
        plugin.component('add-item')({onClick: this.onAppend})
      );
    }
  });
};

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],15:[function(require,module,exports){
(function (global){
// # component.list-item-control

/*
Render the remove and move buttons for a field.
*/

'use strict';

var React = (typeof window !== "undefined" ? window.React : typeof global !== "undefined" ? global.React : null);
var R = React.DOM;

module.exports = function (plugin) {

  plugin.exports = React.createClass({

    displayName: plugin.name,

    getDefaultProps: function () {
      return {
        className: plugin.config.className
      };
    },

    onMoveBack: function () {
      this.props.onMove(this.props.index, this.props.index - 1);
    },

    onMoveForward: function () {
      this.props.onMove(this.props.index, this.props.index + 1);
    },

    onRemove: function () {
      this.props.onRemove(this.props.index);
    },

    render: function () {
      var field = this.props.field;

      return R.div({className: this.props.className},
        plugin.component('remove-item')({field: field, onClick: this.onRemove}),
        this.props.index > 0 ? plugin.component('move-item-back')({onClick: this.onMoveBack}) : null,
        this.props.index < (this.props.numItems - 1) ? plugin.component('move-item-forward')({onClick: this.onMoveForward}) : null
      );
    }
  });
};

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],16:[function(require,module,exports){
(function (global){
// # component.list-item-value

/*
Render the value of a list item.
*/

'use strict';

var React = (typeof window !== "undefined" ? window.React : typeof global !== "undefined" ? global.React : null);
var R = React.DOM;

module.exports = function (plugin) {

  plugin.exports = React.createClass({

    displayName: plugin.name,

    getDefaultProps: function () {
      return {
        className: plugin.config.className
      };
    },

    render: function () {
      var field = this.props.field;

      return R.div({className: this.props.className},
        field.component()
        // plugin.component('field')({
        //   field: field,
        //   index: this.props.index
        // },
        //   field.component()
        // )
      );
    }
  });
};

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],17:[function(require,module,exports){
(function (global){
// # component.list-item

/*
Render a list item.
*/

'use strict';

var React = (typeof window !== "undefined" ? window.React : typeof global !== "undefined" ? global.React : null);
var R = React.DOM;

module.exports = function (plugin) {

  plugin.exports = React.createClass({

    displayName: plugin.name,

    getDefaultProps: function () {
      return {
        className: plugin.config.className
      };
    },

    render: function () {
      var field = this.props.field;

      return R.div({className: this.props.className},
        plugin.component('list-item-value')({form: this.props.form, field: field, index: this.props.index}),
        plugin.component('list-item-control')({field: field, index: this.props.index, numItems: this.props.numItems, onMove: this.props.onMove, onRemove: this.props.onRemove})
      );
    }
  });
};

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],18:[function(require,module,exports){
(function (global){
// # component.list

/*
Render a list.
*/

'use strict';

var React = (typeof window !== "undefined" ? window.React : typeof global !== "undefined" ? global.React : null);
var R = React.DOM;

var CSSTransitionGroup = React.createFactory(React.addons.CSSTransitionGroup);

module.exports = function (plugin) {

  plugin.exports = React.createClass({

    displayName: plugin.name,

    mixins: [plugin.require('mixin.field')],

    getDefaultProps: function () {
      return {
        className: plugin.config.className
      };
    },

    nextLookupId: 0,

    getInitialState: function () {

      // Need to create artificial keys for the array. Indexes are not good keys,
      // since they change. So, map each position to an artificial key
      var lookups = [];
      this.props.field.fields().forEach(function (field, i) {
        lookups[i] = '_' + this.nextLookupId;
        this.nextLookupId++;
      }.bind(this));

      return {
        lookups: lookups
      };
    },

    componentWillReceiveProps: function (newProps) {

      var lookups = this.state.lookups;
      var fields = newProps.field.fields();

      // Need to set artificial keys for new array items.
      if (fields.length > lookups.length) {
        for (var i = lookups.length; i < fields.length; i++) {
          lookups[i] = '_' + this.nextLookupId;
          this.nextLookupId++;
        }
      }

      this.setState({
        lookups: lookups
      });
    },

    onAppend: function (itemIndex) {
      this.props.field.append(itemIndex);
    },
    //
    // onClickLabel: function (i) {
    //   if (this.props.field.collapsableItems) {
    //     var collapsed;
    //     // if (!this.state.collapsed[i]) {
    //     //   collapsed = this.state.collapsed;
    //     //   collapsed[i] = true;
    //     //   this.setState({collapsed: collapsed});
    //     // } else {
    //     //   collapsed = this.props.field.fields.map(function () {
    //     //     return true;
    //     //   });
    //     //   collapsed[i] = false;
    //     //   this.setState({collapsed: collapsed});
    //     // }
    //     collapsed = this.state.collapsed;
    //     collapsed[i] = !collapsed[i];
    //     this.setState({collapsed: collapsed});
    //   }
    // },
    //
    onRemove: function (i) {
      var lookups = this.state.lookups;
      lookups.splice(i, 1);
      this.setState({
        lookups: lookups
      });
      this.props.field.remove(i);
    },
    //
    onMove: function (fromIndex, toIndex) {
      var lookups = this.state.lookups;
      var fromId = lookups[fromIndex];
      var toId = lookups[toIndex];
      lookups[fromIndex] = toId;
      lookups[toIndex] = fromId;
      this.setState({
        lookups: lookups
      });
      this.props.field.move(fromIndex, toIndex);
    },

    render: function () {

      var field = this.props.field;
      var fields = field.fields();

      var numItems = fields.length;
      return plugin.component('field')({
        field: field
      },
        R.div({className: this.props.className},
          CSSTransitionGroup({transitionName: 'reveal'},
            fields.map(function (child, i) {
              return plugin.component('list-item')({
                key: this.state.lookups[i],
                form: this.props.form,
                field: child,
                parent: field,
                index: i,
                numItems: numItems,
                onMove: this.onMove,
                onRemove: this.onRemove
              });
            }.bind(this))
          ),
          plugin.component('list-control')({field: field, onAppend: this.onAppend})
        )
      );
    }
  });
};

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],19:[function(require,module,exports){
(function (global){
// # component.move-item-back

/*
Button to move an item backwards in list.
*/

'use strict';

var React = (typeof window !== "undefined" ? window.React : typeof global !== "undefined" ? global.React : null);
var R = React.DOM;

module.exports = function (plugin) {

  plugin.exports = React.createClass({

    displayName: plugin.name,

    getDefaultProps: function () {
      return {
        className: plugin.config.className,
        label: plugin.configValue('label', '[up]')
      };
    },

    render: function () {
      return R.span({className: this.props.className, onClick: this.props.onClick}, this.props.label);
    }
  });
};

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],20:[function(require,module,exports){
(function (global){
// # component.move-item-forward

/*
Button to move an item forward in a list.
*/

'use strict';

var React = (typeof window !== "undefined" ? window.React : typeof global !== "undefined" ? global.React : null);
var R = React.DOM;

module.exports = function (plugin) {

  plugin.exports = React.createClass({

    displayName: plugin.name,

    getDefaultProps: function () {
      return {
        className: plugin.config.className,
        label: plugin.configValue('label', '[down]')
      };
    },

    render: function () {
      return R.span({className: this.props.className, onClick: this.props.onClick}, this.props.label);
    }
  });
};

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],21:[function(require,module,exports){
(function (global){
// # component.pretty-textarea

/*
Textarea that will display highlights behind "tags". Tags currently mean text
that is enclosed in braces like `{{foo}}`. Tags are replaced with labels if
available or humanized.

This component is quite complicated because:
- We are displaying text in the textarea but have to keep track of the real
  text value in the background. We can't use a data attribute, because it's a
  textarea, so we can't use any elements at all!
- Because of the hidden data, we also have to do some interception of
  copy, which is a little weird. We intercept copy and copy the real text
  to the end of the textarea. Then we erase that text, which leaves the copied
  data in the buffer.
- React loses the caret position when you update the value to something
  different than before. So we have to retain tracking information for when
  that happens.
- Because we monkey with copy, we also have to do our own undo/redo. Otherwise
  the default undo will have weird states in it.

So good luck!
*/

'use strict';

var React = (typeof window !== "undefined" ? window.React : typeof global !== "undefined" ? global.React : null);
var R = React.DOM;
var _ = (typeof window !== "undefined" ? window._ : typeof global !== "undefined" ? global._ : null);

var noBreak = function (value) {
  return value.replace(/ /g, '\u00a0');
};

var LEFT_PAD = '\u00a0\u00a0';
// Why this works, I'm not sure.
var RIGHT_PAD = '  '; //'\u00a0\u00a0';

var idPrefixRegEx = /^[0-9]+__/;

// Zapier specific stuff. Make a plugin for this later.
var removeIdPrefix = function (key) {
  if (idPrefixRegEx.test(key)) {
    return key.replace(idPrefixRegEx, '');
  }
  return key;
};

var positionInNode = function (position, node) {
  var rect = node.getBoundingClientRect();
  if (position.x >= rect.left && position.x <= rect.right) {
    if (position.y >= rect.top && position.y <= rect.bottom) {
      return true;
    }
  }
};

module.exports = function (plugin) {

  var util = plugin.require('util');

  plugin.exports = React.createClass({

    displayName: plugin.name,

    mixins: [plugin.require('mixin.field'), plugin.require('mixin.undo-stack'), plugin.require('mixin.resize')],

    getDefaultProps: function () {
      return {
        className: plugin.config.className
      };
    },

    getInitialState: function () {
      return {
        undoDepth: 100,
        isChoicesOpen: false,
        hoverPillRef: null
      };
    },

    componentWillMount: function () {
      // Not quite state, this is for tracking selection info.
      this.tracking = {};

      var parts = util.parseTextWithTags(this.props.field.value);
      var tokens = this.tokens(parts);
      var indexMap = this.indexMap(tokens);

      this.tracking.pos = indexMap.length;
      this.tracking.range = 0;
      this.tracking.tokens = tokens;
      this.tracking.indexMap = indexMap;
    },

    getStateSnapshot: function () {
      return {
        value: this.props.field.value,
        pos: this.tracking.pos,
        range: this.tracking.range
      };
    },

    setStateSnapshot: function (snapshot) {
      this.tracking.pos = snapshot.pos;
      this.tracking.range = snapshot.range;
      this.props.field.val(snapshot.value);
    },

    // Turn into individual characters and tags
    tokens: function (parts) {
      return [].concat.apply([], parts.map(function (part) {
        if (part.type === 'tag') {
          return part;
        } else {
          return part.value.split('');
        }
      }));
    },

    // Map each textarea index back to a token
    indexMap: function (tokens) {
      var indexMap = [];
      _.each(tokens, function (token, tokenIndex) {
        if (token.type === 'tag') {
          var label = LEFT_PAD + noBreak(this.prettyLabel(token.value)) + RIGHT_PAD;
          var labelChars = label.split('');
          _.each(labelChars, function () {
            indexMap.push(tokenIndex);
          });
        } else {
          indexMap.push(tokenIndex);
        }
      }.bind(this));
      return indexMap;
    },

    // Make highlight scroll match textarea scroll
    onScroll: function () {
      this.refs.highlight.getDOMNode().scrollTop = this.refs.content.getDOMNode().scrollTop;
      this.refs.highlight.getDOMNode().scrollLeft = this.refs.content.getDOMNode().scrollLeft;
    },

    // Given some postion, return the token index (position could be in the middle of a token)
    tokenIndex: function (pos, tokens, indexMap) {
      if (pos < 0) {
        pos = 0;
      } else if (pos >= indexMap.length) {
        return tokens.length;
      }
      return indexMap[pos];
    },

    onChange: function (event) {
      //console.log('change:', event.target.value);

      var node = event.target;

      // Tracking is holding previous position and range
      var prevPos = this.tracking.pos;
      var prevRange = this.tracking.range;

      // New position
      var pos = node.selectionStart;

      // Going to mutate the tokens.
      var tokens = this.tracking.tokens;

      // Using the previous position and range, get the previous token position
      // and range
      var prevTokenIndex = this.tokenIndex(prevPos, tokens, this.tracking.indexMap);
      var prevTokenEndIndex = this.tokenIndex(prevPos + prevRange, tokens, this.tracking.indexMap);
      var prevTokenRange = prevTokenEndIndex - prevTokenIndex;

      // Wipe out any tokens in the selected range because the change would have
      // erased that selection.
      if (prevTokenRange > 0) {
        tokens.splice(prevTokenIndex, prevTokenRange);
        this.tracking.indexMap = this.indexMap(tokens);
      }

      // If cursor has moved forward, then text was added.
      if (pos > prevPos) {
        var addedText = node.value.substring(prevPos, pos);
        // Insert the text into the tokens.
        tokens.splice(prevTokenIndex, 0, addedText);
      // If cursor has moved backward, then we deleted (backspaced) text
      } if (pos < prevPos) {
        var token = this.tokenAt(pos);
        var tokenBefore = this.tokenBefore(pos);
        // If we moved back onto a token, then we should move back to beginning
        // of token.
        if (token === tokenBefore) {
          pos = this.moveOffTag(pos, tokens, this.indexMap(tokens), -1);
        }
        var tokenIndex = this.tokenIndex(pos, tokens, this.tracking.indexMap);
        // Now we can remove the tokens that were deleted.
        tokens.splice(tokenIndex, prevTokenIndex - tokenIndex);
      }

      // Convert tokens back into raw value with tags. Newly formed tags will
      // become part of the raw value.
      var rawValue = this.rawValue(tokens);

      this.tracking.pos = pos;
      this.tracking.range = 0;

      // Set the value to the new raw value.
      this.props.field.val(rawValue);

      this.snapshot();
    },

    componentDidUpdate: function () {
      var value = this.props.field.value || '';
      var parts = util.parseTextWithTags(value);
      this.tracking.tokens = this.tokens(parts);
      this.tracking.indexMap = this.indexMap(this.tracking.tokens);

      var pos = this.normalizePosition(this.tracking.pos);
      var range = this.tracking.range;
      var endPos = this.normalizePosition(pos + range);
      range = endPos - pos;

      this.tracking.pos = pos;
      this.tracking.range = range;

      if (document.activeElement === this.refs.content.getDOMNode()) {
        // React can lose the selection, so put it back.
        this.refs.content.getDOMNode().setSelectionRange(pos, pos + range);
      }
    },

    // Get the label for a key.
    prettyLabel: function (key) {
      if (this.props.field.def.replaceChoicesLabels[key]) {
        return this.props.field.def.replaceChoicesLabels[key];
      }
      var cleaned = removeIdPrefix(key);
      return util.humanize(cleaned);
    },

    // Given the actual value of the field (with tags), get the plain text that
    // should show in the textarea.
    plainValue: function (value) {
      var parts = util.parseTextWithTags(value);
      return parts.map(function (part) {
        if (part.type === 'text') {
          return part.value;
        } else {
          return LEFT_PAD + noBreak(this.prettyLabel(part.value)) + RIGHT_PAD;
        }
      }.bind(this)).join('');
    },

    // Given the actual value of the field (with tags), get the html used to
    // highlight the labels.
    prettyValue: function (value) {
      var parts = util.parseTextWithTags(value);
      return parts.map(function (part, i) {
        if (part.type === 'text') {
          if (i === (parts.length - 1)) {
            if (part.value[part.value.length - 1] === '\n') {
              return part.value + '\u00a0';
            }
          }
          return part.value;
        } else {
          // Make a pill
          var pillRef = 'prettyPart' + i;
          var className = 'pretty-part';
          if (this.state.hoverPillRef && pillRef === this.state.hoverPillRef) {
            className += ' pretty-part-hover';
          }
          return R.span({key: i, className: className, ref: pillRef, 'data-pretty': true, 'data-ref': pillRef},
            R.span({className: 'pretty-part-left'}, LEFT_PAD),
            R.span({className: 'pretty-part-text'}, noBreak(this.prettyLabel(part.value))),
            R.span({className: 'pretty-part-right'}, RIGHT_PAD)
          );
        }
      }.bind(this));
    },

    // Given the tokens for a field, get the actual value of the field (with
    // tags)
    rawValue: function (tokens) {
      return tokens.map(function (token) {
        if (token.type === 'tag') {
          return '{{' + token.value + '}}';
        } else {
          return token;
        }
      }).join('');
    },

    // Given a position, if it's on a label, get the position left or right of
    // the label, based on direction and/or which side is closer
    moveOffTag: function (pos, tokens, indexMap, dir) {
      if (typeof dir === 'undefined' || dir > 0) {
        dir = 1;
      } else {
        dir = -1;
      }
      var token;
      if (dir > 0) {
        token = tokens[indexMap[pos]];
        while (pos < indexMap.length && tokens[indexMap[pos]].type === 'tag' && tokens[indexMap[pos]] === token) {
          pos++;
        }
      } else {
        token = tokens[indexMap[pos - 1]];
        while (pos > 0 && tokens[indexMap[pos - 1]].type === 'tag' && tokens[indexMap[pos - 1]] === token) {
          pos--;
        }
      }

      return pos;
    },

    // Get the token at some position.
    tokenAt: function (pos) {
      if (pos >= this.tracking.indexMap.length) {
        return null;
      }
      if (pos < 0) {
        pos = 0;
      }
      return this.tracking.tokens[this.tracking.indexMap[pos]];
    },

    // Get the token immediately before some position.
    tokenBefore: function (pos) {
      if (pos >= this.tracking.indexMap.length) {
        pos = this.tracking.indexMap.length;
      }
      if (pos <= 0) {
        return null;
      }
      return this.tracking.tokens[this.tracking.indexMap[pos - 1]];
    },

    // Given a position, get a corrected position (if necessary to be
    // corrected).
    normalizePosition: function (pos, prevPos) {
      if (_.isUndefined(prevPos)) {
        prevPos = pos;
      }
      // At start or end, so okay.
      if (pos <= 0 || pos >= this.tracking.indexMap.length) {
        if (pos < 0) {
          pos = 0;
        }
        if (pos > this.tracking.indexMap.length) {
          pos = this.tracking.indexMap.length;
        }
        return pos;
      }

      var token = this.tokenAt(pos);
      var tokenBefore = this.tokenBefore(pos);

      // Between two tokens, so okay.
      if (token !== tokenBefore) {
        return pos;
      }

      var prevToken = this.tokenAt(prevPos);
      var prevTokenBefore = this.tokenBefore(prevPos);

      var rightPos = this.moveOffTag(pos, this.tracking.tokens, this.tracking.indexMap);
      var leftPos = this.moveOffTag(pos, this.tracking.tokens, this.tracking.indexMap, -1);

      if (prevToken !== prevTokenBefore) {
        // Moved from left edge.
        if (prevToken === token) {
          return rightPos;
        }
        // Moved from right edge.
        if (prevTokenBefore === token) {
          return leftPos;
        }
      }

      var newPos = rightPos;

      if (pos === prevPos || pos < prevPos) {
        if (rightPos - pos > pos - leftPos) {
          newPos = leftPos;
        }
      }
      return newPos;
    },



    onSelect: function (event) {
      var node = event.target;

      var pos = node.selectionStart;
      var endPos = node.selectionEnd;

      if (pos === endPos && this.state.hoverPillRef) {
        var tokenAt = this.tokenAt(pos);
        var tokenBefore = this.tokenBefore(pos);

        if (tokenAt && tokenAt === tokenBefore && tokenAt.type && tokenAt.type === 'tag') {
          // Clicked a tag.
          var rightPos = this.moveOffTag(pos, this.tracking.tokens, this.tracking.indexMap);
          var leftPos = this.moveOffTag(pos, this.tracking.tokens, this.tracking.indexMap, -1);
          this.tracking.pos = leftPos;
          this.tracking.range = rightPos - leftPos;
          node.selectionStart = leftPos;
          node.selectionEnd = rightPos;

          this.setState({isChoicesOpen: true});

          return;
        }
      }

      pos = this.normalizePosition(pos, this.tracking.pos);
      endPos = this.normalizePosition(endPos, this.tracking.pos + this.tracking.range);

      this.tracking.pos = pos;
      this.tracking.range = endPos - pos;

      node.selectionStart = pos;
      node.selectionEnd = endPos;
    },

    onCopy: function () {
      var node = this.refs.content.getDOMNode();
      var start = node.selectionStart;
      var end = node.selectionEnd;
      var text = node.value.substring(start, end);
      var realStartIndex = this.tokenIndex(start, this.tracking.tokens, this.tracking.indexMap);
      var realEndIndex = this.tokenIndex(end, this.tracking.tokens, this.tracking.indexMap);
      var tokens = this.tracking.tokens.slice(realStartIndex, realEndIndex);
      text = this.rawValue(tokens);
      var originalValue = node.value;
      node.value = node.value + text;
      node.setSelectionRange(originalValue.length, originalValue.length + text.length);
      window.setTimeout(function() {
        node.value = originalValue;
        node.setSelectionRange(start, end);
      },0);
    },

    onCut: function () {
      var node = this.refs.content.getDOMNode();
      var start = node.selectionStart;
      var end = node.selectionEnd;
      var text = node.value.substring(start, end);
      var realStartIndex = this.tokenIndex(start, this.tracking.tokens, this.tracking.indexMap);
      var realEndIndex = this.tokenIndex(end, this.tracking.tokens, this.tracking.indexMap);
      var tokens = this.tracking.tokens.slice(realStartIndex, realEndIndex);
      text = this.rawValue(tokens);
      var originalValue = node.value;
      var cutValue = node.value.substring(0, start) + node.value.substring(end);
      node.value = node.value + text;
      node.setSelectionRange(originalValue.length, originalValue.length + text.length);
      var cutTokens = this.tracking.tokens.slice(0, realStartIndex).concat(this.tracking.tokens.slice(realEndIndex));
      window.setTimeout(function() {
        node.value = cutValue;
        node.setSelectionRange(start, start);
        this.tracking.pos = start;
        this.tracking.range = 0;
        this.tracking.tokens = cutTokens;
        this.tracking.indexMap = this.indexMap(this.tracking.tokens);

        // Convert tokens back into raw value with tags. Newly formed tags will
        // become part of the raw value.
        var rawValue = this.rawValue(this.tracking.tokens);

        // Set the value to the new raw value.
        this.props.field.val(rawValue);

        this.snapshot();
      }.bind(this),0);
    },

    onKeyDown: function (event) {

      if (event.keyCode === 37) {
        this.leftArrowDown = true;
      } else if (event.keyCode === 39) {
        this.rightArrowDown = true;
      }

      // Cmd-Z or Ctrl-Z
      if (event.keyCode === 90 && (event.metaKey || event.ctrlKey) && !event.shiftKey) {
        event.preventDefault();
        this.undo();
      // Cmd-Shift-Z or Ctrl-Y
      } else if (
        (event.keyCode === 89 && event.ctrlKey && !event.shiftKey) ||
        (event.keyCode === 90 && event.metaKey && event.shiftKey)
      ) {
        this.redo();
      }
    },

    onKeyUp: function (event) {
      if (event.keyCode === 37) {
        this.leftArrowDown = false;
      } else if (event.keyCode === 39) {
        this.rightArrowDown = false;
      }
    },

    // Keep the highlight styles in sync with the textarea styles.
    adjustStyles: function (isMount) {
      var overlay = this.refs.highlight.getDOMNode();
      var content = this.refs.content.getDOMNode();

      var style = window.getComputedStyle(content);

      var backgroundColor = style.backgroundColor;

      util.copyElementStyle(content, overlay);

      overlay.style.position = 'absolute';
      overlay.style.whiteSpace = 'pre-wrap';
      overlay.style.color = 'rgba(0,0,0,0)';
      overlay.style.webkitTextFillColor = 'rgba(0,0,0,0)';
      overlay.style.resize = 'none';
      overlay.style.borderColor = 'rgba(0,0,0,0)';

      if (util.browser.isMozilla) {

        var paddingTop = parseFloat(style.paddingTop);
        var paddingBottom = parseFloat(style.paddingBottom);

        var borderTop = parseFloat(style.borderTopWidth);
        var borderBottom = parseFloat(style.borderBottomWidth);

        overlay.style.paddingTop = '0px';
        overlay.style.paddingBottom = '0px';

        overlay.style.height = (content.clientHeight - paddingTop - paddingBottom + borderTop + borderBottom) + 'px';
        overlay.style.top = style.paddingTop;
        overlay.style.boxShadow = 'none';
      }

      if (isMount) {
        this.backgroundColor = backgroundColor;
      }
      overlay.style.backgroundColor = this.backgroundColor;
      content.style.backgroundColor = 'rgba(0,0,0,0)';
    },

    // If the textarea is resized, need to re-sync the styles.
    onResize: function () {
      this.adjustStyles();
    },

    // If the window is resized, may need to re-sync the styles.
    // Probably not necessary with element resize?
    onResizeWindow: function () {
      this.adjustStyles();
    },

    componentDidMount: function () {
      this.adjustStyles(true);
      this.setOnResize('content', this.onResize);
      //this.setOnClickOutside('choices', this.onClickOutsideChoices);
    },

    onInsertFromSelect: function (event) {
      if (event.target.selectedIndex > 0) {
        var tag = event.target.value;
        event.target.selectedIndex = 0;
        var pos = this.tracking.pos;
        var insertPos = this.normalizePosition(pos);
        var tokens = this.tracking.tokens;
        var tokenIndex = this.tokenIndex(insertPos, tokens, this.tracking.indexMap);
        tokens.splice(tokenIndex, 0, {
          type: 'tag',
          value: tag
        });
        this.tracking.indexMap = this.indexMap(tokens);
        var newValue = this.rawValue(tokens);
        this.tracking.pos += this.prettyLabel(tag).length;
        this.props.field.val(newValue);
      }
    },

    onInsert: function (value) {
      var tag = value;
      var pos = this.tracking.pos;
      var endPos = this.tracking.pos + this.tracking.range;
      var insertPos = this.normalizePosition(pos);
      var endInsertPos = this.normalizePosition(endPos);
      var tokens = this.tracking.tokens;
      var tokenIndex = this.tokenIndex(insertPos, tokens, this.tracking.indexMap);
      var tokenEndIndex = this.tokenIndex(endInsertPos, tokens, this.tracking.indexMap);
      tokens.splice(tokenIndex, tokenEndIndex - tokenIndex, {
        type: 'tag',
        value: tag
      });
      this.tracking.indexMap = this.indexMap(tokens);
      var newValue = this.rawValue(tokens);
      this.tracking.pos += this.prettyLabel(tag).length;
      this.props.field.val(newValue);
      this.setState({
        isChoicesOpen: false
      });
    },

    onToggleChoices: function () {
      this.setState({
        isChoicesOpen: !this.state.isChoicesOpen
      });
    },

    onCloseChoices: function () {
      this.setState({
        isChoicesOpen: false
      });
    },

    getCloseIgnoreNodes: function () {
      return this.refs.toggle.getDOMNode();
    },

    onClickOutsideChoices: function () {
      // // If we didn't click on the toggle button, close the choices.
      // if (this.isNodeOutside(this.refs.toggle.getDOMNode(), event.target)) {
      //   console.log('not a toggle click')
      //   this.setState({
      //     isChoicesOpen: false
      //   });
      // }
    },

    onMouseMove: function (event) {
      // Placeholder to get at pill under mouse position. Inefficient, but not
      // sure there's another way.

      var position = {x: event.clientX, y: event.clientY};
      var nodes = this.refs.highlight.getDOMNode().childNodes;
      var matchedNode = null;
      for (var i = 0; i < nodes.length; i++) {
        var node = nodes[i];
        if (nodes[i].getAttribute('data-pretty')) {
          if (positionInNode(position, node)) {
            matchedNode = node;
            break;
          }
        }
      }

      if (matchedNode) {
        if (this.state.hoverPillRef !== matchedNode.getAttribute('data-ref')) {
          this.setState({
            hoverPillRef: matchedNode.getAttribute('data-ref')
          });
        }
      } else if (this.state.hoverPillRef) {
        this.setState({
          hoverPillRef: null
        });
      }
    },

    render: function () {
      var field = this.props.field;

      var replaceChoices = field.def.replaceChoices;

      // var selectReplaceChoices = [{
      //   value: '',
      //   label: 'Insert...'
      // }].concat(replaceChoices);

      return plugin.component('field')({
        field: field
      }, R.div({style: {position: 'relative'}},

        R.pre({
          className: 'pretty-highlight',
          ref: 'highlight'
        },
          this.prettyValue(field.value)
        ),

        R.textarea(_.extend({
          className: util.className(this.props.className, 'pretty-content'),
          ref: 'content',
          rows: field.def.rows || this.props.rows,
          name: field.key,
          value: this.plainValue(field.value),
          onChange: this.onChange,
          onScroll: this.onScroll,
          style: {
            position: 'relative',
            top: 0,
            left: 0,
            cursor: this.state.hoverPillRef ? 'pointer' : null
          },
          onKeyPress: this.onKeyPress,
          onKeyDown: this.onKeyDown,
          onKeyUp: this.onKeyUp,
          onSelect: this.onSelect,
          onCopy: this.onCopy,
          onCut: this.onCut,
          onMouseMove: this.onMouseMove
        }, plugin.config.attributes)),

        R.a({ref: 'toggle', href: 'JavaScript' + ':', onClick: this.onToggleChoices}, 'Insert...'),

        plugin.component('choices')({
          ref: 'choices',
          choices: replaceChoices, open: this.state.isChoicesOpen,
          onSelect: this.onInsert, onClose: this.onCloseChoices, ignoreCloseNodes: this.getCloseIgnoreNodes})
        //,

        // R.select({onChange: this.onInsertFromSelect},
        //   selectReplaceChoices.map(function (choice, i) {
        //     return R.option({
        //       key: i,
        //       value: choice.value
        //     }, choice.label);
        //   })
        // )
      ));
    }
  });
};

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],22:[function(require,module,exports){
(function (global){
// # component.remove-item

/*
Remove an item.
*/

'use strict';

var React = (typeof window !== "undefined" ? window.React : typeof global !== "undefined" ? global.React : null);
var R = React.DOM;

module.exports = function (plugin) {

  plugin.exports = React.createClass({

    displayName: plugin.name,

    getDefaultProps: function () {
      return {
        className: plugin.config.className,
        label: plugin.configValue('label', '[remove]')
      };
    },

    render: function () {
      return R.span({className: this.props.className, onClick: this.props.onClick}, this.props.label);
    }
  });
};

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],23:[function(require,module,exports){
(function (global){
// # component.root

/*
Root component just used to spit out all the fields for a form.
*/

'use strict';

var React = (typeof window !== "undefined" ? window.React : typeof global !== "undefined" ? global.React : null);
var R = React.DOM;

module.exports = function (plugin) {

  var util = plugin.require('util');

  plugin.exports = React.createClass({

    displayName: plugin.name,

    getDefaultProps: function () {
      return {
        className: util.className('root', plugin.config.className)
      };
    },

    render: function () {
      var field = this.props.field;

      return R.div({
        className: this.props.className
      },
        field.fields().map(function (field, i) {
          return field.component({key: field.def.key || i});
        })
      );
    }
  });
};

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],24:[function(require,module,exports){
(function (global){
// # component.help

/*
Just the help text block.
*/

'use strict';

var React = (typeof window !== "undefined" ? window.React : typeof global !== "undefined" ? global.React : null);
var R = React.DOM;

module.exports = function (plugin) {

  plugin.exports = React.createClass({

    displayName: plugin.name,

    getDefaultProps: function () {
      return {
        className: plugin.config.className
      };
    },

    render: function () {

      var choice = this.props.choice;

      return choice.sample ?
        R.div({className: this.props.className},
          choice.sample
        ) :
        R.span(null);
    }
  });
};

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],25:[function(require,module,exports){
(function (global){
// # component.select

/*
Render select element to give a user choices for the value of a field. Note
it should support values other than strings. Currently this is only tested for
boolean values, but it _should_ work for other values.
*/

'use strict';

var React = (typeof window !== "undefined" ? window.React : typeof global !== "undefined" ? global.React : null);
var R = React.DOM;
var _ = (typeof window !== "undefined" ? window._ : typeof global !== "undefined" ? global._ : null);

module.exports = function (plugin) {

  plugin.exports = React.createClass({

    displayName: plugin.name,

    mixins: [plugin.require('mixin.field')],

    getDefaultProps: function () {
      return {
        className: plugin.config.className
      };
    },

    onChange: function (event) {
      var choiceValue = event.target.value;
      var choiceType = choiceValue.substring(0, choiceValue.indexOf(':'));
      if (choiceType === 'choice') {
        var choiceIndex = choiceValue.substring(choiceValue.indexOf(':') + 1);
        choiceIndex = parseInt(choiceIndex);
        this.props.field.val(this.props.field.def.choices[choiceIndex].value);
      }
    },

    render: function () {

      var field = this.props.field;
      var choices = field.def.choices || [];

      var choicesOrLoading;

      if (choices.length === 1 && choices[0].value === '///loading///') {
        choicesOrLoading = R.div({},
          'Loading choices...'
        );
      } else {

        var value = field.value !== undefined ? field.value : '';

        choices = choices.map(function (choice, i) {
          return {
            choiceValue: 'choice:' + i,
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
            choiceValue: 'value:',
            value: value,
            label: label
          };
          choices = [valueChoice].concat(choices);
        }

        choicesOrLoading = R.select({
          className: this.props.className,
          onChange: this.onChange,
          value: valueChoice.choiceValue
        },
          choices.map(function (choice, i) {
            return R.option({
              key: i,
              value: choice.choiceValue
            }, choice.label);
          }.bind(this))
        );
      }

      return plugin.component('field')({
        field: field
      }, choicesOrLoading);
    }
  });
};

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],26:[function(require,module,exports){
(function (global){
// # component.text

/*
Just a simple text input.
*/

'use strict';

var React = (typeof window !== "undefined" ? window.React : typeof global !== "undefined" ? global.React : null);
var R = React.DOM;

module.exports = function (plugin) {

  plugin.exports = React.createClass({

    displayName: plugin.name,

    mixins: [plugin.require('mixin.field')],

    getDefaultProps: function () {
      return {
        className: plugin.config.className
      };
    },

    onChange: function (event) {
      var newValue = event.target.value;
      this.props.field.val(newValue);
    },

    render: function () {

      var field = this.props.field;

      return plugin.component('field')({
        field: field
      }, R.input({
        className: this.props.className,
        type: 'text',
        value: field.value,
        rows: field.def.rows,
        onChange: this.onChange
      }));
    }
  });
};

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],27:[function(require,module,exports){
(function (global){
// # component.textarea

/*
Just a simple multi-row textarea.
*/

'use strict';

var React = (typeof window !== "undefined" ? window.React : typeof global !== "undefined" ? global.React : null);
var R = React.DOM;

module.exports = function (plugin) {

  plugin.exports = React.createClass({

    displayName: plugin.name,

    mixins: [plugin.require('mixin.field')],

    getDefaultProps: function () {
      return {
        className: plugin.config.className,
        rows: plugin.config.rows || 5
      };
    },

    onChange: function (event) {
      var newValue = event.target.value;
      this.props.field.val(newValue);
    },

    render: function () {

      var field = this.props.field;

      return plugin.component('field')({
        field: field
      }, R.textarea({
        className: this.props.className,
        value: field.value,
        rows: field.def.rows || this.props.rows,
        onChange: this.onChange
      }));
    }
  });
};

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],28:[function(require,module,exports){
(function (global){
// # core.field

/*
The core field plugin provides the Field prototype. Fields represent a
particular state in time of a field definition, and they provide helper methods
to notify the form store of changes.

Fields are lazily created and evaluated, but once evaluated, they should be
considered immutable.
*/

'use strict';

var _ = (typeof window !== "undefined" ? window._ : typeof global !== "undefined" ? global._ : null);

module.exports = function (plugin) {

  var router = plugin.require('field-router');
  var util = plugin.require('util');
  var evaluator = plugin.require('eval');
  var compiler = plugin.require('compiler');

  // The Field constructor.
  var Field = function (form, def, value, parent) {
    var field = this;

    field.form = form;
    field.def = def;
    field.value = value;
    field.parent = parent;
    field.groups = {};
    field.tempChildren = [];
  };

  // Attach a field factory to the form prototype.
  plugin.exports.field = function () {
    var form = this;

    return new Field(form, {
      type: 'root'
    }, form.store.value);
  };

  var proto = Field.prototype;

  // Return the type plugin for this field.
  proto.typePlugin = function () {
    var field = this;

    if (!field._typePlugin) {
      field._typePlugin = plugin.require('type.' + field.def.type);
    }

    return field._typePlugin;
  };

  // Get a component for this field.
  proto.component = function (props) {
    var field = this;
    props = _.extend({}, props, {field: field});
    var component = router.componentForField(field);
    return component(props);
  };

  // Get the child fields for this field.
  proto.fields = function () {
    var field = this;

    if (!field._fields) {
      var fields;
      if (field.typePlugin().fields) {
        fields = field.typePlugin().fields(field);
      } else if (field.def.fields) {
        fields = field.def.fields.map(function (def) {
          return field.createChild(def);
        });
      } else {
        fields = [];
      }
      field._fields = fields;
    }

    return field._fields;
  };

  // Get the items (child field definitions) for this field.
  proto.items = function () {
    var field = this;

    if (!field._items) {
      if (_.isArray(field.def.items)) {
        field._items = field.def.items.map(function (item) {
          return field.resolve(item);
        });
      } else {
        field._items = [];
      }
    }

    return field._items;
  };

  // Resolve a field reference if necessary.
  proto.resolve = function (def) {
    var field = this;

    if (_.isString(def)) {
      def = field.form.findDef(def);
      if (!def) {
        throw new Error('Could not find field: ' + def);
      }
    }

    return def;
  };

  // Evaluate a field definition and return a new field definition.
  proto.evalDef = function (def) {
    var field = this;

    if (def.eval) {

      try {
        var extDef = field.eval(def.eval);
        if (extDef) {
          def = _.extend({}, def, extDef);
          if (def.fields) {
            def.fields = def.fields.map(function (childDef) {
              childDef = compiler.expandDef(childDef, field.form.store.templateMap);
              return compiler.compileDef(childDef);
            });
          }
          def = compiler.compileDef(def);
        }
      } catch (e) {
        console.log('Problem in eval: ', JSON.stringify(def.eval));
        console.log(e.message);
        console.log(e.stack);
      }
    }

    return def;
  };

  // Evaluate an expression in the context of a field.
  proto.eval = function (expression, context) {
    return evaluator.evaluate(expression, this, context);
  };

  // Create a child field from a definition.
  proto.createChild = function (def) {
    var field = this;

    def = field.resolve(def);

    var value = field.value;

    def = field.evalDef(def);

    if (!util.isBlank(def.key)) {
      if (value && !_.isUndefined(value[def.key])) {
        value = value[def.key];
      } else {
        value = undefined;
      }
    } else {
      value = def.value;
    }

    var childField = new Field(field.form, def, value, field);

    field.tempChildren.push(childField);

    return childField;

    // if (def.eval) {
    //   def = childField.evalDef(def);
    //   if (util.isBlank(def.key)) {
    //     value = def.value;
    //   }
    //   childField = new Field(field.form, def, value, field);
    // }
    //
    // return childField;
  };

  // Given a value, find an appropriate field definition for this field.
  proto.itemForValue = function (value) {
    var field = this;

    var item = _.find(field.items(), function (item) {
      return util.itemMatchesValue(item, value);
    });
    if (item) {
      item = _.extend({}, item);
    } else {
      item = util.fieldDefFromValue(value);
    }

    return item;
  };

  // Get all the fields belonging to a group.
  proto.groupFields = function (groupName, ignoreTempChildren) {
    var field = this;

    if (!field.groups[groupName]) {
      field.groups[groupName] = [];

      if (field.parent) {
        var siblings = field.parent.fields();
        siblings.forEach(function (sibling) {
          if (sibling !== field && sibling.def.group === groupName) {
            field.groups[groupName].push(sibling);
          }
        });
        var parentGroupFields = field.parent.groupFields(groupName, true);
        field.groups[groupName] = field.groups[groupName].concat(parentGroupFields);
      }
    }

    if (!ignoreTempChildren && field.groups[groupName].length === 0) {
      // looking at children so far
      var childGroupFields = [];
      field.tempChildren.forEach(function (child) {
        if (child.def.group === groupName) {
          childGroupFields.push(child);
        }
      });
      return childGroupFields;
    }

    return field.groups[groupName];
  };

  // Walk backwards through parents and build out a path array to the value.
  proto.valuePath = function (childPath) {
    var field = this;

    var path = childPath || [];
    if (!util.isBlank(field.def.key)) {
      path = [field.def.key].concat(path);
    }
    if (field.parent) {
      return field.parent.valuePath(path);
    }
    return path;
  };

  // Set the value for this field.
  proto.val = function (value) {
    var field = this;

    field.form.actions.setValue(field.valuePath(), value);
  };

  // Remove a child value from this field.
  proto.remove = function (key) {
    var field = this;

    var path = field.valuePath().concat(key);

    field.form.actions.removeValue(path);
  };

  // Move a child value from one key to another.
  proto.move = function (fromKey, toKey) {
    var field = this;

    field.form.actions.moveValue(field.valuePath(), fromKey, toKey);
  };

  // Get the default value for this field.
  proto.default = function () {
    var field = this;

    if (!_.isUndefined(field.def.value)) {
      return util.copyValue(field.def.value);
    }

    if (!_.isUndefined(field.def.default)) {
      return util.copyValue(field.def.default);
    }

    if (!_.isUndefined(field.typePlugin().default)) {
      return util.copyValue(field.typePlugin().default);
    }

    return null;
  };

  // Append a new value. Use the `itemIndex` to get an appropriate
  // item, inflate it, and create a default value.
  proto.append = function (itemIndex) {
    var field = this;

    var item = field.items()[itemIndex];
    item = _.extend(item);

    item.key = field.value.length;

    var child = field.createChild(item);

    var obj = child.default();

    if (_.isArray(obj) || _.isObject(obj)) {
      var chop = field.valuePath().length + 1;

      child.inflate(function (path, value) {
        obj = util.setIn(obj, path.slice(chop), value);
      });
    }

    field.form.actions.appendValue(field.valuePath(), obj);
  };

  // Determine whether the field is hidden.
  proto.hidden = function () {
    var field = this;

    return field.def.hidden || field.typePlugin().hidden;
  };

  // Expand all child fields and call the setter function with the default
  // values at each path.
  proto.inflate = function (onSetValue) {
    var field = this;

    if (!util.isBlank(field.def.key) && _.isUndefined(field.value)) {
      onSetValue(field.valuePath(), field.default());
    }

    var fields = field.fields();

    fields.forEach(function (child) {
      child.inflate(onSetValue);
    });
  };

  // Called from unmount. When fields are removed for whatever reason, we
  // should delete the corresponding value.
  proto.erase = function () {
    var field = this;
    if (!util.isBlank(field.def.key) && !_.isUndefined(field.value)) {
      field.form.actions.eraseValue(field.valuePath(), {});
    }
  };
};

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],29:[function(require,module,exports){
// # core.form-init

/*
This plugin makes it easy to hook into form initialization, without having to
configure all the other core plugins.
*/

'use strict';

module.exports = function (plugin) {

  var initPlugins = plugin.requireAll(plugin.config.init);

  var proto = plugin.exports;

  proto.init = function () {
    var form = this;

    initPlugins.forEach(function (plugin) {
      plugin.apply(form, arguments);
    });
  };
};

},{}],30:[function(require,module,exports){
(function (global){
// # core.form

/*
The core form plugin supplies methods that get added to the Form prototype.
*/

'use strict';

var _ = (typeof window !== "undefined" ? window._ : typeof global !== "undefined" ? global._ : null);
var EventEmitter = require('eventemitter3');

module.exports = function (plugin) {

  var proto = plugin.exports;

  // Get the store plugin.
  var createStore = plugin.require(plugin.config.store);

  var util = plugin.require('util');
  var loader = plugin.require('loader');

  // Helper to create actions, which will tell the store that something has
  // happened. Note that actions go straight to the store. No events,
  // dispatcher, etc.
  var createSyncActions = function (store, names) {
    var actions = {};
    names.forEach(function (name) {
      actions[name] = function () {
        store[name].apply(store, arguments);
      };
    });
    return actions;
  };

  // Initialize the form instance.
  proto.init = function (options) {
    var form = this;

    options = options || {};

    // Need an emitter to emit change events from the store.
    var storeEmitter = new EventEmitter();

    // Create a store.
    form.store = createStore(form, storeEmitter, options);

    // Create the actions to notify the store of changes.
    form.actions = createSyncActions(form.store, ['setValue', 'setFields', 'removeValue', 'appendValue', 'moveValue', 'eraseValue', 'setMeta']);

    // Seed the value from any fields.
    form.store.inflate();

    // Add on/off to get change events from form.
    form.on = storeEmitter.on.bind(storeEmitter);
    form.off = storeEmitter.off.bind(storeEmitter);
    form.once = storeEmitter.once.bind(storeEmitter);
  };

  // Get or set the value of a form.
  proto.val = function (value) {
    var form = this;

    if (!_.isUndefined(value)) {
      return form.actions.setValue(value);
    }

    return util.copyValue(form.store.value);
  };

  // Set/change the fields for a form.
  proto.fields = function (fields) {
    var form = this;

    form.actions.setFields(fields);
  };

  // Find a field template given a key.
  proto.findDef = function (key) {
    var form = this;

    return form.store.templateMap[key] || null;
  };

  // Get or set metadata.
  proto.meta = function (key, value) {
    var form = this;

    if (!_.isUndefined(value)) {
      return form.actions.setMeta(key, value);
    }

    return form.store.meta[key];
  };

  // Load metadata.
  proto.loadMeta = function (source, params) {
    params = params || {};
    var keys = Object.keys(params);
    var validKeys = keys.filter(function (key) {
      return params[key];
    });
    if (validKeys.length < keys.length) {
      return;
    }
    loader.loadMeta(this, source, params);
  };

  // Add a metdata source function, via the loader plugin.
  proto.source = loader.source;
};

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"eventemitter3":58}],31:[function(require,module,exports){
(function (global){
// # core.formatic

/*
The core formatic plugin adds methods to the formatic instance.
*/

'use strict';

var React = (typeof window !== "undefined" ? window.React : typeof global !== "undefined" ? global.React : null);

module.exports = function (plugin) {

  var f = plugin.exports;

  // Use the field-router plugin as the router.
  var router = plugin.require('field-router');

  // Route a field to a component.
  f.route = router.route;

  // Render a component to a node.
  f.render = function (component, node) {

    React.renderComponent(component, node);
  };
};

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],32:[function(require,module,exports){
(function (global){
// # compiler

// The compiler plugin knows how to normalize field definitions into standard
// field definitions that can be understood be routers and components.

'use strict';

var _ = (typeof window !== "undefined" ? window._ : typeof global !== "undefined" ? global._ : null);

module.exports = function (plugin) {

  // Grab all the compiler plugins which can be stacked.
  var compilerPlugins = plugin.requireAll(plugin.config.compilers);

  var util = plugin.require('util');

  var compiler = plugin.exports;

  // For a set of fields, make a map of template names to field definitions. All
  // field definitions can be used as templates, whether marked as templates or
  // not.
  compiler.templateMap = function (fields) {
    var map = {};
    fields.forEach(function (field) {
      if (field.key) {
        map[field.key] = field;
      }
      if (field.id) {
        map[field.id] = field;
      }
    });
    return map;
  };

  // Fields and items can extend other field definitions. Fields can also have
  // child fields that point to other field definitions. Here, we expand all
  // those out so that components don't have to worry about this.
  compiler.expandDef = function (def, templateMap) {
    var isTemplate = def.template;
    var ext = def.extends;
    if (_.isString(ext)) {
      ext = [ext];
    }
    if (ext) {
      var bases = ext.map(function (base) {
        var template = templateMap[base];
        if (!template) {
          throw new Error('Template ' + base + ' not found.');
        }
        return template;
      });
      var chain = [{}].concat(bases.reverse().concat([def]));
      def = _.extend.apply(_, chain);
    }
    if (def.fields) {
      def.fields = def.fields.map(function (childDef) {
        if (!_.isString(childDef)) {
          return compiler.expandDef(childDef, templateMap);
        }
        return childDef;
      });
    }
    if (def.items) {
      def.items = def.items.map(function (itemDef) {
        if (!_.isString(itemDef)) {
          return compiler.expandDef(itemDef, templateMap);
        }
        return itemDef;
      });
    }
    if (!isTemplate && def.template) {
      delete def.template;
    }
    return def;
  };

  // For an array of field definitions, expand each field definition.
  compiler.expandFields = function (fields) {
    var templateMap = compiler.templateMap(fields);
    return fields.map(function (def) {
      return compiler.expandDef(def, templateMap);
    });
  };

  // Run a field definition through all available compilers.
  compiler.compileDef = function (def) {

    //console.log('in:', JSON.stringify(def))

    def = util.deepCopy(def);

    var result;
    compilerPlugins.forEach(function (plugin) {
      result = plugin.compile(def);
      if (result) {
        def = result;
      }
    });

    var typePlugin = plugin.require('type.' + def.type);

    if (typePlugin.compile) {
      result = typePlugin.compile(def);
      if (result) {
        def = result;
      }
    }

    if (def.fields) {
      // Compile any inline fields.
      def.fields = def.fields.map(function (childDef) {
        if (_.isObject(childDef)) {
          return compiler.compileDef(childDef);
        }
        return childDef;
      });
    }

    //console.log('out:', JSON.stringify(def))

    return def;
  };

  // For an array of field definitions, compile each field definition.
  compiler.compileFields = function (fields) {
    return fields.map(function (field) {
      return compiler.compileDef(field);
    });
  };
};

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],33:[function(require,module,exports){
(function (global){
// # component

// At its most basic level, the component plugin simply maps component names to
// plugin names, returning the component factory for that component. For
// example, `plugin.component('text')` becomes
// `plugin.require('component.text')`. This is a useful placholder in case we
// later want to make formatic able to decide components at runtime. For now,
// however, this allows us to inject "prop modifiers" which are plugins that
// modify a components properties before it receives them.

'use strict';

var React = (typeof window !== "undefined" ? window.React : typeof global !== "undefined" ? global.React : null);

module.exports = function (plugin) {

  // Registry for prop modifiers.
  var propModifiers = {};

  // Add a "prop modifer" which is just a function that modifies a components
  // properties before it receives them.
  var addPropModifier = function (name, modifyFn) {
    if (!propModifiers[name]) {
      propModifiers[name] = [];
    }
    propModifiers[name].push(modifyFn);
  };

  // Grab all the prop modifier plugins.
  var propsPlugins = plugin.requireAll(plugin.config.props);

  // Register all the prop modifier plugins.
  propsPlugins.forEach(function (plugin) {
    addPropModifier.apply(null, plugin);
  });

  // Registry for component factories. Since we'll be modifying the props going
  // to the factories, we'll store our own component factories here.
  var componentFactories = {};

  // Retrieve the appropriate component factory, which may be a wrapper that
  // runs the component properties through prop modifier functions.
  plugin.exports.component = function (name) {

    if (!componentFactories[name]) {
      var component = React.createFactory(plugin.require('component.' + name));
      componentFactories[name] = function (props, children) {
        if (propModifiers[name]) {
          propModifiers[name].forEach(function (modify) {
            var result = modify(props);
            if (result) {
              props = result;
            }
          });
        }
        return component(props, children);
      };
    }
    return componentFactories[name];
  };
};

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],34:[function(require,module,exports){
(function (global){
// # core

// The core plugin exports a function that takes a formatic instance and
// extends the instance with additional methods.

'use strict';

var _ = (typeof window !== "undefined" ? window._ : typeof global !== "undefined" ? global._ : null);

module.exports = function (plugin) {

  plugin.exports = function (formatic) {

    // The core plugin really doesn't do much. It actually relies on other
    // plugins to do the dirty work. This way, you can easily add additional
    // plugins to do more dirty work.
    var formaticPlugins = plugin.requireAll(plugin.config.formatic);

    // We have special form plugins which are just used to modify the Form
    // prototype.
    var formPlugins = plugin.requireAll(plugin.config.form);

    // Pass the formatic instance off to each of the formatic plugins.
    formaticPlugins.forEach(function (f) {
      _.keys(f).forEach(function (key) {
        if (!_.isUndefined(formatic[key])) {
          throw new Error('Property already defined for formatic: ' + key);
        }
        formatic[key] = f[key];
      });
    });

    // ## Form prototype

    // The Form constructor creates a form given a set of options. Options
    // can have `fields` and `value`.
    var Form = function (options) {
      if (this.init) {
        this.init(options);
      }
    };

    // Add the form factory to the formatic instance.
    formatic.form = function (options) {
      return new Form(options);
    };

    Form.prototype = formatic.form;

    // Keep form init methods here.
    var inits = [];

    // Go through form plugins and add each plugin's methods to the form
    // prototype.
    formPlugins.forEach(function (proto) {
      _.keys(proto).forEach(function (key) {
        // Init plugins can be stacked.
        if (key === 'init') {
          inits.push(proto[key]);
        } else {
          if (!_.isUndefined(Form.prototype[key])) {
            throw new Error('Property already defined for form: ' + key);
          }
          Form.prototype[key] = proto[key];
        }
      });
    });

    // Create an init method for the form prototype based on the available init
    // methods.
    if (inits.length === 0) {
      Form.prototype.init = function () {};
    } else if (inits.length === 1) {
      Form.prototype.init = inits[0];
    } else {
      Form.prototype.init = function () {
        var form = this;
        var args = arguments;

        inits.forEach(function (init) {
          init.apply(form, args);
        });
      };
    }
  };
};

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],35:[function(require,module,exports){
(function (global){
// # eval-functions

/*
Default eval functions. Each function is part of its own plugin, but all are
kept together here as part of a plugin bundle.

Note that eval functions decide when their arguments get evaluated. This way,
you can create control structures (like if) that conditionally evaluates its
arguments.
*/

'use strict';

var _ = (typeof window !== "undefined" ? window._ : typeof global !== "undefined" ? global._ : null);

var wrapFn = function (fn) {
  return function (plugin) {
    plugin.exports = function (args, field, context) {
      args = field.eval(args, context);
      var result = fn.apply(null, args);
      return result;
    };
  };
};

var methodCall = function (method) {
  return function (plugin) {
    plugin.exports = function (args, field, context) {
      args = field.eval(args, context);
      if (args.length > 0) {
        return args[0][method].apply(args[0], args.slice(1));
      }
    };
  };
};

var plugins = {
  if: function (plugin) {
    plugin.exports = function (args, field, context) {
      return field.eval(args[0], context) ? field.eval(args[1], context) : field.eval(args[2], context);
    };
  },

  eq: function (plugin) {
    plugin.exports = function (args, field, context) {
      return field.eval(args[0], context) === field.eval(args[1], context);
    };
  },

  not: function (plugin) {
    plugin.exports = function (args, field, context) {
      return !field.eval(args[0], context);
    };
  },

  or: function (plugin) {
    plugin.exports = function (args, field, context) {
      for (var i = 0; i < args.length; i++) {
        var arg = field.eval(args[i], context);
        if (arg) {
          return arg;
        }
      }
      return args[args.length - 1];
    };
  },

  and: function (plugin) {
    plugin.exports = function (args, field, context) {
      for (var i = 0; i < args.length; i++) {
        var arg = field.eval(args[i], context);
        if (!arg || i === (args.length - 1)) {
          return arg;
        }
      }
      return undefined;
    };
  },

  get: function (plugin) {
    var get = plugin.exports = function (args, field, context) {
      var util = plugin.require('util');
      var key = field.eval(args[0], context);
      var obj;
      if (context && key in context) {
        obj = context[key];
      } else if (_.isObject(field.value) && key in field.value) {
        obj = field.value[key];
      } else if (field.parent) {
        obj = get(args, field.parent);
      }
      if (args.length > 1) {
        var getInKeys = field.eval(args.slice(1), context);
        return util.getIn(obj, getInKeys);
      }
      return obj;
    };
  },

  getGroupValues: function (plugin) {
    plugin.exports = function (args, field, context) {

      var groupName = field.eval(args[0], context);

      var groupFields = field.groupFields(groupName);

      return groupFields.map(function (field) {
        return field.value;
      });
    };
  },

  getMeta: function (plugin) {
    var util = plugin.require('util');
    plugin.exports = function (args, field, context) {
      args = field.eval(args, context);
      var cacheKey = util.metaCacheKey(args[0], args[1]);
      return field.form.meta(cacheKey);
    };
  },

  sum: function (plugin) {
    plugin.exports = function (args, field, context) {
      var sum = 0;
      for (var i = 0; i < args.length; i++) {
        sum += field.eval(args[i], context);
      }
      return sum;
    };
  },

  forEach: function (plugin) {
    plugin.exports = function (args, field, context) {
      var itemName = args[0];
      var array = field.eval(args[1], context);
      var mapExpr = args[2];
      var filterExpr = args[3];
      context = Object.create(context || {});

      var results = [];

      for (var i = 0; i < array.length; i++) {
        var item = array[i];
        context[itemName] = item;
        if (_.isUndefined(filterExpr) || field.eval(filterExpr, context)) {
          results.push(field.eval(mapExpr, context));
        }
      }

      return results;
    };
  },

  concat: methodCall('concat'),
  split: methodCall('split'),
  reverse: methodCall('reverse'),
  join: methodCall('join'),

  humanize: function (plugin) {
    var util = plugin.require('util');
    plugin.exports = function (args, field, context) {
      return util.humanize(field.eval(args[0], context));
    };
  },

  pick: wrapFn(_.pick),
  pluck: wrapFn(_.pluck)
};

// Build a plugin bundle.
_.each(plugins, function (fn, name) {
  module.exports['eval-function.' + name] = fn;
});

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],36:[function(require,module,exports){
(function (global){
// # eval

/*
The eval plugin will evaluate a field's `eval` property (which must be an
object) and exchange the properties of that object for whatever the
expression returns. Expressions are just JSON except if the first element of
an array is a string that starts with '@'. In that case, the array is
treated as a Lisp expression where the first element refers to a function
that is called with the rest of the elements as the arguments. For example:

```js
['@sum', 1, 2]
```

will return the value 3. The expression could be used in an `eval` property of
a field like:

```js
{
  type: 'string',
  key: 'name',
  eval: {
    rows: ['@sum', 1, 2]
  }
}
```

The `rows` property of the field would be set to 3 in this case.

Any plugin registered with the prefix `eval-function.` will be available as a
function in these expressions.
*/

'use strict';

var _ = (typeof window !== "undefined" ? window._ : typeof global !== "undefined" ? global._ : null);

module.exports = function (plugin) {

  // Grab all the function plugins.
  var evalFunctionPlugins = plugin.requireAllOf('eval-function');

  // Just strip off the 'eval-functions.' prefix and put in a different object.
  var functions = {};
  _.each(evalFunctionPlugins, function (fn, name) {
    var fnName = name.substring(name.indexOf('.') + 1);
    functions[fnName] = fn;
  });

  // Check an array to see if it's a function expression.
  var isFunctionArray = function (array) {
    return array.length > 0 && array[0][0] === '@';
  };

  // Evaluate a function expression and return the result.
  var evalFunction = function (fnArray, field, context) {
    var fnName = fnArray[0].substring(1);
    try {
      return functions[fnName](fnArray.slice(1), field, context);
    } catch (e) {
      if (!(fnName in functions)) {
        throw new Error('Eval function ' + fnName + ' not defined.');
      }
      throw e;
    }
  };

  // Evaluate an expression in the context of a field.
  var evaluate = function (expression, field, context) {
    if (_.isArray(expression)) {
      if (isFunctionArray(expression)) {
        return evalFunction(expression, field, context);
      } else {
        return expression.map(function (item) {
          return evaluate(item, field, context);
        });
      }
    } else if (_.isObject(expression)) {
      var obj = {};
      Object.keys(expression).forEach(function (key) {
        var result = evaluate(expression[key], field, context);
        if (typeof result !== 'undefined') {
          obj[key] = result;
        }
      });
      return obj;
    } else if (_.isString(expression) && expression[0] === '=') {
      return functions.get([expression.substring(1)], field, context);
    } else {
      return expression;
    }
  };

  plugin.exports.evaluate = evaluate;
};

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],37:[function(require,module,exports){
(function (global){
// # field-router

/*
Fields and components get glued together via routes. This is similar to URL
routing where a request gets dynamically routed to a handler. This gives a lot
of flexibility in introducing new types and components. You can create a new
type and route it to an existing component, or you can create a new component
and route existing types to it. Or you can create both and route the new type
to the new component. New routes are added via route plugins. A route plugin
simply exports an array like:

```js
[
  'color', // Route this type
  'color-picker-with-alpha', // To this component
  function (field) {
    return typeof field.def.alpha !== 'undefined';
  }
]

Route plugins can be stacked and are sensitive to ordering.
*/

'use strict';

var _ = (typeof window !== "undefined" ? window._ : typeof global !== "undefined" ? global._ : null);

module.exports = function (plugin) {

  var routes = {};

  var router = plugin.exports;

  // Get all the route plugins.
  var routePlugins = plugin.requireAll(plugin.config.routes);

  // Register a route.
  router.route = function (typeName, componentName, testFn) {
    if (!routes[typeName]) {
      routes[typeName] = [];
    }
    routes[typeName].push({
      component: componentName,
      test: testFn
    });
  };

  // Register each of the routes provided by the route plugins.
  routePlugins.forEach(function (routePlugin) {

    router.route.apply(router, routePlugin);
  });

  // Determine the best component for a field, based on the routes.
  router.componentForField = function (field) {

    var typeName = field.def.type;

    if (routes[typeName]) {
      var routesForType = routes[typeName];
      var route = _.find(routesForType, function (route) {
        return !route.test || route.test(field);
      });
      if (route) {
        return plugin.component(route.component);
      }
    }

    if (plugin.hasComponent(typeName)) {
      return plugin.component(typeName);
    }

    throw new Error('No component for field: ' + JSON.stringify(field.def));
  };
};

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],38:[function(require,module,exports){
(function (global){
// # field-routes

/*
Default routes. Each route is part of its own plugin, but all are kept together
here as part of a plugin bundle.
*/

'use strict';

var _ = (typeof window !== "undefined" ? window._ : typeof global !== "undefined" ? global._ : null);

var routes = {

  'object.default': [
    'object',
    'fieldset'
  ],

  'string.choices': [
    'string',
    'select',
    function (field) {
      return field.def.choices ? true : false;
    }
  ],

  'string.tags': [
    'string',
    'pretty-textarea',
    function (field) {
      return field.def.replaceChoices;
    }
  ],

  'string.single-line': [
    'string',
    'text',
    function (field) {
      return field.def.maxRows === 1;
    }
  ],

  'string.default': [
    'string',
    'textarea'
  ],

  'array.choices': [
    'array',
    'checkbox-list',
    function (field) {
      return field.def.choices ? true : false;
    }
  ],

  'array.default': [
    'array',
    'list'
  ],

  'boolean.default': [
    'boolean',
    'select'
  ],

  'number.default': [
    'number',
    'text'
  ]

};

// Build a plugin bundle.
_.each(routes, function (route, name) {
  module.exports['field-route.' + name] = function (plugin) {
    plugin.exports = route;
  };
});

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],39:[function(require,module,exports){
// # loader

/*
When metadata isn't available, we ask the loader to load it. The loader will
try to find an appropriate source based on the metadata keys.

Note that we ask the loader to load metadata with a set of keys like
`['foo', 'bar']`, but those are converted to a single key like `foo::bar` for
the sake of caching.
*/

'use strict';

module.exports = function (plugin) {

  var util = plugin.require('util');

  var loader = plugin.exports;

  var isLoading = {};
  var sources = {};

  // Load metadata for a given form and params.
  loader.loadMeta = function (form, source, params) {
    var cacheKey = util.metaCacheKey(source, params);

    if (isLoading[cacheKey]) {
      return;
    }

    isLoading[cacheKey] = true;

    loader.loadAsyncFromSource(form, source, params);
  };

  // Make sure to load metadata asynchronously.
  loader.loadAsyncFromSource = function (form, source, params, waitTime) {
    setTimeout(function () {
      loader.loadFromSource(form, source, params);
    }, waitTime || 0);
  };

  // Load metadata for a form and params.
  loader.loadFromSource = function (form, sourceName, params) {

    // Find the best source for this cache key.
    var source = sources[sourceName];
    if (source) {

      var cacheKey = util.metaCacheKey(sourceName, params);

      // Call the source function.
      var result = source.call(null, params);

      if (result) {
        // Result could be a promise.
        if (result.then) {
          var promise = result.then(function (result) {
            form.meta(cacheKey, result);
            isLoading[cacheKey] = false;
          });

          var onError = function () {
            isLoading[cacheKey] = false;
          };

          if (promise.catch) {
            promise.catch(onError);
          } else {
            // silly jQuery promises
            promise.fail(onError);
          }
        // Or it could be a value. In that case, make sure to asyncify it.
        } else {
          setTimeout(function () {
            form.meta(cacheKey, result);
            isLoading[cacheKey] = false;
          }, 0);
        }
      } else {
        isLoading[cacheKey] = false;
      }

    } else {
      isLoading[cacheKey] = false;
    }
  };

  // Register a source function.
  loader.source = function (name, fn) {

    sources[name] = fn;
  };

};

},{}],40:[function(require,module,exports){
(function (global){
// # util

// Some utility functions to be used by other plugins.

'use strict';

var _ = (typeof window !== "undefined" ? window._ : typeof global !== "undefined" ? global._ : null);

module.exports = function (plugin) {

  var util = plugin.exports;

  // Check if a value is "blank".
  util.isBlank = function (value) {
    return value === undefined || value === null || value === '';
  };

  // Set value at some path in object.
  util.setIn = function (obj, path, value) {
    if (_.isString(path)) {
      path = [path];
    }
    if (path.length === 0) {
      return value;
    }
    if (path.length === 1) {
      obj[path[0]] = value;
      return obj;
    }
    if (!obj[path[0]]) {
      obj[path[0]] = {};
    }
    util.setIn(obj[path[0]], path.slice(1), value);
    return obj;
  };

  // Remove value at path in some object.
  util.removeIn = function (obj, path) {
    if (_.isString(path)) {
      path = [path];
    }
    if (path.length === 0) {
      return null;
    }
    if (path.length === 1) {
      if (_.isArray(obj)) {
        if (_.isNumber(path[0])) {
          obj.splice(path[0], 1);
        }
      } else if (_.isObject(obj)) {
        delete obj[path[0]];
      }
      return obj;
    }
    if (obj[path[0]]) {
      util.removeIn(obj[path[0]], path.slice(1));
    }
    return obj;
  };

  // Get value at path in some object.
  util.getIn = function (obj, path) {
    if (_.isString(path)) {
      path = [path];
    }
    if (path.length === 0) {
      return obj;
    }
    if (_.isObject(obj) && path[0] in obj) {
      return util.getIn(obj[path[0]], path.slice(1));
    }
    return null;
  };

  // Append to array at path in some object.
  util.appendIn = function (obj, path, value) {
    var subObj = util.getIn(obj, path);
    if (_.isArray(subObj)) {
      subObj.push(value);
    }
    return obj;
  };

  // Swap two keys at path in some object.
  util.moveIn = function (obj, path, fromKey, toKey) {
    var subObj = util.getIn(obj, path);
    if (_.isArray(subObj)) {
      if (_.isNumber(fromKey) && _.isNumber(toKey)) {
        var fromIndex = fromKey;
        var toIndex = toKey;
        if (fromIndex !== toIndex &&
          fromIndex >= 0 && fromIndex < subObj.length &&
          toIndex >= 0 && toIndex < subObj.length
        ) {
          subObj.splice(toIndex, 0, subObj.splice(fromIndex, 1)[0]);
        }
      }
    } else {
      var fromValue = subObj[fromKey];
      subObj[fromKey] = subObj[toKey];
      subObj[toKey] = fromValue;
    }
    return obj;
  };

  // Copy obj, leaving non-JSON behind.
  util.copyValue = function (value) {
    return JSON.parse(JSON.stringify(value));
  };

  // Copy obj recursing deeply.
  util.deepCopy = function (obj) {
    if (_.isArray(obj)) {
      return obj.map(function (item) {
        return util.deepCopy(item);
      });
    } else if (_.isObject(obj)) {
      var copy = {};
      _.each(obj, function (value, key) {
        copy[key] = util.deepCopy(value);
      });
      return copy;
    } else {
      return obj;
    }
  };

  // Check if item matches some value, based on the item's `match` property.
  util.itemMatchesValue = function (item, value) {
    var match = item.match;
    if (!match) {
      return true;
    }
    return _.every(_.keys(match), function (key) {
      return _.isEqual(match[key], value[key]);
    });
  };

  // Create a field definition from a value.
  util.fieldDefFromValue = function (value) {
    var def = {
      type: 'json'
    };
    if (_.isString(value)) {
      def = {
        type: 'string'
      };
    } else if (_.isNumber(value)) {
      def = {
        type: 'number'
      };
    } else if (_.isArray(value)) {
      var arrayItemFields = value.map(function (value, i) {
        var childDef = util.fieldDefFromValue(value);
        childDef.key = i;
        return childDef;
      });
      def = {
        type: 'array',
        fields: arrayItemFields
      };
    } else if (_.isObject(value)) {
      var objectItemFields = Object.keys(value).map(function (key) {
        var childDef = util.fieldDefFromValue(value[key]);
        childDef.key = key;
        childDef.label = util.humanize(key);
        return childDef;
      });
      def = {
        type: 'object',
        fields: objectItemFields
      };
    } else if (_.isNull(value)) {
      def = {
        type: 'null'
      };
    }
    return def;
  };

  if (plugin.config.humanize) {
    // Get the humanize function from a plugin if provided.
    util.humanize = plugin.require(plugin.config.humanize);
  } else {
    // Convert property keys to "human" labels. For example, 'foo' becomes
    // 'Foo'.
    util.humanize = function(property) {
      property = property.replace(/\{\{/g, '');
      property = property.replace(/\}\}/g, '');
      return property.replace(/_/g, ' ')
        .replace(/(\w+)/g, function(match) {
          return match.charAt(0).toUpperCase() + match.slice(1);
        });
    };
  }

  // Join multiple CSS class names together, ignoring any that aren't there.
  util.className = function () {

    var classNames = Array.prototype.slice.call(arguments, 0);

    classNames = classNames.filter(function (name) {
      return name;
    });

    return classNames.join(' ');
  };

  // Join keys together to make single "meta" key. For looking up metadata in
  // the metadata part of the store.
  util.joinMetaKeys = function (keys) {
    return keys.join('::');
  };

  // Split a joined key into separate key parts.
  util.splitMetaKey = function (key) {
    return key.split('::');
  };

  util.metaCacheKey = function (source, params) {
    params = params || {};
    return source + '::params(' + JSON.stringify(params) + ')';
  };

  // Wrap a text value so it has a type. For parsing text with tags.
  var textPart = function (value, type) {
    type = type || 'text';
    return {
      type: type,
      value: value
    };
  };

  // Parse text that has tags like {{tag}} into text and tags.
  util.parseTextWithTags = function (value) {
    value = value || '';
    var parts = value.split(/{{(?!{)/);
    var frontPart = [];
    if (parts[0] !== '') {
      frontPart = [
        textPart(parts[0])
      ];
    }
    parts = frontPart.concat(
      parts.slice(1).map(function (part) {
        if (part.indexOf('}}') >= 0) {
          return [
            textPart(part.substring(0, part.indexOf('}}')), 'tag'),
            textPart(part.substring(part.indexOf('}}') + 2))
          ];
        } else {
          return textPart('{{' + part, 'text');
        }
      })
    );
    return [].concat.apply([], parts);
  };

  // Copy all computed styles from one DOM element to another.
  util.copyElementStyle = function (fromElement, toElement) {
    var fromStyle = window.getComputedStyle(fromElement, '');

    if (fromStyle.cssText !== '') {
      toElement.style.cssText = fromStyle.cssText;
      return;
    }

    var cssRules = [];
    for (var i = 0; i < fromStyle.length; i++) {
      //console.log(i, fromStyle[i], fromStyle.getPropertyValue(fromStyle[i]))
      //toElement.style[fromStyle[i]] = fromStyle.getPropertyValue(fromStyle[i]);
      cssRules.push(fromStyle[i] + ':' + fromStyle.getPropertyValue(fromStyle[i]) + ';');
    }
    var cssText = cssRules.join('');

    toElement.style.cssText = cssText;
  };

  // Object to hold browser sniffing info.
  var browser = {
    isChrome: false,
    isMozilla: false,
    isOpera: false,
    isIe: false,
    isSafari: false
  };

  // Sniff the browser.
  var ua = navigator.userAgent;
  if(ua.indexOf('Chrome') > -1) {
    browser.isChrome = true;
  } else if (ua.indexOf('Safari') > -1) {
    browser.isSafari = true;
  } else if (ua.indexOf('Opera') > -1) {
    browser.isOpera = true;
  } else if (ua.indexOf('Firefox') > -1) {
    browser.isMozilla = true;
  } else if (ua.indexOf('MSIE') > -1) {
    browser.isIe = true;
  }

  util.browser = browser;

};

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],41:[function(require,module,exports){
(function (global){
'use strict';

var React = (typeof window !== "undefined" ? window.React : typeof global !== "undefined" ? global.React : null);
var R = React.DOM;
var _ = (typeof window !== "undefined" ? window._ : typeof global !== "undefined" ? global._ : null);

// # Formatic plugin core

// At its core, Formatic is just a plugin host. All of the functionality it has
// out of the box is via plugins. These plugins can be replaced or extended by
// other plugins.

// The global plugin registry holds registered (but not yet instantiated)
// plugins.
var pluginRegistry = {};

// Group plugins by prefix.
var pluginGroups = {};

// For anonymous plugins, incrementing number for names.
var pluginId = 0;

// Register a plugin or plugin bundle (array of plugins) globally.
var registerPlugin = function (name, pluginInitFn) {

  if (pluginRegistry[name]) {
    throw new Error('Plugin ' + name + ' is already registered.');
  }

  if (_.isArray(pluginInitFn)) {
    pluginRegistry[name] = [];
    pluginInitFn.forEach(function (pluginSpec) {
      registerPlugin(pluginSpec.name, pluginSpec.plugin);
      pluginRegistry[name].push(pluginSpec.name);
    });
  } else if (_.isObject(pluginInitFn) && !_.isFunction(pluginInitFn)) {
    var bundleName = name;
    pluginRegistry[bundleName] = [];
    Object.keys(pluginInitFn).forEach(function (name) {
      registerPlugin(name, pluginInitFn[name]);
      pluginRegistry[bundleName].push(name);
    });
  } else {
    pluginRegistry[name] = pluginInitFn;
    // Add plugin name to plugin group if it has a prefix.
    if (name.indexOf('.') > 0) {
      var prefix = name.substring(0, name.indexOf('.'));
      pluginGroups[prefix] = pluginGroups[prefix] || [];
      pluginGroups[prefix].push(name);
    }
  }
};

// Default plugin config. Each key represents a plugin name. Each key of that
// plugin represents a setting for that plugin. Passed-in config will override
// each individual setting.
var defaultPluginConfig = {
  core: {
    formatic: ['core.formatic'],
    form: ['core.form-init', 'core.form', 'core.field']
  },
  'core.form': {
    store: 'store.memory'
  },
  'field-router': {
    routes: ['field-routes']
  },
  compiler: {
    compilers: ['compiler.choices', 'compiler.lookup', 'compiler.types', 'compiler.prop-aliases']
  },
  component: {
    props: ['default-style']
  }
};

// ## Formatic factory

// Create a new formatic instance. A formatic instance is a function that can
// create forms. It also has a `.create` method that can create other formatic
// instances.
var createFormaticCore = function (config) {

  // Make a copy of config so we can monkey with it.
  config = _.extend({}, config);

  // Add default config settings (where not overridden).
  _.keys(defaultPluginConfig).forEach(function (key) {
    config[key] = _.extend({}, defaultPluginConfig[key], config[key]);
  });

  // The `formatic` variable will hold the function that gets returned from the
  // factory.
  var formatic;

  // Instantiated plugins are cached just like CommonJS modules.
  var pluginCache = {};

  // ## Plugin prototype

  // The Plugin prototype exists inside the Formatic factory function just to
  // make it easier to grab values from the closure.

  // Plugins are similar to CommonJS modules. Formatic uses plugins as a slight
  // variant though because:
  // - Formatic plugins are configurable.
  // - Formatic plugins are instantiated per formatic instance. CommonJS modules
  //   are created once and would be shared across all formatic instances.
  // - Formatic plugins are easily overridable (also via configuration).

  // When a plugin is instantiated, we call the `Plugin` constructor. The plugin
  // instance is then passed to the plugin's initialization function.
  var Plugin = function (name, config) {
    if (!(this instanceof Plugin)) {
      return new Plugin(name, config);
    }
    // Exports analogous to CommonJS exports.
    this.exports = {};
    // Config values passed in via factory are routed to the appropriate
    // plugin and available via `.config`.
    this.config = config || {};
    this.name = name;
  };

  // Get a config value for a plugin or return the default value.
  Plugin.prototype.configValue = function (key, defaultValue) {

    if (typeof this.config[key] !== 'undefined') {
      return this.config[key];
    }
    return defaultValue || '';
  };

  // Require another plugin by name. This is much like a CommonJS require
  Plugin.prototype.require = function (name) {
    return formatic.plugin(name);
  };

  // Handle a special plugin, the `component` plugin which finds components.
  var componentPlugin;

  // Just here in case we want to dynamically choose component later.
  Plugin.prototype.component = function (name) {
    return componentPlugin.component(name);
  };

  // Check if a plugin exists.
  Plugin.prototype.hasPlugin = function (name) {
    return (name in pluginCache) || (name in pluginRegistry);
  };

  // Check if a component exists. Components are really just plugins with
  // a particular prefix to their names.
  Plugin.prototype.hasComponent = function (name) {
    return this.hasPlugin('component.' + name);
  };

  // Given a list of plugin names, require them all and return a list of
  // instantiated plugins.
  Plugin.prototype.requireAll = function (pluginList) {
    if (!pluginList) {
      pluginList = [];
    }
    if (!_.isArray(pluginList)) {
      pluginList = [pluginList];
    }
    // Inflate registered bundles. A bundle is just a name that points to an
    // array of other plugin names.
    pluginList = pluginList.map(function (plugin) {
      if (_.isString(plugin)) {
        if (_.isArray(pluginRegistry[plugin])) {
          return pluginRegistry[plugin];
        }
      }
      return plugin;
    });
    // Flatten any bundles, so we end up with a flat array of plugin names.
    pluginList = _.flatten(pluginList);
    return pluginList.map(function (plugin) {
      return this.require(plugin);
    }.bind(this));
  };

  // Given a prefix, return a map of all instantiated plugins with that prefix.
  Plugin.prototype.requireAllOf = function (prefix) {
    var map = {};

    if (pluginGroups[prefix]) {
      pluginGroups[prefix].forEach(function (name) {
        map[name] = this.require(name);
      }.bind(this));
    }

    return map;
  };

  // ## Formatic factory, continued...

  // Grab a plugin from the cache, or load it fresh from the registry.
  var loadPlugin = function (name, pluginConfig) {
    var plugin;

    // We can also load anonymous plugins.
    if (_.isFunction(name)) {

      var factory = name;

      if (_.isUndefined(factory.__exports__)) {
        pluginId++;
        plugin = Plugin('anonymous_plugin_' + pluginId, pluginConfig || {});
        factory(plugin);
        // Store the exports on the anonymous function so we know it's already
        // been instantiated, and we can just grab the exports.
        factory.__exports__ = plugin.exports;
      }

      // Load the cached exports.
      return factory.__exports__;

    } else if (_.isUndefined(pluginCache[name])) {

      if (!pluginConfig && config[name]) {
        if (config[name].plugin) {
          return loadPlugin(config[name].plugin, config[name] || {});
        }
      }

      if (pluginRegistry[name]) {
        if (_.isFunction(pluginRegistry[name])) {
          plugin = Plugin(name, pluginConfig || config[name]);
          pluginRegistry[name](plugin);
          pluginCache[name] = plugin.exports;
        } else {
          throw new Error('Plugin ' + name + ' is not a function.');
        }
      } else {
        throw new Error('Plugin ' + name + ' not found.');
      }
    }
    return pluginCache[name];
  };

  // Assign `formatic` to a function that takes form options and returns a form.
  formatic = function (options) {
    return formatic.form(options);
  };

  // Allow global plugin registry from the formatic function instance.
  formatic.register = function (name, pluginInitFn) {
    registerPlugin(name, pluginInitFn);
    return formatic;
  };

  // Allow retrieving plugins from the formatic function instance.
  formatic.plugin = function (name) {
    return loadPlugin(name);
  };

  // Allow creating a new formatic instance from a formatic instance.
  //formatic.create = Formatic;

  // Use the core plugin to add methods to the formatic instance.
  var core = loadPlugin('core');

  core(formatic);

  // Now bind the component plugin. We wait till now, so the core is loaded
  // first.
  componentPlugin = loadPlugin('component');

  // Return the formatic function instance.
  return formatic;
};

// Just a helper to register a bunch of plugins.
var registerPlugins = function () {
  var arg = _.toArray(arguments);
  arg.forEach(function (arg) {
    var name = arg[0];
    var plugin = arg[1];
    registerPlugin(name, plugin);
  });
};

// Register all the built-in plugins.
registerPlugins(
  ['core', require('./default/core')],

  ['core.formatic', require('./core/formatic')],
  ['core.form-init', require('./core/form-init')],
  ['core.form', require('./core/form')],
  ['core.field', require('./core/field')],

  ['util', require('./default/util')],
  ['compiler', require('./default/compiler')],
  ['eval', require('./default/eval')],
  ['eval-functions', require('./default/eval-functions')],
  ['loader', require('./default/loader')],
  ['field-router', require('./default/field-router')],
  ['field-routes', require('./default/field-routes')],

  ['compiler.choices', require('./compilers/choices')],
  ['compiler.lookup', require('./compilers/lookup')],
  ['compiler.types', require('./compilers/types')],
  ['compiler.prop-aliases', require('./compilers/prop-aliases')],

  ['store.memory', require('./store/memory')],

  ['type.root', require('./types/root')],
  ['type.string', require('./types/string')],
  ['type.object', require('./types/object')],
  ['type.boolean', require('./types/boolean')],
  ['type.array', require('./types/array')],
  ['type.json', require('./types/json')],
  ['type.number', require('./types/number')],

  ['component', require('./default/component')],

  ['component.root', require('./components/root')],
  ['component.field', require('./components/field')],
  ['component.label', require('./components/label')],
  ['component.help', require('./components/help')],
  ['component.sample', require('./components/sample')],
  ['component.fieldset', require('./components/fieldset')],
  ['component.text', require('./components/text')],
  ['component.textarea', require('./components/textarea')],
  ['component.select', require('./components/select')],
  ['component.list', require('./components/list')],
  ['component.list-control', require('./components/list-control')],
  ['component.list-item', require('./components/list-item')],
  ['component.list-item-value', require('./components/list-item-value')],
  ['component.list-item-control', require('./components/list-item-control')],
  ['component.item-choices', require('./components/item-choices')],
  ['component.add-item', require('./components/add-item')],
  ['component.remove-item', require('./components/remove-item')],
  ['component.move-item-back', require('./components/move-item-back')],
  ['component.move-item-forward', require('./components/move-item-forward')],
  ['component.json', require('./components/json')],
  ['component.checkbox-list', require('./components/checkbox-list')],
  ['component.pretty-textarea', require('./components/pretty-textarea')],
  ['component.choices', require('./components/choices')],

  ['mixin.click-outside', require('./mixins/click-outside')],
  ['mixin.field', require('./mixins/field')],
  ['mixin.input-actions', require('./mixins/input-actions')],
  ['mixin.resize', require('./mixins/resize')],
  ['mixin.scroll', require('./mixins/scroll')],
  ['mixin.undo-stack', require('./mixins/undo-stack')],

  ['bootstrap-style', require('./plugins/bootstrap-style')],
  ['default-style', require('./plugins/default-style')]
);

// Create the default formatic instance.
//var defaultCore = Formatic();

// Export it!
//module.exports = defaultFormatic;

var createFormaticComponentClass = function (config) {

  var core = createFormaticCore(config);

  return React.createClass({

    displayName: 'Formatic',

    statics: {
      config: createFormaticComponentClass,
      form: core,
      plugin: core.plugin
    },

    getInitialState: function () {
      var form = this.props.form || this.props.defaultForm;
      return {
        form: form,
        field: form.field(),
        controlled: this.props.form ? true : false
      };
    },

    componentDidMount: function() {
      var form = this.state.form;
      if (!form) {
        throw new Error('Must supply a form or defaultForm.');
      }
      if (this.state.controlled) {
        form.once('change', this.onFormChanged);
      } else {
        form.on('change', this.onFormChanged);
      }
    },

    onFormChanged: function (event) {
      if (this.props.onChange) {
        this.props.onChange(this.state.form.val(), event.changing);
      }
      if (!this.state.controlled) {
        this.setState({
          field: this.state.form.field()
        });
      }
    },

    componentWillUnmount: function () {
      var form = this.state.form;
      if (form) {
        form.off('change', this.onFormChanged);
      }
    },

    componentWillReceiveProps: function (nextProps) {
      if (this.state.controlled) {
        if (!nextProps.form) {
          throw new Error('Must supply a new form for a controlled component.');
        }
        nextProps.form.once('change', this.onFormChanged);
        this.setState({
          form: nextProps.form,
          field: nextProps.form.field()
        });
      }
    },

    render: function () {
      return R.div({className: 'formatic'},
        this.state.field.component()
      );
    }
  });
};

module.exports = createFormaticComponentClass();

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./compilers/choices":1,"./compilers/lookup":2,"./compilers/prop-aliases":3,"./compilers/types":4,"./components/add-item":5,"./components/checkbox-list":6,"./components/choices":7,"./components/field":8,"./components/fieldset":9,"./components/help":10,"./components/item-choices":11,"./components/json":12,"./components/label":13,"./components/list":18,"./components/list-control":14,"./components/list-item":17,"./components/list-item-control":15,"./components/list-item-value":16,"./components/move-item-back":19,"./components/move-item-forward":20,"./components/pretty-textarea":21,"./components/remove-item":22,"./components/root":23,"./components/sample":24,"./components/select":25,"./components/text":26,"./components/textarea":27,"./core/field":28,"./core/form":30,"./core/form-init":29,"./core/formatic":31,"./default/compiler":32,"./default/component":33,"./default/core":34,"./default/eval":36,"./default/eval-functions":35,"./default/field-router":37,"./default/field-routes":38,"./default/loader":39,"./default/util":40,"./mixins/click-outside":42,"./mixins/field":43,"./mixins/input-actions":44,"./mixins/resize":45,"./mixins/scroll":46,"./mixins/undo-stack":47,"./plugins/bootstrap-style":48,"./plugins/default-style":49,"./store/memory":50,"./types/array":51,"./types/boolean":52,"./types/json":53,"./types/number":54,"./types/object":55,"./types/root":56,"./types/string":57}],42:[function(require,module,exports){
(function (global){
// # mixin.click-outside

/*
There's no native React way to detect clicking outside an element. Sometimes
this is useful, so that's what this mixin does. To use it, mix it in and use it
from your component like this:

```js
module.exports = function (plugin) {
  plugin.exports = React.createClass({

    mixins: [plugin.require('mixin.click-outside')],

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
};
```
*/

'use strict';

var _ = (typeof window !== "undefined" ? window._ : typeof global !== "undefined" ? global._ : null);

var hasAncestor = function (child, parent) {
  if (child.parentNode === parent) {
    return true;
  }
  if (child.parentNode === null) {
    return false;
  }
  return hasAncestor(child.parentNode, parent);
};

module.exports = function (plugin) {

  plugin.exports = {

    // _onClickDocument: function(event) {
    //   console.log('click doc')
    //   if (this._didMouseDown) {
    //     _.each(this.clickOutsideHandlers, function (funcs, ref) {
    //       if (isOutside(event.target, this.refs[ref].getDOMNode())) {
    //         funcs.forEach(function (fn) {
    //           fn.call(this);
    //         }.bind(this));
    //       }
    //     }.bind(this));
    //   }
    // },

    isNodeOutside: function (nodeOut, nodeIn) {
      if (nodeOut === nodeIn) {
        return false;
      }
      if (hasAncestor(nodeOut, nodeIn)) {
        return false;
      }
      return true;
    },

    isNodeInside: function (nodeIn, nodeOut) {
      return !this.isNodeOutside(nodeIn, nodeOut);
    },

    _onClickMousedown: function() {
      //this._didMouseDown = true;
      _.each(this.clickOutsideHandlers, function (funcs, ref) {
        if (this.refs[ref]) {
          this._mousedownRefs[ref] = true;
        }
      }.bind(this));
    },

    _onClickMouseup: function (event) {
      _.each(this.clickOutsideHandlers, function (funcs, ref) {
        if (this.refs[ref] && this._mousedownRefs[ref]) {
          if (this.isNodeOutside(event.target, this.refs[ref].getDOMNode())) {
            funcs.forEach(function (fn) {
              fn.call(this, event);
            }.bind(this));
          }
        }
        this._mousedownRefs[ref] = false;
      }.bind(this));
    },

    // _onClickDocument: function () {
    //   console.log('clickety')
    //   _.each(this.clickOutsideHandlers, function (funcs, ref) {
    //     console.log('clickety', ref, this.refs[ref])
    //   }.bind(this));
    // },

    setOnClickOutside: function (ref, fn) {
      if (!this.clickOutsideHandlers[ref]) {
        this.clickOutsideHandlers[ref] = [];
      }
      this.clickOutsideHandlers[ref].push(fn);
    },

    componentDidMount: function () {
      this.clickOutsideHandlers = {};
      this._didMouseDown = false;
      document.addEventListener('mousedown', this._onClickMousedown);
      document.addEventListener('mouseup', this._onClickMouseup);
      //document.addEventListener('click', this._onClickDocument);
      this._mousedownRefs = {};
    },

    componentWillUnmount: function () {
      this.clickOutsideHandlers = {};
      //document.removeEventListener('click', this._onClickDocument);
      document.removeEventListener('mouseup', this._onClickMouseup);
      document.removeEventListener('mousedown', this._onClickMousedown);
    }
  };
};

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],43:[function(require,module,exports){
(function (global){
// # mixin.field

/*
Wrap up your fields with this mixin to get:
- Automatic metadata loading.
- Anything else decided later.
*/

'use strict';

var _ = (typeof window !== "undefined" ? window._ : typeof global !== "undefined" ? global._ : null);

module.exports = function (plugin) {

  plugin.exports = {

    loadNeededMeta: function (props) {
      if (props.field && props.field.form) {
        if (props.field.def.needsMeta && props.field.def.needsMeta.length > 0) {

          var needsMeta = [];

          props.field.def.needsMeta.forEach(function (args) {
            if (_.isArray(args) && args.length > 0) {
              if (_.isArray(args[0])) {
                args.forEach(function (args) {
                  needsMeta.push(args);
                });
              } else {
                needsMeta.push(args);
              }
            }
          });

          if (needsMeta.length === 0) {
            // Must just be a single need, and not an array.
            needsMeta = [props.field.def.needsMeta];
          }

          needsMeta.forEach(function (needs) {
            if (needs) {
              props.field.form.loadMeta.apply(props.field.form, needs);
            }
          });
        }
      }
    },

    componentDidMount: function () {
      this.loadNeededMeta(this.props);
    },

    componentWillReceiveProps: function (nextProps) {
      this.loadNeededMeta(nextProps);
    },

    componentWillUnmount: function () {
      // Removing this as it's a bad idea, because unmounting a component is not
      // always a signal to remove the field. Will have to find a better way.

      // if (this.props.field) {
      //   this.props.field.erase();
      // }
    }
  };
};

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],44:[function(require,module,exports){
// # mixin.input-actions

/*
Currently unused.
*/

'use strict';

module.exports = function (plugin) {

  plugin.exports = {

    onFocus: function () {

    },

    onBlur: function () {

    },

    onChange: function () {

    }
  };
};

},{}],45:[function(require,module,exports){
// # mixin.resize

/*
You'd think it would be pretty easy to detect when a DOM element is resized.
And you'd be wrong. There are various tricks, but none of them work very well.
So, using good ol' polling here. To try to be as efficient as possible, there
is only a single setInterval used for all elements. To use:

```js
module.exports = function (plugin) {
  plugin.exports = React.createClass({

    mixins: [plugin.require('mixin.resize')],

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
};
```
*/

'use strict';

var id = 0;

var resizeIntervalElements = {};
var resizeIntervalElementsCount = 0;
var resizeIntervalTimer = null;

var checkElements = function () {
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

var addResizeIntervalHandler = function (element, fn) {
  if (resizeIntervalTimer === null) {
    resizeIntervalTimer = setInterval(checkElements, 100);
  }
  if (!('__resizeId' in element)) {
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

var removeResizeIntervalHandlers = function (element) {
  if (!('__resizeId' in element)) {
    return;
  }
  var id = element.__resizeId;
  delete element.__resizeId;
  delete element.__resizeHandlers;
  delete resizeIntervalElements[id];
  resizeIntervalElementsCount--;
  if (resizeIntervalElementsCount < 1) {
    clearInterval(resizeIntervalTimer);
    resizeIntervalTimer = null;
  }
};

var onResize = function (ref, fn) {
  fn(ref);
};

module.exports = function (plugin) {

  plugin.exports = {

    componentDidMount: function () {
      if (this.onResizeWindow) {
        window.addEventListener('resize', this.onResizeWindow);
      }
      this.resizeElementRefs = {};
    },

    componentWillUnmount: function () {
      if (this.onResizeWindow) {
        window.removeEventListener('resize', this.onResizeWindow);
      }
      Object.keys(this.resizeElementRefs).forEach(function (ref) {
        removeResizeIntervalHandlers(this.refs[ref].getDOMNode());
      }.bind(this));
    },

    setOnResize: function (ref, fn) {
      if (!this.resizeElementRefs[ref]) {
        this.resizeElementRefs[ref] = true;
      }
      addResizeIntervalHandler(this.refs[ref].getDOMNode(), onResize.bind(this, ref, fn));
    }
  };
};

},{}],46:[function(require,module,exports){
// # mixin.scroll

'use strict';

module.exports = function (plugin) {

  plugin.exports = {

    componentDidMount: function () {
      if (this.onScrollWindow) {
        window.addEventListener('scroll', this.onScrollWindow);
      }
    },

    componentWillUnmount: function () {
      if (this.onScrollWindow) {
        window.removeEventListener('scroll', this.onScrollWindow);
      }
    }
  };
};

},{}],47:[function(require,module,exports){
// # mixin.undo-stack

/*
Gives your component an undo stack.
*/

// http://prometheusresearch.github.io/react-forms/examples/undo.html

'use strict';

var UndoStack = {
  getInitialState: function() {
    return {undo: [], redo: []};
  },

  snapshot: function() {
    var undo = this.state.undo.concat(this.getStateSnapshot());
    if (typeof this.state.undoDepth === 'number') {
      if (undo.length > this.state.undoDepth) {
        undo.shift();
      }
    }
    this.setState({undo: undo, redo: []});
  },

  hasUndo: function() {
    return this.state.undo.length > 0;
  },

  hasRedo: function() {
    return this.state.redo.length > 0;
  },

  redo: function() {
    this._undoImpl(true);
  },

  undo: function() {
    this._undoImpl();
  },

  _undoImpl: function(isRedo) {
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
    this.setState({undo:undo, redo:redo});
  }
};

module.exports = function (plugin) {
  plugin.exports = UndoStack;
};

},{}],48:[function(require,module,exports){
(function (global){
// # bootstrap

/*
The bootstrap plugin bundle exports a bunch of "prop modifier" plugins which
manipulate the props going into many of the components.
*/

'use strict';

var _ = (typeof window !== "undefined" ? window._ : typeof global !== "undefined" ? global._ : null);

var modifiers = {

  'field': {className: 'form-group'},
  'help': {className: 'help-block'},
  'sample': {className: 'help-block'},
  'text': {className: 'form-control'},
  'textarea': {className: 'form-control'},
  'pretty-textarea': {className: 'form-control'},
  'json': {className: 'form-control'},
  'select': {className: 'form-control'},
  //'list': {className: 'well'},
  'list-control': {className: 'form-inline'},
  'list-item': {className: 'well'},
  'item-choices': {className: 'form-control'},
  'add-item': {className: 'glyphicon glyphicon-plus', label: ''},
  'remove-item': {className: 'glyphicon glyphicon-remove', label: ''},
  'move-item-back': {className: 'glyphicon glyphicon-arrow-up', label: ''},
  'move-item-forward': {className: 'glyphicon glyphicon-arrow-down', label: ''}
};

// Build the plugin bundle.
_.each(modifiers, function (modifier, name) {

  exports['component-props.' + name + '.bootstrap'] = function (plugin) {

    var util = plugin.require('util');

    plugin.exports = [
      name,
      function (props) {
        if (!_.isUndefined(modifier.className)) {
          props.className = util.className(props.className, modifier.className);
        }
        if (!_.isUndefined(modifier.label)) {
          props.label = modifier.label;
        }
      }
    ];
  };

});

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],49:[function(require,module,exports){
(function (global){
// # default-style

/*
The default-style plugin bundle exports a bunch of "prop modifier" plugins which
manipulate the props going into many of the components.
*/

'use strict';

var _ = (typeof window !== "undefined" ? window._ : typeof global !== "undefined" ? global._ : null);

var modifiers = {

  'field': {},
  'help': {},
  'sample': {},
  'text': {},
  'textarea': {},
  'pretty-textarea': {},
  'json': {},
  'select': {},
  'list': {},
  'list-control': {},
  'list-item-control': {},
  'list-item-value': {},
  'list-item': {},
  'item-choices': {},
  'add-item': {},
  'remove-item': {},
  'move-item-back': {},
  'move-item-forward': {}
};

// Build the plugin bundle.
_.each(modifiers, function (modifier, name) {

  exports['component-props.' + name + '.default'] = function (plugin) {

    var util = plugin.require('util');

    plugin.exports = [
      name,
      function (props) {
        props.className = util.className(props.className, name);
      }
    ];
  };

});

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],50:[function(require,module,exports){
(function (global){
// # store.memory

/*
The memory store plugin keeps the state of fields, data, and metadata. It
responds to actions and emits a change event if there are any changes.
*/

'use strict';

var _ = (typeof window !== "undefined" ? window._ : typeof global !== "undefined" ? global._ : null);

module.exports = function (plugin) {

  var compiler = plugin.require('compiler');
  var util = plugin.require('util');

  plugin.exports = function (form, emitter, options) {

    var store = {};

    store.fields = [];
    store.templateMap = {};
    store.value = {};
    store.meta = {};

    // Helper to setup fields. Field definitions need to be expanded, compiled,
    // etc.

    var setupFields = function (fields) {
      store.fields = compiler.expandFields(fields);
      store.fields = compiler.compileFields(store.fields);
      store.templateMap = compiler.templateMap(store.fields);
      store.fields = store.fields.filter(function (def) {
        return !def.template;
      });
    };

    if (options.fields) {
      setupFields(options.fields);
    }

    if (!_.isUndefined(options.value)) {
      store.value = util.copyValue(options.value);
    }

    // Currently, just a single event for any change.
    var update = function (changing) {
      emitter.emit('change', {
        value: store.value,
        meta: store.meta,
        fields: store.fields,
        changing: changing
      });
    };

    // When fields change, we need to "inflate" them, meaning expand them and
    // run any evaluations in order to get the default value out.
    store.inflate = function () {
      var field = form.field();
      field.inflate(function (path, value) {
        store.value = util.setIn(store.value, path, value);
      });
    };

    var actions = {

      // Set value at a path.
      setValue: function (path, value) {

        if (_.isUndefined(value)) {
          value = path;
          path = [];
        }

        var oldValue = util.getIn(store.value, path);

        if (path.length === 0) {
          store.value = util.copyValue(value);
          store.inflate();
        } else {
          store.value = util.setIn(store.value, path, value);
        }
        update({'path': path, 'new': value, 'old': oldValue, 'action': 'set'});
      },

      // Remove a value at a path.
      removeValue: function (path) {
        var oldValue = util.getIn(store.value, path);
        store.value = util.removeIn(store.value, path);

        update({'path': path, 'old': oldValue, 'action': 'remove'});
      },

      // Erase a value. User actions can remove values, but nodes can also
      // disappear due to changing evaluations. This action occurs automatically
      // (and may be unnecessary if the value was already removed).
      eraseValue: function (path) {

        store.value = util.removeIn(store.value, path);

        update({});
      },

      // Append a value to an array at a path.
      appendValue: function (path, value) {
        var oldValue = util.getIn(store.value, path);
        store.value = util.appendIn(store.value, path, value);

        update({'path': path, 'new': value, 'old': oldValue, 'action': 'append'});
      },

      // Swap values of two keys.
      moveValue: function (path, fromKey, toKey) {
        var oldValue = util.getIn(store.value, path);
        store.value = util.moveIn(store.value, path, fromKey, toKey);

        update({'path': path, 'new': oldValue, 'old': oldValue, 'fromKey': fromKey, 'toKey': toKey, 'action': 'move'});
      },

      // Change all the fields.
      setFields: function (fields) {
        setupFields(fields);
        store.inflate();

        update({'action': 'setFields'});
      },

      // Set a metadata value for a key.
      setMeta: function (key, value) {
        store.meta[key] = value;
        update({'action': 'setMeta'});
      }
    };

    _.extend(store, actions);

    return store;
  };
};

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],51:[function(require,module,exports){
(function (global){
// # type.array

/*
Support array type where child fields are dynamically determined based on the
values of the array.
*/

'use strict';

var _ = (typeof window !== "undefined" ? window._ : typeof global !== "undefined" ? global._ : null);

module.exports = function (plugin) {

  plugin.exports.default = [];

  plugin.exports.fields = function (field) {

    if (_.isArray(field.value)) {
      return field.value.map(function (value, i) {
        var item = field.itemForValue(value);
        item.key = i;
        return field.createChild(item);
      });
    } else {
      return [];
    }
  };
};

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],52:[function(require,module,exports){
// # type.boolean

/*
Support a true/false value.
*/

'use strict';

module.exports = function (plugin) {

  plugin.exports.default = false;

  plugin.exports.compile = function (def) {
    if (!def.choices) {
      def.choices = [
        {value: true, label: 'Yes'},
        {value: false, label: 'No'}
      ];
    }
  };
};

},{}],53:[function(require,module,exports){
// # type.json

/*
Arbitrary JSON value.
*/

'use strict';

module.exports = function (plugin) {

  plugin.exports.default = null;

};

},{}],54:[function(require,module,exports){
// # type.number

/*
Support number values, of course.
*/

'use strict';

module.exports = function (plugin) {

  plugin.exports.default = 0;

};

},{}],55:[function(require,module,exports){
(function (global){
// # type.object

/*
Support for object types. Object fields can supply static child fields, or if
there are additional child keys, dynamic child fields will be created much
like an array.
*/

'use strict';

var _ = (typeof window !== "undefined" ? window._ : typeof global !== "undefined" ? global._ : null);

module.exports = function (plugin) {

  var util = plugin.require('util');

  plugin.exports.default = {};

  plugin.exports.fields = function (field) {

    var fields = [];
    var value = field.value;
    var unusedKeys = _.keys(value);

    if (field.def.fields) {

      fields = field.def.fields.map(function (def) {
        var child = field.createChild(def);
        if (!util.isBlank(child.def.key)) {
          unusedKeys = _.without(unusedKeys, child.def.key);
        }
        return child;
      });
    }

    if (unusedKeys.length > 0) {
      unusedKeys.forEach(function (key) {
        var item = field.itemForValue(value[key]);
        item.label = util.humanize(key);
        item.key = key;
        fields.push(field.createChild(item));
      });
    }

    return fields;
  };
};

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],56:[function(require,module,exports){
// # type.root

/*
Special type representing the root of the form. Gets the fields directly from
the store.
*/

'use strict';

module.exports = function (plugin) {

  plugin.exports.fields = function (field) {

    return field.form.store.fields.map(function (def) {
      return field.createChild(def);
    });

  };
};

},{}],57:[function(require,module,exports){
// # type.string

/*
Support string values, of course.
*/

'use strict';

module.exports = function (plugin) {

  plugin.exports.default = '';

};

},{}],58:[function(require,module,exports){
'use strict';

/**
 * Representation of a single EventEmitter function.
 *
 * @param {Function} fn Event handler to be called.
 * @param {Mixed} context Context for function execution.
 * @param {Boolean} once Only emit once
 * @api private
 */
function EE(fn, context, once) {
  this.fn = fn;
  this.context = context;
  this.once = once || false;
}

/**
 * Minimal EventEmitter interface that is molded against the Node.js
 * EventEmitter interface.
 *
 * @constructor
 * @api public
 */
function EventEmitter() { /* Nothing to set */ }

/**
 * Holds the assigned EventEmitters by name.
 *
 * @type {Object}
 * @private
 */
EventEmitter.prototype._events = undefined;

/**
 * Return a list of assigned event listeners.
 *
 * @param {String} event The events that should be listed.
 * @returns {Array}
 * @api public
 */
EventEmitter.prototype.listeners = function listeners(event) {
  if (!this._events || !this._events[event]) return [];

  for (var i = 0, l = this._events[event].length, ee = []; i < l; i++) {
    ee.push(this._events[event][i].fn);
  }

  return ee;
};

/**
 * Emit an event to all registered event listeners.
 *
 * @param {String} event The name of the event.
 * @returns {Boolean} Indication if we've emitted an event.
 * @api public
 */
EventEmitter.prototype.emit = function emit(event, a1, a2, a3, a4, a5) {
  if (!this._events || !this._events[event]) return false;

  var listeners = this._events[event]
    , length = listeners.length
    , len = arguments.length
    , ee = listeners[0]
    , args
    , i, j;

  if (1 === length) {
    if (ee.once) this.removeListener(event, ee.fn, true);

    switch (len) {
      case 1: return ee.fn.call(ee.context), true;
      case 2: return ee.fn.call(ee.context, a1), true;
      case 3: return ee.fn.call(ee.context, a1, a2), true;
      case 4: return ee.fn.call(ee.context, a1, a2, a3), true;
      case 5: return ee.fn.call(ee.context, a1, a2, a3, a4), true;
      case 6: return ee.fn.call(ee.context, a1, a2, a3, a4, a5), true;
    }

    for (i = 1, args = new Array(len -1); i < len; i++) {
      args[i - 1] = arguments[i];
    }

    ee.fn.apply(ee.context, args);
  } else {
    for (i = 0; i < length; i++) {
      if (listeners[i].once) this.removeListener(event, listeners[i].fn, true);

      switch (len) {
        case 1: listeners[i].fn.call(listeners[i].context); break;
        case 2: listeners[i].fn.call(listeners[i].context, a1); break;
        case 3: listeners[i].fn.call(listeners[i].context, a1, a2); break;
        default:
          if (!args) for (j = 1, args = new Array(len -1); j < len; j++) {
            args[j - 1] = arguments[j];
          }

          listeners[i].fn.apply(listeners[i].context, args);
      }
    }
  }

  return true;
};

/**
 * Register a new EventListener for the given event.
 *
 * @param {String} event Name of the event.
 * @param {Functon} fn Callback function.
 * @param {Mixed} context The context of the function.
 * @api public
 */
EventEmitter.prototype.on = function on(event, fn, context) {
  if (!this._events) this._events = {};
  if (!this._events[event]) this._events[event] = [];
  this._events[event].push(new EE( fn, context || this ));

  return this;
};

/**
 * Add an EventListener that's only called once.
 *
 * @param {String} event Name of the event.
 * @param {Function} fn Callback function.
 * @param {Mixed} context The context of the function.
 * @api public
 */
EventEmitter.prototype.once = function once(event, fn, context) {
  if (!this._events) this._events = {};
  if (!this._events[event]) this._events[event] = [];
  this._events[event].push(new EE(fn, context || this, true ));

  return this;
};

/**
 * Remove event listeners.
 *
 * @param {String} event The event we want to remove.
 * @param {Function} fn The listener that we need to find.
 * @param {Boolean} once Only remove once listeners.
 * @api public
 */
EventEmitter.prototype.removeListener = function removeListener(event, fn, once) {
  if (!this._events || !this._events[event]) return this;

  var listeners = this._events[event]
    , events = [];

  if (fn) for (var i = 0, length = listeners.length; i < length; i++) {
    if (listeners[i].fn !== fn && listeners[i].once !== once) {
      events.push(listeners[i]);
    }
  }

  //
  // Reset the array, or remove it completely if we have no more listeners.
  //
  if (events.length) this._events[event] = events;
  else this._events[event] = null;

  return this;
};

/**
 * Remove all listeners or only the listeners for the specified event.
 *
 * @param {String} event The event want to remove all listeners for.
 * @api public
 */
EventEmitter.prototype.removeAllListeners = function removeAllListeners(event) {
  if (!this._events) return this;

  if (event) this._events[event] = null;
  else this._events = {};

  return this;
};

//
// Alias methods names because people roll like that.
//
EventEmitter.prototype.off = EventEmitter.prototype.removeListener;
EventEmitter.prototype.addListener = EventEmitter.prototype.on;

//
// This function doesn't apply anymore.
//
EventEmitter.prototype.setMaxListeners = function setMaxListeners() {
  return this;
};

//
// Expose the module.
//
EventEmitter.EventEmitter = EventEmitter;
EventEmitter.EventEmitter2 = EventEmitter;
EventEmitter.EventEmitter3 = EventEmitter;

if ('object' === typeof module && module.exports) {
  module.exports = EventEmitter;
}

},{}],"formatic":[function(require,module,exports){
module.exports = require('./lib/formatic');

},{"./lib/formatic":41}]},{},[])("formatic")
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJsaWIvY29tcGlsZXJzL2Nob2ljZXMuanMiLCJsaWIvY29tcGlsZXJzL2xvb2t1cC5qcyIsImxpYi9jb21waWxlcnMvcHJvcC1hbGlhc2VzLmpzIiwibGliL2NvbXBpbGVycy90eXBlcy5qcyIsImxpYi9jb21wb25lbnRzL2FkZC1pdGVtLmpzIiwibGliL2NvbXBvbmVudHMvY2hlY2tib3gtbGlzdC5qcyIsImxpYi9jb21wb25lbnRzL2Nob2ljZXMuanMiLCJsaWIvY29tcG9uZW50cy9maWVsZC5qcyIsImxpYi9jb21wb25lbnRzL2ZpZWxkc2V0LmpzIiwibGliL2NvbXBvbmVudHMvaGVscC5qcyIsImxpYi9jb21wb25lbnRzL2l0ZW0tY2hvaWNlcy5qcyIsImxpYi9jb21wb25lbnRzL2pzb24uanMiLCJsaWIvY29tcG9uZW50cy9sYWJlbC5qcyIsImxpYi9jb21wb25lbnRzL2xpc3QtY29udHJvbC5qcyIsImxpYi9jb21wb25lbnRzL2xpc3QtaXRlbS1jb250cm9sLmpzIiwibGliL2NvbXBvbmVudHMvbGlzdC1pdGVtLXZhbHVlLmpzIiwibGliL2NvbXBvbmVudHMvbGlzdC1pdGVtLmpzIiwibGliL2NvbXBvbmVudHMvbGlzdC5qcyIsImxpYi9jb21wb25lbnRzL21vdmUtaXRlbS1iYWNrLmpzIiwibGliL2NvbXBvbmVudHMvbW92ZS1pdGVtLWZvcndhcmQuanMiLCJsaWIvY29tcG9uZW50cy9wcmV0dHktdGV4dGFyZWEuanMiLCJsaWIvY29tcG9uZW50cy9yZW1vdmUtaXRlbS5qcyIsImxpYi9jb21wb25lbnRzL3Jvb3QuanMiLCJsaWIvY29tcG9uZW50cy9zYW1wbGUuanMiLCJsaWIvY29tcG9uZW50cy9zZWxlY3QuanMiLCJsaWIvY29tcG9uZW50cy90ZXh0LmpzIiwibGliL2NvbXBvbmVudHMvdGV4dGFyZWEuanMiLCJsaWIvY29yZS9maWVsZC5qcyIsImxpYi9jb3JlL2Zvcm0taW5pdC5qcyIsImxpYi9jb3JlL2Zvcm0uanMiLCJsaWIvY29yZS9mb3JtYXRpYy5qcyIsImxpYi9kZWZhdWx0L2NvbXBpbGVyLmpzIiwibGliL2RlZmF1bHQvY29tcG9uZW50LmpzIiwibGliL2RlZmF1bHQvY29yZS5qcyIsImxpYi9kZWZhdWx0L2V2YWwtZnVuY3Rpb25zLmpzIiwibGliL2RlZmF1bHQvZXZhbC5qcyIsImxpYi9kZWZhdWx0L2ZpZWxkLXJvdXRlci5qcyIsImxpYi9kZWZhdWx0L2ZpZWxkLXJvdXRlcy5qcyIsImxpYi9kZWZhdWx0L2xvYWRlci5qcyIsImxpYi9kZWZhdWx0L3V0aWwuanMiLCJsaWIvZm9ybWF0aWMuanMiLCJsaWIvbWl4aW5zL2NsaWNrLW91dHNpZGUuanMiLCJsaWIvbWl4aW5zL2ZpZWxkLmpzIiwibGliL21peGlucy9pbnB1dC1hY3Rpb25zLmpzIiwibGliL21peGlucy9yZXNpemUuanMiLCJsaWIvbWl4aW5zL3Njcm9sbC5qcyIsImxpYi9taXhpbnMvdW5kby1zdGFjay5qcyIsImxpYi9wbHVnaW5zL2Jvb3RzdHJhcC1zdHlsZS5qcyIsImxpYi9wbHVnaW5zL2RlZmF1bHQtc3R5bGUuanMiLCJsaWIvc3RvcmUvbWVtb3J5LmpzIiwibGliL3R5cGVzL2FycmF5LmpzIiwibGliL3R5cGVzL2Jvb2xlYW4uanMiLCJsaWIvdHlwZXMvanNvbi5qcyIsImxpYi90eXBlcy9udW1iZXIuanMiLCJsaWIvdHlwZXMvb2JqZWN0LmpzIiwibGliL3R5cGVzL3Jvb3QuanMiLCJsaWIvdHlwZXMvc3RyaW5nLmpzIiwibm9kZV9tb2R1bGVzL2V2ZW50ZW1pdHRlcjMvaW5kZXguanMiLCJpbmRleC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25FQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0lBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzdEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOVZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcElBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9EQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9LQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0VBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9GQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsVEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbmJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuSUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3REQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0lBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNiQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDYkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNU1BO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiKGZ1bmN0aW9uIChnbG9iYWwpe1xuLy8gIyBjb21waWxlci5jaG9pY2VzXG5cbi8qXG5Ob3JtYWxpemVzIHRoZSBjaG9pY2VzIGZvciBhIGZpZWxkLiBTdXBwb3J0cyB0aGUgZm9sbG93aW5nIGZvcm1hdHMuXG5cbmBgYGpzXG4ncmVkLCBibHVlJ1xuXG5bJ3JlZCcsICdibHVlJ11cblxue3JlZDogJ1JlZCcsIGJsdWU6ICdCbHVlJ31cblxuW3t2YWx1ZTogJ3JlZCcsIGxhYmVsOiAnUmVkJ30sIHt2YWx1ZTogJ2JsdWUnLCBsYWJlbDogJ0JsdWUnfV1cbmBgYFxuXG5BbGwgb2YgdGhvc2UgZm9ybWF0cyBhcmUgbm9ybWFsaXplZCB0bzpcblxuYGBganNcblt7dmFsdWU6ICdyZWQnLCBsYWJlbDogJ1JlZCd9LCB7dmFsdWU6ICdibHVlJywgbGFiZWw6ICdCbHVlJ31dXG5gYGBcbiovXG5cbid1c2Ugc3RyaWN0JztcblxudmFyIF8gPSAodHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdy5fIDogdHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbC5fIDogbnVsbCk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKHBsdWdpbikge1xuXG4gIHZhciB1dGlsID0gcGx1Z2luLnJlcXVpcmUoJ3V0aWwnKTtcblxuICB2YXIgY29tcGlsZUNob2ljZXMgPSBmdW5jdGlvbiAoY2hvaWNlcykge1xuXG4gICAgLy8gQ29udmVydCBjb21tYSBzZXBhcmF0ZWQgc3RyaW5nIHRvIGFycmF5IG9mIHN0cmluZ3MuXG4gICAgaWYgKF8uaXNTdHJpbmcoY2hvaWNlcykpIHtcbiAgICAgIGNob2ljZXMgPSBjaG9pY2VzLnNwbGl0KCcsJyk7XG4gICAgfVxuXG4gICAgLy8gQ29udmVydCBvYmplY3QgdG8gYXJyYXkgb2Ygb2JqZWN0cyB3aXRoIGB2YWx1ZWAgYW5kIGBsYWJlbGAgcHJvcGVydGllcy5cbiAgICBpZiAoIV8uaXNBcnJheShjaG9pY2VzKSAmJiBfLmlzT2JqZWN0KGNob2ljZXMpKSB7XG4gICAgICBjaG9pY2VzID0gT2JqZWN0LmtleXMoY2hvaWNlcykubWFwKGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICB2YWx1ZToga2V5LFxuICAgICAgICAgIGxhYmVsOiBjaG9pY2VzW2tleV1cbiAgICAgICAgfTtcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIC8vIENvcHkgdGhlIGFycmF5IG9mIGNob2ljZXMgc28gd2UgY2FuIG1hbmlwdWxhdGUgdGhlbS5cbiAgICBjaG9pY2VzID0gY2hvaWNlcy5zbGljZSgwKTtcblxuICAgIC8vIEFycmF5IG9mIGNob2ljZSBhcnJheXMgc2hvdWxkIGJlIGZsYXR0ZW5lZC5cbiAgICBjaG9pY2VzID0gXy5mbGF0dGVuKGNob2ljZXMpO1xuXG4gICAgY2hvaWNlcy5mb3JFYWNoKGZ1bmN0aW9uIChjaG9pY2UsIGkpIHtcbiAgICAgIC8vIENvbnZlcnQgYW55IHN0cmluZyBjaG9pY2VzIHRvIG9iamVjdHMgd2l0aCBgdmFsdWVgIGFuZCBgbGFiZWxgXG4gICAgICAvLyBwcm9wZXJ0aWVzLlxuICAgICAgaWYgKF8uaXNTdHJpbmcoY2hvaWNlKSkge1xuICAgICAgICBjaG9pY2VzW2ldID0ge1xuICAgICAgICAgIHZhbHVlOiBjaG9pY2UsXG4gICAgICAgICAgbGFiZWw6IHV0aWwuaHVtYW5pemUoY2hvaWNlKVxuICAgICAgICB9O1xuICAgICAgfVxuICAgICAgaWYgKCFjaG9pY2VzW2ldLmxhYmVsKSB7XG4gICAgICAgIGNob2ljZXNbaV0ubGFiZWwgPSB1dGlsLmh1bWFuaXplKGNob2ljZXNbaV0udmFsdWUpO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgcmV0dXJuIGNob2ljZXM7XG4gIH07XG5cbiAgcGx1Z2luLmV4cG9ydHMuY29tcGlsZSA9IGZ1bmN0aW9uIChkZWYpIHtcbiAgICBpZiAoZGVmLmNob2ljZXMgPT09ICcnKSB7XG4gICAgICBkZWYuY2hvaWNlcyA9IFtdO1xuICAgIH0gZWxzZSBpZiAoZGVmLmNob2ljZXMpIHtcblxuICAgICAgZGVmLmNob2ljZXMgPSBjb21waWxlQ2hvaWNlcyhkZWYuY2hvaWNlcyk7XG4gICAgfVxuXG4gICAgaWYgKGRlZi5yZXBsYWNlQ2hvaWNlcyA9PT0gJycpIHtcbiAgICAgIGRlZi5yZXBsYWNlQ2hvaWNlcyA9IFtdO1xuICAgIH0gZWxzZSBpZiAoZGVmLnJlcGxhY2VDaG9pY2VzKSB7XG5cbiAgICAgIGRlZi5yZXBsYWNlQ2hvaWNlcyA9IGNvbXBpbGVDaG9pY2VzKGRlZi5yZXBsYWNlQ2hvaWNlcyk7XG5cbiAgICAgIGRlZi5yZXBsYWNlQ2hvaWNlc0xhYmVscyA9IHt9O1xuXG4gICAgICBkZWYucmVwbGFjZUNob2ljZXMuZm9yRWFjaChmdW5jdGlvbiAoY2hvaWNlKSB7XG4gICAgICAgIGRlZi5yZXBsYWNlQ2hvaWNlc0xhYmVsc1tjaG9pY2UudmFsdWVdID0gY2hvaWNlLmxhYmVsO1xuICAgICAgfSk7XG4gICAgfVxuICB9O1xufTtcblxufSkuY2FsbCh0aGlzLHR5cGVvZiBnbG9iYWwgIT09IFwidW5kZWZpbmVkXCIgPyBnbG9iYWwgOiB0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOiB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge30pIiwiLy8gIyBjb21waWxlci5sb29rdXBcblxuLypcbkNvbnZlcnQgYSBsb29rdXAgZGVjbGFyYXRpb24gdG8gYW4gZXZhbHVhdGlvbi4gQSBsb29rdXAgcHJvcGVydHkgaXMgdXNlZCBsaWtlOlxuXG5gYGBqc1xue1xuICB0eXBlOiAnc3RyaW5nJyxcbiAga2V5OiAnc3RhdGVzJyxcbiAgbG9va3VwOiB7c291cmNlOiAnbG9jYXRpb25zJywga2V5czogWydjb3VudHJ5J119XG59XG5gYGBcblxuTG9naWNhbGx5LCB0aGUgYWJvdmUgd2lsbCB1c2UgdGhlIGBjb3VudHJ5YCBrZXkgb2YgdGhlIHZhbHVlIHRvIGFzayB0aGVcbmBsb2NhdGlvbnNgIHNvdXJjZSBmb3Igc3RhdGVzIGNob2ljZXMuIFRoaXMgd29ya3MgYnkgY29udmVydGluZyB0aGUgbG9va3VwIHRvXG50aGUgZm9sbG93aW5nIGV2YWx1YXRpb24uXG5cbmBgYGpzXG57XG4gIHR5cGU6ICdzdHJpbmcnLFxuICBrZXk6ICdzdGF0ZXMnLFxuICBjaG9pY2VzOiBbXSxcbiAgZXZhbDoge1xuICAgIG5lZWRzTWV0YTogW1xuICAgICAgWydAaWYnLCBbJ0BnZXRNZXRhJywgJ2xvY2F0aW9ucycsIHtjb3VudHJ5OiBbJ0BnZXQnLCAnY291bnRyeSddfV0sIG51bGwsIFsnbG9jYXRpb25zJywge2NvdW50cnk6IFsnQGdldCcsICdjb3VudHJ5J119XV1cbiAgICBdLFxuICAgIGNob2ljZXM6IFsnQGdldE1ldGEnLCAnbG9jYXRpb25zJywge2NvdW50cnk6IFsnQGdldCcsICdjb3VudHJ5J119XVxuICB9XG59XG5gYGBcblxuVGhlIGFib3ZlIHNheXMgdG8gYWRkIGEgYG5lZWRzTWV0YWAgcHJvcGVydHkgaWYgbmVjZXNzYXJ5IGFuZCBhZGQgYSBgY2hvaWNlc2BcbmFycmF5IGlmIGl0J3MgYXZhaWxhYmxlLiBPdGhlcndpc2UsIGNob2ljZXMgd2lsbCBkZWZhdWx0IHRvIGFuIGVtcHR5IGFycmF5LlxuKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChwbHVnaW4pIHtcblxuICB2YXIgYWRkTG9va3VwID0gZnVuY3Rpb24gKGRlZiwgbG9va3VwUHJvcE5hbWUsIGNob2ljZXNQcm9wTmFtZSkge1xuICAgIHZhciBsb29rdXAgPSBkZWZbbG9va3VwUHJvcE5hbWVdO1xuXG4gICAgaWYgKGxvb2t1cCkge1xuICAgICAgaWYgKCFkZWZbY2hvaWNlc1Byb3BOYW1lXSkge1xuICAgICAgICBkZWZbY2hvaWNlc1Byb3BOYW1lXSA9IFtdO1xuICAgICAgfVxuICAgICAgaWYgKCFkZWYuZXZhbCkge1xuICAgICAgICBkZWYuZXZhbCA9IHt9O1xuICAgICAgfVxuICAgICAgaWYgKCFkZWYuZXZhbC5uZWVkc01ldGEpIHtcbiAgICAgICAgZGVmLmV2YWwubmVlZHNNZXRhID0gW107XG4gICAgICB9XG4gICAgICB2YXIga2V5cyA9IGxvb2t1cC5rZXlzIHx8IFtdO1xuICAgICAgdmFyIHBhcmFtcyA9IHt9O1xuICAgICAgdmFyIG1ldGFBcmdzLCBtZXRhR2V0LCBoaWRkZW5UZXN0O1xuXG4gICAgICBpZiAobG9va3VwLmdyb3VwKSB7XG5cbiAgICAgICAga2V5cy5mb3JFYWNoKGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgICAgICBwYXJhbXNba2V5XSA9IFsnQGdldCcsICdpdGVtJywga2V5XTtcbiAgICAgICAgfSk7XG4gICAgICAgIG1ldGFBcmdzID0gW2xvb2t1cC5zb3VyY2VdLmNvbmNhdChwYXJhbXMpO1xuICAgICAgICBtZXRhR2V0ID0gWydAZ2V0TWV0YSddLmNvbmNhdChtZXRhQXJncyk7XG4gICAgICAgIHZhciBtZXRhRm9yRWFjaCA9IFsnQGZvckVhY2gnLCAnaXRlbScsIFsnQGdldEdyb3VwVmFsdWVzJywgbG9va3VwLmdyb3VwXV07XG4gICAgICAgIGRlZi5ldmFsLm5lZWRzTWV0YS5wdXNoKG1ldGFGb3JFYWNoLmNvbmNhdChbXG4gICAgICAgICAgbWV0YUFyZ3MsXG4gICAgICAgICAgWydAbm90JywgbWV0YUdldF1cbiAgICAgICAgXSkpO1xuICAgICAgICBoaWRkZW5UZXN0ID0gWydAYW5kJ10uY29uY2F0KGtleXMubWFwKGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgICAgICByZXR1cm4gWydAZ2V0JywgJ2l0ZW0nLCBrZXldO1xuICAgICAgICB9KSk7XG4gICAgICAgIGRlZi5ldmFsW2Nob2ljZXNQcm9wTmFtZV0gPSBtZXRhRm9yRWFjaC5jb25jYXQoW1xuICAgICAgICAgIFsnQG9yJywgbWV0YUdldCwgWydAaWYnLCBoaWRkZW5UZXN0LCBbJy8vL2xvYWRpbmcvLy8nXSwgW11dXSxcbiAgICAgICAgICBbJ0BvcicsIGhpZGRlblRlc3QsIG1ldGFHZXRdXG4gICAgICAgIF0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAga2V5cy5mb3JFYWNoKGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgICAgICBwYXJhbXNba2V5XSA9IFsnQGdldCcsIGtleV07XG4gICAgICAgIH0pO1xuICAgICAgICBtZXRhQXJncyA9IFtsb29rdXAuc291cmNlXS5jb25jYXQocGFyYW1zKTtcbiAgICAgICAgbWV0YUdldCA9IFsnQGdldE1ldGEnXS5jb25jYXQobWV0YUFyZ3MpO1xuICAgICAgICB2YXIgbWV0YUdldE9yTG9hZGluZyA9IFsnQG9yJywgbWV0YUdldCwgWycvLy9sb2FkaW5nLy8vJ11dO1xuICAgICAgICBkZWYuZXZhbC5uZWVkc01ldGEucHVzaChbJ0BpZicsIG1ldGFHZXQsIG51bGwsIG1ldGFBcmdzXSk7XG4gICAgICAgIGRlZi5ldmFsW2Nob2ljZXNQcm9wTmFtZV0gPSBtZXRhR2V0T3JMb2FkaW5nO1xuICAgICAgICBpZiAoa2V5cy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgLy8gVGVzdCB0aGF0IHdlIGhhdmUgYWxsIG5lZWRlZCBrZXlzLlxuICAgICAgICAgIGhpZGRlblRlc3QgPSBbJ0BhbmQnXS5jb25jYXQoa2V5cy5tYXAoZnVuY3Rpb24gKGtleSkge1xuICAgICAgICAgICAgcmV0dXJuIFsnQGdldCcsIGtleV07XG4gICAgICAgICAgfSkpO1xuICAgICAgICAgIC8vIFJldmVyc2UgdGVzdCBzbyB3ZSBoaWRlIGlmIGRvbid0IGhhdmUgYWxsIGtleXMuXG4gICAgICAgICAgaGlkZGVuVGVzdCA9IFsnQG5vdCcsIGhpZGRlblRlc3RdO1xuICAgICAgICAgIGlmICghZGVmLmV2YWwuaGlkZGVuKSB7XG4gICAgICAgICAgICBkZWYuZXZhbC5oaWRkZW4gPSBoaWRkZW5UZXN0O1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBkZWxldGUgZGVmW2xvb2t1cFByb3BOYW1lXTtcbiAgICB9XG4gIH07XG5cbiAgcGx1Z2luLmV4cG9ydHMuY29tcGlsZSA9IGZ1bmN0aW9uIChkZWYpIHtcblxuICAgIGFkZExvb2t1cChkZWYsICdsb29rdXAnLCAnY2hvaWNlcycpO1xuICAgIGFkZExvb2t1cChkZWYsICdsb29rdXBSZXBsYWNlbWVudHMnLCAncmVwbGFjZUNob2ljZXMnKTtcbiAgfTtcbn07XG4iLCIvLyAjIGNvbXBpbGVycy5wcm9wLWFsaWFzZXNcblxuLypcbkFsaWFzIHNvbWUgcHJvcGVydGllcyB0byBvdGhlciBwcm9wZXJ0aWVzLlxuKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChwbHVnaW4pIHtcblxuICB2YXIgcHJvcEFsaWFzZXMgPSB7XG4gICAgaGVscF90ZXh0OiAnaGVscFRleHQnXG4gIH07XG5cbiAgcGx1Z2luLmV4cG9ydHMuY29tcGlsZSA9IGZ1bmN0aW9uIChkZWYpIHtcbiAgICBPYmplY3Qua2V5cyhwcm9wQWxpYXNlcykuZm9yRWFjaChmdW5jdGlvbiAoYWxpYXMpIHtcbiAgICAgIHZhciBwcm9wTmFtZSA9IHByb3BBbGlhc2VzW2FsaWFzXTtcbiAgICAgIGlmICh0eXBlb2YgZGVmW3Byb3BOYW1lXSA9PT0gJ3VuZGVmaW5lZCcgJiYgdHlwZW9mIGRlZlthbGlhc10gIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIGRlZltwcm9wTmFtZV0gPSBkZWZbYWxpYXNdO1xuICAgICAgfVxuICAgIH0pO1xuICB9O1xufTtcbiIsIihmdW5jdGlvbiAoZ2xvYmFsKXtcbi8vICMgY29tcGlsZXJzLnR5cGVzXG5cbi8qXG5Db252ZXJ0IHNvbWUgaGlnaC1sZXZlbCB0eXBlcyB0byBsb3ctbGV2ZWwgdHlwZXMgYW5kIHByb3BlcnRpZXMuXG4qL1xuXG4ndXNlIHN0cmljdCc7XG5cbnZhciBfID0gKHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cuXyA6IHR5cGVvZiBnbG9iYWwgIT09IFwidW5kZWZpbmVkXCIgPyBnbG9iYWwuXyA6IG51bGwpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChwbHVnaW4pIHtcblxuICAvLyBNYXAgaGlnaC1sZXZlbCB0eXBlIHRvIGxvdy1sZXZlbCB0eXBlLiBJZiBhIGZ1bmN0aW9uIGlzIHN1cHBsaWVkLCBjYW5cbiAgLy8gbW9kaWZ5IHRoZSBmaWVsZCBkZWZpbml0aW9uLlxuICB2YXIgdHlwZUNvZXJjZSA9IHtcbiAgICB1bmljb2RlOiBmdW5jdGlvbiAoZGVmKSB7XG4gICAgICBkZWYudHlwZSA9ICdzdHJpbmcnO1xuICAgICAgZGVmLm1heFJvd3MgPSAxO1xuICAgIH0sXG4gICAgdGV4dDogJ3N0cmluZycsXG4gICAgc2VsZWN0OiBmdW5jdGlvbiAoZGVmKSB7XG4gICAgICBkZWYuY2hvaWNlcyA9IGRlZi5jaG9pY2VzIHx8IFtdO1xuICAgIH0sXG4gICAgYm9vbDogJ2Jvb2xlYW4nLFxuICAgIGRpY3Q6ICdvYmplY3QnLFxuICAgIGRlY2ltYWw6ICdudW1iZXInLFxuICAgIGludDogJ251bWJlcidcbiAgfTtcblxuICB0eXBlQ29lcmNlLnN0ciA9IHR5cGVDb2VyY2UudW5pY29kZTtcblxuXG4gIHBsdWdpbi5leHBvcnRzLmNvbXBpbGUgPSBmdW5jdGlvbiAoZGVmKSB7XG5cbiAgICB2YXIgY29lcmNlVHlwZSA9IHR5cGVDb2VyY2VbZGVmLnR5cGVdO1xuICAgIGlmIChjb2VyY2VUeXBlKSB7XG4gICAgICBpZiAoXy5pc1N0cmluZyhjb2VyY2VUeXBlKSkge1xuICAgICAgICBkZWYudHlwZSA9IGNvZXJjZVR5cGU7XG4gICAgICB9IGVsc2UgaWYgKF8uaXNGdW5jdGlvbihjb2VyY2VUeXBlKSkge1xuICAgICAgICBkZWYgPSBjb2VyY2VUeXBlKGRlZik7XG4gICAgICB9XG4gICAgfVxuICB9O1xufTtcblxufSkuY2FsbCh0aGlzLHR5cGVvZiBnbG9iYWwgIT09IFwidW5kZWZpbmVkXCIgPyBnbG9iYWwgOiB0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOiB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge30pIiwiKGZ1bmN0aW9uIChnbG9iYWwpe1xuLy8gIyBjb21wb25lbnQuYWRkLWl0ZW1cblxuLypcblRoZSBhZGQgYnV0dG9uIHRvIGFwcGVuZCBhbiBpdGVtIHRvIGEgZmllbGQuXG4qL1xuXG4ndXNlIHN0cmljdCc7XG5cbnZhciBSZWFjdCA9ICh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93LlJlYWN0IDogdHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbC5SZWFjdCA6IG51bGwpO1xudmFyIFIgPSBSZWFjdC5ET007XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKHBsdWdpbikge1xuXG4gIHBsdWdpbi5leHBvcnRzID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXG4gICAgZGlzcGxheU5hbWU6IHBsdWdpbi5uYW1lLFxuXG4gICAgZ2V0RGVmYXVsdFByb3BzOiBmdW5jdGlvbiAoKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBjbGFzc05hbWU6IHBsdWdpbi5jb25maWcuY2xhc3NOYW1lLFxuICAgICAgICBsYWJlbDogcGx1Z2luLmNvbmZpZ1ZhbHVlKCdsYWJlbCcsICdbYWRkXScpXG4gICAgICB9O1xuICAgIH0sXG5cbiAgICByZW5kZXI6IGZ1bmN0aW9uICgpIHtcbiAgICAgIHJldHVybiBSLnNwYW4oe2NsYXNzTmFtZTogdGhpcy5wcm9wcy5jbGFzc05hbWUsIG9uQ2xpY2s6IHRoaXMucHJvcHMub25DbGlja30sIHRoaXMucHJvcHMubGFiZWwpO1xuICAgIH1cbiAgfSk7XG59O1xuXG59KS5jYWxsKHRoaXMsdHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbCA6IHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiID8gc2VsZiA6IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB7fSkiLCIoZnVuY3Rpb24gKGdsb2JhbCl7XG4vLyAjIGNvbXBvbmVudC5jaGVja2JveC1saXN0XG5cbi8qXG5Vc2VkIHdpdGggYXJyYXkgdmFsdWVzIHRvIHN1cHBseSBtdWx0aXBsZSBjaGVja2JveGVzIGZvciBhZGRpbmcgbXVsdGlwbGVcbmVudW1lcmF0ZWQgdmFsdWVzIHRvIGFuIGFycmF5LlxuKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgUmVhY3QgPSAodHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdy5SZWFjdCA6IHR5cGVvZiBnbG9iYWwgIT09IFwidW5kZWZpbmVkXCIgPyBnbG9iYWwuUmVhY3QgOiBudWxsKTtcbnZhciBSID0gUmVhY3QuRE9NO1xudmFyIF8gPSAodHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdy5fIDogdHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbC5fIDogbnVsbCk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKHBsdWdpbikge1xuXG4gIHBsdWdpbi5leHBvcnRzID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXG4gICAgZGlzcGxheU5hbWU6IHBsdWdpbi5uYW1lLFxuXG4gICAgbWl4aW5zOiBbcGx1Z2luLnJlcXVpcmUoJ21peGluLmZpZWxkJyldLFxuXG4gICAgZ2V0RGVmYXVsdFByb3BzOiBmdW5jdGlvbiAoKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBjbGFzc05hbWU6IHBsdWdpbi5jb25maWcuY2xhc3NOYW1lXG4gICAgICB9O1xuICAgIH0sXG5cbiAgICBvbkNoYW5nZTogZnVuY3Rpb24gKCkge1xuICAgICAgLy8gR2V0IGFsbCB0aGUgY2hlY2tlZCBjaGVja2JveGVzIGFuZCBjb252ZXJ0IHRvIGFuIGFycmF5IG9mIHZhbHVlcy5cbiAgICAgIHZhciBjaG9pY2VOb2RlcyA9IHRoaXMucmVmcy5jaG9pY2VzLmdldERPTU5vZGUoKS5nZXRFbGVtZW50c0J5VGFnTmFtZSgnaW5wdXQnKTtcbiAgICAgIGNob2ljZU5vZGVzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoY2hvaWNlTm9kZXMsIDApO1xuICAgICAgdmFyIHZhbHVlcyA9IGNob2ljZU5vZGVzLm1hcChmdW5jdGlvbiAobm9kZSkge1xuICAgICAgICByZXR1cm4gbm9kZS5jaGVja2VkID8gbm9kZS52YWx1ZSA6IG51bGw7XG4gICAgICB9KS5maWx0ZXIoZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICAgIH0pO1xuICAgICAgdGhpcy5wcm9wcy5maWVsZC52YWwodmFsdWVzKTtcbiAgICB9LFxuXG4gICAgcmVuZGVyOiBmdW5jdGlvbiAoKSB7XG5cbiAgICAgIHZhciBmaWVsZCA9IHRoaXMucHJvcHMuZmllbGQ7XG5cbiAgICAgIHZhciBjaG9pY2VzID0gZmllbGQuZGVmLmNob2ljZXMgfHwgW107XG5cbiAgICAgIHZhciBpc0lubGluZSA9ICFfLmZpbmQoY2hvaWNlcywgZnVuY3Rpb24gKGNob2ljZSkge1xuICAgICAgICByZXR1cm4gY2hvaWNlLnNhbXBsZTtcbiAgICAgIH0pO1xuXG4gICAgICB2YXIgdmFsdWUgPSBmaWVsZC52YWx1ZSB8fCBbXTtcblxuICAgICAgcmV0dXJuIHBsdWdpbi5jb21wb25lbnQoJ2ZpZWxkJykoe1xuICAgICAgICBmaWVsZDogZmllbGRcbiAgICAgIH0sXG4gICAgICAgIFIuZGl2KHtjbGFzc05hbWU6IHRoaXMucHJvcHMuY2xhc3NOYW1lLCByZWY6ICdjaG9pY2VzJ30sXG4gICAgICAgICAgY2hvaWNlcy5tYXAoZnVuY3Rpb24gKGNob2ljZSwgaSkge1xuXG4gICAgICAgICAgICB2YXIgaW5wdXRGaWVsZCA9IFIuc3Bhbih7c3R5bGU6IHt3aGl0ZVNwYWNlOiAnbm93cmFwJ319LFxuICAgICAgICAgICAgICBSLmlucHV0KHtcbiAgICAgICAgICAgICAgICBuYW1lOiBmaWVsZC5kZWYua2V5LFxuICAgICAgICAgICAgICAgIHR5cGU6ICdjaGVja2JveCcsXG4gICAgICAgICAgICAgICAgdmFsdWU6IGNob2ljZS52YWx1ZSxcbiAgICAgICAgICAgICAgICBjaGVja2VkOiB2YWx1ZS5pbmRleE9mKGNob2ljZS52YWx1ZSkgPj0gMCA/IHRydWUgOiBmYWxzZSxcbiAgICAgICAgICAgICAgICBvbkNoYW5nZTogdGhpcy5vbkNoYW5nZVxuICAgICAgICAgICAgICAgIC8vb25Gb2N1czogdGhpcy5wcm9wcy5hY3Rpb25zLmZvY3VzXG4gICAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgICAnICcsXG4gICAgICAgICAgICAgIFIuc3Bhbih7Y2xhc3NOYW1lOiAnZmllbGQtY2hvaWNlLWxhYmVsJ30sXG4gICAgICAgICAgICAgICAgY2hvaWNlLmxhYmVsXG4gICAgICAgICAgICAgIClcbiAgICAgICAgICAgICk7XG5cbiAgICAgICAgICAgIGlmIChpc0lubGluZSkge1xuICAgICAgICAgICAgICByZXR1cm4gUi5zcGFuKHtrZXk6IGksIGNsYXNzTmFtZTogJ2ZpZWxkLWNob2ljZSd9LFxuICAgICAgICAgICAgICAgIGlucHV0RmllbGQsICcgJ1xuICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgcmV0dXJuIFIuZGl2KHtrZXk6IGksIGNsYXNzTmFtZTogJ2ZpZWxkLWNob2ljZSd9LFxuICAgICAgICAgICAgICAgIGlucHV0RmllbGQsICcgJyxcbiAgICAgICAgICAgICAgICBwbHVnaW4uY29tcG9uZW50KCdzYW1wbGUnKSh7ZmllbGQ6IGZpZWxkLCBjaG9pY2U6IGNob2ljZX0pXG4gICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfS5iaW5kKHRoaXMpKVxuICAgICAgICApXG4gICAgICApO1xuICAgIH1cbiAgfSk7XG59O1xuXG59KS5jYWxsKHRoaXMsdHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbCA6IHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiID8gc2VsZiA6IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB7fSkiLCIoZnVuY3Rpb24gKGdsb2JhbCl7XG4ndXNlIHN0cmljdCc7XG5cbnZhciBSZWFjdCA9ICh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93LlJlYWN0IDogdHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbC5SZWFjdCA6IG51bGwpO1xudmFyIFIgPSBSZWFjdC5ET007XG52YXIgXyA9ICh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93Ll8gOiB0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsLl8gOiBudWxsKTtcblxudmFyIENTU1RyYW5zaXRpb25Hcm91cCA9IFJlYWN0LmNyZWF0ZUZhY3RvcnkoUmVhY3QuYWRkb25zLkNTU1RyYW5zaXRpb25Hcm91cCk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKHBsdWdpbikge1xuXG4gIHBsdWdpbi5leHBvcnRzID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXG4gICAgbWl4aW5zOiBbXG4gICAgICAvL3BsdWdpbi5yZXF1aXJlKCdtaXhpbi5yZXNpemUnKSxcbiAgICAgIC8vcGx1Z2luLnJlcXVpcmUoJ21peGluLnNjcm9sbCcpLFxuICAgICAgcGx1Z2luLnJlcXVpcmUoJ21peGluLmNsaWNrLW91dHNpZGUnKVxuICAgIF0sXG5cbiAgICBnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uICgpIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIG1heEhlaWdodDogbnVsbCxcbiAgICAgICAgb3BlbjogdGhpcy5wcm9wcy5vcGVuXG4gICAgICB9O1xuICAgIH0sXG4gICAgLy9cbiAgICAvLyBvblRvZ2dsZTogZnVuY3Rpb24gKCkge1xuICAgIC8vICAgdGhpcy5zZXRTdGF0ZSh7b3BlbjogIXRoaXMuc3RhdGUub3Blbn0pO1xuICAgIC8vIH0sXG4gICAgLy9cbiAgICAvLyBvbkNsb3NlOiBmdW5jdGlvbiAoKSB7XG4gICAgLy8gICB0aGlzLnNldFN0YXRlKHtvcGVuOiBmYWxzZX0pO1xuICAgIC8vIH0sXG4gICAgLy9cbiAgICAvLyBmaXhDaG9pY2VzV2lkdGg6IGZ1bmN0aW9uICgpIHtcbiAgICAvLyAgIHRoaXMuc2V0U3RhdGUoe1xuICAgIC8vICAgICBjaG9pY2VzV2lkdGg6IHRoaXMucmVmcy5hY3RpdmUuZ2V0RE9NTm9kZSgpLm9mZnNldFdpZHRoXG4gICAgLy8gICB9KTtcbiAgICAvLyB9LFxuICAgIC8vXG4gICAgLy8gb25SZXNpemVXaW5kb3c6IGZ1bmN0aW9uICgpIHtcbiAgICAvLyAgIHRoaXMuZml4Q2hvaWNlc1dpZHRoKCk7XG4gICAgLy8gfSxcblxuICAgIC8vIGNvbXBvbmVudERpZE1vdW50OiBmdW5jdGlvbiAoKSB7XG4gICAgLy8gICB0aGlzLmZpeENob2ljZXNXaWR0aCgpO1xuICAgIC8vICAgdGhpcy5zZXRPbkNsaWNrT3V0c2lkZSgnc2VsZWN0JywgdGhpcy5vbkNsb3NlKTtcbiAgICAvLyB9LFxuXG4gICAgZ2V0SWdub3JlQ2xvc2VOb2RlczogZnVuY3Rpb24gKCkge1xuICAgICAgaWYgKCF0aGlzLnByb3BzLmlnbm9yZUNsb3NlTm9kZXMpIHtcbiAgICAgICAgcmV0dXJuIFtdO1xuICAgICAgfVxuICAgICAgdmFyIG5vZGVzID0gdGhpcy5wcm9wcy5pZ25vcmVDbG9zZU5vZGVzKCk7XG4gICAgICBpZiAoIV8uaXNBcnJheShub2RlcykpIHtcbiAgICAgICAgbm9kZXMgPSBbbm9kZXNdO1xuICAgICAgfVxuICAgICAgcmV0dXJuIG5vZGVzO1xuICAgIH0sXG5cbiAgICBjb21wb25lbnREaWRNb3VudDogZnVuY3Rpb24gKCkge1xuICAgICAgdGhpcy5zZXRPbkNsaWNrT3V0c2lkZSgnY2hvaWNlcycsIGZ1bmN0aW9uIChldmVudCkge1xuXG4gICAgICAgIC8vIE1ha2Ugc3VyZSB3ZSBkb24ndCBmaW5kIGFueSBub2RlcyB0byBpZ25vcmUuXG4gICAgICAgIGlmICghXy5maW5kKHRoaXMuZ2V0SWdub3JlQ2xvc2VOb2RlcygpLCBmdW5jdGlvbiAobm9kZSkge1xuICAgICAgICAgIHJldHVybiB0aGlzLmlzTm9kZUluc2lkZShldmVudC50YXJnZXQsIG5vZGUpO1xuICAgICAgICB9LmJpbmQodGhpcykpKSB7XG4gICAgICAgICAgdGhpcy5wcm9wcy5vbkNsb3NlKCk7XG4gICAgICAgIH1cbiAgICAgIH0uYmluZCh0aGlzKSk7XG5cbiAgICAgIHRoaXMuYWRqdXN0U2l6ZSgpO1xuICAgIH0sXG5cbiAgICBvblNlbGVjdDogZnVuY3Rpb24gKGNob2ljZSkge1xuICAgICAgdGhpcy5wcm9wcy5vblNlbGVjdChjaG9pY2UudmFsdWUpO1xuICAgIH0sXG5cbiAgICBvblJlc2l6ZVdpbmRvdzogZnVuY3Rpb24gKCkge1xuICAgICAgdGhpcy5hZGp1c3RTaXplKCk7XG4gICAgfSxcblxuICAgIG9uU2Nyb2xsV2luZG93OiBmdW5jdGlvbiAoKSB7XG4gICAgICB0aGlzLmFkanVzdFNpemUoKTtcbiAgICB9LFxuXG4gICAgYWRqdXN0U2l6ZTogZnVuY3Rpb24gKCkge1xuICAgICAgaWYgKHRoaXMucmVmcy5jaG9pY2VzKSB7XG4gICAgICAgIHZhciBub2RlID0gdGhpcy5yZWZzLmNob2ljZXMuZ2V0RE9NTm9kZSgpO1xuICAgICAgICB2YXIgcmVjdCA9IG5vZGUuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgICAgIHZhciB0b3AgPSByZWN0LnRvcDtcbiAgICAgICAgdmFyIHdpbmRvd0hlaWdodCA9IHdpbmRvdy5pbm5lckhlaWdodDtcbiAgICAgICAgdmFyIGhlaWdodCA9IHdpbmRvd0hlaWdodCAtIHRvcDtcbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICAgICAgbWF4SGVpZ2h0OiBoZWlnaHRcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfSxcblxuICAgIGNvbXBvbmVudFdpbGxSZWNlaXZlUHJvcHM6IGZ1bmN0aW9uIChuZXh0UHJvcHMpIHtcbiAgICAgIHRoaXMuc2V0U3RhdGUoe29wZW46IG5leHRQcm9wcy5vcGVufSwgZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLmFkanVzdFNpemUoKTtcbiAgICAgIH0uYmluZCh0aGlzKSk7XG4gICAgfSxcblxuICAgIG9uU2Nyb2xsOiBmdW5jdGlvbiAoKSB7XG4gICAgICAvLyBjb25zb2xlLmxvZygnc3RvcCB0aGF0IScpXG4gICAgICAvLyBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgLy8gZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgfSxcblxuICAgIG9uV2hlZWw6IGZ1bmN0aW9uICgpIHtcbiAgICAgIC8vIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAvLyBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICB9LFxuXG4gICAgcmVuZGVyOiBmdW5jdGlvbiAoKSB7XG5cbiAgICAgIHZhciBjaG9pY2VzID0gdGhpcy5wcm9wcy5jaG9pY2VzO1xuXG4gICAgICBpZiAoY2hvaWNlcyAmJiBjaG9pY2VzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICBjaG9pY2VzID0gW3t2YWx1ZTogJy8vL2VtcHR5Ly8vJ31dO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gUi5kaXYoe3JlZjogJ2NvbnRhaW5lcicsIG9uV2hlZWw6IHRoaXMub25XaGVlbCwgb25TY3JvbGw6IHRoaXMub25TY3JvbGwsIGNsYXNzTmFtZTogJ2Nob2ljZXMtY29udGFpbmVyJywgc3R5bGU6IHtcbiAgICAgICAgdXNlclNlbGVjdDogJ25vbmUnLCBXZWJraXRVc2VyU2VsZWN0OiAnbm9uZScsIHBvc2l0aW9uOiAnYWJzb2x1dGUnLFxuICAgICAgICBtYXhIZWlnaHQ6IHRoaXMuc3RhdGUubWF4SGVpZ2h0ID8gdGhpcy5zdGF0ZS5tYXhIZWlnaHQgOiBudWxsXG4gICAgICB9fSxcbiAgICAgICAgQ1NTVHJhbnNpdGlvbkdyb3VwKHt0cmFuc2l0aW9uTmFtZTogJ3JldmVhbCd9LFxuICAgICAgICAgIHRoaXMucHJvcHMub3BlbiA/IFIudWwoe3JlZjogJ2Nob2ljZXMnLCBjbGFzc05hbWU6ICdjaG9pY2VzJ30sXG4gICAgICAgICAgICBjaG9pY2VzLm1hcChmdW5jdGlvbiAoY2hvaWNlLCBpKSB7XG5cbiAgICAgICAgICAgICAgdmFyIGNob2ljZUVsZW1lbnQgPSBudWxsO1xuXG4gICAgICAgICAgICAgIGlmIChjaG9pY2UudmFsdWUgPT09ICcvLy9sb2FkaW5nLy8vJykge1xuICAgICAgICAgICAgICAgIGNob2ljZUVsZW1lbnQgPSBSLmEoe2hyZWY6ICdKYXZhU2NyaXB0JyArICc6Jywgb25DbGljazogdGhpcy5wcm9wcy5vbkNsb3NlfSxcbiAgICAgICAgICAgICAgICAgIFIuc3Bhbih7Y2xhc3NOYW1lOiAnY2hvaWNlLWxhYmVsJ30sXG4gICAgICAgICAgICAgICAgICAgICdMb2FkaW5nLi4uJ1xuICAgICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgIH0gZWxzZSBpZiAoY2hvaWNlLnZhbHVlID09PSAnLy8vZW1wdHkvLy8nKSB7XG4gICAgICAgICAgICAgICAgY2hvaWNlRWxlbWVudCA9IFIuYSh7aHJlZjogJ0phdmFTY3JpcHQnICsgJzonLCBvbkNsaWNrOiB0aGlzLnByb3BzLm9uQ2xvc2V9LFxuICAgICAgICAgICAgICAgICAgUi5zcGFuKHtjbGFzc05hbWU6ICdjaG9pY2UtbGFiZWwnfSxcbiAgICAgICAgICAgICAgICAgICAgJ05vIGNob2ljZXMgYXZhaWxhYmxlLidcbiAgICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGNob2ljZUVsZW1lbnQgPSBSLmEoe2hyZWY6ICdKYXZhU2NyaXB0JyArICc6Jywgb25DbGljazogdGhpcy5vblNlbGVjdC5iaW5kKHRoaXMsIGNob2ljZSl9LFxuICAgICAgICAgICAgICAgICAgUi5zcGFuKHtjbGFzc05hbWU6ICdjaG9pY2UtbGFiZWwnfSxcbiAgICAgICAgICAgICAgICAgICAgY2hvaWNlLmxhYmVsXG4gICAgICAgICAgICAgICAgICApLFxuICAgICAgICAgICAgICAgICAgUi5zcGFuKHtjbGFzc05hbWU6ICdjaG9pY2Utc2FtcGxlJ30sXG4gICAgICAgICAgICAgICAgICAgIGNob2ljZS5zYW1wbGVcbiAgICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgcmV0dXJuIFIubGkoe2tleTogaSwgY2xhc3NOYW1lOiAnY2hvaWNlJ30sXG4gICAgICAgICAgICAgICAgY2hvaWNlRWxlbWVudFxuICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgfS5iaW5kKHRoaXMpKVxuICAgICAgICAgICkgOiBudWxsXG4gICAgICAgIClcbiAgICAgICk7XG5cblxuICAgICAgLy8gdmFyIGNsYXNzTmFtZSA9IGZvcm1hdGljLmNsYXNzTmFtZSgnZHJvcGRvd24tZmllbGQnLCBwbHVnaW4uY29uZmlnLmNsYXNzTmFtZSwgdGhpcy5wcm9wcy5maWVsZC5jbGFzc05hbWUpO1xuICAgICAgLy9cbiAgICAgIC8vIHZhciBzZWxlY3RlZExhYmVsID0gJyc7XG4gICAgICAvLyB2YXIgbWF0Y2hpbmdMYWJlbHMgPSB0aGlzLnByb3BzLmZpZWxkLmNob2ljZXMuZmlsdGVyKGZ1bmN0aW9uIChjaG9pY2UpIHtcbiAgICAgIC8vICAgcmV0dXJuIGNob2ljZS52YWx1ZSA9PT0gdGhpcy5wcm9wcy5maWVsZC52YWx1ZTtcbiAgICAgIC8vIH0uYmluZCh0aGlzKSk7XG4gICAgICAvLyBpZiAobWF0Y2hpbmdMYWJlbHMubGVuZ3RoID4gMCkge1xuICAgICAgLy8gICBzZWxlY3RlZExhYmVsID0gbWF0Y2hpbmdMYWJlbHNbMF0ubGFiZWw7XG4gICAgICAvLyB9XG4gICAgICAvLyBzZWxlY3RlZExhYmVsID0gc2VsZWN0ZWRMYWJlbCB8fCAnXFx1MDBhMCc7XG4gICAgICAvL1xuICAgICAgLy8gcmV0dXJuIFIuZGl2KF8uZXh0ZW5kKHtjbGFzc05hbWU6IGNsYXNzTmFtZSwgcmVmOiAnc2VsZWN0J30sIHBsdWdpbi5jb25maWcuYXR0cmlidXRlcyksXG4gICAgICAvLyAgIFIuZGl2KHtjbGFzc05hbWU6ICdmaWVsZC12YWx1ZScsIHJlZjogJ2FjdGl2ZScsIG9uQ2xpY2s6IHRoaXMub25Ub2dnbGV9LCBzZWxlY3RlZExhYmVsKSxcbiAgICAgIC8vICAgUi5kaXYoe2NsYXNzTmFtZTogJ2ZpZWxkLXRvZ2dsZSAnICsgKHRoaXMuc3RhdGUub3BlbiA/ICdmaWVsZC1vcGVuJyA6ICdmaWVsZC1jbG9zZWQnKSwgb25DbGljazogdGhpcy5vblRvZ2dsZX0pLFxuICAgICAgLy8gICBSZWFjdC5hZGRvbnMuQ1NTVHJhbnNpdGlvbkdyb3VwKHt0cmFuc2l0aW9uTmFtZTogJ3JldmVhbCd9LFxuICAgICAgLy8gICAgIFIuZGl2KHtjbGFzc05hbWU6ICdmaWVsZC1jaG9pY2VzLWNvbnRhaW5lcid9LFxuICAgICAgLy8gICAgICAgdGhpcy5zdGF0ZS5vcGVuID8gUi51bCh7cmVmOiAnY2hvaWNlcycsIGNsYXNzTmFtZTogJ2ZpZWxkLWNob2ljZXMnLCBzdHlsZToge3dpZHRoOiB0aGlzLnN0YXRlLmNob2ljZXNXaWR0aH19LFxuICAgICAgLy8gICAgICAgICB0aGlzLnByb3BzLmZpZWxkLmNob2ljZXMubWFwKGZ1bmN0aW9uIChjaG9pY2UpIHtcbiAgICAgIC8vICAgICAgICAgICByZXR1cm4gUi5saSh7XG4gICAgICAvLyAgICAgICAgICAgICBjbGFzc05hbWU6ICdmaWVsZC1jaG9pY2UnLFxuICAgICAgLy8gICAgICAgICAgICAgb25DbGljazogZnVuY3Rpb24gKCkge1xuICAgICAgLy8gICAgICAgICAgICAgICB0aGlzLnNldFN0YXRlKHtvcGVuOiBmYWxzZX0pO1xuICAgICAgLy8gICAgICAgICAgICAgICB0aGlzLnByb3BzLmZvcm0uYWN0aW9ucy5jaGFuZ2UodGhpcy5wcm9wcy5maWVsZCwgY2hvaWNlLnZhbHVlKTtcbiAgICAgIC8vICAgICAgICAgICAgIH0uYmluZCh0aGlzKVxuICAgICAgLy8gICAgICAgICAgIH0sIGNob2ljZS5sYWJlbCk7XG4gICAgICAvLyAgICAgICAgIH0uYmluZCh0aGlzKSlcbiAgICAgIC8vICAgICAgICkgOiBbXVxuICAgICAgLy8gICAgIClcbiAgICAgIC8vICAgKVxuICAgICAgLy8gKTtcbiAgICB9XG4gIH0pO1xufTtcblxuXG4vLyBjb21wb25lbnREaWRNb3VudDogZnVuY3Rpb24gKCkge1xuLy8gICB0aGlzLnNldE9uQ2xpY2tPdXRzaWRlKCdjaG9pY2VzJywgZnVuY3Rpb24gKGV2ZW50KSB7XG4vL1xuLy8gICAgIC8vIE1ha2Ugc3VyZSB3ZSBkb24ndCBmaW5kIGFueSBub2RlcyB0byBpZ25vcmUuXG4vLyAgICAgaWYgKCFfLmZpbmQodGhpcy5nZXRJZ25vcmVDbG9zZU5vZGVzKCksIGZ1bmN0aW9uIChub2RlKSB7XG4vLyAgICAgICBjb25zb2xlLmxvZyhub2RlLCBldmVudC50YXJnZXQpXG4vLyAgICAgICByZXR1cm4gIXRoaXMuaXNOb2RlT3V0c2lkZShub2RlLCBldmVudC50YXJnZXQpO1xuLy8gICAgIH0uYmluZCh0aGlzKSkpIHtcbi8vICAgICAgIGNvbnNvbGUubG9nKFwiaG93Pz8/XCIpXG4vLyAgICAgICB0aGlzLnByb3BzLm9uQ2xvc2UoKTtcbi8vICAgICB9XG4vLyAgIH0uYmluZCh0aGlzKSk7XG4vLyB9LFxuLy9cbi8vIG9uU2VsZWN0OiBmdW5jdGlvbiAoY2hvaWNlKSB7XG4vLyAgIHRoaXMucHJvcHMub25TZWxlY3QoY2hvaWNlLnZhbHVlKTtcbi8vIH0sXG4vL1xuLy8gcmVuZGVyOiBmdW5jdGlvbiAoKSB7XG4vL1xuLy8gICByZXR1cm4gUi5kaXYoe3JlZjogJ2NvbnRhaW5lcicsIGNsYXNzTmFtZTogJ2Nob2ljZXMtY29udGFpbmVyJywgc3R5bGU6IHt1c2VyU2VsZWN0OiAnbm9uZScsIFdlYmtpdFVzZXJTZWxlY3Q6ICdub25lJywgcG9zaXRpb246ICdhYnNvbHV0ZSd9fSxcbi8vICAgICB0aGlzLnByb3BzLm9wZW4gP1xuLy8gICAgICAgQ1NTVHJhbnNpdGlvbkdyb3VwKHt0cmFuc2l0aW9uTmFtZTogJ3JldmVhbCd9LFxuLy8gICAgICAgICBSLnVsKHtyZWY6ICdjaG9pY2VzJywgY2xhc3NOYW1lOiAnY2hvaWNlcyd9LFxuLy8gICAgICAgICAgIHRoaXMucHJvcHMuY2hvaWNlcy5tYXAoZnVuY3Rpb24gKGNob2ljZSwgaSkge1xuLy8gICAgICAgICAgICAgcmV0dXJuIFIubGkoe2tleTogaSwgY2xhc3NOYW1lOiAnY2hvaWNlJ30sXG4vLyAgICAgICAgICAgICAgIFIuYSh7aHJlZjogJ0phdmFTY3JpcHQ6JyArICcnLCBvbkNsaWNrOiB0aGlzLm9uU2VsZWN0LmJpbmQodGhpcywgY2hvaWNlKX0sXG4vLyAgICAgICAgICAgICAgICAgUi5zcGFuKHtjbGFzc05hbWU6ICdjaG9pY2UtbGFiZWwnfSxcbi8vICAgICAgICAgICAgICAgICAgIGNob2ljZS5sYWJlbFxuLy8gICAgICAgICAgICAgICAgICksXG4vLyAgICAgICAgICAgICAgICAgUi5zcGFuKHtjbGFzc05hbWU6ICdjaG9pY2Utc2FtcGxlJ30sXG4vLyAgICAgICAgICAgICAgICAgICBjaG9pY2Uuc2FtcGxlXG4vLyAgICAgICAgICAgICAgICAgKVxuLy8gICAgICAgICAgICAgICApXG4vLyAgICAgICAgICAgICApO1xuLy8gICAgICAgICAgIH0uYmluZCh0aGlzKSlcbi8vICAgICAgICAgKVxuLy8gICAgICAgKVxuLy8gICAgICAgOiBudWxsXG4vLyAgICk7XG5cbn0pLmNhbGwodGhpcyx0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsIDogdHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDogdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9KSIsIihmdW5jdGlvbiAoZ2xvYmFsKXtcbi8vICMgY29tcG9uZW50LmZpZWxkXG5cbi8qXG5Vc2VkIGJ5IGFueSBmaWVsZHMgdG8gcHV0IHRoZSBsYWJlbCBhbmQgaGVscCB0ZXh0IGFyb3VuZCB0aGUgZmllbGQuXG4qL1xuXG4ndXNlIHN0cmljdCc7XG5cbnZhciBSZWFjdCA9ICh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93LlJlYWN0IDogdHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbC5SZWFjdCA6IG51bGwpO1xudmFyIFIgPSBSZWFjdC5ET007XG52YXIgXyA9ICh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93Ll8gOiB0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsLl8gOiBudWxsKTtcblxudmFyIENTU1RyYW5zaXRpb25Hcm91cCA9IFJlYWN0LmNyZWF0ZUZhY3RvcnkoUmVhY3QuYWRkb25zLkNTU1RyYW5zaXRpb25Hcm91cCk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKHBsdWdpbikge1xuXG4gIHBsdWdpbi5leHBvcnRzID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXG4gICAgZGlzcGxheU5hbWU6IHBsdWdpbi5uYW1lLFxuXG4gICAgZ2V0RGVmYXVsdFByb3BzOiBmdW5jdGlvbiAoKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBjbGFzc05hbWU6IHBsdWdpbi5jb25maWcuY2xhc3NOYW1lXG4gICAgICB9O1xuICAgIH0sXG5cbiAgICBnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uICgpIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIGNvbGxhcHNlZDogdGhpcy5wcm9wcy5maWVsZC5kZWYuY29sbGFwc2VkID8gdHJ1ZSA6IGZhbHNlXG4gICAgICB9O1xuICAgIH0sXG5cbiAgICBpc0NvbGxhcHNpYmxlOiBmdW5jdGlvbiAoKSB7XG4gICAgICB2YXIgZmllbGQgPSB0aGlzLnByb3BzLmZpZWxkO1xuXG4gICAgICByZXR1cm4gIV8uaXNVbmRlZmluZWQoZmllbGQuZGVmLmNvbGxhcHNlZCkgfHwgIV8uaXNVbmRlZmluZWQoZmllbGQuZGVmLmNvbGxhcHNpYmxlKTtcbiAgICB9LFxuXG4gICAgb25DbGlja0xhYmVsOiBmdW5jdGlvbiAoKSB7XG4gICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgY29sbGFwc2VkOiAhdGhpcy5zdGF0ZS5jb2xsYXBzZWRcbiAgICAgIH0pO1xuICAgIH0sXG5cbiAgICByZW5kZXI6IGZ1bmN0aW9uICgpIHtcblxuICAgICAgdmFyIGZpZWxkID0gdGhpcy5wcm9wcy5maWVsZDtcblxuICAgICAgdmFyIGluZGV4ID0gdGhpcy5wcm9wcy5pbmRleDtcbiAgICAgIGlmICghXy5pc051bWJlcihpbmRleCkpIHtcbiAgICAgICAgaW5kZXggPSBfLmlzTnVtYmVyKGZpZWxkLmRlZi5rZXkpID8gZmllbGQuZGVmLmtleSA6IHVuZGVmaW5lZDtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIFIuZGl2KHtjbGFzc05hbWU6IHRoaXMucHJvcHMuY2xhc3NOYW1lLCBzdHlsZToge2Rpc3BsYXk6IChmaWVsZC5oaWRkZW4oKSA/ICdub25lJyA6ICcnKX19LFxuICAgICAgICBwbHVnaW4uY29tcG9uZW50KCdsYWJlbCcpKHtmaWVsZDogZmllbGQsIGluZGV4OiBpbmRleCwgb25DbGljazogdGhpcy5pc0NvbGxhcHNpYmxlKCkgPyB0aGlzLm9uQ2xpY2tMYWJlbCA6IG51bGx9KSxcbiAgICAgICAgQ1NTVHJhbnNpdGlvbkdyb3VwKHt0cmFuc2l0aW9uTmFtZTogJ3JldmVhbCd9LFxuICAgICAgICAgIHRoaXMuc3RhdGUuY29sbGFwc2VkID8gW10gOiBbXG4gICAgICAgICAgICBwbHVnaW4uY29tcG9uZW50KCdoZWxwJykoe2tleTogJ2hlbHAnLCBmaWVsZDogZmllbGR9KSxcbiAgICAgICAgICAgIHRoaXMucHJvcHMuY2hpbGRyZW5cbiAgICAgICAgICBdXG4gICAgICAgIClcbiAgICAgICk7XG4gICAgfVxuICB9KTtcbn07XG5cbn0pLmNhbGwodGhpcyx0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsIDogdHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDogdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9KSIsIihmdW5jdGlvbiAoZ2xvYmFsKXtcbi8vICMgY29tcG9uZW50LmZpZWxkc2V0XG5cbi8qXG5SZW5kZXIgbXVsdGlwbGUgY2hpbGQgZmllbGRzIGZvciBhIGZpZWxkLlxuKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgUmVhY3QgPSAodHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdy5SZWFjdCA6IHR5cGVvZiBnbG9iYWwgIT09IFwidW5kZWZpbmVkXCIgPyBnbG9iYWwuUmVhY3QgOiBudWxsKTtcbnZhciBSID0gUmVhY3QuRE9NO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChwbHVnaW4pIHtcblxuICBwbHVnaW4uZXhwb3J0cyA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcblxuICAgIGRpc3BsYXlOYW1lOiBwbHVnaW4ubmFtZSxcblxuICAgIG1peGluczogW3BsdWdpbi5yZXF1aXJlKCdtaXhpbi5maWVsZCcpXSxcblxuICAgIGdldERlZmF1bHRQcm9wczogZnVuY3Rpb24gKCkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgY2xhc3NOYW1lOiBwbHVnaW4uY29uZmlnLmNsYXNzTmFtZVxuICAgICAgfTtcbiAgICB9LFxuXG4gICAgcmVuZGVyOiBmdW5jdGlvbiAoKSB7XG4gICAgICB2YXIgZmllbGQgPSB0aGlzLnByb3BzLmZpZWxkO1xuXG4gICAgICByZXR1cm4gcGx1Z2luLmNvbXBvbmVudCgnZmllbGQnKSh7XG4gICAgICAgIGZpZWxkOiBmaWVsZFxuICAgICAgfSxcbiAgICAgICAgUi5maWVsZHNldCh7Y2xhc3NOYW1lOiB0aGlzLnByb3BzLmNsYXNzTmFtZX0sXG4gICAgICAgICAgZmllbGQuZmllbGRzKCkubWFwKGZ1bmN0aW9uIChmaWVsZCwgaSkge1xuICAgICAgICAgICAgcmV0dXJuIGZpZWxkLmNvbXBvbmVudCh7a2V5OiBmaWVsZC5kZWYua2V5IHx8IGl9KTtcbiAgICAgICAgICB9LmJpbmQodGhpcykpXG4gICAgICAgIClcbiAgICAgICk7XG4gICAgfVxuICB9KTtcbn07XG5cbn0pLmNhbGwodGhpcyx0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsIDogdHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDogdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9KSIsIihmdW5jdGlvbiAoZ2xvYmFsKXtcbi8vICMgY29tcG9uZW50LmhlbHBcblxuLypcbkp1c3QgdGhlIGhlbHAgdGV4dCBibG9jay5cbiovXG5cbid1c2Ugc3RyaWN0JztcblxudmFyIFJlYWN0ID0gKHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cuUmVhY3QgOiB0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsLlJlYWN0IDogbnVsbCk7XG52YXIgUiA9IFJlYWN0LkRPTTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAocGx1Z2luKSB7XG5cbiAgcGx1Z2luLmV4cG9ydHMgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG5cbiAgICBkaXNwbGF5TmFtZTogcGx1Z2luLm5hbWUsXG5cbiAgICBnZXREZWZhdWx0UHJvcHM6IGZ1bmN0aW9uICgpIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIGNsYXNzTmFtZTogcGx1Z2luLmNvbmZpZy5jbGFzc05hbWVcbiAgICAgIH07XG4gICAgfSxcblxuICAgIHJlbmRlcjogZnVuY3Rpb24gKCkge1xuXG4gICAgICB2YXIgZmllbGQgPSB0aGlzLnByb3BzLmZpZWxkO1xuXG4gICAgICByZXR1cm4gZmllbGQuZGVmLmhlbHBUZXh0ID9cbiAgICAgICAgUi5kaXYoe2NsYXNzTmFtZTogdGhpcy5wcm9wcy5jbGFzc05hbWV9LFxuICAgICAgICAgIGZpZWxkLmRlZi5oZWxwVGV4dFxuICAgICAgICApIDpcbiAgICAgICAgUi5zcGFuKG51bGwpO1xuICAgIH1cbiAgfSk7XG59O1xuXG59KS5jYWxsKHRoaXMsdHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbCA6IHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiID8gc2VsZiA6IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB7fSkiLCIoZnVuY3Rpb24gKGdsb2JhbCl7XG4vLyAjIGNvbXBvbmVudC5pdGVtLWNob2ljZXNcblxuLypcbkdpdmUgYSBsaXN0IG9mIGNob2ljZXMgb2YgaXRlbSB0eXBlcyB0byBjcmVhdGUgYXMgY2hpbGRyZW4gb2YgYW4gZmllbGQuXG4qL1xuXG4ndXNlIHN0cmljdCc7XG5cbnZhciBSZWFjdCA9ICh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93LlJlYWN0IDogdHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbC5SZWFjdCA6IG51bGwpO1xudmFyIFIgPSBSZWFjdC5ET007XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKHBsdWdpbikge1xuXG4gIHBsdWdpbi5leHBvcnRzID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXG4gICAgZGlzcGxheU5hbWU6IHBsdWdpbi5uYW1lLFxuXG4gICAgZ2V0RGVmYXVsdFByb3BzOiBmdW5jdGlvbiAoKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBjbGFzc05hbWU6IHBsdWdpbi5jb25maWcuY2xhc3NOYW1lXG4gICAgICB9O1xuICAgIH0sXG5cbiAgICBvbkNoYW5nZTogZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICB0aGlzLnByb3BzLm9uU2VsZWN0KHBhcnNlSW50KGV2ZW50LnRhcmdldC52YWx1ZSkpO1xuICAgIH0sXG5cbiAgICByZW5kZXI6IGZ1bmN0aW9uICgpIHtcblxuICAgICAgdmFyIGZpZWxkID0gdGhpcy5wcm9wcy5maWVsZDtcblxuICAgICAgdmFyIHR5cGVDaG9pY2VzID0gbnVsbDtcbiAgICAgIGlmIChmaWVsZC5pdGVtcygpLmxlbmd0aCA+IDApIHtcbiAgICAgICAgdHlwZUNob2ljZXMgPSBSLnNlbGVjdCh7Y2xhc3NOYW1lOiB0aGlzLnByb3BzLmNsYXNzTmFtZSwgdmFsdWU6IHRoaXMudmFsdWUsIG9uQ2hhbmdlOiB0aGlzLm9uQ2hhbmdlfSxcbiAgICAgICAgICBmaWVsZC5pdGVtcygpLm1hcChmdW5jdGlvbiAoaXRlbSwgaSkge1xuICAgICAgICAgICAgcmV0dXJuIFIub3B0aW9uKHtrZXk6IGksIHZhbHVlOiBpfSwgaXRlbS5sYWJlbCB8fCBpKTtcbiAgICAgICAgICB9KVxuICAgICAgICApO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gdHlwZUNob2ljZXMgPyB0eXBlQ2hvaWNlcyA6IFIuc3BhbihudWxsKTtcbiAgICB9XG4gIH0pO1xufTtcblxufSkuY2FsbCh0aGlzLHR5cGVvZiBnbG9iYWwgIT09IFwidW5kZWZpbmVkXCIgPyBnbG9iYWwgOiB0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOiB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge30pIiwiKGZ1bmN0aW9uIChnbG9iYWwpe1xuLy8gIyBjb21wb25lbnQuanNvblxuXG4vKlxuVGV4dGFyZWEgZWRpdG9yIGZvciBKU09OLiBXaWxsIHZhbGlkYXRlIHRoZSBKU09OIGJlZm9yZSBzZXR0aW5nIHRoZSB2YWx1ZSwgc29cbndoaWxlIHRoZSB2YWx1ZSBpcyBpbnZhbGlkLCBubyBleHRlcm5hbCBzdGF0ZSBjaGFuZ2VzIHdpbGwgb2NjdXIuXG4qL1xuXG4ndXNlIHN0cmljdCc7XG5cbnZhciBSZWFjdCA9ICh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93LlJlYWN0IDogdHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbC5SZWFjdCA6IG51bGwpO1xudmFyIFIgPSBSZWFjdC5ET007XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKHBsdWdpbikge1xuXG4gIHBsdWdpbi5leHBvcnRzID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXG4gICAgZGlzcGxheU5hbWU6IHBsdWdpbi5uYW1lLFxuXG4gICAgbWl4aW5zOiBbcGx1Z2luLnJlcXVpcmUoJ21peGluLmZpZWxkJyldLFxuXG4gICAgZ2V0RGVmYXVsdFByb3BzOiBmdW5jdGlvbiAoKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBjbGFzc05hbWU6IHBsdWdpbi5jb25maWcuY2xhc3NOYW1lLFxuICAgICAgICByb3dzOiBwbHVnaW4uY29uZmlnLnJvd3MgfHwgNVxuICAgICAgfTtcbiAgICB9LFxuXG4gICAgaXNWYWxpZFZhbHVlOiBmdW5jdGlvbiAodmFsdWUpIHtcblxuICAgICAgdHJ5IHtcbiAgICAgICAgSlNPTi5wYXJzZSh2YWx1ZSk7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgfSxcblxuICAgIGdldEluaXRpYWxTdGF0ZTogZnVuY3Rpb24gKCkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgaXNWYWxpZDogdHJ1ZSxcbiAgICAgICAgdmFsdWU6IEpTT04uc3RyaW5naWZ5KHRoaXMucHJvcHMuZmllbGQudmFsdWUsIG51bGwsIDIpXG4gICAgICB9O1xuICAgIH0sXG5cbiAgICBvbkNoYW5nZTogZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICB2YXIgaXNWYWxpZCA9IHRoaXMuaXNWYWxpZFZhbHVlKGV2ZW50LnRhcmdldC52YWx1ZSk7XG5cbiAgICAgIGlmIChpc1ZhbGlkKSB7XG4gICAgICAgIC8vIE5lZWQgdG8gaGFuZGxlIHRoaXMgYmV0dGVyLiBOZWVkIHRvIHRyYWNrIHBvc2l0aW9uLlxuICAgICAgICB0aGlzLl9pc0NoYW5naW5nID0gdHJ1ZTtcbiAgICAgICAgdGhpcy5wcm9wcy5maWVsZC52YWwoSlNPTi5wYXJzZShldmVudC50YXJnZXQudmFsdWUpKTtcbiAgICAgIH1cblxuICAgICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICAgIGlzVmFsaWQ6IGlzVmFsaWQsXG4gICAgICAgIHZhbHVlOiBldmVudC50YXJnZXQudmFsdWVcbiAgICAgIH0pO1xuICAgIH0sXG5cbiAgICBjb21wb25lbnRXaWxsUmVjZWl2ZVByb3BzOiBmdW5jdGlvbiAobmV4dFByb3BzKSB7XG4gICAgICBpZiAoIXRoaXMuX2lzQ2hhbmdpbmcpIHtcbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICAgICAgaXNWYWxpZDogdHJ1ZSxcbiAgICAgICAgICB2YWx1ZTogSlNPTi5zdHJpbmdpZnkobmV4dFByb3BzLmZpZWxkLnZhbHVlLCBudWxsLCAyKVxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgIHRoaXMuX2lzQ2hhbmdpbmcgPSBmYWxzZTtcbiAgICB9LFxuXG4gICAgcmVuZGVyOiBmdW5jdGlvbiAoKSB7XG5cbiAgICAgIHZhciBmaWVsZCA9IHRoaXMucHJvcHMuZmllbGQ7XG5cbiAgICAgIHJldHVybiBwbHVnaW4uY29tcG9uZW50KCdmaWVsZCcpKHtcbiAgICAgICAgZmllbGQ6IGZpZWxkXG4gICAgICB9LCBSLnRleHRhcmVhKHtcbiAgICAgICAgICBjbGFzc05hbWU6IHRoaXMucHJvcHMuY2xhc3NOYW1lLFxuICAgICAgICAgIHZhbHVlOiB0aGlzLnN0YXRlLnZhbHVlLFxuICAgICAgICAgIG9uQ2hhbmdlOiB0aGlzLm9uQ2hhbmdlLFxuICAgICAgICAgIHN0eWxlOiB7YmFja2dyb3VuZENvbG9yOiB0aGlzLnN0YXRlLmlzVmFsaWQgPyAnJyA6ICdyZ2IoMjU1LDIwMCwyMDApJ30sXG4gICAgICAgICAgcm93czogZmllbGQuZGVmLnJvd3MgfHwgdGhpcy5wcm9wcy5yb3dzXG4gICAgICAgIH0pXG4gICAgICApO1xuICAgIH1cbiAgfSk7XG59O1xuXG59KS5jYWxsKHRoaXMsdHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbCA6IHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiID8gc2VsZiA6IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB7fSkiLCIoZnVuY3Rpb24gKGdsb2JhbCl7XG4vLyAjIGNvbXBvbmVudC5sYWJlbFxuXG4vKlxuSnVzdCB0aGUgbGFiZWwgZm9yIGEgZmllbGQuXG4qL1xuXG4ndXNlIHN0cmljdCc7XG5cbnZhciBSZWFjdCA9ICh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93LlJlYWN0IDogdHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbC5SZWFjdCA6IG51bGwpO1xudmFyIFIgPSBSZWFjdC5ET007XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKHBsdWdpbikge1xuXG4gIHBsdWdpbi5leHBvcnRzID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXG4gICAgZGlzcGxheU5hbWU6IHBsdWdpbi5uYW1lLFxuXG4gICAgZ2V0RGVmYXVsdFByb3BzOiBmdW5jdGlvbiAoKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBjbGFzc05hbWU6IHBsdWdpbi5jb25maWcuY2xhc3NOYW1lXG4gICAgICB9O1xuICAgIH0sXG5cbiAgICByZW5kZXI6IGZ1bmN0aW9uICgpIHtcblxuICAgICAgdmFyIGZpZWxkID0gdGhpcy5wcm9wcy5maWVsZDtcblxuICAgICAgdmFyIGxhYmVsID0gbnVsbDtcbiAgICAgIGlmICh0eXBlb2YgdGhpcy5wcm9wcy5pbmRleCA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgbGFiZWwgPSAnJyArICh0aGlzLnByb3BzLmluZGV4ICsgMSkgKyAnLic7XG4gICAgICAgIGlmIChmaWVsZC5kZWYubGFiZWwpIHtcbiAgICAgICAgICBsYWJlbCA9IGxhYmVsICsgJyAnICsgZmllbGQuZGVmLmxhYmVsO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmIChmaWVsZC5kZWYubGFiZWwgfHwgbGFiZWwpIHtcbiAgICAgICAgdmFyIHRleHQgPSBsYWJlbCB8fCBmaWVsZC5kZWYubGFiZWw7XG4gICAgICAgIGlmICh0aGlzLnByb3BzLm9uQ2xpY2spIHtcbiAgICAgICAgICB0ZXh0ID0gUi5hKHtocmVmOiAnSmF2YVNjcmlwdCcgKyAnOicsIG9uQ2xpY2s6IHRoaXMucHJvcHMub25DbGlja30sIHRleHQpO1xuICAgICAgICB9XG4gICAgICAgIGxhYmVsID0gUi5sYWJlbCh7fSwgdGV4dCk7XG4gICAgICB9XG5cbiAgICAgIHZhciByZXF1aXJlZCA9IFIuc3Bhbih7Y2xhc3NOYW1lOiAncmVxdWlyZWQtdGV4dCd9KTtcblxuICAgICAgcmV0dXJuIFIuZGl2KHtcbiAgICAgICAgY2xhc3NOYW1lOiB0aGlzLnByb3BzLmNsYXNzTmFtZVxuICAgICAgfSxcbiAgICAgICAgbGFiZWwsXG4gICAgICAgICcgJyxcbiAgICAgICAgcmVxdWlyZWRcbiAgICAgICk7XG4gICAgfVxuICB9KTtcbn07XG5cbn0pLmNhbGwodGhpcyx0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsIDogdHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDogdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9KSIsIihmdW5jdGlvbiAoZ2xvYmFsKXtcbi8vICMgY29tcG9uZW50Lmxpc3QtY29udHJvbFxuXG4vKlxuUmVuZGVyIHRoZSBpdGVtIHR5cGUgY2hvaWNlcyBhbmQgdGhlIGFkZCBidXR0b24uXG4qL1xuXG4ndXNlIHN0cmljdCc7XG5cbnZhciBSZWFjdCA9ICh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93LlJlYWN0IDogdHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbC5SZWFjdCA6IG51bGwpO1xudmFyIFIgPSBSZWFjdC5ET007XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKHBsdWdpbikge1xuXG4gIHBsdWdpbi5leHBvcnRzID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXG4gICAgZGlzcGxheU5hbWU6IHBsdWdpbi5uYW1lLFxuXG4gICAgZ2V0RGVmYXVsdFByb3BzOiBmdW5jdGlvbiAoKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBjbGFzc05hbWU6IHBsdWdpbi5jb25maWcuY2xhc3NOYW1lXG4gICAgICB9O1xuICAgIH0sXG5cbiAgICBnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uICgpIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIGl0ZW1JbmRleDogMFxuICAgICAgfTtcbiAgICB9LFxuXG4gICAgb25TZWxlY3Q6IGZ1bmN0aW9uIChpbmRleCkge1xuICAgICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICAgIGl0ZW1JbmRleDogaW5kZXhcbiAgICAgIH0pO1xuICAgIH0sXG5cbiAgICBvbkFwcGVuZDogZnVuY3Rpb24gKCkge1xuICAgICAgdGhpcy5wcm9wcy5vbkFwcGVuZCh0aGlzLnN0YXRlLml0ZW1JbmRleCk7XG4gICAgfSxcblxuICAgIHJlbmRlcjogZnVuY3Rpb24gKCkge1xuXG4gICAgICB2YXIgZmllbGQgPSB0aGlzLnByb3BzLmZpZWxkO1xuXG4gICAgICB2YXIgdHlwZUNob2ljZXMgPSBudWxsO1xuXG4gICAgICBpZiAoZmllbGQuaXRlbXMoKS5sZW5ndGggPiAwKSB7XG4gICAgICAgIHR5cGVDaG9pY2VzID0gcGx1Z2luLmNvbXBvbmVudCgnaXRlbS1jaG9pY2VzJykoe2ZpZWxkOiBmaWVsZCwgdmFsdWU6IHRoaXMuc3RhdGUuaXRlbUluZGV4LCBvblNlbGVjdDogdGhpcy5vblNlbGVjdH0pO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gUi5kaXYoe2NsYXNzTmFtZTogdGhpcy5wcm9wcy5jbGFzc05hbWV9LFxuICAgICAgICB0eXBlQ2hvaWNlcywgJyAnLFxuICAgICAgICBwbHVnaW4uY29tcG9uZW50KCdhZGQtaXRlbScpKHtvbkNsaWNrOiB0aGlzLm9uQXBwZW5kfSlcbiAgICAgICk7XG4gICAgfVxuICB9KTtcbn07XG5cbn0pLmNhbGwodGhpcyx0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsIDogdHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDogdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9KSIsIihmdW5jdGlvbiAoZ2xvYmFsKXtcbi8vICMgY29tcG9uZW50Lmxpc3QtaXRlbS1jb250cm9sXG5cbi8qXG5SZW5kZXIgdGhlIHJlbW92ZSBhbmQgbW92ZSBidXR0b25zIGZvciBhIGZpZWxkLlxuKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgUmVhY3QgPSAodHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdy5SZWFjdCA6IHR5cGVvZiBnbG9iYWwgIT09IFwidW5kZWZpbmVkXCIgPyBnbG9iYWwuUmVhY3QgOiBudWxsKTtcbnZhciBSID0gUmVhY3QuRE9NO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChwbHVnaW4pIHtcblxuICBwbHVnaW4uZXhwb3J0cyA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcblxuICAgIGRpc3BsYXlOYW1lOiBwbHVnaW4ubmFtZSxcblxuICAgIGdldERlZmF1bHRQcm9wczogZnVuY3Rpb24gKCkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgY2xhc3NOYW1lOiBwbHVnaW4uY29uZmlnLmNsYXNzTmFtZVxuICAgICAgfTtcbiAgICB9LFxuXG4gICAgb25Nb3ZlQmFjazogZnVuY3Rpb24gKCkge1xuICAgICAgdGhpcy5wcm9wcy5vbk1vdmUodGhpcy5wcm9wcy5pbmRleCwgdGhpcy5wcm9wcy5pbmRleCAtIDEpO1xuICAgIH0sXG5cbiAgICBvbk1vdmVGb3J3YXJkOiBmdW5jdGlvbiAoKSB7XG4gICAgICB0aGlzLnByb3BzLm9uTW92ZSh0aGlzLnByb3BzLmluZGV4LCB0aGlzLnByb3BzLmluZGV4ICsgMSk7XG4gICAgfSxcblxuICAgIG9uUmVtb3ZlOiBmdW5jdGlvbiAoKSB7XG4gICAgICB0aGlzLnByb3BzLm9uUmVtb3ZlKHRoaXMucHJvcHMuaW5kZXgpO1xuICAgIH0sXG5cbiAgICByZW5kZXI6IGZ1bmN0aW9uICgpIHtcbiAgICAgIHZhciBmaWVsZCA9IHRoaXMucHJvcHMuZmllbGQ7XG5cbiAgICAgIHJldHVybiBSLmRpdih7Y2xhc3NOYW1lOiB0aGlzLnByb3BzLmNsYXNzTmFtZX0sXG4gICAgICAgIHBsdWdpbi5jb21wb25lbnQoJ3JlbW92ZS1pdGVtJykoe2ZpZWxkOiBmaWVsZCwgb25DbGljazogdGhpcy5vblJlbW92ZX0pLFxuICAgICAgICB0aGlzLnByb3BzLmluZGV4ID4gMCA/IHBsdWdpbi5jb21wb25lbnQoJ21vdmUtaXRlbS1iYWNrJykoe29uQ2xpY2s6IHRoaXMub25Nb3ZlQmFja30pIDogbnVsbCxcbiAgICAgICAgdGhpcy5wcm9wcy5pbmRleCA8ICh0aGlzLnByb3BzLm51bUl0ZW1zIC0gMSkgPyBwbHVnaW4uY29tcG9uZW50KCdtb3ZlLWl0ZW0tZm9yd2FyZCcpKHtvbkNsaWNrOiB0aGlzLm9uTW92ZUZvcndhcmR9KSA6IG51bGxcbiAgICAgICk7XG4gICAgfVxuICB9KTtcbn07XG5cbn0pLmNhbGwodGhpcyx0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsIDogdHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDogdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9KSIsIihmdW5jdGlvbiAoZ2xvYmFsKXtcbi8vICMgY29tcG9uZW50Lmxpc3QtaXRlbS12YWx1ZVxuXG4vKlxuUmVuZGVyIHRoZSB2YWx1ZSBvZiBhIGxpc3QgaXRlbS5cbiovXG5cbid1c2Ugc3RyaWN0JztcblxudmFyIFJlYWN0ID0gKHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cuUmVhY3QgOiB0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsLlJlYWN0IDogbnVsbCk7XG52YXIgUiA9IFJlYWN0LkRPTTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAocGx1Z2luKSB7XG5cbiAgcGx1Z2luLmV4cG9ydHMgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG5cbiAgICBkaXNwbGF5TmFtZTogcGx1Z2luLm5hbWUsXG5cbiAgICBnZXREZWZhdWx0UHJvcHM6IGZ1bmN0aW9uICgpIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIGNsYXNzTmFtZTogcGx1Z2luLmNvbmZpZy5jbGFzc05hbWVcbiAgICAgIH07XG4gICAgfSxcblxuICAgIHJlbmRlcjogZnVuY3Rpb24gKCkge1xuICAgICAgdmFyIGZpZWxkID0gdGhpcy5wcm9wcy5maWVsZDtcblxuICAgICAgcmV0dXJuIFIuZGl2KHtjbGFzc05hbWU6IHRoaXMucHJvcHMuY2xhc3NOYW1lfSxcbiAgICAgICAgZmllbGQuY29tcG9uZW50KClcbiAgICAgICAgLy8gcGx1Z2luLmNvbXBvbmVudCgnZmllbGQnKSh7XG4gICAgICAgIC8vICAgZmllbGQ6IGZpZWxkLFxuICAgICAgICAvLyAgIGluZGV4OiB0aGlzLnByb3BzLmluZGV4XG4gICAgICAgIC8vIH0sXG4gICAgICAgIC8vICAgZmllbGQuY29tcG9uZW50KClcbiAgICAgICAgLy8gKVxuICAgICAgKTtcbiAgICB9XG4gIH0pO1xufTtcblxufSkuY2FsbCh0aGlzLHR5cGVvZiBnbG9iYWwgIT09IFwidW5kZWZpbmVkXCIgPyBnbG9iYWwgOiB0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOiB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge30pIiwiKGZ1bmN0aW9uIChnbG9iYWwpe1xuLy8gIyBjb21wb25lbnQubGlzdC1pdGVtXG5cbi8qXG5SZW5kZXIgYSBsaXN0IGl0ZW0uXG4qL1xuXG4ndXNlIHN0cmljdCc7XG5cbnZhciBSZWFjdCA9ICh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93LlJlYWN0IDogdHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbC5SZWFjdCA6IG51bGwpO1xudmFyIFIgPSBSZWFjdC5ET007XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKHBsdWdpbikge1xuXG4gIHBsdWdpbi5leHBvcnRzID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXG4gICAgZGlzcGxheU5hbWU6IHBsdWdpbi5uYW1lLFxuXG4gICAgZ2V0RGVmYXVsdFByb3BzOiBmdW5jdGlvbiAoKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBjbGFzc05hbWU6IHBsdWdpbi5jb25maWcuY2xhc3NOYW1lXG4gICAgICB9O1xuICAgIH0sXG5cbiAgICByZW5kZXI6IGZ1bmN0aW9uICgpIHtcbiAgICAgIHZhciBmaWVsZCA9IHRoaXMucHJvcHMuZmllbGQ7XG5cbiAgICAgIHJldHVybiBSLmRpdih7Y2xhc3NOYW1lOiB0aGlzLnByb3BzLmNsYXNzTmFtZX0sXG4gICAgICAgIHBsdWdpbi5jb21wb25lbnQoJ2xpc3QtaXRlbS12YWx1ZScpKHtmb3JtOiB0aGlzLnByb3BzLmZvcm0sIGZpZWxkOiBmaWVsZCwgaW5kZXg6IHRoaXMucHJvcHMuaW5kZXh9KSxcbiAgICAgICAgcGx1Z2luLmNvbXBvbmVudCgnbGlzdC1pdGVtLWNvbnRyb2wnKSh7ZmllbGQ6IGZpZWxkLCBpbmRleDogdGhpcy5wcm9wcy5pbmRleCwgbnVtSXRlbXM6IHRoaXMucHJvcHMubnVtSXRlbXMsIG9uTW92ZTogdGhpcy5wcm9wcy5vbk1vdmUsIG9uUmVtb3ZlOiB0aGlzLnByb3BzLm9uUmVtb3ZlfSlcbiAgICAgICk7XG4gICAgfVxuICB9KTtcbn07XG5cbn0pLmNhbGwodGhpcyx0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsIDogdHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDogdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9KSIsIihmdW5jdGlvbiAoZ2xvYmFsKXtcbi8vICMgY29tcG9uZW50Lmxpc3RcblxuLypcblJlbmRlciBhIGxpc3QuXG4qL1xuXG4ndXNlIHN0cmljdCc7XG5cbnZhciBSZWFjdCA9ICh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93LlJlYWN0IDogdHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbC5SZWFjdCA6IG51bGwpO1xudmFyIFIgPSBSZWFjdC5ET007XG5cbnZhciBDU1NUcmFuc2l0aW9uR3JvdXAgPSBSZWFjdC5jcmVhdGVGYWN0b3J5KFJlYWN0LmFkZG9ucy5DU1NUcmFuc2l0aW9uR3JvdXApO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChwbHVnaW4pIHtcblxuICBwbHVnaW4uZXhwb3J0cyA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcblxuICAgIGRpc3BsYXlOYW1lOiBwbHVnaW4ubmFtZSxcblxuICAgIG1peGluczogW3BsdWdpbi5yZXF1aXJlKCdtaXhpbi5maWVsZCcpXSxcblxuICAgIGdldERlZmF1bHRQcm9wczogZnVuY3Rpb24gKCkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgY2xhc3NOYW1lOiBwbHVnaW4uY29uZmlnLmNsYXNzTmFtZVxuICAgICAgfTtcbiAgICB9LFxuXG4gICAgbmV4dExvb2t1cElkOiAwLFxuXG4gICAgZ2V0SW5pdGlhbFN0YXRlOiBmdW5jdGlvbiAoKSB7XG5cbiAgICAgIC8vIE5lZWQgdG8gY3JlYXRlIGFydGlmaWNpYWwga2V5cyBmb3IgdGhlIGFycmF5LiBJbmRleGVzIGFyZSBub3QgZ29vZCBrZXlzLFxuICAgICAgLy8gc2luY2UgdGhleSBjaGFuZ2UuIFNvLCBtYXAgZWFjaCBwb3NpdGlvbiB0byBhbiBhcnRpZmljaWFsIGtleVxuICAgICAgdmFyIGxvb2t1cHMgPSBbXTtcbiAgICAgIHRoaXMucHJvcHMuZmllbGQuZmllbGRzKCkuZm9yRWFjaChmdW5jdGlvbiAoZmllbGQsIGkpIHtcbiAgICAgICAgbG9va3Vwc1tpXSA9ICdfJyArIHRoaXMubmV4dExvb2t1cElkO1xuICAgICAgICB0aGlzLm5leHRMb29rdXBJZCsrO1xuICAgICAgfS5iaW5kKHRoaXMpKTtcblxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgbG9va3VwczogbG9va3Vwc1xuICAgICAgfTtcbiAgICB9LFxuXG4gICAgY29tcG9uZW50V2lsbFJlY2VpdmVQcm9wczogZnVuY3Rpb24gKG5ld1Byb3BzKSB7XG5cbiAgICAgIHZhciBsb29rdXBzID0gdGhpcy5zdGF0ZS5sb29rdXBzO1xuICAgICAgdmFyIGZpZWxkcyA9IG5ld1Byb3BzLmZpZWxkLmZpZWxkcygpO1xuXG4gICAgICAvLyBOZWVkIHRvIHNldCBhcnRpZmljaWFsIGtleXMgZm9yIG5ldyBhcnJheSBpdGVtcy5cbiAgICAgIGlmIChmaWVsZHMubGVuZ3RoID4gbG9va3Vwcy5sZW5ndGgpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IGxvb2t1cHMubGVuZ3RoOyBpIDwgZmllbGRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgbG9va3Vwc1tpXSA9ICdfJyArIHRoaXMubmV4dExvb2t1cElkO1xuICAgICAgICAgIHRoaXMubmV4dExvb2t1cElkKys7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICAgIGxvb2t1cHM6IGxvb2t1cHNcbiAgICAgIH0pO1xuICAgIH0sXG5cbiAgICBvbkFwcGVuZDogZnVuY3Rpb24gKGl0ZW1JbmRleCkge1xuICAgICAgdGhpcy5wcm9wcy5maWVsZC5hcHBlbmQoaXRlbUluZGV4KTtcbiAgICB9LFxuICAgIC8vXG4gICAgLy8gb25DbGlja0xhYmVsOiBmdW5jdGlvbiAoaSkge1xuICAgIC8vICAgaWYgKHRoaXMucHJvcHMuZmllbGQuY29sbGFwc2FibGVJdGVtcykge1xuICAgIC8vICAgICB2YXIgY29sbGFwc2VkO1xuICAgIC8vICAgICAvLyBpZiAoIXRoaXMuc3RhdGUuY29sbGFwc2VkW2ldKSB7XG4gICAgLy8gICAgIC8vICAgY29sbGFwc2VkID0gdGhpcy5zdGF0ZS5jb2xsYXBzZWQ7XG4gICAgLy8gICAgIC8vICAgY29sbGFwc2VkW2ldID0gdHJ1ZTtcbiAgICAvLyAgICAgLy8gICB0aGlzLnNldFN0YXRlKHtjb2xsYXBzZWQ6IGNvbGxhcHNlZH0pO1xuICAgIC8vICAgICAvLyB9IGVsc2Uge1xuICAgIC8vICAgICAvLyAgIGNvbGxhcHNlZCA9IHRoaXMucHJvcHMuZmllbGQuZmllbGRzLm1hcChmdW5jdGlvbiAoKSB7XG4gICAgLy8gICAgIC8vICAgICByZXR1cm4gdHJ1ZTtcbiAgICAvLyAgICAgLy8gICB9KTtcbiAgICAvLyAgICAgLy8gICBjb2xsYXBzZWRbaV0gPSBmYWxzZTtcbiAgICAvLyAgICAgLy8gICB0aGlzLnNldFN0YXRlKHtjb2xsYXBzZWQ6IGNvbGxhcHNlZH0pO1xuICAgIC8vICAgICAvLyB9XG4gICAgLy8gICAgIGNvbGxhcHNlZCA9IHRoaXMuc3RhdGUuY29sbGFwc2VkO1xuICAgIC8vICAgICBjb2xsYXBzZWRbaV0gPSAhY29sbGFwc2VkW2ldO1xuICAgIC8vICAgICB0aGlzLnNldFN0YXRlKHtjb2xsYXBzZWQ6IGNvbGxhcHNlZH0pO1xuICAgIC8vICAgfVxuICAgIC8vIH0sXG4gICAgLy9cbiAgICBvblJlbW92ZTogZnVuY3Rpb24gKGkpIHtcbiAgICAgIHZhciBsb29rdXBzID0gdGhpcy5zdGF0ZS5sb29rdXBzO1xuICAgICAgbG9va3Vwcy5zcGxpY2UoaSwgMSk7XG4gICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgbG9va3VwczogbG9va3Vwc1xuICAgICAgfSk7XG4gICAgICB0aGlzLnByb3BzLmZpZWxkLnJlbW92ZShpKTtcbiAgICB9LFxuICAgIC8vXG4gICAgb25Nb3ZlOiBmdW5jdGlvbiAoZnJvbUluZGV4LCB0b0luZGV4KSB7XG4gICAgICB2YXIgbG9va3VwcyA9IHRoaXMuc3RhdGUubG9va3VwcztcbiAgICAgIHZhciBmcm9tSWQgPSBsb29rdXBzW2Zyb21JbmRleF07XG4gICAgICB2YXIgdG9JZCA9IGxvb2t1cHNbdG9JbmRleF07XG4gICAgICBsb29rdXBzW2Zyb21JbmRleF0gPSB0b0lkO1xuICAgICAgbG9va3Vwc1t0b0luZGV4XSA9IGZyb21JZDtcbiAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICBsb29rdXBzOiBsb29rdXBzXG4gICAgICB9KTtcbiAgICAgIHRoaXMucHJvcHMuZmllbGQubW92ZShmcm9tSW5kZXgsIHRvSW5kZXgpO1xuICAgIH0sXG5cbiAgICByZW5kZXI6IGZ1bmN0aW9uICgpIHtcblxuICAgICAgdmFyIGZpZWxkID0gdGhpcy5wcm9wcy5maWVsZDtcbiAgICAgIHZhciBmaWVsZHMgPSBmaWVsZC5maWVsZHMoKTtcblxuICAgICAgdmFyIG51bUl0ZW1zID0gZmllbGRzLmxlbmd0aDtcbiAgICAgIHJldHVybiBwbHVnaW4uY29tcG9uZW50KCdmaWVsZCcpKHtcbiAgICAgICAgZmllbGQ6IGZpZWxkXG4gICAgICB9LFxuICAgICAgICBSLmRpdih7Y2xhc3NOYW1lOiB0aGlzLnByb3BzLmNsYXNzTmFtZX0sXG4gICAgICAgICAgQ1NTVHJhbnNpdGlvbkdyb3VwKHt0cmFuc2l0aW9uTmFtZTogJ3JldmVhbCd9LFxuICAgICAgICAgICAgZmllbGRzLm1hcChmdW5jdGlvbiAoY2hpbGQsIGkpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIHBsdWdpbi5jb21wb25lbnQoJ2xpc3QtaXRlbScpKHtcbiAgICAgICAgICAgICAgICBrZXk6IHRoaXMuc3RhdGUubG9va3Vwc1tpXSxcbiAgICAgICAgICAgICAgICBmb3JtOiB0aGlzLnByb3BzLmZvcm0sXG4gICAgICAgICAgICAgICAgZmllbGQ6IGNoaWxkLFxuICAgICAgICAgICAgICAgIHBhcmVudDogZmllbGQsXG4gICAgICAgICAgICAgICAgaW5kZXg6IGksXG4gICAgICAgICAgICAgICAgbnVtSXRlbXM6IG51bUl0ZW1zLFxuICAgICAgICAgICAgICAgIG9uTW92ZTogdGhpcy5vbk1vdmUsXG4gICAgICAgICAgICAgICAgb25SZW1vdmU6IHRoaXMub25SZW1vdmVcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9LmJpbmQodGhpcykpXG4gICAgICAgICAgKSxcbiAgICAgICAgICBwbHVnaW4uY29tcG9uZW50KCdsaXN0LWNvbnRyb2wnKSh7ZmllbGQ6IGZpZWxkLCBvbkFwcGVuZDogdGhpcy5vbkFwcGVuZH0pXG4gICAgICAgIClcbiAgICAgICk7XG4gICAgfVxuICB9KTtcbn07XG5cbn0pLmNhbGwodGhpcyx0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsIDogdHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDogdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9KSIsIihmdW5jdGlvbiAoZ2xvYmFsKXtcbi8vICMgY29tcG9uZW50Lm1vdmUtaXRlbS1iYWNrXG5cbi8qXG5CdXR0b24gdG8gbW92ZSBhbiBpdGVtIGJhY2t3YXJkcyBpbiBsaXN0LlxuKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgUmVhY3QgPSAodHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdy5SZWFjdCA6IHR5cGVvZiBnbG9iYWwgIT09IFwidW5kZWZpbmVkXCIgPyBnbG9iYWwuUmVhY3QgOiBudWxsKTtcbnZhciBSID0gUmVhY3QuRE9NO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChwbHVnaW4pIHtcblxuICBwbHVnaW4uZXhwb3J0cyA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcblxuICAgIGRpc3BsYXlOYW1lOiBwbHVnaW4ubmFtZSxcblxuICAgIGdldERlZmF1bHRQcm9wczogZnVuY3Rpb24gKCkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgY2xhc3NOYW1lOiBwbHVnaW4uY29uZmlnLmNsYXNzTmFtZSxcbiAgICAgICAgbGFiZWw6IHBsdWdpbi5jb25maWdWYWx1ZSgnbGFiZWwnLCAnW3VwXScpXG4gICAgICB9O1xuICAgIH0sXG5cbiAgICByZW5kZXI6IGZ1bmN0aW9uICgpIHtcbiAgICAgIHJldHVybiBSLnNwYW4oe2NsYXNzTmFtZTogdGhpcy5wcm9wcy5jbGFzc05hbWUsIG9uQ2xpY2s6IHRoaXMucHJvcHMub25DbGlja30sIHRoaXMucHJvcHMubGFiZWwpO1xuICAgIH1cbiAgfSk7XG59O1xuXG59KS5jYWxsKHRoaXMsdHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbCA6IHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiID8gc2VsZiA6IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB7fSkiLCIoZnVuY3Rpb24gKGdsb2JhbCl7XG4vLyAjIGNvbXBvbmVudC5tb3ZlLWl0ZW0tZm9yd2FyZFxuXG4vKlxuQnV0dG9uIHRvIG1vdmUgYW4gaXRlbSBmb3J3YXJkIGluIGEgbGlzdC5cbiovXG5cbid1c2Ugc3RyaWN0JztcblxudmFyIFJlYWN0ID0gKHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cuUmVhY3QgOiB0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsLlJlYWN0IDogbnVsbCk7XG52YXIgUiA9IFJlYWN0LkRPTTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAocGx1Z2luKSB7XG5cbiAgcGx1Z2luLmV4cG9ydHMgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG5cbiAgICBkaXNwbGF5TmFtZTogcGx1Z2luLm5hbWUsXG5cbiAgICBnZXREZWZhdWx0UHJvcHM6IGZ1bmN0aW9uICgpIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIGNsYXNzTmFtZTogcGx1Z2luLmNvbmZpZy5jbGFzc05hbWUsXG4gICAgICAgIGxhYmVsOiBwbHVnaW4uY29uZmlnVmFsdWUoJ2xhYmVsJywgJ1tkb3duXScpXG4gICAgICB9O1xuICAgIH0sXG5cbiAgICByZW5kZXI6IGZ1bmN0aW9uICgpIHtcbiAgICAgIHJldHVybiBSLnNwYW4oe2NsYXNzTmFtZTogdGhpcy5wcm9wcy5jbGFzc05hbWUsIG9uQ2xpY2s6IHRoaXMucHJvcHMub25DbGlja30sIHRoaXMucHJvcHMubGFiZWwpO1xuICAgIH1cbiAgfSk7XG59O1xuXG59KS5jYWxsKHRoaXMsdHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbCA6IHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiID8gc2VsZiA6IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB7fSkiLCIoZnVuY3Rpb24gKGdsb2JhbCl7XG4vLyAjIGNvbXBvbmVudC5wcmV0dHktdGV4dGFyZWFcblxuLypcblRleHRhcmVhIHRoYXQgd2lsbCBkaXNwbGF5IGhpZ2hsaWdodHMgYmVoaW5kIFwidGFnc1wiLiBUYWdzIGN1cnJlbnRseSBtZWFuIHRleHRcbnRoYXQgaXMgZW5jbG9zZWQgaW4gYnJhY2VzIGxpa2UgYHt7Zm9vfX1gLiBUYWdzIGFyZSByZXBsYWNlZCB3aXRoIGxhYmVscyBpZlxuYXZhaWxhYmxlIG9yIGh1bWFuaXplZC5cblxuVGhpcyBjb21wb25lbnQgaXMgcXVpdGUgY29tcGxpY2F0ZWQgYmVjYXVzZTpcbi0gV2UgYXJlIGRpc3BsYXlpbmcgdGV4dCBpbiB0aGUgdGV4dGFyZWEgYnV0IGhhdmUgdG8ga2VlcCB0cmFjayBvZiB0aGUgcmVhbFxuICB0ZXh0IHZhbHVlIGluIHRoZSBiYWNrZ3JvdW5kLiBXZSBjYW4ndCB1c2UgYSBkYXRhIGF0dHJpYnV0ZSwgYmVjYXVzZSBpdCdzIGFcbiAgdGV4dGFyZWEsIHNvIHdlIGNhbid0IHVzZSBhbnkgZWxlbWVudHMgYXQgYWxsIVxuLSBCZWNhdXNlIG9mIHRoZSBoaWRkZW4gZGF0YSwgd2UgYWxzbyBoYXZlIHRvIGRvIHNvbWUgaW50ZXJjZXB0aW9uIG9mXG4gIGNvcHksIHdoaWNoIGlzIGEgbGl0dGxlIHdlaXJkLiBXZSBpbnRlcmNlcHQgY29weSBhbmQgY29weSB0aGUgcmVhbCB0ZXh0XG4gIHRvIHRoZSBlbmQgb2YgdGhlIHRleHRhcmVhLiBUaGVuIHdlIGVyYXNlIHRoYXQgdGV4dCwgd2hpY2ggbGVhdmVzIHRoZSBjb3BpZWRcbiAgZGF0YSBpbiB0aGUgYnVmZmVyLlxuLSBSZWFjdCBsb3NlcyB0aGUgY2FyZXQgcG9zaXRpb24gd2hlbiB5b3UgdXBkYXRlIHRoZSB2YWx1ZSB0byBzb21ldGhpbmdcbiAgZGlmZmVyZW50IHRoYW4gYmVmb3JlLiBTbyB3ZSBoYXZlIHRvIHJldGFpbiB0cmFja2luZyBpbmZvcm1hdGlvbiBmb3Igd2hlblxuICB0aGF0IGhhcHBlbnMuXG4tIEJlY2F1c2Ugd2UgbW9ua2V5IHdpdGggY29weSwgd2UgYWxzbyBoYXZlIHRvIGRvIG91ciBvd24gdW5kby9yZWRvLiBPdGhlcndpc2VcbiAgdGhlIGRlZmF1bHQgdW5kbyB3aWxsIGhhdmUgd2VpcmQgc3RhdGVzIGluIGl0LlxuXG5TbyBnb29kIGx1Y2shXG4qL1xuXG4ndXNlIHN0cmljdCc7XG5cbnZhciBSZWFjdCA9ICh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93LlJlYWN0IDogdHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbC5SZWFjdCA6IG51bGwpO1xudmFyIFIgPSBSZWFjdC5ET007XG52YXIgXyA9ICh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93Ll8gOiB0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsLl8gOiBudWxsKTtcblxudmFyIG5vQnJlYWsgPSBmdW5jdGlvbiAodmFsdWUpIHtcbiAgcmV0dXJuIHZhbHVlLnJlcGxhY2UoLyAvZywgJ1xcdTAwYTAnKTtcbn07XG5cbnZhciBMRUZUX1BBRCA9ICdcXHUwMGEwXFx1MDBhMCc7XG4vLyBXaHkgdGhpcyB3b3JrcywgSSdtIG5vdCBzdXJlLlxudmFyIFJJR0hUX1BBRCA9ICcgICc7IC8vJ1xcdTAwYTBcXHUwMGEwJztcblxudmFyIGlkUHJlZml4UmVnRXggPSAvXlswLTldK19fLztcblxuLy8gWmFwaWVyIHNwZWNpZmljIHN0dWZmLiBNYWtlIGEgcGx1Z2luIGZvciB0aGlzIGxhdGVyLlxudmFyIHJlbW92ZUlkUHJlZml4ID0gZnVuY3Rpb24gKGtleSkge1xuICBpZiAoaWRQcmVmaXhSZWdFeC50ZXN0KGtleSkpIHtcbiAgICByZXR1cm4ga2V5LnJlcGxhY2UoaWRQcmVmaXhSZWdFeCwgJycpO1xuICB9XG4gIHJldHVybiBrZXk7XG59O1xuXG52YXIgcG9zaXRpb25Jbk5vZGUgPSBmdW5jdGlvbiAocG9zaXRpb24sIG5vZGUpIHtcbiAgdmFyIHJlY3QgPSBub2RlLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICBpZiAocG9zaXRpb24ueCA+PSByZWN0LmxlZnQgJiYgcG9zaXRpb24ueCA8PSByZWN0LnJpZ2h0KSB7XG4gICAgaWYgKHBvc2l0aW9uLnkgPj0gcmVjdC50b3AgJiYgcG9zaXRpb24ueSA8PSByZWN0LmJvdHRvbSkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChwbHVnaW4pIHtcblxuICB2YXIgdXRpbCA9IHBsdWdpbi5yZXF1aXJlKCd1dGlsJyk7XG5cbiAgcGx1Z2luLmV4cG9ydHMgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG5cbiAgICBkaXNwbGF5TmFtZTogcGx1Z2luLm5hbWUsXG5cbiAgICBtaXhpbnM6IFtwbHVnaW4ucmVxdWlyZSgnbWl4aW4uZmllbGQnKSwgcGx1Z2luLnJlcXVpcmUoJ21peGluLnVuZG8tc3RhY2snKSwgcGx1Z2luLnJlcXVpcmUoJ21peGluLnJlc2l6ZScpXSxcblxuICAgIGdldERlZmF1bHRQcm9wczogZnVuY3Rpb24gKCkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgY2xhc3NOYW1lOiBwbHVnaW4uY29uZmlnLmNsYXNzTmFtZVxuICAgICAgfTtcbiAgICB9LFxuXG4gICAgZ2V0SW5pdGlhbFN0YXRlOiBmdW5jdGlvbiAoKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICB1bmRvRGVwdGg6IDEwMCxcbiAgICAgICAgaXNDaG9pY2VzT3BlbjogZmFsc2UsXG4gICAgICAgIGhvdmVyUGlsbFJlZjogbnVsbFxuICAgICAgfTtcbiAgICB9LFxuXG4gICAgY29tcG9uZW50V2lsbE1vdW50OiBmdW5jdGlvbiAoKSB7XG4gICAgICAvLyBOb3QgcXVpdGUgc3RhdGUsIHRoaXMgaXMgZm9yIHRyYWNraW5nIHNlbGVjdGlvbiBpbmZvLlxuICAgICAgdGhpcy50cmFja2luZyA9IHt9O1xuXG4gICAgICB2YXIgcGFydHMgPSB1dGlsLnBhcnNlVGV4dFdpdGhUYWdzKHRoaXMucHJvcHMuZmllbGQudmFsdWUpO1xuICAgICAgdmFyIHRva2VucyA9IHRoaXMudG9rZW5zKHBhcnRzKTtcbiAgICAgIHZhciBpbmRleE1hcCA9IHRoaXMuaW5kZXhNYXAodG9rZW5zKTtcblxuICAgICAgdGhpcy50cmFja2luZy5wb3MgPSBpbmRleE1hcC5sZW5ndGg7XG4gICAgICB0aGlzLnRyYWNraW5nLnJhbmdlID0gMDtcbiAgICAgIHRoaXMudHJhY2tpbmcudG9rZW5zID0gdG9rZW5zO1xuICAgICAgdGhpcy50cmFja2luZy5pbmRleE1hcCA9IGluZGV4TWFwO1xuICAgIH0sXG5cbiAgICBnZXRTdGF0ZVNuYXBzaG90OiBmdW5jdGlvbiAoKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICB2YWx1ZTogdGhpcy5wcm9wcy5maWVsZC52YWx1ZSxcbiAgICAgICAgcG9zOiB0aGlzLnRyYWNraW5nLnBvcyxcbiAgICAgICAgcmFuZ2U6IHRoaXMudHJhY2tpbmcucmFuZ2VcbiAgICAgIH07XG4gICAgfSxcblxuICAgIHNldFN0YXRlU25hcHNob3Q6IGZ1bmN0aW9uIChzbmFwc2hvdCkge1xuICAgICAgdGhpcy50cmFja2luZy5wb3MgPSBzbmFwc2hvdC5wb3M7XG4gICAgICB0aGlzLnRyYWNraW5nLnJhbmdlID0gc25hcHNob3QucmFuZ2U7XG4gICAgICB0aGlzLnByb3BzLmZpZWxkLnZhbChzbmFwc2hvdC52YWx1ZSk7XG4gICAgfSxcblxuICAgIC8vIFR1cm4gaW50byBpbmRpdmlkdWFsIGNoYXJhY3RlcnMgYW5kIHRhZ3NcbiAgICB0b2tlbnM6IGZ1bmN0aW9uIChwYXJ0cykge1xuICAgICAgcmV0dXJuIFtdLmNvbmNhdC5hcHBseShbXSwgcGFydHMubWFwKGZ1bmN0aW9uIChwYXJ0KSB7XG4gICAgICAgIGlmIChwYXJ0LnR5cGUgPT09ICd0YWcnKSB7XG4gICAgICAgICAgcmV0dXJuIHBhcnQ7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIHBhcnQudmFsdWUuc3BsaXQoJycpO1xuICAgICAgICB9XG4gICAgICB9KSk7XG4gICAgfSxcblxuICAgIC8vIE1hcCBlYWNoIHRleHRhcmVhIGluZGV4IGJhY2sgdG8gYSB0b2tlblxuICAgIGluZGV4TWFwOiBmdW5jdGlvbiAodG9rZW5zKSB7XG4gICAgICB2YXIgaW5kZXhNYXAgPSBbXTtcbiAgICAgIF8uZWFjaCh0b2tlbnMsIGZ1bmN0aW9uICh0b2tlbiwgdG9rZW5JbmRleCkge1xuICAgICAgICBpZiAodG9rZW4udHlwZSA9PT0gJ3RhZycpIHtcbiAgICAgICAgICB2YXIgbGFiZWwgPSBMRUZUX1BBRCArIG5vQnJlYWsodGhpcy5wcmV0dHlMYWJlbCh0b2tlbi52YWx1ZSkpICsgUklHSFRfUEFEO1xuICAgICAgICAgIHZhciBsYWJlbENoYXJzID0gbGFiZWwuc3BsaXQoJycpO1xuICAgICAgICAgIF8uZWFjaChsYWJlbENoYXJzLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBpbmRleE1hcC5wdXNoKHRva2VuSW5kZXgpO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGluZGV4TWFwLnB1c2godG9rZW5JbmRleCk7XG4gICAgICAgIH1cbiAgICAgIH0uYmluZCh0aGlzKSk7XG4gICAgICByZXR1cm4gaW5kZXhNYXA7XG4gICAgfSxcblxuICAgIC8vIE1ha2UgaGlnaGxpZ2h0IHNjcm9sbCBtYXRjaCB0ZXh0YXJlYSBzY3JvbGxcbiAgICBvblNjcm9sbDogZnVuY3Rpb24gKCkge1xuICAgICAgdGhpcy5yZWZzLmhpZ2hsaWdodC5nZXRET01Ob2RlKCkuc2Nyb2xsVG9wID0gdGhpcy5yZWZzLmNvbnRlbnQuZ2V0RE9NTm9kZSgpLnNjcm9sbFRvcDtcbiAgICAgIHRoaXMucmVmcy5oaWdobGlnaHQuZ2V0RE9NTm9kZSgpLnNjcm9sbExlZnQgPSB0aGlzLnJlZnMuY29udGVudC5nZXRET01Ob2RlKCkuc2Nyb2xsTGVmdDtcbiAgICB9LFxuXG4gICAgLy8gR2l2ZW4gc29tZSBwb3N0aW9uLCByZXR1cm4gdGhlIHRva2VuIGluZGV4IChwb3NpdGlvbiBjb3VsZCBiZSBpbiB0aGUgbWlkZGxlIG9mIGEgdG9rZW4pXG4gICAgdG9rZW5JbmRleDogZnVuY3Rpb24gKHBvcywgdG9rZW5zLCBpbmRleE1hcCkge1xuICAgICAgaWYgKHBvcyA8IDApIHtcbiAgICAgICAgcG9zID0gMDtcbiAgICAgIH0gZWxzZSBpZiAocG9zID49IGluZGV4TWFwLmxlbmd0aCkge1xuICAgICAgICByZXR1cm4gdG9rZW5zLmxlbmd0aDtcbiAgICAgIH1cbiAgICAgIHJldHVybiBpbmRleE1hcFtwb3NdO1xuICAgIH0sXG5cbiAgICBvbkNoYW5nZTogZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAvL2NvbnNvbGUubG9nKCdjaGFuZ2U6JywgZXZlbnQudGFyZ2V0LnZhbHVlKTtcblxuICAgICAgdmFyIG5vZGUgPSBldmVudC50YXJnZXQ7XG5cbiAgICAgIC8vIFRyYWNraW5nIGlzIGhvbGRpbmcgcHJldmlvdXMgcG9zaXRpb24gYW5kIHJhbmdlXG4gICAgICB2YXIgcHJldlBvcyA9IHRoaXMudHJhY2tpbmcucG9zO1xuICAgICAgdmFyIHByZXZSYW5nZSA9IHRoaXMudHJhY2tpbmcucmFuZ2U7XG5cbiAgICAgIC8vIE5ldyBwb3NpdGlvblxuICAgICAgdmFyIHBvcyA9IG5vZGUuc2VsZWN0aW9uU3RhcnQ7XG5cbiAgICAgIC8vIEdvaW5nIHRvIG11dGF0ZSB0aGUgdG9rZW5zLlxuICAgICAgdmFyIHRva2VucyA9IHRoaXMudHJhY2tpbmcudG9rZW5zO1xuXG4gICAgICAvLyBVc2luZyB0aGUgcHJldmlvdXMgcG9zaXRpb24gYW5kIHJhbmdlLCBnZXQgdGhlIHByZXZpb3VzIHRva2VuIHBvc2l0aW9uXG4gICAgICAvLyBhbmQgcmFuZ2VcbiAgICAgIHZhciBwcmV2VG9rZW5JbmRleCA9IHRoaXMudG9rZW5JbmRleChwcmV2UG9zLCB0b2tlbnMsIHRoaXMudHJhY2tpbmcuaW5kZXhNYXApO1xuICAgICAgdmFyIHByZXZUb2tlbkVuZEluZGV4ID0gdGhpcy50b2tlbkluZGV4KHByZXZQb3MgKyBwcmV2UmFuZ2UsIHRva2VucywgdGhpcy50cmFja2luZy5pbmRleE1hcCk7XG4gICAgICB2YXIgcHJldlRva2VuUmFuZ2UgPSBwcmV2VG9rZW5FbmRJbmRleCAtIHByZXZUb2tlbkluZGV4O1xuXG4gICAgICAvLyBXaXBlIG91dCBhbnkgdG9rZW5zIGluIHRoZSBzZWxlY3RlZCByYW5nZSBiZWNhdXNlIHRoZSBjaGFuZ2Ugd291bGQgaGF2ZVxuICAgICAgLy8gZXJhc2VkIHRoYXQgc2VsZWN0aW9uLlxuICAgICAgaWYgKHByZXZUb2tlblJhbmdlID4gMCkge1xuICAgICAgICB0b2tlbnMuc3BsaWNlKHByZXZUb2tlbkluZGV4LCBwcmV2VG9rZW5SYW5nZSk7XG4gICAgICAgIHRoaXMudHJhY2tpbmcuaW5kZXhNYXAgPSB0aGlzLmluZGV4TWFwKHRva2Vucyk7XG4gICAgICB9XG5cbiAgICAgIC8vIElmIGN1cnNvciBoYXMgbW92ZWQgZm9yd2FyZCwgdGhlbiB0ZXh0IHdhcyBhZGRlZC5cbiAgICAgIGlmIChwb3MgPiBwcmV2UG9zKSB7XG4gICAgICAgIHZhciBhZGRlZFRleHQgPSBub2RlLnZhbHVlLnN1YnN0cmluZyhwcmV2UG9zLCBwb3MpO1xuICAgICAgICAvLyBJbnNlcnQgdGhlIHRleHQgaW50byB0aGUgdG9rZW5zLlxuICAgICAgICB0b2tlbnMuc3BsaWNlKHByZXZUb2tlbkluZGV4LCAwLCBhZGRlZFRleHQpO1xuICAgICAgLy8gSWYgY3Vyc29yIGhhcyBtb3ZlZCBiYWNrd2FyZCwgdGhlbiB3ZSBkZWxldGVkIChiYWNrc3BhY2VkKSB0ZXh0XG4gICAgICB9IGlmIChwb3MgPCBwcmV2UG9zKSB7XG4gICAgICAgIHZhciB0b2tlbiA9IHRoaXMudG9rZW5BdChwb3MpO1xuICAgICAgICB2YXIgdG9rZW5CZWZvcmUgPSB0aGlzLnRva2VuQmVmb3JlKHBvcyk7XG4gICAgICAgIC8vIElmIHdlIG1vdmVkIGJhY2sgb250byBhIHRva2VuLCB0aGVuIHdlIHNob3VsZCBtb3ZlIGJhY2sgdG8gYmVnaW5uaW5nXG4gICAgICAgIC8vIG9mIHRva2VuLlxuICAgICAgICBpZiAodG9rZW4gPT09IHRva2VuQmVmb3JlKSB7XG4gICAgICAgICAgcG9zID0gdGhpcy5tb3ZlT2ZmVGFnKHBvcywgdG9rZW5zLCB0aGlzLmluZGV4TWFwKHRva2VucyksIC0xKTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgdG9rZW5JbmRleCA9IHRoaXMudG9rZW5JbmRleChwb3MsIHRva2VucywgdGhpcy50cmFja2luZy5pbmRleE1hcCk7XG4gICAgICAgIC8vIE5vdyB3ZSBjYW4gcmVtb3ZlIHRoZSB0b2tlbnMgdGhhdCB3ZXJlIGRlbGV0ZWQuXG4gICAgICAgIHRva2Vucy5zcGxpY2UodG9rZW5JbmRleCwgcHJldlRva2VuSW5kZXggLSB0b2tlbkluZGV4KTtcbiAgICAgIH1cblxuICAgICAgLy8gQ29udmVydCB0b2tlbnMgYmFjayBpbnRvIHJhdyB2YWx1ZSB3aXRoIHRhZ3MuIE5ld2x5IGZvcm1lZCB0YWdzIHdpbGxcbiAgICAgIC8vIGJlY29tZSBwYXJ0IG9mIHRoZSByYXcgdmFsdWUuXG4gICAgICB2YXIgcmF3VmFsdWUgPSB0aGlzLnJhd1ZhbHVlKHRva2Vucyk7XG5cbiAgICAgIHRoaXMudHJhY2tpbmcucG9zID0gcG9zO1xuICAgICAgdGhpcy50cmFja2luZy5yYW5nZSA9IDA7XG5cbiAgICAgIC8vIFNldCB0aGUgdmFsdWUgdG8gdGhlIG5ldyByYXcgdmFsdWUuXG4gICAgICB0aGlzLnByb3BzLmZpZWxkLnZhbChyYXdWYWx1ZSk7XG5cbiAgICAgIHRoaXMuc25hcHNob3QoKTtcbiAgICB9LFxuXG4gICAgY29tcG9uZW50RGlkVXBkYXRlOiBmdW5jdGlvbiAoKSB7XG4gICAgICB2YXIgdmFsdWUgPSB0aGlzLnByb3BzLmZpZWxkLnZhbHVlIHx8ICcnO1xuICAgICAgdmFyIHBhcnRzID0gdXRpbC5wYXJzZVRleHRXaXRoVGFncyh2YWx1ZSk7XG4gICAgICB0aGlzLnRyYWNraW5nLnRva2VucyA9IHRoaXMudG9rZW5zKHBhcnRzKTtcbiAgICAgIHRoaXMudHJhY2tpbmcuaW5kZXhNYXAgPSB0aGlzLmluZGV4TWFwKHRoaXMudHJhY2tpbmcudG9rZW5zKTtcblxuICAgICAgdmFyIHBvcyA9IHRoaXMubm9ybWFsaXplUG9zaXRpb24odGhpcy50cmFja2luZy5wb3MpO1xuICAgICAgdmFyIHJhbmdlID0gdGhpcy50cmFja2luZy5yYW5nZTtcbiAgICAgIHZhciBlbmRQb3MgPSB0aGlzLm5vcm1hbGl6ZVBvc2l0aW9uKHBvcyArIHJhbmdlKTtcbiAgICAgIHJhbmdlID0gZW5kUG9zIC0gcG9zO1xuXG4gICAgICB0aGlzLnRyYWNraW5nLnBvcyA9IHBvcztcbiAgICAgIHRoaXMudHJhY2tpbmcucmFuZ2UgPSByYW5nZTtcblxuICAgICAgaWYgKGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQgPT09IHRoaXMucmVmcy5jb250ZW50LmdldERPTU5vZGUoKSkge1xuICAgICAgICAvLyBSZWFjdCBjYW4gbG9zZSB0aGUgc2VsZWN0aW9uLCBzbyBwdXQgaXQgYmFjay5cbiAgICAgICAgdGhpcy5yZWZzLmNvbnRlbnQuZ2V0RE9NTm9kZSgpLnNldFNlbGVjdGlvblJhbmdlKHBvcywgcG9zICsgcmFuZ2UpO1xuICAgICAgfVxuICAgIH0sXG5cbiAgICAvLyBHZXQgdGhlIGxhYmVsIGZvciBhIGtleS5cbiAgICBwcmV0dHlMYWJlbDogZnVuY3Rpb24gKGtleSkge1xuICAgICAgaWYgKHRoaXMucHJvcHMuZmllbGQuZGVmLnJlcGxhY2VDaG9pY2VzTGFiZWxzW2tleV0pIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucHJvcHMuZmllbGQuZGVmLnJlcGxhY2VDaG9pY2VzTGFiZWxzW2tleV07XG4gICAgICB9XG4gICAgICB2YXIgY2xlYW5lZCA9IHJlbW92ZUlkUHJlZml4KGtleSk7XG4gICAgICByZXR1cm4gdXRpbC5odW1hbml6ZShjbGVhbmVkKTtcbiAgICB9LFxuXG4gICAgLy8gR2l2ZW4gdGhlIGFjdHVhbCB2YWx1ZSBvZiB0aGUgZmllbGQgKHdpdGggdGFncyksIGdldCB0aGUgcGxhaW4gdGV4dCB0aGF0XG4gICAgLy8gc2hvdWxkIHNob3cgaW4gdGhlIHRleHRhcmVhLlxuICAgIHBsYWluVmFsdWU6IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgdmFyIHBhcnRzID0gdXRpbC5wYXJzZVRleHRXaXRoVGFncyh2YWx1ZSk7XG4gICAgICByZXR1cm4gcGFydHMubWFwKGZ1bmN0aW9uIChwYXJ0KSB7XG4gICAgICAgIGlmIChwYXJ0LnR5cGUgPT09ICd0ZXh0Jykge1xuICAgICAgICAgIHJldHVybiBwYXJ0LnZhbHVlO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiBMRUZUX1BBRCArIG5vQnJlYWsodGhpcy5wcmV0dHlMYWJlbChwYXJ0LnZhbHVlKSkgKyBSSUdIVF9QQUQ7XG4gICAgICAgIH1cbiAgICAgIH0uYmluZCh0aGlzKSkuam9pbignJyk7XG4gICAgfSxcblxuICAgIC8vIEdpdmVuIHRoZSBhY3R1YWwgdmFsdWUgb2YgdGhlIGZpZWxkICh3aXRoIHRhZ3MpLCBnZXQgdGhlIGh0bWwgdXNlZCB0b1xuICAgIC8vIGhpZ2hsaWdodCB0aGUgbGFiZWxzLlxuICAgIHByZXR0eVZhbHVlOiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgIHZhciBwYXJ0cyA9IHV0aWwucGFyc2VUZXh0V2l0aFRhZ3ModmFsdWUpO1xuICAgICAgcmV0dXJuIHBhcnRzLm1hcChmdW5jdGlvbiAocGFydCwgaSkge1xuICAgICAgICBpZiAocGFydC50eXBlID09PSAndGV4dCcpIHtcbiAgICAgICAgICBpZiAoaSA9PT0gKHBhcnRzLmxlbmd0aCAtIDEpKSB7XG4gICAgICAgICAgICBpZiAocGFydC52YWx1ZVtwYXJ0LnZhbHVlLmxlbmd0aCAtIDFdID09PSAnXFxuJykge1xuICAgICAgICAgICAgICByZXR1cm4gcGFydC52YWx1ZSArICdcXHUwMGEwJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIHBhcnQudmFsdWU7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgLy8gTWFrZSBhIHBpbGxcbiAgICAgICAgICB2YXIgcGlsbFJlZiA9ICdwcmV0dHlQYXJ0JyArIGk7XG4gICAgICAgICAgdmFyIGNsYXNzTmFtZSA9ICdwcmV0dHktcGFydCc7XG4gICAgICAgICAgaWYgKHRoaXMuc3RhdGUuaG92ZXJQaWxsUmVmICYmIHBpbGxSZWYgPT09IHRoaXMuc3RhdGUuaG92ZXJQaWxsUmVmKSB7XG4gICAgICAgICAgICBjbGFzc05hbWUgKz0gJyBwcmV0dHktcGFydC1ob3Zlcic7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiBSLnNwYW4oe2tleTogaSwgY2xhc3NOYW1lOiBjbGFzc05hbWUsIHJlZjogcGlsbFJlZiwgJ2RhdGEtcHJldHR5JzogdHJ1ZSwgJ2RhdGEtcmVmJzogcGlsbFJlZn0sXG4gICAgICAgICAgICBSLnNwYW4oe2NsYXNzTmFtZTogJ3ByZXR0eS1wYXJ0LWxlZnQnfSwgTEVGVF9QQUQpLFxuICAgICAgICAgICAgUi5zcGFuKHtjbGFzc05hbWU6ICdwcmV0dHktcGFydC10ZXh0J30sIG5vQnJlYWsodGhpcy5wcmV0dHlMYWJlbChwYXJ0LnZhbHVlKSkpLFxuICAgICAgICAgICAgUi5zcGFuKHtjbGFzc05hbWU6ICdwcmV0dHktcGFydC1yaWdodCd9LCBSSUdIVF9QQUQpXG4gICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgICAgfS5iaW5kKHRoaXMpKTtcbiAgICB9LFxuXG4gICAgLy8gR2l2ZW4gdGhlIHRva2VucyBmb3IgYSBmaWVsZCwgZ2V0IHRoZSBhY3R1YWwgdmFsdWUgb2YgdGhlIGZpZWxkICh3aXRoXG4gICAgLy8gdGFncylcbiAgICByYXdWYWx1ZTogZnVuY3Rpb24gKHRva2Vucykge1xuICAgICAgcmV0dXJuIHRva2Vucy5tYXAoZnVuY3Rpb24gKHRva2VuKSB7XG4gICAgICAgIGlmICh0b2tlbi50eXBlID09PSAndGFnJykge1xuICAgICAgICAgIHJldHVybiAne3snICsgdG9rZW4udmFsdWUgKyAnfX0nO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiB0b2tlbjtcbiAgICAgICAgfVxuICAgICAgfSkuam9pbignJyk7XG4gICAgfSxcblxuICAgIC8vIEdpdmVuIGEgcG9zaXRpb24sIGlmIGl0J3Mgb24gYSBsYWJlbCwgZ2V0IHRoZSBwb3NpdGlvbiBsZWZ0IG9yIHJpZ2h0IG9mXG4gICAgLy8gdGhlIGxhYmVsLCBiYXNlZCBvbiBkaXJlY3Rpb24gYW5kL29yIHdoaWNoIHNpZGUgaXMgY2xvc2VyXG4gICAgbW92ZU9mZlRhZzogZnVuY3Rpb24gKHBvcywgdG9rZW5zLCBpbmRleE1hcCwgZGlyKSB7XG4gICAgICBpZiAodHlwZW9mIGRpciA9PT0gJ3VuZGVmaW5lZCcgfHwgZGlyID4gMCkge1xuICAgICAgICBkaXIgPSAxO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZGlyID0gLTE7XG4gICAgICB9XG4gICAgICB2YXIgdG9rZW47XG4gICAgICBpZiAoZGlyID4gMCkge1xuICAgICAgICB0b2tlbiA9IHRva2Vuc1tpbmRleE1hcFtwb3NdXTtcbiAgICAgICAgd2hpbGUgKHBvcyA8IGluZGV4TWFwLmxlbmd0aCAmJiB0b2tlbnNbaW5kZXhNYXBbcG9zXV0udHlwZSA9PT0gJ3RhZycgJiYgdG9rZW5zW2luZGV4TWFwW3Bvc11dID09PSB0b2tlbikge1xuICAgICAgICAgIHBvcysrO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0b2tlbiA9IHRva2Vuc1tpbmRleE1hcFtwb3MgLSAxXV07XG4gICAgICAgIHdoaWxlIChwb3MgPiAwICYmIHRva2Vuc1tpbmRleE1hcFtwb3MgLSAxXV0udHlwZSA9PT0gJ3RhZycgJiYgdG9rZW5zW2luZGV4TWFwW3BvcyAtIDFdXSA9PT0gdG9rZW4pIHtcbiAgICAgICAgICBwb3MtLTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICByZXR1cm4gcG9zO1xuICAgIH0sXG5cbiAgICAvLyBHZXQgdGhlIHRva2VuIGF0IHNvbWUgcG9zaXRpb24uXG4gICAgdG9rZW5BdDogZnVuY3Rpb24gKHBvcykge1xuICAgICAgaWYgKHBvcyA+PSB0aGlzLnRyYWNraW5nLmluZGV4TWFwLmxlbmd0aCkge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgIH1cbiAgICAgIGlmIChwb3MgPCAwKSB7XG4gICAgICAgIHBvcyA9IDA7XG4gICAgICB9XG4gICAgICByZXR1cm4gdGhpcy50cmFja2luZy50b2tlbnNbdGhpcy50cmFja2luZy5pbmRleE1hcFtwb3NdXTtcbiAgICB9LFxuXG4gICAgLy8gR2V0IHRoZSB0b2tlbiBpbW1lZGlhdGVseSBiZWZvcmUgc29tZSBwb3NpdGlvbi5cbiAgICB0b2tlbkJlZm9yZTogZnVuY3Rpb24gKHBvcykge1xuICAgICAgaWYgKHBvcyA+PSB0aGlzLnRyYWNraW5nLmluZGV4TWFwLmxlbmd0aCkge1xuICAgICAgICBwb3MgPSB0aGlzLnRyYWNraW5nLmluZGV4TWFwLmxlbmd0aDtcbiAgICAgIH1cbiAgICAgIGlmIChwb3MgPD0gMCkge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgIH1cbiAgICAgIHJldHVybiB0aGlzLnRyYWNraW5nLnRva2Vuc1t0aGlzLnRyYWNraW5nLmluZGV4TWFwW3BvcyAtIDFdXTtcbiAgICB9LFxuXG4gICAgLy8gR2l2ZW4gYSBwb3NpdGlvbiwgZ2V0IGEgY29ycmVjdGVkIHBvc2l0aW9uIChpZiBuZWNlc3NhcnkgdG8gYmVcbiAgICAvLyBjb3JyZWN0ZWQpLlxuICAgIG5vcm1hbGl6ZVBvc2l0aW9uOiBmdW5jdGlvbiAocG9zLCBwcmV2UG9zKSB7XG4gICAgICBpZiAoXy5pc1VuZGVmaW5lZChwcmV2UG9zKSkge1xuICAgICAgICBwcmV2UG9zID0gcG9zO1xuICAgICAgfVxuICAgICAgLy8gQXQgc3RhcnQgb3IgZW5kLCBzbyBva2F5LlxuICAgICAgaWYgKHBvcyA8PSAwIHx8IHBvcyA+PSB0aGlzLnRyYWNraW5nLmluZGV4TWFwLmxlbmd0aCkge1xuICAgICAgICBpZiAocG9zIDwgMCkge1xuICAgICAgICAgIHBvcyA9IDA7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHBvcyA+IHRoaXMudHJhY2tpbmcuaW5kZXhNYXAubGVuZ3RoKSB7XG4gICAgICAgICAgcG9zID0gdGhpcy50cmFja2luZy5pbmRleE1hcC5sZW5ndGg7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHBvcztcbiAgICAgIH1cblxuICAgICAgdmFyIHRva2VuID0gdGhpcy50b2tlbkF0KHBvcyk7XG4gICAgICB2YXIgdG9rZW5CZWZvcmUgPSB0aGlzLnRva2VuQmVmb3JlKHBvcyk7XG5cbiAgICAgIC8vIEJldHdlZW4gdHdvIHRva2Vucywgc28gb2theS5cbiAgICAgIGlmICh0b2tlbiAhPT0gdG9rZW5CZWZvcmUpIHtcbiAgICAgICAgcmV0dXJuIHBvcztcbiAgICAgIH1cblxuICAgICAgdmFyIHByZXZUb2tlbiA9IHRoaXMudG9rZW5BdChwcmV2UG9zKTtcbiAgICAgIHZhciBwcmV2VG9rZW5CZWZvcmUgPSB0aGlzLnRva2VuQmVmb3JlKHByZXZQb3MpO1xuXG4gICAgICB2YXIgcmlnaHRQb3MgPSB0aGlzLm1vdmVPZmZUYWcocG9zLCB0aGlzLnRyYWNraW5nLnRva2VucywgdGhpcy50cmFja2luZy5pbmRleE1hcCk7XG4gICAgICB2YXIgbGVmdFBvcyA9IHRoaXMubW92ZU9mZlRhZyhwb3MsIHRoaXMudHJhY2tpbmcudG9rZW5zLCB0aGlzLnRyYWNraW5nLmluZGV4TWFwLCAtMSk7XG5cbiAgICAgIGlmIChwcmV2VG9rZW4gIT09IHByZXZUb2tlbkJlZm9yZSkge1xuICAgICAgICAvLyBNb3ZlZCBmcm9tIGxlZnQgZWRnZS5cbiAgICAgICAgaWYgKHByZXZUb2tlbiA9PT0gdG9rZW4pIHtcbiAgICAgICAgICByZXR1cm4gcmlnaHRQb3M7XG4gICAgICAgIH1cbiAgICAgICAgLy8gTW92ZWQgZnJvbSByaWdodCBlZGdlLlxuICAgICAgICBpZiAocHJldlRva2VuQmVmb3JlID09PSB0b2tlbikge1xuICAgICAgICAgIHJldHVybiBsZWZ0UG9zO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHZhciBuZXdQb3MgPSByaWdodFBvcztcblxuICAgICAgaWYgKHBvcyA9PT0gcHJldlBvcyB8fCBwb3MgPCBwcmV2UG9zKSB7XG4gICAgICAgIGlmIChyaWdodFBvcyAtIHBvcyA+IHBvcyAtIGxlZnRQb3MpIHtcbiAgICAgICAgICBuZXdQb3MgPSBsZWZ0UG9zO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gbmV3UG9zO1xuICAgIH0sXG5cblxuXG4gICAgb25TZWxlY3Q6IGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgdmFyIG5vZGUgPSBldmVudC50YXJnZXQ7XG5cbiAgICAgIHZhciBwb3MgPSBub2RlLnNlbGVjdGlvblN0YXJ0O1xuICAgICAgdmFyIGVuZFBvcyA9IG5vZGUuc2VsZWN0aW9uRW5kO1xuXG4gICAgICBpZiAocG9zID09PSBlbmRQb3MgJiYgdGhpcy5zdGF0ZS5ob3ZlclBpbGxSZWYpIHtcbiAgICAgICAgdmFyIHRva2VuQXQgPSB0aGlzLnRva2VuQXQocG9zKTtcbiAgICAgICAgdmFyIHRva2VuQmVmb3JlID0gdGhpcy50b2tlbkJlZm9yZShwb3MpO1xuXG4gICAgICAgIGlmICh0b2tlbkF0ICYmIHRva2VuQXQgPT09IHRva2VuQmVmb3JlICYmIHRva2VuQXQudHlwZSAmJiB0b2tlbkF0LnR5cGUgPT09ICd0YWcnKSB7XG4gICAgICAgICAgLy8gQ2xpY2tlZCBhIHRhZy5cbiAgICAgICAgICB2YXIgcmlnaHRQb3MgPSB0aGlzLm1vdmVPZmZUYWcocG9zLCB0aGlzLnRyYWNraW5nLnRva2VucywgdGhpcy50cmFja2luZy5pbmRleE1hcCk7XG4gICAgICAgICAgdmFyIGxlZnRQb3MgPSB0aGlzLm1vdmVPZmZUYWcocG9zLCB0aGlzLnRyYWNraW5nLnRva2VucywgdGhpcy50cmFja2luZy5pbmRleE1hcCwgLTEpO1xuICAgICAgICAgIHRoaXMudHJhY2tpbmcucG9zID0gbGVmdFBvcztcbiAgICAgICAgICB0aGlzLnRyYWNraW5nLnJhbmdlID0gcmlnaHRQb3MgLSBsZWZ0UG9zO1xuICAgICAgICAgIG5vZGUuc2VsZWN0aW9uU3RhcnQgPSBsZWZ0UG9zO1xuICAgICAgICAgIG5vZGUuc2VsZWN0aW9uRW5kID0gcmlnaHRQb3M7XG5cbiAgICAgICAgICB0aGlzLnNldFN0YXRlKHtpc0Nob2ljZXNPcGVuOiB0cnVlfSk7XG5cbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgcG9zID0gdGhpcy5ub3JtYWxpemVQb3NpdGlvbihwb3MsIHRoaXMudHJhY2tpbmcucG9zKTtcbiAgICAgIGVuZFBvcyA9IHRoaXMubm9ybWFsaXplUG9zaXRpb24oZW5kUG9zLCB0aGlzLnRyYWNraW5nLnBvcyArIHRoaXMudHJhY2tpbmcucmFuZ2UpO1xuXG4gICAgICB0aGlzLnRyYWNraW5nLnBvcyA9IHBvcztcbiAgICAgIHRoaXMudHJhY2tpbmcucmFuZ2UgPSBlbmRQb3MgLSBwb3M7XG5cbiAgICAgIG5vZGUuc2VsZWN0aW9uU3RhcnQgPSBwb3M7XG4gICAgICBub2RlLnNlbGVjdGlvbkVuZCA9IGVuZFBvcztcbiAgICB9LFxuXG4gICAgb25Db3B5OiBmdW5jdGlvbiAoKSB7XG4gICAgICB2YXIgbm9kZSA9IHRoaXMucmVmcy5jb250ZW50LmdldERPTU5vZGUoKTtcbiAgICAgIHZhciBzdGFydCA9IG5vZGUuc2VsZWN0aW9uU3RhcnQ7XG4gICAgICB2YXIgZW5kID0gbm9kZS5zZWxlY3Rpb25FbmQ7XG4gICAgICB2YXIgdGV4dCA9IG5vZGUudmFsdWUuc3Vic3RyaW5nKHN0YXJ0LCBlbmQpO1xuICAgICAgdmFyIHJlYWxTdGFydEluZGV4ID0gdGhpcy50b2tlbkluZGV4KHN0YXJ0LCB0aGlzLnRyYWNraW5nLnRva2VucywgdGhpcy50cmFja2luZy5pbmRleE1hcCk7XG4gICAgICB2YXIgcmVhbEVuZEluZGV4ID0gdGhpcy50b2tlbkluZGV4KGVuZCwgdGhpcy50cmFja2luZy50b2tlbnMsIHRoaXMudHJhY2tpbmcuaW5kZXhNYXApO1xuICAgICAgdmFyIHRva2VucyA9IHRoaXMudHJhY2tpbmcudG9rZW5zLnNsaWNlKHJlYWxTdGFydEluZGV4LCByZWFsRW5kSW5kZXgpO1xuICAgICAgdGV4dCA9IHRoaXMucmF3VmFsdWUodG9rZW5zKTtcbiAgICAgIHZhciBvcmlnaW5hbFZhbHVlID0gbm9kZS52YWx1ZTtcbiAgICAgIG5vZGUudmFsdWUgPSBub2RlLnZhbHVlICsgdGV4dDtcbiAgICAgIG5vZGUuc2V0U2VsZWN0aW9uUmFuZ2Uob3JpZ2luYWxWYWx1ZS5sZW5ndGgsIG9yaWdpbmFsVmFsdWUubGVuZ3RoICsgdGV4dC5sZW5ndGgpO1xuICAgICAgd2luZG93LnNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgIG5vZGUudmFsdWUgPSBvcmlnaW5hbFZhbHVlO1xuICAgICAgICBub2RlLnNldFNlbGVjdGlvblJhbmdlKHN0YXJ0LCBlbmQpO1xuICAgICAgfSwwKTtcbiAgICB9LFxuXG4gICAgb25DdXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgIHZhciBub2RlID0gdGhpcy5yZWZzLmNvbnRlbnQuZ2V0RE9NTm9kZSgpO1xuICAgICAgdmFyIHN0YXJ0ID0gbm9kZS5zZWxlY3Rpb25TdGFydDtcbiAgICAgIHZhciBlbmQgPSBub2RlLnNlbGVjdGlvbkVuZDtcbiAgICAgIHZhciB0ZXh0ID0gbm9kZS52YWx1ZS5zdWJzdHJpbmcoc3RhcnQsIGVuZCk7XG4gICAgICB2YXIgcmVhbFN0YXJ0SW5kZXggPSB0aGlzLnRva2VuSW5kZXgoc3RhcnQsIHRoaXMudHJhY2tpbmcudG9rZW5zLCB0aGlzLnRyYWNraW5nLmluZGV4TWFwKTtcbiAgICAgIHZhciByZWFsRW5kSW5kZXggPSB0aGlzLnRva2VuSW5kZXgoZW5kLCB0aGlzLnRyYWNraW5nLnRva2VucywgdGhpcy50cmFja2luZy5pbmRleE1hcCk7XG4gICAgICB2YXIgdG9rZW5zID0gdGhpcy50cmFja2luZy50b2tlbnMuc2xpY2UocmVhbFN0YXJ0SW5kZXgsIHJlYWxFbmRJbmRleCk7XG4gICAgICB0ZXh0ID0gdGhpcy5yYXdWYWx1ZSh0b2tlbnMpO1xuICAgICAgdmFyIG9yaWdpbmFsVmFsdWUgPSBub2RlLnZhbHVlO1xuICAgICAgdmFyIGN1dFZhbHVlID0gbm9kZS52YWx1ZS5zdWJzdHJpbmcoMCwgc3RhcnQpICsgbm9kZS52YWx1ZS5zdWJzdHJpbmcoZW5kKTtcbiAgICAgIG5vZGUudmFsdWUgPSBub2RlLnZhbHVlICsgdGV4dDtcbiAgICAgIG5vZGUuc2V0U2VsZWN0aW9uUmFuZ2Uob3JpZ2luYWxWYWx1ZS5sZW5ndGgsIG9yaWdpbmFsVmFsdWUubGVuZ3RoICsgdGV4dC5sZW5ndGgpO1xuICAgICAgdmFyIGN1dFRva2VucyA9IHRoaXMudHJhY2tpbmcudG9rZW5zLnNsaWNlKDAsIHJlYWxTdGFydEluZGV4KS5jb25jYXQodGhpcy50cmFja2luZy50b2tlbnMuc2xpY2UocmVhbEVuZEluZGV4KSk7XG4gICAgICB3aW5kb3cuc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgbm9kZS52YWx1ZSA9IGN1dFZhbHVlO1xuICAgICAgICBub2RlLnNldFNlbGVjdGlvblJhbmdlKHN0YXJ0LCBzdGFydCk7XG4gICAgICAgIHRoaXMudHJhY2tpbmcucG9zID0gc3RhcnQ7XG4gICAgICAgIHRoaXMudHJhY2tpbmcucmFuZ2UgPSAwO1xuICAgICAgICB0aGlzLnRyYWNraW5nLnRva2VucyA9IGN1dFRva2VucztcbiAgICAgICAgdGhpcy50cmFja2luZy5pbmRleE1hcCA9IHRoaXMuaW5kZXhNYXAodGhpcy50cmFja2luZy50b2tlbnMpO1xuXG4gICAgICAgIC8vIENvbnZlcnQgdG9rZW5zIGJhY2sgaW50byByYXcgdmFsdWUgd2l0aCB0YWdzLiBOZXdseSBmb3JtZWQgdGFncyB3aWxsXG4gICAgICAgIC8vIGJlY29tZSBwYXJ0IG9mIHRoZSByYXcgdmFsdWUuXG4gICAgICAgIHZhciByYXdWYWx1ZSA9IHRoaXMucmF3VmFsdWUodGhpcy50cmFja2luZy50b2tlbnMpO1xuXG4gICAgICAgIC8vIFNldCB0aGUgdmFsdWUgdG8gdGhlIG5ldyByYXcgdmFsdWUuXG4gICAgICAgIHRoaXMucHJvcHMuZmllbGQudmFsKHJhd1ZhbHVlKTtcblxuICAgICAgICB0aGlzLnNuYXBzaG90KCk7XG4gICAgICB9LmJpbmQodGhpcyksMCk7XG4gICAgfSxcblxuICAgIG9uS2V5RG93bjogZnVuY3Rpb24gKGV2ZW50KSB7XG5cbiAgICAgIGlmIChldmVudC5rZXlDb2RlID09PSAzNykge1xuICAgICAgICB0aGlzLmxlZnRBcnJvd0Rvd24gPSB0cnVlO1xuICAgICAgfSBlbHNlIGlmIChldmVudC5rZXlDb2RlID09PSAzOSkge1xuICAgICAgICB0aGlzLnJpZ2h0QXJyb3dEb3duID0gdHJ1ZTtcbiAgICAgIH1cblxuICAgICAgLy8gQ21kLVogb3IgQ3RybC1aXG4gICAgICBpZiAoZXZlbnQua2V5Q29kZSA9PT0gOTAgJiYgKGV2ZW50Lm1ldGFLZXkgfHwgZXZlbnQuY3RybEtleSkgJiYgIWV2ZW50LnNoaWZ0S2V5KSB7XG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIHRoaXMudW5kbygpO1xuICAgICAgLy8gQ21kLVNoaWZ0LVogb3IgQ3RybC1ZXG4gICAgICB9IGVsc2UgaWYgKFxuICAgICAgICAoZXZlbnQua2V5Q29kZSA9PT0gODkgJiYgZXZlbnQuY3RybEtleSAmJiAhZXZlbnQuc2hpZnRLZXkpIHx8XG4gICAgICAgIChldmVudC5rZXlDb2RlID09PSA5MCAmJiBldmVudC5tZXRhS2V5ICYmIGV2ZW50LnNoaWZ0S2V5KVxuICAgICAgKSB7XG4gICAgICAgIHRoaXMucmVkbygpO1xuICAgICAgfVxuICAgIH0sXG5cbiAgICBvbktleVVwOiBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgIGlmIChldmVudC5rZXlDb2RlID09PSAzNykge1xuICAgICAgICB0aGlzLmxlZnRBcnJvd0Rvd24gPSBmYWxzZTtcbiAgICAgIH0gZWxzZSBpZiAoZXZlbnQua2V5Q29kZSA9PT0gMzkpIHtcbiAgICAgICAgdGhpcy5yaWdodEFycm93RG93biA9IGZhbHNlO1xuICAgICAgfVxuICAgIH0sXG5cbiAgICAvLyBLZWVwIHRoZSBoaWdobGlnaHQgc3R5bGVzIGluIHN5bmMgd2l0aCB0aGUgdGV4dGFyZWEgc3R5bGVzLlxuICAgIGFkanVzdFN0eWxlczogZnVuY3Rpb24gKGlzTW91bnQpIHtcbiAgICAgIHZhciBvdmVybGF5ID0gdGhpcy5yZWZzLmhpZ2hsaWdodC5nZXRET01Ob2RlKCk7XG4gICAgICB2YXIgY29udGVudCA9IHRoaXMucmVmcy5jb250ZW50LmdldERPTU5vZGUoKTtcblxuICAgICAgdmFyIHN0eWxlID0gd2luZG93LmdldENvbXB1dGVkU3R5bGUoY29udGVudCk7XG5cbiAgICAgIHZhciBiYWNrZ3JvdW5kQ29sb3IgPSBzdHlsZS5iYWNrZ3JvdW5kQ29sb3I7XG5cbiAgICAgIHV0aWwuY29weUVsZW1lbnRTdHlsZShjb250ZW50LCBvdmVybGF5KTtcblxuICAgICAgb3ZlcmxheS5zdHlsZS5wb3NpdGlvbiA9ICdhYnNvbHV0ZSc7XG4gICAgICBvdmVybGF5LnN0eWxlLndoaXRlU3BhY2UgPSAncHJlLXdyYXAnO1xuICAgICAgb3ZlcmxheS5zdHlsZS5jb2xvciA9ICdyZ2JhKDAsMCwwLDApJztcbiAgICAgIG92ZXJsYXkuc3R5bGUud2Via2l0VGV4dEZpbGxDb2xvciA9ICdyZ2JhKDAsMCwwLDApJztcbiAgICAgIG92ZXJsYXkuc3R5bGUucmVzaXplID0gJ25vbmUnO1xuICAgICAgb3ZlcmxheS5zdHlsZS5ib3JkZXJDb2xvciA9ICdyZ2JhKDAsMCwwLDApJztcblxuICAgICAgaWYgKHV0aWwuYnJvd3Nlci5pc01vemlsbGEpIHtcblxuICAgICAgICB2YXIgcGFkZGluZ1RvcCA9IHBhcnNlRmxvYXQoc3R5bGUucGFkZGluZ1RvcCk7XG4gICAgICAgIHZhciBwYWRkaW5nQm90dG9tID0gcGFyc2VGbG9hdChzdHlsZS5wYWRkaW5nQm90dG9tKTtcblxuICAgICAgICB2YXIgYm9yZGVyVG9wID0gcGFyc2VGbG9hdChzdHlsZS5ib3JkZXJUb3BXaWR0aCk7XG4gICAgICAgIHZhciBib3JkZXJCb3R0b20gPSBwYXJzZUZsb2F0KHN0eWxlLmJvcmRlckJvdHRvbVdpZHRoKTtcblxuICAgICAgICBvdmVybGF5LnN0eWxlLnBhZGRpbmdUb3AgPSAnMHB4JztcbiAgICAgICAgb3ZlcmxheS5zdHlsZS5wYWRkaW5nQm90dG9tID0gJzBweCc7XG5cbiAgICAgICAgb3ZlcmxheS5zdHlsZS5oZWlnaHQgPSAoY29udGVudC5jbGllbnRIZWlnaHQgLSBwYWRkaW5nVG9wIC0gcGFkZGluZ0JvdHRvbSArIGJvcmRlclRvcCArIGJvcmRlckJvdHRvbSkgKyAncHgnO1xuICAgICAgICBvdmVybGF5LnN0eWxlLnRvcCA9IHN0eWxlLnBhZGRpbmdUb3A7XG4gICAgICAgIG92ZXJsYXkuc3R5bGUuYm94U2hhZG93ID0gJ25vbmUnO1xuICAgICAgfVxuXG4gICAgICBpZiAoaXNNb3VudCkge1xuICAgICAgICB0aGlzLmJhY2tncm91bmRDb2xvciA9IGJhY2tncm91bmRDb2xvcjtcbiAgICAgIH1cbiAgICAgIG92ZXJsYXkuc3R5bGUuYmFja2dyb3VuZENvbG9yID0gdGhpcy5iYWNrZ3JvdW5kQ29sb3I7XG4gICAgICBjb250ZW50LnN0eWxlLmJhY2tncm91bmRDb2xvciA9ICdyZ2JhKDAsMCwwLDApJztcbiAgICB9LFxuXG4gICAgLy8gSWYgdGhlIHRleHRhcmVhIGlzIHJlc2l6ZWQsIG5lZWQgdG8gcmUtc3luYyB0aGUgc3R5bGVzLlxuICAgIG9uUmVzaXplOiBmdW5jdGlvbiAoKSB7XG4gICAgICB0aGlzLmFkanVzdFN0eWxlcygpO1xuICAgIH0sXG5cbiAgICAvLyBJZiB0aGUgd2luZG93IGlzIHJlc2l6ZWQsIG1heSBuZWVkIHRvIHJlLXN5bmMgdGhlIHN0eWxlcy5cbiAgICAvLyBQcm9iYWJseSBub3QgbmVjZXNzYXJ5IHdpdGggZWxlbWVudCByZXNpemU/XG4gICAgb25SZXNpemVXaW5kb3c6IGZ1bmN0aW9uICgpIHtcbiAgICAgIHRoaXMuYWRqdXN0U3R5bGVzKCk7XG4gICAgfSxcblxuICAgIGNvbXBvbmVudERpZE1vdW50OiBmdW5jdGlvbiAoKSB7XG4gICAgICB0aGlzLmFkanVzdFN0eWxlcyh0cnVlKTtcbiAgICAgIHRoaXMuc2V0T25SZXNpemUoJ2NvbnRlbnQnLCB0aGlzLm9uUmVzaXplKTtcbiAgICAgIC8vdGhpcy5zZXRPbkNsaWNrT3V0c2lkZSgnY2hvaWNlcycsIHRoaXMub25DbGlja091dHNpZGVDaG9pY2VzKTtcbiAgICB9LFxuXG4gICAgb25JbnNlcnRGcm9tU2VsZWN0OiBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgIGlmIChldmVudC50YXJnZXQuc2VsZWN0ZWRJbmRleCA+IDApIHtcbiAgICAgICAgdmFyIHRhZyA9IGV2ZW50LnRhcmdldC52YWx1ZTtcbiAgICAgICAgZXZlbnQudGFyZ2V0LnNlbGVjdGVkSW5kZXggPSAwO1xuICAgICAgICB2YXIgcG9zID0gdGhpcy50cmFja2luZy5wb3M7XG4gICAgICAgIHZhciBpbnNlcnRQb3MgPSB0aGlzLm5vcm1hbGl6ZVBvc2l0aW9uKHBvcyk7XG4gICAgICAgIHZhciB0b2tlbnMgPSB0aGlzLnRyYWNraW5nLnRva2VucztcbiAgICAgICAgdmFyIHRva2VuSW5kZXggPSB0aGlzLnRva2VuSW5kZXgoaW5zZXJ0UG9zLCB0b2tlbnMsIHRoaXMudHJhY2tpbmcuaW5kZXhNYXApO1xuICAgICAgICB0b2tlbnMuc3BsaWNlKHRva2VuSW5kZXgsIDAsIHtcbiAgICAgICAgICB0eXBlOiAndGFnJyxcbiAgICAgICAgICB2YWx1ZTogdGFnXG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLnRyYWNraW5nLmluZGV4TWFwID0gdGhpcy5pbmRleE1hcCh0b2tlbnMpO1xuICAgICAgICB2YXIgbmV3VmFsdWUgPSB0aGlzLnJhd1ZhbHVlKHRva2Vucyk7XG4gICAgICAgIHRoaXMudHJhY2tpbmcucG9zICs9IHRoaXMucHJldHR5TGFiZWwodGFnKS5sZW5ndGg7XG4gICAgICAgIHRoaXMucHJvcHMuZmllbGQudmFsKG5ld1ZhbHVlKTtcbiAgICAgIH1cbiAgICB9LFxuXG4gICAgb25JbnNlcnQ6IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgdmFyIHRhZyA9IHZhbHVlO1xuICAgICAgdmFyIHBvcyA9IHRoaXMudHJhY2tpbmcucG9zO1xuICAgICAgdmFyIGVuZFBvcyA9IHRoaXMudHJhY2tpbmcucG9zICsgdGhpcy50cmFja2luZy5yYW5nZTtcbiAgICAgIHZhciBpbnNlcnRQb3MgPSB0aGlzLm5vcm1hbGl6ZVBvc2l0aW9uKHBvcyk7XG4gICAgICB2YXIgZW5kSW5zZXJ0UG9zID0gdGhpcy5ub3JtYWxpemVQb3NpdGlvbihlbmRQb3MpO1xuICAgICAgdmFyIHRva2VucyA9IHRoaXMudHJhY2tpbmcudG9rZW5zO1xuICAgICAgdmFyIHRva2VuSW5kZXggPSB0aGlzLnRva2VuSW5kZXgoaW5zZXJ0UG9zLCB0b2tlbnMsIHRoaXMudHJhY2tpbmcuaW5kZXhNYXApO1xuICAgICAgdmFyIHRva2VuRW5kSW5kZXggPSB0aGlzLnRva2VuSW5kZXgoZW5kSW5zZXJ0UG9zLCB0b2tlbnMsIHRoaXMudHJhY2tpbmcuaW5kZXhNYXApO1xuICAgICAgdG9rZW5zLnNwbGljZSh0b2tlbkluZGV4LCB0b2tlbkVuZEluZGV4IC0gdG9rZW5JbmRleCwge1xuICAgICAgICB0eXBlOiAndGFnJyxcbiAgICAgICAgdmFsdWU6IHRhZ1xuICAgICAgfSk7XG4gICAgICB0aGlzLnRyYWNraW5nLmluZGV4TWFwID0gdGhpcy5pbmRleE1hcCh0b2tlbnMpO1xuICAgICAgdmFyIG5ld1ZhbHVlID0gdGhpcy5yYXdWYWx1ZSh0b2tlbnMpO1xuICAgICAgdGhpcy50cmFja2luZy5wb3MgKz0gdGhpcy5wcmV0dHlMYWJlbCh0YWcpLmxlbmd0aDtcbiAgICAgIHRoaXMucHJvcHMuZmllbGQudmFsKG5ld1ZhbHVlKTtcbiAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICBpc0Nob2ljZXNPcGVuOiBmYWxzZVxuICAgICAgfSk7XG4gICAgfSxcblxuICAgIG9uVG9nZ2xlQ2hvaWNlczogZnVuY3Rpb24gKCkge1xuICAgICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICAgIGlzQ2hvaWNlc09wZW46ICF0aGlzLnN0YXRlLmlzQ2hvaWNlc09wZW5cbiAgICAgIH0pO1xuICAgIH0sXG5cbiAgICBvbkNsb3NlQ2hvaWNlczogZnVuY3Rpb24gKCkge1xuICAgICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICAgIGlzQ2hvaWNlc09wZW46IGZhbHNlXG4gICAgICB9KTtcbiAgICB9LFxuXG4gICAgZ2V0Q2xvc2VJZ25vcmVOb2RlczogZnVuY3Rpb24gKCkge1xuICAgICAgcmV0dXJuIHRoaXMucmVmcy50b2dnbGUuZ2V0RE9NTm9kZSgpO1xuICAgIH0sXG5cbiAgICBvbkNsaWNrT3V0c2lkZUNob2ljZXM6IGZ1bmN0aW9uICgpIHtcbiAgICAgIC8vIC8vIElmIHdlIGRpZG4ndCBjbGljayBvbiB0aGUgdG9nZ2xlIGJ1dHRvbiwgY2xvc2UgdGhlIGNob2ljZXMuXG4gICAgICAvLyBpZiAodGhpcy5pc05vZGVPdXRzaWRlKHRoaXMucmVmcy50b2dnbGUuZ2V0RE9NTm9kZSgpLCBldmVudC50YXJnZXQpKSB7XG4gICAgICAvLyAgIGNvbnNvbGUubG9nKCdub3QgYSB0b2dnbGUgY2xpY2snKVxuICAgICAgLy8gICB0aGlzLnNldFN0YXRlKHtcbiAgICAgIC8vICAgICBpc0Nob2ljZXNPcGVuOiBmYWxzZVxuICAgICAgLy8gICB9KTtcbiAgICAgIC8vIH1cbiAgICB9LFxuXG4gICAgb25Nb3VzZU1vdmU6IGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgLy8gUGxhY2Vob2xkZXIgdG8gZ2V0IGF0IHBpbGwgdW5kZXIgbW91c2UgcG9zaXRpb24uIEluZWZmaWNpZW50LCBidXQgbm90XG4gICAgICAvLyBzdXJlIHRoZXJlJ3MgYW5vdGhlciB3YXkuXG5cbiAgICAgIHZhciBwb3NpdGlvbiA9IHt4OiBldmVudC5jbGllbnRYLCB5OiBldmVudC5jbGllbnRZfTtcbiAgICAgIHZhciBub2RlcyA9IHRoaXMucmVmcy5oaWdobGlnaHQuZ2V0RE9NTm9kZSgpLmNoaWxkTm9kZXM7XG4gICAgICB2YXIgbWF0Y2hlZE5vZGUgPSBudWxsO1xuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBub2Rlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICB2YXIgbm9kZSA9IG5vZGVzW2ldO1xuICAgICAgICBpZiAobm9kZXNbaV0uZ2V0QXR0cmlidXRlKCdkYXRhLXByZXR0eScpKSB7XG4gICAgICAgICAgaWYgKHBvc2l0aW9uSW5Ob2RlKHBvc2l0aW9uLCBub2RlKSkge1xuICAgICAgICAgICAgbWF0Y2hlZE5vZGUgPSBub2RlO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmIChtYXRjaGVkTm9kZSkge1xuICAgICAgICBpZiAodGhpcy5zdGF0ZS5ob3ZlclBpbGxSZWYgIT09IG1hdGNoZWROb2RlLmdldEF0dHJpYnV0ZSgnZGF0YS1yZWYnKSkge1xuICAgICAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICAgICAgaG92ZXJQaWxsUmVmOiBtYXRjaGVkTm9kZS5nZXRBdHRyaWJ1dGUoJ2RhdGEtcmVmJylcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmICh0aGlzLnN0YXRlLmhvdmVyUGlsbFJlZikge1xuICAgICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgICBob3ZlclBpbGxSZWY6IG51bGxcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfSxcblxuICAgIHJlbmRlcjogZnVuY3Rpb24gKCkge1xuICAgICAgdmFyIGZpZWxkID0gdGhpcy5wcm9wcy5maWVsZDtcblxuICAgICAgdmFyIHJlcGxhY2VDaG9pY2VzID0gZmllbGQuZGVmLnJlcGxhY2VDaG9pY2VzO1xuXG4gICAgICAvLyB2YXIgc2VsZWN0UmVwbGFjZUNob2ljZXMgPSBbe1xuICAgICAgLy8gICB2YWx1ZTogJycsXG4gICAgICAvLyAgIGxhYmVsOiAnSW5zZXJ0Li4uJ1xuICAgICAgLy8gfV0uY29uY2F0KHJlcGxhY2VDaG9pY2VzKTtcblxuICAgICAgcmV0dXJuIHBsdWdpbi5jb21wb25lbnQoJ2ZpZWxkJykoe1xuICAgICAgICBmaWVsZDogZmllbGRcbiAgICAgIH0sIFIuZGl2KHtzdHlsZToge3Bvc2l0aW9uOiAncmVsYXRpdmUnfX0sXG5cbiAgICAgICAgUi5wcmUoe1xuICAgICAgICAgIGNsYXNzTmFtZTogJ3ByZXR0eS1oaWdobGlnaHQnLFxuICAgICAgICAgIHJlZjogJ2hpZ2hsaWdodCdcbiAgICAgICAgfSxcbiAgICAgICAgICB0aGlzLnByZXR0eVZhbHVlKGZpZWxkLnZhbHVlKVxuICAgICAgICApLFxuXG4gICAgICAgIFIudGV4dGFyZWEoXy5leHRlbmQoe1xuICAgICAgICAgIGNsYXNzTmFtZTogdXRpbC5jbGFzc05hbWUodGhpcy5wcm9wcy5jbGFzc05hbWUsICdwcmV0dHktY29udGVudCcpLFxuICAgICAgICAgIHJlZjogJ2NvbnRlbnQnLFxuICAgICAgICAgIHJvd3M6IGZpZWxkLmRlZi5yb3dzIHx8IHRoaXMucHJvcHMucm93cyxcbiAgICAgICAgICBuYW1lOiBmaWVsZC5rZXksXG4gICAgICAgICAgdmFsdWU6IHRoaXMucGxhaW5WYWx1ZShmaWVsZC52YWx1ZSksXG4gICAgICAgICAgb25DaGFuZ2U6IHRoaXMub25DaGFuZ2UsXG4gICAgICAgICAgb25TY3JvbGw6IHRoaXMub25TY3JvbGwsXG4gICAgICAgICAgc3R5bGU6IHtcbiAgICAgICAgICAgIHBvc2l0aW9uOiAncmVsYXRpdmUnLFxuICAgICAgICAgICAgdG9wOiAwLFxuICAgICAgICAgICAgbGVmdDogMCxcbiAgICAgICAgICAgIGN1cnNvcjogdGhpcy5zdGF0ZS5ob3ZlclBpbGxSZWYgPyAncG9pbnRlcicgOiBudWxsXG4gICAgICAgICAgfSxcbiAgICAgICAgICBvbktleVByZXNzOiB0aGlzLm9uS2V5UHJlc3MsXG4gICAgICAgICAgb25LZXlEb3duOiB0aGlzLm9uS2V5RG93bixcbiAgICAgICAgICBvbktleVVwOiB0aGlzLm9uS2V5VXAsXG4gICAgICAgICAgb25TZWxlY3Q6IHRoaXMub25TZWxlY3QsXG4gICAgICAgICAgb25Db3B5OiB0aGlzLm9uQ29weSxcbiAgICAgICAgICBvbkN1dDogdGhpcy5vbkN1dCxcbiAgICAgICAgICBvbk1vdXNlTW92ZTogdGhpcy5vbk1vdXNlTW92ZVxuICAgICAgICB9LCBwbHVnaW4uY29uZmlnLmF0dHJpYnV0ZXMpKSxcblxuICAgICAgICBSLmEoe3JlZjogJ3RvZ2dsZScsIGhyZWY6ICdKYXZhU2NyaXB0JyArICc6Jywgb25DbGljazogdGhpcy5vblRvZ2dsZUNob2ljZXN9LCAnSW5zZXJ0Li4uJyksXG5cbiAgICAgICAgcGx1Z2luLmNvbXBvbmVudCgnY2hvaWNlcycpKHtcbiAgICAgICAgICByZWY6ICdjaG9pY2VzJyxcbiAgICAgICAgICBjaG9pY2VzOiByZXBsYWNlQ2hvaWNlcywgb3BlbjogdGhpcy5zdGF0ZS5pc0Nob2ljZXNPcGVuLFxuICAgICAgICAgIG9uU2VsZWN0OiB0aGlzLm9uSW5zZXJ0LCBvbkNsb3NlOiB0aGlzLm9uQ2xvc2VDaG9pY2VzLCBpZ25vcmVDbG9zZU5vZGVzOiB0aGlzLmdldENsb3NlSWdub3JlTm9kZXN9KVxuICAgICAgICAvLyxcblxuICAgICAgICAvLyBSLnNlbGVjdCh7b25DaGFuZ2U6IHRoaXMub25JbnNlcnRGcm9tU2VsZWN0fSxcbiAgICAgICAgLy8gICBzZWxlY3RSZXBsYWNlQ2hvaWNlcy5tYXAoZnVuY3Rpb24gKGNob2ljZSwgaSkge1xuICAgICAgICAvLyAgICAgcmV0dXJuIFIub3B0aW9uKHtcbiAgICAgICAgLy8gICAgICAga2V5OiBpLFxuICAgICAgICAvLyAgICAgICB2YWx1ZTogY2hvaWNlLnZhbHVlXG4gICAgICAgIC8vICAgICB9LCBjaG9pY2UubGFiZWwpO1xuICAgICAgICAvLyAgIH0pXG4gICAgICAgIC8vIClcbiAgICAgICkpO1xuICAgIH1cbiAgfSk7XG59O1xuXG59KS5jYWxsKHRoaXMsdHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbCA6IHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiID8gc2VsZiA6IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB7fSkiLCIoZnVuY3Rpb24gKGdsb2JhbCl7XG4vLyAjIGNvbXBvbmVudC5yZW1vdmUtaXRlbVxuXG4vKlxuUmVtb3ZlIGFuIGl0ZW0uXG4qL1xuXG4ndXNlIHN0cmljdCc7XG5cbnZhciBSZWFjdCA9ICh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93LlJlYWN0IDogdHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbC5SZWFjdCA6IG51bGwpO1xudmFyIFIgPSBSZWFjdC5ET007XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKHBsdWdpbikge1xuXG4gIHBsdWdpbi5leHBvcnRzID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXG4gICAgZGlzcGxheU5hbWU6IHBsdWdpbi5uYW1lLFxuXG4gICAgZ2V0RGVmYXVsdFByb3BzOiBmdW5jdGlvbiAoKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBjbGFzc05hbWU6IHBsdWdpbi5jb25maWcuY2xhc3NOYW1lLFxuICAgICAgICBsYWJlbDogcGx1Z2luLmNvbmZpZ1ZhbHVlKCdsYWJlbCcsICdbcmVtb3ZlXScpXG4gICAgICB9O1xuICAgIH0sXG5cbiAgICByZW5kZXI6IGZ1bmN0aW9uICgpIHtcbiAgICAgIHJldHVybiBSLnNwYW4oe2NsYXNzTmFtZTogdGhpcy5wcm9wcy5jbGFzc05hbWUsIG9uQ2xpY2s6IHRoaXMucHJvcHMub25DbGlja30sIHRoaXMucHJvcHMubGFiZWwpO1xuICAgIH1cbiAgfSk7XG59O1xuXG59KS5jYWxsKHRoaXMsdHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbCA6IHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiID8gc2VsZiA6IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB7fSkiLCIoZnVuY3Rpb24gKGdsb2JhbCl7XG4vLyAjIGNvbXBvbmVudC5yb290XG5cbi8qXG5Sb290IGNvbXBvbmVudCBqdXN0IHVzZWQgdG8gc3BpdCBvdXQgYWxsIHRoZSBmaWVsZHMgZm9yIGEgZm9ybS5cbiovXG5cbid1c2Ugc3RyaWN0JztcblxudmFyIFJlYWN0ID0gKHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cuUmVhY3QgOiB0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsLlJlYWN0IDogbnVsbCk7XG52YXIgUiA9IFJlYWN0LkRPTTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAocGx1Z2luKSB7XG5cbiAgdmFyIHV0aWwgPSBwbHVnaW4ucmVxdWlyZSgndXRpbCcpO1xuXG4gIHBsdWdpbi5leHBvcnRzID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXG4gICAgZGlzcGxheU5hbWU6IHBsdWdpbi5uYW1lLFxuXG4gICAgZ2V0RGVmYXVsdFByb3BzOiBmdW5jdGlvbiAoKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBjbGFzc05hbWU6IHV0aWwuY2xhc3NOYW1lKCdyb290JywgcGx1Z2luLmNvbmZpZy5jbGFzc05hbWUpXG4gICAgICB9O1xuICAgIH0sXG5cbiAgICByZW5kZXI6IGZ1bmN0aW9uICgpIHtcbiAgICAgIHZhciBmaWVsZCA9IHRoaXMucHJvcHMuZmllbGQ7XG5cbiAgICAgIHJldHVybiBSLmRpdih7XG4gICAgICAgIGNsYXNzTmFtZTogdGhpcy5wcm9wcy5jbGFzc05hbWVcbiAgICAgIH0sXG4gICAgICAgIGZpZWxkLmZpZWxkcygpLm1hcChmdW5jdGlvbiAoZmllbGQsIGkpIHtcbiAgICAgICAgICByZXR1cm4gZmllbGQuY29tcG9uZW50KHtrZXk6IGZpZWxkLmRlZi5rZXkgfHwgaX0pO1xuICAgICAgICB9KVxuICAgICAgKTtcbiAgICB9XG4gIH0pO1xufTtcblxufSkuY2FsbCh0aGlzLHR5cGVvZiBnbG9iYWwgIT09IFwidW5kZWZpbmVkXCIgPyBnbG9iYWwgOiB0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOiB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge30pIiwiKGZ1bmN0aW9uIChnbG9iYWwpe1xuLy8gIyBjb21wb25lbnQuaGVscFxuXG4vKlxuSnVzdCB0aGUgaGVscCB0ZXh0IGJsb2NrLlxuKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgUmVhY3QgPSAodHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdy5SZWFjdCA6IHR5cGVvZiBnbG9iYWwgIT09IFwidW5kZWZpbmVkXCIgPyBnbG9iYWwuUmVhY3QgOiBudWxsKTtcbnZhciBSID0gUmVhY3QuRE9NO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChwbHVnaW4pIHtcblxuICBwbHVnaW4uZXhwb3J0cyA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcblxuICAgIGRpc3BsYXlOYW1lOiBwbHVnaW4ubmFtZSxcblxuICAgIGdldERlZmF1bHRQcm9wczogZnVuY3Rpb24gKCkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgY2xhc3NOYW1lOiBwbHVnaW4uY29uZmlnLmNsYXNzTmFtZVxuICAgICAgfTtcbiAgICB9LFxuXG4gICAgcmVuZGVyOiBmdW5jdGlvbiAoKSB7XG5cbiAgICAgIHZhciBjaG9pY2UgPSB0aGlzLnByb3BzLmNob2ljZTtcblxuICAgICAgcmV0dXJuIGNob2ljZS5zYW1wbGUgP1xuICAgICAgICBSLmRpdih7Y2xhc3NOYW1lOiB0aGlzLnByb3BzLmNsYXNzTmFtZX0sXG4gICAgICAgICAgY2hvaWNlLnNhbXBsZVxuICAgICAgICApIDpcbiAgICAgICAgUi5zcGFuKG51bGwpO1xuICAgIH1cbiAgfSk7XG59O1xuXG59KS5jYWxsKHRoaXMsdHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbCA6IHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiID8gc2VsZiA6IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB7fSkiLCIoZnVuY3Rpb24gKGdsb2JhbCl7XG4vLyAjIGNvbXBvbmVudC5zZWxlY3RcblxuLypcblJlbmRlciBzZWxlY3QgZWxlbWVudCB0byBnaXZlIGEgdXNlciBjaG9pY2VzIGZvciB0aGUgdmFsdWUgb2YgYSBmaWVsZC4gTm90ZVxuaXQgc2hvdWxkIHN1cHBvcnQgdmFsdWVzIG90aGVyIHRoYW4gc3RyaW5ncy4gQ3VycmVudGx5IHRoaXMgaXMgb25seSB0ZXN0ZWQgZm9yXG5ib29sZWFuIHZhbHVlcywgYnV0IGl0IF9zaG91bGRfIHdvcmsgZm9yIG90aGVyIHZhbHVlcy5cbiovXG5cbid1c2Ugc3RyaWN0JztcblxudmFyIFJlYWN0ID0gKHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cuUmVhY3QgOiB0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsLlJlYWN0IDogbnVsbCk7XG52YXIgUiA9IFJlYWN0LkRPTTtcbnZhciBfID0gKHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cuXyA6IHR5cGVvZiBnbG9iYWwgIT09IFwidW5kZWZpbmVkXCIgPyBnbG9iYWwuXyA6IG51bGwpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChwbHVnaW4pIHtcblxuICBwbHVnaW4uZXhwb3J0cyA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcblxuICAgIGRpc3BsYXlOYW1lOiBwbHVnaW4ubmFtZSxcblxuICAgIG1peGluczogW3BsdWdpbi5yZXF1aXJlKCdtaXhpbi5maWVsZCcpXSxcblxuICAgIGdldERlZmF1bHRQcm9wczogZnVuY3Rpb24gKCkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgY2xhc3NOYW1lOiBwbHVnaW4uY29uZmlnLmNsYXNzTmFtZVxuICAgICAgfTtcbiAgICB9LFxuXG4gICAgb25DaGFuZ2U6IGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgdmFyIGNob2ljZVZhbHVlID0gZXZlbnQudGFyZ2V0LnZhbHVlO1xuICAgICAgdmFyIGNob2ljZVR5cGUgPSBjaG9pY2VWYWx1ZS5zdWJzdHJpbmcoMCwgY2hvaWNlVmFsdWUuaW5kZXhPZignOicpKTtcbiAgICAgIGlmIChjaG9pY2VUeXBlID09PSAnY2hvaWNlJykge1xuICAgICAgICB2YXIgY2hvaWNlSW5kZXggPSBjaG9pY2VWYWx1ZS5zdWJzdHJpbmcoY2hvaWNlVmFsdWUuaW5kZXhPZignOicpICsgMSk7XG4gICAgICAgIGNob2ljZUluZGV4ID0gcGFyc2VJbnQoY2hvaWNlSW5kZXgpO1xuICAgICAgICB0aGlzLnByb3BzLmZpZWxkLnZhbCh0aGlzLnByb3BzLmZpZWxkLmRlZi5jaG9pY2VzW2Nob2ljZUluZGV4XS52YWx1ZSk7XG4gICAgICB9XG4gICAgfSxcblxuICAgIHJlbmRlcjogZnVuY3Rpb24gKCkge1xuXG4gICAgICB2YXIgZmllbGQgPSB0aGlzLnByb3BzLmZpZWxkO1xuICAgICAgdmFyIGNob2ljZXMgPSBmaWVsZC5kZWYuY2hvaWNlcyB8fCBbXTtcblxuICAgICAgdmFyIGNob2ljZXNPckxvYWRpbmc7XG5cbiAgICAgIGlmIChjaG9pY2VzLmxlbmd0aCA9PT0gMSAmJiBjaG9pY2VzWzBdLnZhbHVlID09PSAnLy8vbG9hZGluZy8vLycpIHtcbiAgICAgICAgY2hvaWNlc09yTG9hZGluZyA9IFIuZGl2KHt9LFxuICAgICAgICAgICdMb2FkaW5nIGNob2ljZXMuLi4nXG4gICAgICAgICk7XG4gICAgICB9IGVsc2Uge1xuXG4gICAgICAgIHZhciB2YWx1ZSA9IGZpZWxkLnZhbHVlICE9PSB1bmRlZmluZWQgPyBmaWVsZC52YWx1ZSA6ICcnO1xuXG4gICAgICAgIGNob2ljZXMgPSBjaG9pY2VzLm1hcChmdW5jdGlvbiAoY2hvaWNlLCBpKSB7XG4gICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGNob2ljZVZhbHVlOiAnY2hvaWNlOicgKyBpLFxuICAgICAgICAgICAgdmFsdWU6IGNob2ljZS52YWx1ZSxcbiAgICAgICAgICAgIGxhYmVsOiBjaG9pY2UubGFiZWxcbiAgICAgICAgICB9O1xuICAgICAgICB9KTtcblxuICAgICAgICB2YXIgdmFsdWVDaG9pY2UgPSBfLmZpbmQoY2hvaWNlcywgZnVuY3Rpb24gKGNob2ljZSkge1xuICAgICAgICAgIHJldHVybiBjaG9pY2UudmFsdWUgPT09IHZhbHVlO1xuICAgICAgICB9KTtcblxuICAgICAgICBpZiAodmFsdWVDaG9pY2UgPT09IHVuZGVmaW5lZCkge1xuXG4gICAgICAgICAgdmFyIGxhYmVsID0gdmFsdWU7XG4gICAgICAgICAgaWYgKCFfLmlzU3RyaW5nKHZhbHVlKSkge1xuICAgICAgICAgICAgbGFiZWwgPSBKU09OLnN0cmluZ2lmeSh2YWx1ZSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHZhbHVlQ2hvaWNlID0ge1xuICAgICAgICAgICAgY2hvaWNlVmFsdWU6ICd2YWx1ZTonLFxuICAgICAgICAgICAgdmFsdWU6IHZhbHVlLFxuICAgICAgICAgICAgbGFiZWw6IGxhYmVsXG4gICAgICAgICAgfTtcbiAgICAgICAgICBjaG9pY2VzID0gW3ZhbHVlQ2hvaWNlXS5jb25jYXQoY2hvaWNlcyk7XG4gICAgICAgIH1cblxuICAgICAgICBjaG9pY2VzT3JMb2FkaW5nID0gUi5zZWxlY3Qoe1xuICAgICAgICAgIGNsYXNzTmFtZTogdGhpcy5wcm9wcy5jbGFzc05hbWUsXG4gICAgICAgICAgb25DaGFuZ2U6IHRoaXMub25DaGFuZ2UsXG4gICAgICAgICAgdmFsdWU6IHZhbHVlQ2hvaWNlLmNob2ljZVZhbHVlXG4gICAgICAgIH0sXG4gICAgICAgICAgY2hvaWNlcy5tYXAoZnVuY3Rpb24gKGNob2ljZSwgaSkge1xuICAgICAgICAgICAgcmV0dXJuIFIub3B0aW9uKHtcbiAgICAgICAgICAgICAga2V5OiBpLFxuICAgICAgICAgICAgICB2YWx1ZTogY2hvaWNlLmNob2ljZVZhbHVlXG4gICAgICAgICAgICB9LCBjaG9pY2UubGFiZWwpO1xuICAgICAgICAgIH0uYmluZCh0aGlzKSlcbiAgICAgICAgKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHBsdWdpbi5jb21wb25lbnQoJ2ZpZWxkJykoe1xuICAgICAgICBmaWVsZDogZmllbGRcbiAgICAgIH0sIGNob2ljZXNPckxvYWRpbmcpO1xuICAgIH1cbiAgfSk7XG59O1xuXG59KS5jYWxsKHRoaXMsdHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbCA6IHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiID8gc2VsZiA6IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB7fSkiLCIoZnVuY3Rpb24gKGdsb2JhbCl7XG4vLyAjIGNvbXBvbmVudC50ZXh0XG5cbi8qXG5KdXN0IGEgc2ltcGxlIHRleHQgaW5wdXQuXG4qL1xuXG4ndXNlIHN0cmljdCc7XG5cbnZhciBSZWFjdCA9ICh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93LlJlYWN0IDogdHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbC5SZWFjdCA6IG51bGwpO1xudmFyIFIgPSBSZWFjdC5ET007XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKHBsdWdpbikge1xuXG4gIHBsdWdpbi5leHBvcnRzID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXG4gICAgZGlzcGxheU5hbWU6IHBsdWdpbi5uYW1lLFxuXG4gICAgbWl4aW5zOiBbcGx1Z2luLnJlcXVpcmUoJ21peGluLmZpZWxkJyldLFxuXG4gICAgZ2V0RGVmYXVsdFByb3BzOiBmdW5jdGlvbiAoKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBjbGFzc05hbWU6IHBsdWdpbi5jb25maWcuY2xhc3NOYW1lXG4gICAgICB9O1xuICAgIH0sXG5cbiAgICBvbkNoYW5nZTogZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICB2YXIgbmV3VmFsdWUgPSBldmVudC50YXJnZXQudmFsdWU7XG4gICAgICB0aGlzLnByb3BzLmZpZWxkLnZhbChuZXdWYWx1ZSk7XG4gICAgfSxcblxuICAgIHJlbmRlcjogZnVuY3Rpb24gKCkge1xuXG4gICAgICB2YXIgZmllbGQgPSB0aGlzLnByb3BzLmZpZWxkO1xuXG4gICAgICByZXR1cm4gcGx1Z2luLmNvbXBvbmVudCgnZmllbGQnKSh7XG4gICAgICAgIGZpZWxkOiBmaWVsZFxuICAgICAgfSwgUi5pbnB1dCh7XG4gICAgICAgIGNsYXNzTmFtZTogdGhpcy5wcm9wcy5jbGFzc05hbWUsXG4gICAgICAgIHR5cGU6ICd0ZXh0JyxcbiAgICAgICAgdmFsdWU6IGZpZWxkLnZhbHVlLFxuICAgICAgICByb3dzOiBmaWVsZC5kZWYucm93cyxcbiAgICAgICAgb25DaGFuZ2U6IHRoaXMub25DaGFuZ2VcbiAgICAgIH0pKTtcbiAgICB9XG4gIH0pO1xufTtcblxufSkuY2FsbCh0aGlzLHR5cGVvZiBnbG9iYWwgIT09IFwidW5kZWZpbmVkXCIgPyBnbG9iYWwgOiB0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOiB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge30pIiwiKGZ1bmN0aW9uIChnbG9iYWwpe1xuLy8gIyBjb21wb25lbnQudGV4dGFyZWFcblxuLypcbkp1c3QgYSBzaW1wbGUgbXVsdGktcm93IHRleHRhcmVhLlxuKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgUmVhY3QgPSAodHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdy5SZWFjdCA6IHR5cGVvZiBnbG9iYWwgIT09IFwidW5kZWZpbmVkXCIgPyBnbG9iYWwuUmVhY3QgOiBudWxsKTtcbnZhciBSID0gUmVhY3QuRE9NO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChwbHVnaW4pIHtcblxuICBwbHVnaW4uZXhwb3J0cyA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcblxuICAgIGRpc3BsYXlOYW1lOiBwbHVnaW4ubmFtZSxcblxuICAgIG1peGluczogW3BsdWdpbi5yZXF1aXJlKCdtaXhpbi5maWVsZCcpXSxcblxuICAgIGdldERlZmF1bHRQcm9wczogZnVuY3Rpb24gKCkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgY2xhc3NOYW1lOiBwbHVnaW4uY29uZmlnLmNsYXNzTmFtZSxcbiAgICAgICAgcm93czogcGx1Z2luLmNvbmZpZy5yb3dzIHx8IDVcbiAgICAgIH07XG4gICAgfSxcblxuICAgIG9uQ2hhbmdlOiBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgIHZhciBuZXdWYWx1ZSA9IGV2ZW50LnRhcmdldC52YWx1ZTtcbiAgICAgIHRoaXMucHJvcHMuZmllbGQudmFsKG5ld1ZhbHVlKTtcbiAgICB9LFxuXG4gICAgcmVuZGVyOiBmdW5jdGlvbiAoKSB7XG5cbiAgICAgIHZhciBmaWVsZCA9IHRoaXMucHJvcHMuZmllbGQ7XG5cbiAgICAgIHJldHVybiBwbHVnaW4uY29tcG9uZW50KCdmaWVsZCcpKHtcbiAgICAgICAgZmllbGQ6IGZpZWxkXG4gICAgICB9LCBSLnRleHRhcmVhKHtcbiAgICAgICAgY2xhc3NOYW1lOiB0aGlzLnByb3BzLmNsYXNzTmFtZSxcbiAgICAgICAgdmFsdWU6IGZpZWxkLnZhbHVlLFxuICAgICAgICByb3dzOiBmaWVsZC5kZWYucm93cyB8fCB0aGlzLnByb3BzLnJvd3MsXG4gICAgICAgIG9uQ2hhbmdlOiB0aGlzLm9uQ2hhbmdlXG4gICAgICB9KSk7XG4gICAgfVxuICB9KTtcbn07XG5cbn0pLmNhbGwodGhpcyx0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsIDogdHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDogdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9KSIsIihmdW5jdGlvbiAoZ2xvYmFsKXtcbi8vICMgY29yZS5maWVsZFxuXG4vKlxuVGhlIGNvcmUgZmllbGQgcGx1Z2luIHByb3ZpZGVzIHRoZSBGaWVsZCBwcm90b3R5cGUuIEZpZWxkcyByZXByZXNlbnQgYVxucGFydGljdWxhciBzdGF0ZSBpbiB0aW1lIG9mIGEgZmllbGQgZGVmaW5pdGlvbiwgYW5kIHRoZXkgcHJvdmlkZSBoZWxwZXIgbWV0aG9kc1xudG8gbm90aWZ5IHRoZSBmb3JtIHN0b3JlIG9mIGNoYW5nZXMuXG5cbkZpZWxkcyBhcmUgbGF6aWx5IGNyZWF0ZWQgYW5kIGV2YWx1YXRlZCwgYnV0IG9uY2UgZXZhbHVhdGVkLCB0aGV5IHNob3VsZCBiZVxuY29uc2lkZXJlZCBpbW11dGFibGUuXG4qL1xuXG4ndXNlIHN0cmljdCc7XG5cbnZhciBfID0gKHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cuXyA6IHR5cGVvZiBnbG9iYWwgIT09IFwidW5kZWZpbmVkXCIgPyBnbG9iYWwuXyA6IG51bGwpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChwbHVnaW4pIHtcblxuICB2YXIgcm91dGVyID0gcGx1Z2luLnJlcXVpcmUoJ2ZpZWxkLXJvdXRlcicpO1xuICB2YXIgdXRpbCA9IHBsdWdpbi5yZXF1aXJlKCd1dGlsJyk7XG4gIHZhciBldmFsdWF0b3IgPSBwbHVnaW4ucmVxdWlyZSgnZXZhbCcpO1xuICB2YXIgY29tcGlsZXIgPSBwbHVnaW4ucmVxdWlyZSgnY29tcGlsZXInKTtcblxuICAvLyBUaGUgRmllbGQgY29uc3RydWN0b3IuXG4gIHZhciBGaWVsZCA9IGZ1bmN0aW9uIChmb3JtLCBkZWYsIHZhbHVlLCBwYXJlbnQpIHtcbiAgICB2YXIgZmllbGQgPSB0aGlzO1xuXG4gICAgZmllbGQuZm9ybSA9IGZvcm07XG4gICAgZmllbGQuZGVmID0gZGVmO1xuICAgIGZpZWxkLnZhbHVlID0gdmFsdWU7XG4gICAgZmllbGQucGFyZW50ID0gcGFyZW50O1xuICAgIGZpZWxkLmdyb3VwcyA9IHt9O1xuICAgIGZpZWxkLnRlbXBDaGlsZHJlbiA9IFtdO1xuICB9O1xuXG4gIC8vIEF0dGFjaCBhIGZpZWxkIGZhY3RvcnkgdG8gdGhlIGZvcm0gcHJvdG90eXBlLlxuICBwbHVnaW4uZXhwb3J0cy5maWVsZCA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgZm9ybSA9IHRoaXM7XG5cbiAgICByZXR1cm4gbmV3IEZpZWxkKGZvcm0sIHtcbiAgICAgIHR5cGU6ICdyb290J1xuICAgIH0sIGZvcm0uc3RvcmUudmFsdWUpO1xuICB9O1xuXG4gIHZhciBwcm90byA9IEZpZWxkLnByb3RvdHlwZTtcblxuICAvLyBSZXR1cm4gdGhlIHR5cGUgcGx1Z2luIGZvciB0aGlzIGZpZWxkLlxuICBwcm90by50eXBlUGx1Z2luID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciBmaWVsZCA9IHRoaXM7XG5cbiAgICBpZiAoIWZpZWxkLl90eXBlUGx1Z2luKSB7XG4gICAgICBmaWVsZC5fdHlwZVBsdWdpbiA9IHBsdWdpbi5yZXF1aXJlKCd0eXBlLicgKyBmaWVsZC5kZWYudHlwZSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGZpZWxkLl90eXBlUGx1Z2luO1xuICB9O1xuXG4gIC8vIEdldCBhIGNvbXBvbmVudCBmb3IgdGhpcyBmaWVsZC5cbiAgcHJvdG8uY29tcG9uZW50ID0gZnVuY3Rpb24gKHByb3BzKSB7XG4gICAgdmFyIGZpZWxkID0gdGhpcztcbiAgICBwcm9wcyA9IF8uZXh0ZW5kKHt9LCBwcm9wcywge2ZpZWxkOiBmaWVsZH0pO1xuICAgIHZhciBjb21wb25lbnQgPSByb3V0ZXIuY29tcG9uZW50Rm9yRmllbGQoZmllbGQpO1xuICAgIHJldHVybiBjb21wb25lbnQocHJvcHMpO1xuICB9O1xuXG4gIC8vIEdldCB0aGUgY2hpbGQgZmllbGRzIGZvciB0aGlzIGZpZWxkLlxuICBwcm90by5maWVsZHMgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGZpZWxkID0gdGhpcztcblxuICAgIGlmICghZmllbGQuX2ZpZWxkcykge1xuICAgICAgdmFyIGZpZWxkcztcbiAgICAgIGlmIChmaWVsZC50eXBlUGx1Z2luKCkuZmllbGRzKSB7XG4gICAgICAgIGZpZWxkcyA9IGZpZWxkLnR5cGVQbHVnaW4oKS5maWVsZHMoZmllbGQpO1xuICAgICAgfSBlbHNlIGlmIChmaWVsZC5kZWYuZmllbGRzKSB7XG4gICAgICAgIGZpZWxkcyA9IGZpZWxkLmRlZi5maWVsZHMubWFwKGZ1bmN0aW9uIChkZWYpIHtcbiAgICAgICAgICByZXR1cm4gZmllbGQuY3JlYXRlQ2hpbGQoZGVmKTtcbiAgICAgICAgfSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBmaWVsZHMgPSBbXTtcbiAgICAgIH1cbiAgICAgIGZpZWxkLl9maWVsZHMgPSBmaWVsZHM7XG4gICAgfVxuXG4gICAgcmV0dXJuIGZpZWxkLl9maWVsZHM7XG4gIH07XG5cbiAgLy8gR2V0IHRoZSBpdGVtcyAoY2hpbGQgZmllbGQgZGVmaW5pdGlvbnMpIGZvciB0aGlzIGZpZWxkLlxuICBwcm90by5pdGVtcyA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgZmllbGQgPSB0aGlzO1xuXG4gICAgaWYgKCFmaWVsZC5faXRlbXMpIHtcbiAgICAgIGlmIChfLmlzQXJyYXkoZmllbGQuZGVmLml0ZW1zKSkge1xuICAgICAgICBmaWVsZC5faXRlbXMgPSBmaWVsZC5kZWYuaXRlbXMubWFwKGZ1bmN0aW9uIChpdGVtKSB7XG4gICAgICAgICAgcmV0dXJuIGZpZWxkLnJlc29sdmUoaXRlbSk7XG4gICAgICAgIH0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZmllbGQuX2l0ZW1zID0gW107XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGZpZWxkLl9pdGVtcztcbiAgfTtcblxuICAvLyBSZXNvbHZlIGEgZmllbGQgcmVmZXJlbmNlIGlmIG5lY2Vzc2FyeS5cbiAgcHJvdG8ucmVzb2x2ZSA9IGZ1bmN0aW9uIChkZWYpIHtcbiAgICB2YXIgZmllbGQgPSB0aGlzO1xuXG4gICAgaWYgKF8uaXNTdHJpbmcoZGVmKSkge1xuICAgICAgZGVmID0gZmllbGQuZm9ybS5maW5kRGVmKGRlZik7XG4gICAgICBpZiAoIWRlZikge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0NvdWxkIG5vdCBmaW5kIGZpZWxkOiAnICsgZGVmKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gZGVmO1xuICB9O1xuXG4gIC8vIEV2YWx1YXRlIGEgZmllbGQgZGVmaW5pdGlvbiBhbmQgcmV0dXJuIGEgbmV3IGZpZWxkIGRlZmluaXRpb24uXG4gIHByb3RvLmV2YWxEZWYgPSBmdW5jdGlvbiAoZGVmKSB7XG4gICAgdmFyIGZpZWxkID0gdGhpcztcblxuICAgIGlmIChkZWYuZXZhbCkge1xuXG4gICAgICB0cnkge1xuICAgICAgICB2YXIgZXh0RGVmID0gZmllbGQuZXZhbChkZWYuZXZhbCk7XG4gICAgICAgIGlmIChleHREZWYpIHtcbiAgICAgICAgICBkZWYgPSBfLmV4dGVuZCh7fSwgZGVmLCBleHREZWYpO1xuICAgICAgICAgIGlmIChkZWYuZmllbGRzKSB7XG4gICAgICAgICAgICBkZWYuZmllbGRzID0gZGVmLmZpZWxkcy5tYXAoZnVuY3Rpb24gKGNoaWxkRGVmKSB7XG4gICAgICAgICAgICAgIGNoaWxkRGVmID0gY29tcGlsZXIuZXhwYW5kRGVmKGNoaWxkRGVmLCBmaWVsZC5mb3JtLnN0b3JlLnRlbXBsYXRlTWFwKTtcbiAgICAgICAgICAgICAgcmV0dXJuIGNvbXBpbGVyLmNvbXBpbGVEZWYoY2hpbGREZWYpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGRlZiA9IGNvbXBpbGVyLmNvbXBpbGVEZWYoZGVmKTtcbiAgICAgICAgfVxuICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICBjb25zb2xlLmxvZygnUHJvYmxlbSBpbiBldmFsOiAnLCBKU09OLnN0cmluZ2lmeShkZWYuZXZhbCkpO1xuICAgICAgICBjb25zb2xlLmxvZyhlLm1lc3NhZ2UpO1xuICAgICAgICBjb25zb2xlLmxvZyhlLnN0YWNrKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gZGVmO1xuICB9O1xuXG4gIC8vIEV2YWx1YXRlIGFuIGV4cHJlc3Npb24gaW4gdGhlIGNvbnRleHQgb2YgYSBmaWVsZC5cbiAgcHJvdG8uZXZhbCA9IGZ1bmN0aW9uIChleHByZXNzaW9uLCBjb250ZXh0KSB7XG4gICAgcmV0dXJuIGV2YWx1YXRvci5ldmFsdWF0ZShleHByZXNzaW9uLCB0aGlzLCBjb250ZXh0KTtcbiAgfTtcblxuICAvLyBDcmVhdGUgYSBjaGlsZCBmaWVsZCBmcm9tIGEgZGVmaW5pdGlvbi5cbiAgcHJvdG8uY3JlYXRlQ2hpbGQgPSBmdW5jdGlvbiAoZGVmKSB7XG4gICAgdmFyIGZpZWxkID0gdGhpcztcblxuICAgIGRlZiA9IGZpZWxkLnJlc29sdmUoZGVmKTtcblxuICAgIHZhciB2YWx1ZSA9IGZpZWxkLnZhbHVlO1xuXG4gICAgZGVmID0gZmllbGQuZXZhbERlZihkZWYpO1xuXG4gICAgaWYgKCF1dGlsLmlzQmxhbmsoZGVmLmtleSkpIHtcbiAgICAgIGlmICh2YWx1ZSAmJiAhXy5pc1VuZGVmaW5lZCh2YWx1ZVtkZWYua2V5XSkpIHtcbiAgICAgICAgdmFsdWUgPSB2YWx1ZVtkZWYua2V5XTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHZhbHVlID0gdW5kZWZpbmVkO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICB2YWx1ZSA9IGRlZi52YWx1ZTtcbiAgICB9XG5cbiAgICB2YXIgY2hpbGRGaWVsZCA9IG5ldyBGaWVsZChmaWVsZC5mb3JtLCBkZWYsIHZhbHVlLCBmaWVsZCk7XG5cbiAgICBmaWVsZC50ZW1wQ2hpbGRyZW4ucHVzaChjaGlsZEZpZWxkKTtcblxuICAgIHJldHVybiBjaGlsZEZpZWxkO1xuXG4gICAgLy8gaWYgKGRlZi5ldmFsKSB7XG4gICAgLy8gICBkZWYgPSBjaGlsZEZpZWxkLmV2YWxEZWYoZGVmKTtcbiAgICAvLyAgIGlmICh1dGlsLmlzQmxhbmsoZGVmLmtleSkpIHtcbiAgICAvLyAgICAgdmFsdWUgPSBkZWYudmFsdWU7XG4gICAgLy8gICB9XG4gICAgLy8gICBjaGlsZEZpZWxkID0gbmV3IEZpZWxkKGZpZWxkLmZvcm0sIGRlZiwgdmFsdWUsIGZpZWxkKTtcbiAgICAvLyB9XG4gICAgLy9cbiAgICAvLyByZXR1cm4gY2hpbGRGaWVsZDtcbiAgfTtcblxuICAvLyBHaXZlbiBhIHZhbHVlLCBmaW5kIGFuIGFwcHJvcHJpYXRlIGZpZWxkIGRlZmluaXRpb24gZm9yIHRoaXMgZmllbGQuXG4gIHByb3RvLml0ZW1Gb3JWYWx1ZSA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgIHZhciBmaWVsZCA9IHRoaXM7XG5cbiAgICB2YXIgaXRlbSA9IF8uZmluZChmaWVsZC5pdGVtcygpLCBmdW5jdGlvbiAoaXRlbSkge1xuICAgICAgcmV0dXJuIHV0aWwuaXRlbU1hdGNoZXNWYWx1ZShpdGVtLCB2YWx1ZSk7XG4gICAgfSk7XG4gICAgaWYgKGl0ZW0pIHtcbiAgICAgIGl0ZW0gPSBfLmV4dGVuZCh7fSwgaXRlbSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGl0ZW0gPSB1dGlsLmZpZWxkRGVmRnJvbVZhbHVlKHZhbHVlKTtcbiAgICB9XG5cbiAgICByZXR1cm4gaXRlbTtcbiAgfTtcblxuICAvLyBHZXQgYWxsIHRoZSBmaWVsZHMgYmVsb25naW5nIHRvIGEgZ3JvdXAuXG4gIHByb3RvLmdyb3VwRmllbGRzID0gZnVuY3Rpb24gKGdyb3VwTmFtZSwgaWdub3JlVGVtcENoaWxkcmVuKSB7XG4gICAgdmFyIGZpZWxkID0gdGhpcztcblxuICAgIGlmICghZmllbGQuZ3JvdXBzW2dyb3VwTmFtZV0pIHtcbiAgICAgIGZpZWxkLmdyb3Vwc1tncm91cE5hbWVdID0gW107XG5cbiAgICAgIGlmIChmaWVsZC5wYXJlbnQpIHtcbiAgICAgICAgdmFyIHNpYmxpbmdzID0gZmllbGQucGFyZW50LmZpZWxkcygpO1xuICAgICAgICBzaWJsaW5ncy5mb3JFYWNoKGZ1bmN0aW9uIChzaWJsaW5nKSB7XG4gICAgICAgICAgaWYgKHNpYmxpbmcgIT09IGZpZWxkICYmIHNpYmxpbmcuZGVmLmdyb3VwID09PSBncm91cE5hbWUpIHtcbiAgICAgICAgICAgIGZpZWxkLmdyb3Vwc1tncm91cE5hbWVdLnB1c2goc2libGluZyk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgdmFyIHBhcmVudEdyb3VwRmllbGRzID0gZmllbGQucGFyZW50Lmdyb3VwRmllbGRzKGdyb3VwTmFtZSwgdHJ1ZSk7XG4gICAgICAgIGZpZWxkLmdyb3Vwc1tncm91cE5hbWVdID0gZmllbGQuZ3JvdXBzW2dyb3VwTmFtZV0uY29uY2F0KHBhcmVudEdyb3VwRmllbGRzKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoIWlnbm9yZVRlbXBDaGlsZHJlbiAmJiBmaWVsZC5ncm91cHNbZ3JvdXBOYW1lXS5sZW5ndGggPT09IDApIHtcbiAgICAgIC8vIGxvb2tpbmcgYXQgY2hpbGRyZW4gc28gZmFyXG4gICAgICB2YXIgY2hpbGRHcm91cEZpZWxkcyA9IFtdO1xuICAgICAgZmllbGQudGVtcENoaWxkcmVuLmZvckVhY2goZnVuY3Rpb24gKGNoaWxkKSB7XG4gICAgICAgIGlmIChjaGlsZC5kZWYuZ3JvdXAgPT09IGdyb3VwTmFtZSkge1xuICAgICAgICAgIGNoaWxkR3JvdXBGaWVsZHMucHVzaChjaGlsZCk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIGNoaWxkR3JvdXBGaWVsZHM7XG4gICAgfVxuXG4gICAgcmV0dXJuIGZpZWxkLmdyb3Vwc1tncm91cE5hbWVdO1xuICB9O1xuXG4gIC8vIFdhbGsgYmFja3dhcmRzIHRocm91Z2ggcGFyZW50cyBhbmQgYnVpbGQgb3V0IGEgcGF0aCBhcnJheSB0byB0aGUgdmFsdWUuXG4gIHByb3RvLnZhbHVlUGF0aCA9IGZ1bmN0aW9uIChjaGlsZFBhdGgpIHtcbiAgICB2YXIgZmllbGQgPSB0aGlzO1xuXG4gICAgdmFyIHBhdGggPSBjaGlsZFBhdGggfHwgW107XG4gICAgaWYgKCF1dGlsLmlzQmxhbmsoZmllbGQuZGVmLmtleSkpIHtcbiAgICAgIHBhdGggPSBbZmllbGQuZGVmLmtleV0uY29uY2F0KHBhdGgpO1xuICAgIH1cbiAgICBpZiAoZmllbGQucGFyZW50KSB7XG4gICAgICByZXR1cm4gZmllbGQucGFyZW50LnZhbHVlUGF0aChwYXRoKTtcbiAgICB9XG4gICAgcmV0dXJuIHBhdGg7XG4gIH07XG5cbiAgLy8gU2V0IHRoZSB2YWx1ZSBmb3IgdGhpcyBmaWVsZC5cbiAgcHJvdG8udmFsID0gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgdmFyIGZpZWxkID0gdGhpcztcblxuICAgIGZpZWxkLmZvcm0uYWN0aW9ucy5zZXRWYWx1ZShmaWVsZC52YWx1ZVBhdGgoKSwgdmFsdWUpO1xuICB9O1xuXG4gIC8vIFJlbW92ZSBhIGNoaWxkIHZhbHVlIGZyb20gdGhpcyBmaWVsZC5cbiAgcHJvdG8ucmVtb3ZlID0gZnVuY3Rpb24gKGtleSkge1xuICAgIHZhciBmaWVsZCA9IHRoaXM7XG5cbiAgICB2YXIgcGF0aCA9IGZpZWxkLnZhbHVlUGF0aCgpLmNvbmNhdChrZXkpO1xuXG4gICAgZmllbGQuZm9ybS5hY3Rpb25zLnJlbW92ZVZhbHVlKHBhdGgpO1xuICB9O1xuXG4gIC8vIE1vdmUgYSBjaGlsZCB2YWx1ZSBmcm9tIG9uZSBrZXkgdG8gYW5vdGhlci5cbiAgcHJvdG8ubW92ZSA9IGZ1bmN0aW9uIChmcm9tS2V5LCB0b0tleSkge1xuICAgIHZhciBmaWVsZCA9IHRoaXM7XG5cbiAgICBmaWVsZC5mb3JtLmFjdGlvbnMubW92ZVZhbHVlKGZpZWxkLnZhbHVlUGF0aCgpLCBmcm9tS2V5LCB0b0tleSk7XG4gIH07XG5cbiAgLy8gR2V0IHRoZSBkZWZhdWx0IHZhbHVlIGZvciB0aGlzIGZpZWxkLlxuICBwcm90by5kZWZhdWx0ID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciBmaWVsZCA9IHRoaXM7XG5cbiAgICBpZiAoIV8uaXNVbmRlZmluZWQoZmllbGQuZGVmLnZhbHVlKSkge1xuICAgICAgcmV0dXJuIHV0aWwuY29weVZhbHVlKGZpZWxkLmRlZi52YWx1ZSk7XG4gICAgfVxuXG4gICAgaWYgKCFfLmlzVW5kZWZpbmVkKGZpZWxkLmRlZi5kZWZhdWx0KSkge1xuICAgICAgcmV0dXJuIHV0aWwuY29weVZhbHVlKGZpZWxkLmRlZi5kZWZhdWx0KTtcbiAgICB9XG5cbiAgICBpZiAoIV8uaXNVbmRlZmluZWQoZmllbGQudHlwZVBsdWdpbigpLmRlZmF1bHQpKSB7XG4gICAgICByZXR1cm4gdXRpbC5jb3B5VmFsdWUoZmllbGQudHlwZVBsdWdpbigpLmRlZmF1bHQpO1xuICAgIH1cblxuICAgIHJldHVybiBudWxsO1xuICB9O1xuXG4gIC8vIEFwcGVuZCBhIG5ldyB2YWx1ZS4gVXNlIHRoZSBgaXRlbUluZGV4YCB0byBnZXQgYW4gYXBwcm9wcmlhdGVcbiAgLy8gaXRlbSwgaW5mbGF0ZSBpdCwgYW5kIGNyZWF0ZSBhIGRlZmF1bHQgdmFsdWUuXG4gIHByb3RvLmFwcGVuZCA9IGZ1bmN0aW9uIChpdGVtSW5kZXgpIHtcbiAgICB2YXIgZmllbGQgPSB0aGlzO1xuXG4gICAgdmFyIGl0ZW0gPSBmaWVsZC5pdGVtcygpW2l0ZW1JbmRleF07XG4gICAgaXRlbSA9IF8uZXh0ZW5kKGl0ZW0pO1xuXG4gICAgaXRlbS5rZXkgPSBmaWVsZC52YWx1ZS5sZW5ndGg7XG5cbiAgICB2YXIgY2hpbGQgPSBmaWVsZC5jcmVhdGVDaGlsZChpdGVtKTtcblxuICAgIHZhciBvYmogPSBjaGlsZC5kZWZhdWx0KCk7XG5cbiAgICBpZiAoXy5pc0FycmF5KG9iaikgfHwgXy5pc09iamVjdChvYmopKSB7XG4gICAgICB2YXIgY2hvcCA9IGZpZWxkLnZhbHVlUGF0aCgpLmxlbmd0aCArIDE7XG5cbiAgICAgIGNoaWxkLmluZmxhdGUoZnVuY3Rpb24gKHBhdGgsIHZhbHVlKSB7XG4gICAgICAgIG9iaiA9IHV0aWwuc2V0SW4ob2JqLCBwYXRoLnNsaWNlKGNob3ApLCB2YWx1ZSk7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBmaWVsZC5mb3JtLmFjdGlvbnMuYXBwZW5kVmFsdWUoZmllbGQudmFsdWVQYXRoKCksIG9iaik7XG4gIH07XG5cbiAgLy8gRGV0ZXJtaW5lIHdoZXRoZXIgdGhlIGZpZWxkIGlzIGhpZGRlbi5cbiAgcHJvdG8uaGlkZGVuID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciBmaWVsZCA9IHRoaXM7XG5cbiAgICByZXR1cm4gZmllbGQuZGVmLmhpZGRlbiB8fCBmaWVsZC50eXBlUGx1Z2luKCkuaGlkZGVuO1xuICB9O1xuXG4gIC8vIEV4cGFuZCBhbGwgY2hpbGQgZmllbGRzIGFuZCBjYWxsIHRoZSBzZXR0ZXIgZnVuY3Rpb24gd2l0aCB0aGUgZGVmYXVsdFxuICAvLyB2YWx1ZXMgYXQgZWFjaCBwYXRoLlxuICBwcm90by5pbmZsYXRlID0gZnVuY3Rpb24gKG9uU2V0VmFsdWUpIHtcbiAgICB2YXIgZmllbGQgPSB0aGlzO1xuXG4gICAgaWYgKCF1dGlsLmlzQmxhbmsoZmllbGQuZGVmLmtleSkgJiYgXy5pc1VuZGVmaW5lZChmaWVsZC52YWx1ZSkpIHtcbiAgICAgIG9uU2V0VmFsdWUoZmllbGQudmFsdWVQYXRoKCksIGZpZWxkLmRlZmF1bHQoKSk7XG4gICAgfVxuXG4gICAgdmFyIGZpZWxkcyA9IGZpZWxkLmZpZWxkcygpO1xuXG4gICAgZmllbGRzLmZvckVhY2goZnVuY3Rpb24gKGNoaWxkKSB7XG4gICAgICBjaGlsZC5pbmZsYXRlKG9uU2V0VmFsdWUpO1xuICAgIH0pO1xuICB9O1xuXG4gIC8vIENhbGxlZCBmcm9tIHVubW91bnQuIFdoZW4gZmllbGRzIGFyZSByZW1vdmVkIGZvciB3aGF0ZXZlciByZWFzb24sIHdlXG4gIC8vIHNob3VsZCBkZWxldGUgdGhlIGNvcnJlc3BvbmRpbmcgdmFsdWUuXG4gIHByb3RvLmVyYXNlID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciBmaWVsZCA9IHRoaXM7XG4gICAgaWYgKCF1dGlsLmlzQmxhbmsoZmllbGQuZGVmLmtleSkgJiYgIV8uaXNVbmRlZmluZWQoZmllbGQudmFsdWUpKSB7XG4gICAgICBmaWVsZC5mb3JtLmFjdGlvbnMuZXJhc2VWYWx1ZShmaWVsZC52YWx1ZVBhdGgoKSwge30pO1xuICAgIH1cbiAgfTtcbn07XG5cbn0pLmNhbGwodGhpcyx0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsIDogdHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDogdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9KSIsIi8vICMgY29yZS5mb3JtLWluaXRcblxuLypcblRoaXMgcGx1Z2luIG1ha2VzIGl0IGVhc3kgdG8gaG9vayBpbnRvIGZvcm0gaW5pdGlhbGl6YXRpb24sIHdpdGhvdXQgaGF2aW5nIHRvXG5jb25maWd1cmUgYWxsIHRoZSBvdGhlciBjb3JlIHBsdWdpbnMuXG4qL1xuXG4ndXNlIHN0cmljdCc7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKHBsdWdpbikge1xuXG4gIHZhciBpbml0UGx1Z2lucyA9IHBsdWdpbi5yZXF1aXJlQWxsKHBsdWdpbi5jb25maWcuaW5pdCk7XG5cbiAgdmFyIHByb3RvID0gcGx1Z2luLmV4cG9ydHM7XG5cbiAgcHJvdG8uaW5pdCA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgZm9ybSA9IHRoaXM7XG5cbiAgICBpbml0UGx1Z2lucy5mb3JFYWNoKGZ1bmN0aW9uIChwbHVnaW4pIHtcbiAgICAgIHBsdWdpbi5hcHBseShmb3JtLCBhcmd1bWVudHMpO1xuICAgIH0pO1xuICB9O1xufTtcbiIsIihmdW5jdGlvbiAoZ2xvYmFsKXtcbi8vICMgY29yZS5mb3JtXG5cbi8qXG5UaGUgY29yZSBmb3JtIHBsdWdpbiBzdXBwbGllcyBtZXRob2RzIHRoYXQgZ2V0IGFkZGVkIHRvIHRoZSBGb3JtIHByb3RvdHlwZS5cbiovXG5cbid1c2Ugc3RyaWN0JztcblxudmFyIF8gPSAodHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdy5fIDogdHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbC5fIDogbnVsbCk7XG52YXIgRXZlbnRFbWl0dGVyID0gcmVxdWlyZSgnZXZlbnRlbWl0dGVyMycpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChwbHVnaW4pIHtcblxuICB2YXIgcHJvdG8gPSBwbHVnaW4uZXhwb3J0cztcblxuICAvLyBHZXQgdGhlIHN0b3JlIHBsdWdpbi5cbiAgdmFyIGNyZWF0ZVN0b3JlID0gcGx1Z2luLnJlcXVpcmUocGx1Z2luLmNvbmZpZy5zdG9yZSk7XG5cbiAgdmFyIHV0aWwgPSBwbHVnaW4ucmVxdWlyZSgndXRpbCcpO1xuICB2YXIgbG9hZGVyID0gcGx1Z2luLnJlcXVpcmUoJ2xvYWRlcicpO1xuXG4gIC8vIEhlbHBlciB0byBjcmVhdGUgYWN0aW9ucywgd2hpY2ggd2lsbCB0ZWxsIHRoZSBzdG9yZSB0aGF0IHNvbWV0aGluZyBoYXNcbiAgLy8gaGFwcGVuZWQuIE5vdGUgdGhhdCBhY3Rpb25zIGdvIHN0cmFpZ2h0IHRvIHRoZSBzdG9yZS4gTm8gZXZlbnRzLFxuICAvLyBkaXNwYXRjaGVyLCBldGMuXG4gIHZhciBjcmVhdGVTeW5jQWN0aW9ucyA9IGZ1bmN0aW9uIChzdG9yZSwgbmFtZXMpIHtcbiAgICB2YXIgYWN0aW9ucyA9IHt9O1xuICAgIG5hbWVzLmZvckVhY2goZnVuY3Rpb24gKG5hbWUpIHtcbiAgICAgIGFjdGlvbnNbbmFtZV0gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHN0b3JlW25hbWVdLmFwcGx5KHN0b3JlLCBhcmd1bWVudHMpO1xuICAgICAgfTtcbiAgICB9KTtcbiAgICByZXR1cm4gYWN0aW9ucztcbiAgfTtcblxuICAvLyBJbml0aWFsaXplIHRoZSBmb3JtIGluc3RhbmNlLlxuICBwcm90by5pbml0ID0gZnVuY3Rpb24gKG9wdGlvbnMpIHtcbiAgICB2YXIgZm9ybSA9IHRoaXM7XG5cbiAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcblxuICAgIC8vIE5lZWQgYW4gZW1pdHRlciB0byBlbWl0IGNoYW5nZSBldmVudHMgZnJvbSB0aGUgc3RvcmUuXG4gICAgdmFyIHN0b3JlRW1pdHRlciA9IG5ldyBFdmVudEVtaXR0ZXIoKTtcblxuICAgIC8vIENyZWF0ZSBhIHN0b3JlLlxuICAgIGZvcm0uc3RvcmUgPSBjcmVhdGVTdG9yZShmb3JtLCBzdG9yZUVtaXR0ZXIsIG9wdGlvbnMpO1xuXG4gICAgLy8gQ3JlYXRlIHRoZSBhY3Rpb25zIHRvIG5vdGlmeSB0aGUgc3RvcmUgb2YgY2hhbmdlcy5cbiAgICBmb3JtLmFjdGlvbnMgPSBjcmVhdGVTeW5jQWN0aW9ucyhmb3JtLnN0b3JlLCBbJ3NldFZhbHVlJywgJ3NldEZpZWxkcycsICdyZW1vdmVWYWx1ZScsICdhcHBlbmRWYWx1ZScsICdtb3ZlVmFsdWUnLCAnZXJhc2VWYWx1ZScsICdzZXRNZXRhJ10pO1xuXG4gICAgLy8gU2VlZCB0aGUgdmFsdWUgZnJvbSBhbnkgZmllbGRzLlxuICAgIGZvcm0uc3RvcmUuaW5mbGF0ZSgpO1xuXG4gICAgLy8gQWRkIG9uL29mZiB0byBnZXQgY2hhbmdlIGV2ZW50cyBmcm9tIGZvcm0uXG4gICAgZm9ybS5vbiA9IHN0b3JlRW1pdHRlci5vbi5iaW5kKHN0b3JlRW1pdHRlcik7XG4gICAgZm9ybS5vZmYgPSBzdG9yZUVtaXR0ZXIub2ZmLmJpbmQoc3RvcmVFbWl0dGVyKTtcbiAgICBmb3JtLm9uY2UgPSBzdG9yZUVtaXR0ZXIub25jZS5iaW5kKHN0b3JlRW1pdHRlcik7XG4gIH07XG5cbiAgLy8gR2V0IG9yIHNldCB0aGUgdmFsdWUgb2YgYSBmb3JtLlxuICBwcm90by52YWwgPSBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICB2YXIgZm9ybSA9IHRoaXM7XG5cbiAgICBpZiAoIV8uaXNVbmRlZmluZWQodmFsdWUpKSB7XG4gICAgICByZXR1cm4gZm9ybS5hY3Rpb25zLnNldFZhbHVlKHZhbHVlKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdXRpbC5jb3B5VmFsdWUoZm9ybS5zdG9yZS52YWx1ZSk7XG4gIH07XG5cbiAgLy8gU2V0L2NoYW5nZSB0aGUgZmllbGRzIGZvciBhIGZvcm0uXG4gIHByb3RvLmZpZWxkcyA9IGZ1bmN0aW9uIChmaWVsZHMpIHtcbiAgICB2YXIgZm9ybSA9IHRoaXM7XG5cbiAgICBmb3JtLmFjdGlvbnMuc2V0RmllbGRzKGZpZWxkcyk7XG4gIH07XG5cbiAgLy8gRmluZCBhIGZpZWxkIHRlbXBsYXRlIGdpdmVuIGEga2V5LlxuICBwcm90by5maW5kRGVmID0gZnVuY3Rpb24gKGtleSkge1xuICAgIHZhciBmb3JtID0gdGhpcztcblxuICAgIHJldHVybiBmb3JtLnN0b3JlLnRlbXBsYXRlTWFwW2tleV0gfHwgbnVsbDtcbiAgfTtcblxuICAvLyBHZXQgb3Igc2V0IG1ldGFkYXRhLlxuICBwcm90by5tZXRhID0gZnVuY3Rpb24gKGtleSwgdmFsdWUpIHtcbiAgICB2YXIgZm9ybSA9IHRoaXM7XG5cbiAgICBpZiAoIV8uaXNVbmRlZmluZWQodmFsdWUpKSB7XG4gICAgICByZXR1cm4gZm9ybS5hY3Rpb25zLnNldE1ldGEoa2V5LCB2YWx1ZSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGZvcm0uc3RvcmUubWV0YVtrZXldO1xuICB9O1xuXG4gIC8vIExvYWQgbWV0YWRhdGEuXG4gIHByb3RvLmxvYWRNZXRhID0gZnVuY3Rpb24gKHNvdXJjZSwgcGFyYW1zKSB7XG4gICAgcGFyYW1zID0gcGFyYW1zIHx8IHt9O1xuICAgIHZhciBrZXlzID0gT2JqZWN0LmtleXMocGFyYW1zKTtcbiAgICB2YXIgdmFsaWRLZXlzID0ga2V5cy5maWx0ZXIoZnVuY3Rpb24gKGtleSkge1xuICAgICAgcmV0dXJuIHBhcmFtc1trZXldO1xuICAgIH0pO1xuICAgIGlmICh2YWxpZEtleXMubGVuZ3RoIDwga2V5cy5sZW5ndGgpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgbG9hZGVyLmxvYWRNZXRhKHRoaXMsIHNvdXJjZSwgcGFyYW1zKTtcbiAgfTtcblxuICAvLyBBZGQgYSBtZXRkYXRhIHNvdXJjZSBmdW5jdGlvbiwgdmlhIHRoZSBsb2FkZXIgcGx1Z2luLlxuICBwcm90by5zb3VyY2UgPSBsb2FkZXIuc291cmNlO1xufTtcblxufSkuY2FsbCh0aGlzLHR5cGVvZiBnbG9iYWwgIT09IFwidW5kZWZpbmVkXCIgPyBnbG9iYWwgOiB0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOiB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge30pIiwiKGZ1bmN0aW9uIChnbG9iYWwpe1xuLy8gIyBjb3JlLmZvcm1hdGljXG5cbi8qXG5UaGUgY29yZSBmb3JtYXRpYyBwbHVnaW4gYWRkcyBtZXRob2RzIHRvIHRoZSBmb3JtYXRpYyBpbnN0YW5jZS5cbiovXG5cbid1c2Ugc3RyaWN0JztcblxudmFyIFJlYWN0ID0gKHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cuUmVhY3QgOiB0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsLlJlYWN0IDogbnVsbCk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKHBsdWdpbikge1xuXG4gIHZhciBmID0gcGx1Z2luLmV4cG9ydHM7XG5cbiAgLy8gVXNlIHRoZSBmaWVsZC1yb3V0ZXIgcGx1Z2luIGFzIHRoZSByb3V0ZXIuXG4gIHZhciByb3V0ZXIgPSBwbHVnaW4ucmVxdWlyZSgnZmllbGQtcm91dGVyJyk7XG5cbiAgLy8gUm91dGUgYSBmaWVsZCB0byBhIGNvbXBvbmVudC5cbiAgZi5yb3V0ZSA9IHJvdXRlci5yb3V0ZTtcblxuICAvLyBSZW5kZXIgYSBjb21wb25lbnQgdG8gYSBub2RlLlxuICBmLnJlbmRlciA9IGZ1bmN0aW9uIChjb21wb25lbnQsIG5vZGUpIHtcblxuICAgIFJlYWN0LnJlbmRlckNvbXBvbmVudChjb21wb25lbnQsIG5vZGUpO1xuICB9O1xufTtcblxufSkuY2FsbCh0aGlzLHR5cGVvZiBnbG9iYWwgIT09IFwidW5kZWZpbmVkXCIgPyBnbG9iYWwgOiB0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOiB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge30pIiwiKGZ1bmN0aW9uIChnbG9iYWwpe1xuLy8gIyBjb21waWxlclxuXG4vLyBUaGUgY29tcGlsZXIgcGx1Z2luIGtub3dzIGhvdyB0byBub3JtYWxpemUgZmllbGQgZGVmaW5pdGlvbnMgaW50byBzdGFuZGFyZFxuLy8gZmllbGQgZGVmaW5pdGlvbnMgdGhhdCBjYW4gYmUgdW5kZXJzdG9vZCBiZSByb3V0ZXJzIGFuZCBjb21wb25lbnRzLlxuXG4ndXNlIHN0cmljdCc7XG5cbnZhciBfID0gKHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cuXyA6IHR5cGVvZiBnbG9iYWwgIT09IFwidW5kZWZpbmVkXCIgPyBnbG9iYWwuXyA6IG51bGwpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChwbHVnaW4pIHtcblxuICAvLyBHcmFiIGFsbCB0aGUgY29tcGlsZXIgcGx1Z2lucyB3aGljaCBjYW4gYmUgc3RhY2tlZC5cbiAgdmFyIGNvbXBpbGVyUGx1Z2lucyA9IHBsdWdpbi5yZXF1aXJlQWxsKHBsdWdpbi5jb25maWcuY29tcGlsZXJzKTtcblxuICB2YXIgdXRpbCA9IHBsdWdpbi5yZXF1aXJlKCd1dGlsJyk7XG5cbiAgdmFyIGNvbXBpbGVyID0gcGx1Z2luLmV4cG9ydHM7XG5cbiAgLy8gRm9yIGEgc2V0IG9mIGZpZWxkcywgbWFrZSBhIG1hcCBvZiB0ZW1wbGF0ZSBuYW1lcyB0byBmaWVsZCBkZWZpbml0aW9ucy4gQWxsXG4gIC8vIGZpZWxkIGRlZmluaXRpb25zIGNhbiBiZSB1c2VkIGFzIHRlbXBsYXRlcywgd2hldGhlciBtYXJrZWQgYXMgdGVtcGxhdGVzIG9yXG4gIC8vIG5vdC5cbiAgY29tcGlsZXIudGVtcGxhdGVNYXAgPSBmdW5jdGlvbiAoZmllbGRzKSB7XG4gICAgdmFyIG1hcCA9IHt9O1xuICAgIGZpZWxkcy5mb3JFYWNoKGZ1bmN0aW9uIChmaWVsZCkge1xuICAgICAgaWYgKGZpZWxkLmtleSkge1xuICAgICAgICBtYXBbZmllbGQua2V5XSA9IGZpZWxkO1xuICAgICAgfVxuICAgICAgaWYgKGZpZWxkLmlkKSB7XG4gICAgICAgIG1hcFtmaWVsZC5pZF0gPSBmaWVsZDtcbiAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4gbWFwO1xuICB9O1xuXG4gIC8vIEZpZWxkcyBhbmQgaXRlbXMgY2FuIGV4dGVuZCBvdGhlciBmaWVsZCBkZWZpbml0aW9ucy4gRmllbGRzIGNhbiBhbHNvIGhhdmVcbiAgLy8gY2hpbGQgZmllbGRzIHRoYXQgcG9pbnQgdG8gb3RoZXIgZmllbGQgZGVmaW5pdGlvbnMuIEhlcmUsIHdlIGV4cGFuZCBhbGxcbiAgLy8gdGhvc2Ugb3V0IHNvIHRoYXQgY29tcG9uZW50cyBkb24ndCBoYXZlIHRvIHdvcnJ5IGFib3V0IHRoaXMuXG4gIGNvbXBpbGVyLmV4cGFuZERlZiA9IGZ1bmN0aW9uIChkZWYsIHRlbXBsYXRlTWFwKSB7XG4gICAgdmFyIGlzVGVtcGxhdGUgPSBkZWYudGVtcGxhdGU7XG4gICAgdmFyIGV4dCA9IGRlZi5leHRlbmRzO1xuICAgIGlmIChfLmlzU3RyaW5nKGV4dCkpIHtcbiAgICAgIGV4dCA9IFtleHRdO1xuICAgIH1cbiAgICBpZiAoZXh0KSB7XG4gICAgICB2YXIgYmFzZXMgPSBleHQubWFwKGZ1bmN0aW9uIChiYXNlKSB7XG4gICAgICAgIHZhciB0ZW1wbGF0ZSA9IHRlbXBsYXRlTWFwW2Jhc2VdO1xuICAgICAgICBpZiAoIXRlbXBsYXRlKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdUZW1wbGF0ZSAnICsgYmFzZSArICcgbm90IGZvdW5kLicpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0ZW1wbGF0ZTtcbiAgICAgIH0pO1xuICAgICAgdmFyIGNoYWluID0gW3t9XS5jb25jYXQoYmFzZXMucmV2ZXJzZSgpLmNvbmNhdChbZGVmXSkpO1xuICAgICAgZGVmID0gXy5leHRlbmQuYXBwbHkoXywgY2hhaW4pO1xuICAgIH1cbiAgICBpZiAoZGVmLmZpZWxkcykge1xuICAgICAgZGVmLmZpZWxkcyA9IGRlZi5maWVsZHMubWFwKGZ1bmN0aW9uIChjaGlsZERlZikge1xuICAgICAgICBpZiAoIV8uaXNTdHJpbmcoY2hpbGREZWYpKSB7XG4gICAgICAgICAgcmV0dXJuIGNvbXBpbGVyLmV4cGFuZERlZihjaGlsZERlZiwgdGVtcGxhdGVNYXApO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBjaGlsZERlZjtcbiAgICAgIH0pO1xuICAgIH1cbiAgICBpZiAoZGVmLml0ZW1zKSB7XG4gICAgICBkZWYuaXRlbXMgPSBkZWYuaXRlbXMubWFwKGZ1bmN0aW9uIChpdGVtRGVmKSB7XG4gICAgICAgIGlmICghXy5pc1N0cmluZyhpdGVtRGVmKSkge1xuICAgICAgICAgIHJldHVybiBjb21waWxlci5leHBhbmREZWYoaXRlbURlZiwgdGVtcGxhdGVNYXApO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBpdGVtRGVmO1xuICAgICAgfSk7XG4gICAgfVxuICAgIGlmICghaXNUZW1wbGF0ZSAmJiBkZWYudGVtcGxhdGUpIHtcbiAgICAgIGRlbGV0ZSBkZWYudGVtcGxhdGU7XG4gICAgfVxuICAgIHJldHVybiBkZWY7XG4gIH07XG5cbiAgLy8gRm9yIGFuIGFycmF5IG9mIGZpZWxkIGRlZmluaXRpb25zLCBleHBhbmQgZWFjaCBmaWVsZCBkZWZpbml0aW9uLlxuICBjb21waWxlci5leHBhbmRGaWVsZHMgPSBmdW5jdGlvbiAoZmllbGRzKSB7XG4gICAgdmFyIHRlbXBsYXRlTWFwID0gY29tcGlsZXIudGVtcGxhdGVNYXAoZmllbGRzKTtcbiAgICByZXR1cm4gZmllbGRzLm1hcChmdW5jdGlvbiAoZGVmKSB7XG4gICAgICByZXR1cm4gY29tcGlsZXIuZXhwYW5kRGVmKGRlZiwgdGVtcGxhdGVNYXApO1xuICAgIH0pO1xuICB9O1xuXG4gIC8vIFJ1biBhIGZpZWxkIGRlZmluaXRpb24gdGhyb3VnaCBhbGwgYXZhaWxhYmxlIGNvbXBpbGVycy5cbiAgY29tcGlsZXIuY29tcGlsZURlZiA9IGZ1bmN0aW9uIChkZWYpIHtcblxuICAgIC8vY29uc29sZS5sb2coJ2luOicsIEpTT04uc3RyaW5naWZ5KGRlZikpXG5cbiAgICBkZWYgPSB1dGlsLmRlZXBDb3B5KGRlZik7XG5cbiAgICB2YXIgcmVzdWx0O1xuICAgIGNvbXBpbGVyUGx1Z2lucy5mb3JFYWNoKGZ1bmN0aW9uIChwbHVnaW4pIHtcbiAgICAgIHJlc3VsdCA9IHBsdWdpbi5jb21waWxlKGRlZik7XG4gICAgICBpZiAocmVzdWx0KSB7XG4gICAgICAgIGRlZiA9IHJlc3VsdDtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIHZhciB0eXBlUGx1Z2luID0gcGx1Z2luLnJlcXVpcmUoJ3R5cGUuJyArIGRlZi50eXBlKTtcblxuICAgIGlmICh0eXBlUGx1Z2luLmNvbXBpbGUpIHtcbiAgICAgIHJlc3VsdCA9IHR5cGVQbHVnaW4uY29tcGlsZShkZWYpO1xuICAgICAgaWYgKHJlc3VsdCkge1xuICAgICAgICBkZWYgPSByZXN1bHQ7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKGRlZi5maWVsZHMpIHtcbiAgICAgIC8vIENvbXBpbGUgYW55IGlubGluZSBmaWVsZHMuXG4gICAgICBkZWYuZmllbGRzID0gZGVmLmZpZWxkcy5tYXAoZnVuY3Rpb24gKGNoaWxkRGVmKSB7XG4gICAgICAgIGlmIChfLmlzT2JqZWN0KGNoaWxkRGVmKSkge1xuICAgICAgICAgIHJldHVybiBjb21waWxlci5jb21waWxlRGVmKGNoaWxkRGVmKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gY2hpbGREZWY7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICAvL2NvbnNvbGUubG9nKCdvdXQ6JywgSlNPTi5zdHJpbmdpZnkoZGVmKSlcblxuICAgIHJldHVybiBkZWY7XG4gIH07XG5cbiAgLy8gRm9yIGFuIGFycmF5IG9mIGZpZWxkIGRlZmluaXRpb25zLCBjb21waWxlIGVhY2ggZmllbGQgZGVmaW5pdGlvbi5cbiAgY29tcGlsZXIuY29tcGlsZUZpZWxkcyA9IGZ1bmN0aW9uIChmaWVsZHMpIHtcbiAgICByZXR1cm4gZmllbGRzLm1hcChmdW5jdGlvbiAoZmllbGQpIHtcbiAgICAgIHJldHVybiBjb21waWxlci5jb21waWxlRGVmKGZpZWxkKTtcbiAgICB9KTtcbiAgfTtcbn07XG5cbn0pLmNhbGwodGhpcyx0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsIDogdHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDogdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9KSIsIihmdW5jdGlvbiAoZ2xvYmFsKXtcbi8vICMgY29tcG9uZW50XG5cbi8vIEF0IGl0cyBtb3N0IGJhc2ljIGxldmVsLCB0aGUgY29tcG9uZW50IHBsdWdpbiBzaW1wbHkgbWFwcyBjb21wb25lbnQgbmFtZXMgdG9cbi8vIHBsdWdpbiBuYW1lcywgcmV0dXJuaW5nIHRoZSBjb21wb25lbnQgZmFjdG9yeSBmb3IgdGhhdCBjb21wb25lbnQuIEZvclxuLy8gZXhhbXBsZSwgYHBsdWdpbi5jb21wb25lbnQoJ3RleHQnKWAgYmVjb21lc1xuLy8gYHBsdWdpbi5yZXF1aXJlKCdjb21wb25lbnQudGV4dCcpYC4gVGhpcyBpcyBhIHVzZWZ1bCBwbGFjaG9sZGVyIGluIGNhc2Ugd2Vcbi8vIGxhdGVyIHdhbnQgdG8gbWFrZSBmb3JtYXRpYyBhYmxlIHRvIGRlY2lkZSBjb21wb25lbnRzIGF0IHJ1bnRpbWUuIEZvciBub3csXG4vLyBob3dldmVyLCB0aGlzIGFsbG93cyB1cyB0byBpbmplY3QgXCJwcm9wIG1vZGlmaWVyc1wiIHdoaWNoIGFyZSBwbHVnaW5zIHRoYXRcbi8vIG1vZGlmeSBhIGNvbXBvbmVudHMgcHJvcGVydGllcyBiZWZvcmUgaXQgcmVjZWl2ZXMgdGhlbS5cblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgUmVhY3QgPSAodHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdy5SZWFjdCA6IHR5cGVvZiBnbG9iYWwgIT09IFwidW5kZWZpbmVkXCIgPyBnbG9iYWwuUmVhY3QgOiBudWxsKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAocGx1Z2luKSB7XG5cbiAgLy8gUmVnaXN0cnkgZm9yIHByb3AgbW9kaWZpZXJzLlxuICB2YXIgcHJvcE1vZGlmaWVycyA9IHt9O1xuXG4gIC8vIEFkZCBhIFwicHJvcCBtb2RpZmVyXCIgd2hpY2ggaXMganVzdCBhIGZ1bmN0aW9uIHRoYXQgbW9kaWZpZXMgYSBjb21wb25lbnRzXG4gIC8vIHByb3BlcnRpZXMgYmVmb3JlIGl0IHJlY2VpdmVzIHRoZW0uXG4gIHZhciBhZGRQcm9wTW9kaWZpZXIgPSBmdW5jdGlvbiAobmFtZSwgbW9kaWZ5Rm4pIHtcbiAgICBpZiAoIXByb3BNb2RpZmllcnNbbmFtZV0pIHtcbiAgICAgIHByb3BNb2RpZmllcnNbbmFtZV0gPSBbXTtcbiAgICB9XG4gICAgcHJvcE1vZGlmaWVyc1tuYW1lXS5wdXNoKG1vZGlmeUZuKTtcbiAgfTtcblxuICAvLyBHcmFiIGFsbCB0aGUgcHJvcCBtb2RpZmllciBwbHVnaW5zLlxuICB2YXIgcHJvcHNQbHVnaW5zID0gcGx1Z2luLnJlcXVpcmVBbGwocGx1Z2luLmNvbmZpZy5wcm9wcyk7XG5cbiAgLy8gUmVnaXN0ZXIgYWxsIHRoZSBwcm9wIG1vZGlmaWVyIHBsdWdpbnMuXG4gIHByb3BzUGx1Z2lucy5mb3JFYWNoKGZ1bmN0aW9uIChwbHVnaW4pIHtcbiAgICBhZGRQcm9wTW9kaWZpZXIuYXBwbHkobnVsbCwgcGx1Z2luKTtcbiAgfSk7XG5cbiAgLy8gUmVnaXN0cnkgZm9yIGNvbXBvbmVudCBmYWN0b3JpZXMuIFNpbmNlIHdlJ2xsIGJlIG1vZGlmeWluZyB0aGUgcHJvcHMgZ29pbmdcbiAgLy8gdG8gdGhlIGZhY3Rvcmllcywgd2UnbGwgc3RvcmUgb3VyIG93biBjb21wb25lbnQgZmFjdG9yaWVzIGhlcmUuXG4gIHZhciBjb21wb25lbnRGYWN0b3JpZXMgPSB7fTtcblxuICAvLyBSZXRyaWV2ZSB0aGUgYXBwcm9wcmlhdGUgY29tcG9uZW50IGZhY3RvcnksIHdoaWNoIG1heSBiZSBhIHdyYXBwZXIgdGhhdFxuICAvLyBydW5zIHRoZSBjb21wb25lbnQgcHJvcGVydGllcyB0aHJvdWdoIHByb3AgbW9kaWZpZXIgZnVuY3Rpb25zLlxuICBwbHVnaW4uZXhwb3J0cy5jb21wb25lbnQgPSBmdW5jdGlvbiAobmFtZSkge1xuXG4gICAgaWYgKCFjb21wb25lbnRGYWN0b3JpZXNbbmFtZV0pIHtcbiAgICAgIHZhciBjb21wb25lbnQgPSBSZWFjdC5jcmVhdGVGYWN0b3J5KHBsdWdpbi5yZXF1aXJlKCdjb21wb25lbnQuJyArIG5hbWUpKTtcbiAgICAgIGNvbXBvbmVudEZhY3Rvcmllc1tuYW1lXSA9IGZ1bmN0aW9uIChwcm9wcywgY2hpbGRyZW4pIHtcbiAgICAgICAgaWYgKHByb3BNb2RpZmllcnNbbmFtZV0pIHtcbiAgICAgICAgICBwcm9wTW9kaWZpZXJzW25hbWVdLmZvckVhY2goZnVuY3Rpb24gKG1vZGlmeSkge1xuICAgICAgICAgICAgdmFyIHJlc3VsdCA9IG1vZGlmeShwcm9wcyk7XG4gICAgICAgICAgICBpZiAocmVzdWx0KSB7XG4gICAgICAgICAgICAgIHByb3BzID0gcmVzdWx0O1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBjb21wb25lbnQocHJvcHMsIGNoaWxkcmVuKTtcbiAgICAgIH07XG4gICAgfVxuICAgIHJldHVybiBjb21wb25lbnRGYWN0b3JpZXNbbmFtZV07XG4gIH07XG59O1xuXG59KS5jYWxsKHRoaXMsdHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbCA6IHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiID8gc2VsZiA6IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB7fSkiLCIoZnVuY3Rpb24gKGdsb2JhbCl7XG4vLyAjIGNvcmVcblxuLy8gVGhlIGNvcmUgcGx1Z2luIGV4cG9ydHMgYSBmdW5jdGlvbiB0aGF0IHRha2VzIGEgZm9ybWF0aWMgaW5zdGFuY2UgYW5kXG4vLyBleHRlbmRzIHRoZSBpbnN0YW5jZSB3aXRoIGFkZGl0aW9uYWwgbWV0aG9kcy5cblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgXyA9ICh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93Ll8gOiB0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsLl8gOiBudWxsKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAocGx1Z2luKSB7XG5cbiAgcGx1Z2luLmV4cG9ydHMgPSBmdW5jdGlvbiAoZm9ybWF0aWMpIHtcblxuICAgIC8vIFRoZSBjb3JlIHBsdWdpbiByZWFsbHkgZG9lc24ndCBkbyBtdWNoLiBJdCBhY3R1YWxseSByZWxpZXMgb24gb3RoZXJcbiAgICAvLyBwbHVnaW5zIHRvIGRvIHRoZSBkaXJ0eSB3b3JrLiBUaGlzIHdheSwgeW91IGNhbiBlYXNpbHkgYWRkIGFkZGl0aW9uYWxcbiAgICAvLyBwbHVnaW5zIHRvIGRvIG1vcmUgZGlydHkgd29yay5cbiAgICB2YXIgZm9ybWF0aWNQbHVnaW5zID0gcGx1Z2luLnJlcXVpcmVBbGwocGx1Z2luLmNvbmZpZy5mb3JtYXRpYyk7XG5cbiAgICAvLyBXZSBoYXZlIHNwZWNpYWwgZm9ybSBwbHVnaW5zIHdoaWNoIGFyZSBqdXN0IHVzZWQgdG8gbW9kaWZ5IHRoZSBGb3JtXG4gICAgLy8gcHJvdG90eXBlLlxuICAgIHZhciBmb3JtUGx1Z2lucyA9IHBsdWdpbi5yZXF1aXJlQWxsKHBsdWdpbi5jb25maWcuZm9ybSk7XG5cbiAgICAvLyBQYXNzIHRoZSBmb3JtYXRpYyBpbnN0YW5jZSBvZmYgdG8gZWFjaCBvZiB0aGUgZm9ybWF0aWMgcGx1Z2lucy5cbiAgICBmb3JtYXRpY1BsdWdpbnMuZm9yRWFjaChmdW5jdGlvbiAoZikge1xuICAgICAgXy5rZXlzKGYpLmZvckVhY2goZnVuY3Rpb24gKGtleSkge1xuICAgICAgICBpZiAoIV8uaXNVbmRlZmluZWQoZm9ybWF0aWNba2V5XSkpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1Byb3BlcnR5IGFscmVhZHkgZGVmaW5lZCBmb3IgZm9ybWF0aWM6ICcgKyBrZXkpO1xuICAgICAgICB9XG4gICAgICAgIGZvcm1hdGljW2tleV0gPSBmW2tleV07XG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIC8vICMjIEZvcm0gcHJvdG90eXBlXG5cbiAgICAvLyBUaGUgRm9ybSBjb25zdHJ1Y3RvciBjcmVhdGVzIGEgZm9ybSBnaXZlbiBhIHNldCBvZiBvcHRpb25zLiBPcHRpb25zXG4gICAgLy8gY2FuIGhhdmUgYGZpZWxkc2AgYW5kIGB2YWx1ZWAuXG4gICAgdmFyIEZvcm0gPSBmdW5jdGlvbiAob3B0aW9ucykge1xuICAgICAgaWYgKHRoaXMuaW5pdCkge1xuICAgICAgICB0aGlzLmluaXQob3B0aW9ucyk7XG4gICAgICB9XG4gICAgfTtcblxuICAgIC8vIEFkZCB0aGUgZm9ybSBmYWN0b3J5IHRvIHRoZSBmb3JtYXRpYyBpbnN0YW5jZS5cbiAgICBmb3JtYXRpYy5mb3JtID0gZnVuY3Rpb24gKG9wdGlvbnMpIHtcbiAgICAgIHJldHVybiBuZXcgRm9ybShvcHRpb25zKTtcbiAgICB9O1xuXG4gICAgRm9ybS5wcm90b3R5cGUgPSBmb3JtYXRpYy5mb3JtO1xuXG4gICAgLy8gS2VlcCBmb3JtIGluaXQgbWV0aG9kcyBoZXJlLlxuICAgIHZhciBpbml0cyA9IFtdO1xuXG4gICAgLy8gR28gdGhyb3VnaCBmb3JtIHBsdWdpbnMgYW5kIGFkZCBlYWNoIHBsdWdpbidzIG1ldGhvZHMgdG8gdGhlIGZvcm1cbiAgICAvLyBwcm90b3R5cGUuXG4gICAgZm9ybVBsdWdpbnMuZm9yRWFjaChmdW5jdGlvbiAocHJvdG8pIHtcbiAgICAgIF8ua2V5cyhwcm90bykuZm9yRWFjaChmdW5jdGlvbiAoa2V5KSB7XG4gICAgICAgIC8vIEluaXQgcGx1Z2lucyBjYW4gYmUgc3RhY2tlZC5cbiAgICAgICAgaWYgKGtleSA9PT0gJ2luaXQnKSB7XG4gICAgICAgICAgaW5pdHMucHVzaChwcm90b1trZXldKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBpZiAoIV8uaXNVbmRlZmluZWQoRm9ybS5wcm90b3R5cGVba2V5XSkpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignUHJvcGVydHkgYWxyZWFkeSBkZWZpbmVkIGZvciBmb3JtOiAnICsga2V5KTtcbiAgICAgICAgICB9XG4gICAgICAgICAgRm9ybS5wcm90b3R5cGVba2V5XSA9IHByb3RvW2tleV07XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgLy8gQ3JlYXRlIGFuIGluaXQgbWV0aG9kIGZvciB0aGUgZm9ybSBwcm90b3R5cGUgYmFzZWQgb24gdGhlIGF2YWlsYWJsZSBpbml0XG4gICAgLy8gbWV0aG9kcy5cbiAgICBpZiAoaW5pdHMubGVuZ3RoID09PSAwKSB7XG4gICAgICBGb3JtLnByb3RvdHlwZS5pbml0ID0gZnVuY3Rpb24gKCkge307XG4gICAgfSBlbHNlIGlmIChpbml0cy5sZW5ndGggPT09IDEpIHtcbiAgICAgIEZvcm0ucHJvdG90eXBlLmluaXQgPSBpbml0c1swXTtcbiAgICB9IGVsc2Uge1xuICAgICAgRm9ybS5wcm90b3R5cGUuaW5pdCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIGZvcm0gPSB0aGlzO1xuICAgICAgICB2YXIgYXJncyA9IGFyZ3VtZW50cztcblxuICAgICAgICBpbml0cy5mb3JFYWNoKGZ1bmN0aW9uIChpbml0KSB7XG4gICAgICAgICAgaW5pdC5hcHBseShmb3JtLCBhcmdzKTtcbiAgICAgICAgfSk7XG4gICAgICB9O1xuICAgIH1cbiAgfTtcbn07XG5cbn0pLmNhbGwodGhpcyx0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsIDogdHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDogdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9KSIsIihmdW5jdGlvbiAoZ2xvYmFsKXtcbi8vICMgZXZhbC1mdW5jdGlvbnNcblxuLypcbkRlZmF1bHQgZXZhbCBmdW5jdGlvbnMuIEVhY2ggZnVuY3Rpb24gaXMgcGFydCBvZiBpdHMgb3duIHBsdWdpbiwgYnV0IGFsbCBhcmVcbmtlcHQgdG9nZXRoZXIgaGVyZSBhcyBwYXJ0IG9mIGEgcGx1Z2luIGJ1bmRsZS5cblxuTm90ZSB0aGF0IGV2YWwgZnVuY3Rpb25zIGRlY2lkZSB3aGVuIHRoZWlyIGFyZ3VtZW50cyBnZXQgZXZhbHVhdGVkLiBUaGlzIHdheSxcbnlvdSBjYW4gY3JlYXRlIGNvbnRyb2wgc3RydWN0dXJlcyAobGlrZSBpZikgdGhhdCBjb25kaXRpb25hbGx5IGV2YWx1YXRlcyBpdHNcbmFyZ3VtZW50cy5cbiovXG5cbid1c2Ugc3RyaWN0JztcblxudmFyIF8gPSAodHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdy5fIDogdHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbC5fIDogbnVsbCk7XG5cbnZhciB3cmFwRm4gPSBmdW5jdGlvbiAoZm4pIHtcbiAgcmV0dXJuIGZ1bmN0aW9uIChwbHVnaW4pIHtcbiAgICBwbHVnaW4uZXhwb3J0cyA9IGZ1bmN0aW9uIChhcmdzLCBmaWVsZCwgY29udGV4dCkge1xuICAgICAgYXJncyA9IGZpZWxkLmV2YWwoYXJncywgY29udGV4dCk7XG4gICAgICB2YXIgcmVzdWx0ID0gZm4uYXBwbHkobnVsbCwgYXJncyk7XG4gICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH07XG4gIH07XG59O1xuXG52YXIgbWV0aG9kQ2FsbCA9IGZ1bmN0aW9uIChtZXRob2QpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uIChwbHVnaW4pIHtcbiAgICBwbHVnaW4uZXhwb3J0cyA9IGZ1bmN0aW9uIChhcmdzLCBmaWVsZCwgY29udGV4dCkge1xuICAgICAgYXJncyA9IGZpZWxkLmV2YWwoYXJncywgY29udGV4dCk7XG4gICAgICBpZiAoYXJncy5sZW5ndGggPiAwKSB7XG4gICAgICAgIHJldHVybiBhcmdzWzBdW21ldGhvZF0uYXBwbHkoYXJnc1swXSwgYXJncy5zbGljZSgxKSk7XG4gICAgICB9XG4gICAgfTtcbiAgfTtcbn07XG5cbnZhciBwbHVnaW5zID0ge1xuICBpZjogZnVuY3Rpb24gKHBsdWdpbikge1xuICAgIHBsdWdpbi5leHBvcnRzID0gZnVuY3Rpb24gKGFyZ3MsIGZpZWxkLCBjb250ZXh0KSB7XG4gICAgICByZXR1cm4gZmllbGQuZXZhbChhcmdzWzBdLCBjb250ZXh0KSA/IGZpZWxkLmV2YWwoYXJnc1sxXSwgY29udGV4dCkgOiBmaWVsZC5ldmFsKGFyZ3NbMl0sIGNvbnRleHQpO1xuICAgIH07XG4gIH0sXG5cbiAgZXE6IGZ1bmN0aW9uIChwbHVnaW4pIHtcbiAgICBwbHVnaW4uZXhwb3J0cyA9IGZ1bmN0aW9uIChhcmdzLCBmaWVsZCwgY29udGV4dCkge1xuICAgICAgcmV0dXJuIGZpZWxkLmV2YWwoYXJnc1swXSwgY29udGV4dCkgPT09IGZpZWxkLmV2YWwoYXJnc1sxXSwgY29udGV4dCk7XG4gICAgfTtcbiAgfSxcblxuICBub3Q6IGZ1bmN0aW9uIChwbHVnaW4pIHtcbiAgICBwbHVnaW4uZXhwb3J0cyA9IGZ1bmN0aW9uIChhcmdzLCBmaWVsZCwgY29udGV4dCkge1xuICAgICAgcmV0dXJuICFmaWVsZC5ldmFsKGFyZ3NbMF0sIGNvbnRleHQpO1xuICAgIH07XG4gIH0sXG5cbiAgb3I6IGZ1bmN0aW9uIChwbHVnaW4pIHtcbiAgICBwbHVnaW4uZXhwb3J0cyA9IGZ1bmN0aW9uIChhcmdzLCBmaWVsZCwgY29udGV4dCkge1xuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhcmdzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZhciBhcmcgPSBmaWVsZC5ldmFsKGFyZ3NbaV0sIGNvbnRleHQpO1xuICAgICAgICBpZiAoYXJnKSB7XG4gICAgICAgICAgcmV0dXJuIGFyZztcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIGFyZ3NbYXJncy5sZW5ndGggLSAxXTtcbiAgICB9O1xuICB9LFxuXG4gIGFuZDogZnVuY3Rpb24gKHBsdWdpbikge1xuICAgIHBsdWdpbi5leHBvcnRzID0gZnVuY3Rpb24gKGFyZ3MsIGZpZWxkLCBjb250ZXh0KSB7XG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFyZ3MubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFyIGFyZyA9IGZpZWxkLmV2YWwoYXJnc1tpXSwgY29udGV4dCk7XG4gICAgICAgIGlmICghYXJnIHx8IGkgPT09IChhcmdzLmxlbmd0aCAtIDEpKSB7XG4gICAgICAgICAgcmV0dXJuIGFyZztcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9O1xuICB9LFxuXG4gIGdldDogZnVuY3Rpb24gKHBsdWdpbikge1xuICAgIHZhciBnZXQgPSBwbHVnaW4uZXhwb3J0cyA9IGZ1bmN0aW9uIChhcmdzLCBmaWVsZCwgY29udGV4dCkge1xuICAgICAgdmFyIHV0aWwgPSBwbHVnaW4ucmVxdWlyZSgndXRpbCcpO1xuICAgICAgdmFyIGtleSA9IGZpZWxkLmV2YWwoYXJnc1swXSwgY29udGV4dCk7XG4gICAgICB2YXIgb2JqO1xuICAgICAgaWYgKGNvbnRleHQgJiYga2V5IGluIGNvbnRleHQpIHtcbiAgICAgICAgb2JqID0gY29udGV4dFtrZXldO1xuICAgICAgfSBlbHNlIGlmIChfLmlzT2JqZWN0KGZpZWxkLnZhbHVlKSAmJiBrZXkgaW4gZmllbGQudmFsdWUpIHtcbiAgICAgICAgb2JqID0gZmllbGQudmFsdWVba2V5XTtcbiAgICAgIH0gZWxzZSBpZiAoZmllbGQucGFyZW50KSB7XG4gICAgICAgIG9iaiA9IGdldChhcmdzLCBmaWVsZC5wYXJlbnQpO1xuICAgICAgfVxuICAgICAgaWYgKGFyZ3MubGVuZ3RoID4gMSkge1xuICAgICAgICB2YXIgZ2V0SW5LZXlzID0gZmllbGQuZXZhbChhcmdzLnNsaWNlKDEpLCBjb250ZXh0KTtcbiAgICAgICAgcmV0dXJuIHV0aWwuZ2V0SW4ob2JqLCBnZXRJbktleXMpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIG9iajtcbiAgICB9O1xuICB9LFxuXG4gIGdldEdyb3VwVmFsdWVzOiBmdW5jdGlvbiAocGx1Z2luKSB7XG4gICAgcGx1Z2luLmV4cG9ydHMgPSBmdW5jdGlvbiAoYXJncywgZmllbGQsIGNvbnRleHQpIHtcblxuICAgICAgdmFyIGdyb3VwTmFtZSA9IGZpZWxkLmV2YWwoYXJnc1swXSwgY29udGV4dCk7XG5cbiAgICAgIHZhciBncm91cEZpZWxkcyA9IGZpZWxkLmdyb3VwRmllbGRzKGdyb3VwTmFtZSk7XG5cbiAgICAgIHJldHVybiBncm91cEZpZWxkcy5tYXAoZnVuY3Rpb24gKGZpZWxkKSB7XG4gICAgICAgIHJldHVybiBmaWVsZC52YWx1ZTtcbiAgICAgIH0pO1xuICAgIH07XG4gIH0sXG5cbiAgZ2V0TWV0YTogZnVuY3Rpb24gKHBsdWdpbikge1xuICAgIHZhciB1dGlsID0gcGx1Z2luLnJlcXVpcmUoJ3V0aWwnKTtcbiAgICBwbHVnaW4uZXhwb3J0cyA9IGZ1bmN0aW9uIChhcmdzLCBmaWVsZCwgY29udGV4dCkge1xuICAgICAgYXJncyA9IGZpZWxkLmV2YWwoYXJncywgY29udGV4dCk7XG4gICAgICB2YXIgY2FjaGVLZXkgPSB1dGlsLm1ldGFDYWNoZUtleShhcmdzWzBdLCBhcmdzWzFdKTtcbiAgICAgIHJldHVybiBmaWVsZC5mb3JtLm1ldGEoY2FjaGVLZXkpO1xuICAgIH07XG4gIH0sXG5cbiAgc3VtOiBmdW5jdGlvbiAocGx1Z2luKSB7XG4gICAgcGx1Z2luLmV4cG9ydHMgPSBmdW5jdGlvbiAoYXJncywgZmllbGQsIGNvbnRleHQpIHtcbiAgICAgIHZhciBzdW0gPSAwO1xuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhcmdzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHN1bSArPSBmaWVsZC5ldmFsKGFyZ3NbaV0sIGNvbnRleHQpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHN1bTtcbiAgICB9O1xuICB9LFxuXG4gIGZvckVhY2g6IGZ1bmN0aW9uIChwbHVnaW4pIHtcbiAgICBwbHVnaW4uZXhwb3J0cyA9IGZ1bmN0aW9uIChhcmdzLCBmaWVsZCwgY29udGV4dCkge1xuICAgICAgdmFyIGl0ZW1OYW1lID0gYXJnc1swXTtcbiAgICAgIHZhciBhcnJheSA9IGZpZWxkLmV2YWwoYXJnc1sxXSwgY29udGV4dCk7XG4gICAgICB2YXIgbWFwRXhwciA9IGFyZ3NbMl07XG4gICAgICB2YXIgZmlsdGVyRXhwciA9IGFyZ3NbM107XG4gICAgICBjb250ZXh0ID0gT2JqZWN0LmNyZWF0ZShjb250ZXh0IHx8IHt9KTtcblxuICAgICAgdmFyIHJlc3VsdHMgPSBbXTtcblxuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhcnJheS5sZW5ndGg7IGkrKykge1xuICAgICAgICB2YXIgaXRlbSA9IGFycmF5W2ldO1xuICAgICAgICBjb250ZXh0W2l0ZW1OYW1lXSA9IGl0ZW07XG4gICAgICAgIGlmIChfLmlzVW5kZWZpbmVkKGZpbHRlckV4cHIpIHx8IGZpZWxkLmV2YWwoZmlsdGVyRXhwciwgY29udGV4dCkpIHtcbiAgICAgICAgICByZXN1bHRzLnB1c2goZmllbGQuZXZhbChtYXBFeHByLCBjb250ZXh0KSk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHJlc3VsdHM7XG4gICAgfTtcbiAgfSxcblxuICBjb25jYXQ6IG1ldGhvZENhbGwoJ2NvbmNhdCcpLFxuICBzcGxpdDogbWV0aG9kQ2FsbCgnc3BsaXQnKSxcbiAgcmV2ZXJzZTogbWV0aG9kQ2FsbCgncmV2ZXJzZScpLFxuICBqb2luOiBtZXRob2RDYWxsKCdqb2luJyksXG5cbiAgaHVtYW5pemU6IGZ1bmN0aW9uIChwbHVnaW4pIHtcbiAgICB2YXIgdXRpbCA9IHBsdWdpbi5yZXF1aXJlKCd1dGlsJyk7XG4gICAgcGx1Z2luLmV4cG9ydHMgPSBmdW5jdGlvbiAoYXJncywgZmllbGQsIGNvbnRleHQpIHtcbiAgICAgIHJldHVybiB1dGlsLmh1bWFuaXplKGZpZWxkLmV2YWwoYXJnc1swXSwgY29udGV4dCkpO1xuICAgIH07XG4gIH0sXG5cbiAgcGljazogd3JhcEZuKF8ucGljayksXG4gIHBsdWNrOiB3cmFwRm4oXy5wbHVjaylcbn07XG5cbi8vIEJ1aWxkIGEgcGx1Z2luIGJ1bmRsZS5cbl8uZWFjaChwbHVnaW5zLCBmdW5jdGlvbiAoZm4sIG5hbWUpIHtcbiAgbW9kdWxlLmV4cG9ydHNbJ2V2YWwtZnVuY3Rpb24uJyArIG5hbWVdID0gZm47XG59KTtcblxufSkuY2FsbCh0aGlzLHR5cGVvZiBnbG9iYWwgIT09IFwidW5kZWZpbmVkXCIgPyBnbG9iYWwgOiB0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOiB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge30pIiwiKGZ1bmN0aW9uIChnbG9iYWwpe1xuLy8gIyBldmFsXG5cbi8qXG5UaGUgZXZhbCBwbHVnaW4gd2lsbCBldmFsdWF0ZSBhIGZpZWxkJ3MgYGV2YWxgIHByb3BlcnR5ICh3aGljaCBtdXN0IGJlIGFuXG5vYmplY3QpIGFuZCBleGNoYW5nZSB0aGUgcHJvcGVydGllcyBvZiB0aGF0IG9iamVjdCBmb3Igd2hhdGV2ZXIgdGhlXG5leHByZXNzaW9uIHJldHVybnMuIEV4cHJlc3Npb25zIGFyZSBqdXN0IEpTT04gZXhjZXB0IGlmIHRoZSBmaXJzdCBlbGVtZW50IG9mXG5hbiBhcnJheSBpcyBhIHN0cmluZyB0aGF0IHN0YXJ0cyB3aXRoICdAJy4gSW4gdGhhdCBjYXNlLCB0aGUgYXJyYXkgaXNcbnRyZWF0ZWQgYXMgYSBMaXNwIGV4cHJlc3Npb24gd2hlcmUgdGhlIGZpcnN0IGVsZW1lbnQgcmVmZXJzIHRvIGEgZnVuY3Rpb25cbnRoYXQgaXMgY2FsbGVkIHdpdGggdGhlIHJlc3Qgb2YgdGhlIGVsZW1lbnRzIGFzIHRoZSBhcmd1bWVudHMuIEZvciBleGFtcGxlOlxuXG5gYGBqc1xuWydAc3VtJywgMSwgMl1cbmBgYFxuXG53aWxsIHJldHVybiB0aGUgdmFsdWUgMy4gVGhlIGV4cHJlc3Npb24gY291bGQgYmUgdXNlZCBpbiBhbiBgZXZhbGAgcHJvcGVydHkgb2ZcbmEgZmllbGQgbGlrZTpcblxuYGBganNcbntcbiAgdHlwZTogJ3N0cmluZycsXG4gIGtleTogJ25hbWUnLFxuICBldmFsOiB7XG4gICAgcm93czogWydAc3VtJywgMSwgMl1cbiAgfVxufVxuYGBgXG5cblRoZSBgcm93c2AgcHJvcGVydHkgb2YgdGhlIGZpZWxkIHdvdWxkIGJlIHNldCB0byAzIGluIHRoaXMgY2FzZS5cblxuQW55IHBsdWdpbiByZWdpc3RlcmVkIHdpdGggdGhlIHByZWZpeCBgZXZhbC1mdW5jdGlvbi5gIHdpbGwgYmUgYXZhaWxhYmxlIGFzIGFcbmZ1bmN0aW9uIGluIHRoZXNlIGV4cHJlc3Npb25zLlxuKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgXyA9ICh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93Ll8gOiB0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsLl8gOiBudWxsKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAocGx1Z2luKSB7XG5cbiAgLy8gR3JhYiBhbGwgdGhlIGZ1bmN0aW9uIHBsdWdpbnMuXG4gIHZhciBldmFsRnVuY3Rpb25QbHVnaW5zID0gcGx1Z2luLnJlcXVpcmVBbGxPZignZXZhbC1mdW5jdGlvbicpO1xuXG4gIC8vIEp1c3Qgc3RyaXAgb2ZmIHRoZSAnZXZhbC1mdW5jdGlvbnMuJyBwcmVmaXggYW5kIHB1dCBpbiBhIGRpZmZlcmVudCBvYmplY3QuXG4gIHZhciBmdW5jdGlvbnMgPSB7fTtcbiAgXy5lYWNoKGV2YWxGdW5jdGlvblBsdWdpbnMsIGZ1bmN0aW9uIChmbiwgbmFtZSkge1xuICAgIHZhciBmbk5hbWUgPSBuYW1lLnN1YnN0cmluZyhuYW1lLmluZGV4T2YoJy4nKSArIDEpO1xuICAgIGZ1bmN0aW9uc1tmbk5hbWVdID0gZm47XG4gIH0pO1xuXG4gIC8vIENoZWNrIGFuIGFycmF5IHRvIHNlZSBpZiBpdCdzIGEgZnVuY3Rpb24gZXhwcmVzc2lvbi5cbiAgdmFyIGlzRnVuY3Rpb25BcnJheSA9IGZ1bmN0aW9uIChhcnJheSkge1xuICAgIHJldHVybiBhcnJheS5sZW5ndGggPiAwICYmIGFycmF5WzBdWzBdID09PSAnQCc7XG4gIH07XG5cbiAgLy8gRXZhbHVhdGUgYSBmdW5jdGlvbiBleHByZXNzaW9uIGFuZCByZXR1cm4gdGhlIHJlc3VsdC5cbiAgdmFyIGV2YWxGdW5jdGlvbiA9IGZ1bmN0aW9uIChmbkFycmF5LCBmaWVsZCwgY29udGV4dCkge1xuICAgIHZhciBmbk5hbWUgPSBmbkFycmF5WzBdLnN1YnN0cmluZygxKTtcbiAgICB0cnkge1xuICAgICAgcmV0dXJuIGZ1bmN0aW9uc1tmbk5hbWVdKGZuQXJyYXkuc2xpY2UoMSksIGZpZWxkLCBjb250ZXh0KTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBpZiAoIShmbk5hbWUgaW4gZnVuY3Rpb25zKSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0V2YWwgZnVuY3Rpb24gJyArIGZuTmFtZSArICcgbm90IGRlZmluZWQuJyk7XG4gICAgICB9XG4gICAgICB0aHJvdyBlO1xuICAgIH1cbiAgfTtcblxuICAvLyBFdmFsdWF0ZSBhbiBleHByZXNzaW9uIGluIHRoZSBjb250ZXh0IG9mIGEgZmllbGQuXG4gIHZhciBldmFsdWF0ZSA9IGZ1bmN0aW9uIChleHByZXNzaW9uLCBmaWVsZCwgY29udGV4dCkge1xuICAgIGlmIChfLmlzQXJyYXkoZXhwcmVzc2lvbikpIHtcbiAgICAgIGlmIChpc0Z1bmN0aW9uQXJyYXkoZXhwcmVzc2lvbikpIHtcbiAgICAgICAgcmV0dXJuIGV2YWxGdW5jdGlvbihleHByZXNzaW9uLCBmaWVsZCwgY29udGV4dCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gZXhwcmVzc2lvbi5tYXAoZnVuY3Rpb24gKGl0ZW0pIHtcbiAgICAgICAgICByZXR1cm4gZXZhbHVhdGUoaXRlbSwgZmllbGQsIGNvbnRleHQpO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKF8uaXNPYmplY3QoZXhwcmVzc2lvbikpIHtcbiAgICAgIHZhciBvYmogPSB7fTtcbiAgICAgIE9iamVjdC5rZXlzKGV4cHJlc3Npb24pLmZvckVhY2goZnVuY3Rpb24gKGtleSkge1xuICAgICAgICB2YXIgcmVzdWx0ID0gZXZhbHVhdGUoZXhwcmVzc2lvbltrZXldLCBmaWVsZCwgY29udGV4dCk7XG4gICAgICAgIGlmICh0eXBlb2YgcmVzdWx0ICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgIG9ialtrZXldID0gcmVzdWx0O1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAgIHJldHVybiBvYmo7XG4gICAgfSBlbHNlIGlmIChfLmlzU3RyaW5nKGV4cHJlc3Npb24pICYmIGV4cHJlc3Npb25bMF0gPT09ICc9Jykge1xuICAgICAgcmV0dXJuIGZ1bmN0aW9ucy5nZXQoW2V4cHJlc3Npb24uc3Vic3RyaW5nKDEpXSwgZmllbGQsIGNvbnRleHQpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gZXhwcmVzc2lvbjtcbiAgICB9XG4gIH07XG5cbiAgcGx1Z2luLmV4cG9ydHMuZXZhbHVhdGUgPSBldmFsdWF0ZTtcbn07XG5cbn0pLmNhbGwodGhpcyx0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsIDogdHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDogdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9KSIsIihmdW5jdGlvbiAoZ2xvYmFsKXtcbi8vICMgZmllbGQtcm91dGVyXG5cbi8qXG5GaWVsZHMgYW5kIGNvbXBvbmVudHMgZ2V0IGdsdWVkIHRvZ2V0aGVyIHZpYSByb3V0ZXMuIFRoaXMgaXMgc2ltaWxhciB0byBVUkxcbnJvdXRpbmcgd2hlcmUgYSByZXF1ZXN0IGdldHMgZHluYW1pY2FsbHkgcm91dGVkIHRvIGEgaGFuZGxlci4gVGhpcyBnaXZlcyBhIGxvdFxub2YgZmxleGliaWxpdHkgaW4gaW50cm9kdWNpbmcgbmV3IHR5cGVzIGFuZCBjb21wb25lbnRzLiBZb3UgY2FuIGNyZWF0ZSBhIG5ld1xudHlwZSBhbmQgcm91dGUgaXQgdG8gYW4gZXhpc3RpbmcgY29tcG9uZW50LCBvciB5b3UgY2FuIGNyZWF0ZSBhIG5ldyBjb21wb25lbnRcbmFuZCByb3V0ZSBleGlzdGluZyB0eXBlcyB0byBpdC4gT3IgeW91IGNhbiBjcmVhdGUgYm90aCBhbmQgcm91dGUgdGhlIG5ldyB0eXBlXG50byB0aGUgbmV3IGNvbXBvbmVudC4gTmV3IHJvdXRlcyBhcmUgYWRkZWQgdmlhIHJvdXRlIHBsdWdpbnMuIEEgcm91dGUgcGx1Z2luXG5zaW1wbHkgZXhwb3J0cyBhbiBhcnJheSBsaWtlOlxuXG5gYGBqc1xuW1xuICAnY29sb3InLCAvLyBSb3V0ZSB0aGlzIHR5cGVcbiAgJ2NvbG9yLXBpY2tlci13aXRoLWFscGhhJywgLy8gVG8gdGhpcyBjb21wb25lbnRcbiAgZnVuY3Rpb24gKGZpZWxkKSB7XG4gICAgcmV0dXJuIHR5cGVvZiBmaWVsZC5kZWYuYWxwaGEgIT09ICd1bmRlZmluZWQnO1xuICB9XG5dXG5cblJvdXRlIHBsdWdpbnMgY2FuIGJlIHN0YWNrZWQgYW5kIGFyZSBzZW5zaXRpdmUgdG8gb3JkZXJpbmcuXG4qL1xuXG4ndXNlIHN0cmljdCc7XG5cbnZhciBfID0gKHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cuXyA6IHR5cGVvZiBnbG9iYWwgIT09IFwidW5kZWZpbmVkXCIgPyBnbG9iYWwuXyA6IG51bGwpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChwbHVnaW4pIHtcblxuICB2YXIgcm91dGVzID0ge307XG5cbiAgdmFyIHJvdXRlciA9IHBsdWdpbi5leHBvcnRzO1xuXG4gIC8vIEdldCBhbGwgdGhlIHJvdXRlIHBsdWdpbnMuXG4gIHZhciByb3V0ZVBsdWdpbnMgPSBwbHVnaW4ucmVxdWlyZUFsbChwbHVnaW4uY29uZmlnLnJvdXRlcyk7XG5cbiAgLy8gUmVnaXN0ZXIgYSByb3V0ZS5cbiAgcm91dGVyLnJvdXRlID0gZnVuY3Rpb24gKHR5cGVOYW1lLCBjb21wb25lbnROYW1lLCB0ZXN0Rm4pIHtcbiAgICBpZiAoIXJvdXRlc1t0eXBlTmFtZV0pIHtcbiAgICAgIHJvdXRlc1t0eXBlTmFtZV0gPSBbXTtcbiAgICB9XG4gICAgcm91dGVzW3R5cGVOYW1lXS5wdXNoKHtcbiAgICAgIGNvbXBvbmVudDogY29tcG9uZW50TmFtZSxcbiAgICAgIHRlc3Q6IHRlc3RGblxuICAgIH0pO1xuICB9O1xuXG4gIC8vIFJlZ2lzdGVyIGVhY2ggb2YgdGhlIHJvdXRlcyBwcm92aWRlZCBieSB0aGUgcm91dGUgcGx1Z2lucy5cbiAgcm91dGVQbHVnaW5zLmZvckVhY2goZnVuY3Rpb24gKHJvdXRlUGx1Z2luKSB7XG5cbiAgICByb3V0ZXIucm91dGUuYXBwbHkocm91dGVyLCByb3V0ZVBsdWdpbik7XG4gIH0pO1xuXG4gIC8vIERldGVybWluZSB0aGUgYmVzdCBjb21wb25lbnQgZm9yIGEgZmllbGQsIGJhc2VkIG9uIHRoZSByb3V0ZXMuXG4gIHJvdXRlci5jb21wb25lbnRGb3JGaWVsZCA9IGZ1bmN0aW9uIChmaWVsZCkge1xuXG4gICAgdmFyIHR5cGVOYW1lID0gZmllbGQuZGVmLnR5cGU7XG5cbiAgICBpZiAocm91dGVzW3R5cGVOYW1lXSkge1xuICAgICAgdmFyIHJvdXRlc0ZvclR5cGUgPSByb3V0ZXNbdHlwZU5hbWVdO1xuICAgICAgdmFyIHJvdXRlID0gXy5maW5kKHJvdXRlc0ZvclR5cGUsIGZ1bmN0aW9uIChyb3V0ZSkge1xuICAgICAgICByZXR1cm4gIXJvdXRlLnRlc3QgfHwgcm91dGUudGVzdChmaWVsZCk7XG4gICAgICB9KTtcbiAgICAgIGlmIChyb3V0ZSkge1xuICAgICAgICByZXR1cm4gcGx1Z2luLmNvbXBvbmVudChyb3V0ZS5jb21wb25lbnQpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChwbHVnaW4uaGFzQ29tcG9uZW50KHR5cGVOYW1lKSkge1xuICAgICAgcmV0dXJuIHBsdWdpbi5jb21wb25lbnQodHlwZU5hbWUpO1xuICAgIH1cblxuICAgIHRocm93IG5ldyBFcnJvcignTm8gY29tcG9uZW50IGZvciBmaWVsZDogJyArIEpTT04uc3RyaW5naWZ5KGZpZWxkLmRlZikpO1xuICB9O1xufTtcblxufSkuY2FsbCh0aGlzLHR5cGVvZiBnbG9iYWwgIT09IFwidW5kZWZpbmVkXCIgPyBnbG9iYWwgOiB0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOiB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge30pIiwiKGZ1bmN0aW9uIChnbG9iYWwpe1xuLy8gIyBmaWVsZC1yb3V0ZXNcblxuLypcbkRlZmF1bHQgcm91dGVzLiBFYWNoIHJvdXRlIGlzIHBhcnQgb2YgaXRzIG93biBwbHVnaW4sIGJ1dCBhbGwgYXJlIGtlcHQgdG9nZXRoZXJcbmhlcmUgYXMgcGFydCBvZiBhIHBsdWdpbiBidW5kbGUuXG4qL1xuXG4ndXNlIHN0cmljdCc7XG5cbnZhciBfID0gKHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cuXyA6IHR5cGVvZiBnbG9iYWwgIT09IFwidW5kZWZpbmVkXCIgPyBnbG9iYWwuXyA6IG51bGwpO1xuXG52YXIgcm91dGVzID0ge1xuXG4gICdvYmplY3QuZGVmYXVsdCc6IFtcbiAgICAnb2JqZWN0JyxcbiAgICAnZmllbGRzZXQnXG4gIF0sXG5cbiAgJ3N0cmluZy5jaG9pY2VzJzogW1xuICAgICdzdHJpbmcnLFxuICAgICdzZWxlY3QnLFxuICAgIGZ1bmN0aW9uIChmaWVsZCkge1xuICAgICAgcmV0dXJuIGZpZWxkLmRlZi5jaG9pY2VzID8gdHJ1ZSA6IGZhbHNlO1xuICAgIH1cbiAgXSxcblxuICAnc3RyaW5nLnRhZ3MnOiBbXG4gICAgJ3N0cmluZycsXG4gICAgJ3ByZXR0eS10ZXh0YXJlYScsXG4gICAgZnVuY3Rpb24gKGZpZWxkKSB7XG4gICAgICByZXR1cm4gZmllbGQuZGVmLnJlcGxhY2VDaG9pY2VzO1xuICAgIH1cbiAgXSxcblxuICAnc3RyaW5nLnNpbmdsZS1saW5lJzogW1xuICAgICdzdHJpbmcnLFxuICAgICd0ZXh0JyxcbiAgICBmdW5jdGlvbiAoZmllbGQpIHtcbiAgICAgIHJldHVybiBmaWVsZC5kZWYubWF4Um93cyA9PT0gMTtcbiAgICB9XG4gIF0sXG5cbiAgJ3N0cmluZy5kZWZhdWx0JzogW1xuICAgICdzdHJpbmcnLFxuICAgICd0ZXh0YXJlYSdcbiAgXSxcblxuICAnYXJyYXkuY2hvaWNlcyc6IFtcbiAgICAnYXJyYXknLFxuICAgICdjaGVja2JveC1saXN0JyxcbiAgICBmdW5jdGlvbiAoZmllbGQpIHtcbiAgICAgIHJldHVybiBmaWVsZC5kZWYuY2hvaWNlcyA/IHRydWUgOiBmYWxzZTtcbiAgICB9XG4gIF0sXG5cbiAgJ2FycmF5LmRlZmF1bHQnOiBbXG4gICAgJ2FycmF5JyxcbiAgICAnbGlzdCdcbiAgXSxcblxuICAnYm9vbGVhbi5kZWZhdWx0JzogW1xuICAgICdib29sZWFuJyxcbiAgICAnc2VsZWN0J1xuICBdLFxuXG4gICdudW1iZXIuZGVmYXVsdCc6IFtcbiAgICAnbnVtYmVyJyxcbiAgICAndGV4dCdcbiAgXVxuXG59O1xuXG4vLyBCdWlsZCBhIHBsdWdpbiBidW5kbGUuXG5fLmVhY2gocm91dGVzLCBmdW5jdGlvbiAocm91dGUsIG5hbWUpIHtcbiAgbW9kdWxlLmV4cG9ydHNbJ2ZpZWxkLXJvdXRlLicgKyBuYW1lXSA9IGZ1bmN0aW9uIChwbHVnaW4pIHtcbiAgICBwbHVnaW4uZXhwb3J0cyA9IHJvdXRlO1xuICB9O1xufSk7XG5cbn0pLmNhbGwodGhpcyx0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsIDogdHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDogdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9KSIsIi8vICMgbG9hZGVyXG5cbi8qXG5XaGVuIG1ldGFkYXRhIGlzbid0IGF2YWlsYWJsZSwgd2UgYXNrIHRoZSBsb2FkZXIgdG8gbG9hZCBpdC4gVGhlIGxvYWRlciB3aWxsXG50cnkgdG8gZmluZCBhbiBhcHByb3ByaWF0ZSBzb3VyY2UgYmFzZWQgb24gdGhlIG1ldGFkYXRhIGtleXMuXG5cbk5vdGUgdGhhdCB3ZSBhc2sgdGhlIGxvYWRlciB0byBsb2FkIG1ldGFkYXRhIHdpdGggYSBzZXQgb2Yga2V5cyBsaWtlXG5gWydmb28nLCAnYmFyJ11gLCBidXQgdGhvc2UgYXJlIGNvbnZlcnRlZCB0byBhIHNpbmdsZSBrZXkgbGlrZSBgZm9vOjpiYXJgIGZvclxudGhlIHNha2Ugb2YgY2FjaGluZy5cbiovXG5cbid1c2Ugc3RyaWN0JztcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAocGx1Z2luKSB7XG5cbiAgdmFyIHV0aWwgPSBwbHVnaW4ucmVxdWlyZSgndXRpbCcpO1xuXG4gIHZhciBsb2FkZXIgPSBwbHVnaW4uZXhwb3J0cztcblxuICB2YXIgaXNMb2FkaW5nID0ge307XG4gIHZhciBzb3VyY2VzID0ge307XG5cbiAgLy8gTG9hZCBtZXRhZGF0YSBmb3IgYSBnaXZlbiBmb3JtIGFuZCBwYXJhbXMuXG4gIGxvYWRlci5sb2FkTWV0YSA9IGZ1bmN0aW9uIChmb3JtLCBzb3VyY2UsIHBhcmFtcykge1xuICAgIHZhciBjYWNoZUtleSA9IHV0aWwubWV0YUNhY2hlS2V5KHNvdXJjZSwgcGFyYW1zKTtcblxuICAgIGlmIChpc0xvYWRpbmdbY2FjaGVLZXldKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaXNMb2FkaW5nW2NhY2hlS2V5XSA9IHRydWU7XG5cbiAgICBsb2FkZXIubG9hZEFzeW5jRnJvbVNvdXJjZShmb3JtLCBzb3VyY2UsIHBhcmFtcyk7XG4gIH07XG5cbiAgLy8gTWFrZSBzdXJlIHRvIGxvYWQgbWV0YWRhdGEgYXN5bmNocm9ub3VzbHkuXG4gIGxvYWRlci5sb2FkQXN5bmNGcm9tU291cmNlID0gZnVuY3Rpb24gKGZvcm0sIHNvdXJjZSwgcGFyYW1zLCB3YWl0VGltZSkge1xuICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgbG9hZGVyLmxvYWRGcm9tU291cmNlKGZvcm0sIHNvdXJjZSwgcGFyYW1zKTtcbiAgICB9LCB3YWl0VGltZSB8fCAwKTtcbiAgfTtcblxuICAvLyBMb2FkIG1ldGFkYXRhIGZvciBhIGZvcm0gYW5kIHBhcmFtcy5cbiAgbG9hZGVyLmxvYWRGcm9tU291cmNlID0gZnVuY3Rpb24gKGZvcm0sIHNvdXJjZU5hbWUsIHBhcmFtcykge1xuXG4gICAgLy8gRmluZCB0aGUgYmVzdCBzb3VyY2UgZm9yIHRoaXMgY2FjaGUga2V5LlxuICAgIHZhciBzb3VyY2UgPSBzb3VyY2VzW3NvdXJjZU5hbWVdO1xuICAgIGlmIChzb3VyY2UpIHtcblxuICAgICAgdmFyIGNhY2hlS2V5ID0gdXRpbC5tZXRhQ2FjaGVLZXkoc291cmNlTmFtZSwgcGFyYW1zKTtcblxuICAgICAgLy8gQ2FsbCB0aGUgc291cmNlIGZ1bmN0aW9uLlxuICAgICAgdmFyIHJlc3VsdCA9IHNvdXJjZS5jYWxsKG51bGwsIHBhcmFtcyk7XG5cbiAgICAgIGlmIChyZXN1bHQpIHtcbiAgICAgICAgLy8gUmVzdWx0IGNvdWxkIGJlIGEgcHJvbWlzZS5cbiAgICAgICAgaWYgKHJlc3VsdC50aGVuKSB7XG4gICAgICAgICAgdmFyIHByb21pc2UgPSByZXN1bHQudGhlbihmdW5jdGlvbiAocmVzdWx0KSB7XG4gICAgICAgICAgICBmb3JtLm1ldGEoY2FjaGVLZXksIHJlc3VsdCk7XG4gICAgICAgICAgICBpc0xvYWRpbmdbY2FjaGVLZXldID0gZmFsc2U7XG4gICAgICAgICAgfSk7XG5cbiAgICAgICAgICB2YXIgb25FcnJvciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGlzTG9hZGluZ1tjYWNoZUtleV0gPSBmYWxzZTtcbiAgICAgICAgICB9O1xuXG4gICAgICAgICAgaWYgKHByb21pc2UuY2F0Y2gpIHtcbiAgICAgICAgICAgIHByb21pc2UuY2F0Y2gob25FcnJvcik7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIHNpbGx5IGpRdWVyeSBwcm9taXNlc1xuICAgICAgICAgICAgcHJvbWlzZS5mYWlsKG9uRXJyb3IpO1xuICAgICAgICAgIH1cbiAgICAgICAgLy8gT3IgaXQgY291bGQgYmUgYSB2YWx1ZS4gSW4gdGhhdCBjYXNlLCBtYWtlIHN1cmUgdG8gYXN5bmNpZnkgaXQuXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBmb3JtLm1ldGEoY2FjaGVLZXksIHJlc3VsdCk7XG4gICAgICAgICAgICBpc0xvYWRpbmdbY2FjaGVLZXldID0gZmFsc2U7XG4gICAgICAgICAgfSwgMCk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlzTG9hZGluZ1tjYWNoZUtleV0gPSBmYWxzZTtcbiAgICAgIH1cblxuICAgIH0gZWxzZSB7XG4gICAgICBpc0xvYWRpbmdbY2FjaGVLZXldID0gZmFsc2U7XG4gICAgfVxuICB9O1xuXG4gIC8vIFJlZ2lzdGVyIGEgc291cmNlIGZ1bmN0aW9uLlxuICBsb2FkZXIuc291cmNlID0gZnVuY3Rpb24gKG5hbWUsIGZuKSB7XG5cbiAgICBzb3VyY2VzW25hbWVdID0gZm47XG4gIH07XG5cbn07XG4iLCIoZnVuY3Rpb24gKGdsb2JhbCl7XG4vLyAjIHV0aWxcblxuLy8gU29tZSB1dGlsaXR5IGZ1bmN0aW9ucyB0byBiZSB1c2VkIGJ5IG90aGVyIHBsdWdpbnMuXG5cbid1c2Ugc3RyaWN0JztcblxudmFyIF8gPSAodHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdy5fIDogdHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbC5fIDogbnVsbCk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKHBsdWdpbikge1xuXG4gIHZhciB1dGlsID0gcGx1Z2luLmV4cG9ydHM7XG5cbiAgLy8gQ2hlY2sgaWYgYSB2YWx1ZSBpcyBcImJsYW5rXCIuXG4gIHV0aWwuaXNCbGFuayA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgIHJldHVybiB2YWx1ZSA9PT0gdW5kZWZpbmVkIHx8IHZhbHVlID09PSBudWxsIHx8IHZhbHVlID09PSAnJztcbiAgfTtcblxuICAvLyBTZXQgdmFsdWUgYXQgc29tZSBwYXRoIGluIG9iamVjdC5cbiAgdXRpbC5zZXRJbiA9IGZ1bmN0aW9uIChvYmosIHBhdGgsIHZhbHVlKSB7XG4gICAgaWYgKF8uaXNTdHJpbmcocGF0aCkpIHtcbiAgICAgIHBhdGggPSBbcGF0aF07XG4gICAgfVxuICAgIGlmIChwYXRoLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIHZhbHVlO1xuICAgIH1cbiAgICBpZiAocGF0aC5sZW5ndGggPT09IDEpIHtcbiAgICAgIG9ialtwYXRoWzBdXSA9IHZhbHVlO1xuICAgICAgcmV0dXJuIG9iajtcbiAgICB9XG4gICAgaWYgKCFvYmpbcGF0aFswXV0pIHtcbiAgICAgIG9ialtwYXRoWzBdXSA9IHt9O1xuICAgIH1cbiAgICB1dGlsLnNldEluKG9ialtwYXRoWzBdXSwgcGF0aC5zbGljZSgxKSwgdmFsdWUpO1xuICAgIHJldHVybiBvYmo7XG4gIH07XG5cbiAgLy8gUmVtb3ZlIHZhbHVlIGF0IHBhdGggaW4gc29tZSBvYmplY3QuXG4gIHV0aWwucmVtb3ZlSW4gPSBmdW5jdGlvbiAob2JqLCBwYXRoKSB7XG4gICAgaWYgKF8uaXNTdHJpbmcocGF0aCkpIHtcbiAgICAgIHBhdGggPSBbcGF0aF07XG4gICAgfVxuICAgIGlmIChwYXRoLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIGlmIChwYXRoLmxlbmd0aCA9PT0gMSkge1xuICAgICAgaWYgKF8uaXNBcnJheShvYmopKSB7XG4gICAgICAgIGlmIChfLmlzTnVtYmVyKHBhdGhbMF0pKSB7XG4gICAgICAgICAgb2JqLnNwbGljZShwYXRoWzBdLCAxKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmIChfLmlzT2JqZWN0KG9iaikpIHtcbiAgICAgICAgZGVsZXRlIG9ialtwYXRoWzBdXTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBvYmo7XG4gICAgfVxuICAgIGlmIChvYmpbcGF0aFswXV0pIHtcbiAgICAgIHV0aWwucmVtb3ZlSW4ob2JqW3BhdGhbMF1dLCBwYXRoLnNsaWNlKDEpKTtcbiAgICB9XG4gICAgcmV0dXJuIG9iajtcbiAgfTtcblxuICAvLyBHZXQgdmFsdWUgYXQgcGF0aCBpbiBzb21lIG9iamVjdC5cbiAgdXRpbC5nZXRJbiA9IGZ1bmN0aW9uIChvYmosIHBhdGgpIHtcbiAgICBpZiAoXy5pc1N0cmluZyhwYXRoKSkge1xuICAgICAgcGF0aCA9IFtwYXRoXTtcbiAgICB9XG4gICAgaWYgKHBhdGgubGVuZ3RoID09PSAwKSB7XG4gICAgICByZXR1cm4gb2JqO1xuICAgIH1cbiAgICBpZiAoXy5pc09iamVjdChvYmopICYmIHBhdGhbMF0gaW4gb2JqKSB7XG4gICAgICByZXR1cm4gdXRpbC5nZXRJbihvYmpbcGF0aFswXV0sIHBhdGguc2xpY2UoMSkpO1xuICAgIH1cbiAgICByZXR1cm4gbnVsbDtcbiAgfTtcblxuICAvLyBBcHBlbmQgdG8gYXJyYXkgYXQgcGF0aCBpbiBzb21lIG9iamVjdC5cbiAgdXRpbC5hcHBlbmRJbiA9IGZ1bmN0aW9uIChvYmosIHBhdGgsIHZhbHVlKSB7XG4gICAgdmFyIHN1Yk9iaiA9IHV0aWwuZ2V0SW4ob2JqLCBwYXRoKTtcbiAgICBpZiAoXy5pc0FycmF5KHN1Yk9iaikpIHtcbiAgICAgIHN1Yk9iai5wdXNoKHZhbHVlKTtcbiAgICB9XG4gICAgcmV0dXJuIG9iajtcbiAgfTtcblxuICAvLyBTd2FwIHR3byBrZXlzIGF0IHBhdGggaW4gc29tZSBvYmplY3QuXG4gIHV0aWwubW92ZUluID0gZnVuY3Rpb24gKG9iaiwgcGF0aCwgZnJvbUtleSwgdG9LZXkpIHtcbiAgICB2YXIgc3ViT2JqID0gdXRpbC5nZXRJbihvYmosIHBhdGgpO1xuICAgIGlmIChfLmlzQXJyYXkoc3ViT2JqKSkge1xuICAgICAgaWYgKF8uaXNOdW1iZXIoZnJvbUtleSkgJiYgXy5pc051bWJlcih0b0tleSkpIHtcbiAgICAgICAgdmFyIGZyb21JbmRleCA9IGZyb21LZXk7XG4gICAgICAgIHZhciB0b0luZGV4ID0gdG9LZXk7XG4gICAgICAgIGlmIChmcm9tSW5kZXggIT09IHRvSW5kZXggJiZcbiAgICAgICAgICBmcm9tSW5kZXggPj0gMCAmJiBmcm9tSW5kZXggPCBzdWJPYmoubGVuZ3RoICYmXG4gICAgICAgICAgdG9JbmRleCA+PSAwICYmIHRvSW5kZXggPCBzdWJPYmoubGVuZ3RoXG4gICAgICAgICkge1xuICAgICAgICAgIHN1Yk9iai5zcGxpY2UodG9JbmRleCwgMCwgc3ViT2JqLnNwbGljZShmcm9tSW5kZXgsIDEpWzBdKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICB2YXIgZnJvbVZhbHVlID0gc3ViT2JqW2Zyb21LZXldO1xuICAgICAgc3ViT2JqW2Zyb21LZXldID0gc3ViT2JqW3RvS2V5XTtcbiAgICAgIHN1Yk9ialt0b0tleV0gPSBmcm9tVmFsdWU7XG4gICAgfVxuICAgIHJldHVybiBvYmo7XG4gIH07XG5cbiAgLy8gQ29weSBvYmosIGxlYXZpbmcgbm9uLUpTT04gYmVoaW5kLlxuICB1dGlsLmNvcHlWYWx1ZSA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgIHJldHVybiBKU09OLnBhcnNlKEpTT04uc3RyaW5naWZ5KHZhbHVlKSk7XG4gIH07XG5cbiAgLy8gQ29weSBvYmogcmVjdXJzaW5nIGRlZXBseS5cbiAgdXRpbC5kZWVwQ29weSA9IGZ1bmN0aW9uIChvYmopIHtcbiAgICBpZiAoXy5pc0FycmF5KG9iaikpIHtcbiAgICAgIHJldHVybiBvYmoubWFwKGZ1bmN0aW9uIChpdGVtKSB7XG4gICAgICAgIHJldHVybiB1dGlsLmRlZXBDb3B5KGl0ZW0pO1xuICAgICAgfSk7XG4gICAgfSBlbHNlIGlmIChfLmlzT2JqZWN0KG9iaikpIHtcbiAgICAgIHZhciBjb3B5ID0ge307XG4gICAgICBfLmVhY2gob2JqLCBmdW5jdGlvbiAodmFsdWUsIGtleSkge1xuICAgICAgICBjb3B5W2tleV0gPSB1dGlsLmRlZXBDb3B5KHZhbHVlKTtcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIGNvcHk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBvYmo7XG4gICAgfVxuICB9O1xuXG4gIC8vIENoZWNrIGlmIGl0ZW0gbWF0Y2hlcyBzb21lIHZhbHVlLCBiYXNlZCBvbiB0aGUgaXRlbSdzIGBtYXRjaGAgcHJvcGVydHkuXG4gIHV0aWwuaXRlbU1hdGNoZXNWYWx1ZSA9IGZ1bmN0aW9uIChpdGVtLCB2YWx1ZSkge1xuICAgIHZhciBtYXRjaCA9IGl0ZW0ubWF0Y2g7XG4gICAgaWYgKCFtYXRjaCkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIHJldHVybiBfLmV2ZXJ5KF8ua2V5cyhtYXRjaCksIGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgIHJldHVybiBfLmlzRXF1YWwobWF0Y2hba2V5XSwgdmFsdWVba2V5XSk7XG4gICAgfSk7XG4gIH07XG5cbiAgLy8gQ3JlYXRlIGEgZmllbGQgZGVmaW5pdGlvbiBmcm9tIGEgdmFsdWUuXG4gIHV0aWwuZmllbGREZWZGcm9tVmFsdWUgPSBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICB2YXIgZGVmID0ge1xuICAgICAgdHlwZTogJ2pzb24nXG4gICAgfTtcbiAgICBpZiAoXy5pc1N0cmluZyh2YWx1ZSkpIHtcbiAgICAgIGRlZiA9IHtcbiAgICAgICAgdHlwZTogJ3N0cmluZydcbiAgICAgIH07XG4gICAgfSBlbHNlIGlmIChfLmlzTnVtYmVyKHZhbHVlKSkge1xuICAgICAgZGVmID0ge1xuICAgICAgICB0eXBlOiAnbnVtYmVyJ1xuICAgICAgfTtcbiAgICB9IGVsc2UgaWYgKF8uaXNBcnJheSh2YWx1ZSkpIHtcbiAgICAgIHZhciBhcnJheUl0ZW1GaWVsZHMgPSB2YWx1ZS5tYXAoZnVuY3Rpb24gKHZhbHVlLCBpKSB7XG4gICAgICAgIHZhciBjaGlsZERlZiA9IHV0aWwuZmllbGREZWZGcm9tVmFsdWUodmFsdWUpO1xuICAgICAgICBjaGlsZERlZi5rZXkgPSBpO1xuICAgICAgICByZXR1cm4gY2hpbGREZWY7XG4gICAgICB9KTtcbiAgICAgIGRlZiA9IHtcbiAgICAgICAgdHlwZTogJ2FycmF5JyxcbiAgICAgICAgZmllbGRzOiBhcnJheUl0ZW1GaWVsZHNcbiAgICAgIH07XG4gICAgfSBlbHNlIGlmIChfLmlzT2JqZWN0KHZhbHVlKSkge1xuICAgICAgdmFyIG9iamVjdEl0ZW1GaWVsZHMgPSBPYmplY3Qua2V5cyh2YWx1ZSkubWFwKGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgICAgdmFyIGNoaWxkRGVmID0gdXRpbC5maWVsZERlZkZyb21WYWx1ZSh2YWx1ZVtrZXldKTtcbiAgICAgICAgY2hpbGREZWYua2V5ID0ga2V5O1xuICAgICAgICBjaGlsZERlZi5sYWJlbCA9IHV0aWwuaHVtYW5pemUoa2V5KTtcbiAgICAgICAgcmV0dXJuIGNoaWxkRGVmO1xuICAgICAgfSk7XG4gICAgICBkZWYgPSB7XG4gICAgICAgIHR5cGU6ICdvYmplY3QnLFxuICAgICAgICBmaWVsZHM6IG9iamVjdEl0ZW1GaWVsZHNcbiAgICAgIH07XG4gICAgfSBlbHNlIGlmIChfLmlzTnVsbCh2YWx1ZSkpIHtcbiAgICAgIGRlZiA9IHtcbiAgICAgICAgdHlwZTogJ251bGwnXG4gICAgICB9O1xuICAgIH1cbiAgICByZXR1cm4gZGVmO1xuICB9O1xuXG4gIGlmIChwbHVnaW4uY29uZmlnLmh1bWFuaXplKSB7XG4gICAgLy8gR2V0IHRoZSBodW1hbml6ZSBmdW5jdGlvbiBmcm9tIGEgcGx1Z2luIGlmIHByb3ZpZGVkLlxuICAgIHV0aWwuaHVtYW5pemUgPSBwbHVnaW4ucmVxdWlyZShwbHVnaW4uY29uZmlnLmh1bWFuaXplKTtcbiAgfSBlbHNlIHtcbiAgICAvLyBDb252ZXJ0IHByb3BlcnR5IGtleXMgdG8gXCJodW1hblwiIGxhYmVscy4gRm9yIGV4YW1wbGUsICdmb28nIGJlY29tZXNcbiAgICAvLyAnRm9vJy5cbiAgICB1dGlsLmh1bWFuaXplID0gZnVuY3Rpb24ocHJvcGVydHkpIHtcbiAgICAgIHByb3BlcnR5ID0gcHJvcGVydHkucmVwbGFjZSgvXFx7XFx7L2csICcnKTtcbiAgICAgIHByb3BlcnR5ID0gcHJvcGVydHkucmVwbGFjZSgvXFx9XFx9L2csICcnKTtcbiAgICAgIHJldHVybiBwcm9wZXJ0eS5yZXBsYWNlKC9fL2csICcgJylcbiAgICAgICAgLnJlcGxhY2UoLyhcXHcrKS9nLCBmdW5jdGlvbihtYXRjaCkge1xuICAgICAgICAgIHJldHVybiBtYXRjaC5jaGFyQXQoMCkudG9VcHBlckNhc2UoKSArIG1hdGNoLnNsaWNlKDEpO1xuICAgICAgICB9KTtcbiAgICB9O1xuICB9XG5cbiAgLy8gSm9pbiBtdWx0aXBsZSBDU1MgY2xhc3MgbmFtZXMgdG9nZXRoZXIsIGlnbm9yaW5nIGFueSB0aGF0IGFyZW4ndCB0aGVyZS5cbiAgdXRpbC5jbGFzc05hbWUgPSBmdW5jdGlvbiAoKSB7XG5cbiAgICB2YXIgY2xhc3NOYW1lcyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMCk7XG5cbiAgICBjbGFzc05hbWVzID0gY2xhc3NOYW1lcy5maWx0ZXIoZnVuY3Rpb24gKG5hbWUpIHtcbiAgICAgIHJldHVybiBuYW1lO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIGNsYXNzTmFtZXMuam9pbignICcpO1xuICB9O1xuXG4gIC8vIEpvaW4ga2V5cyB0b2dldGhlciB0byBtYWtlIHNpbmdsZSBcIm1ldGFcIiBrZXkuIEZvciBsb29raW5nIHVwIG1ldGFkYXRhIGluXG4gIC8vIHRoZSBtZXRhZGF0YSBwYXJ0IG9mIHRoZSBzdG9yZS5cbiAgdXRpbC5qb2luTWV0YUtleXMgPSBmdW5jdGlvbiAoa2V5cykge1xuICAgIHJldHVybiBrZXlzLmpvaW4oJzo6Jyk7XG4gIH07XG5cbiAgLy8gU3BsaXQgYSBqb2luZWQga2V5IGludG8gc2VwYXJhdGUga2V5IHBhcnRzLlxuICB1dGlsLnNwbGl0TWV0YUtleSA9IGZ1bmN0aW9uIChrZXkpIHtcbiAgICByZXR1cm4ga2V5LnNwbGl0KCc6OicpO1xuICB9O1xuXG4gIHV0aWwubWV0YUNhY2hlS2V5ID0gZnVuY3Rpb24gKHNvdXJjZSwgcGFyYW1zKSB7XG4gICAgcGFyYW1zID0gcGFyYW1zIHx8IHt9O1xuICAgIHJldHVybiBzb3VyY2UgKyAnOjpwYXJhbXMoJyArIEpTT04uc3RyaW5naWZ5KHBhcmFtcykgKyAnKSc7XG4gIH07XG5cbiAgLy8gV3JhcCBhIHRleHQgdmFsdWUgc28gaXQgaGFzIGEgdHlwZS4gRm9yIHBhcnNpbmcgdGV4dCB3aXRoIHRhZ3MuXG4gIHZhciB0ZXh0UGFydCA9IGZ1bmN0aW9uICh2YWx1ZSwgdHlwZSkge1xuICAgIHR5cGUgPSB0eXBlIHx8ICd0ZXh0JztcbiAgICByZXR1cm4ge1xuICAgICAgdHlwZTogdHlwZSxcbiAgICAgIHZhbHVlOiB2YWx1ZVxuICAgIH07XG4gIH07XG5cbiAgLy8gUGFyc2UgdGV4dCB0aGF0IGhhcyB0YWdzIGxpa2Uge3t0YWd9fSBpbnRvIHRleHQgYW5kIHRhZ3MuXG4gIHV0aWwucGFyc2VUZXh0V2l0aFRhZ3MgPSBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICB2YWx1ZSA9IHZhbHVlIHx8ICcnO1xuICAgIHZhciBwYXJ0cyA9IHZhbHVlLnNwbGl0KC97eyg/IXspLyk7XG4gICAgdmFyIGZyb250UGFydCA9IFtdO1xuICAgIGlmIChwYXJ0c1swXSAhPT0gJycpIHtcbiAgICAgIGZyb250UGFydCA9IFtcbiAgICAgICAgdGV4dFBhcnQocGFydHNbMF0pXG4gICAgICBdO1xuICAgIH1cbiAgICBwYXJ0cyA9IGZyb250UGFydC5jb25jYXQoXG4gICAgICBwYXJ0cy5zbGljZSgxKS5tYXAoZnVuY3Rpb24gKHBhcnQpIHtcbiAgICAgICAgaWYgKHBhcnQuaW5kZXhPZignfX0nKSA+PSAwKSB7XG4gICAgICAgICAgcmV0dXJuIFtcbiAgICAgICAgICAgIHRleHRQYXJ0KHBhcnQuc3Vic3RyaW5nKDAsIHBhcnQuaW5kZXhPZignfX0nKSksICd0YWcnKSxcbiAgICAgICAgICAgIHRleHRQYXJ0KHBhcnQuc3Vic3RyaW5nKHBhcnQuaW5kZXhPZignfX0nKSArIDIpKVxuICAgICAgICAgIF07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIHRleHRQYXJ0KCd7eycgKyBwYXJ0LCAndGV4dCcpO1xuICAgICAgICB9XG4gICAgICB9KVxuICAgICk7XG4gICAgcmV0dXJuIFtdLmNvbmNhdC5hcHBseShbXSwgcGFydHMpO1xuICB9O1xuXG4gIC8vIENvcHkgYWxsIGNvbXB1dGVkIHN0eWxlcyBmcm9tIG9uZSBET00gZWxlbWVudCB0byBhbm90aGVyLlxuICB1dGlsLmNvcHlFbGVtZW50U3R5bGUgPSBmdW5jdGlvbiAoZnJvbUVsZW1lbnQsIHRvRWxlbWVudCkge1xuICAgIHZhciBmcm9tU3R5bGUgPSB3aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZShmcm9tRWxlbWVudCwgJycpO1xuXG4gICAgaWYgKGZyb21TdHlsZS5jc3NUZXh0ICE9PSAnJykge1xuICAgICAgdG9FbGVtZW50LnN0eWxlLmNzc1RleHQgPSBmcm9tU3R5bGUuY3NzVGV4dDtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB2YXIgY3NzUnVsZXMgPSBbXTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGZyb21TdHlsZS5sZW5ndGg7IGkrKykge1xuICAgICAgLy9jb25zb2xlLmxvZyhpLCBmcm9tU3R5bGVbaV0sIGZyb21TdHlsZS5nZXRQcm9wZXJ0eVZhbHVlKGZyb21TdHlsZVtpXSkpXG4gICAgICAvL3RvRWxlbWVudC5zdHlsZVtmcm9tU3R5bGVbaV1dID0gZnJvbVN0eWxlLmdldFByb3BlcnR5VmFsdWUoZnJvbVN0eWxlW2ldKTtcbiAgICAgIGNzc1J1bGVzLnB1c2goZnJvbVN0eWxlW2ldICsgJzonICsgZnJvbVN0eWxlLmdldFByb3BlcnR5VmFsdWUoZnJvbVN0eWxlW2ldKSArICc7Jyk7XG4gICAgfVxuICAgIHZhciBjc3NUZXh0ID0gY3NzUnVsZXMuam9pbignJyk7XG5cbiAgICB0b0VsZW1lbnQuc3R5bGUuY3NzVGV4dCA9IGNzc1RleHQ7XG4gIH07XG5cbiAgLy8gT2JqZWN0IHRvIGhvbGQgYnJvd3NlciBzbmlmZmluZyBpbmZvLlxuICB2YXIgYnJvd3NlciA9IHtcbiAgICBpc0Nocm9tZTogZmFsc2UsXG4gICAgaXNNb3ppbGxhOiBmYWxzZSxcbiAgICBpc09wZXJhOiBmYWxzZSxcbiAgICBpc0llOiBmYWxzZSxcbiAgICBpc1NhZmFyaTogZmFsc2VcbiAgfTtcblxuICAvLyBTbmlmZiB0aGUgYnJvd3Nlci5cbiAgdmFyIHVhID0gbmF2aWdhdG9yLnVzZXJBZ2VudDtcbiAgaWYodWEuaW5kZXhPZignQ2hyb21lJykgPiAtMSkge1xuICAgIGJyb3dzZXIuaXNDaHJvbWUgPSB0cnVlO1xuICB9IGVsc2UgaWYgKHVhLmluZGV4T2YoJ1NhZmFyaScpID4gLTEpIHtcbiAgICBicm93c2VyLmlzU2FmYXJpID0gdHJ1ZTtcbiAgfSBlbHNlIGlmICh1YS5pbmRleE9mKCdPcGVyYScpID4gLTEpIHtcbiAgICBicm93c2VyLmlzT3BlcmEgPSB0cnVlO1xuICB9IGVsc2UgaWYgKHVhLmluZGV4T2YoJ0ZpcmVmb3gnKSA+IC0xKSB7XG4gICAgYnJvd3Nlci5pc01vemlsbGEgPSB0cnVlO1xuICB9IGVsc2UgaWYgKHVhLmluZGV4T2YoJ01TSUUnKSA+IC0xKSB7XG4gICAgYnJvd3Nlci5pc0llID0gdHJ1ZTtcbiAgfVxuXG4gIHV0aWwuYnJvd3NlciA9IGJyb3dzZXI7XG5cbn07XG5cbn0pLmNhbGwodGhpcyx0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsIDogdHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDogdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9KSIsIihmdW5jdGlvbiAoZ2xvYmFsKXtcbid1c2Ugc3RyaWN0JztcblxudmFyIFJlYWN0ID0gKHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cuUmVhY3QgOiB0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsLlJlYWN0IDogbnVsbCk7XG52YXIgUiA9IFJlYWN0LkRPTTtcbnZhciBfID0gKHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cuXyA6IHR5cGVvZiBnbG9iYWwgIT09IFwidW5kZWZpbmVkXCIgPyBnbG9iYWwuXyA6IG51bGwpO1xuXG4vLyAjIEZvcm1hdGljIHBsdWdpbiBjb3JlXG5cbi8vIEF0IGl0cyBjb3JlLCBGb3JtYXRpYyBpcyBqdXN0IGEgcGx1Z2luIGhvc3QuIEFsbCBvZiB0aGUgZnVuY3Rpb25hbGl0eSBpdCBoYXNcbi8vIG91dCBvZiB0aGUgYm94IGlzIHZpYSBwbHVnaW5zLiBUaGVzZSBwbHVnaW5zIGNhbiBiZSByZXBsYWNlZCBvciBleHRlbmRlZCBieVxuLy8gb3RoZXIgcGx1Z2lucy5cblxuLy8gVGhlIGdsb2JhbCBwbHVnaW4gcmVnaXN0cnkgaG9sZHMgcmVnaXN0ZXJlZCAoYnV0IG5vdCB5ZXQgaW5zdGFudGlhdGVkKVxuLy8gcGx1Z2lucy5cbnZhciBwbHVnaW5SZWdpc3RyeSA9IHt9O1xuXG4vLyBHcm91cCBwbHVnaW5zIGJ5IHByZWZpeC5cbnZhciBwbHVnaW5Hcm91cHMgPSB7fTtcblxuLy8gRm9yIGFub255bW91cyBwbHVnaW5zLCBpbmNyZW1lbnRpbmcgbnVtYmVyIGZvciBuYW1lcy5cbnZhciBwbHVnaW5JZCA9IDA7XG5cbi8vIFJlZ2lzdGVyIGEgcGx1Z2luIG9yIHBsdWdpbiBidW5kbGUgKGFycmF5IG9mIHBsdWdpbnMpIGdsb2JhbGx5LlxudmFyIHJlZ2lzdGVyUGx1Z2luID0gZnVuY3Rpb24gKG5hbWUsIHBsdWdpbkluaXRGbikge1xuXG4gIGlmIChwbHVnaW5SZWdpc3RyeVtuYW1lXSkge1xuICAgIHRocm93IG5ldyBFcnJvcignUGx1Z2luICcgKyBuYW1lICsgJyBpcyBhbHJlYWR5IHJlZ2lzdGVyZWQuJyk7XG4gIH1cblxuICBpZiAoXy5pc0FycmF5KHBsdWdpbkluaXRGbikpIHtcbiAgICBwbHVnaW5SZWdpc3RyeVtuYW1lXSA9IFtdO1xuICAgIHBsdWdpbkluaXRGbi5mb3JFYWNoKGZ1bmN0aW9uIChwbHVnaW5TcGVjKSB7XG4gICAgICByZWdpc3RlclBsdWdpbihwbHVnaW5TcGVjLm5hbWUsIHBsdWdpblNwZWMucGx1Z2luKTtcbiAgICAgIHBsdWdpblJlZ2lzdHJ5W25hbWVdLnB1c2gocGx1Z2luU3BlYy5uYW1lKTtcbiAgICB9KTtcbiAgfSBlbHNlIGlmIChfLmlzT2JqZWN0KHBsdWdpbkluaXRGbikgJiYgIV8uaXNGdW5jdGlvbihwbHVnaW5Jbml0Rm4pKSB7XG4gICAgdmFyIGJ1bmRsZU5hbWUgPSBuYW1lO1xuICAgIHBsdWdpblJlZ2lzdHJ5W2J1bmRsZU5hbWVdID0gW107XG4gICAgT2JqZWN0LmtleXMocGx1Z2luSW5pdEZuKS5mb3JFYWNoKGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgICByZWdpc3RlclBsdWdpbihuYW1lLCBwbHVnaW5Jbml0Rm5bbmFtZV0pO1xuICAgICAgcGx1Z2luUmVnaXN0cnlbYnVuZGxlTmFtZV0ucHVzaChuYW1lKTtcbiAgICB9KTtcbiAgfSBlbHNlIHtcbiAgICBwbHVnaW5SZWdpc3RyeVtuYW1lXSA9IHBsdWdpbkluaXRGbjtcbiAgICAvLyBBZGQgcGx1Z2luIG5hbWUgdG8gcGx1Z2luIGdyb3VwIGlmIGl0IGhhcyBhIHByZWZpeC5cbiAgICBpZiAobmFtZS5pbmRleE9mKCcuJykgPiAwKSB7XG4gICAgICB2YXIgcHJlZml4ID0gbmFtZS5zdWJzdHJpbmcoMCwgbmFtZS5pbmRleE9mKCcuJykpO1xuICAgICAgcGx1Z2luR3JvdXBzW3ByZWZpeF0gPSBwbHVnaW5Hcm91cHNbcHJlZml4XSB8fCBbXTtcbiAgICAgIHBsdWdpbkdyb3Vwc1twcmVmaXhdLnB1c2gobmFtZSk7XG4gICAgfVxuICB9XG59O1xuXG4vLyBEZWZhdWx0IHBsdWdpbiBjb25maWcuIEVhY2gga2V5IHJlcHJlc2VudHMgYSBwbHVnaW4gbmFtZS4gRWFjaCBrZXkgb2YgdGhhdFxuLy8gcGx1Z2luIHJlcHJlc2VudHMgYSBzZXR0aW5nIGZvciB0aGF0IHBsdWdpbi4gUGFzc2VkLWluIGNvbmZpZyB3aWxsIG92ZXJyaWRlXG4vLyBlYWNoIGluZGl2aWR1YWwgc2V0dGluZy5cbnZhciBkZWZhdWx0UGx1Z2luQ29uZmlnID0ge1xuICBjb3JlOiB7XG4gICAgZm9ybWF0aWM6IFsnY29yZS5mb3JtYXRpYyddLFxuICAgIGZvcm06IFsnY29yZS5mb3JtLWluaXQnLCAnY29yZS5mb3JtJywgJ2NvcmUuZmllbGQnXVxuICB9LFxuICAnY29yZS5mb3JtJzoge1xuICAgIHN0b3JlOiAnc3RvcmUubWVtb3J5J1xuICB9LFxuICAnZmllbGQtcm91dGVyJzoge1xuICAgIHJvdXRlczogWydmaWVsZC1yb3V0ZXMnXVxuICB9LFxuICBjb21waWxlcjoge1xuICAgIGNvbXBpbGVyczogWydjb21waWxlci5jaG9pY2VzJywgJ2NvbXBpbGVyLmxvb2t1cCcsICdjb21waWxlci50eXBlcycsICdjb21waWxlci5wcm9wLWFsaWFzZXMnXVxuICB9LFxuICBjb21wb25lbnQ6IHtcbiAgICBwcm9wczogWydkZWZhdWx0LXN0eWxlJ11cbiAgfVxufTtcblxuLy8gIyMgRm9ybWF0aWMgZmFjdG9yeVxuXG4vLyBDcmVhdGUgYSBuZXcgZm9ybWF0aWMgaW5zdGFuY2UuIEEgZm9ybWF0aWMgaW5zdGFuY2UgaXMgYSBmdW5jdGlvbiB0aGF0IGNhblxuLy8gY3JlYXRlIGZvcm1zLiBJdCBhbHNvIGhhcyBhIGAuY3JlYXRlYCBtZXRob2QgdGhhdCBjYW4gY3JlYXRlIG90aGVyIGZvcm1hdGljXG4vLyBpbnN0YW5jZXMuXG52YXIgY3JlYXRlRm9ybWF0aWNDb3JlID0gZnVuY3Rpb24gKGNvbmZpZykge1xuXG4gIC8vIE1ha2UgYSBjb3B5IG9mIGNvbmZpZyBzbyB3ZSBjYW4gbW9ua2V5IHdpdGggaXQuXG4gIGNvbmZpZyA9IF8uZXh0ZW5kKHt9LCBjb25maWcpO1xuXG4gIC8vIEFkZCBkZWZhdWx0IGNvbmZpZyBzZXR0aW5ncyAod2hlcmUgbm90IG92ZXJyaWRkZW4pLlxuICBfLmtleXMoZGVmYXVsdFBsdWdpbkNvbmZpZykuZm9yRWFjaChmdW5jdGlvbiAoa2V5KSB7XG4gICAgY29uZmlnW2tleV0gPSBfLmV4dGVuZCh7fSwgZGVmYXVsdFBsdWdpbkNvbmZpZ1trZXldLCBjb25maWdba2V5XSk7XG4gIH0pO1xuXG4gIC8vIFRoZSBgZm9ybWF0aWNgIHZhcmlhYmxlIHdpbGwgaG9sZCB0aGUgZnVuY3Rpb24gdGhhdCBnZXRzIHJldHVybmVkIGZyb20gdGhlXG4gIC8vIGZhY3RvcnkuXG4gIHZhciBmb3JtYXRpYztcblxuICAvLyBJbnN0YW50aWF0ZWQgcGx1Z2lucyBhcmUgY2FjaGVkIGp1c3QgbGlrZSBDb21tb25KUyBtb2R1bGVzLlxuICB2YXIgcGx1Z2luQ2FjaGUgPSB7fTtcblxuICAvLyAjIyBQbHVnaW4gcHJvdG90eXBlXG5cbiAgLy8gVGhlIFBsdWdpbiBwcm90b3R5cGUgZXhpc3RzIGluc2lkZSB0aGUgRm9ybWF0aWMgZmFjdG9yeSBmdW5jdGlvbiBqdXN0IHRvXG4gIC8vIG1ha2UgaXQgZWFzaWVyIHRvIGdyYWIgdmFsdWVzIGZyb20gdGhlIGNsb3N1cmUuXG5cbiAgLy8gUGx1Z2lucyBhcmUgc2ltaWxhciB0byBDb21tb25KUyBtb2R1bGVzLiBGb3JtYXRpYyB1c2VzIHBsdWdpbnMgYXMgYSBzbGlnaHRcbiAgLy8gdmFyaWFudCB0aG91Z2ggYmVjYXVzZTpcbiAgLy8gLSBGb3JtYXRpYyBwbHVnaW5zIGFyZSBjb25maWd1cmFibGUuXG4gIC8vIC0gRm9ybWF0aWMgcGx1Z2lucyBhcmUgaW5zdGFudGlhdGVkIHBlciBmb3JtYXRpYyBpbnN0YW5jZS4gQ29tbW9uSlMgbW9kdWxlc1xuICAvLyAgIGFyZSBjcmVhdGVkIG9uY2UgYW5kIHdvdWxkIGJlIHNoYXJlZCBhY3Jvc3MgYWxsIGZvcm1hdGljIGluc3RhbmNlcy5cbiAgLy8gLSBGb3JtYXRpYyBwbHVnaW5zIGFyZSBlYXNpbHkgb3ZlcnJpZGFibGUgKGFsc28gdmlhIGNvbmZpZ3VyYXRpb24pLlxuXG4gIC8vIFdoZW4gYSBwbHVnaW4gaXMgaW5zdGFudGlhdGVkLCB3ZSBjYWxsIHRoZSBgUGx1Z2luYCBjb25zdHJ1Y3Rvci4gVGhlIHBsdWdpblxuICAvLyBpbnN0YW5jZSBpcyB0aGVuIHBhc3NlZCB0byB0aGUgcGx1Z2luJ3MgaW5pdGlhbGl6YXRpb24gZnVuY3Rpb24uXG4gIHZhciBQbHVnaW4gPSBmdW5jdGlvbiAobmFtZSwgY29uZmlnKSB7XG4gICAgaWYgKCEodGhpcyBpbnN0YW5jZW9mIFBsdWdpbikpIHtcbiAgICAgIHJldHVybiBuZXcgUGx1Z2luKG5hbWUsIGNvbmZpZyk7XG4gICAgfVxuICAgIC8vIEV4cG9ydHMgYW5hbG9nb3VzIHRvIENvbW1vbkpTIGV4cG9ydHMuXG4gICAgdGhpcy5leHBvcnRzID0ge307XG4gICAgLy8gQ29uZmlnIHZhbHVlcyBwYXNzZWQgaW4gdmlhIGZhY3RvcnkgYXJlIHJvdXRlZCB0byB0aGUgYXBwcm9wcmlhdGVcbiAgICAvLyBwbHVnaW4gYW5kIGF2YWlsYWJsZSB2aWEgYC5jb25maWdgLlxuICAgIHRoaXMuY29uZmlnID0gY29uZmlnIHx8IHt9O1xuICAgIHRoaXMubmFtZSA9IG5hbWU7XG4gIH07XG5cbiAgLy8gR2V0IGEgY29uZmlnIHZhbHVlIGZvciBhIHBsdWdpbiBvciByZXR1cm4gdGhlIGRlZmF1bHQgdmFsdWUuXG4gIFBsdWdpbi5wcm90b3R5cGUuY29uZmlnVmFsdWUgPSBmdW5jdGlvbiAoa2V5LCBkZWZhdWx0VmFsdWUpIHtcblxuICAgIGlmICh0eXBlb2YgdGhpcy5jb25maWdba2V5XSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgIHJldHVybiB0aGlzLmNvbmZpZ1trZXldO1xuICAgIH1cbiAgICByZXR1cm4gZGVmYXVsdFZhbHVlIHx8ICcnO1xuICB9O1xuXG4gIC8vIFJlcXVpcmUgYW5vdGhlciBwbHVnaW4gYnkgbmFtZS4gVGhpcyBpcyBtdWNoIGxpa2UgYSBDb21tb25KUyByZXF1aXJlXG4gIFBsdWdpbi5wcm90b3R5cGUucmVxdWlyZSA9IGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgcmV0dXJuIGZvcm1hdGljLnBsdWdpbihuYW1lKTtcbiAgfTtcblxuICAvLyBIYW5kbGUgYSBzcGVjaWFsIHBsdWdpbiwgdGhlIGBjb21wb25lbnRgIHBsdWdpbiB3aGljaCBmaW5kcyBjb21wb25lbnRzLlxuICB2YXIgY29tcG9uZW50UGx1Z2luO1xuXG4gIC8vIEp1c3QgaGVyZSBpbiBjYXNlIHdlIHdhbnQgdG8gZHluYW1pY2FsbHkgY2hvb3NlIGNvbXBvbmVudCBsYXRlci5cbiAgUGx1Z2luLnByb3RvdHlwZS5jb21wb25lbnQgPSBmdW5jdGlvbiAobmFtZSkge1xuICAgIHJldHVybiBjb21wb25lbnRQbHVnaW4uY29tcG9uZW50KG5hbWUpO1xuICB9O1xuXG4gIC8vIENoZWNrIGlmIGEgcGx1Z2luIGV4aXN0cy5cbiAgUGx1Z2luLnByb3RvdHlwZS5oYXNQbHVnaW4gPSBmdW5jdGlvbiAobmFtZSkge1xuICAgIHJldHVybiAobmFtZSBpbiBwbHVnaW5DYWNoZSkgfHwgKG5hbWUgaW4gcGx1Z2luUmVnaXN0cnkpO1xuICB9O1xuXG4gIC8vIENoZWNrIGlmIGEgY29tcG9uZW50IGV4aXN0cy4gQ29tcG9uZW50cyBhcmUgcmVhbGx5IGp1c3QgcGx1Z2lucyB3aXRoXG4gIC8vIGEgcGFydGljdWxhciBwcmVmaXggdG8gdGhlaXIgbmFtZXMuXG4gIFBsdWdpbi5wcm90b3R5cGUuaGFzQ29tcG9uZW50ID0gZnVuY3Rpb24gKG5hbWUpIHtcbiAgICByZXR1cm4gdGhpcy5oYXNQbHVnaW4oJ2NvbXBvbmVudC4nICsgbmFtZSk7XG4gIH07XG5cbiAgLy8gR2l2ZW4gYSBsaXN0IG9mIHBsdWdpbiBuYW1lcywgcmVxdWlyZSB0aGVtIGFsbCBhbmQgcmV0dXJuIGEgbGlzdCBvZlxuICAvLyBpbnN0YW50aWF0ZWQgcGx1Z2lucy5cbiAgUGx1Z2luLnByb3RvdHlwZS5yZXF1aXJlQWxsID0gZnVuY3Rpb24gKHBsdWdpbkxpc3QpIHtcbiAgICBpZiAoIXBsdWdpbkxpc3QpIHtcbiAgICAgIHBsdWdpbkxpc3QgPSBbXTtcbiAgICB9XG4gICAgaWYgKCFfLmlzQXJyYXkocGx1Z2luTGlzdCkpIHtcbiAgICAgIHBsdWdpbkxpc3QgPSBbcGx1Z2luTGlzdF07XG4gICAgfVxuICAgIC8vIEluZmxhdGUgcmVnaXN0ZXJlZCBidW5kbGVzLiBBIGJ1bmRsZSBpcyBqdXN0IGEgbmFtZSB0aGF0IHBvaW50cyB0byBhblxuICAgIC8vIGFycmF5IG9mIG90aGVyIHBsdWdpbiBuYW1lcy5cbiAgICBwbHVnaW5MaXN0ID0gcGx1Z2luTGlzdC5tYXAoZnVuY3Rpb24gKHBsdWdpbikge1xuICAgICAgaWYgKF8uaXNTdHJpbmcocGx1Z2luKSkge1xuICAgICAgICBpZiAoXy5pc0FycmF5KHBsdWdpblJlZ2lzdHJ5W3BsdWdpbl0pKSB7XG4gICAgICAgICAgcmV0dXJuIHBsdWdpblJlZ2lzdHJ5W3BsdWdpbl07XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiBwbHVnaW47XG4gICAgfSk7XG4gICAgLy8gRmxhdHRlbiBhbnkgYnVuZGxlcywgc28gd2UgZW5kIHVwIHdpdGggYSBmbGF0IGFycmF5IG9mIHBsdWdpbiBuYW1lcy5cbiAgICBwbHVnaW5MaXN0ID0gXy5mbGF0dGVuKHBsdWdpbkxpc3QpO1xuICAgIHJldHVybiBwbHVnaW5MaXN0Lm1hcChmdW5jdGlvbiAocGx1Z2luKSB7XG4gICAgICByZXR1cm4gdGhpcy5yZXF1aXJlKHBsdWdpbik7XG4gICAgfS5iaW5kKHRoaXMpKTtcbiAgfTtcblxuICAvLyBHaXZlbiBhIHByZWZpeCwgcmV0dXJuIGEgbWFwIG9mIGFsbCBpbnN0YW50aWF0ZWQgcGx1Z2lucyB3aXRoIHRoYXQgcHJlZml4LlxuICBQbHVnaW4ucHJvdG90eXBlLnJlcXVpcmVBbGxPZiA9IGZ1bmN0aW9uIChwcmVmaXgpIHtcbiAgICB2YXIgbWFwID0ge307XG5cbiAgICBpZiAocGx1Z2luR3JvdXBzW3ByZWZpeF0pIHtcbiAgICAgIHBsdWdpbkdyb3Vwc1twcmVmaXhdLmZvckVhY2goZnVuY3Rpb24gKG5hbWUpIHtcbiAgICAgICAgbWFwW25hbWVdID0gdGhpcy5yZXF1aXJlKG5hbWUpO1xuICAgICAgfS5iaW5kKHRoaXMpKTtcbiAgICB9XG5cbiAgICByZXR1cm4gbWFwO1xuICB9O1xuXG4gIC8vICMjIEZvcm1hdGljIGZhY3RvcnksIGNvbnRpbnVlZC4uLlxuXG4gIC8vIEdyYWIgYSBwbHVnaW4gZnJvbSB0aGUgY2FjaGUsIG9yIGxvYWQgaXQgZnJlc2ggZnJvbSB0aGUgcmVnaXN0cnkuXG4gIHZhciBsb2FkUGx1Z2luID0gZnVuY3Rpb24gKG5hbWUsIHBsdWdpbkNvbmZpZykge1xuICAgIHZhciBwbHVnaW47XG5cbiAgICAvLyBXZSBjYW4gYWxzbyBsb2FkIGFub255bW91cyBwbHVnaW5zLlxuICAgIGlmIChfLmlzRnVuY3Rpb24obmFtZSkpIHtcblxuICAgICAgdmFyIGZhY3RvcnkgPSBuYW1lO1xuXG4gICAgICBpZiAoXy5pc1VuZGVmaW5lZChmYWN0b3J5Ll9fZXhwb3J0c19fKSkge1xuICAgICAgICBwbHVnaW5JZCsrO1xuICAgICAgICBwbHVnaW4gPSBQbHVnaW4oJ2Fub255bW91c19wbHVnaW5fJyArIHBsdWdpbklkLCBwbHVnaW5Db25maWcgfHwge30pO1xuICAgICAgICBmYWN0b3J5KHBsdWdpbik7XG4gICAgICAgIC8vIFN0b3JlIHRoZSBleHBvcnRzIG9uIHRoZSBhbm9ueW1vdXMgZnVuY3Rpb24gc28gd2Uga25vdyBpdCdzIGFscmVhZHlcbiAgICAgICAgLy8gYmVlbiBpbnN0YW50aWF0ZWQsIGFuZCB3ZSBjYW4ganVzdCBncmFiIHRoZSBleHBvcnRzLlxuICAgICAgICBmYWN0b3J5Ll9fZXhwb3J0c19fID0gcGx1Z2luLmV4cG9ydHM7XG4gICAgICB9XG5cbiAgICAgIC8vIExvYWQgdGhlIGNhY2hlZCBleHBvcnRzLlxuICAgICAgcmV0dXJuIGZhY3RvcnkuX19leHBvcnRzX187XG5cbiAgICB9IGVsc2UgaWYgKF8uaXNVbmRlZmluZWQocGx1Z2luQ2FjaGVbbmFtZV0pKSB7XG5cbiAgICAgIGlmICghcGx1Z2luQ29uZmlnICYmIGNvbmZpZ1tuYW1lXSkge1xuICAgICAgICBpZiAoY29uZmlnW25hbWVdLnBsdWdpbikge1xuICAgICAgICAgIHJldHVybiBsb2FkUGx1Z2luKGNvbmZpZ1tuYW1lXS5wbHVnaW4sIGNvbmZpZ1tuYW1lXSB8fCB7fSk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKHBsdWdpblJlZ2lzdHJ5W25hbWVdKSB7XG4gICAgICAgIGlmIChfLmlzRnVuY3Rpb24ocGx1Z2luUmVnaXN0cnlbbmFtZV0pKSB7XG4gICAgICAgICAgcGx1Z2luID0gUGx1Z2luKG5hbWUsIHBsdWdpbkNvbmZpZyB8fCBjb25maWdbbmFtZV0pO1xuICAgICAgICAgIHBsdWdpblJlZ2lzdHJ5W25hbWVdKHBsdWdpbik7XG4gICAgICAgICAgcGx1Z2luQ2FjaGVbbmFtZV0gPSBwbHVnaW4uZXhwb3J0cztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1BsdWdpbiAnICsgbmFtZSArICcgaXMgbm90IGEgZnVuY3Rpb24uJyk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignUGx1Z2luICcgKyBuYW1lICsgJyBub3QgZm91bmQuJyk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBwbHVnaW5DYWNoZVtuYW1lXTtcbiAgfTtcblxuICAvLyBBc3NpZ24gYGZvcm1hdGljYCB0byBhIGZ1bmN0aW9uIHRoYXQgdGFrZXMgZm9ybSBvcHRpb25zIGFuZCByZXR1cm5zIGEgZm9ybS5cbiAgZm9ybWF0aWMgPSBmdW5jdGlvbiAob3B0aW9ucykge1xuICAgIHJldHVybiBmb3JtYXRpYy5mb3JtKG9wdGlvbnMpO1xuICB9O1xuXG4gIC8vIEFsbG93IGdsb2JhbCBwbHVnaW4gcmVnaXN0cnkgZnJvbSB0aGUgZm9ybWF0aWMgZnVuY3Rpb24gaW5zdGFuY2UuXG4gIGZvcm1hdGljLnJlZ2lzdGVyID0gZnVuY3Rpb24gKG5hbWUsIHBsdWdpbkluaXRGbikge1xuICAgIHJlZ2lzdGVyUGx1Z2luKG5hbWUsIHBsdWdpbkluaXRGbik7XG4gICAgcmV0dXJuIGZvcm1hdGljO1xuICB9O1xuXG4gIC8vIEFsbG93IHJldHJpZXZpbmcgcGx1Z2lucyBmcm9tIHRoZSBmb3JtYXRpYyBmdW5jdGlvbiBpbnN0YW5jZS5cbiAgZm9ybWF0aWMucGx1Z2luID0gZnVuY3Rpb24gKG5hbWUpIHtcbiAgICByZXR1cm4gbG9hZFBsdWdpbihuYW1lKTtcbiAgfTtcblxuICAvLyBBbGxvdyBjcmVhdGluZyBhIG5ldyBmb3JtYXRpYyBpbnN0YW5jZSBmcm9tIGEgZm9ybWF0aWMgaW5zdGFuY2UuXG4gIC8vZm9ybWF0aWMuY3JlYXRlID0gRm9ybWF0aWM7XG5cbiAgLy8gVXNlIHRoZSBjb3JlIHBsdWdpbiB0byBhZGQgbWV0aG9kcyB0byB0aGUgZm9ybWF0aWMgaW5zdGFuY2UuXG4gIHZhciBjb3JlID0gbG9hZFBsdWdpbignY29yZScpO1xuXG4gIGNvcmUoZm9ybWF0aWMpO1xuXG4gIC8vIE5vdyBiaW5kIHRoZSBjb21wb25lbnQgcGx1Z2luLiBXZSB3YWl0IHRpbGwgbm93LCBzbyB0aGUgY29yZSBpcyBsb2FkZWRcbiAgLy8gZmlyc3QuXG4gIGNvbXBvbmVudFBsdWdpbiA9IGxvYWRQbHVnaW4oJ2NvbXBvbmVudCcpO1xuXG4gIC8vIFJldHVybiB0aGUgZm9ybWF0aWMgZnVuY3Rpb24gaW5zdGFuY2UuXG4gIHJldHVybiBmb3JtYXRpYztcbn07XG5cbi8vIEp1c3QgYSBoZWxwZXIgdG8gcmVnaXN0ZXIgYSBidW5jaCBvZiBwbHVnaW5zLlxudmFyIHJlZ2lzdGVyUGx1Z2lucyA9IGZ1bmN0aW9uICgpIHtcbiAgdmFyIGFyZyA9IF8udG9BcnJheShhcmd1bWVudHMpO1xuICBhcmcuZm9yRWFjaChmdW5jdGlvbiAoYXJnKSB7XG4gICAgdmFyIG5hbWUgPSBhcmdbMF07XG4gICAgdmFyIHBsdWdpbiA9IGFyZ1sxXTtcbiAgICByZWdpc3RlclBsdWdpbihuYW1lLCBwbHVnaW4pO1xuICB9KTtcbn07XG5cbi8vIFJlZ2lzdGVyIGFsbCB0aGUgYnVpbHQtaW4gcGx1Z2lucy5cbnJlZ2lzdGVyUGx1Z2lucyhcbiAgWydjb3JlJywgcmVxdWlyZSgnLi9kZWZhdWx0L2NvcmUnKV0sXG5cbiAgWydjb3JlLmZvcm1hdGljJywgcmVxdWlyZSgnLi9jb3JlL2Zvcm1hdGljJyldLFxuICBbJ2NvcmUuZm9ybS1pbml0JywgcmVxdWlyZSgnLi9jb3JlL2Zvcm0taW5pdCcpXSxcbiAgWydjb3JlLmZvcm0nLCByZXF1aXJlKCcuL2NvcmUvZm9ybScpXSxcbiAgWydjb3JlLmZpZWxkJywgcmVxdWlyZSgnLi9jb3JlL2ZpZWxkJyldLFxuXG4gIFsndXRpbCcsIHJlcXVpcmUoJy4vZGVmYXVsdC91dGlsJyldLFxuICBbJ2NvbXBpbGVyJywgcmVxdWlyZSgnLi9kZWZhdWx0L2NvbXBpbGVyJyldLFxuICBbJ2V2YWwnLCByZXF1aXJlKCcuL2RlZmF1bHQvZXZhbCcpXSxcbiAgWydldmFsLWZ1bmN0aW9ucycsIHJlcXVpcmUoJy4vZGVmYXVsdC9ldmFsLWZ1bmN0aW9ucycpXSxcbiAgWydsb2FkZXInLCByZXF1aXJlKCcuL2RlZmF1bHQvbG9hZGVyJyldLFxuICBbJ2ZpZWxkLXJvdXRlcicsIHJlcXVpcmUoJy4vZGVmYXVsdC9maWVsZC1yb3V0ZXInKV0sXG4gIFsnZmllbGQtcm91dGVzJywgcmVxdWlyZSgnLi9kZWZhdWx0L2ZpZWxkLXJvdXRlcycpXSxcblxuICBbJ2NvbXBpbGVyLmNob2ljZXMnLCByZXF1aXJlKCcuL2NvbXBpbGVycy9jaG9pY2VzJyldLFxuICBbJ2NvbXBpbGVyLmxvb2t1cCcsIHJlcXVpcmUoJy4vY29tcGlsZXJzL2xvb2t1cCcpXSxcbiAgWydjb21waWxlci50eXBlcycsIHJlcXVpcmUoJy4vY29tcGlsZXJzL3R5cGVzJyldLFxuICBbJ2NvbXBpbGVyLnByb3AtYWxpYXNlcycsIHJlcXVpcmUoJy4vY29tcGlsZXJzL3Byb3AtYWxpYXNlcycpXSxcblxuICBbJ3N0b3JlLm1lbW9yeScsIHJlcXVpcmUoJy4vc3RvcmUvbWVtb3J5JyldLFxuXG4gIFsndHlwZS5yb290JywgcmVxdWlyZSgnLi90eXBlcy9yb290JyldLFxuICBbJ3R5cGUuc3RyaW5nJywgcmVxdWlyZSgnLi90eXBlcy9zdHJpbmcnKV0sXG4gIFsndHlwZS5vYmplY3QnLCByZXF1aXJlKCcuL3R5cGVzL29iamVjdCcpXSxcbiAgWyd0eXBlLmJvb2xlYW4nLCByZXF1aXJlKCcuL3R5cGVzL2Jvb2xlYW4nKV0sXG4gIFsndHlwZS5hcnJheScsIHJlcXVpcmUoJy4vdHlwZXMvYXJyYXknKV0sXG4gIFsndHlwZS5qc29uJywgcmVxdWlyZSgnLi90eXBlcy9qc29uJyldLFxuICBbJ3R5cGUubnVtYmVyJywgcmVxdWlyZSgnLi90eXBlcy9udW1iZXInKV0sXG5cbiAgWydjb21wb25lbnQnLCByZXF1aXJlKCcuL2RlZmF1bHQvY29tcG9uZW50JyldLFxuXG4gIFsnY29tcG9uZW50LnJvb3QnLCByZXF1aXJlKCcuL2NvbXBvbmVudHMvcm9vdCcpXSxcbiAgWydjb21wb25lbnQuZmllbGQnLCByZXF1aXJlKCcuL2NvbXBvbmVudHMvZmllbGQnKV0sXG4gIFsnY29tcG9uZW50LmxhYmVsJywgcmVxdWlyZSgnLi9jb21wb25lbnRzL2xhYmVsJyldLFxuICBbJ2NvbXBvbmVudC5oZWxwJywgcmVxdWlyZSgnLi9jb21wb25lbnRzL2hlbHAnKV0sXG4gIFsnY29tcG9uZW50LnNhbXBsZScsIHJlcXVpcmUoJy4vY29tcG9uZW50cy9zYW1wbGUnKV0sXG4gIFsnY29tcG9uZW50LmZpZWxkc2V0JywgcmVxdWlyZSgnLi9jb21wb25lbnRzL2ZpZWxkc2V0JyldLFxuICBbJ2NvbXBvbmVudC50ZXh0JywgcmVxdWlyZSgnLi9jb21wb25lbnRzL3RleHQnKV0sXG4gIFsnY29tcG9uZW50LnRleHRhcmVhJywgcmVxdWlyZSgnLi9jb21wb25lbnRzL3RleHRhcmVhJyldLFxuICBbJ2NvbXBvbmVudC5zZWxlY3QnLCByZXF1aXJlKCcuL2NvbXBvbmVudHMvc2VsZWN0JyldLFxuICBbJ2NvbXBvbmVudC5saXN0JywgcmVxdWlyZSgnLi9jb21wb25lbnRzL2xpc3QnKV0sXG4gIFsnY29tcG9uZW50Lmxpc3QtY29udHJvbCcsIHJlcXVpcmUoJy4vY29tcG9uZW50cy9saXN0LWNvbnRyb2wnKV0sXG4gIFsnY29tcG9uZW50Lmxpc3QtaXRlbScsIHJlcXVpcmUoJy4vY29tcG9uZW50cy9saXN0LWl0ZW0nKV0sXG4gIFsnY29tcG9uZW50Lmxpc3QtaXRlbS12YWx1ZScsIHJlcXVpcmUoJy4vY29tcG9uZW50cy9saXN0LWl0ZW0tdmFsdWUnKV0sXG4gIFsnY29tcG9uZW50Lmxpc3QtaXRlbS1jb250cm9sJywgcmVxdWlyZSgnLi9jb21wb25lbnRzL2xpc3QtaXRlbS1jb250cm9sJyldLFxuICBbJ2NvbXBvbmVudC5pdGVtLWNob2ljZXMnLCByZXF1aXJlKCcuL2NvbXBvbmVudHMvaXRlbS1jaG9pY2VzJyldLFxuICBbJ2NvbXBvbmVudC5hZGQtaXRlbScsIHJlcXVpcmUoJy4vY29tcG9uZW50cy9hZGQtaXRlbScpXSxcbiAgWydjb21wb25lbnQucmVtb3ZlLWl0ZW0nLCByZXF1aXJlKCcuL2NvbXBvbmVudHMvcmVtb3ZlLWl0ZW0nKV0sXG4gIFsnY29tcG9uZW50Lm1vdmUtaXRlbS1iYWNrJywgcmVxdWlyZSgnLi9jb21wb25lbnRzL21vdmUtaXRlbS1iYWNrJyldLFxuICBbJ2NvbXBvbmVudC5tb3ZlLWl0ZW0tZm9yd2FyZCcsIHJlcXVpcmUoJy4vY29tcG9uZW50cy9tb3ZlLWl0ZW0tZm9yd2FyZCcpXSxcbiAgWydjb21wb25lbnQuanNvbicsIHJlcXVpcmUoJy4vY29tcG9uZW50cy9qc29uJyldLFxuICBbJ2NvbXBvbmVudC5jaGVja2JveC1saXN0JywgcmVxdWlyZSgnLi9jb21wb25lbnRzL2NoZWNrYm94LWxpc3QnKV0sXG4gIFsnY29tcG9uZW50LnByZXR0eS10ZXh0YXJlYScsIHJlcXVpcmUoJy4vY29tcG9uZW50cy9wcmV0dHktdGV4dGFyZWEnKV0sXG4gIFsnY29tcG9uZW50LmNob2ljZXMnLCByZXF1aXJlKCcuL2NvbXBvbmVudHMvY2hvaWNlcycpXSxcblxuICBbJ21peGluLmNsaWNrLW91dHNpZGUnLCByZXF1aXJlKCcuL21peGlucy9jbGljay1vdXRzaWRlJyldLFxuICBbJ21peGluLmZpZWxkJywgcmVxdWlyZSgnLi9taXhpbnMvZmllbGQnKV0sXG4gIFsnbWl4aW4uaW5wdXQtYWN0aW9ucycsIHJlcXVpcmUoJy4vbWl4aW5zL2lucHV0LWFjdGlvbnMnKV0sXG4gIFsnbWl4aW4ucmVzaXplJywgcmVxdWlyZSgnLi9taXhpbnMvcmVzaXplJyldLFxuICBbJ21peGluLnNjcm9sbCcsIHJlcXVpcmUoJy4vbWl4aW5zL3Njcm9sbCcpXSxcbiAgWydtaXhpbi51bmRvLXN0YWNrJywgcmVxdWlyZSgnLi9taXhpbnMvdW5kby1zdGFjaycpXSxcblxuICBbJ2Jvb3RzdHJhcC1zdHlsZScsIHJlcXVpcmUoJy4vcGx1Z2lucy9ib290c3RyYXAtc3R5bGUnKV0sXG4gIFsnZGVmYXVsdC1zdHlsZScsIHJlcXVpcmUoJy4vcGx1Z2lucy9kZWZhdWx0LXN0eWxlJyldXG4pO1xuXG4vLyBDcmVhdGUgdGhlIGRlZmF1bHQgZm9ybWF0aWMgaW5zdGFuY2UuXG4vL3ZhciBkZWZhdWx0Q29yZSA9IEZvcm1hdGljKCk7XG5cbi8vIEV4cG9ydCBpdCFcbi8vbW9kdWxlLmV4cG9ydHMgPSBkZWZhdWx0Rm9ybWF0aWM7XG5cbnZhciBjcmVhdGVGb3JtYXRpY0NvbXBvbmVudENsYXNzID0gZnVuY3Rpb24gKGNvbmZpZykge1xuXG4gIHZhciBjb3JlID0gY3JlYXRlRm9ybWF0aWNDb3JlKGNvbmZpZyk7XG5cbiAgcmV0dXJuIFJlYWN0LmNyZWF0ZUNsYXNzKHtcblxuICAgIGRpc3BsYXlOYW1lOiAnRm9ybWF0aWMnLFxuXG4gICAgc3RhdGljczoge1xuICAgICAgY29uZmlnOiBjcmVhdGVGb3JtYXRpY0NvbXBvbmVudENsYXNzLFxuICAgICAgZm9ybTogY29yZSxcbiAgICAgIHBsdWdpbjogY29yZS5wbHVnaW5cbiAgICB9LFxuXG4gICAgZ2V0SW5pdGlhbFN0YXRlOiBmdW5jdGlvbiAoKSB7XG4gICAgICB2YXIgZm9ybSA9IHRoaXMucHJvcHMuZm9ybSB8fCB0aGlzLnByb3BzLmRlZmF1bHRGb3JtO1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgZm9ybTogZm9ybSxcbiAgICAgICAgZmllbGQ6IGZvcm0uZmllbGQoKSxcbiAgICAgICAgY29udHJvbGxlZDogdGhpcy5wcm9wcy5mb3JtID8gdHJ1ZSA6IGZhbHNlXG4gICAgICB9O1xuICAgIH0sXG5cbiAgICBjb21wb25lbnREaWRNb3VudDogZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgZm9ybSA9IHRoaXMuc3RhdGUuZm9ybTtcbiAgICAgIGlmICghZm9ybSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ011c3Qgc3VwcGx5IGEgZm9ybSBvciBkZWZhdWx0Rm9ybS4nKTtcbiAgICAgIH1cbiAgICAgIGlmICh0aGlzLnN0YXRlLmNvbnRyb2xsZWQpIHtcbiAgICAgICAgZm9ybS5vbmNlKCdjaGFuZ2UnLCB0aGlzLm9uRm9ybUNoYW5nZWQpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZm9ybS5vbignY2hhbmdlJywgdGhpcy5vbkZvcm1DaGFuZ2VkKTtcbiAgICAgIH1cbiAgICB9LFxuXG4gICAgb25Gb3JtQ2hhbmdlZDogZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICBpZiAodGhpcy5wcm9wcy5vbkNoYW5nZSkge1xuICAgICAgICB0aGlzLnByb3BzLm9uQ2hhbmdlKHRoaXMuc3RhdGUuZm9ybS52YWwoKSwgZXZlbnQuY2hhbmdpbmcpO1xuICAgICAgfVxuICAgICAgaWYgKCF0aGlzLnN0YXRlLmNvbnRyb2xsZWQpIHtcbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICAgICAgZmllbGQ6IHRoaXMuc3RhdGUuZm9ybS5maWVsZCgpXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH0sXG5cbiAgICBjb21wb25lbnRXaWxsVW5tb3VudDogZnVuY3Rpb24gKCkge1xuICAgICAgdmFyIGZvcm0gPSB0aGlzLnN0YXRlLmZvcm07XG4gICAgICBpZiAoZm9ybSkge1xuICAgICAgICBmb3JtLm9mZignY2hhbmdlJywgdGhpcy5vbkZvcm1DaGFuZ2VkKTtcbiAgICAgIH1cbiAgICB9LFxuXG4gICAgY29tcG9uZW50V2lsbFJlY2VpdmVQcm9wczogZnVuY3Rpb24gKG5leHRQcm9wcykge1xuICAgICAgaWYgKHRoaXMuc3RhdGUuY29udHJvbGxlZCkge1xuICAgICAgICBpZiAoIW5leHRQcm9wcy5mb3JtKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdNdXN0IHN1cHBseSBhIG5ldyBmb3JtIGZvciBhIGNvbnRyb2xsZWQgY29tcG9uZW50LicpO1xuICAgICAgICB9XG4gICAgICAgIG5leHRQcm9wcy5mb3JtLm9uY2UoJ2NoYW5nZScsIHRoaXMub25Gb3JtQ2hhbmdlZCk7XG4gICAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICAgIGZvcm06IG5leHRQcm9wcy5mb3JtLFxuICAgICAgICAgIGZpZWxkOiBuZXh0UHJvcHMuZm9ybS5maWVsZCgpXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH0sXG5cbiAgICByZW5kZXI6IGZ1bmN0aW9uICgpIHtcbiAgICAgIHJldHVybiBSLmRpdih7Y2xhc3NOYW1lOiAnZm9ybWF0aWMnfSxcbiAgICAgICAgdGhpcy5zdGF0ZS5maWVsZC5jb21wb25lbnQoKVxuICAgICAgKTtcbiAgICB9XG4gIH0pO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBjcmVhdGVGb3JtYXRpY0NvbXBvbmVudENsYXNzKCk7XG5cbn0pLmNhbGwodGhpcyx0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsIDogdHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDogdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9KSIsIihmdW5jdGlvbiAoZ2xvYmFsKXtcbi8vICMgbWl4aW4uY2xpY2stb3V0c2lkZVxuXG4vKlxuVGhlcmUncyBubyBuYXRpdmUgUmVhY3Qgd2F5IHRvIGRldGVjdCBjbGlja2luZyBvdXRzaWRlIGFuIGVsZW1lbnQuIFNvbWV0aW1lc1xudGhpcyBpcyB1c2VmdWwsIHNvIHRoYXQncyB3aGF0IHRoaXMgbWl4aW4gZG9lcy4gVG8gdXNlIGl0LCBtaXggaXQgaW4gYW5kIHVzZSBpdFxuZnJvbSB5b3VyIGNvbXBvbmVudCBsaWtlIHRoaXM6XG5cbmBgYGpzXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChwbHVnaW4pIHtcbiAgcGx1Z2luLmV4cG9ydHMgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG5cbiAgICBtaXhpbnM6IFtwbHVnaW4ucmVxdWlyZSgnbWl4aW4uY2xpY2stb3V0c2lkZScpXSxcblxuICAgIG9uQ2xpY2tPdXRzaWRlOiBmdW5jdGlvbiAoKSB7XG4gICAgICBjb25zb2xlLmxvZygnY2xpY2tlZCBvdXRzaWRlIScpO1xuICAgIH0sXG5cbiAgICBjb21wb25lbnREaWRNb3VudDogZnVuY3Rpb24gKCkge1xuICAgICAgdGhpcy5zZXRPbkNsaWNrT3V0c2lkZSgnbXlEaXYnLCB0aGlzLm9uQ2xpY2tPdXRzaWRlKTtcbiAgICB9LFxuXG4gICAgcmVuZGVyOiBmdW5jdGlvbiAoKSB7XG4gICAgICByZXR1cm4gUmVhY3QuRE9NLmRpdih7cmVmOiAnbXlEaXYnfSxcbiAgICAgICAgJ0hlbGxvISdcbiAgICAgIClcbiAgICB9XG4gIH0pO1xufTtcbmBgYFxuKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgXyA9ICh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93Ll8gOiB0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsLl8gOiBudWxsKTtcblxudmFyIGhhc0FuY2VzdG9yID0gZnVuY3Rpb24gKGNoaWxkLCBwYXJlbnQpIHtcbiAgaWYgKGNoaWxkLnBhcmVudE5vZGUgPT09IHBhcmVudCkge1xuICAgIHJldHVybiB0cnVlO1xuICB9XG4gIGlmIChjaGlsZC5wYXJlbnROb2RlID09PSBudWxsKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIHJldHVybiBoYXNBbmNlc3RvcihjaGlsZC5wYXJlbnROb2RlLCBwYXJlbnQpO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAocGx1Z2luKSB7XG5cbiAgcGx1Z2luLmV4cG9ydHMgPSB7XG5cbiAgICAvLyBfb25DbGlja0RvY3VtZW50OiBmdW5jdGlvbihldmVudCkge1xuICAgIC8vICAgY29uc29sZS5sb2coJ2NsaWNrIGRvYycpXG4gICAgLy8gICBpZiAodGhpcy5fZGlkTW91c2VEb3duKSB7XG4gICAgLy8gICAgIF8uZWFjaCh0aGlzLmNsaWNrT3V0c2lkZUhhbmRsZXJzLCBmdW5jdGlvbiAoZnVuY3MsIHJlZikge1xuICAgIC8vICAgICAgIGlmIChpc091dHNpZGUoZXZlbnQudGFyZ2V0LCB0aGlzLnJlZnNbcmVmXS5nZXRET01Ob2RlKCkpKSB7XG4gICAgLy8gICAgICAgICBmdW5jcy5mb3JFYWNoKGZ1bmN0aW9uIChmbikge1xuICAgIC8vICAgICAgICAgICBmbi5jYWxsKHRoaXMpO1xuICAgIC8vICAgICAgICAgfS5iaW5kKHRoaXMpKTtcbiAgICAvLyAgICAgICB9XG4gICAgLy8gICAgIH0uYmluZCh0aGlzKSk7XG4gICAgLy8gICB9XG4gICAgLy8gfSxcblxuICAgIGlzTm9kZU91dHNpZGU6IGZ1bmN0aW9uIChub2RlT3V0LCBub2RlSW4pIHtcbiAgICAgIGlmIChub2RlT3V0ID09PSBub2RlSW4pIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgICAgaWYgKGhhc0FuY2VzdG9yKG5vZGVPdXQsIG5vZGVJbikpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSxcblxuICAgIGlzTm9kZUluc2lkZTogZnVuY3Rpb24gKG5vZGVJbiwgbm9kZU91dCkge1xuICAgICAgcmV0dXJuICF0aGlzLmlzTm9kZU91dHNpZGUobm9kZUluLCBub2RlT3V0KTtcbiAgICB9LFxuXG4gICAgX29uQ2xpY2tNb3VzZWRvd246IGZ1bmN0aW9uKCkge1xuICAgICAgLy90aGlzLl9kaWRNb3VzZURvd24gPSB0cnVlO1xuICAgICAgXy5lYWNoKHRoaXMuY2xpY2tPdXRzaWRlSGFuZGxlcnMsIGZ1bmN0aW9uIChmdW5jcywgcmVmKSB7XG4gICAgICAgIGlmICh0aGlzLnJlZnNbcmVmXSkge1xuICAgICAgICAgIHRoaXMuX21vdXNlZG93blJlZnNbcmVmXSA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgIH0uYmluZCh0aGlzKSk7XG4gICAgfSxcblxuICAgIF9vbkNsaWNrTW91c2V1cDogZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICBfLmVhY2godGhpcy5jbGlja091dHNpZGVIYW5kbGVycywgZnVuY3Rpb24gKGZ1bmNzLCByZWYpIHtcbiAgICAgICAgaWYgKHRoaXMucmVmc1tyZWZdICYmIHRoaXMuX21vdXNlZG93blJlZnNbcmVmXSkge1xuICAgICAgICAgIGlmICh0aGlzLmlzTm9kZU91dHNpZGUoZXZlbnQudGFyZ2V0LCB0aGlzLnJlZnNbcmVmXS5nZXRET01Ob2RlKCkpKSB7XG4gICAgICAgICAgICBmdW5jcy5mb3JFYWNoKGZ1bmN0aW9uIChmbikge1xuICAgICAgICAgICAgICBmbi5jYWxsKHRoaXMsIGV2ZW50KTtcbiAgICAgICAgICAgIH0uYmluZCh0aGlzKSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHRoaXMuX21vdXNlZG93blJlZnNbcmVmXSA9IGZhbHNlO1xuICAgICAgfS5iaW5kKHRoaXMpKTtcbiAgICB9LFxuXG4gICAgLy8gX29uQ2xpY2tEb2N1bWVudDogZnVuY3Rpb24gKCkge1xuICAgIC8vICAgY29uc29sZS5sb2coJ2NsaWNrZXR5JylcbiAgICAvLyAgIF8uZWFjaCh0aGlzLmNsaWNrT3V0c2lkZUhhbmRsZXJzLCBmdW5jdGlvbiAoZnVuY3MsIHJlZikge1xuICAgIC8vICAgICBjb25zb2xlLmxvZygnY2xpY2tldHknLCByZWYsIHRoaXMucmVmc1tyZWZdKVxuICAgIC8vICAgfS5iaW5kKHRoaXMpKTtcbiAgICAvLyB9LFxuXG4gICAgc2V0T25DbGlja091dHNpZGU6IGZ1bmN0aW9uIChyZWYsIGZuKSB7XG4gICAgICBpZiAoIXRoaXMuY2xpY2tPdXRzaWRlSGFuZGxlcnNbcmVmXSkge1xuICAgICAgICB0aGlzLmNsaWNrT3V0c2lkZUhhbmRsZXJzW3JlZl0gPSBbXTtcbiAgICAgIH1cbiAgICAgIHRoaXMuY2xpY2tPdXRzaWRlSGFuZGxlcnNbcmVmXS5wdXNoKGZuKTtcbiAgICB9LFxuXG4gICAgY29tcG9uZW50RGlkTW91bnQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgIHRoaXMuY2xpY2tPdXRzaWRlSGFuZGxlcnMgPSB7fTtcbiAgICAgIHRoaXMuX2RpZE1vdXNlRG93biA9IGZhbHNlO1xuICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgdGhpcy5fb25DbGlja01vdXNlZG93bik7XG4gICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdtb3VzZXVwJywgdGhpcy5fb25DbGlja01vdXNldXApO1xuICAgICAgLy9kb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIHRoaXMuX29uQ2xpY2tEb2N1bWVudCk7XG4gICAgICB0aGlzLl9tb3VzZWRvd25SZWZzID0ge307XG4gICAgfSxcblxuICAgIGNvbXBvbmVudFdpbGxVbm1vdW50OiBmdW5jdGlvbiAoKSB7XG4gICAgICB0aGlzLmNsaWNrT3V0c2lkZUhhbmRsZXJzID0ge307XG4gICAgICAvL2RvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgdGhpcy5fb25DbGlja0RvY3VtZW50KTtcbiAgICAgIGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21vdXNldXAnLCB0aGlzLl9vbkNsaWNrTW91c2V1cCk7XG4gICAgICBkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCB0aGlzLl9vbkNsaWNrTW91c2Vkb3duKTtcbiAgICB9XG4gIH07XG59O1xuXG59KS5jYWxsKHRoaXMsdHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbCA6IHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiID8gc2VsZiA6IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB7fSkiLCIoZnVuY3Rpb24gKGdsb2JhbCl7XG4vLyAjIG1peGluLmZpZWxkXG5cbi8qXG5XcmFwIHVwIHlvdXIgZmllbGRzIHdpdGggdGhpcyBtaXhpbiB0byBnZXQ6XG4tIEF1dG9tYXRpYyBtZXRhZGF0YSBsb2FkaW5nLlxuLSBBbnl0aGluZyBlbHNlIGRlY2lkZWQgbGF0ZXIuXG4qL1xuXG4ndXNlIHN0cmljdCc7XG5cbnZhciBfID0gKHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cuXyA6IHR5cGVvZiBnbG9iYWwgIT09IFwidW5kZWZpbmVkXCIgPyBnbG9iYWwuXyA6IG51bGwpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChwbHVnaW4pIHtcblxuICBwbHVnaW4uZXhwb3J0cyA9IHtcblxuICAgIGxvYWROZWVkZWRNZXRhOiBmdW5jdGlvbiAocHJvcHMpIHtcbiAgICAgIGlmIChwcm9wcy5maWVsZCAmJiBwcm9wcy5maWVsZC5mb3JtKSB7XG4gICAgICAgIGlmIChwcm9wcy5maWVsZC5kZWYubmVlZHNNZXRhICYmIHByb3BzLmZpZWxkLmRlZi5uZWVkc01ldGEubGVuZ3RoID4gMCkge1xuXG4gICAgICAgICAgdmFyIG5lZWRzTWV0YSA9IFtdO1xuXG4gICAgICAgICAgcHJvcHMuZmllbGQuZGVmLm5lZWRzTWV0YS5mb3JFYWNoKGZ1bmN0aW9uIChhcmdzKSB7XG4gICAgICAgICAgICBpZiAoXy5pc0FycmF5KGFyZ3MpICYmIGFyZ3MubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICBpZiAoXy5pc0FycmF5KGFyZ3NbMF0pKSB7XG4gICAgICAgICAgICAgICAgYXJncy5mb3JFYWNoKGZ1bmN0aW9uIChhcmdzKSB7XG4gICAgICAgICAgICAgICAgICBuZWVkc01ldGEucHVzaChhcmdzKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBuZWVkc01ldGEucHVzaChhcmdzKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgaWYgKG5lZWRzTWV0YS5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIC8vIE11c3QganVzdCBiZSBhIHNpbmdsZSBuZWVkLCBhbmQgbm90IGFuIGFycmF5LlxuICAgICAgICAgICAgbmVlZHNNZXRhID0gW3Byb3BzLmZpZWxkLmRlZi5uZWVkc01ldGFdO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIG5lZWRzTWV0YS5mb3JFYWNoKGZ1bmN0aW9uIChuZWVkcykge1xuICAgICAgICAgICAgaWYgKG5lZWRzKSB7XG4gICAgICAgICAgICAgIHByb3BzLmZpZWxkLmZvcm0ubG9hZE1ldGEuYXBwbHkocHJvcHMuZmllbGQuZm9ybSwgbmVlZHMpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSxcblxuICAgIGNvbXBvbmVudERpZE1vdW50OiBmdW5jdGlvbiAoKSB7XG4gICAgICB0aGlzLmxvYWROZWVkZWRNZXRhKHRoaXMucHJvcHMpO1xuICAgIH0sXG5cbiAgICBjb21wb25lbnRXaWxsUmVjZWl2ZVByb3BzOiBmdW5jdGlvbiAobmV4dFByb3BzKSB7XG4gICAgICB0aGlzLmxvYWROZWVkZWRNZXRhKG5leHRQcm9wcyk7XG4gICAgfSxcblxuICAgIGNvbXBvbmVudFdpbGxVbm1vdW50OiBmdW5jdGlvbiAoKSB7XG4gICAgICAvLyBSZW1vdmluZyB0aGlzIGFzIGl0J3MgYSBiYWQgaWRlYSwgYmVjYXVzZSB1bm1vdW50aW5nIGEgY29tcG9uZW50IGlzIG5vdFxuICAgICAgLy8gYWx3YXlzIGEgc2lnbmFsIHRvIHJlbW92ZSB0aGUgZmllbGQuIFdpbGwgaGF2ZSB0byBmaW5kIGEgYmV0dGVyIHdheS5cblxuICAgICAgLy8gaWYgKHRoaXMucHJvcHMuZmllbGQpIHtcbiAgICAgIC8vICAgdGhpcy5wcm9wcy5maWVsZC5lcmFzZSgpO1xuICAgICAgLy8gfVxuICAgIH1cbiAgfTtcbn07XG5cbn0pLmNhbGwodGhpcyx0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsIDogdHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDogdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9KSIsIi8vICMgbWl4aW4uaW5wdXQtYWN0aW9uc1xuXG4vKlxuQ3VycmVudGx5IHVudXNlZC5cbiovXG5cbid1c2Ugc3RyaWN0JztcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAocGx1Z2luKSB7XG5cbiAgcGx1Z2luLmV4cG9ydHMgPSB7XG5cbiAgICBvbkZvY3VzOiBmdW5jdGlvbiAoKSB7XG5cbiAgICB9LFxuXG4gICAgb25CbHVyOiBmdW5jdGlvbiAoKSB7XG5cbiAgICB9LFxuXG4gICAgb25DaGFuZ2U6IGZ1bmN0aW9uICgpIHtcblxuICAgIH1cbiAgfTtcbn07XG4iLCIvLyAjIG1peGluLnJlc2l6ZVxuXG4vKlxuWW91J2QgdGhpbmsgaXQgd291bGQgYmUgcHJldHR5IGVhc3kgdG8gZGV0ZWN0IHdoZW4gYSBET00gZWxlbWVudCBpcyByZXNpemVkLlxuQW5kIHlvdSdkIGJlIHdyb25nLiBUaGVyZSBhcmUgdmFyaW91cyB0cmlja3MsIGJ1dCBub25lIG9mIHRoZW0gd29yayB2ZXJ5IHdlbGwuXG5TbywgdXNpbmcgZ29vZCBvbCcgcG9sbGluZyBoZXJlLiBUbyB0cnkgdG8gYmUgYXMgZWZmaWNpZW50IGFzIHBvc3NpYmxlLCB0aGVyZVxuaXMgb25seSBhIHNpbmdsZSBzZXRJbnRlcnZhbCB1c2VkIGZvciBhbGwgZWxlbWVudHMuIFRvIHVzZTpcblxuYGBganNcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKHBsdWdpbikge1xuICBwbHVnaW4uZXhwb3J0cyA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcblxuICAgIG1peGluczogW3BsdWdpbi5yZXF1aXJlKCdtaXhpbi5yZXNpemUnKV0sXG5cbiAgICBvblJlc2l6ZTogZnVuY3Rpb24gKCkge1xuICAgICAgY29uc29sZS5sb2coJ3Jlc2l6ZWQhJyk7XG4gICAgfSxcblxuICAgIGNvbXBvbmVudERpZE1vdW50OiBmdW5jdGlvbiAoKSB7XG4gICAgICB0aGlzLnNldE9uUmVzaXplKCdteVRleHQnLCB0aGlzLm9uUmVzaXplKTtcbiAgICB9LFxuXG4gICAgb25DaGFuZ2U6IGZ1bmN0aW9uICgpIHtcbiAgICAgIC4uLlxuICAgIH0sXG5cbiAgICByZW5kZXI6IGZ1bmN0aW9uICgpIHtcbiAgICAgIHJldHVybiBSZWFjdC5ET00udGV4dGFyZWEoe3JlZjogJ215VGV4dCcsIHZhbHVlOiB0aGlzLnByb3BzLnZhbHVlLCBvbkNoYW5nZTogLi4ufSlcbiAgICB9XG4gIH0pO1xufTtcbmBgYFxuKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgaWQgPSAwO1xuXG52YXIgcmVzaXplSW50ZXJ2YWxFbGVtZW50cyA9IHt9O1xudmFyIHJlc2l6ZUludGVydmFsRWxlbWVudHNDb3VudCA9IDA7XG52YXIgcmVzaXplSW50ZXJ2YWxUaW1lciA9IG51bGw7XG5cbnZhciBjaGVja0VsZW1lbnRzID0gZnVuY3Rpb24gKCkge1xuICBPYmplY3Qua2V5cyhyZXNpemVJbnRlcnZhbEVsZW1lbnRzKS5mb3JFYWNoKGZ1bmN0aW9uIChrZXkpIHtcbiAgICB2YXIgZWxlbWVudCA9IHJlc2l6ZUludGVydmFsRWxlbWVudHNba2V5XTtcbiAgICBpZiAoZWxlbWVudC5jbGllbnRXaWR0aCAhPT0gZWxlbWVudC5fX3ByZXZDbGllbnRXaWR0aCB8fCBlbGVtZW50LmNsaWVudEhlaWdodCAhPT0gZWxlbWVudC5fX3ByZXZDbGllbnRIZWlnaHQpIHtcbiAgICAgIGVsZW1lbnQuX19wcmV2Q2xpZW50V2lkdGggPSBlbGVtZW50LmNsaWVudFdpZHRoO1xuICAgICAgZWxlbWVudC5fX3ByZXZDbGllbnRIZWlnaHQgPSBlbGVtZW50LmNsaWVudEhlaWdodDtcbiAgICAgIHZhciBoYW5kbGVycyA9IGVsZW1lbnQuX19yZXNpemVIYW5kbGVycztcbiAgICAgIGhhbmRsZXJzLmZvckVhY2goZnVuY3Rpb24gKGhhbmRsZXIpIHtcbiAgICAgICAgaGFuZGxlcigpO1xuICAgICAgfSk7XG4gICAgfVxuICB9LCAxMDApO1xufTtcblxudmFyIGFkZFJlc2l6ZUludGVydmFsSGFuZGxlciA9IGZ1bmN0aW9uIChlbGVtZW50LCBmbikge1xuICBpZiAocmVzaXplSW50ZXJ2YWxUaW1lciA9PT0gbnVsbCkge1xuICAgIHJlc2l6ZUludGVydmFsVGltZXIgPSBzZXRJbnRlcnZhbChjaGVja0VsZW1lbnRzLCAxMDApO1xuICB9XG4gIGlmICghKCdfX3Jlc2l6ZUlkJyBpbiBlbGVtZW50KSkge1xuICAgIGlkKys7XG4gICAgZWxlbWVudC5fX3ByZXZDbGllbnRXaWR0aCA9IGVsZW1lbnQuY2xpZW50V2lkdGg7XG4gICAgZWxlbWVudC5fX3ByZXZDbGllbnRIZWlnaHQgPSBlbGVtZW50LmNsaWVudEhlaWdodDtcbiAgICBlbGVtZW50Ll9fcmVzaXplSWQgPSBpZDtcbiAgICByZXNpemVJbnRlcnZhbEVsZW1lbnRzQ291bnQrKztcbiAgICByZXNpemVJbnRlcnZhbEVsZW1lbnRzW2lkXSA9IGVsZW1lbnQ7XG4gICAgZWxlbWVudC5fX3Jlc2l6ZUhhbmRsZXJzID0gW107XG4gIH1cbiAgZWxlbWVudC5fX3Jlc2l6ZUhhbmRsZXJzLnB1c2goZm4pO1xufTtcblxudmFyIHJlbW92ZVJlc2l6ZUludGVydmFsSGFuZGxlcnMgPSBmdW5jdGlvbiAoZWxlbWVudCkge1xuICBpZiAoISgnX19yZXNpemVJZCcgaW4gZWxlbWVudCkpIHtcbiAgICByZXR1cm47XG4gIH1cbiAgdmFyIGlkID0gZWxlbWVudC5fX3Jlc2l6ZUlkO1xuICBkZWxldGUgZWxlbWVudC5fX3Jlc2l6ZUlkO1xuICBkZWxldGUgZWxlbWVudC5fX3Jlc2l6ZUhhbmRsZXJzO1xuICBkZWxldGUgcmVzaXplSW50ZXJ2YWxFbGVtZW50c1tpZF07XG4gIHJlc2l6ZUludGVydmFsRWxlbWVudHNDb3VudC0tO1xuICBpZiAocmVzaXplSW50ZXJ2YWxFbGVtZW50c0NvdW50IDwgMSkge1xuICAgIGNsZWFySW50ZXJ2YWwocmVzaXplSW50ZXJ2YWxUaW1lcik7XG4gICAgcmVzaXplSW50ZXJ2YWxUaW1lciA9IG51bGw7XG4gIH1cbn07XG5cbnZhciBvblJlc2l6ZSA9IGZ1bmN0aW9uIChyZWYsIGZuKSB7XG4gIGZuKHJlZik7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChwbHVnaW4pIHtcblxuICBwbHVnaW4uZXhwb3J0cyA9IHtcblxuICAgIGNvbXBvbmVudERpZE1vdW50OiBmdW5jdGlvbiAoKSB7XG4gICAgICBpZiAodGhpcy5vblJlc2l6ZVdpbmRvdykge1xuICAgICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigncmVzaXplJywgdGhpcy5vblJlc2l6ZVdpbmRvdyk7XG4gICAgICB9XG4gICAgICB0aGlzLnJlc2l6ZUVsZW1lbnRSZWZzID0ge307XG4gICAgfSxcblxuICAgIGNvbXBvbmVudFdpbGxVbm1vdW50OiBmdW5jdGlvbiAoKSB7XG4gICAgICBpZiAodGhpcy5vblJlc2l6ZVdpbmRvdykge1xuICAgICAgICB3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lcigncmVzaXplJywgdGhpcy5vblJlc2l6ZVdpbmRvdyk7XG4gICAgICB9XG4gICAgICBPYmplY3Qua2V5cyh0aGlzLnJlc2l6ZUVsZW1lbnRSZWZzKS5mb3JFYWNoKGZ1bmN0aW9uIChyZWYpIHtcbiAgICAgICAgcmVtb3ZlUmVzaXplSW50ZXJ2YWxIYW5kbGVycyh0aGlzLnJlZnNbcmVmXS5nZXRET01Ob2RlKCkpO1xuICAgICAgfS5iaW5kKHRoaXMpKTtcbiAgICB9LFxuXG4gICAgc2V0T25SZXNpemU6IGZ1bmN0aW9uIChyZWYsIGZuKSB7XG4gICAgICBpZiAoIXRoaXMucmVzaXplRWxlbWVudFJlZnNbcmVmXSkge1xuICAgICAgICB0aGlzLnJlc2l6ZUVsZW1lbnRSZWZzW3JlZl0gPSB0cnVlO1xuICAgICAgfVxuICAgICAgYWRkUmVzaXplSW50ZXJ2YWxIYW5kbGVyKHRoaXMucmVmc1tyZWZdLmdldERPTU5vZGUoKSwgb25SZXNpemUuYmluZCh0aGlzLCByZWYsIGZuKSk7XG4gICAgfVxuICB9O1xufTtcbiIsIi8vICMgbWl4aW4uc2Nyb2xsXG5cbid1c2Ugc3RyaWN0JztcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAocGx1Z2luKSB7XG5cbiAgcGx1Z2luLmV4cG9ydHMgPSB7XG5cbiAgICBjb21wb25lbnREaWRNb3VudDogZnVuY3Rpb24gKCkge1xuICAgICAgaWYgKHRoaXMub25TY3JvbGxXaW5kb3cpIHtcbiAgICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3Njcm9sbCcsIHRoaXMub25TY3JvbGxXaW5kb3cpO1xuICAgICAgfVxuICAgIH0sXG5cbiAgICBjb21wb25lbnRXaWxsVW5tb3VudDogZnVuY3Rpb24gKCkge1xuICAgICAgaWYgKHRoaXMub25TY3JvbGxXaW5kb3cpIHtcbiAgICAgICAgd2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3Njcm9sbCcsIHRoaXMub25TY3JvbGxXaW5kb3cpO1xuICAgICAgfVxuICAgIH1cbiAgfTtcbn07XG4iLCIvLyAjIG1peGluLnVuZG8tc3RhY2tcblxuLypcbkdpdmVzIHlvdXIgY29tcG9uZW50IGFuIHVuZG8gc3RhY2suXG4qL1xuXG4vLyBodHRwOi8vcHJvbWV0aGV1c3Jlc2VhcmNoLmdpdGh1Yi5pby9yZWFjdC1mb3Jtcy9leGFtcGxlcy91bmRvLmh0bWxcblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgVW5kb1N0YWNrID0ge1xuICBnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB7dW5kbzogW10sIHJlZG86IFtdfTtcbiAgfSxcblxuICBzbmFwc2hvdDogZnVuY3Rpb24oKSB7XG4gICAgdmFyIHVuZG8gPSB0aGlzLnN0YXRlLnVuZG8uY29uY2F0KHRoaXMuZ2V0U3RhdGVTbmFwc2hvdCgpKTtcbiAgICBpZiAodHlwZW9mIHRoaXMuc3RhdGUudW5kb0RlcHRoID09PSAnbnVtYmVyJykge1xuICAgICAgaWYgKHVuZG8ubGVuZ3RoID4gdGhpcy5zdGF0ZS51bmRvRGVwdGgpIHtcbiAgICAgICAgdW5kby5zaGlmdCgpO1xuICAgICAgfVxuICAgIH1cbiAgICB0aGlzLnNldFN0YXRlKHt1bmRvOiB1bmRvLCByZWRvOiBbXX0pO1xuICB9LFxuXG4gIGhhc1VuZG86IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLnN0YXRlLnVuZG8ubGVuZ3RoID4gMDtcbiAgfSxcblxuICBoYXNSZWRvOiBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcy5zdGF0ZS5yZWRvLmxlbmd0aCA+IDA7XG4gIH0sXG5cbiAgcmVkbzogZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5fdW5kb0ltcGwodHJ1ZSk7XG4gIH0sXG5cbiAgdW5kbzogZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5fdW5kb0ltcGwoKTtcbiAgfSxcblxuICBfdW5kb0ltcGw6IGZ1bmN0aW9uKGlzUmVkbykge1xuICAgIHZhciB1bmRvID0gdGhpcy5zdGF0ZS51bmRvLnNsaWNlKDApO1xuICAgIHZhciByZWRvID0gdGhpcy5zdGF0ZS5yZWRvLnNsaWNlKDApO1xuICAgIHZhciBzbmFwc2hvdDtcblxuICAgIGlmIChpc1JlZG8pIHtcbiAgICAgIGlmIChyZWRvLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBzbmFwc2hvdCA9IHJlZG8ucG9wKCk7XG4gICAgICB1bmRvLnB1c2godGhpcy5nZXRTdGF0ZVNuYXBzaG90KCkpO1xuICAgIH0gZWxzZSB7XG4gICAgICBpZiAodW5kby5sZW5ndGggPT09IDApIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgc25hcHNob3QgPSB1bmRvLnBvcCgpO1xuICAgICAgcmVkby5wdXNoKHRoaXMuZ2V0U3RhdGVTbmFwc2hvdCgpKTtcbiAgICB9XG5cbiAgICB0aGlzLnNldFN0YXRlU25hcHNob3Qoc25hcHNob3QpO1xuICAgIHRoaXMuc2V0U3RhdGUoe3VuZG86dW5kbywgcmVkbzpyZWRvfSk7XG4gIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKHBsdWdpbikge1xuICBwbHVnaW4uZXhwb3J0cyA9IFVuZG9TdGFjaztcbn07XG4iLCIoZnVuY3Rpb24gKGdsb2JhbCl7XG4vLyAjIGJvb3RzdHJhcFxuXG4vKlxuVGhlIGJvb3RzdHJhcCBwbHVnaW4gYnVuZGxlIGV4cG9ydHMgYSBidW5jaCBvZiBcInByb3AgbW9kaWZpZXJcIiBwbHVnaW5zIHdoaWNoXG5tYW5pcHVsYXRlIHRoZSBwcm9wcyBnb2luZyBpbnRvIG1hbnkgb2YgdGhlIGNvbXBvbmVudHMuXG4qL1xuXG4ndXNlIHN0cmljdCc7XG5cbnZhciBfID0gKHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cuXyA6IHR5cGVvZiBnbG9iYWwgIT09IFwidW5kZWZpbmVkXCIgPyBnbG9iYWwuXyA6IG51bGwpO1xuXG52YXIgbW9kaWZpZXJzID0ge1xuXG4gICdmaWVsZCc6IHtjbGFzc05hbWU6ICdmb3JtLWdyb3VwJ30sXG4gICdoZWxwJzoge2NsYXNzTmFtZTogJ2hlbHAtYmxvY2snfSxcbiAgJ3NhbXBsZSc6IHtjbGFzc05hbWU6ICdoZWxwLWJsb2NrJ30sXG4gICd0ZXh0Jzoge2NsYXNzTmFtZTogJ2Zvcm0tY29udHJvbCd9LFxuICAndGV4dGFyZWEnOiB7Y2xhc3NOYW1lOiAnZm9ybS1jb250cm9sJ30sXG4gICdwcmV0dHktdGV4dGFyZWEnOiB7Y2xhc3NOYW1lOiAnZm9ybS1jb250cm9sJ30sXG4gICdqc29uJzoge2NsYXNzTmFtZTogJ2Zvcm0tY29udHJvbCd9LFxuICAnc2VsZWN0Jzoge2NsYXNzTmFtZTogJ2Zvcm0tY29udHJvbCd9LFxuICAvLydsaXN0Jzoge2NsYXNzTmFtZTogJ3dlbGwnfSxcbiAgJ2xpc3QtY29udHJvbCc6IHtjbGFzc05hbWU6ICdmb3JtLWlubGluZSd9LFxuICAnbGlzdC1pdGVtJzoge2NsYXNzTmFtZTogJ3dlbGwnfSxcbiAgJ2l0ZW0tY2hvaWNlcyc6IHtjbGFzc05hbWU6ICdmb3JtLWNvbnRyb2wnfSxcbiAgJ2FkZC1pdGVtJzoge2NsYXNzTmFtZTogJ2dseXBoaWNvbiBnbHlwaGljb24tcGx1cycsIGxhYmVsOiAnJ30sXG4gICdyZW1vdmUtaXRlbSc6IHtjbGFzc05hbWU6ICdnbHlwaGljb24gZ2x5cGhpY29uLXJlbW92ZScsIGxhYmVsOiAnJ30sXG4gICdtb3ZlLWl0ZW0tYmFjayc6IHtjbGFzc05hbWU6ICdnbHlwaGljb24gZ2x5cGhpY29uLWFycm93LXVwJywgbGFiZWw6ICcnfSxcbiAgJ21vdmUtaXRlbS1mb3J3YXJkJzoge2NsYXNzTmFtZTogJ2dseXBoaWNvbiBnbHlwaGljb24tYXJyb3ctZG93bicsIGxhYmVsOiAnJ31cbn07XG5cbi8vIEJ1aWxkIHRoZSBwbHVnaW4gYnVuZGxlLlxuXy5lYWNoKG1vZGlmaWVycywgZnVuY3Rpb24gKG1vZGlmaWVyLCBuYW1lKSB7XG5cbiAgZXhwb3J0c1snY29tcG9uZW50LXByb3BzLicgKyBuYW1lICsgJy5ib290c3RyYXAnXSA9IGZ1bmN0aW9uIChwbHVnaW4pIHtcblxuICAgIHZhciB1dGlsID0gcGx1Z2luLnJlcXVpcmUoJ3V0aWwnKTtcblxuICAgIHBsdWdpbi5leHBvcnRzID0gW1xuICAgICAgbmFtZSxcbiAgICAgIGZ1bmN0aW9uIChwcm9wcykge1xuICAgICAgICBpZiAoIV8uaXNVbmRlZmluZWQobW9kaWZpZXIuY2xhc3NOYW1lKSkge1xuICAgICAgICAgIHByb3BzLmNsYXNzTmFtZSA9IHV0aWwuY2xhc3NOYW1lKHByb3BzLmNsYXNzTmFtZSwgbW9kaWZpZXIuY2xhc3NOYW1lKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIV8uaXNVbmRlZmluZWQobW9kaWZpZXIubGFiZWwpKSB7XG4gICAgICAgICAgcHJvcHMubGFiZWwgPSBtb2RpZmllci5sYWJlbDtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIF07XG4gIH07XG5cbn0pO1xuXG59KS5jYWxsKHRoaXMsdHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbCA6IHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiID8gc2VsZiA6IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB7fSkiLCIoZnVuY3Rpb24gKGdsb2JhbCl7XG4vLyAjIGRlZmF1bHQtc3R5bGVcblxuLypcblRoZSBkZWZhdWx0LXN0eWxlIHBsdWdpbiBidW5kbGUgZXhwb3J0cyBhIGJ1bmNoIG9mIFwicHJvcCBtb2RpZmllclwiIHBsdWdpbnMgd2hpY2hcbm1hbmlwdWxhdGUgdGhlIHByb3BzIGdvaW5nIGludG8gbWFueSBvZiB0aGUgY29tcG9uZW50cy5cbiovXG5cbid1c2Ugc3RyaWN0JztcblxudmFyIF8gPSAodHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdy5fIDogdHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbC5fIDogbnVsbCk7XG5cbnZhciBtb2RpZmllcnMgPSB7XG5cbiAgJ2ZpZWxkJzoge30sXG4gICdoZWxwJzoge30sXG4gICdzYW1wbGUnOiB7fSxcbiAgJ3RleHQnOiB7fSxcbiAgJ3RleHRhcmVhJzoge30sXG4gICdwcmV0dHktdGV4dGFyZWEnOiB7fSxcbiAgJ2pzb24nOiB7fSxcbiAgJ3NlbGVjdCc6IHt9LFxuICAnbGlzdCc6IHt9LFxuICAnbGlzdC1jb250cm9sJzoge30sXG4gICdsaXN0LWl0ZW0tY29udHJvbCc6IHt9LFxuICAnbGlzdC1pdGVtLXZhbHVlJzoge30sXG4gICdsaXN0LWl0ZW0nOiB7fSxcbiAgJ2l0ZW0tY2hvaWNlcyc6IHt9LFxuICAnYWRkLWl0ZW0nOiB7fSxcbiAgJ3JlbW92ZS1pdGVtJzoge30sXG4gICdtb3ZlLWl0ZW0tYmFjayc6IHt9LFxuICAnbW92ZS1pdGVtLWZvcndhcmQnOiB7fVxufTtcblxuLy8gQnVpbGQgdGhlIHBsdWdpbiBidW5kbGUuXG5fLmVhY2gobW9kaWZpZXJzLCBmdW5jdGlvbiAobW9kaWZpZXIsIG5hbWUpIHtcblxuICBleHBvcnRzWydjb21wb25lbnQtcHJvcHMuJyArIG5hbWUgKyAnLmRlZmF1bHQnXSA9IGZ1bmN0aW9uIChwbHVnaW4pIHtcblxuICAgIHZhciB1dGlsID0gcGx1Z2luLnJlcXVpcmUoJ3V0aWwnKTtcblxuICAgIHBsdWdpbi5leHBvcnRzID0gW1xuICAgICAgbmFtZSxcbiAgICAgIGZ1bmN0aW9uIChwcm9wcykge1xuICAgICAgICBwcm9wcy5jbGFzc05hbWUgPSB1dGlsLmNsYXNzTmFtZShwcm9wcy5jbGFzc05hbWUsIG5hbWUpO1xuICAgICAgfVxuICAgIF07XG4gIH07XG5cbn0pO1xuXG59KS5jYWxsKHRoaXMsdHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbCA6IHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiID8gc2VsZiA6IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB7fSkiLCIoZnVuY3Rpb24gKGdsb2JhbCl7XG4vLyAjIHN0b3JlLm1lbW9yeVxuXG4vKlxuVGhlIG1lbW9yeSBzdG9yZSBwbHVnaW4ga2VlcHMgdGhlIHN0YXRlIG9mIGZpZWxkcywgZGF0YSwgYW5kIG1ldGFkYXRhLiBJdFxucmVzcG9uZHMgdG8gYWN0aW9ucyBhbmQgZW1pdHMgYSBjaGFuZ2UgZXZlbnQgaWYgdGhlcmUgYXJlIGFueSBjaGFuZ2VzLlxuKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgXyA9ICh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93Ll8gOiB0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsLl8gOiBudWxsKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAocGx1Z2luKSB7XG5cbiAgdmFyIGNvbXBpbGVyID0gcGx1Z2luLnJlcXVpcmUoJ2NvbXBpbGVyJyk7XG4gIHZhciB1dGlsID0gcGx1Z2luLnJlcXVpcmUoJ3V0aWwnKTtcblxuICBwbHVnaW4uZXhwb3J0cyA9IGZ1bmN0aW9uIChmb3JtLCBlbWl0dGVyLCBvcHRpb25zKSB7XG5cbiAgICB2YXIgc3RvcmUgPSB7fTtcblxuICAgIHN0b3JlLmZpZWxkcyA9IFtdO1xuICAgIHN0b3JlLnRlbXBsYXRlTWFwID0ge307XG4gICAgc3RvcmUudmFsdWUgPSB7fTtcbiAgICBzdG9yZS5tZXRhID0ge307XG5cbiAgICAvLyBIZWxwZXIgdG8gc2V0dXAgZmllbGRzLiBGaWVsZCBkZWZpbml0aW9ucyBuZWVkIHRvIGJlIGV4cGFuZGVkLCBjb21waWxlZCxcbiAgICAvLyBldGMuXG5cbiAgICB2YXIgc2V0dXBGaWVsZHMgPSBmdW5jdGlvbiAoZmllbGRzKSB7XG4gICAgICBzdG9yZS5maWVsZHMgPSBjb21waWxlci5leHBhbmRGaWVsZHMoZmllbGRzKTtcbiAgICAgIHN0b3JlLmZpZWxkcyA9IGNvbXBpbGVyLmNvbXBpbGVGaWVsZHMoc3RvcmUuZmllbGRzKTtcbiAgICAgIHN0b3JlLnRlbXBsYXRlTWFwID0gY29tcGlsZXIudGVtcGxhdGVNYXAoc3RvcmUuZmllbGRzKTtcbiAgICAgIHN0b3JlLmZpZWxkcyA9IHN0b3JlLmZpZWxkcy5maWx0ZXIoZnVuY3Rpb24gKGRlZikge1xuICAgICAgICByZXR1cm4gIWRlZi50ZW1wbGF0ZTtcbiAgICAgIH0pO1xuICAgIH07XG5cbiAgICBpZiAob3B0aW9ucy5maWVsZHMpIHtcbiAgICAgIHNldHVwRmllbGRzKG9wdGlvbnMuZmllbGRzKTtcbiAgICB9XG5cbiAgICBpZiAoIV8uaXNVbmRlZmluZWQob3B0aW9ucy52YWx1ZSkpIHtcbiAgICAgIHN0b3JlLnZhbHVlID0gdXRpbC5jb3B5VmFsdWUob3B0aW9ucy52YWx1ZSk7XG4gICAgfVxuXG4gICAgLy8gQ3VycmVudGx5LCBqdXN0IGEgc2luZ2xlIGV2ZW50IGZvciBhbnkgY2hhbmdlLlxuICAgIHZhciB1cGRhdGUgPSBmdW5jdGlvbiAoY2hhbmdpbmcpIHtcbiAgICAgIGVtaXR0ZXIuZW1pdCgnY2hhbmdlJywge1xuICAgICAgICB2YWx1ZTogc3RvcmUudmFsdWUsXG4gICAgICAgIG1ldGE6IHN0b3JlLm1ldGEsXG4gICAgICAgIGZpZWxkczogc3RvcmUuZmllbGRzLFxuICAgICAgICBjaGFuZ2luZzogY2hhbmdpbmdcbiAgICAgIH0pO1xuICAgIH07XG5cbiAgICAvLyBXaGVuIGZpZWxkcyBjaGFuZ2UsIHdlIG5lZWQgdG8gXCJpbmZsYXRlXCIgdGhlbSwgbWVhbmluZyBleHBhbmQgdGhlbSBhbmRcbiAgICAvLyBydW4gYW55IGV2YWx1YXRpb25zIGluIG9yZGVyIHRvIGdldCB0aGUgZGVmYXVsdCB2YWx1ZSBvdXQuXG4gICAgc3RvcmUuaW5mbGF0ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIHZhciBmaWVsZCA9IGZvcm0uZmllbGQoKTtcbiAgICAgIGZpZWxkLmluZmxhdGUoZnVuY3Rpb24gKHBhdGgsIHZhbHVlKSB7XG4gICAgICAgIHN0b3JlLnZhbHVlID0gdXRpbC5zZXRJbihzdG9yZS52YWx1ZSwgcGF0aCwgdmFsdWUpO1xuICAgICAgfSk7XG4gICAgfTtcblxuICAgIHZhciBhY3Rpb25zID0ge1xuXG4gICAgICAvLyBTZXQgdmFsdWUgYXQgYSBwYXRoLlxuICAgICAgc2V0VmFsdWU6IGZ1bmN0aW9uIChwYXRoLCB2YWx1ZSkge1xuXG4gICAgICAgIGlmIChfLmlzVW5kZWZpbmVkKHZhbHVlKSkge1xuICAgICAgICAgIHZhbHVlID0gcGF0aDtcbiAgICAgICAgICBwYXRoID0gW107XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgb2xkVmFsdWUgPSB1dGlsLmdldEluKHN0b3JlLnZhbHVlLCBwYXRoKTtcblxuICAgICAgICBpZiAocGF0aC5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICBzdG9yZS52YWx1ZSA9IHV0aWwuY29weVZhbHVlKHZhbHVlKTtcbiAgICAgICAgICBzdG9yZS5pbmZsYXRlKCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgc3RvcmUudmFsdWUgPSB1dGlsLnNldEluKHN0b3JlLnZhbHVlLCBwYXRoLCB2YWx1ZSk7XG4gICAgICAgIH1cbiAgICAgICAgdXBkYXRlKHsncGF0aCc6IHBhdGgsICduZXcnOiB2YWx1ZSwgJ29sZCc6IG9sZFZhbHVlLCAnYWN0aW9uJzogJ3NldCd9KTtcbiAgICAgIH0sXG5cbiAgICAgIC8vIFJlbW92ZSBhIHZhbHVlIGF0IGEgcGF0aC5cbiAgICAgIHJlbW92ZVZhbHVlOiBmdW5jdGlvbiAocGF0aCkge1xuICAgICAgICB2YXIgb2xkVmFsdWUgPSB1dGlsLmdldEluKHN0b3JlLnZhbHVlLCBwYXRoKTtcbiAgICAgICAgc3RvcmUudmFsdWUgPSB1dGlsLnJlbW92ZUluKHN0b3JlLnZhbHVlLCBwYXRoKTtcblxuICAgICAgICB1cGRhdGUoeydwYXRoJzogcGF0aCwgJ29sZCc6IG9sZFZhbHVlLCAnYWN0aW9uJzogJ3JlbW92ZSd9KTtcbiAgICAgIH0sXG5cbiAgICAgIC8vIEVyYXNlIGEgdmFsdWUuIFVzZXIgYWN0aW9ucyBjYW4gcmVtb3ZlIHZhbHVlcywgYnV0IG5vZGVzIGNhbiBhbHNvXG4gICAgICAvLyBkaXNhcHBlYXIgZHVlIHRvIGNoYW5naW5nIGV2YWx1YXRpb25zLiBUaGlzIGFjdGlvbiBvY2N1cnMgYXV0b21hdGljYWxseVxuICAgICAgLy8gKGFuZCBtYXkgYmUgdW5uZWNlc3NhcnkgaWYgdGhlIHZhbHVlIHdhcyBhbHJlYWR5IHJlbW92ZWQpLlxuICAgICAgZXJhc2VWYWx1ZTogZnVuY3Rpb24gKHBhdGgpIHtcblxuICAgICAgICBzdG9yZS52YWx1ZSA9IHV0aWwucmVtb3ZlSW4oc3RvcmUudmFsdWUsIHBhdGgpO1xuXG4gICAgICAgIHVwZGF0ZSh7fSk7XG4gICAgICB9LFxuXG4gICAgICAvLyBBcHBlbmQgYSB2YWx1ZSB0byBhbiBhcnJheSBhdCBhIHBhdGguXG4gICAgICBhcHBlbmRWYWx1ZTogZnVuY3Rpb24gKHBhdGgsIHZhbHVlKSB7XG4gICAgICAgIHZhciBvbGRWYWx1ZSA9IHV0aWwuZ2V0SW4oc3RvcmUudmFsdWUsIHBhdGgpO1xuICAgICAgICBzdG9yZS52YWx1ZSA9IHV0aWwuYXBwZW5kSW4oc3RvcmUudmFsdWUsIHBhdGgsIHZhbHVlKTtcblxuICAgICAgICB1cGRhdGUoeydwYXRoJzogcGF0aCwgJ25ldyc6IHZhbHVlLCAnb2xkJzogb2xkVmFsdWUsICdhY3Rpb24nOiAnYXBwZW5kJ30pO1xuICAgICAgfSxcblxuICAgICAgLy8gU3dhcCB2YWx1ZXMgb2YgdHdvIGtleXMuXG4gICAgICBtb3ZlVmFsdWU6IGZ1bmN0aW9uIChwYXRoLCBmcm9tS2V5LCB0b0tleSkge1xuICAgICAgICB2YXIgb2xkVmFsdWUgPSB1dGlsLmdldEluKHN0b3JlLnZhbHVlLCBwYXRoKTtcbiAgICAgICAgc3RvcmUudmFsdWUgPSB1dGlsLm1vdmVJbihzdG9yZS52YWx1ZSwgcGF0aCwgZnJvbUtleSwgdG9LZXkpO1xuXG4gICAgICAgIHVwZGF0ZSh7J3BhdGgnOiBwYXRoLCAnbmV3Jzogb2xkVmFsdWUsICdvbGQnOiBvbGRWYWx1ZSwgJ2Zyb21LZXknOiBmcm9tS2V5LCAndG9LZXknOiB0b0tleSwgJ2FjdGlvbic6ICdtb3ZlJ30pO1xuICAgICAgfSxcblxuICAgICAgLy8gQ2hhbmdlIGFsbCB0aGUgZmllbGRzLlxuICAgICAgc2V0RmllbGRzOiBmdW5jdGlvbiAoZmllbGRzKSB7XG4gICAgICAgIHNldHVwRmllbGRzKGZpZWxkcyk7XG4gICAgICAgIHN0b3JlLmluZmxhdGUoKTtcblxuICAgICAgICB1cGRhdGUoeydhY3Rpb24nOiAnc2V0RmllbGRzJ30pO1xuICAgICAgfSxcblxuICAgICAgLy8gU2V0IGEgbWV0YWRhdGEgdmFsdWUgZm9yIGEga2V5LlxuICAgICAgc2V0TWV0YTogZnVuY3Rpb24gKGtleSwgdmFsdWUpIHtcbiAgICAgICAgc3RvcmUubWV0YVtrZXldID0gdmFsdWU7XG4gICAgICAgIHVwZGF0ZSh7J2FjdGlvbic6ICdzZXRNZXRhJ30pO1xuICAgICAgfVxuICAgIH07XG5cbiAgICBfLmV4dGVuZChzdG9yZSwgYWN0aW9ucyk7XG5cbiAgICByZXR1cm4gc3RvcmU7XG4gIH07XG59O1xuXG59KS5jYWxsKHRoaXMsdHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbCA6IHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiID8gc2VsZiA6IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB7fSkiLCIoZnVuY3Rpb24gKGdsb2JhbCl7XG4vLyAjIHR5cGUuYXJyYXlcblxuLypcblN1cHBvcnQgYXJyYXkgdHlwZSB3aGVyZSBjaGlsZCBmaWVsZHMgYXJlIGR5bmFtaWNhbGx5IGRldGVybWluZWQgYmFzZWQgb24gdGhlXG52YWx1ZXMgb2YgdGhlIGFycmF5LlxuKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgXyA9ICh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93Ll8gOiB0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsLl8gOiBudWxsKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAocGx1Z2luKSB7XG5cbiAgcGx1Z2luLmV4cG9ydHMuZGVmYXVsdCA9IFtdO1xuXG4gIHBsdWdpbi5leHBvcnRzLmZpZWxkcyA9IGZ1bmN0aW9uIChmaWVsZCkge1xuXG4gICAgaWYgKF8uaXNBcnJheShmaWVsZC52YWx1ZSkpIHtcbiAgICAgIHJldHVybiBmaWVsZC52YWx1ZS5tYXAoZnVuY3Rpb24gKHZhbHVlLCBpKSB7XG4gICAgICAgIHZhciBpdGVtID0gZmllbGQuaXRlbUZvclZhbHVlKHZhbHVlKTtcbiAgICAgICAgaXRlbS5rZXkgPSBpO1xuICAgICAgICByZXR1cm4gZmllbGQuY3JlYXRlQ2hpbGQoaXRlbSk7XG4gICAgICB9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIFtdO1xuICAgIH1cbiAgfTtcbn07XG5cbn0pLmNhbGwodGhpcyx0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsIDogdHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDogdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9KSIsIi8vICMgdHlwZS5ib29sZWFuXG5cbi8qXG5TdXBwb3J0IGEgdHJ1ZS9mYWxzZSB2YWx1ZS5cbiovXG5cbid1c2Ugc3RyaWN0JztcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAocGx1Z2luKSB7XG5cbiAgcGx1Z2luLmV4cG9ydHMuZGVmYXVsdCA9IGZhbHNlO1xuXG4gIHBsdWdpbi5leHBvcnRzLmNvbXBpbGUgPSBmdW5jdGlvbiAoZGVmKSB7XG4gICAgaWYgKCFkZWYuY2hvaWNlcykge1xuICAgICAgZGVmLmNob2ljZXMgPSBbXG4gICAgICAgIHt2YWx1ZTogdHJ1ZSwgbGFiZWw6ICdZZXMnfSxcbiAgICAgICAge3ZhbHVlOiBmYWxzZSwgbGFiZWw6ICdObyd9XG4gICAgICBdO1xuICAgIH1cbiAgfTtcbn07XG4iLCIvLyAjIHR5cGUuanNvblxuXG4vKlxuQXJiaXRyYXJ5IEpTT04gdmFsdWUuXG4qL1xuXG4ndXNlIHN0cmljdCc7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKHBsdWdpbikge1xuXG4gIHBsdWdpbi5leHBvcnRzLmRlZmF1bHQgPSBudWxsO1xuXG59O1xuIiwiLy8gIyB0eXBlLm51bWJlclxuXG4vKlxuU3VwcG9ydCBudW1iZXIgdmFsdWVzLCBvZiBjb3Vyc2UuXG4qL1xuXG4ndXNlIHN0cmljdCc7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKHBsdWdpbikge1xuXG4gIHBsdWdpbi5leHBvcnRzLmRlZmF1bHQgPSAwO1xuXG59O1xuIiwiKGZ1bmN0aW9uIChnbG9iYWwpe1xuLy8gIyB0eXBlLm9iamVjdFxuXG4vKlxuU3VwcG9ydCBmb3Igb2JqZWN0IHR5cGVzLiBPYmplY3QgZmllbGRzIGNhbiBzdXBwbHkgc3RhdGljIGNoaWxkIGZpZWxkcywgb3IgaWZcbnRoZXJlIGFyZSBhZGRpdGlvbmFsIGNoaWxkIGtleXMsIGR5bmFtaWMgY2hpbGQgZmllbGRzIHdpbGwgYmUgY3JlYXRlZCBtdWNoXG5saWtlIGFuIGFycmF5LlxuKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgXyA9ICh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93Ll8gOiB0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsLl8gOiBudWxsKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAocGx1Z2luKSB7XG5cbiAgdmFyIHV0aWwgPSBwbHVnaW4ucmVxdWlyZSgndXRpbCcpO1xuXG4gIHBsdWdpbi5leHBvcnRzLmRlZmF1bHQgPSB7fTtcblxuICBwbHVnaW4uZXhwb3J0cy5maWVsZHMgPSBmdW5jdGlvbiAoZmllbGQpIHtcblxuICAgIHZhciBmaWVsZHMgPSBbXTtcbiAgICB2YXIgdmFsdWUgPSBmaWVsZC52YWx1ZTtcbiAgICB2YXIgdW51c2VkS2V5cyA9IF8ua2V5cyh2YWx1ZSk7XG5cbiAgICBpZiAoZmllbGQuZGVmLmZpZWxkcykge1xuXG4gICAgICBmaWVsZHMgPSBmaWVsZC5kZWYuZmllbGRzLm1hcChmdW5jdGlvbiAoZGVmKSB7XG4gICAgICAgIHZhciBjaGlsZCA9IGZpZWxkLmNyZWF0ZUNoaWxkKGRlZik7XG4gICAgICAgIGlmICghdXRpbC5pc0JsYW5rKGNoaWxkLmRlZi5rZXkpKSB7XG4gICAgICAgICAgdW51c2VkS2V5cyA9IF8ud2l0aG91dCh1bnVzZWRLZXlzLCBjaGlsZC5kZWYua2V5KTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gY2hpbGQ7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBpZiAodW51c2VkS2V5cy5sZW5ndGggPiAwKSB7XG4gICAgICB1bnVzZWRLZXlzLmZvckVhY2goZnVuY3Rpb24gKGtleSkge1xuICAgICAgICB2YXIgaXRlbSA9IGZpZWxkLml0ZW1Gb3JWYWx1ZSh2YWx1ZVtrZXldKTtcbiAgICAgICAgaXRlbS5sYWJlbCA9IHV0aWwuaHVtYW5pemUoa2V5KTtcbiAgICAgICAgaXRlbS5rZXkgPSBrZXk7XG4gICAgICAgIGZpZWxkcy5wdXNoKGZpZWxkLmNyZWF0ZUNoaWxkKGl0ZW0pKTtcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIHJldHVybiBmaWVsZHM7XG4gIH07XG59O1xuXG59KS5jYWxsKHRoaXMsdHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbCA6IHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiID8gc2VsZiA6IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB7fSkiLCIvLyAjIHR5cGUucm9vdFxuXG4vKlxuU3BlY2lhbCB0eXBlIHJlcHJlc2VudGluZyB0aGUgcm9vdCBvZiB0aGUgZm9ybS4gR2V0cyB0aGUgZmllbGRzIGRpcmVjdGx5IGZyb21cbnRoZSBzdG9yZS5cbiovXG5cbid1c2Ugc3RyaWN0JztcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAocGx1Z2luKSB7XG5cbiAgcGx1Z2luLmV4cG9ydHMuZmllbGRzID0gZnVuY3Rpb24gKGZpZWxkKSB7XG5cbiAgICByZXR1cm4gZmllbGQuZm9ybS5zdG9yZS5maWVsZHMubWFwKGZ1bmN0aW9uIChkZWYpIHtcbiAgICAgIHJldHVybiBmaWVsZC5jcmVhdGVDaGlsZChkZWYpO1xuICAgIH0pO1xuXG4gIH07XG59O1xuIiwiLy8gIyB0eXBlLnN0cmluZ1xuXG4vKlxuU3VwcG9ydCBzdHJpbmcgdmFsdWVzLCBvZiBjb3Vyc2UuXG4qL1xuXG4ndXNlIHN0cmljdCc7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKHBsdWdpbikge1xuXG4gIHBsdWdpbi5leHBvcnRzLmRlZmF1bHQgPSAnJztcblxufTtcbiIsIid1c2Ugc3RyaWN0JztcblxuLyoqXG4gKiBSZXByZXNlbnRhdGlvbiBvZiBhIHNpbmdsZSBFdmVudEVtaXR0ZXIgZnVuY3Rpb24uXG4gKlxuICogQHBhcmFtIHtGdW5jdGlvbn0gZm4gRXZlbnQgaGFuZGxlciB0byBiZSBjYWxsZWQuXG4gKiBAcGFyYW0ge01peGVkfSBjb250ZXh0IENvbnRleHQgZm9yIGZ1bmN0aW9uIGV4ZWN1dGlvbi5cbiAqIEBwYXJhbSB7Qm9vbGVhbn0gb25jZSBPbmx5IGVtaXQgb25jZVxuICogQGFwaSBwcml2YXRlXG4gKi9cbmZ1bmN0aW9uIEVFKGZuLCBjb250ZXh0LCBvbmNlKSB7XG4gIHRoaXMuZm4gPSBmbjtcbiAgdGhpcy5jb250ZXh0ID0gY29udGV4dDtcbiAgdGhpcy5vbmNlID0gb25jZSB8fCBmYWxzZTtcbn1cblxuLyoqXG4gKiBNaW5pbWFsIEV2ZW50RW1pdHRlciBpbnRlcmZhY2UgdGhhdCBpcyBtb2xkZWQgYWdhaW5zdCB0aGUgTm9kZS5qc1xuICogRXZlbnRFbWl0dGVyIGludGVyZmFjZS5cbiAqXG4gKiBAY29uc3RydWN0b3JcbiAqIEBhcGkgcHVibGljXG4gKi9cbmZ1bmN0aW9uIEV2ZW50RW1pdHRlcigpIHsgLyogTm90aGluZyB0byBzZXQgKi8gfVxuXG4vKipcbiAqIEhvbGRzIHRoZSBhc3NpZ25lZCBFdmVudEVtaXR0ZXJzIGJ5IG5hbWUuXG4gKlxuICogQHR5cGUge09iamVjdH1cbiAqIEBwcml2YXRlXG4gKi9cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuX2V2ZW50cyA9IHVuZGVmaW5lZDtcblxuLyoqXG4gKiBSZXR1cm4gYSBsaXN0IG9mIGFzc2lnbmVkIGV2ZW50IGxpc3RlbmVycy5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gZXZlbnQgVGhlIGV2ZW50cyB0aGF0IHNob3VsZCBiZSBsaXN0ZWQuXG4gKiBAcmV0dXJucyB7QXJyYXl9XG4gKiBAYXBpIHB1YmxpY1xuICovXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmxpc3RlbmVycyA9IGZ1bmN0aW9uIGxpc3RlbmVycyhldmVudCkge1xuICBpZiAoIXRoaXMuX2V2ZW50cyB8fCAhdGhpcy5fZXZlbnRzW2V2ZW50XSkgcmV0dXJuIFtdO1xuXG4gIGZvciAodmFyIGkgPSAwLCBsID0gdGhpcy5fZXZlbnRzW2V2ZW50XS5sZW5ndGgsIGVlID0gW107IGkgPCBsOyBpKyspIHtcbiAgICBlZS5wdXNoKHRoaXMuX2V2ZW50c1tldmVudF1baV0uZm4pO1xuICB9XG5cbiAgcmV0dXJuIGVlO1xufTtcblxuLyoqXG4gKiBFbWl0IGFuIGV2ZW50IHRvIGFsbCByZWdpc3RlcmVkIGV2ZW50IGxpc3RlbmVycy5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gZXZlbnQgVGhlIG5hbWUgb2YgdGhlIGV2ZW50LlxuICogQHJldHVybnMge0Jvb2xlYW59IEluZGljYXRpb24gaWYgd2UndmUgZW1pdHRlZCBhbiBldmVudC5cbiAqIEBhcGkgcHVibGljXG4gKi9cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuZW1pdCA9IGZ1bmN0aW9uIGVtaXQoZXZlbnQsIGExLCBhMiwgYTMsIGE0LCBhNSkge1xuICBpZiAoIXRoaXMuX2V2ZW50cyB8fCAhdGhpcy5fZXZlbnRzW2V2ZW50XSkgcmV0dXJuIGZhbHNlO1xuXG4gIHZhciBsaXN0ZW5lcnMgPSB0aGlzLl9ldmVudHNbZXZlbnRdXG4gICAgLCBsZW5ndGggPSBsaXN0ZW5lcnMubGVuZ3RoXG4gICAgLCBsZW4gPSBhcmd1bWVudHMubGVuZ3RoXG4gICAgLCBlZSA9IGxpc3RlbmVyc1swXVxuICAgICwgYXJnc1xuICAgICwgaSwgajtcblxuICBpZiAoMSA9PT0gbGVuZ3RoKSB7XG4gICAgaWYgKGVlLm9uY2UpIHRoaXMucmVtb3ZlTGlzdGVuZXIoZXZlbnQsIGVlLmZuLCB0cnVlKTtcblxuICAgIHN3aXRjaCAobGVuKSB7XG4gICAgICBjYXNlIDE6IHJldHVybiBlZS5mbi5jYWxsKGVlLmNvbnRleHQpLCB0cnVlO1xuICAgICAgY2FzZSAyOiByZXR1cm4gZWUuZm4uY2FsbChlZS5jb250ZXh0LCBhMSksIHRydWU7XG4gICAgICBjYXNlIDM6IHJldHVybiBlZS5mbi5jYWxsKGVlLmNvbnRleHQsIGExLCBhMiksIHRydWU7XG4gICAgICBjYXNlIDQ6IHJldHVybiBlZS5mbi5jYWxsKGVlLmNvbnRleHQsIGExLCBhMiwgYTMpLCB0cnVlO1xuICAgICAgY2FzZSA1OiByZXR1cm4gZWUuZm4uY2FsbChlZS5jb250ZXh0LCBhMSwgYTIsIGEzLCBhNCksIHRydWU7XG4gICAgICBjYXNlIDY6IHJldHVybiBlZS5mbi5jYWxsKGVlLmNvbnRleHQsIGExLCBhMiwgYTMsIGE0LCBhNSksIHRydWU7XG4gICAgfVxuXG4gICAgZm9yIChpID0gMSwgYXJncyA9IG5ldyBBcnJheShsZW4gLTEpOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgIGFyZ3NbaSAtIDFdID0gYXJndW1lbnRzW2ldO1xuICAgIH1cblxuICAgIGVlLmZuLmFwcGx5KGVlLmNvbnRleHQsIGFyZ3MpO1xuICB9IGVsc2Uge1xuICAgIGZvciAoaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgaWYgKGxpc3RlbmVyc1tpXS5vbmNlKSB0aGlzLnJlbW92ZUxpc3RlbmVyKGV2ZW50LCBsaXN0ZW5lcnNbaV0uZm4sIHRydWUpO1xuXG4gICAgICBzd2l0Y2ggKGxlbikge1xuICAgICAgICBjYXNlIDE6IGxpc3RlbmVyc1tpXS5mbi5jYWxsKGxpc3RlbmVyc1tpXS5jb250ZXh0KTsgYnJlYWs7XG4gICAgICAgIGNhc2UgMjogbGlzdGVuZXJzW2ldLmZuLmNhbGwobGlzdGVuZXJzW2ldLmNvbnRleHQsIGExKTsgYnJlYWs7XG4gICAgICAgIGNhc2UgMzogbGlzdGVuZXJzW2ldLmZuLmNhbGwobGlzdGVuZXJzW2ldLmNvbnRleHQsIGExLCBhMik7IGJyZWFrO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgIGlmICghYXJncykgZm9yIChqID0gMSwgYXJncyA9IG5ldyBBcnJheShsZW4gLTEpOyBqIDwgbGVuOyBqKyspIHtcbiAgICAgICAgICAgIGFyZ3NbaiAtIDFdID0gYXJndW1lbnRzW2pdO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGxpc3RlbmVyc1tpXS5mbi5hcHBseShsaXN0ZW5lcnNbaV0uY29udGV4dCwgYXJncyk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHRydWU7XG59O1xuXG4vKipcbiAqIFJlZ2lzdGVyIGEgbmV3IEV2ZW50TGlzdGVuZXIgZm9yIHRoZSBnaXZlbiBldmVudC5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gZXZlbnQgTmFtZSBvZiB0aGUgZXZlbnQuXG4gKiBAcGFyYW0ge0Z1bmN0b259IGZuIENhbGxiYWNrIGZ1bmN0aW9uLlxuICogQHBhcmFtIHtNaXhlZH0gY29udGV4dCBUaGUgY29udGV4dCBvZiB0aGUgZnVuY3Rpb24uXG4gKiBAYXBpIHB1YmxpY1xuICovXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLm9uID0gZnVuY3Rpb24gb24oZXZlbnQsIGZuLCBjb250ZXh0KSB7XG4gIGlmICghdGhpcy5fZXZlbnRzKSB0aGlzLl9ldmVudHMgPSB7fTtcbiAgaWYgKCF0aGlzLl9ldmVudHNbZXZlbnRdKSB0aGlzLl9ldmVudHNbZXZlbnRdID0gW107XG4gIHRoaXMuX2V2ZW50c1tldmVudF0ucHVzaChuZXcgRUUoIGZuLCBjb250ZXh0IHx8IHRoaXMgKSk7XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIEFkZCBhbiBFdmVudExpc3RlbmVyIHRoYXQncyBvbmx5IGNhbGxlZCBvbmNlLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBldmVudCBOYW1lIG9mIHRoZSBldmVudC5cbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuIENhbGxiYWNrIGZ1bmN0aW9uLlxuICogQHBhcmFtIHtNaXhlZH0gY29udGV4dCBUaGUgY29udGV4dCBvZiB0aGUgZnVuY3Rpb24uXG4gKiBAYXBpIHB1YmxpY1xuICovXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLm9uY2UgPSBmdW5jdGlvbiBvbmNlKGV2ZW50LCBmbiwgY29udGV4dCkge1xuICBpZiAoIXRoaXMuX2V2ZW50cykgdGhpcy5fZXZlbnRzID0ge307XG4gIGlmICghdGhpcy5fZXZlbnRzW2V2ZW50XSkgdGhpcy5fZXZlbnRzW2V2ZW50XSA9IFtdO1xuICB0aGlzLl9ldmVudHNbZXZlbnRdLnB1c2gobmV3IEVFKGZuLCBjb250ZXh0IHx8IHRoaXMsIHRydWUgKSk7XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIFJlbW92ZSBldmVudCBsaXN0ZW5lcnMuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IGV2ZW50IFRoZSBldmVudCB3ZSB3YW50IHRvIHJlbW92ZS5cbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuIFRoZSBsaXN0ZW5lciB0aGF0IHdlIG5lZWQgdG8gZmluZC5cbiAqIEBwYXJhbSB7Qm9vbGVhbn0gb25jZSBPbmx5IHJlbW92ZSBvbmNlIGxpc3RlbmVycy5cbiAqIEBhcGkgcHVibGljXG4gKi9cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUucmVtb3ZlTGlzdGVuZXIgPSBmdW5jdGlvbiByZW1vdmVMaXN0ZW5lcihldmVudCwgZm4sIG9uY2UpIHtcbiAgaWYgKCF0aGlzLl9ldmVudHMgfHwgIXRoaXMuX2V2ZW50c1tldmVudF0pIHJldHVybiB0aGlzO1xuXG4gIHZhciBsaXN0ZW5lcnMgPSB0aGlzLl9ldmVudHNbZXZlbnRdXG4gICAgLCBldmVudHMgPSBbXTtcblxuICBpZiAoZm4pIGZvciAodmFyIGkgPSAwLCBsZW5ndGggPSBsaXN0ZW5lcnMubGVuZ3RoOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICBpZiAobGlzdGVuZXJzW2ldLmZuICE9PSBmbiAmJiBsaXN0ZW5lcnNbaV0ub25jZSAhPT0gb25jZSkge1xuICAgICAgZXZlbnRzLnB1c2gobGlzdGVuZXJzW2ldKTtcbiAgICB9XG4gIH1cblxuICAvL1xuICAvLyBSZXNldCB0aGUgYXJyYXksIG9yIHJlbW92ZSBpdCBjb21wbGV0ZWx5IGlmIHdlIGhhdmUgbm8gbW9yZSBsaXN0ZW5lcnMuXG4gIC8vXG4gIGlmIChldmVudHMubGVuZ3RoKSB0aGlzLl9ldmVudHNbZXZlbnRdID0gZXZlbnRzO1xuICBlbHNlIHRoaXMuX2V2ZW50c1tldmVudF0gPSBudWxsO1xuXG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBSZW1vdmUgYWxsIGxpc3RlbmVycyBvciBvbmx5IHRoZSBsaXN0ZW5lcnMgZm9yIHRoZSBzcGVjaWZpZWQgZXZlbnQuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IGV2ZW50IFRoZSBldmVudCB3YW50IHRvIHJlbW92ZSBhbGwgbGlzdGVuZXJzIGZvci5cbiAqIEBhcGkgcHVibGljXG4gKi9cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUucmVtb3ZlQWxsTGlzdGVuZXJzID0gZnVuY3Rpb24gcmVtb3ZlQWxsTGlzdGVuZXJzKGV2ZW50KSB7XG4gIGlmICghdGhpcy5fZXZlbnRzKSByZXR1cm4gdGhpcztcblxuICBpZiAoZXZlbnQpIHRoaXMuX2V2ZW50c1tldmVudF0gPSBudWxsO1xuICBlbHNlIHRoaXMuX2V2ZW50cyA9IHt9O1xuXG4gIHJldHVybiB0aGlzO1xufTtcblxuLy9cbi8vIEFsaWFzIG1ldGhvZHMgbmFtZXMgYmVjYXVzZSBwZW9wbGUgcm9sbCBsaWtlIHRoYXQuXG4vL1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5vZmYgPSBFdmVudEVtaXR0ZXIucHJvdG90eXBlLnJlbW92ZUxpc3RlbmVyO1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5hZGRMaXN0ZW5lciA9IEV2ZW50RW1pdHRlci5wcm90b3R5cGUub247XG5cbi8vXG4vLyBUaGlzIGZ1bmN0aW9uIGRvZXNuJ3QgYXBwbHkgYW55bW9yZS5cbi8vXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLnNldE1heExpc3RlbmVycyA9IGZ1bmN0aW9uIHNldE1heExpc3RlbmVycygpIHtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vL1xuLy8gRXhwb3NlIHRoZSBtb2R1bGUuXG4vL1xuRXZlbnRFbWl0dGVyLkV2ZW50RW1pdHRlciA9IEV2ZW50RW1pdHRlcjtcbkV2ZW50RW1pdHRlci5FdmVudEVtaXR0ZXIyID0gRXZlbnRFbWl0dGVyO1xuRXZlbnRFbWl0dGVyLkV2ZW50RW1pdHRlcjMgPSBFdmVudEVtaXR0ZXI7XG5cbmlmICgnb2JqZWN0JyA9PT0gdHlwZW9mIG1vZHVsZSAmJiBtb2R1bGUuZXhwb3J0cykge1xuICBtb2R1bGUuZXhwb3J0cyA9IEV2ZW50RW1pdHRlcjtcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZSgnLi9saWIvZm9ybWF0aWMnKTtcbiJdfQ==
