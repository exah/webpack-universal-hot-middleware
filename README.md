# 👷 webpack-universal-hot-middleware

> Simple universal hot webpack middleware for `development` and `production`


## 🤦‍♂️ Why?

I just want to spend less time on setup new webpack projects. Yes, I now about [Next.js](https://nextjs.org/).


## 📦 Install

```sh
$ yarn add -D @exah/webpack-universal-hot-middleware
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
    name: 'client', // required
    target: 'web',
    entry: {
      main: './src/client.js'
    },
    output: {
      path: config.paths.distClient, // required
      filename: '[name].js',
      chunkFilename: '[name].js',
      publicPath: '/' // required
    },
    resolve: {
      alias: {
        'config$': path.resolve(config.paths.config, './universal.js')
      }
    },
    // ...
    plugins: config.isProd
      ? [ new StatsPlugin('clientStats.json', { chunkModules: true }) ] // required
      : []
  }

  const serverConfig = {
    name: 'server', // required
    target: 'node',
    entry: {
      server: './src/server.js'
    },
    output: {
      path: config.paths.distServer, // required
      publicPath: '/', // same as in client config
      filename: '[name].js',
      libraryTarget: 'commonjs2'
    },
    // ...
    externals: Object.keys(require('./package.json').dependencies),
    plugins: config.isProd
      ? [ new StatsPlugin('serverStats.json', { chunkModules: true }) ] // required
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
    clientEntry: 'main',
    serverEntry: 'server',
    clientStatsFileName: 'clientStats.json',
    serverStatsFileName: 'serverStats.json'
  }))

  const server = app.listen(config.port, () =>
    console.log(`> Server started at ${config.siteUrl}`)
  )
  ```


3. Add `src/client.js`, `src/server.js` (same as in `webpack.config.js`)

  ```js
  // src/client.js
  import React from 'react'
  import ReactDOM from 'react-dom'
  import { BrowserRouter as Router } from 'react-router-dom'
  import App from './app'

  // Render app
  ReactDOM.hydrate((
    <Router>
      <App />
    </Router>
  ), document.getElementById('app'))
  ```

  ```js
  // src/server.js
  import React from 'react'
  import { renderToString } from 'react-dom/server'
  import { StaticRouter as Router } from 'react-router'
  import App from './app'

  // Render app
  export default ({ files }) => (req, res, next) => {
    const appElement = (
      <Router location={req.url}>
        <App />
      </Router>
    )
    
    res.send(html`
      <!DOCTYPE html>
      <html class="no-js">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          ${files.css.map(file => html`<link rel="stylesheet" href="${file}" />`)}
        </head>
        <body>
          <div id="app">${renderToString(appElement)}</div>
          ${files.js.map(file => html`<script src="${file}"></script>`)}
        </body>
      </html>
    `)
  }
  ```



## 🔗 Inside

- [webpack-hot-server-middleware](https://www.npmjs.com/package/webpack-hot-server-middleware) - thanks!
- [friendly-errors-webpack-plugin](https://www.npmjs.com/package/friendly-errors-webpack-plugin)

---

MIT © [John Grishin](http://johngrish.in)
