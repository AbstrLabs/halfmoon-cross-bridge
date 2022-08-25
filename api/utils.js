const log = require('artificio-bridge-common/logger')
const {Unreachable, AssertFail, unreachable, assert} = require('artificio-bridge-common/error')

function errorHandler(err, _req, res, _next) {
    log.crit(err)
    if (err instanceof Unreachable) {
        res.status(500).json({msg: 'unreachable'})
    } else if (err instanceof AssertFail) {
        res.status(500).json({msg: err.message})
    } else {
        res.status(500).json({msg: 'internal server error'})
    }
}
module.exports = {Unreachable, AssertFail, unreachable, assert, errorHandler}