const app = require('./app')
const log = require('artificio-bridge-common/logger')

const port = process.env.API_PORT ? Number(process.env.API_PORT) : 4190;

app.listen(port, () => {
    log.info(`Bridge API started on http://localhost:${port}/`)
});