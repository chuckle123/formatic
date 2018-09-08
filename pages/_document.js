import React from 'react';
import Document, { Head, Main, NextScript } from 'next/document';
import { extractCritical } from 'emotion-server';

export default class MyDocument extends Document {
  static async getInitialProps(ctx) {
    const page = ctx.renderPage();
    const styles = extractCritical(page.html);
    return { ...page, ...styles };
  }

  render() {
    return (
      <html>
        <Head>
          <link
            rel="apple-touch-icon"
            sizes="57x57"
            href="./static/favicons/apple-touch-icon-57x57.png"
            data-reactid=".2bkozp1wjk0.0.8"
          />
          <link
            rel="apple-touch-icon"
            sizes="60x60"
            href="./static/favicons/apple-touch-icon-60x60.png"
            data-reactid=".2bkozp1wjk0.0.9"
          />
          <link
            rel="apple-touch-icon"
            sizes="72x72"
            href="./static/favicons/apple-touch-icon-72x72.png"
            data-reactid=".2bkozp1wjk0.0.a"
          />
          <link
            rel="apple-touch-icon"
            sizes="76x76"
            href="./static/favicons/apple-touch-icon-76x76.png"
            data-reactid=".2bkozp1wjk0.0.b"
          />
          <link
            rel="apple-touch-icon"
            sizes="114x114"
            href="./static/favicons/apple-touch-icon-114x114.png"
            data-reactid=".2bkozp1wjk0.0.c"
          />
          <link
            rel="apple-touch-icon"
            sizes="120x120"
            href="./static/favicons/apple-touch-icon-120x120.png"
            data-reactid=".2bkozp1wjk0.0.d"
          />
          <link
            rel="apple-touch-icon"
            sizes="144x144"
            href="./static/favicons/apple-touch-icon-144x144.png"
            data-reactid=".2bkozp1wjk0.0.e"
          />
          <link
            rel="apple-touch-icon"
            sizes="152x152"
            href="./static/favicons/apple-touch-icon-152x152.png"
            data-reactid=".2bkozp1wjk0.0.f"
          />
          <link
            rel="apple-touch-icon"
            sizes="180x180"
            href="./static/favicons/apple-touch-icon-180x180.png"
            data-reactid=".2bkozp1wjk0.0.g"
          />
          <link
            rel="icon"
            type="image/png"
            href="./static/favicons/favicon-32x32.png"
            sizes="32x32"
            data-reactid=".2bkozp1wjk0.0.h"
          />
          <link
            rel="icon"
            type="image/png"
            href="./static/favicons/android-chrome-192x192.png"
            sizes="192x192"
            data-reactid=".2bkozp1wjk0.0.i"
          />
          <link
            rel="icon"
            type="image/png"
            href="./static/favicons/favicon-96x96.png"
            sizes="96x96"
            data-reactid=".2bkozp1wjk0.0.j"
          />
          <link
            rel="icon"
            type="image/png"
            href="./static/favicons/favicon-16x16.png"
            sizes="16x16"
            data-reactid=".2bkozp1wjk0.0.k"
          />
          <link
            rel="manifest"
            href="./static/favicons/manifest.json"
            data-reactid=".2bkozp1wjk0.0.l"
          />
          <link
            rel="stylesheet"
            href="/node_modules/bootstrap/dist/css/bootstrap.min.css"
          />
          <link
            rel="stylesheet"
            href="/node_modules/bootstrap/dist/css/bootstrap-theme.min.css"
          />
          <link
            rel="stylesheet"
            href="/node_modules/codemirror/lib/codemirror.css"
          />
          <link rel="stylesheet" type="text/css" href="/static/css/docs.css" />
          <link rel="stylesheet" type="text/css" href="/static/css/app.css" />
          <link
            rel="stylesheet"
            type="text/css"
            href="/static/css/formatic.css"
          />
          <style dangerouslySetInnerHTML={{ __html: this.props.css }} />
        </Head>
        <body className="custom_class">
          <Main />
          <NextScript />
        </body>
      </html>
    );
  }
}
