const toArray = require('./to-array')

const getFilesFromStats = (stats, chunkNames) => {
  const entrypoint = stats.entrypoints[chunkNames] || {}

  const assets = toArray(entrypoint.assets)
    .filter((f) => !/\.hot-update\.js$/.test(f))
    .map((f) => stats.publicPath + f)

  return {
    css: assets.filter((f) => /\.css$/.test(f)),
    js: assets.filter((f) => /\.js$/.test(f))
  }
}

module.exports = getFilesFromStats
