/*global describe, it, expect*/

import { renderFieldsToHtml } from '../../../FormaticTestUtils';
import booleanExample from '../../../demo/examples/boolean';

describe('boolean field', () => {
  it('should render correctly', () => {
    expect(renderFieldsToHtml(booleanExample.fields)).toMatchSnapshot();
  });
});
