const withCSS = require('@zeit/next-css');
const webpack = require('webpack');

const assetPrefix = process.env.NODE_ENV === 'production' ? '/formatic' : '';

module.exports = withCSS({
  webpack(config) {
    config.externals = config.externals || {};
    config.externals.fs = 'fs';

    config.module = config.module || {};
    config.module.rules = config.module.rules || [];
    config.module.rules.push({
      test: /\.svg$/,
      use: [
        {
          loader: 'react-svg-loader',
          options: {
            svgo: {
              plugins: [
                { removeXMLNS: true },
                { removeDimensions: true },
                { removeTitle: true },
              ],
            },
          },
        },
      ],
    });

    config.plugins.push(
      new webpack.DefinePlugin({
        'process.env.ASSET_PREFIX': JSON.stringify(assetPrefix),
      })
    );

    return config;
  },
  assetPrefix,
});
