// # field-template-choices component

/*
Give a list of choices of item types to create as children of an field.
*/

'use strict';

import createReactClass from 'create-react-class';
import cx from 'classnames';

import HelperMixin from '@/src/mixins/helper';

/** @jsx jsx */
import jsx from '@/src/jsx';

export default createReactClass({
  displayName: 'FieldTemplateChoices',

  mixins: [HelperMixin],

  onChange: function(event) {
    this.props.onSelect(parseInt(event.target.value));
  },

  render: function() {
    return this.renderWithConfig();
  },

  renderDefault: function() {
    const config = this.props.config;
    const field = this.props.field;

    const fieldTemplates = config.fieldItemFieldTemplates(field);

    return fieldTemplates.length < 2 ? null : (
      <select
        renderWith={this.renderWith('FieldTemplateChoicesSelectInput')}
        className={cx(this.props.classes)}
        value={this.fieldTemplateIndex}
        onChange={this.onChange}
      >
        {fieldTemplates.map((fieldTemplate, i) => (
          <option
            renderWith={this.renderWith('FieldTemplateChoicesOption')}
            key={i}
            value={i}
          >
            {fieldTemplate.label || i}
          </option>
        ))}
      </select>
    );
  },
});
