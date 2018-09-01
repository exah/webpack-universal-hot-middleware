const ms = require('ms')
const path = require('path')
const express = require('express')
const webpack = require('webpack')
const createDevMiddleware = require('webpack-dev-middleware')
const createHotClientMiddleware = require('webpack-hot-middleware')
const FriendlyErrorsPlugin = require('friendly-errors-webpack-plugin')
const getFilenameFromStats = require('./get-filename-from-stats')
const createHotServerMiddleware = require('./hot-server')
const { requireOrCrash } = require('./require')

const findClient = (c) => c.name === 'client'
const findServer = (c) => c.name === 'server'

function webpackHotApp (options = {}) {
  const {
    webpackConfig,
    isDev = false,
    isHot = false,
    outputPath, // COMPAT
    clientStatsFileName = 'clientStats.json',
    serverStatsFileName = 'serverStats.json',
    clientEntry = 'client',
    serverEntry = 'server',
    getServerRendererOptions = (src) => src
  } = options

  const router = express.Router()
  const clientConfig = webpackConfig.find(findClient)
  const serverConfig = webpackConfig.find(findServer)
  const { path: clientOutputPath, publicPath } = clientConfig.output
  const { path: serverOutputPath } = serverConfig.output

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
    const resolveClientDist = (...file) => path.join((outputPath || clientOutputPath), ...file)
    const resolveServerDist = (...file) => path.join((outputPath || serverOutputPath), ...file)

    const clientStatsPath = resolveClientDist(clientStatsFileName)

    const clientStats = requireOrCrash(
      clientStatsPath,
      `Client stats not found at ${clientStatsPath}. Build your app again.`
    )

    const serverStatsPath = resolveServerDist(serverStatsFileName)

    const serverStats = requireOrCrash(
      serverStatsPath,
      `Server stats not found at ${serverStatsPath}. Build your app again.`
    )

    const serverPath = resolveServerDist(getFilenameFromStats(serverStats, serverEntry))

    const serverRender = requireOrCrash(
      serverPath,
      `Server bundle not found at ${serverPath}. Build your app again.`
    )

    router.use(publicPath, express.static(clientOutputPath, { maxAge: ms(isDev ? 0 : '7 days') }))
    router.use(serverRender(Object.assign({}, getServerRendererOptions({ clientStats, serverStats }))))
  }

  return router
}

module.exports = webpackHotApp
