# 👷 webpack-universal-hot-middleware

> Simple universal hot webpack middleware for `development` and `production`


## 🤦‍♂️ Why?

I just want to spend less time on setup new webpack projects. Yes, I now about [Next.js](https://nextjs.org/).


## 📦 Install

```sh
$ yarn add -D webpack-universal-hot-middleware
```


## 👀 Example

### Setup

1. Create `webpack.config.js`

  ```js
  // webpack.config.js

  const path = require('path')
  const config = require('config')
  const StatsPlugin = require('stats-webpack-plugin')

  const clientConfig = {
    name: 'client',
    target: 'web',
    entry: {
      main: './src/client.js'
    },
    output: {
      path: config.paths.dist,
      filename: '[name].js',
      chunkFilename: '[name].js',
      publicPath: '/'
    },
    resolve: {
      alias: {
        'config$': path.resolve(config.paths.config, './universal.js')
      }
    },
    // ...
    plugins: config.isProd
      ? [ new StatsPlugin('clientStats.json', { chunkModules: true }) ]
      : []
  }

  const serverConfig = {
    name: 'server',
    target: 'node',
    entry: {
      server: './src/server.js'
    },
    output: {
      path: config.paths.dist,
      publicPath: '/',
      filename: '[name].js',
      libraryTarget: 'commonjs2'
    },
    // ...
    externals: Object.keys(require('./package.json').dependencies),
    plugins: config.isProd
      ? [ new StatsPlugin('serverStats.json', { chunkModules: true }) ]
      : []
  }

  module.exports = [
    clientConfig,
    serverConfig
  ]
  ```

2. Add middleware to `express` app

  ```js
  // app.js

  const config = require('config')
  const express = require('express')
  const webpackApp = require('@exah/webpack-universal-hot-middleware')
  const webpackConfig = require('./webpack.config.js')

  const app = express()

  app.use(webpackApp({
    webpackConfig,
    isDev: config.isDev, // usually `process.env.NODE_ENV !== 'production'`
    isHot: true, // add webpack hot middleware and script to entry?
    outputPath: config.paths.dist, // output of webpack
    clientEntry: 'main',
    serverEntry: 'server',
    clientStatsFileName: 'clientStats.json',
    serverStatsFileName: 'serverStats.json'
  }))

  const server = app.listen(config.port, () =>
    console.log(`> Server started at ${config.siteUrl}`)
  )
  ```


## 🔗 Inside

- [webpack-hot-server-middleware](https://www.npmjs.com/package/webpack-hot-server-middleware) - thanks!
- [friendly-errors-webpack-plugin](https://www.npmjs.com/package/friendly-errors-webpack-plugin)

---

MIT © [John Grishin](http://johngrish.in)
