/** @jsx jsx */
import { jsx, css } from '@emotion/core';
import Layout from './Layout';

import Typography from '@/docs/styles/Typography';

import 'sanitize.css';
import 'codemirror/lib/codemirror.css';
import '@/static/css/app.css';
import '@/static/css/formatic.css';

const pages = {
  start: {
    url: '/start',
    title: 'Getting Started',
    subTitle: 'Installing and using Formatic',
  },
  demo: {
    url: '/demo',
    title: 'Field Types',
    subTitle: 'The whole kitchen sink',
  },
  plugins: {
    url: '/plugins',
    navTitle: 'Plugins',
    title: 'Extending Formatic',
  },
  github: {
    url: 'http://github.com/zapier/formatic',
    title: 'GitHub',
  },
};

const styles = {
  body: css({
    ...Typography['body-large'],
  }),
};

const Page = props => (
  <Layout pageKey={props.pageKey} pages={pages}>
    <div css={styles.body}>{props.children}</div>
  </Layout>
);

export default Page;