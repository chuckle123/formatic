/*global describe, it, expect*/

import { renderFieldsToHtml } from '../../../FormaticTestUtils';
import codeExample from '../../../demo/examples/code';

describe('code field', () => {
  it('should render correctly', () => {
    expect(renderFieldsToHtml(codeExample.fields)).toMatchSnapshot();
  });
});
