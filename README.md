# Orama Cloud Client

```js
npm i @oramacloud/client
```

```js
import { OramaClient } from '@oramacloud/client'

const client = new OramaClient({
  endpoint: '<Your Orama Cloud Endpoint>',
  api_key: '<Your Orama Cloud API Key>'
})

const results = await client.search({
  term: 'red leather shoes',
  where: {
    price: {
      lte: 9.99
    },
    gender: 'unisex'
  },
  limit: 5,
  offset: 1
})
```
