const fs = require('fs')

function getDefaultExport (obj) {
  return obj && obj.__esModule ? obj.default : obj
}

const requireOrCrash = (file, message) => {
  try {
    fs.accessSync(file)
  } catch (e) {
    throw new Error(message)
  }

  return getDefaultExport(require(file))
}

module.exports = {
  getDefaultExport,
  requireOrCrash
}
