class Unreachable extends Error {}
class AssertFail extends Error {
    constructor(message) {
        super()
        if (message) {
            this.message = message
        } else {
            this.message = 'Assertion Failed'
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

module.exports = {Unreachable, AssertFail, unreachable, assert}