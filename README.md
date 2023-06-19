# Orama SDK

```js
npm i @orama/client
```

```js
import { OramaClient } from '@orama/client'

const client = new OramaClient({
  endpoint: 'https://cloud.orama.run/index/a1s594-my-custom-endpoint',
  api_key: 'CfJ1ZYbkTDNRRcKN5KlZGesdcdAKpJ5R'
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