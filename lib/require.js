function getDefaultExport (obj) {
  return obj && obj.__esModule ? obj.default : obj
}

const requireOrCrash = (file, message) => {
  try {
    return getDefaultExport(require(file))
  } catch (e) {
    throw new Error(message)
  }
}

module.exports = {
  getDefaultExport,
  requireOrCrash
}
