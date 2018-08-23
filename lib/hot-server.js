/**
 * Big thanks to @richardscarrott
 * Original: https://github.com/60frames/webpack-hot-server-middleware
 */

const debug = require('debug')('webpack-hot-server-middleware')
const path = require('path')
const requireFromString = require('require-from-string')
const sourceMapSupport = require('source-map-support')
const { getDefaultExport } = require('./require')
const getFileNameFromStats = require('./get-filename-from-stats')

function isMultiCompiler (compiler) {
  return compiler && compiler.compilers
}

function findCompiler (multiCompiler, name) {
  return multiCompiler.compilers.find((c) => c.name === name)
}

function findStats (multiStats, name) {
  return multiStats.stats.find((s) => s.compilation.name === name)
}

function getServerRenderer (filename, buffer, options) {
  const errorMessage = `The 'server' compiler must export a function in the form of \`(options) => (req, res, next) => void\``

  const serverRenderer = getDefaultExport(
    requireFromString(buffer.toString(), filename)
  )

  if (typeof serverRenderer !== 'function') {
    throw new Error(errorMessage)
  }

  const serverRendererRoute = serverRenderer(options)
  if (typeof serverRendererRoute !== 'function') {
    throw new Error(errorMessage)
  }

  return serverRendererRoute
}

function installSourceMapSupport (fs) {
  sourceMapSupport.install({
    // NOTE: If https://github.com/evanw/node-source-map-support/pull/149
    // lands we can be less aggressive and explicitly invalidate the source
    // map cache when Webpack recompiles.
    emptyCacheBetweenOperations: true,
    retrieveFile (source) {
      try {
        return fs.readFileSync(source, 'utf8')
      } catch (ex) {
        // Doesn't exist
      }
    }
  })
}

function createHotServerMiddleware (multiCompiler, options = {}) {
  debug('Using webpack-hot-server-middleware')

  const {
    serverEntry = 'server',
    getServerRendererOptions = (src) => src
  } = options

  if (!isMultiCompiler(multiCompiler)) {
    throw new Error(`Expected webpack compiler to contain both a 'client' and/or 'server' config`)
  }

  const serverCompiler = findCompiler(multiCompiler, 'server')
  const clientCompilers = findCompiler(multiCompiler, 'client')

  if (serverCompiler == null) {
    throw new Error(`Expected a webpack compiler named 'server'`)
  }

  if (clientCompilers == null) {
    debug(`Cannot find webpack compiler named 'client'. Starting without client compiler`)
  }

  const outputFs = serverCompiler.outputFileSystem
  const outputPath = serverCompiler.outputPath

  installSourceMapSupport(outputFs)

  let serverRenderer
  let error = false

  const doneHandler = (multiStats) => {
    error = false

    const webpackServerStats = findStats(multiStats, 'server')

    // Server compilation errors need to be propagated to the client.
    if (webpackServerStats.compilation.errors.length) {
      error = webpackServerStats.compilation.errors[0]
      return
    }

    const serverStats = webpackServerStats.toJson()
    const filename = path.join(outputPath, getFileNameFromStats(serverStats, serverEntry))
    const buffer = outputFs.readFileSync(filename)
    const clientStats = findStats(multiStats, 'client').toJson()

    try {
      serverRenderer = getServerRenderer(
        filename,
        buffer,
        Object.assign({}, getServerRendererOptions({ clientStats, serverStats }))
      )
    } catch (ex) {
      debug(ex)
      error = ex
    }
  }

  multiCompiler.hooks.done.tap('WebpackHotServerMiddleware', doneHandler)

  return function (req, res, next) {
    debug(`Receive request ${req.url}`)

    if (error) {
      return next(error)
    }

    return serverRenderer(req, res, next)
  }
}

module.exports = createHotServerMiddleware
