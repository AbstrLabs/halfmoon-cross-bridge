require('dotenv').config()

import { pause } from './utils'
import {worker} from './worker'

async function main() {
    while(true) {
        let madeProgress = await worker()
        if (!madeProgress) {
            await pause(10 * 1000)
        }
    }
}

main()