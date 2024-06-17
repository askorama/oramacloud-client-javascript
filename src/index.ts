export * from './client.js'
export * from './proxy.js'

import { OramaClient } from './client.js'
import { parseSSE } from './utils.js'

const client = new OramaClient({
  endpoint: 'https://cloud.orama.run/v1/indexes/nodejs-org-prod-vo71di',
  api_key: '9A3alsqP5owMUvA4zeHdWrz93yxYZXra'
})

const answerSession = client.createAnswerSession({
  events: {
    onMessageChange: console.log
  }
})

await answerSession.ask({
  term: 'Release schedule'
})
