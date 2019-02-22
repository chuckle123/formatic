/*global describe, it, expect*/

import { renderFieldsToHtml } from '../../../FormaticTestUtils';
import fieldsExample from '../../../demo/examples/fields';

describe('fields field', () => {
  it('should render correctly', () => {
    expect(renderFieldsToHtml(fieldsExample.fields)).toMatchSnapshot();
  });
});
