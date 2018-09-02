const toArray = require('./to-array')

function getFilenameFromStats (stats, chunkName) {
  const filename = stats.assetsByChunkName[chunkName]

  if (filename == null) {
    throw new Error(`Chunk '${chunkName}' not found in stats. Please check your webpack config.`)
  }

  // If source maps are generated `assetsByChunkName.main`
  // will be an array of filenames.
  return toArray(filename).find(asset => /\.js$/.test(asset))
}

module.exports = getFilenameFromStats
