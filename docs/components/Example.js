import React from 'react';

import Colors from '../styles/Colors';

const styles = {
  example: () => ({
    border: `1px solid ${Colors.neutral[4]}`,
    padding: 20,
    borderRadius: 3,
  }),
};

const Example = props => (
  <div css={styles.example(props)}>{props.children}</div>
);

export default Example;
