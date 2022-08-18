const log = require('artificio-bridge-common/logger')

class Unreachable extends Error {}
class AssertFail extends Error {
    constructor(message) {
        super()
        if (message) {
            this.message = message
        } else {
            this.message = 'assertion failed'
        }
    }
}

function unreachable() {
    throw new Unreachable()
}

function assert(condition, message) {
    if (!condition) {
        throw new AssertFail(message)
    }
}

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