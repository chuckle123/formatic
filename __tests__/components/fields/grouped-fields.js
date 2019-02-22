/*global describe, it, expect*/

import { renderFieldsToHtml } from '../../../FormaticTestUtils';
import groupedFieldsExample from '../../../demo/examples/grouped-fields';

describe('grouped-fields field', () => {
  it('should render correctly', () => {
    expect(renderFieldsToHtml(groupedFieldsExample.fields)).toMatchSnapshot();
  });
});
