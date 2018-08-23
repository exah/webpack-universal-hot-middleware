const ms = require('ms')
const path = require('path')
const express = require('express')
const webpack = require('webpack')
const createDevMiddleware = require('webpack-dev-middleware')
const createHotClientMiddleware = require('webpack-hot-middleware')
const FriendlyErrorsPlugin = require('friendly-errors-webpack-plugin')
const getFileNameFromStats = require('./get-filename-from-stats')
const createHotServerMiddleware = require('./hot-server')
const { requireOrCrash } = require('./require')

const findClient = (c) => c.name === 'client'

function webpackHotApp (options = {}) {
  const {
    webpackConfig,
    outputPath,
    isDev = false,
    isHot = false,
    clientStatsFileName = 'clientStats.json',
    serverStatsFileName = 'serverStats.json',
    clientEntry = 'client',
    serverEntry = 'server',
    getServerRendererOptions = (src) => src
  } = options

  const resolveDist = (...file) => path.join(outputPath, ...file)
  const router = express.Router()
  const clientConfig = webpackConfig.find(findClient)
  const { publicPath } = clientConfig.output

  if (isDev) {
    webpackConfig.forEach(c => (c.bail = false))

    if (isHot) {
      clientConfig.entry[clientEntry] = [
        'webpack-hot-middleware/client'
      ].concat(
        clientConfig.entry[clientEntry]
      )
    }

    const compiler = webpack(webpackConfig)
    const clientCompiler = compiler.compilers.find(findClient)

    if (isHot) {
      clientCompiler.apply(new webpack.HotModuleReplacementPlugin())
    }

    compiler.apply(new FriendlyErrorsPlugin())

    const devMiddleware = createDevMiddleware(compiler, {
      logLevel: 'silent',
      hot: true,
      publicPath,
      serverSideRender: true
    })

    router.use(devMiddleware)

    if (isHot) {
      const hotClientMiddleware = createHotClientMiddleware(clientCompiler, {
        log: false,
        reload: true
      })
      router.use(hotClientMiddleware)
    }

    const hotServerMiddleware = createHotServerMiddleware(compiler, options)

    router.use(hotServerMiddleware)
  } else {
    const clientStatsPath = resolveDist(clientStatsFileName)

    const clientStats = requireOrCrash(
      clientStatsPath,
      `Client stats not found at ${clientStatsPath}. Build your app again.`
    )

    const serverStatsPath = resolveDist(serverStatsFileName)

    const serverStats = requireOrCrash(
      serverStatsPath,
      `Client stats not found at ${serverStatsPath}. Build your app again.`
    )

    const serverPath = resolveDist(getFileNameFromStats(serverStats, serverEntry))

    const serverRender = requireOrCrash(
      serverPath,
      `Server bundle not found at ${serverPath}. Build your app again.`
    )

    router.use(publicPath, express.static(outputPath, { maxAge: ms(isDev ? 0 : '7 days') }))
    router.use(serverRender(Object.assign({}, getServerRendererOptions({ clientStats, serverStats }))))
  }

  return router
}

module.exports = webpackHotApp
